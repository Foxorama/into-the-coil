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
 */
export function paintScene(
  surface: Surface,
  view: View,
  entities: Pool<Entity>,
  cameraAlong: number,
  alpha: number,
): void {
  surface.clear();
  const count = entities.size;
  for (let i = 0; i < count; i++) {
    const e = entities.at(i);
    const along = e.prevAlong + (e.along - e.prevAlong) * alpha;
    const across = e.prevAcross + (e.across - e.prevAcross) * alpha;
    const inView = along - cameraAlong;
    surface.blit(e.sprite, screenX(view, inView, across), screenY(view, inView, across), view.scale);
  }
}
