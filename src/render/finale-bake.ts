/**
 * The finale's own art, baked once — `docs/decisions/0418-the-heart-lets-go.md`.
 *
 * ⚠️ **ONLY WHAT NOTHING ELSE DRAWS.** The two ships, their flames and surges, the flash and the trails
 * are the port's (`bakePort`), and the jellyfish, the heart and the sky are the last place's own, in
 * the game's atlas. What is here is what the finale adds: the drips she melts into, the shards the
 * heart bursts into, its glow, and the two cockpits close enough to see who is in them.
 *
 * ⚠️ **COLD, on `port-bake.ts`'s terms**: baked when the finale starts, never in a frame, and on
 * `tests/budget.test.ts`'s cold list. The close-ups are drawn in WORLD UNITS about the sprite's centre.
 */

import type { GolferRow } from '../content/golfers.ts';
import { FINALE_EXTENT, FINALE_KINDS, type FinaleKind } from '../content/finale.ts';
import type { Palette } from '../content/palette.ts';
import { VIPER } from '../content/port.ts';
import { bakeSize, rgba, shade, type Atlas } from './bake.ts';
import { paintPortrait } from './golfer-art.ts';

/**
 * The finale's inks that no palette role means, on `PORT_INK`'s terms: the jellyfish's glass as it runs
 * off the heart, and the heart's own flesh, rose and violet (`drawHeartSeat` in `bake.ts`).
 */
const FINALE_INK = {
  jelly: '#c8384e',
  jellyLit: '#9ad0f0',
  flesh: '#2a0610',
  rose: '#ff5c7a',
  violet: '#a557ff',
  cabin: '#08120e',
  bluePlate: '#12233f',
} as const;

/**
 * Bake the finale's pieces for one palette, at the resolution they will be blitted at, with the golfer
 * found in the Viper and the one who came for them in their cockpits.
 */
export function bakeFinale(palette: Palette, pixelsPerUnit: number, saved: GolferRow, saving: GolferRow): Atlas {
  return {
    view: 'side',
    theme: 'core',
    bitmaps: FINALE_KINDS.map((kind) => bakePiece(kind, palette, pixelsPerUnit, saved, saving)),
    extents: FINALE_KINDS.map((kind) => FINALE_EXTENT[kind]),
    pixelsPerUnit,
  };
}

function bakePiece(kind: FinaleKind, palette: Palette, pixelsPerUnit: number, saved: GolferRow, saving: GolferRow): HTMLCanvasElement {
  const extent = FINALE_EXTENT[kind];
  const size = bakeSize(extent, pixelsPerUnit);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('bakeFinale: no 2D context — this browser cannot run the game');
  ctx.translate(size / 2, size / 2);
  ctx.scale(size / extent, size / extent);
  const h = extent / 2;
  switch (kind) {
    case 'drip':
      paintDrip(ctx, h);
      return canvas;
    case 'shard':
      paintShard(ctx, h);
      return canvas;
    case 'heartGlow': {
      const light = ctx.createRadialGradient(0, 0, 0, 0, 0, h);
      light.addColorStop(0, rgba('#ffffff', 0.85));
      light.addColorStop(0.18, rgba(FINALE_INK.rose, 0.7));
      light.addColorStop(0.55, rgba(FINALE_INK.violet, 0.25));
      light.addColorStop(1, rgba(FINALE_INK.violet, 0));
      ctx.fillStyle = light;
      ctx.fillRect(-h, -h, extent, extent);
      return canvas;
    }
    case 'savedClose':
      paintCockpit(ctx, saved, VIPER.body, VIPER.accent, VIPER.glass, FINALE_INK.cabin, true, 1);
      return canvas;
    case 'savingClose':
      paintCockpit(ctx, saving, palette.player, palette.trim, '#bff2ff', FINALE_INK.bluePlate, false, -1);
      return canvas;
    default: {
      const never: never = kind;
      throw new Error(`bakeFinale: unbaked ${String(never)}`);
    }
  }
}

/** A drop of the jellyfish, running off the heart: a glassy teardrop, lit on its leading edge. */
function paintDrip(ctx: CanvasRenderingContext2D, h: number): void {
  const r = h * 0.55;
  ctx.fillStyle = rgba(FINALE_INK.jelly, 0.85);
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.95);
  ctx.bezierCurveTo(r * 0.35, -h * 0.35, r, h * 0.05, r, h * 0.35);
  ctx.arc(0, h * 0.35, r, 0, Math.PI);
  ctx.bezierCurveTo(-r, h * 0.05, -r * 0.35, -h * 0.35, 0, -h * 0.95);
  ctx.fill();
  ctx.fillStyle = rgba(FINALE_INK.jellyLit, 0.7);
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, h * 0.25, r * 0.22, r * 0.4, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

