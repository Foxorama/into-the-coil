/**
 * The GAMEPLAY rhythm: how often a body may fire, and the grid those cadences land on.
 *
 * ── WHY THIS IS NOT IN `music.ts` ANY MORE ──────────────────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0159-the-two-clocks-come-apart.md`.** Every quantity below used to be derived
 * from `STEPS_PER_BEAT` — a music constant — so a cadence was a musical fraction before it was a
 * gameplay number. `docs/decisions/0093-the-gun-is-on-the-grid.md` did that on purpose and it bought
 * something real; what it also bought was a rule that **a weapon may only fire at a rate that
 * divides 24 evenly.**
 *
 * ⚠️ **THAT RULE GETS WORSE WITH EVERY WEAPON ADDED, WHICH IS WHY IT GOES.** Said 2026-08-17:
 * *"the sim-step and gun ladder rules make no sense anyway when the plan has always been to add
 * additional weapons in so we'd be struggling all over the place if we don't change our approach to
 * that now."* The divisors of 24 are 1, 2, 3, 4, 6, 8, 12 and 24 — eight legal cadences for every
 * weapon this game will ever have, chosen by a constant that is about the music.
 * `docs/decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md`'s arsenal is still empty, so
 * this is the last moment it costs nothing to fix.
 *
 * ⚠️ **NOTHING HERE IS A MUSICAL CLAIM ANY MORE, AND THE NAMES NO LONGER MAKE ONE.** These are sim
 * steps at the fixed 60 Hz of `docs/decisions/0022-frame-rate-is-a-feature.md`, and that is all they
 * are. Whether what the guns and the enemies play should AGREE with the music is a separate question
 * that 0159 deliberately leaves open — see its *what this un-does* section.
 */

/**
 * The period the gameplay rhythm repeats over, in sim steps.
 *
 * ⚠️ **IT IS 24 BECAUSE IT WAS 24, AND THAT IS THE WHOLE ARGUMENT FOR THE VALUE.** 0159 moves no
 * number: this was `STEPS_PER_BEAT`, every cadence in the game is already expressed against it, and
 * changing it in the same breath as decoupling it would make the landing unmeasurable. **It is now
 * a free number** — nothing derives it from a tempo and no tempo derives from it — so the next hand
 * that wants a different one has only gameplay to argue with.
 *
 * ⚠️ **At 60 Hz this is 0.4 s**, which is also what `BEAT_SECONDS` happens to be today. That
 * coincidence is what makes 0159's landing silent, and it is a coincidence rather than a rule: the
 * two are free to drift the moment a level authors a tempo.
 */
export const VOLLEY_CYCLE = 24;

/**
 * The grid every cadence that is not the player's own lands on, in sim steps.
 *
 * ── WHY THE ENEMIES GET A COARSER GRID THAN THE GUN ─────────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0096-the-enemies-play-along.md`.** Asked for in play: *"it's going to be
 * tricky, but if we can balance the enemies and enemy fire into the rhythm as well that'd be sick."*
 * The player's gun is a LADDER — five authored rungs, each a value a hand picked
 * (`src/content/ships.ts`) — so it can sit on an exact subdivision. An enemy's cadence is a **tuned
 * number** that a level designer reached by feel, and 0034's rule is that nothing may assert on
 * those values; snapping them to a coarser grid would move some of them by 8%.
 *
 * ⚠️ **Six steps is 100 ms and moves nothing by more than 50** — the three enemy rows move by 4%,
 * 0% and 3%, and every boss phase stays strictly faster than the one before it, which a twelve-step
 * grid did not manage for three of the seven.
 *
 * ⚠️ **IT USED TO BE *a sixteenth* AND IS NOW SIX STEPS** — 0159. The value is unchanged and the
 * claim is not: a sixteenth is a statement about a beat, and this file no longer knows what a beat
 * is. What it buys now is that a dozen bodies at tuned periods land on a shared lattice instead of
 * smearing, which was always the gameplay half of 0096 and is the half that does not depend on the
 * music agreeing.
 */
