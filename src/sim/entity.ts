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
 *
 * ── WHY AN ENTITY CARRIES ITS OWN NUMBERS ───────────────────────────────────────────────────────
 *
 * `docs/decisions/0015-the-layer-ladder.md` gives `sim/` exactly one import, `brand`. So nothing
 * here — and nothing in `collide.ts` — can read the enemy and shot tables in `src/content/`. The
 * numbers a collision needs travel ON the entity, copied in at spawn from a row by whoever spawns it.
 * See `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md`; the tempting fix when
 * this bites is to widen the layer arrow, which 0015 exists to refuse.
 */

import { cullAlong, cullLeadingAlong } from './camera.ts';
import type { Pool } from './pool.ts';

/**
 * The part of an entity that comes from a table rather than from play.
 *
 * Declared here, in `sim/`, and *implemented* by the rows in `src/content/` — the arrow points that
 * way round, so the model states the contract and the content satisfies it. It is also what keeps
 * `reset` to four arguments instead of seven, and a row is a constant object, so passing one costs
 * no allocation in a frame.
 */
export interface Body {
  /** Which baked bitmap to blit. An index, never a string — this is read 500 times a frame. */
  sprite: number;
  /**
   * Hurtbox radius, in world units.
   *
   * ⚠️ **A circle, and that is the camera's doing rather than a simplification.** `View.scale` is one
   * number for both axes (0023), so a radius means the same distance whichever way it is measured, on
   * every device and in both orientations. A box would have to be authored in an axis, and the axes
   * swap when the screen rotates.
   */
  radius: number;
  /** Hits it survives. A shot has 1: it is spent by arriving. */
  health: number;
  /** What it takes off whatever it hits. */
  damage: number;
}

export interface Entity extends Body {
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
  /**
   * Steps of invulnerability remaining. Counted down by `stepEntities`, read by `collide`.
   *
   * ⚠️ **Without it, health is not a number of hits — it is a number of STEPS.** A volley overlapping
   * the ship deals its damage sixty times a second, so three health is gone in three sixtieths of a
   * second and the player never sees the second or third hit happen. That reads as an instant death
   * from full health, which is a bug report about collision and is really this field missing.
   */
  invulnFor: number;
  /**
   * Which row this was spawned from, as an index into a list the COMPOSER owns.
   *
   * ⚠️ **Opaque here, on purpose.** `sim/` may import `brand` and nothing else (0015), so nothing in
   * this layer can look a kind up — which is exactly right: the model moves bodies and resolves
   * contacts, and what an enemy *decides* is content's business. `src/app/frame.ts` holds the row
   * array this indexes into, built once at boot so a per-step lookup is an array index rather than a
   * string key.
   */
  kind: number;
  /**
   * Steps until this entity next fires. Owned by whoever fires it, not by `stepEntities`.
   *
   * Per-entity rather than a global cadence so that two enemies spawned three seconds apart do not
   * shoot in lockstep — a volley the player can learn as one rhythm is a different game from a
   * scattering they have to read.
   */
  fireIn: number;
}

/** A blank entity. Called only while a pool is being constructed. */
export function makeEntity(): Entity {
  // @setup: entities are built when the pool is constructed, never during a frame.
  return {
    along: 0,
    across: 0,
    prevAlong: 0,
    prevAcross: 0,
    velAlong: 0,
    velAcross: 0,
    sprite: 0,
    radius: 0,
    health: 0,
    damage: 0,
    invulnFor: 0,
    kind: 0,
    fireIn: 0,
  };
}

/**
 * Put a recycled slot into a known state. Every field, because `spawn` hands back an old occupant.
 *
 * ⚠️ The `body` is COPIED rather than referenced. A row is shared by every entity of its kind, so an
 * entity holding the row and then taking damage would take it off the kind — every enemy of that type
 * dying at once, and the table itself left wrong for the rest of the run.
 */
export function reset(e: Entity, along: number, across: number, body: Body, kind = 0): void {
  e.along = along;
  e.across = across;
  e.prevAlong = along;
  e.prevAcross = across;
  e.velAlong = 0;
  e.velAcross = 0;
  e.sprite = body.sprite;
  e.radius = body.radius;
  e.health = body.health;
  e.damage = body.damage;
  e.invulnFor = 0;
  e.kind = kind;
  e.fireIn = 0;
}

/**
 * One fixed step over a pool: carry the current position into `prev`, integrate, count down
 * invulnerability, retire anything that has left the world.
 *
 * Iterates BACKWARDS because `releaseAt` swaps the last live item into the freed slot — forwards,
 * every release skips an entity, which shows up as a bullet that lives one frame too long.
 *
 * ⚠️ **Both edges, not just the trailing one.** Until there were player shots, everything in the game
 * drifted backwards and `cullAlong` was the whole story. A shot travels FORWARD, faster than the
 * camera, so it never falls behind and is never retired — the pool fills with bullets that left the
 * screen seconds ago, and then refuses to spawn the one the player is watching for.
 */
export function stepEntities(pool: Pool<Entity>, cameraAlong: number): void {
  const cull = cullAlong(cameraAlong);
  const cullLeading = cullLeadingAlong(cameraAlong);
  for (let i = pool.size - 1; i >= 0; i--) {
    const e = pool.at(i);
    e.prevAlong = e.along;
    e.prevAcross = e.across;
    e.along += e.velAlong;
    e.across += e.velAcross;
    if (e.invulnFor > 0) e.invulnFor--;
    if (e.along < cull || e.along > cullLeading) pool.releaseAt(i);
  }
}
