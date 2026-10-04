/**
 * The Canvas2D backend — the only file in the game that knows what a canvas is.
 *
 * `docs/decisions/0022-frame-rate-is-a-feature.md` starts on Canvas2D and keeps a WebGL backend a
 * swap rather than a rewrite. That is true exactly as long as this file stays the only implementation
 * of `Surface` and `Surface` stays three verbs wide — a clear, a blit and a bolt (0233). A blit may
 * be turned since 0306, and it is still a blit.
 *
 * ⚠️ **This file IS on the hot list.** `blit` runs five hundred times a frame; every line below runs
 * with it.
 */

import type { Atlas } from './bake.ts';
import type { Surface } from './surface.ts';

/**
 * A bolt's two WIDE strokes — the bloom and the flash, added under everything — as multiples of the
 * core's width and shares of its alpha — 0458. `src/render/bolt-inks.ts` holds them under a flash
 * and says how; they are here because this is the file that strokes them, and that one may reach the
 * baker where this one may not.
 */
export const BOLT_BLOOM_WIDTH = 22;
export const BOLT_BLOOM_ALPHA = 0.5;
export const BOLT_FLASH_WIDTH = 9;
export const BOLT_FLASH_ALPHA = 0.7;

/** What a bolt is stroked in: a glow, its hot inner shade, a core, and how much of the wide strokes it may keep. */
export interface BoltInk {
  readonly glow: string;
  readonly hot: string;
  readonly core: string;
  /** The share of the wide strokes' alpha this ink may keep — `wideScale` in `bolt-inks.ts`. */
  readonly wide: number;
}

/** The player's bolt and the enemy's, and the dark halo they share. */
export interface BoltInks {
  readonly player: BoltInk;
  readonly hostile: BoltInk;
  readonly dark: string;
}

const UNSET: BoltInk = { glow: '#ffffff', hot: '#ffffff', core: '#ffffff', wide: 0 };

/**
 * The device-pixel-ratio ceiling, per 0022.
 *
 * At DPR 3 a 1080p phone renders ~2.6M pixels a frame; the cap drops it to ~1.15M for a difference
 * invisible on baked bitmaps. It is the largest single lever on the target device and costs desktop
 * nothing — DPR 2 *is* full quality on a Retina display, and an ordinary monitor never reaches it.
 */
export const MAX_DPR = 2;

/** The device pixel ratio to actually render at. */
export function renderScale(devicePixelRatio: number): number {
  if (!Number.isFinite(devicePixelRatio) || devicePixelRatio <= 0) return 1;
  return Math.min(devicePixelRatio, MAX_DPR);
}

export class CanvasSurface implements Surface {
  private atlas: Atlas;
  private width = 0;
  private height = 0;
  private space = '#000000';
  private boltInk = UNSET;
  // The enemy's lightning — 0248. Its own inks; the dark halo is the same space.
  private hostileInk = UNSET;
  private boltDark = '#000000';

  constructor(private readonly ctx: CanvasRenderingContext2D, atlas: Atlas) {
    this.atlas = atlas;
  }

  /** Swap in a re-baked atlas — on rotation, or on a palette change. Never during a frame. */
  setAtlas(atlas: Atlas): void {
    this.atlas = atlas;
  }

  /** The drawing surface's size in CSS pixels, and the colour behind everything. */
  setSize(width: number, height: number, space: string): void {
    this.width = width;
    this.height = height;
    this.space = space;
  }

  /**
   * Change the backdrop without touching the size — what a level's THEME does.
   *
   * ⚠️ **`docs/decisions/0107-a-level-is-a-place.md`, and it costs one property write.** The clear
   * colour is a field rather than baked into anything, so a place is the cheapest visual change the
   * engine has: no re-bake, no allocation, and nothing that could hitch at a level boundary
   * `docs/decisions/0076-a-level-has-an-origin.md` says keeps the scene.
   *
   * ⚠️ **NOT on the `Surface` interface**, which is deliberately *clear, blit and bolt* and nothing
   * else — `src/render/surface.ts` has the argument. This is the canvas backend's own, exactly as
   * `setSize` and `setAtlas` are.
   */
  setSpace(space: string): void {
    this.space = space;
  }

  /**
   * The inks a bolt is stroked in — set with the palette rather than passed per call, on
   * `setSpace`'s terms: a colour is a property of the palette the page is showing, and a string per
   * stroke per frame would be a hash lookup on the hot path. Solved by `boltInks` (0458), once.
   */
  setBolt(inks: BoltInks): void {
    this.boltInk = inks.player;
    this.hostileInk = inks.hostile;
    this.boltDark = inks.dark;
  }

