// The break behind docs/decisions/0634-the-boss-bar-goes-with-the-run.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0634',
    suite: 'tests/run-ends.test.ts',
    broke: 'the boss bar’s latch put back without the chrome being told, so a dead boss’s health stands over the next run',
    guard: '0634 — and a boss bar standing when it ended is taken down',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.shownBoss !== -1) w.onBoss(-1);\n',
      replace: '',
    },
  },
];
