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
      ⚠️ THE CHAIN CUT, WHICH IS THE SILENT VERSION OF THIS WHOLE CHANGE. Every rung goes back to a
      cold start; the solve still converges and every role target is still reached, so nothing about
      the OUTPUT looks wrong. What goes is the continuity, which is the entire point.
    */
    broke: 'the chain cut, so every rung solves from cold again and the trajectory is a per-rung solve',
    guard: '0166 — AND A WEIGHT OF ZERO IS THE SOLVE THAT SHIPPED, so the chain is real rather than decorative',
    edit: {
      path: 'scripts/solve-mix.mjs',
      find: '    const chained = rung === \'calm\' ? null : previous;',
      replace: '    const chained = null;',
    },
  },
  {
    decision: '0166',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE HOLD APPLIED ONLY WHERE THE ROLE IS UNCHANGED — which is what
      `reports/the-arrangement-holds-the-wrong-thing-2026-08-17.md` specified, and what measurement
      showed does not work. It is worth planting precisely because it is the plausible reading of the
      previous report: the version anybody would write from that document, which halves the count of
      big moves and leaves the worst at 17-18 dB.
    */
    broke: 'the hold applied only where the role is unchanged, which is the previous report’s own proposal',
    guard: '0166 — THE TRAJECTORY MOVES A BOUNDARY LESS THAN THE PER-RUNG SOLVE DOES, in every place',
    edit: {
      path: 'scripts/solve-mix.mjs',
      find:
        "    anchored[l] = previous !== null && SOLVED_BY(l) && shipped[l] > 0 && previous[l] > 0 && weight > 0;",
      replace:
        "    const was = MUSIC_LEVELS[MUSIC_LEVELS.indexOf(rung) - 1] ?? rung;\n" +
        "    anchored[l] =\n" +
        "      previous !== null &&\n" +
        "      SOLVED_BY(l) &&\n" +
        "      shipped[l] > 0 &&\n" +
        "      previous[l] > 0 &&\n" +
        "      weight > 0 &&\n" +
        "      roleOf(theme, rung, l) === roleOf(theme, was, l);",
    },
  },
  {
    decision: '0166',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE DEFAULT PUSHED PAST THE EDGE OF FREE. 0.55 is a perfectly reasonable-looking number and
      it buys a 8.6 dB worst move instead of 11.2 — which is why somebody would set it. It also puts
      seven layers back under 0164's floor, which is the thing this project keeps doing by accident
      and has now measured twice.
    */
    broke: 'the default hold weight raised past the point where it starts costing audibility',
    guard: '0166 — THE SHIPPED HOLD WEIGHT COSTS NO AUDIBILITY, and a heavier one would',
    edit: {
      path: 'scripts/solve-mix.mjs',
      find: 'export const HOLD_WEIGHT = 0.28;',
      replace: 'export const HOLD_WEIGHT = 0.55;',
    },
  },
];
