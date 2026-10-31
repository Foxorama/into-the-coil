// The breaks behind docs/decisions/0705-the-review-is-answered.md.
//
// The fighter's warheads laid where the review found its tubes — showing, not out from under the wing — and
// the ray's rings leaned back to the quarter that ran them together into a band.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0705',
    suite: 'tests/the-review-is-answered.test.ts',
    broke: 'the warhead laid forward, its point ahead of the wing but its base ahead of the wing too — a rocket beside the hull, not out from under the wing',
    guard: 'THE ASK: each warhead’s point stands out ahead of the wing’s leading edge, and its base lies under the wing',
    edit: {
      path: 'src/content/ships.ts',
      find: "const FIGHTER_TUBES: ShipRow['tubes'] = [[], [{ along: -0.05, across: -1.5 }], [{ along: -0.05, across: -1.5 }, { along: -0.05, across: 1.5 }]];",
      replace: "const FIGHTER_TUBES: ShipRow['tubes'] = [[], [{ along: 0.8, across: -1.5 }], [{ along: 0.8, across: -1.5 }, { along: 0.8, across: 1.5 }]];",
    },
  },
  {
    decision: '0705',
    suite: 'tests/the-review-is-answered.test.ts',
    broke: 'the warheads on the hull at the wing roots, inboard of the wing, where there is no wing to be under',
    guard: 'THE ASK: each warhead’s point stands out ahead of the wing’s leading edge, and its base lies under the wing',
    edit: {
      path: 'src/content/ships.ts',
      find: "const FIGHTER_TUBES: ShipRow['tubes'] = [[], [{ along: -0.05, across: -1.5 }], [{ along: -0.05, across: -1.5 }, { along: -0.05, across: 1.5 }]];",
      replace: "const FIGHTER_TUBES: ShipRow['tubes'] = [[], [{ along: -0.05, across: -0.6 }], [{ along: -0.05, across: -0.6 }, { along: -0.05, across: 0.6 }]];",
    },
  },
  {
    decision: '0705',
    suite: 'tests/the-review-is-answered.test.ts',
    broke: 'the rings a quarter as wide as they are tall again, as 0588 leaned them, so the biggest two touch',
    guard: 'THE ASK: between each ring and the next is at least two pixels of sky at 1280×720',
    edit: {
      path: 'src/render/bake.ts',
      find: 'export const RAY_RING_LEAN = 1 / 6;',
      replace: 'export const RAY_RING_LEAN = 1 / 4;',
    },
  },
];
