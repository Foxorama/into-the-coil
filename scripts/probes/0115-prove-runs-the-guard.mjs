// The breaks behind docs/decisions/0115-a-probe-runs-its-own-guard.md.
//
// ⚠️ THESE BREAK THE HARNESS THAT RUNS THEM, which is the only file in this repository where that is
// true. Each is applied to a disposable copy (0054) and the guards they redden live in
// `tests/prove-guard.test.ts`, which imports the pure functions rather than the worker loop — that
// is why the verdict is a function at all.
//
// ⚠️ AND THE THING THEY CANNOT PROVE IS NAMED HERE RATHER THAN LEFT UNSAID. 0115 is a change of COST
// as well as of shape, and a probe cannot redden a test for being slow: nothing below breaks the
// filter itself, because a harness that ran the whole suite would still report every probe correctly
// and merely take thirty-seven minutes. What is probed is the two ways the filter can be WRONG.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0115',
    suite: 'tests/prove-guard.test.ts',
    /*
      ⚠️ THE SILENT ONE. `-t` is a regex and a guard title is prose; unescaped, the eight titles
      carrying `( ) . *` either throw inside a worker or match a test nobody named. This is the exact
      shape of the shell-quoting failure the harness's own header was written about — a string that
      passes through one layer meaning something else — and it would report `NO SUCH GUARD` on a
      probe whose guard is perfectly healthy.
    */
    broke: 'the guard title handed to vitest unescaped, so a metacharacter stops being a character',
    guard: 'THE SILENT ONE: every guard title in the repository still matches itself as a pattern',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: "  return title.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');",
      replace: '  return title;',
    },
  },
  {
    decision: '0115',
    suite: 'tests/prove-guard.test.ts',
    /*
      ⚠️ THE ONE THAT COSTS THE MOST, AND IT IS A CLASS THIS HARNESS COULD NOT SEE BEFORE. An empty
      vitest run exits ZERO with no failures. Without the `ran === 0` arm, a guard title the code has
      moved out from under is byte-for-byte indistinguishable from a guard that does not fire — so a
      renamed test would turn every one of its probes into a report about nothing, loudly enough to
      look like a real failure and quietly enough to be "fixed" by editing the guard string.
    */
    broke: 'the empty-run arm dropped, so a guard title that resolves to no test reads as one that did not fire',
    guard: 'THE NEW CLASS: a guard title that resolves to no test is refused, not read as green',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: "  if (named.ran === 0) return 'NO SUCH GUARD';",
      replace: "  if (named.ran === -1) return 'NO SUCH GUARD';",
    },
  },
  {
    decision: '0115',
    suite: 'tests/prove-guard.test.ts',
    /*
      ⚠️ THE VERDICT ITSELF. `NOT THIS GUARD` exists so that red-on-the-wrong-test is never a pass;
      widened to "anything red counts", every probe in the repository would go on passing while
      proving only that its break broke SOMETHING. That is the whole distinction 0019 is about,
      and it is one `.some` away from being lost.
    */
    broke: 'any red taken as proof, so a break that reddens the wrong test passes',
    guard: 'and a guard that fires is the only thing that passes',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: "  return named.failed.some((t) => t.includes(guard)) ? 'red' : 'NOT THIS GUARD';",
      replace: "  return named.failed.length > 0 ? 'red' : 'NOT THIS GUARD';",
    },
  },
];
