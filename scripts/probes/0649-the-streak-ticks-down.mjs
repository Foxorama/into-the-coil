// The breaks behind docs/decisions/0649-the-streak-ticks-down.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0649',
    suite: 'tests/score.test.ts',
    // 0647's rule back: the quiet running out ends the whole streak, and ×5 falls to ×1 at once.
    broke: 'a quiet that ends the streak whole',
    guard: '0647, 0649 — THE ASK: the streak falls after three seconds',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (over >= 0 && over % STREAK_DECAY_STEPS === 0) score.streak = streakStepDown(score.streak);',
      replace: '  if (over >= 0) score.streak = 0;',
    },
  },
  {
    decision: '0649',
    suite: 'tests/score.test.ts',
    // One step down and no more: the multiplier stops falling at the first tick.
    broke: 'a decay that takes one step and stops',
    guard: '0647, 0649 — THE ASK: the streak falls after three seconds',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (over >= 0 && over % STREAK_DECAY_STEPS === 0) score.streak = streakStepDown(score.streak);',
      replace: '  if (over === 0) score.streak = streakStepDown(score.streak);',
    },
  },
];
