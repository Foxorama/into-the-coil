// The breaks behind docs/decisions/0075-the-serialisation-is-checked.md.
//
// ⚠️ Two of the three are about the WIRING rather than the logic, and that is deliberate. The thing
// this decision repairs is a rule that was written down and then not followed; the way its
// replacement fails is not by computing the wrong answer, it is by being a perfect function nobody
// calls — which is the shape `tests/base.test.ts` already records `scripts/verify-deploy.mjs` having
// been in when it went stale.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0075',
    suite: 'tests/base.test.ts',
    /*
      ⚠️ THE STATE OF THE WORLD THIS DECISION EXISTS FOR, restored: several PRs in flight and nothing
      minding. It is worth noticing that this break makes the guard say the pile-up is FINE, which is
      exactly what the repository said for the four PRs that produced the report.
    */
    broke: 'the pile-up allowed, so the next branch stops waiting and nothing says so',
    guard: 'THE ONE: refuses a second pull request in flight',
    edit: {
      path: 'scripts/check-base.mjs',
      find: '  if (!Number.isFinite(count) || count <= 1) return null;',
      replace: '  if (!Number.isFinite(count) || count <= 1) return null;\n  return null;',
    },
  },
  {
    decision: '0075',
    suite: 'tests/base.test.ts',
    /*
      ⚠️ THE FAIL-CLOSED VERSION, and it is the tempting one: a guard that refuses when it cannot ask
      looks stricter and is worse. `gh` missing, a token without the scope, an API blip — each would
      block every change to the repository, which is a far larger outage than the tidiness problem
      being solved.
    */
    broke: 'the check failing when it cannot obtain a count, so an API blip blocks every PR',
    guard: 'ignores a count it could not obtain, because advisory infrastructure may not fail a PR',
    edit: {
      path: 'scripts/check-base.mjs',
      find: '  if (!Number.isFinite(count) || count <= 1) return null;',
      replace: '  if (count === 1) return null;',
    },
  },
  {
    decision: '0075',
    suite: 'tests/base.test.ts',
    /*
      ⚠️ THE ONE THAT LOOKS LIKE NOTHING. The script is untouched and perfect; the workflow simply
      stops telling it how many PRs are open, so `pileUpProblem` is handed `undefined` for ever and
      fails open on every run. Every unit test of the logic still passes.
    */
    broke: 'the count never passed to the script, so the guard is perfect and never consulted',
    guard: 'and passes it how many pull requests are open, which is 0033’s other half',
    edit: {
      path: '.github/workflows/tests.yml',
      find: '          node scripts/check-base.mjs "${{ github.event.pull_request.base.ref }}" "$open"',
      replace: '          node scripts/check-base.mjs "${{ github.event.pull_request.base.ref }}"',
    },
  },
];
