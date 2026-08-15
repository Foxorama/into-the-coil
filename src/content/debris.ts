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
   * Fragments per PULSE of the player's ship coming apart — and it comes apart over about a second.
   *
   * ⚠️ **Fewer per pulse than `ship`, and that is the split rather than an inconsistency.** `ship` is
   * the BANG, thrown once on the step the hull reaches zero; this is what keeps happening while the
   * wreck is on screen. Reported from play: *"when a player dies, they instantly respawn, there needs
   * to be the player ship explosion, a pause, then a respawn."*
   * `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md` has the beat this
   * is the picture of, and `docs/decisions/0062-a-boss-dies-loudly.md` is the mechanism it copies.
   *
   * ⚠️ **The ceiling is the debris pool, exactly as `boss`'s is** — `count × lifeMax / pulse` has to
   * stay inside it, and this one shares the screen with the pyre's kills and, on a bad step, with a
   * boss. `tests/budget.test.ts` holds the arithmetic for both beats at once.
   */
  dying: 10,
  /**
   * Fragments per PULSE of a boss coming apart — and a boss comes apart over a second and a half.
   *
   * ⚠️ **A rate rather than a total, which is what makes it an event instead of a puff.** Reported
   * from play: *"bosses need a real explosion and an end-of-level beat — currently the level just
   * ends."* One burst of any size is over in half a second and reads exactly like an enemy dying,
   * because it IS an enemy dying with a bigger number.
   * `docs/decisions/0062-a-boss-dies-loudly.md` has the beat this is the picture of.
   *
   * ⚠️ **The ceiling is the debris pool.** A pulse every `BOSS_PULSE` steps against a fragment life of
   * up to `lifeMax` puts about `boss × lifeMax / BOSS_PULSE` on screen at once —
   * `tests/budget.test.ts` holds the arithmetic, because a burst that will not fit is dropped
   * (`src/sim/pool.ts`) and the loudest moment in the game is exactly when that would happen.
   */
  boss: 12,
  /**
   * Fragments when a boss changes PHASE.
   *
   * ⚠️ **`docs/decisions/0111-a-boss-has-one-idea.md`, and it is
   * `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` unapplied on the
   * most-watched event in a level.** A phase change is resolved by the model — the boss fires wider,
   * faster and flies differently from that step on — and the picture has never mentioned it at all.
   * 0036 records three separate play reports of exactly this shape being filed as collision faults
   * that did not exist.
   *
   * ⚠️ **Asked for in play, 2026-08-09**: *"they need to have chunks and pieces fly off when they
   * change states."* `docs/state-of-play.md` has had it listed as the SHARED half of the boss work
   * since then — *"it wants landing ONCE, before the per-boss sessions, otherwise seven sessions each
   * invent it and the seventh is the only one that gets it right."*
   *
   * ⚠️ **Between an enemy dying and a boss pulse.** It has to be unmistakably more than a kill — the
   * player is shooting the boss, so kills are what they have been watching — and unmistakably less
   * than the death, which is the end of the level. It happens at most four times a fight.
   */
  phase: 14,
  /**
   * Fragments per PULSE while a boss is BARE — and it stays bare until the fight ends.
   *
   * ⚠️ **`docs/decisions/0150-the-uncoil-and-the-eye.md`, and it is
   * `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` applied to a STATE
   * rather than to an event.** Every other number in this table is thrown once, at a moment; a
   * vulnerability window is a stretch of the fight the player has to notice they are inside. The
   * model resolves it — the boss stops firing and takes three times the damage — and 0036 records
   * three separate play reports of exactly that shape being filed as collision faults that did not
   * exist.
   *
   * ⚠️ **The smallest number here, and the pulse is what makes it read.** A hull shedding two
   * fragments every fifth of a second is a thing coming apart; the same fragments thrown at once are
   * a puff, which is `boss` and `dying`'s argument at the other end of the scale. It is deliberately
   * quieter than `phase` — the change INTO the window is the event, and this is the window itself.
   *
   * ⚠️ **The ceiling is the debris pool and it shares a screen with a boss death**, because the two
   * are separated by nothing: the window runs straight into the explosion that ends it.
   * `tests/budget.test.ts` holds the arithmetic.
   */
  bare: 2,
  /** Steps between one bare pulse and the next. */
  barePulse: 12,
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
