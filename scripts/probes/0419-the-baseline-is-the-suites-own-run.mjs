// The breaks behind docs/decisions/0419-the-baseline-is-the-suites-own-run.md.
//
// ⚠️ LIKE 0115's AND 0344's, THESE BREAK THE HARNESS THAT RUNS THEM. Each is applied to a disposable
// copy, and the copy's `scripts/prove-guard.mjs` is what `tests/prove-guard.test.ts` imports there —
// the harness judging them is the one `npm run prove` was started from, and is not the one broken.
//
// ⚠️ EVERY ONE OF THESE IS A REPORT STANDING IN FOR A BASELINE IT NEVER MADE, AND EVERY ONE READS AS
// GREEN. That is the whole risk of reusing a run: a baseline that was not made is indistinguishable
// from one that passed, which is 0005's vacuous green one level further in than 0054 found it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0419',
    suite: 'tests/prove-guard.test.ts',
    broke: 'a report sealed to other bytes accepted, so a green somebody else earned becomes this tree’s',
    guard: 'THE SEAL: a report of other bytes is refused',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '  if (sealed !== tree) {',
      replace: '  if (sealed !== tree && false) {',
    },
  },
  {
    decision: '0419',
    suite: 'tests/prove-guard.test.ts',
    // The seal that sees which files exist and not what is in them: an edit leaves it unchanged.
    broke: 'the seal taken over the file names alone, so an edited file seals as the tree it was',
    guard: 'and the seal is of the bytes, not only the names',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: 'hash.update(`${path}\\0${files.get(path)}\\n`);',
      replace: 'hash.update(`${path}\\n`);',
    },
  },
  {
    decision: '0419',
    suite: 'tests/prove-guard.test.ts',
    // A missing seal is refused twice over — it cannot equal the tree — so the break worth making is
    // the report that is not there at all, read as an empty baseline with nothing failed.
    broke: 'no report at all read as a baseline with nothing failed',
    guard: 'and a report with no seal is refused',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: "  if (report === null) throw new Error('there is no report to read the baseline from');",
      replace: "  if (report === null) return { failed: [], ran: 0 };",
    },
  },
  {
    decision: '0419',
    suite: 'tests/prove-guard.test.ts',
    broke: 'a suite the report never ran passed over, so a probe over it is judged against no baseline at all',
    guard: 'A SUITE THE REPORT NEVER RAN is a baseline never made',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '  if (missing.length) {',
      replace: '  if (missing.length && false) {',
    },
  },
  {
    decision: '0419',
    suite: 'tests/prove-guard.test.ts',
    // What a `-t` or `--shard` run looks like from inside its report.
    broke: 'a skipped test read as a passed one, so a filtered run seals a guard it never asked',
    guard: 'SKIPPED IS NOT GREEN',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: ".filter((t) => t.status !== 'passed' && t.status !== 'failed')",
      replace: ".filter((t) => t.status !== 'passed' && t.status !== 'failed' && t.status !== 'skipped')",
    },
  },
  {
    decision: '0419',
    suite: 'tests/prove-guard.test.ts',
    broke: 'a suite that threw before its first test counted by its tests, which are none, so it reads as green',
    guard: 'THE ONE WITH NO TESTS: a suite that threw before any test ran is a failure',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: "    if (file.status === 'failed' && (file.assertionResults ?? []).length === 0) {",
      replace: "    if (file.status === 'failed' && (file.assertionResults ?? []).length === 0 && false) {",
    },
  },
];
