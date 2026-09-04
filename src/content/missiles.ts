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
export const MISSILE_KINDS = ['straight'] as const;

/** Derived from the list, so a kind cannot exist in the union and be missing from the table. */
export type MissileKind = (typeof MISSILE_KINDS)[number];

/**
 * How a missile steers once it has popped clear of its tube.
 *
 *   **straight**  flies the lane. The pop is the whole of its steering — 0051, 0097
 */
export type GuidanceKind = 'straight';

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
    pickup: SPRITE.pickupMissile,
  },
};
