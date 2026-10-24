// The breaks behind docs/decisions/0648-the-ball-runs-hot.md.
//
// One or more per guard 0648 adds to tests/ball.test.ts. Its bar's guards are 0613's, re-anchored there.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0648',
    suite: 'tests/ball.test.ts',
    broke: 'a ball whose heat is never laid on it',
    guard: '0648: the ball itself goes yellow, amber and red with its heat, and nothing while it is cool',
    edit: { path: 'src/app/frame.ts', find: '  const glowing = heatGlow(w);', replace: '  const glowing = -1;' },
  },
  {
    decision: '0648',
    suite: 'tests/ball.test.ts',
    broke: 'an amber ball drawn yellow',
    guard: '0648: the ball itself goes yellow, amber and red with its heat, and nothing while it is cool',
    edit: { path: 'src/app/frame.ts', find: '  if (stage === 2) return RAM_GLOW[1];', replace: '  if (stage === 2) return RAM_GLOW[0];' },
  },
  {
    decision: '0648',
    suite: 'tests/ball.test.ts',
    broke: 'a red-hot ball that holds still',
    guard: '0648: red-hot, it throbs between its two frames slower than three times a second and faster than once',
    edit: {
      path: 'src/app/frame.ts',
      find: '  return Math.floor(w.steps / GLOW_THROB) % 2 === 0 ? RAM_GLOW[2] : RAM_GLOW[3];',
      replace: '  return RAM_GLOW[2];',
    },
  },
  {
    decision: '0648',
    suite: 'tests/ball.test.ts',
    broke: 'a red-hot ball that strobes every few steps',
    guard: '0648: red-hot, it throbs between its two frames slower than three times a second and faster than once',
    edit: { path: 'src/app/frame.ts', find: 'const GLOW_THROB = 12;', replace: 'const GLOW_THROB = 3;' },
  },
];