export const FIRE_GRID = VOLLEY_CYCLE / 4;

/**
 * The nearest cadence to `steps` that lands on the grid, never shorter than one grid unit.
 *
 * ⚠️ **THE ONE DESCRIPTION, and it is asked in two places that must agree** — the content tables
 * declare their cadences already snapped (guarded, so a hand cannot author one off the grid) and
 * `fireGapFor` snaps again after the difficulty multiplier, which is the step that would otherwise
 * quietly undo all of it: 0.7 of anything is rarely a multiple of anything.
 */
export function onFireGrid(steps: number): number {
  const snapped = Math.round(steps / FIRE_GRID) * FIRE_GRID;
  return snapped < FIRE_GRID ? FIRE_GRID : snapped;
}

/**
 * Steps until a body with cadence `gap` should FIRST fire, so that the shot lands on the grid.
 *
 * ── A PERIOD ON THE GRID IS NOT THE SAME AS A SHOT ON THE GRID ──────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0096-the-enemies-play-along.md`, and it is 0094's lesson arriving at the other
 * end of the field.** Snapping every cadence to the grid makes each body keep a steady TEMPO; where
 * its shots actually land still depends on the step it happened to spawn on. A dozen bodies at
 * correct periods and arbitrary offsets is a smear, not a rhythm.
 *
 * ⚠️ **Quantised ONCE, at spawn, and relative for ever after.** Because `gap` is a whole number of
 * grid units, one alignment holds for the body's whole life — and because it is not re-aligned on
 * every shot, two enemies that spawned on different grid units stay on different ones. That is the
 * difference between a pattern and a volley, and it is why the player's gun reloads absolutely and
 * an enemy does not: there is one ship and there are forty enemies.
 *
 * ── AND EVERY BODY IN A FORMATION SPAWNS ON THE SAME STEP, WHICH IS THE SENTENCE ABOVE FAILING ──
 *
 * ⚠️ **`docs/decisions/0098-a-wave-plays-a-figure.md`.** Reported from play against the build 0096
 * landed in: *"the enemies all fire at exactly the same time when they appear."* The paragraph above
 * is true of two enemies from two waves and false of five from one: `spawnWave` places a whole
 * formation inside one call, so `steps` and `gap` are the same number for every member and so is the
 * answer. **0096 aligned the phase and then handed every body the same one.**
 *
 * ⚠️ **`share` is where in its OWN cadence a body sits, in `[0, 1)`** — the caller's business, and
 * `src/app/frame.ts` derives it from the member's index and the wave's. A share of zero is byte for
 * byte what 0096 returned, which is why the boss and the seeded field can go on asking the old
 * question.
 *
 * ⚠️ **IT ONLY EVER DELAYS, AND THAT IS THE HALF THAT KEEPS 0096's BALANCE CLAIM.** 0096 refused a
 * forward rounding because *"every body on the field would open fire up to a grid unit LATE — a
 * change to how quickly a wave becomes dangerous."* A spread cannot be free of that: N bodies at one
 * cadence CANNOT be at N phases while all of them wait within one grid unit of it, so the two rules
 * are incompatible and this is the direction that makes nothing arrive sooner than it used to.
 *
 * Returns between `gap - FIRE_GRID + 1` and `2 × gap - FIRE_GRID`.
 */
export function nextOnGrid(steps: number, gap: number, share = 0): number {
  const base = gap - FIRE_GRID + (FIRE_GRID - (steps % FIRE_GRID));
  /*
    ⚠️ **The slots are the body's OWN cadence divided by the grid, never the wave's size.** A wave of
    six turrets has eight slots to sit in and a wave of six lancers has thirteen; spreading over the
    count instead would put two bodies on one slot in the first case and leave five empty in the
    second. `gap` is already a whole number of grid units (guarded), so this divides exactly.
  */
  const slots = Math.max(1, Math.round(gap / FIRE_GRID));
  const wrapped = ((share % 1) + 1) % 1;
  return base + Math.floor(wrapped * slots) * FIRE_GRID;
}
