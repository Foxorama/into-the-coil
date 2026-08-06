/**
 * The frame: one clear, then one blit per live entity, interpolated.
 *
 * This is the whole of the per-frame render cost, and
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` counts what it does rather than how
 * long it takes. It allocates nothing, branches on nothing that varies by device, and holds no state.
 *
 * ⚠️ **A painter is never a decision.** Nothing here reads input, advances anything, or chooses what
 * exists — it draws what it is handed. That is what makes a frame reproducible from a screenshot and
 * a scrub bar, and it is the rule `docs/decisions/0015-the-layer-ladder.md` gives the layer.
 */

import type { View } from '../sim/camera.ts';
import type { Entity } from '../sim/entity.ts';
import type { Pool } from '../sim/pool.ts';
import { screenX, screenY, type Surface } from './surface.ts';

/**
 * Draw one frame.
 *
 * `alpha` is the clock's leftover fraction of a step: the entity is drawn `alpha` of the way from
 * where it was at the end of the previous step to where it is now. At `alpha` 0 that is exactly the
 * last simulated position, which is what makes a paused frame and a stepped frame agree.
 *
 * ⚠️ **`layers` is drawn in order, back to front, and the order is the caller's decision rather than
 * an accident of which pool happens to be first.** It used to be one pool, and draw order was
 * whatever the pool's packing produced — which is fine when everything on screen is debris and is
 * wrong the moment the player has to find their own ship in a crowd. `src/sim/pool.ts` already warns
 * that releasing REORDERS, so within a layer nothing may depend on order; between layers, this
 * argument is the whole statement of it.
 *
 * ⚠️ **The array is built once, at mount, and never here.** A `[shots, enemies, ship]` literal at the
 * call site would allocate sixty times a second, which is the one thing
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` scans this file for.
 */
/**
 * One layer of sky: a tile, and how fast it moves against the camera.
 *
 * ── WHY THE SKY IS NOT ENTITIES ─────────────────────────────────────────────────────────────────
 *
 * Asked for in play: *"needs a starry background or a background of some kind."*
 * `docs/decisions/0065-the-sky-is-baked-and-blitted.md`.
 *
 * ⚠️ **`CAPACITY` in `src/app/mount.ts` already totals 0022's 500-entity worst case exactly**, so a
 * starfield made of bodies would either overrun the frame budget or come out of the pools that hold
 * bullets. A tile is one baked bitmap blitted a handful of times — the pipeline 0022 already
 * describes, applied to something the size of the screen.
 *
 * ⚠️ **Built once, at mount, and never here.** A literal at the call site would allocate sixty times
 * a second, which is what `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` scans this
 * file for.
 */
export interface SkyLayer {
  /** The baked tile, as an index into the atlas. */
  sprite: number;
  /** How many world units of tile there are — the tiling period along the scroll axis. */
  extent: number;
  /**
   * How far the layer moves per unit of camera travel. `0` is painted on the glass; `1` is the world.
   *
   * ⚠️ **Strictly below 1, always.** A layer at 1 moves exactly with the world and stops being a
   * background: the player would read it as a field of objects going past at the same rate as the
   * things that can kill them.
   */
  depth: number;
}

/** The sky, back to front. Empty for a scene with none, which is what a fixture has. */
export type Sky = readonly SkyLayer[];

export function paintScene(
  surface: Surface,
  view: View,
  layers: readonly Pool<Entity>[],
  cameraAlong: number,
  alpha: number,
  sky: Sky = NO_SKY,
): void {
  surface.clear();
  paintSky(surface, view, cameraAlong, sky);
  for (let layer = 0; layer < layers.length; layer++) {
    const entities = layers[layer]!;
    const count = entities.size;
    for (let i = 0; i < count; i++) {
      const e = entities.at(i);
      const along = e.prevAlong + (e.along - e.prevAlong) * alpha;
      const across = e.prevAcross + (e.across - e.prevAcross) * alpha;
      const inView = along - cameraAlong;
      surface.blit(e.sprite, screenX(view, inView, across), screenY(view, inView, across), view.scale);
    }
  }
}

/**
 * A scene with no sky. Module-level so the default argument allocates nothing per frame.
 *
 * ⚠️ `[]` written as a default parameter is a fresh array on every call that omits it — sixty times a
 * second, from the one file 0025 scans hardest.
 */
// @setup: one empty array for the lifetime of the module.
const NO_SKY: Sky = [];

/**
 * The sky: each layer's tile, repeated along the scroll axis, offset by the camera and slowed.
 *
 * ⚠️ **A FIXED number of blits, and that is what makes it affordable.** The count is the view's span
 * divided by the tile's, plus one for the tile straddling the trailing edge — three or four per layer
 * on every device the clamp allows. `tests/budget.test.ts` holds that it does not vary with the
 * camera, which is the failure mode a wrapping background actually has: an off-by-one in the modulo
 * draws one extra tile on some frames and none on others, and the seam moves.
 *
 * ⚠️ **The tile is `ACROSS_SPAN` units square**, so it exactly covers the short axis and tiles on the
 * long one only. There is no seam across the lane, on any device — the gutters
 * (`src/sim/camera.ts`) are outside the world and get the space colour.
 *
 * ⚠️ **Nothing allocates.** A modulo, a divide, a ceiling and a loop over numbers.
 */
function paintSky(surface: Surface, view: View, cameraAlong: number, sky: Sky): void {
  for (let i = 0; i < sky.length; i++) {
    const layer = sky[i]!;
    const span = layer.extent;
    if (span <= 0) continue;
    /*
      Where the first tile's leading edge sits, in world units in view. The double modulo is not
      belt-and-braces: `%` in JavaScript keeps the sign of the left operand, so a camera that has ever
      been negative — which it is not today and which `resetScene` could make true tomorrow — would
      put the tiling off the front of the screen and leave a bar of empty space behind it.
    */
    const offset = (((cameraAlong * layer.depth) % span) + span) % span;
    const count = Math.ceil(view.alongSpan / span) + 1;
    for (let t = 0; t < count; t++) {
      // Centred, because `blit` centres — `src/render/surface.ts`. Half a tile on from its edge.
      const inView = t * span - offset + span / 2;
      const across = view.acrossSpan / 2;
      surface.blit(layer.sprite, screenX(view, inView, across), screenY(view, inView, across), view.scale);
    }
  }
}
