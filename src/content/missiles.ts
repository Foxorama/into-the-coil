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
import type { SpecialKind } from './specials.ts';

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

/**
 * How a loaded tube is drawn on a ship — 0581: `dart`, the whole missile, hung under a wing or out of a pod;
 * `nose`, its warhead at the front of a turret that holds the rest. Closed; a ship's row names its own.
 */
export const TUBE_LOOKS = ['dart', 'nose'] as const;
export type TubeLook = (typeof TUBE_LOOKS)[number];

export interface MissileRow {
  /** What the player would call it. */
  label: string;
  /** What taking its pickup does — the title screen's key. */
  hint: string;
  /** The row in `SHOTS` this kind fires. */
  shot: ShotKind;
  guidance: GuidanceKind;
  /**
   * The note value the cadence is built from. **Not the cadence itself** — the missile fires every
   * `MISSILE_BEAT_RATIO` of these (`src/content/pickups.ts`), which is what makes it a counter-beat
   * rather than a slower copy of the gun.
   *
   * ⚠️ **ONE NUMBER, AND IT WAS A LADDER OF FIVE — 0577.** *"Let's remove the missile upgrades, you
   * either have full tier missiles or you don't."* Every tube fires at what was the ladder's top rung,
   * 4, from the moment it is fitted. How many tubes a ship has is the run's (`tubes`), not a rung's.
   */
  missileEvery: number;
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
   * screen of them circling is a screen nothing survives. Ninety steps was a second and a half, and
   * a seeker still reaches a boss on its station and comes about for a body just behind the ship —
   * and a seeker that is still turning after that is spent. At the cap that is nine in the air,
   * against the fifteen to twenty the play-test counted.
   *
   * ⚠️ **NINETY-NINE SINCE 0503, AND WHAT IT REACHES IS A BOSS'S STATION, NOT THE SCREEN'S EDGE.** This
   * note used to say ninety steps carried a seeker to *"the far edge of the widest screen from the
   * ship"*. It never did: at the seeker's 1.4 a step, in the camera's frame, ninety steps is 126
   * units, which from the ship's place forty into the view ends at 166 — where the bosses stand (154
   * to 190 from the camera), and well short of even a 16:9 screen's 213. Played after 0500's bar let
   * a maximised desktop see 263 units where it saw 241: *"extend the … homing missiles distance as
   * we've made the desktop distance larger."* So ninety-nine, by the same tenth: 139 units, ending at
   * 179, about the share of the screen it had. `docs/decisions/0503-the-levels-close-up.md`.
   */
  fuse: number;
  /** The face the missile pickup shows when it is offering this kind — an index into the atlas. */
  pickup: number;
  /**
   * A tube of this kind loaded on the ship, in each look a ship may carry it in, with its hurt twin —
   * 0581: what the frame lays at each tube place, in this kind's ink, so a rack of one of each reads as one
   * of each (*"by ink"*). Which look is the ship's (`tubeLook` on its row).
   */
  loaded: Readonly<Record<TubeLook, { base: number; hit: number }>>;
  /**
   * What a pickup of this tube buys once both tubes are fitted —
   * `docs/decisions/0373-a-special-is-the-guns-own.md`, a full ladder's until 0577. Every row authors it.
   */
  special: SpecialKind;
}

export const MISSILES: Record<MissileKind, MissileRow> = {
  /**
   * The missile 0051 asked for: slower than the pulse, three times its damage, fired from the wings.
   *
   * ⚠️ **Tube, tube, then rate** was its ladder — *"upgrades for missiles should be 1 tube, 2 tubes,
   * faster fire rate"* — and 0577 took the rate steps: a tube is fitted at the top rate.
   */
  straight: {
    label: 'Missiles',
    hint: 'A tube that fires straight',
    shot: 'missile',
    guidance: 'straight',
    missileEvery: 4,
    seek: 0,
    fuse: 0,
    pickup: SPRITE.pickupMissile,
    // 0581: in the missile pickup's gold.
    loaded: { dart: { base: SPRITE.tubeMissile, hit: SPRITE.tubeMissileHit }, nose: { base: SPRITE.noseMissile, hit: SPRITE.noseMissileHit } },
    // The golden aura since 0375 — *"change the autogun supercharge effect over to the regular
    // forward firing missiles."* It was the bomb (0373).
    special: 'overdrive',
  },
  /**
   * Homing missiles — `docs/decisions/0235-a-seeker-hunts-the-nearest-body.md`. Asked for: *"do a
   * bit less damage than regular missiles; home into the nearest target when fired (any direction)."*
   *
   * ⚠️ **The same tubes, the same clock, the same cue.** What differs is the shot (`seeker`, worth
   * two pulses where the straight missile is worth three) and the guidance. Since 0577 a ship may fit
   * one of each, and each tube fires its own.
   *
   * ⚠️ **ON THE SCREEN, AND ON A FUSE — 0246.** Played: *"they're way too strong, limit them to
   * screen space only and give them a shorter lifespan."* A seeker hunts only a body inside the
   * view the player has, and burns for `fuse` steps before it goes out in a puff.
   */
  homing: {
    label: 'Seekers',
    hint: 'A tube that hunts',
    shot: 'seeker',
    guidance: 'homing',
    missileEvery: 4,
    // `fuse` was 90 until 0503: a tenth longer, with the desktop's view — see the field's note.
    seek: 0.09,
    fuse: 99,
    pickup: SPRITE.pickupSeeker,
    // 0581: in the seeker pickup's lavender.
    loaded: { dart: { base: SPRITE.tubeSeeker, hit: SPRITE.tubeSeekerHit }, nose: { base: SPRITE.noseSeeker, hit: SPRITE.noseSeekerHit } },
    // The purple aura — 0373.
    special: 'hunt',
  },
};
