// A roam waits to be seen — docs/decisions/0376-a-roam-waits-to-be-seen.md
//
// Every guard 0376 adds, broken on purpose. `node scripts/prove-guard.mjs 0376`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0376',
    suite: 'tests/roam.test.ts',
    /*
      ⚠️ THE HOLD REMOVED: the roam starts on the step the hull is steered, which is the step it
      spawned, a whole view beyond the leading edge. This is the shipped defect — a drifter first seen
      fifty-seven units from the lane its author gave it.
    */
    broke: 'the roam starting at the spawn again, a whole view beyond the screen',
    guard: 'THE ASKED-FOR ONE: a drifting body is first seen on the lane it was authored at',
    edit: {
      path: 'src/app/frame.ts',
      find: '          if (e.along - e.radius > w.cameraAlong + w.view.alongSpan) break;\n',
      replace: '',
    },
  },
  {
    decision: '0376',
    suite: 'tests/roam.test.ts',
    // The inward rule dropped: a body in the outer quarter takes its parity, and half of those leave.
    broke: 'the first leg always the parity, so a body near an edge sets off through it',
    guard: 'and its first leg heads INWARD from the outer quarter',
    edit: {
      path: 'src/app/frame.ts',
      find: '          const inward = e.across < ACROSS_SPAN * ROAM_INWARD ? 1 : e.across > ACROSS_SPAN * (1 - ROAM_INWARD) ? -1 : 0;',
      replace: '          const inward = 0;',
    },
  },
  {
    decision: '0376',
    suite: 'tests/roam.test.ts',
    /*
      ⚠️ THE INWARD BAND WIDENED TO THE WHOLE LANE, so every body heads for the centre and a rank of
      two in the middle sets off the same way: the parity is gone and a formation no longer fans,
      which is the half of 0073 this decision keeps.
    */
    broke: 'the inward band widened to the whole lane, so no formation fans any more',
    guard: 'and its first leg heads INWARD from the outer quarter',
    edit: {
      path: 'src/app/frame.ts',
      find: 'const ROAM_INWARD = 0.25;',
      replace: 'const ROAM_INWARD = 0.5;',
    },
  },
  {
    decision: '0376',
    suite: 'tests/roam.test.ts',
    // The content-wide claim, broken through the spawner: the hold removed reddens the whole-level
    // guard as well, on the levels that author drifters near an edge.
    broke: 'the roam starting at the spawn again, measured over every level',
    guard: 'and over every level the game has, no lead body is first seen off the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: '          if (e.along - e.radius > w.cameraAlong + w.view.alongSpan) break;\n',
      replace: '',
    },
  },
];
