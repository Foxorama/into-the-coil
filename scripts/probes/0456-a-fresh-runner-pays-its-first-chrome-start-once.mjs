// The breaks behind docs/decisions/0456-a-fresh-runner-pays-its-first-chrome-start-once.md.
//
// ⚠️ NEITHER OF THESE WOULD SHOW AS A RED RUN ON THE DAY. Taking the warm step out puts the runner's
// cold start back inside a test, which costs that test nothing on most runners and its whole budget
// on the one in a few hundred that is slow to come up — the failure this decision is named for.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0456',
    suite: 'tests/shards.test.ts',
    broke: 'the probe shards no longer warming Chrome, so the first wave of browser probes pays the runner’s cold start',
    guard: 'every job that runs the suite or the proof starts Chrome once before it does',
    edit: {
      path: '.github/workflows/tests.yml',
      find: '      - run: node scripts/warm-chromium.mjs\n      - run: npm run prove\n',
      replace: '      - run: npm run prove\n',
    },
  },
  {
    decision: '0456',
    suite: 'tests/shards.test.ts',
    broke: 'the suite shards warming Chrome after the suite, which is the cost paid twice and spared nowhere',
    guard: 'every job that runs the suite or the proof starts Chrome once before it does',
    edit: {
      path: '.github/workflows/tests.yml',
      find:
        '      - run: node scripts/warm-chromium.mjs\n' +
        '      - run: npm test -- --shard=${{ matrix.shard }}/${{ strategy.job-total }}\n',
      replace:
        '      - run: npm test -- --shard=${{ matrix.shard }}/${{ strategy.job-total }}\n' +
        '      - run: node scripts/warm-chromium.mjs\n',
    },
  },
];
