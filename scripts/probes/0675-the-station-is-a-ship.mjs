// The breaks behind docs/decisions/0675-the-station-is-a-ship.md.
//
// ⚠️ Each puts back half of what the review called a cutout: a bay mouth no brighter than the hull it is cut
// into, and a hull that is not a shape against the sky.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0675',
    suite: 'tests/station.browser.test.ts',
    broke: 'the bay mouth’s light flattened to the hull’s ink',
    guard: 'its bay mouth brighter than the hull beside it',
    edit: {
      path: 'src/render/port-bake.ts',
      find: '  ctx.fillStyle = inside;\n  ctx.fillRect(37, -10, prow - 37, 24);',
      replace: '  ctx.fillStyle = hullInk;\n  ctx.fillRect(37, -10, prow - 37, 24);',
    },
  },
  {
    decision: '0675',
    suite: 'tests/station.browser.test.ts',
    broke: 'the hull painted in the sky’s own colour, so it is no shape against it',
    guard: 'stands its hull off the sky',
    edit: {
      path: 'src/render/port-bake.ts',
      find: "  const hullInk = '#232b3c';",
      replace: '  const hullInk = palette.space;',
    },
  },
];