/** A shard of the heart: a jagged piece of its dark flesh, with its rose light along one torn edge. */
function paintShard(ctx: CanvasRenderingContext2D, h: number): void {
  const at = (x: number, y: number): [number, number] => [x * h, y * h];
  const points = [at(-0.9, -0.2), at(-0.3, -0.85), at(0.35, -0.55), at(0.9, 0.1), at(0.4, 0.8), at(-0.5, 0.55)];
  ctx.fillStyle = FINALE_INK.flesh;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = FINALE_INK.rose;
  ctx.lineWidth = h * 0.16;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(...points[1]!);
  ctx.lineTo(...points[2]!);
  ctx.lineTo(...points[3]!);
  ctx.stroke();
  ctx.strokeStyle = rgba(FINALE_INK.violet, 0.8);
  ctx.lineWidth = h * 0.08;
  ctx.beginPath();
  ctx.moveTo(...points[4]!);
  ctx.lineTo(...points[5]!);
  ctx.stroke();
}

/**
 * A cockpit, close: the top of the hull, the cabin, the golfer in it, and the canopy glass over them —
 * so the player can see who is inside. `scaled` is the Viper's, which wears scales down its back; the
 * fighter's is plated. The golfer is their select-screen portrait (`paintPortrait`), which is the face
 * the player has already met.
 */
function paintCockpit(
  ctx: CanvasRenderingContext2D,
  golfer: GolferRow,
  hull: string,
  trim: string,
  glass: string,
  cabin: string,
  scaled: boolean,
  inner: 1 | -1,
): void {
  /*
    The hull's top, across the whole bottom of the box and rising into the canopy's seat — lit from
    above and falling into shadow, because a flat slab of the hull's colour read as a panel rather than
    a ship in the first photograph. Edge to edge, so it runs off the screen's side.
  */
  /*
    ⚠️ **FLAT TO THE OUTER EDGE, ROUNDING DOWN ON THE INNER ONE.** The outer side runs off the screen;
    the inner side is in the middle of the picture, and the first photograph had the hull stopping
    there in a hard vertical cut — the edge of its box. `inner` is which way the middle of the screen
    is: the Viper stands at the near side and the fighter at the far one.
  */
  const s = inner;
  const body = ctx.createLinearGradient(0, 18, 0, 62);
  body.addColorStop(0, shade(hull, 0.08));
  body.addColorStop(0.35, hull);
  body.addColorStop(1, shade(hull, -0.55));
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-62 * s, 62);
  ctx.lineTo(-62 * s, 32);
  ctx.quadraticCurveTo(-30 * s, 18, 0, 18);
  ctx.quadraticCurveTo(34 * s, 18, 48 * s, 32);
  ctx.quadraticCurveTo(58 * s, 44, 60 * s, 62);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = shade(hull, 0.4);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-62 * s, 33);
  ctx.quadraticCurveTo(-30 * s, 19, 0, 19);
  ctx.quadraticCurveTo(33 * s, 19, 47 * s, 33);
  ctx.quadraticCurveTo(56 * s, 44, 58 * s, 62);
  ctx.stroke();
  // Down the back: the Viper's scales, or the fighter's plating.
  ctx.strokeStyle = trim;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const x = (-56 + i * 15) * s;
    ctx.beginPath();
    if (scaled) {
      ctx.moveTo(x - 5, 40);
      ctx.lineTo(x, 34);
      ctx.lineTo(x + 5, 40);
    } else {
      ctx.moveTo(x - 6, 42);
      ctx.lineTo(x + 6, 42);
    }
    ctx.stroke();
  }
  // The cabin: dark, a headrest behind the seat, and the golfer in it.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 20, 40, 38, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = cabin;
  ctx.fillRect(-42, -20, 84, 42);
  // The headrest: lighter than the cabin, so a dark head of hair has something to stand out against.
  ctx.fillStyle = shade(cabin, 0.45);
  ctx.beginPath();
  ctx.ellipse(0, 6, 22, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(-26, -18);
  paintPortrait(ctx, golfer, 52);
  ctx.restore();
  // The glass over them: a light tint — heavier, and it turned the face the glass's colour — a lit rim,
  // and two highlights across the curve.
  ctx.fillStyle = rgba(glass, 0.08);
  ctx.beginPath();
  ctx.ellipse(0, 20, 40, 38, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = trim;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.strokeStyle = rgba('#ffffff', 0.55);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 20, 33, 31, 0, Math.PI * 1.12, Math.PI * 1.34);
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 20, 33, 31, 0, Math.PI * 1.4, Math.PI * 1.47);
  ctx.stroke();
}
