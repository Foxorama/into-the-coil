// The breaks behind docs/decisions/0663-the-tubes-have-sides.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0663',
    suite: 'tests/tube-shop.test.ts',
    // The swapped pair the same as one of each: a seeker on the left has nowhere to go.
    broke: 'one of each the other way round not a rack of its own',
    guard: '0663 — THE ASK: one rack for every pair',
    edit: { path: 'src/content/racks.ts', find: "  mixedSwapped: rack('homing', 'straight'),", replace: "  mixedSwapped: rack('straight', 'homing')," },
  },
  {
    decision: '0663',
    suite: 'tests/tube-shop.test.ts',
    // The shelf's *2nd tube* back.
    broke: 'the second tube of a kind sold as a second',
    guard: '0663 — sells no *second* tube',
    edit: {
      path: 'src/content/racks.ts',
      find: "  secondStraightTube: { name: 'Missile Tube',",
      replace: "  secondStraightTube: { name: 'Second Missile Tube',",
    },
  },
  {
    decision: '0663',
    suite: 'tests/tube-shop.browser.test.ts',
    // The two bands crossed: a press on the left slot fits the right.
    broke: 'a tube slot fitting the other side',
    guard: '0663 — THE ASK: a seeker in the left slot and a missile tube in the right',
    edit: {
      path: 'src/app/mount.ts',
      find: "rack: name === 'tubeLeft' ? rackOf(tube, right) : rackOf(left, tube) };",
      replace: "rack: name === 'tubeLeft' ? rackOf(left, tube) : rackOf(tube, right) };",
    },
  },
];