  clear(): void {
    this.ctx.fillStyle = this.space;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  blit(sprite: number, x: number, y: number, scale: number, turn = 0, alpha = 1): void {
    const bitmap = this.atlas.bitmaps[sprite];
    if (bitmap === undefined || alpha <= 0) return;
    const size = this.atlas.extents[sprite]! * scale;
    const half = size / 2;
    /*
      ⚠️ **A LIGHT IS ADDED, NOT LAID OVER — `docs/decisions/0458-light-is-added.md`.** The same one
      draw with the context's composite set round it and put back, on 0401's terms for alpha: what the
      kind is decides it (`LIGHT_KINDS`), the atlas carries it, and nothing here allocates.
    */
    const light = this.atlas.light !== undefined && this.atlas.light[sprite] === true;
    if (light) this.ctx.globalCompositeOperation = 'lighter';
    // 0401: a faded blit is the same one draw with the context's alpha set round it, and put back.
    if (alpha < 1) this.ctx.globalAlpha = alpha;
    if (turn === 0) {
      this.ctx.drawImage(bitmap, x - half, y - half, size, size);
      if (alpha < 1) this.ctx.globalAlpha = 1;
      if (light) this.ctx.globalCompositeOperation = 'source-over';
      return;
    }
    /*
      ⚠️ **TURNED ABOUT ITS OWN CENTRE, AND THE TRANSFORM IS PUT BACK EXACTLY — 0306.** `save` and
      `restore` rather than a rotate and an un-rotate, because the second leaves float error in the
      context's matrix a few hundred times a second and the whole frame would creep. Nothing here
      allocates: both are calls on the context's own state stack.
    */
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(turn);
    ctx.drawImage(bitmap, -half, -half, size, size);
    ctx.restore();
    if (alpha < 1) ctx.globalAlpha = 1;
    if (light) ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * One bolt: the same polyline stroked three times — a dark halo, a wide faint glow, a thin bright
   * core. A single point is a dot: the round cap does the drawing.
   *
   * ⚠️ **THREE STROKES AND NO `shadowBlur`.** A canvas shadow is a per-draw Gaussian over the path's
   * bounding box, which is the one Canvas2D call that is genuinely expensive and the one this
   * backend must never make sixty times a second. Translucent wide strokes under a thin opaque one
   * are what a glow looks like at the size a bolt is drawn, and they cost three path strokes.
   *
   * ⚠️ **THE DARK HALO IS THE FIRST PLAY-TEST'S — 0236.** *"It needs some bright points and a bit of
   * a darker glow around it."* A bolt over a busy sky had nothing to stand against; the halo is the
   * space colour at half alpha, twice the glow's width, and it is what gives the glow an edge.
   *
   * ⚠️ **THE FLASH IS THE SECOND'S — 0238.** *"Lightning needs more glow around the edges, not
   * specific details but more like the lightning flash."* A fourth stroke, first and under the
   * others: the glow ink at a sixth of the alpha and fourteen times the core's width — a wash of
   * light round the whole bolt that fades with it, which is what a flash is. Still no `shadowBlur`,
   * and still one path: four strokes of the same polyline.
   *
   * ⚠️ **Nothing here allocates**: `beginPath`, `moveTo`, `lineTo` and `stroke` write into the
   * context's own path, and the points are the caller's buffer.
   *
   * ── AND IT IS LIGHT, ADDED — `docs/decisions/0458-light-is-added.md` ──────────────────────────
   *
   * *"Can we make the game flashy and vibrant? In particular for lightning."* Every stroke but the
   * dark halo is ADDED to what is under it now, so a bolt brightens the sky it crosses, two bolts
   * burn white where they cross, and the glow is the ink at full saturation rather than a veil of it.
   * A bloom wider than the old flash goes under everything, and a hot inner glow — the ink taken
   * halfway to white — sits between the glow and the core, so the bolt runs white at its heart, ink
   * at its edge and ink-coloured light round that. Six strokes of one path, still no `shadowBlur`.
   *
   * ⚠️ **THE CAP IS WHAT A STROKE IS NOT.** 0374's argument — thin strokes, not a change in the
   * screen's brightness — is measured now (`scripts/weigh-flashes.mjs`, 0457), and the bloom's width
   * and alpha were set against it rather than against taste.
   */
  bolt(points: Float32Array, count: number, width: number, alpha: number, hostile: boolean): void {
    if (count < 1) return;
    const ctx = this.ctx;
    const ink = hostile ? this.hostileInk : this.boltInk;
    const glow = ink.glow;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0]!, points[1]!);
    if (count === 1) ctx.lineTo(points[0]!, points[1]!);
    for (let i = 1; i < count; i++) ctx.lineTo(points[i * 2]!, points[i * 2 + 1]!);
    // The bloom, the flash and the dark halo wrap the bolt and not its dots: a dot with its own wash
    // is a bead, a dot with its own halo is a dark disc punched in the flash, and the eye reads either
    // as a string of lights rather than as one flash. A dot is its glow and its core.
    if (count > 1) {
      const wide = alpha * ink.wide;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = wide * BOLT_BLOOM_ALPHA;
      ctx.strokeStyle = glow;
      ctx.lineWidth = width * BOLT_BLOOM_WIDTH;
      ctx.stroke();
      ctx.globalAlpha = wide * BOLT_FLASH_ALPHA;
      ctx.lineWidth = width * BOLT_FLASH_WIDTH;
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = alpha * 0.5;
      ctx.strokeStyle = this.boltDark;
      ctx.lineWidth = width * 6;
      ctx.stroke();
    }
    /*
      ⚠️ **THE GLOW IS STILL FOUR TIMES THE CORE, AND A BEAM DEPENDS ON IT.** `paintBolts` strokes a
      hostile beam at a quarter of its hurt width so that THIS edge — the bright one, against the dark
      halo — is exactly where it hurts (`src/render/scene.ts`). Everything wider is bloom, under the
      halo's edge and a fraction of the light.
    */
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.75;
    ctx.strokeStyle = glow;
    ctx.lineWidth = width * 4;
    ctx.stroke();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = ink.hot;
    ctx.lineWidth = width * 1.8;
    ctx.stroke();
    ctx.strokeStyle = ink.core;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}
