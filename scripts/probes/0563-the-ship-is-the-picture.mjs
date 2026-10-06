// The breaks behind docs/decisions/0563-the-ship-is-the-picture.md.
//
// ⚠️ The camera put back where it stood, which is the picture the review measured.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0563',
    suite: 'tests/stand.test.ts',
    // 0568: the row's zoom no longer decides the camera — the bay does — so the break is the ship let shrink.
    broke: 'the ship allowed a twelfth of its column, the camera drawn back to suit it',
    guard: 'draws the pilot’s ship past a sixth',
    edit: {
      path: 'src/content/port.ts',
      find: 'export const STAND_SHIP_SHARE = 0.34;',
      replace: 'export const STAND_SHIP_SHARE = 0.08;',
    },
  },
];
