// The breaks behind `classify` in scripts/tidy.mjs — the one function in this repo whose failure
// mode is a deleted branch. No decision record: tidy is a tool, not a rule, so its reasoning lives in
// its own header. The probes are here anyway, because "only ever green" is 0005's whole subject and
// the harness does not care whether the guard it re-runs has a decision number attached.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: 'tidy',
    suite: 'tests/tidy.test.ts',
    broke: 'the `main` exclusion removed from `classify`',
    guard: 'never touches main, whatever the evidence says',
    edit: {
      path: 'scripts/tidy.mjs',
      find: "if (PROTECTED.includes(branch)) return { remove: false, reason: 'protected' };",
      replace: "if (false) return { remove: false, reason: 'protected' };",
    },
  },
  {
    decision: 'tidy',
    suite: 'tests/tidy.test.ts',
    broke: 'the checked-out-branch exclusion removed',
    guard: 'never touches the branch that is checked out',
    edit: {
      path: 'scripts/tidy.mjs',
      find: "if (facts.isCurrent) return { remove: false, reason: 'checked out here' };",
      replace: "if (false) return { remove: false, reason: 'checked out here' };",
    },
  },
  {
    // ⚠️ THE ONE THAT MATTERS. Without this check a merged PR is taken as proof about a branch that
    // has since moved, and the commits pushed after the merge are deleted with it.
    decision: 'tidy',
    suite: 'tests/tidy.test.ts',
    broke: 'the merged-sha comparison short-circuited, so a merged PR covers later commits too',
    guard: 'KEEPS a merged branch that has moved since the merge',
    edit: {
      path: 'scripts/tidy.mjs',
      find: 'if (facts.mergedSha && facts.localSha && facts.mergedSha !== facts.localSha) {',
      replace: 'if (false) {',
    },
  },
  {
    decision: 'tidy',
    suite: 'tests/tidy.test.ts',
    broke: 'the tree-identical branch no longer deletes',
    guard: 'deletes a branch whose tree is identical to main even with no PR',
    edit: {
      path: 'scripts/tidy.mjs',
      find: "if (facts.identical) return { remove: true, reason: 'tree identical to main' };",
      replace: "if (false) return { remove: true, reason: 'tree identical to main' };",
    },
  },
];
