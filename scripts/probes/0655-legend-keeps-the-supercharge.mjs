// The break behind docs/decisions/0655-legend-keeps-the-supercharge.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0655',
    suite: 'tests/pickups.test.ts',
    // 0652 as it shipped: Legend swaps half its supercharges for shields too.
    broke: 'a Legend full rack thrown shields',
    guard: '0655 — THE ASK: Savior and Burn swap half',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '    fullSwap: 0,',
      replace: '    fullSwap: 0.5,',
    },
  },
];
