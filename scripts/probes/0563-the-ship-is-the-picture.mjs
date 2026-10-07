// The breaks behind docs/decisions/0563-the-ship-is-the-picture.md.
//
// ⚠️ The camera put back where it stood, which is the picture the review measured.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0563',
    suite: 'tests/stand.test.ts',
    // 0571: the ship's size in the dock is the dock's own, so the break is the ship drawn small on its cradle.
    broke: 'the ship drawn at half its size on the dock’s cradle',
    guard: 'draws the pilot’s ship past a sixth',
    edit: {
      path: 'src/content/port.ts',
      find: '  shipGrow: 1.35,',
      replace: '  shipGrow: 0.6,',
    },
  },
];
