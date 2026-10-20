// The breaks behind docs/decisions/0647-the-streak-is-kept-by-hitting.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0647',
    suite: 'tests/score.test.ts',
    // 0428's rule back: any hit the ship takes ends the streak, and the ball sits at ×1.
    broke: 'a hit taken ending the streak, as 0428 had it',
    guard: '0647 — a shield taking a hit is a hit for the rank',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (w.ship.health < healthBefore) w.score.hits += 1;',
      replace: '      if (w.ship.health < healthBefore) {\n        w.score.hits += 1;\n        w.score.streak = 0;\n      }',
    },
  },
  {
    decision: '0647',
    suite: 'tests/score.test.ts',
    // A landing that does not put the clock back: the streak runs out under a body being hit.
    broke: 'a clock that only a kill puts back',
    guard: '0647 — THE ASK: the streak ends after three seconds',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.deaths.count > 0 || anyStruck(w.enemies) || anyStruck(w.bossPool) || anyStruck(w.bossBody)) {',
      replace: '  if (w.deaths.count > 0) {',
    },
  },
  {
    decision: '0647',
    suite: 'tests/score.test.ts',
    // The end boss's death left the clock running, so the streak dies in the crossing.
    broke: 'an end boss’s death that leaves the clock running',
    guard: '0647 — THE ASK: the end boss’s death stops the clock',
    edit: {
      path: 'src/app/frame.ts',
      find: '        w.score.held = true;',
      replace: '        w.score.held = false;',
    },
  },
];
