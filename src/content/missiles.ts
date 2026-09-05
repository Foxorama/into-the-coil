/**
 * The tubes — every kind the ship's second auto-weapon can be, and what each tier of it buys.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`, and the
 * missile half of `docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md`: the ladders
 * `SHIPS.proof` used to carry live on the kind, and the ship names which kind it starts with.
 *
 * ⚠️ **One row, and the axis exists anyway.** The missile pickup cycles over this list exactly as
 * the weapon pickup cycles over `WEAPON_KINDS`, and a list of one is a cycle that never turns — so
 * the day a second kind lands here it is a row and a face, not a mechanism. The run slice already
 * remembers which one is fitted.
 */

import { SPRITE } from './sprites.ts';
import type { ShotKind } from './shots.ts';

/** Every missile. Closed, and the cycle order of the missile pickup — see `WEAPON_KINDS`. */
export const MISSILE_KINDS = ['straight', 'homing'] as const;

/** Derived from the list, so a kind cannot exist in the union and be missing from the table. */
export type MissileKind = (typeof MISSILE_KINDS)[number];

/**
 * How a missile steers once it has popped clear of its tube.
 *
 *   **straight**  flies the lane. The pop is the whole of its steering — 0051, 0097
 *   **homing**    turns toward the nearest body on the field from the moment it leaves the tube,
 *                 by at most `seek` radians a step, whatever direction that is — 0235
 */
export type GuidanceKind = 'straight' | 'homing';

export interface MissileRow {
  /** What the player would call it. */
  label: string;
  /** What taking its pickup does — the title screen's key. */
  hint: string;
  /** The row in `SHOTS` this kind fires. */
  shot: ShotKind;
  guidance: GuidanceKind;
  /**
   * The note values the cadence is built from, one entry per rung. **Not the cadence itself** — the
   * missile fires every `MISSILE_BEAT_RATIO` of these (`src/content/pickups.ts`), which is what
   * makes it a counter-beat rather than a slower copy of the gun.
   */
  missileEvery: readonly number[];
  /** Tubes, one entry per rung. Zero at the base: the missile is earned — 0056. */
  launchers: readonly number[];
  /**
   * The most a `homing` missile turns toward its target per step, in radians. Zero for a missile
   * that flies straight.
   *
   * ⚠️ **A turn RATE and not a turn radius**, because the missile's speed is the shot row's and a
   * radius would be a second number that had to agree with it. At 0.09 a seeker needs thirty-five
   * steps to come about — a body behind the ship is reached, and reached late enough that a player
   * can see it happen, which is the difference between homing and hitscan.
   */
  seek: number;
  /**
   * Steps a missile of this kind burns for before it goes out. Zero for one that lives to the edge
   * of the view, which is the straight missile.
   *
   * ⚠️ **A SEEKER'S FUSE IS THE WHOLE OF WHAT KEEPS THE SCREEN FROM FILLING WITH HUNTERS** —
   * `docs/decisions/0246-a-seeker-hunts-on-the-screen.md`. Played at no fuse: *"I had 15-20 on
   * screen at a time and they were killing everything super fast."* A straight missile is spent by
   * the leading edge inside a second and a half; a seeker that turns is spent by nothing, and a
   * screen of them circling is a screen nothing survives. Ninety steps is a second and a half: at
   * the row's speed that is the far edge of the widest screen from the ship, so a seeker still
   * reaches a boss on its station and comes about for a body just behind the ship — and a seeker
   * that is still turning after that is spent. At the cap that is nine in the air, against the
   * fifteen to twenty the play-test counted.
   */
  fuse: number;
  /** The face the missile pickup shows when it is offering this kind — an index into the atlas. */
  pickup: number;
}

export const MISSILES: Record<MissileKind, MissileRow> = {
  /**
   * The missile 0051 asked for: slower than the pulse, three times its damage, fired from the wings.
   *
   * ⚠️ **Tube, tube, then rate** — *"upgrades for missiles should be 1 tube, 2 tubes, faster fire
   * rate"* — and the ladders are `SHIPS.proof`'s own, moved here unchanged by 0233.
   */
  straight: {
    label: 'Missiles',
    hint: 'Tubes up a tier',
    shot: 'missile',
    guidance: 'straight',
    missileEvery: [8, 8, 8, 6, 4],
    launchers: [0, 1, 2, 2, 2],
    seek: 0,
    fuse: 0,
    pickup: SPRITE.pickupMissile,
  },
  /**
   * Homing missiles — `docs/decisions/0235-a-seeker-hunts-the-nearest-body.md`. Asked for: *"do a
   * bit less damage than regular missiles; home into the nearest target when fired (any direction)."*
   *
   * ⚠️ **The same tubes, the same clock, the same cue.** What differs is the shot (`seeker`, worth
   * two pulses where the straight missile is worth three) and the guidance. A missile pickup of this
   * kind switches the tubes and starts their ladder again at one rung, exactly as a gun does (0233).
   *
   * ⚠️ **ON THE SCREEN, AND ON A FUSE — 0246.** Played: *"they're way too strong, limit them to
   * screen space only and give them a shorter lifespan."* A seeker hunts only a body inside the
   * view the player has, and burns for `fuse` steps before it goes out in a puff.
   */
  homing: {
    label: 'Seekers',
    hint: 'Missiles that hunt',
    shot: 'seeker',
    guidance: 'homing',
    missileEvery: [8, 8, 8, 6, 4],
    launchers: [0, 1, 2, 2, 2],
    seek: 0.09,
    fuse: 90,
    pickup: SPRITE.pickupSeeker,
  },
};
