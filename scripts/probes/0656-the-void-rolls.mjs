// The breaks behind docs/decisions/0656-the-void-rolls.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0656',
    suite: 'tests/void.test.ts',
    // The rift standing in the world again, as 0377 had it: it drifts down the screen and runs out its cap on it.
    broke: 'a rift that stands where it opened',
    guard: 'rolls up the screen at its row’s pace',
    edit: {
      path: 'src/app/frame.ts',
      find: '  body.velAlong = w.scrollPerStep + rift.roll;',
      replace: '  body.velAlong = 0;',
    },
  },
  {
    decision: '0656',
    suite: 'tests/void.test.ts',
    // Left to the content's cull, past the top of the screen, where it negates a wave before it is seen.
    broke: 'a rift left open past the top of the screen',
    guard: 'rolls up the screen at its row’s pace',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (rift.along - rift.radius > edge) {',
      replace: '    if (rift.along - rift.radius > edge + 1e9) {',
    },
  },
  {
    decision: '0656',
    suite: 'tests/void.test.ts',
    // The share only where it opens: a rift that rolls into a boss passes through it.
    broke: 'a rift whose boss share is only where it opens',
    guard: '0656 — a rift that opens short of the boss',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (row !== null) riftOnBoss(w, rift, row);\n',
      replace: '',
    },
  },
];
