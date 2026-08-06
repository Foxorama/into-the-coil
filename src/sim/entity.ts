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

import { ACROSS_CULL_MAX, ACROSS_CULL_MIN, cullAlong, cullLeadingAlong } from './camera.ts';
import type { Pool } from './pool.ts';

/**
 * How many steps each half of an invulnerability blink lasts.
 *
 * A power of two so the phase is a mask rather than a modulo, and eight steps is about five and a
 * half pulses across the ship's invulnerable window — fast enough to read as *recovering*, slow
 * enough that a 60Hz display shows every one of them and a dropped frame costs nothing.
 *
 * ⚠️ It is a picture cadence living in `sim/`, which is where the sprite selection has to be:
 * `docs/decisions/0015-the-layer-ladder.md` gives the painter one job, and a branch there on "is this
 * thing flashing" is the painter deciding what exists.
 */
const BLINK_PHASE = 8;

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
  /**
   * Which bitmap to blit while it is flashing from a hit — the same silhouette in the `impact` ink.
   *
   * ⚠️ **On the body, so that a hit is legible on ANY body rather than only on the ship.** The first
   * version flashed the player and nothing else, and every enemy in the game had two health, so the
   * first shot to land on anything looked like it had passed straight through. That reads as a
   * collision bug and was reported as one.
   * `docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md`.
   */
  spriteHit: number;
}

export interface Entity extends Body {
  /**
   * The bitmap this is drawn as when nothing is happening to it.
   *
   * ⚠️ `sprite` is DERIVED — `stepEntities` writes it every step from `spriteBase`, `spriteHit` and
   * `flashFor`. The alternative was to swap the two values in place and keep an implicit invariant
   * that `sprite` is the hit one exactly while `flashFor > 0`; a third number is cheaper than an
   * invariant two call sites have to remember, and a pool is plain numbers anyway.
   *
   * ⚠️ **The selection is here rather than in the painter.** `src/render/scene.ts` draws what it is
   * handed — 0015's rule for the layer — and a branch there on "is this thing flashing" is the
   * painter deciding what exists.
   */
  spriteBase: number;
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
   * Steps of hit flash remaining. Counted down by `stepEntities`, set by `collide`.
   *
   * ⚠️ **Separate from `invulnFor`, and the split is the point.** One is a rule — what may hit this
   * — and the other is a picture — whether the player can see that something did. The ship happens
   * to want both at once; an enemy takes every hit and still has to show each one, and a shot shows
   * nothing because it does not survive. Folding them into one counter makes every future body that
   * flashes without being invulnerable a special case.
   */
  flashFor: number;
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
  /**
   * Steps until this retires itself, or `0` for something that lives until the world removes it.
   *
   * ⚠️ **Zero means NO lifetime, not "expire now"** — every ship, enemy and shot in the game leaves
   * this at zero and is retired by the cull or by dying. Only debris counts down. The alternative,
   * `-1` for immortal, puts a sentinel in a field that is otherwise a plain count.
   */
  lifeFor: number;
  /**
   * The `across` a body that entered from the side straightens out at.
   *
   * ⚠️ **Read only while `velAcross` is non-zero**, which is what makes it cost nothing for the
   * things that do not flank: everything else in the game leaves `velAcross` at zero or has it
   * rewritten from its row every step, so this field is never consulted. No sentinel value is
   * needed and none is defined — *not currently crossing* is a velocity of zero, which is a fact
   * about the body rather than a magic number in a field.
   *
   * `docs/decisions/0048-a-threat-may-arrive-from-the-side.md`.
   */
  steerAcross: number;
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
    spriteBase: 0,
    radius: 0,
    health: 0,
    damage: 0,
    spriteHit: 0,
    invulnFor: 0,
    flashFor: 0,
    kind: 0,
    fireIn: 0,
    lifeFor: 0,
    steerAcross: 0,
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
  e.spriteBase = body.sprite;
  e.radius = body.radius;
  e.health = body.health;
  e.damage = body.damage;
  e.spriteHit = body.spriteHit;
  e.invulnFor = 0;
  e.flashFor = 0;
  e.kind = kind;
  e.fireIn = 0;
  e.lifeFor = 0;
  e.steerAcross = 0;
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
export function stepEntities(pool: Pool<Entity>, cameraAlong: number, leadingCull?: number): void {
  const cull = cullAlong(cameraAlong);
  /*
    ⚠️ **The leading cull is an ARGUMENT with a default, and the one caller that overrides it is the
    player's own shots.** Everything else in the world is content, and content is placed against the
    widest view any device can have (0023) — so its cull is the same everywhere. A shot is not
    content: it is the player's reach, and *"you can shoot what you can see"* is a promise about the
    screen in front of them. `cullPlayerShotAlong` in `src/sim/camera.ts` has the bug that argues it.
  */
  const cullLeading = leadingCull ?? cullLeadingAlong(cameraAlong);
  for (let i = pool.size - 1; i >= 0; i--) {
    const e = pool.at(i);
    e.prevAlong = e.along;
    e.prevAcross = e.across;
    e.along += e.velAlong;
    e.across += e.velAcross;
    if (e.invulnFor > 0) e.invulnFor--;
    if (e.flashFor > 0) e.flashFor--;
    /*
      The one place a body's sprite is decided, and it answers TWO signals rather than one.

      ⚠️ **They were folded into one and a play-test caught it.** A single solid flash lasting the
      whole invulnerable window replaced the ship's blink, and the verdict was that the blink was
      better. The mistake was treating them as one thing: an IMPACT is an event and wants to be solid
      and brief; INVULNERABILITY is a state and wants to pulse, because a state that does not pulse
      just looks like the ship has changed colour. `reports/enemy-silhouettes-2026-08-05.md`.

      Both are generic — anything with `invulnFor` blinks and anything with `flashFor` flashes — so
      neither is a special case for the ship. The ship simply happens to be the only thing that
      currently gets both, and gets them in that order: a solid hit, then a pulse while it recovers.
    */
    const blinking = e.invulnFor > 0 && (e.invulnFor & BLINK_PHASE) !== 0;
    e.sprite = e.flashFor > 0 || blinking ? e.spriteHit : e.spriteBase;
    /*
      A lifetime retires the entity itself, and it is checked BEFORE the cull rather than after.

      ⚠️ **Both conditions have to be able to fire.** Debris is the only thing with a lifetime and it
      is also the only thing that can drift off any edge while it still has one left, so a lifetime
      that skipped the cull would leak a fragment that wandered out of the world, and a cull that
      skipped the lifetime would keep every fragment on screen until the camera passed it.
    */
    if (e.lifeFor > 0 && --e.lifeFor === 0) {
      pool.releaseAt(i);
      continue;
    }
    if (e.along < cull || e.along > cullLeading) {
      pool.releaseAt(i);
      continue;
    }
    /*
      ⚠️ **THE `across` CULL, and until now there was none at all.**
      `reports/enemy-silhouettes-2026-08-05.md` named it as the one real gap that comes with entry
      from the lane's edges: anything that leaves the dodge lane is gone from the game and was still
      holding a pool slot, forever. Nothing could leave while everything arrived at the leading edge,
      so it was a hypothetical; a flanker that misses its turn makes it a live path.

      ⚠️ **The ship cannot reach this.** `src/sim/flight.ts` clamps it to `PLAYER_MARGIN` inside both
      edges, which is well inside `ACROSS_CULL_MIN`/`MAX` — so the one body whose release would end
      the run silently is structurally unable to get there.
    */
    if (e.across < ACROSS_CULL_MIN || e.across > ACROSS_CULL_MAX) pool.releaseAt(i);
  }
}
