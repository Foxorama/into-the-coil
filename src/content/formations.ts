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
/*
  ── 11 → 8, AND IT IS THE VOLLEY THAT DECIDES IT ─────────────────────────────────────────────────

  ⚠️ **`docs/decisions/0121-a-wave-dies-together.md`.** Reported from play: *"I'd like the individual
  waves to have tighter clusters of enemies — when they're spread far apart the music beats have less
  impact if you kill 1-2 enemies than if you kill 3-5."* That is a claim about
  `docs/decisions/0109-a-death-is-a-drum.md`: a death is a drum, and a drum struck once is not the
  same event as a drum struck five times.

  ⚠️ **THE NUMBER COMES FROM THE FAN AND NOT FROM TASTE.** `src/content/pickups.ts` fans a volley at
  `SPREAD_STEP` 0.13 radians a barrel, so four barrels span 0.39 — a width of `2 · d · tan(0.195)`,
  about **0.395 × the distance ahead**. At the 50 units a wave is typically engaged at that is 19.7
  units of lane.

  ⚠️ **IT IS SQUEEZED FROM BOTH SIDES AND ONE INTEGER FITS.** The volley bounds it from above; the
  widest enemy — radius 4, so **8 across** — bounds it from below, because neighbours that touch are
  `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md` being spent,
  and it is not for sale.

  | gap | 3 abreast span | inside a 19.75 volley? | clear air between the widest bodies |
  |---|---|---|---|
  | 8 | 16.0 | yes | **0.0 — they touch** |
  | **9** | **18.0** | **yes** | **1.0** |
  | 10 | 20.0 | **no** | 2.0 |
  | 11 — before | 22.0 | no | 3.0 |

  ⚠️ **8 WAS THE FIRST ANSWER AND THE GUARD REFUSED IT**, which is the whole reason the bound is
  written over `ENEMIES` rather than typed: the comment this replaces said the widest hurtbox was 3.7
  and it is now 4. **Five abreast inside one volley would need a gap under 5** and is simply not
  available at any legible size — three reliably, four often, five when the player has closed in.

  ⚠️ **The lane still has room.** The old comment refused 15 because a six spanned 75 of 100 units; at
  9 a six spans 45 and `tests/level.test.ts`'s lane-edge refusal has more slack than before.
*/
const ACROSS_GAP = 9;

/**
 * World units between neighbours, along it.
 *
 * ⚠️ **MEASURED AND DELIBERATELY LEFT AT 14** — 0121. It was changed to 10 on the same report as
 * `ACROSS_GAP` and the change was **wrong**, which a probe that refused to fire is what established.
 *
 * ⚠️ **IT WAS ALREADY INSIDE A BEAT, AND 10 WOULD HAVE TAKEN IT OFF THE GRID.** At 36 units a second
 * a beat is 14.4 units, so neighbours at 14 arrive **0.97 beats apart** — consecutive kills land on
 * consecutive beats, which is the grid `docs/decisions/0093-the-gun-is-on-the-grid.md` and
 * `docs/decisions/0096-the-enemies-play-along.md` put the whole game on. At 10 they arrive 0.69 beats
 * apart, which is nowhere.
 *
 * | gap | neighbours | on the grid |
 * |---|---|---|
 * | 10 | 0.69 beats | no |
 * | **14** | **0.97 beats** | **yes** |
 * | 20 | 1.39 beats | no |
 *
 * ⚠️ **So the report was about the ACROSS axis and only the across axis.** A wave spread far apart is
 * one a volley cannot reach, and a volley has no depth — bullets are points, so the along gap decides
 * how long between kills rather than how many. `tests/level.test.ts` holds the beat relation, which is
 * what says this number may not drift in either direction.
 */
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
