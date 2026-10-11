// The breaks behind docs/decisions/0596-the-yellow-submarine-hangs.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0596',
    suite: 'tests/submarine.test.ts',
    broke: 'the submarine never sold',
    guard: 'is a dangle, sold on the hanging shelf at the dearer dangles’ price',
    edit: {
      path: 'src/content/dangles.ts',
      find: "  submarine: { name: 'Yellow submarine', hint: 'A little yellow sub, periscope up', price: priced(300) },",
      replace: "  submarine: { name: 'Yellow submarine', hint: 'A little yellow sub, periscope up', price: null },",
    },
  },
  {
    decision: '0596',
    suite: 'tests/cosmo.browser.test.ts',
    // The class is on the readout and the strand, and the thing on it has no size: an empty dash.
    broke: 'the submarine hung as nothing at all',
    guard: 'tries the ware on the dash, buys it once',
    edit: { path: 'src/app/chrome.ts', find: '  width: 1.75em;\n  height: 1.2em;\n  margin-left: -0.875em;\n', replace: '  width: 0;\n  height: 1.2em;\n  margin-left: -0.875em;\n' },
  },
];
