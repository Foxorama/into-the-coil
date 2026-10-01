// The breaks behind docs/decisions/0454-a-worker-tree-is-the-checkout.md.
//
// ⚠️ **These break the copier inside a worker, which is not the copier running them** — 0054's
// probes say why that is not a paradox. The guards ask `checkoutFiles` of a real repository holding
// one of each thing the real checkout held, so each break is one way of getting the list wrong.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0454',
    suite: 'tests/prove-guard.test.ts',
    // `--cached` alone is "what git tracks", which reads like the obvious meaning of the checkout and
    // is a clean worktree: the uncommitted work — the thing 0054 copies off the disk to judge — gone.
    broke: 'only tracked files listed, so a new file not yet added is not in the tree being proven',
    guard: 'and the work not yet added, which is what the proof exists to judge',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: "['ls-files', '-z', '--cached', '--others', '--exclude-standard']",
      replace: "['ls-files', '-z', '--cached']",
    },
  },
  {
    decision: '0454',
    suite: 'tests/prove-guard.test.ts',
    // Every untracked file, ignored or not — which is the old copier again by another route: 650MB of
    // renders and a folder of screenshots in every worker, none of which the gate has ever had.
    broke: 'the ignore rules not applied, so every render and screenshot is copied into every worker',
    guard: 'and nothing gitignored is copied — no render, no shot',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: "['ls-files', '-z', '--cached', '--others', '--exclude-standard']",
      replace: "['ls-files', '-z', '--cached', '--others']",
    },
  },
  {
    decision: '0454',
    suite: 'tests/prove-guard.test.ts',
    // ⚠️ THE ONE THIS DECISION IS FOR, in the shape that reads as a tidy-up: "skip what is not
    // there" instead of "copy only files". A nested checkout IS there, so it comes back.
    broke: 'anything that exists offered for copying, so a nested checkout is copied as a directory',
    guard: 'THE ONE THIS IS FOR: another checkout inside this one is another repository, and is not copied',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '    if (!statSync(resolve(treeRoot, path), { throwIfNoEntry: false })?.isFile()) continue;',
      replace: '    if (!existsSync(resolve(treeRoot, path))) continue;',
    },
  },
  {
    decision: '0454',
    suite: 'tests/prove-guard.test.ts',
    // The other half of the same line, broken the other way: directories refused, absences let
    // through. `copyFileSync` would then throw on the first deleted file and no probe would run.
    broke: 'only directories skipped, so a tracked file deleted in the work is offered for copying',
    guard: 'and a tracked file deleted in the work is not offered for copying',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '    if (!statSync(resolve(treeRoot, path), { throwIfNoEntry: false })?.isFile()) continue;',
      replace: '    if (statSync(resolve(treeRoot, path), { throwIfNoEntry: false })?.isDirectory()) continue;',
    },
  },
];
