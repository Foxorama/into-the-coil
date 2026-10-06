// The wreck can be killed — docs/decisions/0475-the-wreck-can-be-killed.md
//
// Every guard 0475 adds or moves, broken on purpose. `node scripts/prove-guard.mjs 0475`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0475',
    suite: 'tests/gyre.test.ts',
    // 0337 put back: every damage path refuses a beaten boss, so the wreck is a husk nothing can hit.
    broke: 'the wreck refused by every damage path, as 0337 had it',
    guard: 'THE ASK: a shot lands on the wreck, it flashes, and killing it bursts it',
    edit: {
      path: 'src/app/frame.ts',
      find: '  return !w.bossBeaten || wreckStanding(w);',
      replace: '  return !w.bossBeaten;',
    },
  },
  {
    decision: '0475',
    suite: 'tests/gyre.test.ts',
    // The report, put back: the wreck laid with the row's whole health, which the bar read as a boss alive.
    broke: 'the wreck laid with the boss’s whole health',
    guard: 'THE ASK: a shot lands on the wreck, it flashes, and killing it bursts it',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.bossRow.wreck !== null) body.health = wreckHealth(w.bossRow, w.bossFullHealth);',
      replace: '  void wreckHealth;',
    },
  },
  {
    decision: '0475',
    suite: 'tests/gyre.test.ts',
    // The bar read over the fight's full health while a wreck stands: it comes up at a fifth and says so.
    broke: 'the wreck’s bar read over the boss’s full health',
    guard: 'THE BAR: gone the step the gyre dies, then the wreck’s own, then gone when it is killed',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const barOver = !w.bossBeaten ? w.bossFullHealth : wreckStanding(w) ? wreckHealth(w.bossRow, w.bossFullHealth) : 0;',
      replace: '    const barOver = !w.bossBeaten ? w.bossFullHealth : wreckStanding(w) ? w.bossFullHealth : 0;',
    },
  },
  {
    decision: '0475',
    suite: 'tests/gyre.test.ts',
    // The plan's own probe: a wreck at a tenth, which the gun alone kills — under the player's line.
    broke: 'a wreck at a tenth of the fight, which the gun alone kills',
    guard: 'THE PLAYER’S LINE, at Savior',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'settle: 60, health: 0.22 },',
      replace: 'settle: 60, health: 0.1 },',
    },
  },
  {
    decision: '0475',
    suite: 'tests/gyre.test.ts',
    // And the other side of it: a wreck the player's whole loadout cannot kill in its window.
    broke: 'a wreck at three tenths, which the player’s whole loadout cannot kill',
    guard: 'THE PLAYER’S LINE, at Savior',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'settle: 60, health: 0.22 },',
      replace: 'settle: 60, health: 0.3 },',
    },
  },
  {
    decision: '0475',
    suite: 'tests/level.test.ts',
    // The finding: without the weights the arc kills the gyre in 32.5 s, which only reddens now the fight
    // is read at the death rather than when the wreck leaves the pool.
    broke: 'the gyre without its weights on the arc and the ray',
    guard: 'a real boss lasts forty seconds at max weapons, and every phase gets eight volleys away, so every attack is seen — the arc',
    edit: {
      path: 'src/content/bosses.ts',
      // 0545 weighted the Catherine wheel on the same row, and 0549 and 0551 re-weighed it; the break still takes only the arc's and the ray's.
      find: '    gunWeights: { arc: 1.2, ray: 0.82, catherine: 0.42 },',
      replace: '    gunWeights: { arc: 1.5, ray: 1, catherine: 0.42 },',
    },
  },
];
