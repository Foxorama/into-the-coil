// The break behind docs/decisions/0585-the-prices-rise.md: the rise taken off, so every ware costs what it was asked at.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0585',
    suite: 'tests/cosmo.test.ts',
    broke: 'every ware charged what it was asked at, with no rise',
    guard: 'at 250 shards each, and 0585’s fifteen per cent on top',
    edit: {
      path: 'src/content/prices.ts',
      find: '  return Math.round(asked * PRICE_RISE);',
      replace: '  return asked;',
    },
  },
];
