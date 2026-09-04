/**
 * The painter seam, and the world-to-screen projection behind it.
 *
 * `docs/decisions/0022-frame-rate-is-a-feature.md` starts on Canvas2D and keeps a WebGL backend a
 * swap rather than a rewrite. This interface is what makes that true: **model and state in, pixels
 * out**, and the verbs are a blit and a bolt. A backend that can clear, blit and stroke a polyline
 * is a backend.
 *
 * ⚠️ **`blit` is the unit the frame budget is counted in**, so the interface must not grow a verb
 * that hides work. A `drawPolygon` here would be a per-frame path fill wearing an interface, and the
 * counting guard would report one call for it — see 0025.
 *
 * ── AND `bolt` IS THE ONE VERB THAT IS NOT A BITMAP, COUNTED ON ITS OWN ─────────────────────────
 *
 * `docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md`. Chain lightning is a line between
 * two points the model chose on the step it fired, jagged differently on every frame — a shape that
 * is not known until the frame it is drawn on, which is the one thing a bake cannot hold. The
 * paragraph above refuses a polygon because it would HIDE work behind a blit's count; a bolt is
 * counted as a bolt, and `tests/budget.test.ts` counts it beside the blits rather than inside them.
 * It is a stroke of a dozen vertices, not a fill, and it allocates nothing: the vertices arrive in a
 * typed array the scene owns.
 */

import { type View } from '../sim/camera.ts';

export interface Surface {
  /** Wipe the frame. Once per frame, before anything else. */
  clear(): void;
  /**
   * Draw one baked bitmap, centred on `(x, y)` in CSS pixels.
   *
   * `sprite` is an index into the baked atlas — a number rather than a name, because this is read
   * five hundred times a frame and a string key is a hash lookup each time.
   */
  blit(sprite: number, x: number, y: number, scale: number): void;
  /**
   * Stroke a polyline through the first `count` points of `points` — `x0, y0, x1, y1, …` in CSS
   * pixels — `width` pixels wide at `alpha`, in the bolt ink the backend was given. A `count` of
   * one is a dot of that width: the bright points on a bolt (0236).
   *
   * ⚠️ **The points are the caller's buffer and are read before this returns**, never kept. A
   * backend that wanted to keep them would be allocating per frame, which is the thing the seam
   * exists to prevent.
   */
  bolt(points: Float32Array, count: number, width: number, alpha: number): void;
}

/**
 * The horizontal screen position, in CSS pixels, of a point in the camera's window.
 *
 * `alongInView` is measured from the camera's trailing edge, not in absolute world coordinates — the
 * caller subtracts the camera position, because the camera moves every step and the projection does
 * not need to know that.
 *
 * ⚠️ **Two functions returning numbers rather than one returning a point.** A point would be an
 * object allocated per entity per frame — five hundred of them, sixty times a second, which is the
 * allocation 0022 bans. Neither is there a shared mutable out-parameter, which would be the same
 * cost paid in hidden state instead.
 */
export function screenX(view: View, alongInView: number, across: number): number {
  return view.alongAxis === 'x'
    ? view.gutterAlong + alongInView * view.scale
    : view.gutterAcross + across * view.scale;
}

/**
 * The vertical screen position, in CSS pixels, of the same point.
 *
 * ⚠️ **Portrait counts DOWN, and this is decision 0023's handedness rule made executable.** `along`
 * runs up the screen in portrait, so the leading edge — where the level is arriving from — is the
 * TOP, and `alongInView: 0` is the bottom. Get the sign wrong and the game scrolls backwards in
 * portrait only, on a device the developer is not holding.
 *
 * The viewport's long dimension is `alongSpan * scale + 2 * gutterAlong`, so nothing extra has to be
 * passed in to find the far edge.
 */
export function screenY(view: View, alongInView: number, across: number): number {
  return view.alongAxis === 'x'
    ? view.gutterAcross + across * view.scale
    : view.gutterAlong + (view.alongSpan - alongInView) * view.scale;
}
