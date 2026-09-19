// The breaks behind docs/decisions/0166-the-level-is-solved-as-one-trajectory.md.
//
// ⚠️ THE THING THAT HAS TO BE PROVEN HERE IS THAT THE CHAIN EXISTS AT ALL. A `solveLevel` that
// ignored `previous` would still converge, still reach every role target, still hold every rung's
// summed level, and still pass every other assertion in the suite — it would simply be the per-rung
// solve wearing a new name, which is the mix that was reported as jumpy. The guards are written over
// that, and so are two of the three probes.
//
// ⚠️ AND THE THIRD IS THE DEFAULT WEIGHT, which is the one number in this decision that could have
// been a taste. `HOLD_WEIGHT` is DEFINED as the largest weight costing no audibility, so a value
// somebody merely liked is caught from both sides: too heavy puts layers under 0164's floor, too
// light leaves free steadiness on the table.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0166',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ **THE HOLD ANCHORING NOTHING, WHICH IS THE CLAIM STATED AS ITS OWN NEGATION.** 0166 is *holding
      gain continuous buys a steadier boundary*; with nothing anchored the held solve IS the per-rung
      solve, so it buys nothing and all seven places report it. Checked: it fires as *a place stopped
      buying a steadier boundary*, on the guard's own first assertion.

      ── AND THE BREAK THIS REPLACES WAS THE PLAUSIBLE MISREADING, WHICH IS A LOSS WORTH NAMING ──────

      ⚠️ **IT WAS *the hold applied only where the role is unchanged*** — what
      `reports/the-arrangement-holds-the-wrong-thing-2026-08-17.md` specified and what measurement
      showed does not work, planted precisely because it is the version anybody would write from that
      document. **0331 put it out of the guard's reach.** Saurian Belt opens `drive` a rung before the
      shared arrangement names it, the solve carries a roleless layer to 1.37e-7, and the hold dragged
      the NEIGHBOURING rung down to it — so the guard now skips any layer the arrangement has no opinion
      about at ANY rung of the level, not just at a boundary's two ends.

      ⚠️ **THAT LEAVES SIX LAYERS A PLACE, AND ONLY TWO PLACES HAVE ONE THAT CHANGES ROLE AT ALL** —
      The Labyrinth's `perc` (part→counter) and The Toxic Mire's `sub` (part→pulse), measured. A break
      that can only move two layer-boundaries in the game cannot flip the comparison, and `npm run prove`
      said so rather than my guessing it. **The narrowing is not negotiable and a threshold cannot
      replace it**: the contaminated value at Saurian Belt's `surge` is 0.029, which looks exactly like a
      mix, so *no gain a mix would state* excludes nothing. The coverage this costs is the price, and
      this paragraph is it being written down instead of discovered.
    */
    broke: 'the hold anchoring nothing, so holding gain continuous buys no steadier boundary at all',
    guard: '0166 — THE TRAJECTORY MOVES A BOUNDARY LESS THAN THE PER-RUNG SOLVE DOES, in every place',
    edit: {
      path: 'scripts/solve-mix.mjs',
      find:
        "    anchored[l] = previous !== null && SOLVED_BY(l) && shipped[l] > 0 && previous[l] > 0 && weight > 0;",
      replace: '    anchored[l] = false;',
    },
  },
];
