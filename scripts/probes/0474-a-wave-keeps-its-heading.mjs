// A wave keeps its heading — docs/decisions/0474-a-wave-keeps-its-heading.md
//
// Every guard 0474 adds, broken on purpose. `node scripts/prove-guard.mjs 0474`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0474',
    suite: 'tests/stuck.test.ts',
    // The report, put back: the swing writes the across speed from the along one, so a ripple thrown
    // sideways out of the Rime Shelf's ring has no speed left and hangs on the screen.
    broke: 'a wave that replaces the speed its muzzle gave the shot',
    guard: 'no hostile shot stays on the screen 15 s, on any level, at savior',
    edit: {
      path: 'src/app/frame.ts',
      find: '        shot.velAlong = w.scrollPerStep + shot.wayAlong + hAcross * swing;\n        shot.velAcross = shot.wayAcross - hAlong * swing;',
      replace: '        void hAcross;\n        void swing;\n        shot.velAcross = hand * path.amplitude * k * Math.cos(shot.along * k) * shot.velAlong;',
    },
  },
];
