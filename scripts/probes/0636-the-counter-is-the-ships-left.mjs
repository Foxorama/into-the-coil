// The break behind docs/decisions/0636-the-counter-is-the-ships-left.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0636',
    suite: 'tests/stand.browser.test.ts',
    broke: 'the counter every life again, the ship being flown included: 3, 2, 1 and not 2, 1, 0',
    guard: 'counts what the run would open with',
    edit: {
      path: 'src/app/chrome.ts',
      find: '      const spare = Math.max(0, lives - 1);',
      replace: '      const spare = Math.max(0, lives);',
    },
  },
];
