/**
 * Baking — every sprite drawn once, at load, into an offscreen bitmap.
 *
 * `docs/decisions/0022-frame-rate-is-a-feature.md`: art is a pure function of
 * `(kind, variant, palette, view)`, drawn once and blitted thereafter. Per-frame path filling is
 * banned. This is both halves of the procedural-versus-sprites argument at once — no asset files, so
 * `docs/decisions/0003-single-file-build.md` survives; a blit per entity, so the frame cost is a
 * sprite's; and the art is still a function of the palette, which is what makes 0024's high-contrast
 * and colour-blind palettes a re-bake rather than a second art pass.
 *
 * ⚠️ **The shapes here are placeholders. The pipeline is not.** `view` is a real argument and the
 * seam it opens is real — `docs/game.md` calls two views per entity the single largest art cost in
 * the project. What is temporary is that these particular shapes are rotations of one another; a
 * real side profile and a real top-down are different drawings, and the day they arrive nothing
 * outside this file changes.
 *
 * ⚠️ **This file is NOT on the hot list, and must never be called from a frame.** It allocates
 * freely, because it runs at load and on rotation. `src/app/frame.ts` is the file that runs every
 * frame, and it cannot reach this.
 */

import type { Palette } from '../content/palette.ts';

/** What can be drawn. Closed, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. */
export type SpriteKind = 'ship' | 'enemy' | 'bullet' | 'pickup';

/** Baking order, and therefore the blit index. Explicit, never derived from the table. */
export const SPRITE_KINDS: readonly SpriteKind[] = ['ship', 'enemy', 'bullet', 'pickup'];

/** The index a painter blits by. A number, because this is read five hundred times a frame. */
export const SPRITE: Record<SpriteKind, number> = { ship: 0, enemy: 1, bullet: 2, pickup: 3 };

/** How big each kind is, in WORLD units across — so its screen size falls out of the camera. */
export const SPRITE_EXTENT: Record<SpriteKind, number> = { ship: 7, enemy: 5.5, bullet: 1.8, pickup: 3.5 };

/** Side profile for a horizontally scrolling screen, top-down for a vertical one. */
export type SpriteView = 'side' | 'top';

export interface Atlas {
  readonly view: SpriteView;
  /** Baked bitmaps, indexed by `SPRITE`. */
  readonly bitmaps: readonly CanvasImageSource[];
  /** World extent per bitmap, in the same order. */
  readonly extents: readonly number[];
  /** The resolution it was baked at, so staleness is a question with an answer. */
  readonly pixelsPerUnit: number;
}

/** Which view a viewport wants: side profile when it scrolls across `x`, top-down when down `y`. */
export function viewFor(alongAxis: 'x' | 'y'): SpriteView {
  return alongAxis === 'x' ? 'side' : 'top';
}

/**
 * Whether an atlas has to be thrown away and re-baked.
 *
 * Pure, and separated from the baking so it can be proved without a browser — the two cases it has
 * to get right are a rotation (always re-bake, the art faces the wrong way) and a resize (re-bake
 * only when the resolution has moved enough to see, or every window drag re-bakes the whole atlas).
 *
 * The threshold is a quarter. Below that the difference is a bitmap scaled by up to 25%, which on
 * these shapes is invisible; above it, edges start to look soft.
 */
export function atlasIsStale(atlas: Atlas, view: SpriteView, pixelsPerUnit: number): boolean {
  if (atlas.view !== view) return true;
  if (!Number.isFinite(pixelsPerUnit) || pixelsPerUnit <= 0) return false;
  return Math.abs(pixelsPerUnit - atlas.pixelsPerUnit) > atlas.pixelsPerUnit * 0.25;
}

/** Which ink each kind is drawn in. A role, never a colour — see `content/palette.ts`. */
const INK_OF: Record<SpriteKind, keyof Palette> = {
  ship: 'player',
  enemy: 'enemy',
  bullet: 'bullet',
  pickup: 'pickup',
};

/**
 * Draw one kind into a square canvas, pointing along +x, filling most of it.
 *
 * Everything is expressed as a fraction of `size` so a bake at any resolution is the same picture —
 * which is what lets the atlas be re-baked larger on a high-DPI screen without a second set of art.
 */
function drawKind(ctx: CanvasRenderingContext2D, kind: SpriteKind, palette: Palette, size: number): void {
  const half = size / 2;
  const r = size * 0.42;
  ctx.fillStyle = palette[INK_OF[kind]];
  ctx.strokeStyle = palette.space;
  ctx.lineWidth = Math.max(1, size * 0.04);
  ctx.beginPath();
  switch (kind) {
    case 'ship':
      // A wedge, nose towards +x.
      ctx.moveTo(half + r, half);
      ctx.lineTo(half - r * 0.7, half - r * 0.8);
      ctx.lineTo(half - r * 0.3, half);
      ctx.lineTo(half - r * 0.7, half + r * 0.8);
      ctx.closePath();
      break;
    case 'enemy':
      // A diamond, so it reads as a different SHAPE and not only a different colour — 0024's
      // "colour never carries meaning alone", at the one place it can be applied today.
      ctx.moveTo(half - r, half);
      ctx.lineTo(half, half - r);
      ctx.lineTo(half + r, half);
      ctx.lineTo(half, half + r);
      ctx.closePath();
      break;
    case 'bullet':
      ctx.arc(half, half, r * 0.8, 0, Math.PI * 2);
      break;
    case 'pickup':
      // A square with a hole: distinct in silhouette from both the diamond and the disc.
      ctx.rect(half - r * 0.8, half - r * 0.8, r * 1.6, r * 1.6);
      ctx.rect(half - r * 0.25, half - r * 0.25, r * 0.5, r * 0.5);
      break;
    default: {
      const never: never = kind;
      throw new Error(`unbaked sprite kind: ${String(never)}`);
    }
  }
  ctx.fill('evenodd');
  ctx.stroke();
}

/**
 * Bake every sprite for one palette and one view.
 *
 * `pixelsPerUnit` is CSS pixels per world unit times the device pixel ratio — the resolution the
 * bitmaps will actually be blitted at. Baking below it is a blurry game; baking far above it is
 * memory spent on detail nobody will see.
 */
export function bakeAtlas(palette: Palette, view: SpriteView, pixelsPerUnit: number): Atlas {
  const bitmaps: CanvasImageSource[] = [];
  const extents: number[] = [];
  for (const kind of SPRITE_KINDS) {
    const extent = SPRITE_EXTENT[kind];
    // Clamped so a zero-sized viewport or an absurd DPI cannot ask for a 0px or a 4096px sprite.
    const size = Math.max(8, Math.min(256, Math.ceil(extent * pixelsPerUnit)));
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error('bakeAtlas: no 2D context — this browser cannot run the game');
    if (view === 'top') {
      // Point the shape at -y instead of +x. Placeholder-only: real top-down art is its own drawing.
      ctx.translate(size / 2, size / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.translate(-size / 2, -size / 2);
    }
    drawKind(ctx, kind, palette, size);
    bitmaps.push(canvas);
    extents.push(extent);
  }
  return { view, bitmaps, extents, pixelsPerUnit };
}
