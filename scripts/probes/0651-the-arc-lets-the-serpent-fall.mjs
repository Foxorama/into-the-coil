// The break behind docs/decisions/0651-the-arc-lets-the-serpent-fall.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0651',
    suite: 'tests/serpent.test.ts',
    // The body cleared on the step the head died, as before 0651: an arc kill leaves the far roots standing.
    broke: 'a chain cleared on the step its head died',
    guard: '0651 — killed by the lightning gun',
    edit: {
      path: 'src/app/frame.ts',
      find: '    else if (w.bossRow.slump === undefined || !bossJustDied(w)) w.bossBody.clear();',
      replace: '    else w.bossBody.clear();',
    },
  },
];
