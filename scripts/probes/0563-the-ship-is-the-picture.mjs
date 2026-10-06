// The breaks behind docs/decisions/0563-the-ship-is-the-picture.md.
//
// ⚠️ The camera put back where it stood, which is the picture the review measured.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0563',
    suite: 'tests/stand.test.ts',
    broke: 'the stand camera back at 0548’s distance',
    guard: 'draws the pilot’s ship past a sixth',
    edit: {
      path: 'src/state/screens.ts',
      find: 'const PORT_CAMERA: StandCamera = { along: 94, across: 80, zoom: 1.9, x: 0.28, y: 0.52 };',
      replace: 'const PORT_CAMERA: StandCamera = { along: 94, across: 80, zoom: 1.4, x: 0.28, y: 0.52 };',
    },
  },
];
