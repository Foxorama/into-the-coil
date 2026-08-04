/**
 * What lives in a pool, and the fixed step that moves it.
 *
 * Deliberately thin. This is the shape the frame budget in
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` is measured against, and the seam
 * the real ships, bullets and enemies will grow from — not the game's model of them.
 *
 * ⚠️ **Two positions per entity, and both are load-bearing.** The renderer draws between `prev` and
 * the current position by the clock's `alpha`, which is what lets a 144Hz display show 144 distinct
 * frames off a 60Hz simulation. An entity that forgets to carry `prev` forward judders, and it
 * judders only on displays that are not exactly 60Hz — so it looks fine on the machine it was
 * written on.
 */

import { cullAlong } from './camera.ts';
import type { Pool } from './pool.ts';

export interface Entity {
  /** Position along the scroll axis, in world units. */
  along: number;
  /** Position across it, in world units. `0` to `ACROSS_SPAN`. */
  across: number;
  /** Where it was at the end of the previous step. The renderer interpolates from here. */
  prevAlong: number;
  prevAcross: number;
  /** World units per step. */
  velAlong: number;
  velAcross: number;
  /** Which baked bitmap to blit. An index, never a string — this is read 500 times a frame. */
  sprite: number;
}

/** A blank entity. Called only while a pool is being constructed. */
export function makeEntity(): Entity {
  // @setup: entities are built when the pool is constructed, never during a frame.
  return { along: 0, across: 0, prevAlong: 0, prevAcross: 0, velAlong: 0, velAcross: 0, sprite: 0 };
}

/** Put a recycled slot into a known state. Every field, because `spawn` hands back an old occupant. */
export function reset(e: Entity, along: number, across: number, sprite: number): void {
  e.along = along;
  e.across = across;
  e.prevAlong = along;
  e.prevAcross = across;
  e.velAlong = 0;
  e.velAcross = 0;
  e.sprite = sprite;
}

/**
 * One fixed step over a pool: carry the current position into `prev`, integrate, retire anything
 * that has fallen behind the camera.
 *
 * Iterates BACKWARDS because `releaseAt` swaps the last live item into the freed slot — forwards,
 * every release skips an entity, which shows up as a bullet that lives one frame too long.
 */
export function stepEntities(pool: Pool<Entity>, cameraAlong: number): void {
  const cull = cullAlong(cameraAlong);
  for (let i = pool.size - 1; i >= 0; i--) {
    const e = pool.at(i);
    e.prevAlong = e.along;
    e.prevAcross = e.across;
    e.along += e.velAlong;
    e.across += e.velAcross;
    if (e.along < cull) pool.releaseAt(i);
  }
}
