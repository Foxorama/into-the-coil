// The breaks behind docs/decisions/0177-a-red-is-a-verdict.md.
//
// ⚠️ THESE BREAK THE HARNESS THAT RUNS THEM, which `scripts/probes/0115-prove-runs-the-guard.mjs`
// already says is true of exactly one file in this repository. Each is applied to a disposable copy
// (0054) and the guards they redden live in `tests/prove-guard.test.ts`, which imports the pure
// functions rather than the worker loop — that is why the verdict is a function at all.
//
// ⚠️ AND THE THING THEY CANNOT PROVE IS NAMED HERE RATHER THAN LEFT UNSAID, on 0115's precedent.
// `runSuite` carrying the failure MESSAGE out of the JSON report is not reachable from a unit test:
// it is not exported, and it needs a real vitest run to have a report to parse. What stands in for a
// probe is that dropping it is self-announcing — a message of `''` makes `isAVerdict` false for
// every failure, so the very next `npm run prove` reports NEVER REACHED ITS CLAIM on all six hundred
// and eighty-six probes rather than on none. Loud, and the wrong way round from the class 0005 is
// about.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0177',
    suite: 'tests/prove-guard.test.ts',
    /*
      ⚠️ THE ONE THE DECISION IS FOR. Without the verdict check, `red` means only that a test with
      the guard's title failed — which is what a timeout, a crash and an unhandled rejection all
      report too. This is the exact state `npm run prove` was in when it called 0134's undercurrent
      probe red on CI and WRONG TEST on the machine that wrote it, about a byte-identical tree.
    */
    broke: 'the verdict check dropped, so any failure with the right title counts as the guard firing',
    guard: 'THE ONE THIS IS FOR: a guard that timed out is NOT a guard that was seen to fail',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: "  return mine.some((f) => isAVerdict(f.message)) ? 'red' : 'NEVER REACHED ITS CLAIM';",
      replace: "  return mine.length > 0 ? 'red' : 'NEVER REACHED ITS CLAIM';",
    },
  },
  {
    decision: '0177',
    suite: 'tests/prove-guard.test.ts',
    /*
      ⚠️ THE VERSION THAT WAS NEARLY SHIPPED, AND IT IS ONE WORD. *The suite is named somewhere in the
      stack* is the obvious rule and it is wrong: a timed-out test still carries the frame for its own
      `it(...)` declaration, so the suite IS named — at the bottom. `findLast` restores that mistake
      exactly, and nothing else in the file moves.

      ⚠️ IT ONLY REDDENS ONE GUARD, WHICH IS THE POINT. Every other failure shape has our own code at
      both ends of its stack, so it reads the same either way; the timeout is the only case the two
      rules disagree about, and it is the case this exists for.
    */
    broke: 'the throw site read as the whole stack, which is the rule a timeout defeats',
    guard: 'and the difference is WHERE IT WAS THROWN, because a timeout names the suite too',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: "  const frame = message.split('\\n').find((line) => line.trim().startsWith('at '));",
      replace: "  const frame = message.split('\\n').findLast((line) => line.trim().startsWith('at '));",
    },
  },
  {
    decision: '0177',
    suite: 'tests/prove-guard.test.ts',
    /*
      ⚠️ THE WIDER RULE A REAL RUN REFUTED, RESTORED EXACTLY. *Not thrown in `node_modules`* is the
      obvious way to say "our code decided", and it calls FOUR probes that have always worked
      proofless (0024 twice, 0072, 0154) — because `.not.toContain` raises inside `@vitest/expect`,
      not at the line that called it. Only the RUNNER stopping the test is not a verdict; every other
      library is one the test called on purpose. The tidier rule is the one that had to be measured,
      which is 0027 arriving inside the harness.
    */
    broke: 'every library counted as machinery, so an assertion chai threw is not the guard speaking',
    guard: 'and an ASSERTION is a verdict wherever chai threw it, which is not where the guard is',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: "  return !frame.replaceAll('\\\\', '/').includes('@vitest/runner');",
      replace: "  return !frame.replaceAll('\\\\', '/').includes('node_modules');",
    },
  },
  {
    decision: '0177',
    suite: 'tests/prove-guard.test.ts',
    /*
      ⚠️ THE ORDER, WHICH IS THE PART THAT HAS GONE WRONG BEFORE. 0115 added the empty-run arm and
      had to put it FIRST — every arm was correct and the bug was which one answered — and adding a
      fourth is the moment that can happen again: a guard belonging to a different test, timing out,
      must read as NOT THIS GUARD and not as this guard failing to reach its claim. Dropping the title
      filter from `mine` makes exactly that mistake, and it is invisible while every probe in the
      repository is behaving.
    */
    broke: 'the fourth arm reached without asking whose failure it is, so another test’s timeout answers for this guard',
    guard: 'and the arms stay in this order: no such guard, not this guard, no verdict, red',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '  if (mine.length === 0) return \'NOT THIS GUARD\';',
      replace: '  if (named.failed.length === 0) return \'NOT THIS GUARD\';',
    },
  },
];
