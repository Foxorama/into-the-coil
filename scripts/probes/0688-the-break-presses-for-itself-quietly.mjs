// The breaks behind docs/decisions/0688-the-break-presses-for-itself-quietly.md: a cursor drawn on every screen again,
// the break's Onward included.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0688',
    suite: 'tests/menu.test.ts',
    broke: 'the cursor drawn on a screen that presses its own button',
    guard: '0688 — and draws no cursor, since it presses for the player',
    edit: {
      path: 'src/state/screens.ts',
      find: '  return timeout === null || timeout.then !== null;',
      replace: '  return timeout === null || timeout.then !== null || true;',
    },
  },
];
