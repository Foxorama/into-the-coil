// The breaks behind docs/decisions/0054-the-proof-runs-beside-the-work-not-on-it.md.
//
// ⚠️ **These break the harness that is running them, and that is not a paradox.** `prove` loaded
// `scripts/prove-guard.mjs` from the real tree when it started; the copy each probe edits is the one
// inside a worker, and the only thing that reads it there is the worker's `vitest`. So the harness
// proving the guard and the harness under the guard are two different files on disk.
//
// ⚠️ **Why `drift` is the part with probes over it.** It is what stands between "every probe
// restored" and "every probe after the first ran in a tree the one before it had already broken".
// The old harness re-ran the suites at the end and called that the restore check; it could only ever
// see a bad restore that some test asserted on. Nothing else in 0054 is a pure function — the
// baseline gate is a branch inside `main` — and those halves carry a measurement in the decision
// instead, which is 0019's own shape of exemption written smaller.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0054',
    suite: 'tests/prove-guard.test.ts',
    /*
      ⚠️ THE ONE 0019 NAMES: *"a probe that reverted its own file but left a planted one behind"*.
      Dropping the extra-file loop is the tidiest-looking edit in the function — the first two loops
      already walk everything the tree is supposed to contain, so the third reads as redundant. It is
      not: it is the only half that can see a file nothing was looking for.
    */
    broke: 'the leftover-file check dropped, so a plant that never got removed goes unseen',
    guard: 'sees a file the probe left behind',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '  for (const path of after.keys()) if (!before.has(path)) out.push(`${path} — LEFT BEHIND`);',
      replace: '  void after;',
    },
  },
  {
    decision: '0054',
    suite: 'tests/prove-guard.test.ts',
    // The contents no longer compared, only the file list. A tree with every file present but one
    // of them mutated then reads as pristine, and the next probe in that worker inherits the break.
    broke: 'the restore compared by file list rather than by contents',
    guard: 'sees a file the probe did not restore',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '    else if (after.get(path) !== hash) out.push(`${path} — not restored`);',
      replace: '    else void hash;',
    },
  },
  {
    decision: '0054',
    suite: 'tests/prove-guard.test.ts',
    // A deleted file reported as an ordinary difference rather than as a disappearance. The worker
    // is missing a module from here on, and every later probe in it fails for that reason instead of
    // its own — which reads as a whole decision's guards having rotted at once.
    broke: 'a file that vanished from the tree reported as if it were merely different',
    guard: 'sees a file that went missing altogether',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '    if (!after.has(path)) out.push(`${path} — GONE`);',
      replace: '    if (!after.has(path)) out.push(`${path} — not restored`);',
    },
  },
];
