/**
 * The grid: where the beat is, and every cadence that is a fraction of it.
 *
 * `docs/decisions/0113-there-is-one-composition-and-seven-levels.md`. Until this file,
 * `STEPS_PER_BEAT` was a module constant and the whole game ran at 150 BPM — which is why
 * `docs/decisions/0102-the-music-goes-somewhere.md` had to answer *"no increased tempo"* with
 * subdivision, and why a level could not sound like a different piece of music.
 *
 * ── WHY THE LADDER LIVES HERE AND NOT ON THE SHIP ───────────────────────────────────────────────
 *
 * ⚠️ **THIS AMENDS `docs/decisions/0093-the-gun-is-on-the-grid.md`, WHICH PUT IT ON `ShipRow` ON
 * PURPOSE** — *"a ship is where a weapon's character lives"*, with a play-test behind it: *"keep the
 * chunky slower fire rate on record, we could use that for a different ship later."*
 *
 * ⚠️ **A cadence that is a subdivision of a beat cannot be a property of anything but the beat.**
 * Every rung has to divide `beatSteps` exactly or the reload is a fraction of a sim step, so the
 * ladder and the tempo are ONE choice. Written in two places they can disagree, and the failure is
 * silent: a `NaN` cadence is a gun that never fires again.
 *
 * ⚠️ **AND THE PRESERVED INTENT SURVIVES IN A BETTER HOME.** *A chunkier gun for a different ship*
 * is a `GridRow` with a slower ladder, which is a table edit exactly as 0093 wanted — and a ship
 * still owns its barrels, its shot kinds and its hull ladder, which is the rest of its character.
 *
 * ── WHY A RICH LADDER FORCES THE TEMPO, WHICH IS THE THING NOBODY EXPECTED ───────────────────────
 *
 * ⚠️ **A ladder needs several DISTINCT reloads and every one must divide the beat, so a beat needs
 * many divisors.** That is why the beats below are 18, 20, 24, 30, 36 and 40 rather than a smooth
 * ramp: 22 has divisors 1, 2, 11 and 22, and there is no gun in that. The tempo is chosen from what
 * arithmetic allows and then the music is written to it, which is the opposite of the usual order
 * and is worth knowing before proposing a BPM.
 */

/*
  ⚠️ **THIS FILE IMPORTS NOTHING FROM `pickups.ts` AND THAT IS DELIBERATE.** `weaponFor` resolves a
  cadence by asking `fireEveryOn`, so `pickups.ts` imports THIS — and reaching back for
  `UPGRADE_TIERS` to state the ladder's length would close a cycle. `tests/grid.test.ts` imports both
  and holds the arity from outside, which is where a claim about two files belongs.
*/

/** Every grid, written out. `docs/decisions/0016-a-hub-enumerates-kinds.md`. */
export const GRID_KINDS = ['drive', 'race', 'steady', 'sway', 'weight', 'dirge'] as const;

/** Derived from the list, so a grid cannot exist in the union and be missing from the table. */
export type GridKind = (typeof GRID_KINDS)[number];

export interface GridRow {
  /**
   * The beat, in sim steps at 60 Hz.
   *
   * ⚠️ **A WHOLE NUMBER, AND THAT IS THE WHOLE CONSTRAINT.** `docs/decisions/0022-frame-rate-is-a-feature.md`
   * fixes the sim at 60 Hz, so a beat of 23.5 steps does not exist. `tests/grid.test.ts` holds every
   * subdivision below against this.
   */
  beatSteps: number;
  /**
   * What the snap grid divides the beat into — 4 for a straight feel, 6 for a triplet one.
   *
   * ⚠️ **IT WAS HARD-CODED AT 4 AND CALLED `FIRE_GRID`.** Every enemy cadence is rounded to a
   * multiple of `beatSteps / gridDiv` (`docs/decisions/0096-the-enemies-play-along.md`), so this is
   * what *in time* means for everything that is not the player's own gun. A beat of 18 cannot be
   * divided into four whole steps and can be divided into six, which is the second reason this is a
   * field rather than a constant.
   */
  gridDiv: number;
  /**
   * How many pulse volleys a beat, at each weapon tier. One rung per tier, slowest first.
   *
   * ⚠️ **Every entry divides `beatSteps`, and `tests/grid.test.ts` refuses one that does not** —
   * the failure it prevents is a fractional reload, which is a gun that stops rather than an error
   * anybody would see.
   */
  firePerBeat: readonly number[];
  /** How many missile volleys a beat, at each missile tier. Same length, same rule. */
  missilePerBeat: readonly number[];
}

/**
 * How fast a beat may be and how slow, in sim steps.
 *
 * ⚠️ **A BAND RATHER THAN A LIST, because the list is what arithmetic decides.** What this bounds is
 * the musical range — 18 steps is 200 BPM and 40 is 90 — and outside it the reload band below cannot
 * be met by any ladder that divides.
 */
export const BEAT_STEPS_MIN = 18;
export const BEAT_STEPS_MAX = 40;

/**
 * The band every rung's reload must land inside, in sim steps.
 *
 * ⚠️ **THIS IS THE GUARD THAT KEEPS A TEMPO FROM BEING A DIFFICULTY CHANGE**, and it is the one
 * assertion in this file written in a quantity the player feels rather than in one the model
 * defines: 3 steps is 50 ms between volleys and 10 is 167 ms.
 * `docs/decisions/0113-there-is-one-composition-and-seven-levels.md` accepts that a faster level has
 * a faster gun and refuses that it has a *much* faster one — the spread across the seven is what a
 * play-test would otherwise report as *level five is easy* with nothing in the level to explain it.
 */
