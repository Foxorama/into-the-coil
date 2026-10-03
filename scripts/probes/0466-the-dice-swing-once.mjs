// The dice swing once — docs/decisions/0466-the-dice-swing-once.md
//
// Every guard 0466 adds, broken on purpose. `node scripts/prove-guard.mjs 0466`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0466',
    suite: 'tests/dice.test.ts',
    // No hold: every lurch inside a swing restarts it, which is the jerk that was reported.
    broke: 'the hold taken off the swing',
    guard: 'THE ASK: a second lurch inside a swing moves nothing',
    edit: {
      path: 'src/app/frame.ts',
      find: 'const JOLT_HOLD_STEPS = Math.round((DICE.swingSeconds * 1000) / STEP_MS);',
      replace: 'const JOLT_HOLD_STEPS = 0;',
    },
  },
  {
    decision: '0466',
    suite: 'tests/dice.test.ts',
    // The burst mark down where half a stick reaches it: wagging about the middle is a lurch again.
    broke: 'the burst mark lowered to where half a stick reaches',
    guard: 'a stick wagged about the middle moves nothing',
    edit: {
      path: 'src/content/ships.ts',
      find: '  burst: 0.6,',
      replace: '  burst: 0.3,',
    },
  },
  {
    decision: '0466',
    suite: 'tests/dice.test.ts',
    // A burst that never arms: it fires again the step the swing settles, with the ship still at speed.
    broke: 'a burst raised on every step at speed once the swing settles',
    guard: 'THE ASK: a hard push swings them back once, and a hard stop forward once',
    edit: {
      path: 'src/app/frame.ts',
      find: '  } else if (!w.joltArmed && speed >= JOLT_BURST) {',
      replace: '  } else if (speed >= JOLT_BURST) {',
    },
  },
];
