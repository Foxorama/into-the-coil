/**
 * The Canvas2D backend — the only file in the game that knows what a canvas is.
 *
 * `docs/decisions/0022-frame-rate-is-a-feature.md` starts on Canvas2D and keeps a WebGL backend a
 * swap rather than a rewrite. That is true exactly as long as this file stays the only implementation
 * of `Surface` and `Surface` stays two verbs wide.
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
   * ⚠️ **NOT on the `Surface` interface**, which is deliberately *clear and blit* and nothing else —
   * `src/render/surface.ts` has the argument. This is the canvas backend's own, exactly as `setSize`
   * and `setAtlas` are.
   */
  setSpace(space: string): void {
    this.space = space;
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
}
