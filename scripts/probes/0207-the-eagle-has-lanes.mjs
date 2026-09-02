// The break behind docs/decisions/0207-the-eagle-has-lanes.md.
//
// ⚠️ THE SEAM 0206 FIXED, COMING BACK IN A NEW COSTUME. A cloud is a disc and wrapping carries its
// shape with it; a lane crosses the whole tile, so the copy one tile over only joins up if the lane
// ARRIVES where it LEFT. Dropping the periodicity leaves the wrap in place and looking correct —
// three copies, drawn end to end — with a step in the band at every join.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0207',
    suite: 'tests/sky.test.ts',
    // The `s === steps ? start : y` reads like a special case somebody left in by accident, and
    // removing it is the obvious tidy-up. It is the entire reason the lane tiles.
    broke: 'a lane no longer ending where it started, so the dust band steps at every tile join',
    guard: 'a dust lane arrives where it left',
    edit: {
      path: 'src/render/bake.ts',
      find: '      points.push([(s / steps) * size, s === steps ? start : y]);',
      replace: '      points.push([(s / steps) * size, y]);',
    },
  },
];
