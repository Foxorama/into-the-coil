// The breaks behind docs/decisions/0033-a-branch-starts-at-main.md.
//
// ⚠️ The last two matter more than the first three. The script's own logic is easy to get right and
// easy to test; the failure that actually happens to guards in this repository is that NOTHING CALLS
// THEM. `scripts/verify-deploy.mjs` spent a day describing a manifest value that had changed
// underneath it, and was correct the whole time.

/**
 * The two workflow steps the ordering probe below has to swap, written out once.
 *
 * ⚠️ **They are spelled out rather than matched loosely because `prove` reads the bytes back**, and a
 * find that does not match to the character is a probe that silently does nothing — which is the
 * failure `scripts/prove-guard.mjs` exists to make impossible. If CI's YAML is edited, this is the
 * thing that will complain, and it complaining is the harness working.
 */
const CHECK_STEP = [
  '      - env:',
  '          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}',
  '        run: |',
  `          open=$(gh pr list --state open --json number --jq 'length' 2>/dev/null || echo "")`,
  '          node scripts/check-base.mjs "${{ github.event.pull_request.base.ref }}" "$open"',
].join('\n');

const SETUP_STEP = [
  '      - uses: actions/setup-node@v5',
  '        with:',
  '          # One source, read by both workflows AND by Cloudflare Pages, which cannot read either',
  '          # of them. A literal here would be a second spelling — see tests/toolchain.test.ts.',
  "          node-version-file: '.node-version'",
  '          cache: npm',
].join('\n');

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
      // ⚠️ Re-anchored when 0075 gave the step a second argument and turned it into a block. The
      // break is unchanged: the workflow stops calling the script at all.
      find: '          node scripts/check-base.mjs "${{ github.event.pull_request.base.ref }}" "$open"',
      replace: '          echo skipped',
    },
  },
  {
    decision: '0033',
    suite: 'tests/base.test.ts',
    broke: 'the check moved after `npm ci`, spending the four minutes it exists to save',
    guard: 'THE ORDERING ONE: runs it before npm ci, so a stacked PR fails in seconds',
    edit: {
      path: '.github/workflows/tests.yml',
      /*
        Re-anchored by 0075 with its sibling above, and it had to GROW to stay honest. The guard reads
        the FIRST occurrence of the call, so a probe that merely added a second one after `npm ci`
        left the early one in place and came back STILL GREEN — and a probe that deleted the call
        outright would be the probe above it wearing a different name. The break has to genuinely
        MOVE the step, so the find spans the install between them and the replace re-emits both the
        other way round.
      */
      find: CHECK_STEP + '\n\n' + SETUP_STEP + '\n\n      - run: npm ci',
      replace: SETUP_STEP + '\n\n      - run: npm ci\n\n' + CHECK_STEP,
    },
  },
];
