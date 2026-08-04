// The break behind docs/decisions/0027-measure-the-picture-not-the-model.md.
//
// This is the bug the instrument found on its first run, turned into a guard. Worth noting what it
// proves: the ORIGINAL code — the one this break restores — passed all 271 assertions in the suite.
// The model was exactly right. Only the picture was wrong, which is the entire thesis of 0027.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0027',
    suite: 'tests/interpolation.test.ts',
    broke: 'the camera subtracted at its stepped value while entities interpolate — ~4px of judder on everything',
    guard: 'THE ONE: a ship asking for nothing is drawn in exactly the same place at every alpha',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const camera = w.prevCameraAlong + (w.cameraAlong - w.prevCameraAlong) * alpha;',
      replace: '    const camera = w.cameraAlong;',
    },
  },
  {
    // The control's own control. A projection that pinned every entity would make the assertion
    // above perfectly green over a completely frozen scene.
    decision: '0027',
    suite: 'tests/interpolation.test.ts',
    broke: 'entity interpolation removed, so nothing moves and a frozen scene reads as a stable one',
    guard: 'debris left behind DOES move, so this is not passing by drawing nothing',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const along = e.prevAlong + (e.along - e.prevAlong) * alpha;',
      replace: '    const along = e.prevAlong;',
    },
  },
];
