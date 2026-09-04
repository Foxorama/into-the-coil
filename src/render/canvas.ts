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
  setBolt(glow: string, core: string): void {
    this.boltGlow = glow;
    this.boltCore = core;
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
   * One bolt: the same polyline stroked twice, wide and faint under thin and bright.
   *
   * ⚠️ **TWO STROKES AND NO `shadowBlur`.** A canvas shadow is a per-draw Gaussian over the path's
   * bounding box, which is the one Canvas2D call that is genuinely expensive and the one this
   * backend must never make sixty times a second. A translucent wide stroke under a thin opaque one
   * is what a glow looks like at the size a bolt is drawn, and it costs two path strokes.
   *
   * ⚠️ **Nothing here allocates**: `beginPath`, `moveTo`, `lineTo` and `stroke` write into the
   * context's own path, and the points are the caller's buffer.
   */
  bolt(points: Float32Array, count: number, width: number, alpha: number): void {
    if (count < 2) return;
    const ctx = this.ctx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0]!, points[1]!);
    for (let i = 1; i < count; i++) ctx.lineTo(points[i * 2]!, points[i * 2 + 1]!);
    ctx.globalAlpha = alpha * 0.35;
    ctx.strokeStyle = this.boltGlow;
    ctx.lineWidth = width * 3;
    ctx.stroke();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.boltCore;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
