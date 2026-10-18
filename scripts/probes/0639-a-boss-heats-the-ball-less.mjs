// The break behind docs/decisions/0639-a-boss-heats-the-ball-less.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0639',
    suite: 'tests/ball.test.ts',
    broke: 'a landing on a boss heating the ball as a body does',
    guard: '0639 — a boss takes more landings before the ball burns than a body does',
    edit: { path: 'src/app/frame.ts', find: '+ onBoss * ram.bossHeat;', replace: '+ onBoss * ram.heat;' },
  },
];
