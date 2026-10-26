// The breaks behind docs/decisions/0617-the-dance-burns.md.
//
// One or more per guard 0617 adds to tests/solid.test.ts.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  // 0617's half-knock off a body went with 0691: a body breaks on contact and knocks nothing. Its probe went with it.
  {
    decision: '0617',
    suite: 'tests/solid.test.ts',
    broke: 'a dance that never brakes, burning into every turn at one speed or faster',
    guard: 'THE REPORTED ONE: turned hard round at a body behind it, it brakes with flame out of its front, swings, and burns with flame out of its back',
    edit: { path: 'src/app/frame.ts', find: '  else if (off > dance.turnAt) w.danceSpeed', replace: '  else if (off > 99) w.danceSpeed' },
  },
  {
    decision: '0617',
    suite: 'tests/solid.test.ts',
    broke: 'a dance that brakes and burns with no flame',
    guard: 'THE REPORTED ONE: turned hard round at a body behind it, it brakes with flame out of its front, swings, and burns with flame out of its back',
    edit: { path: 'src/app/frame.ts', find: '  if (w.danceThrust === 0 || w.danceSpeed <= 0) return;', replace: '  if (w.danceThrust !== 99) return;' },
  },
  {
    decision: '0617',
    suite: 'tests/solid.test.ts',
    broke: 'a dance found past a body’s centre put out of its far side, so at a burn’s speed it goes through',
    guard: '0617 — at its fastest it never goes through a body it cannot break, however its step falls on it',
    edit: { path: 'src/app/frame.ts', find: '  if (nAlong * wasAlong + nAcross * wasAcross < 0) {', replace: '  if (nAlong * wasAlong + nAcross * wasAcross < -1e9) {' },
  },
  {
    decision: '0617',
    suite: 'tests/solid.test.ts',
    broke: 'a flame thrown out of the side it is going, so a burn pushes it backwards',
    guard: 'THE REPORTED ONE: turned hard round at a body behind it, it brakes with flame out of its front, swings, and burns with flame out of its back',
    edit: { path: 'src/app/frame.ts', find: '  const out = -w.danceThrust;', replace: '  const out = w.danceThrust;' },
  },
];
