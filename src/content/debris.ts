/**
 * What a death leaves behind.
 *
 * ⚠️ **This is diagnostic before it is decorative, and that is why it landed when it did.** Until
 * now a death drew nothing at all: the entity was released and that was the whole of it, so *"it
 * died"*, *"it drifted off the edge"* and *"the collision missed and it is still there behind
 * something"* produced the same picture — nothing. Three play-tests in a row reported variants of
 * *"they just disappeared"*, and every one of them was a question the screen could not answer.
 *
 * A burst answers all three at once, and it puts a visible clock on the screen for how long
 * something lasts. `reports/enemy-legibility-2026-08-05.md` named it; this is it.
 *
 * ── WHERE THE BUDGET COMES FROM ─────────────────────────────────────────────────────────────────
 *
 * `docs/decisions/0022-frame-rate-is-a-feature.md` writes its worst-case scene as *~150 enemy
 * bullets, ~80 player projectiles, ~40 enemies, ~200 particles*. The particle share has been
 * unclaimed since the pools were split, and `src/app/mount.ts` says so rather than quietly
 * redistributing it. This claims it. Nothing about the 500-entity frame budget moves.
 *
 * ── WHY DEBRIS IS INERT ─────────────────────────────────────────────────────────────────────────
 *
 * ⚠️ It appears in **no collision pairing at all**, which is what makes it cosmetic in fact rather
 * than by intention — see `src/sim/collide.ts`: the caller names the two sides that can meet, so a
 * pool nobody names can never hurt anything. Its `radius` is zero as well, but that is the belt
 * rather than the braces.
 */

import type { Body } from '../sim/entity.ts';
import { SPRITE } from './sprites.ts';

/**
 * One fragment. `health` is 1 and `damage` is 0 — neither is ever read, because debris is in no
 * pairing, and both are stated rather than left as whatever `Body` demands.
 */
export const DEBRIS: Body = {
  sprite: SPRITE.debris,
  spriteHit: SPRITE.debris,
  radius: 0,
  health: 1,
  damage: 0,
};

/**
 * How a burst is shaped.
 *
 * ⚠️ **Every number here is a starting point and nothing asserts one**, on the same terms
 * `src/sim/flight.ts` sets for `SHIP_SPEED`. What the tests hold is that a death produces debris, in
 * the right place, that goes away on its own — never how much or how fast.
 */
export const BURST = {
  /** Fragments when an enemy dies. */
  enemy: 8,
  /** Fragments when the player's ship dies. More, because it is the one death that matters. */
  ship: 16,
  /**
   * Fragments when a shield is spent.
   *
   * ⚠️ **Fewest of the three, and it exists because a shield popping is an EVENT the model resolves
   * and the picture would otherwise not mention** —
   * `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`, which records that
   * three such events were each reported as a collision bug that did not exist. Without this, the
   * only sign that a hit was absorbed is one of the orbiting marks no longer being there, on the one
   * frame the player is least likely to be looking at their own ship.
   */
  shield: 5,
  /** World units per step, radially. A spread rather than one value, so a burst is not a ring. */
  speedMin: 0.35,
  speedMax: 1.15,
  /**
   * Steps a fragment lives — about 0.3 to 0.6 seconds.
   *
   * ⚠️ **A spread, and it is the point rather than a flourish.** Every fragment vanishing on the
   * same step reads as the burst being switched off; a ragged tail reads as it dissipating. It is
   * also the thing that makes *"how long does debris last"* answerable by watching, which is half of
   * why this exists.
   */
  lifeMin: 18,
  lifeMax: 34,
};
