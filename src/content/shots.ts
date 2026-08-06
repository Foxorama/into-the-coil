/**
 * The things that fly and hurt — the player's auto-fire, and what shoots back.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. Behaviour
 * rides the row: nothing downstream switches on a shot's name, it reads the numbers off the entity
 * that was spawned from the row.
 *
 * ── EVERY SPEED HERE IS ABSOLUTE, AND THAT IS A RULE RATHER THAN A HABIT ────────────────────────
 *
 * ⚠️ **Never a multiple of `SHIP_SPEED`.** `reports/drag-feel-2026-08-05.md` says bullet speed and
 * enemy approach are *"relative to how fast the player can get out of the way"* — which is a
 * statement about the ORDER these get tuned in, and reads exactly like an instruction to write them
 * as ratios. Written as ratios, the dodge margin becomes invariant under `SHIP_SPEED` and the first
 * tuning pass measures a knob that no longer does the thing it is being turned for.
 *
 * `tests/combat.test.ts` holds it the only way it can be held: nothing under `src/content/` may
 * import the ship's constants, so a ratio cannot be spelled without the guard seeing it.
 * `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md`.
 *
 * ⚠️ **Nothing may assert on the VALUES below**, on the same terms `src/sim/flight.ts` sets for
 * `SHIP_SPEED`: they are starting points, and what settles them is a hand and
 * `scripts/trace-frame.mjs` — `docs/decisions/0027-measure-the-picture-not-the-model.md`. What the
 * tests hold are the relationships that must be true at *any* value.
 */

import type { Body } from '../sim/entity.ts';
import { SPRITE } from './sprites.ts';

/** Every shot in the game. Closed. */
export type ShotKind = 'pulse' | 'spit' | 'missile';

export interface ShotRow extends Body {
  /**
   * World units travelled per fixed step, always positive. Which way it points is the spawner's
   * business — the same row fired backwards is the same shot.
   *
   * ⚠️ **Relative to the CAMERA, not to the world**, which is the frame `src/sim/flight.ts` already
   * flies the ship in and therefore the frame the player sees. `src/app/frame.ts` adds the scroll
   * rate when it spawns the shot, and the reason it has to is written there: a shot aimed in world
   * coordinates arrives where the ship *was*, because the ship drifts up-lane for every step the
   * shot is in the air.
   *
   * ⚠️ **No upper bound, and that is bought rather than assumed.** `src/sim/collide.ts` sweeps the
   * step instead of testing two current positions, so a shot cannot step over its target however
   * fast it goes. Without that there would be a ceiling here of roughly `radius + target radius`
   * minus the ship's own top speed — a hard limit sitting directly in front of the constant the next
   * tuning pass is supposed to raise.
   */
  speed: number;
}

/** Written out rather than derived, so the table below cannot quietly lose a row. */
export const SHOT_KINDS: readonly ShotKind[] = ['pulse', 'spit', 'missile'];

export const SHOTS: Record<ShotKind, ShotRow> = {
  /**
   * The player's auto-fire. Fast, small, and cheap to survive being wrong about — it is the shot
   * `docs/game.md` says the player never thinks about.
   */
  // ⚠️ `spriteHit` is the same bitmap, and that is honest rather than lazy: a shot has one health,
  // so it never survives a hit and never flashes. There is no second silhouette to draw.
  pulse: { sprite: SPRITE.bullet, spriteHit: SPRITE.bullet, radius: 0.9, health: 1, damage: 1, speed: 2.6 },
  /**
   * What an enemy sends back. **Slower than the ship**, which is the whole of what makes it
   * dodgeable rather than a coin flip: a player who reacts can always leave the line it is on.
   */
  spit: { sprite: SPRITE.bullet, spriteHit: SPRITE.bullet, radius: 0.9, health: 1, damage: 1, speed: 1.4 },
  /**
   * The player's second auto-weapon: slower than the pulse, and worth three of it.
   *
   * Asked for after playing the two-level build: *"missiles — a second auto-weapon, slower than the
   * pulse, 3x its damage, fired from launchers on the ship."*
   *
   * ⚠️ **The DAMAGE is a ratio and the SPEED is not, and that asymmetry is the rule this file opens
   * with.** *Three times the pulse* is what was asked for and it is a relationship between two of the
   * player's own weapons — `tests/combat.test.ts` holds it as a ratio, so tuning the pulse moves the
   * missile with it. A speed written as a ratio would be the banned kind: what makes a threat
   * dodgeable is measured against the ship, and 0034 keeps every speed absolute for exactly that
   * reason. 1.5 is slower than the pulse's 2.6 and that is the whole of what the ask says about it.
   *
   * ⚠️ **Bigger radius than the pulse**, because a heavier shot that misses by the same margin as a
   * light one is a shot the player cannot aim differently. It stays well under the smallest enemy.
   */
  missile: { sprite: SPRITE.missile, spriteHit: SPRITE.missile, radius: 1.3, health: 1, damage: 3, speed: 1.5 },
};
