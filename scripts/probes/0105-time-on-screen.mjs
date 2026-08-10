// The breaks behind docs/decisions/0105-a-body-is-on-screen-long-enough-to-answer.md.
//
// ⚠️ THE FIRST TWO ARE THE SHIPPED BUILD, RESTORED. A tree with either applied is what the seventh
// play-test was flown on, and *"enemies overall fly too fast and shoot too fast"* is reproducible
// from `main` by putting one number back.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0105',
    suite: 'tests/pilots.test.ts',
    /*
      ⚠️ THE REPORTED ONE. At 1.1 the charger crossed a 16:9 screen in 1.38 seconds at the hardest
      tier — less time than the death beat takes — and every guard in the repository was green on it,
      because nothing anywhere measured a body's time on screen.
    */
    broke: 'the charger back at the speed it shipped at, which is 1.38s on screen at the hardest tier',
    guard: 'THE REPORTED ONE: nothing crosses the screen faster than the window a player can use',
    edit: {
      path: 'src/content/enemies.ts',
      find: '    closing: 0.68,\n    fireEvery: 0,',
      replace: '    closing: 1.1,\n    fireEvery: 0,',
    },
  },
  {
    decision: '0105',
    suite: 'tests/pilots.test.ts',
    // The other half of the report, in the same unit: a turret never closes, so it is on screen for
    // five seconds, and at 48 steps it put TWELVE volleys out in that window at the hardest tier.
    broke: 'the turret back to the cadence it shipped at, which is twelve volleys while it is on screen',
    guard: 'and nothing gets more volleys away at the player than a player can read',
    edit: {
      path: 'src/content/enemies.ts',
      find: '    fireEvery: 72,',
      replace: '    fireEvery: 48,',
    },
  },
  {
    decision: '0105',
    suite: 'tests/pilots.test.ts',
    /*
      ⚠️ THE WAY A GLOBAL SLOWDOWN DOES HARM, and it is the edit that looks like tidying up: every
      body given one speed. The window guard is completely green over it — nothing is too fast — and
      the roster has stopped meaning anything, which is 0034's *a threat is absolute* thrown away.
    */
    broke: 'every enemy given one closing speed, so the roster is six silhouettes and one threat',
    guard: 'and the ordering is untouched, so nothing lost the identity its row is written around',
    edit: {
      path: 'src/content/enemies.ts',
      find: '    closing: 0.22,\n    fireEvery: 102,',
      replace: '    closing: 0.68,\n    fireEvery: 102,',
    },
  },
  {
    decision: '0105',
    suite: 'tests/pilots.test.ts',
    // ⚠️ AND THE OTHER END OF THE SAME RULE: the two that arrive WITH the world are what makes
    // something safe to ignore, and a drifter that closes is a field where everything converges.
    broke: 'the drifter made to close, so nothing arrives with the world any more',
    guard: 'and the ordering is untouched, so nothing lost the identity its row is written around',
    edit: {
      path: 'src/content/enemies.ts',
      find: '    closing: 0,\n    fireEvery: 0,',
      replace: '    closing: 0.4,\n    fireEvery: 0,',
    },
  },
];