export const RELOAD_STEPS_MIN = 3;
export const RELOAD_STEPS_MAX = 10;

export const GRIDS: Record<GridKind, GridRow> = {
  /** 200 BPM, triplet-snapped. The fastest the band allows, and its ladder is the widest. */
  drive: { beatSteps: 18, gridDiv: 6, firePerBeat: [2, 2, 3, 3, 6], missilePerBeat: [2, 2, 2, 3, 6] },
  /** 180 BPM, straight. */
  race: { beatSteps: 20, gridDiv: 4, firePerBeat: [2, 2, 4, 4, 5], missilePerBeat: [2, 2, 2, 4, 5] },
  /**
   * 150 BPM, straight — **exactly what the whole game ran at before this file existed**, and it is
   * the reference every other row is read against.
   *
   * ⚠️ **Its four numbers are 0093's, moved and not retuned.** A grid that changed the gun while
   * introducing the ability to change the gun would make the next play-test unreadable.
   */
  steady: { beatSteps: 24, gridDiv: 4, firePerBeat: [3, 3, 4, 4, 6], missilePerBeat: [3, 3, 3, 4, 6] },
  /** 120 BPM, and the one grid with a five in it — a quintuplet rung, which nothing else has. */
  sway: { beatSteps: 30, gridDiv: 6, firePerBeat: [3, 3, 5, 5, 6], missilePerBeat: [3, 3, 3, 5, 6] },
  /** 100 BPM, and triplet-capable: 36 divides by 9 as well as by 4 and 6. */
  weight: { beatSteps: 36, gridDiv: 4, firePerBeat: [4, 4, 6, 6, 9], missilePerBeat: [4, 4, 4, 6, 9] },
  /** 90 BPM, the slowest the band allows. */
  dirge: { beatSteps: 40, gridDiv: 4, firePerBeat: [4, 4, 5, 5, 8], missilePerBeat: [4, 4, 4, 5, 8] },
};

/**
 * What the shell runs on when there is no level: the title, the level break, the run-over screen.
 *
 * ⚠️ **A real answer rather than a fallback, because those screens have music.**
 * `docs/decisions/0095-the-level-has-its-own-music.md` gives them the `calm` rung, and a rung is
 * still a tempo — so *no level* needs a beat exactly as much as a level does.
 *
 * ⚠️ **`steady`, because it is the one the title has always played at** and the title's piece is the
 * floor everything else is built on (0104). A run therefore opens at 150 BPM and the first level's
 * grid is the first tempo change the player ever hears.
 */
export const TITLE_GRID: GridKind = 'steady';

/**
 * The snap unit — what a *sixteenth* is on this grid, in sim steps.
 *
 * ⚠️ **`FIRE_GRID` was this, computed once at module load.** Asking it costs a division and no
 * allocation, which is why it is a function rather than a field: a field is a second place for
 * `beatSteps` to be wrong.
 */
export function fireGridOf(grid: GridRow): number {
  return grid.beatSteps / grid.gridDiv;
}

/** How long a beat lasts, in seconds. The music bakes against this. */
export function beatSecondsOf(grid: GridRow, stepsPerSecond: number): number {
  return grid.beatSteps / stepsPerSecond;
}

/**
 * The nearest whole number of steps ON the grid, never zero.
 *
 * ⚠️ **`onFireGrid` was this with the grid closed over.** Same rounding, same floor — a cadence
 * rounded to nothing is a body firing every step, which is the one outcome worse than being off the
 * beat. `docs/decisions/0096-the-enemies-play-along.md`.
 */
export function onGrid(grid: GridRow, steps: number): number {
  const unit = fireGridOf(grid);
  const snapped = Math.round(steps / unit) * unit;
  return snapped < unit ? unit : snapped;
}

/**
 * The next slot at or after `steps + gap`, offset by `share` of the gap.
 *
 * ⚠️ **The arithmetic is 0096's and 0098's, unchanged — only the unit is now an argument.** A
 * rewrite here would be a behaviour change hiding inside a refactor, which is exactly what
 * `tests/grid.test.ts`'s byte-for-byte comparison against the `steady` row exists to refuse.
 */
export function nextSlot(grid: GridRow, steps: number, gap: number, share = 0): number {
  const unit = fireGridOf(grid);
  const base = gap - unit + (unit - (steps % unit));
  const slots = Math.max(1, Math.round(gap / unit));
  const wrapped = share - Math.floor(share);
  return base + Math.floor(wrapped * slots) * unit;
}

/** Steps between PULSE volleys on this grid at weapon tier `tier`. */
export function fireEveryOn(grid: GridRow, tier: number): number {
  return everyOn(grid, grid.firePerBeat, tier);
}

/** Steps between the note values the MISSILE cadence is built from, at missile tier `tier`. */
export function missileEveryOn(grid: GridRow, tier: number): number {
  return everyOn(grid, grid.missilePerBeat, tier);
}

/**
 * ⚠️ **Clamped rather than trusted**, exactly as `pickups.ts`'s `everyAt` was: `tiersOf` already
 * clamps, so a tier past the end can only arrive if the two ever disagree — and what it prevents is
 * an `undefined` reaching a division, which is a `NaN` cadence and a gun that never fires again.
 */
function everyOn(grid: GridRow, perBeat: readonly number[], tier: number): number {
  const rung = tier < 0 ? 0 : tier > perBeat.length - 1 ? perBeat.length - 1 : tier;
  return grid.beatSteps / perBeat[rung]!;
}
