// The breaks behind docs/decisions/0199-a-verdict-is-an-exit-code.md.
//
// ⚠️ NO STEP IN ANY WORKFLOW PIPES TODAY. The scanning arm of this guard is therefore green over zero
// true positives, which is exactly the shape decision 0005 refuses to trust — indistinguishable from
// a scanner whose YAML reader is broken. These two probes ARE the evidence that it fires: each one
// introduces the pipe that does not currently exist, in the two shapes this repository actually
// writes, and watches the guard go red.
//
// The other half of the answer lives inside `tests/verdict.test.ts`, which runs `stripQuoted` over a
// quoted jq pipe, a deliberate `||` and a comment, so a stripper that stopped stripping would fail
// there rather than silently start reddening three healthy lines.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0199',
    suite: 'tests/verdict.test.ts',
    // The literal command from the report: a proof run piped into `tail` so the log stays short.
    // It is the most reasonable-looking edit in this file, it reads as a tidy-up, and it turns the
    // entire prove harness into a step that cannot fail.
    broke: 'the proof run piped into tail, which reports tail’s status and succeeds on no input',
    guard: 'every piped shell step in a workflow sets pipefail',
    edit: {
      path: '.github/workflows/tests.yml',
      find: '      - run: npm run prove',
      replace: '      - run: npm run prove | tail -20',
    },
  },
  {
    decision: '0199',
    suite: 'tests/verdict.test.ts',
    // The block-scalar shape. This one matters because the step ALREADY contains `|| echo ""` on the
    // line above, so a guard that treated `||` as a pipe would have been red here before the edit
    // and would prove nothing by being red after it.
    broke: 'a multi-line step gaining a pipe, in a block whose neighbouring line already uses ||',
    guard: 'every piped shell step in a workflow sets pipefail',
    edit: {
      path: '.github/workflows/tests.yml',
      find: '          node scripts/check-base.mjs "${{ github.event.pull_request.base.ref }}" "$open"',
      replace:
        '          node scripts/check-base.mjs "${{ github.event.pull_request.base.ref }}" "$open" | tee base.log',
    },
  },
];
