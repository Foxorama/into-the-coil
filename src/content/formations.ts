/**
 * How a wave's members are arranged relative to the point the level placed them at.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. Behaviour
 * rides the row: a formation IS two functions, and nothing downstream switches on its name.
 *
 * ── WHY FUNCTIONS RETURNING NUMBERS, RATHER THAN A LIST OF POSITIONS ────────────────────────────
 *
 * ⚠️ The obvious shape is `place(count): Position[]`, and it allocates an array and `count` objects
 * every time a wave spawns — inside the frame loop, which is what
 * `docs/decisions/0022-frame-rate-is-a-feature.md` bans outright. Two calls returning plain numbers
 * allocate nothing at all, and `tests/budget.test.ts` scans the caller for exactly that.
 *
 * The offsets are RELATIVE — along is measured from the wave's placement, across from the lane
 * centre the level authored. That is what lets one formation be reused at any point in any level
 * without knowing where it is.
 */

/** Every formation. Closed. */
export const FORMATION_KINDS = ['line', 'column', 'vee'] as const;

/** Derived from the list, so a formation cannot exist in the union and be missing from the table. */
export type FormationKind = (typeof FORMATION_KINDS)[number];

export interface FormationRow {
  /** World units along, relative to where the level placed the wave. */
  alongOffset(index: number, count: number): number;
  /** World units across, relative to the lane position the level authored. */
  acrossOffset(index: number, count: number): number;
}

/**
 * Where member `index` sits relative to the middle of `count`, in members.
 *
 * A single member is 0; two are ±0.5; three are −1, 0, 1. Fractional on purpose — an even-sized
 * formation straddles its centre rather than leaning one way, which is visible the moment a wave is
 * authored down the middle of the lane.
 */
function centred(index: number, count: number): number {
  return index - (count - 1) / 2;
}

/**
 * World units between neighbours, across the lane.
 *
 * ⚠️ **11 and not 15, and the reason is arithmetic rather than taste.** A formation of six at a gap
 * of 15 spans 75 of the lane's 100 units, which leaves an authored lane almost nowhere to sit —
 * `tests/level.test.ts` refuses any wave that could reach the lane edge, because there is no `across`
 * cull to bring it back. At 11 a six spans 55 and the whole middle of the lane is available.
 *
 * It is still a clear gap: the widest enemy hurtbox is 3.7, so two neighbours are more than a
 * body-width apart.
 */
const ACROSS_GAP = 11;

/** World units between neighbours, along it. Roughly half a second of camera. */
const ALONG_GAP = 14;

export const FORMATIONS: Record<FormationKind, FormationRow> = {
  /**
   * Abreast: all at the same distance, spread across the lane. A wall that arrives at once, so the
   * player picks a gap before it gets there.
   */
  line: {
    alongOffset: () => 0,
    acrossOffset: (index, count) => centred(index, count) * ACROSS_GAP,
  },
  /**
   * Single file: one lane, arriving one after another. The formation that makes a turret dangerous —
   * it holds the player on a line for as long as the column takes to pass.
   */
  column: {
    alongOffset: (index) => index * ALONG_GAP,
    acrossOffset: () => 0,
  },
  /**
   * A wedge, point towards the player. Reads as a thing with an intent, and it leaves a diagonal gap
   * on both sides rather than a straight one — the player who takes it has to keep moving.
   */
  vee: {
    alongOffset: (index, count) => Math.abs(centred(index, count)) * ALONG_GAP,
    acrossOffset: (index, count) => centred(index, count) * ACROSS_GAP,
  },
};
