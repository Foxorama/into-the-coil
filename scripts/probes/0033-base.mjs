// The breaks behind docs/decisions/0033-a-branch-starts-at-main.md.
//
// ⚠️ The last two matter more than the first three. The script's own logic is easy to get right and
// easy to test; the failure that actually happens to guards in this repository is that NOTHING CALLS
// THEM. `scripts/verify-deploy.mjs` spent a day describing a manifest value that had changed
// underneath it, and was correct the whole time.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0033',
    suite: 'tests/base.test.ts',
    broke: 'the base check accepting anything, so a stacked PR sails through',
    guard: 'THE ONE: refuses a base that is another branch — the stacked PR',
    edit: {
      path: 'scripts/check-base.mjs',
      find: '  if (ref === BASE) return null;',
      replace: '  if (ref !== undefined) return null;',
    },
  },
  {
    decision: '0033',
    suite: 'tests/base.test.ts',
    broke: 'the refusal reduced to a rule with no remedy — a wall instead of a signpost',
    guard: 'says what to do about it, because a refusal with no next step is a wall',
    edit: {
      path: 'scripts/check-base.mjs',
      find: '    `    git fetch origin && git rebase origin/${BASE}`,',
      replace: "    '',",
    },
  },
  {
    // The one whose absence breaks the release path rather than a PR. Failing an empty base would
    // fail every workflow_dispatch and workflow_call run, which is a worse bug than stacking.
    decision: '0033',
    suite: 'tests/base.test.ts',
    broke: 'an empty base treated as a failure, which blocks every run that is not a pull request',
    guard: 'ignores an empty base, which is every run that is not a pull request',
    edit: {
      path: 'scripts/check-base.mjs',
      find: "  if (typeof base !== 'string' || base.trim() === '') return null;",
      replace: "  if (typeof base !== 'string') return null;",
    },
  },
  {
    decision: '0033',
    suite: 'tests/base.test.ts',
    broke: 'the workflow no longer calling the script — a correct guard nobody runs',
    guard: 'calls scripts/check-base.mjs from the required job',
    edit: {
      path: '.github/workflows/tests.yml',
      find: '      - run: node scripts/check-base.mjs "${{ github.event.pull_request.base.ref }}"',
      replace: '      - run: echo skipped',
    },
  },
  {
    decision: '0033',
    suite: 'tests/base.test.ts',
    broke: 'the check moved after `npm ci`, spending the four minutes it exists to save',
    guard: 'THE ORDERING ONE: runs it before npm ci, so a stacked PR fails in seconds',
    edit: {
      path: '.github/workflows/tests.yml',
      find: '      - run: node scripts/check-base.mjs "${{ github.event.pull_request.base.ref }}"',
      replace: '      # moved',
    },
  },
];
