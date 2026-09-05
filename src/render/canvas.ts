/**
 * The Canvas2D backend — the only file in the game that knows what a canvas is.
 *
 * `docs/decisions/0022-frame-rate-is-a-feature.md` starts on Canvas2D and keeps a WebGL backend a
 * swap rather than a rewrite. That is true exactly as long as this file stays the only implementation
 * of `Surface` and `Surface` stays three verbs wide — a clear, a blit and a bolt (0233).
 *
 * ⚠️ **This file IS on the hot list.** `blit` runs five hundred times a frame; every line below runs
 * with it.
 */

import type { Atlas } from './bake.ts';
import type { Surface } from './surface.ts';

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
  private boltGlow = '#ffffff';
  private boltCore = '#ffffff';
  private boltDark = '#000000';
  // The enemy's lightning — 0248. Its own glow and core; the dark halo is the same space.
  private hostileGlow = '#ffffff';
  private hostileCore = '#ffffff';

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
   * The two inks a bolt is stroked in — a wide translucent glow and a thin bright core — set with the
   * palette rather than passed per call, on `setSpace`'s terms: a colour is a property of the palette
   * the page is showing, and a string per stroke per frame would be a hash lookup on the hot path.
   */
  setBolt(glow: string, core: string, dark: string, hostileGlow: string, hostileCore: string): void {
    this.boltGlow = glow;
    this.boltCore = core;
    this.boltDark = dark;
    this.hostileGlow = hostileGlow;
    this.hostileCore = hostileCore;
  }

  clear(): void {
    this.ctx.fillStyle = this.space;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  blit(sprite: number, x: number, y: number, scale: number): void {
    const bitmap = this.atlas.bitmaps[sprite];
    if (bitmap === undefined) return;
    const size = this.atlas.extents[sprite]! * scale;
    const half = size / 2;
    this.ctx.drawImage(bitmap, x - half, y - half, size, size);
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
   */
  bolt(points: Float32Array, count: number, width: number, alpha: number, hostile: boolean): void {
    if (count < 1) return;
    const ctx = this.ctx;
    const glow = hostile ? this.hostileGlow : this.boltGlow;
    const core = hostile ? this.hostileCore : this.boltCore;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0]!, points[1]!);
    if (count === 1) ctx.lineTo(points[0]!, points[1]!);
    for (let i = 1; i < count; i++) ctx.lineTo(points[i * 2]!, points[i * 2 + 1]!);
    // The flash and the dark halo wrap the bolt and not its dots: a dot with its own wash is a
    // bead, a dot with its own halo is a dark disc punched in the flash, and the eye reads either as
    // a string of lights rather than as one flash. A dot is its glow and its core.
    if (count > 1) {
      ctx.globalAlpha = alpha * 0.16;
      ctx.strokeStyle = glow;
      ctx.lineWidth = width * 14;
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.5;
      ctx.strokeStyle = this.boltDark;
      ctx.lineWidth = width * 6;
      ctx.stroke();
    }
    ctx.globalAlpha = alpha * 0.4;
    ctx.strokeStyle = glow;
    ctx.lineWidth = width * 4;
    ctx.stroke();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = core;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
