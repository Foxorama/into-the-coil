// The breaks behind docs/decisions/0420-the-ci-is-sharded-and-joined.md.
//
// ⚠️ EVERY ONE OF THESE IS A RUN THAT WOULD SHOW GREEN. Sharding cannot make a probe pass that
// should fail — each shard proves exactly as the single job did — so what can go wrong is all in how
// the pieces are put back together: the required job not running, not waiting, not reading, or
// reading and accepting something that is not the whole proof.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  // ── The workflow ───────────────────────────────────────────────────────────────────────────────
  {
    decision: '0420',
    suite: 'tests/shards.test.ts',
    broke: 'the required job left to be skipped when a shard fails, which GitHub reports as passing',
    guard: 'THE TRAP: it always runs',
    edit: {
      path: '.github/workflows/tests.yml',
      find: '    needs: [base, typecheck, suite, prove]\n    if: always()\n',
      replace: '    needs: [base, typecheck, suite, prove]\n',
    },
  },
  {
    decision: '0420',
    suite: 'tests/shards.test.ts',
    broke: 'the required job not waiting on the probe shards, so a probe that stays green is never heard',
    guard: 'and it waits on every other job',
    edit: {
      path: '.github/workflows/tests.yml',
      find: '    needs: [base, typecheck, suite, prove]',
      replace: '    needs: [base, typecheck, suite]',
    },
  },
  {
    decision: '0420',
    suite: 'tests/shards.test.ts',
    broke: 'the join handed nothing of what the jobs did, so it can only agree',
    guard: 'and it JOINS them',
    edit: {
      path: '.github/workflows/tests.yml',
      find: '          NEEDS: ${{ toJSON(needs) }}',
      replace: "          NEEDS: '{}'",
    },
  },
  // ── The deal ───────────────────────────────────────────────────────────────────────────────────
  {
    decision: '0420',
    suite: 'tests/prove-guard.test.ts',
    broke: 'the first probe of the set dealt to no shard',
    guard: 'THE PARTITION: the shards together are every probe',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '.filter((_, i) => i % total === n - 1);',
      replace: '.filter((_, i) => i > 0 && i % total === n - 1);',
    },
  },
  {
    decision: '0420',
    suite: 'tests/prove-guard.test.ts',
    // Still a partition, which is why the guard above cannot see it: every probe once, in runs.
    broke: 'the set cut into runs rather than dealt, so a decision’s expensive probes share one shard',
    guard: 'DEALT, NOT CUT',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '.filter((_, i) => i % total === n - 1);',
      replace: '.filter((_, i) => Math.floor((i * total) / probes.length) === n - 1);',
    },
  },
  // ── The join ───────────────────────────────────────────────────────────────────────────────────
  {
    decision: '0420',
    suite: 'tests/prove-guard.test.ts',
    broke: 'only a FAILED dependency counted, so a skipped or cancelled one joins as a success',
    guard: 'THE TRAP, READ: a SKIPPED dependency is not a successful one',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: "    if (result !== 'success') out.push(`job \\`${job}\\` did not succeed: ${result}`);",
      replace: "    if (result === 'failure') out.push(`job \\`${job}\\` did not succeed: ${result}`);",
    },
  },
  {
    decision: '0420',
    suite: 'tests/prove-guard.test.ts',
    broke: 'an empty list of dependencies joined as if every one had succeeded',
    guard: 'and a join that waited on nothing has joined nothing',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: "  if (jobs.length === 0) out.push('the required job waited on nothing, so it has nothing to join');",
      replace: '',
    },
  },
  {
    decision: '0420',
    suite: 'tests/prove-guard.test.ts',
    broke: 'a job sealed to other bytes joined, so its green is some other tree’s',
    guard: 'A TREE THAT IS NOT THIS ONE',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '  const foreign = seals.filter((seal) => seal !== tree).length;',
      replace: '  const foreign = 0;',
    },
  },
  {
    decision: '0420',
    suite: 'tests/prove-guard.test.ts',
    broke: 'the suite shards trusted to cover every file, so a hole in the partition is a file never run',
    guard: 'A HOLE IN THE PARTITION',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '  if (unrun.length) out.push(',
      replace: '  if (false) out.push(',
    },
  },
  {
    decision: '0420',
    suite: 'tests/prove-guard.test.ts',
    broke: 'the baseline taken after and then ignored, so a red over an already-red suite proves itself',
    guard: 'THE BASELINE, AFTER',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '    if (baseline.failed.length) {\n      out.push(',
      replace: '    if (false) {\n      out.push(',
    },
  },
  {
    decision: '0420',
    suite: 'tests/prove-guard.test.ts',
    broke: 'the probe shards trusted to cover the set, so a probe dealt to no one is a guard never broken',
    guard: 'A PROBE NO SHARD RAN is named',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '  if (unproven.length) out.push(',
      replace: '  if (false) out.push(',
    },
  },
  {
    decision: '0420',
    suite: 'tests/prove-guard.test.ts',
    broke: 'a probe shard’s own verdict not read, so one that saw a guard stay green joins as proven',
    guard: 'and a shard that came back without every guard red fails the join',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '    if (result.ok !== true) out.push(',
      replace: '    if (false) out.push(',
    },
  },
];
