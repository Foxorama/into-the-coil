// The wave fires in turn — docs/decisions/0499-the-wave-fires-in-turn.md
//
// Every guard 0499 adds, broken on purpose. `node scripts/prove-guard.mjs 0499`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0499',
    suite: 'tests/bullets.test.ts',
    // The option the player was offered and did not take: the turns across the WHOLE reload, a
    // trickle with no rest in it. The opening reaches into the half that was meant to stay quiet.
    broke: 'the turns spread across the whole reload, so the wave never rests',
    guard: 'THE WAVE TAKES TURNS: a wave opens fire one body at a time',
    edit: {
      path: 'src/content/cadence.ts',
      find: 'export const SWEEP_SHARE = 0.5;',
      replace: 'export const SWEEP_SHARE = 1;',
    },
  },
  {
    decision: '0499',
    suite: 'tests/bullets.test.ts',
    // Members crossing an edge together not counted, so a rank arriving abreast takes ONE turn —
    // which is the wall, back.
    broke: 'the members crossing with a body not counted, so a rank fires on one step',
    guard: 'THE WAVE TAKES TURNS: a wave opens fire one body at a time',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (m.entrySlot < e.entrySlot) ahead++;',
      replace: '      if (m.entrySlot < e.entrySlot) ahead += 0;',
    },
  },
  {
    decision: '0499',
    suite: 'tests/bullets.test.ts',
    // The members who already went not counted, so a back rank arriving while the front is still
    // taking its turns lands on the front's last one. Only the Legendary fixture reaches this.
    broke: 'the members who already went not counted, so a back rank lands on the front’s turns',
    guard: 'THE WAVE TAKES TURNS: a wave opens fire one body at a time',
    edit: {
      path: 'src/app/frame.ts',
      find: '    } else if (m.turnAt > 0 && m.turnAt + e.turnGap > from) {',
      replace: '    } else if (false && m.turnAt > 0 && m.turnAt + e.turnGap > from) {',
    },
  },
  {
    decision: '0499',
    suite: 'tests/bullets.test.ts',
    // The three-slot deal put back, as 0259 shipped it: a single rank of three opens over a fifth of
    // a second. The guard's narrowest fixture is that rank.
    broke: 'the turns cut to one grid slot apart, so a rank opens over a fifth of a second',
    guard: 'THE WAVE TAKES TURNS: a wave opens fire one body at a time',
    edit: {
      path: 'src/content/cadence.ts',
      find: '  return count > 1 ? (reload * SWEEP_SHARE) / count : 0;',
      replace: '  return count > 1 ? FIRE_GRID : 0;',
    },
  },
];
