// The break behind docs/decisions/0650-a-savior-death-opens-on-a-shield.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0650',
    suite: 'tests/tier-shell.test.ts',
    // 0614's line back, which 0650 took back: a Savior death opens on the hull.
    broke: 'a Savior life after a death opening on the hull',
    guard: 'THE ASK: Legend opens every life full',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '    shellOpen: 1,\n    shellLevel: 1,',
      replace: '    shellOpen: 0,\n    shellLevel: 1,',
    },
  },
];
