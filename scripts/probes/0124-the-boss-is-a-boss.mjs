// The breaks behind docs/decisions/0124-the-boss-is-a-boss.md.
//
// ⚠️ THE FIRST PUTS BACK THE REPORTED STATE EXACTLY — 150 health, which is 4.6 seconds at max weapons
// on the tier difficulty.ts calls "what the game is tuned for". It was a play-test number from 0040
// and it had never been measured against a maxed weapon ladder.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0124',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE MINIBOSS. *"At max level weapons, the boss dies too fast still, it's more of a mid-level
      miniboss than an end of level boss."* Nothing in the repository could see it: every existing
      guard about a boss was about whether it could be killed at ALL, with the base weapon, and that
      one passes more easily the weaker the boss is.
    */
    broke: 'the first boss back to the health it shipped with, which is 4.6 seconds at max weapons',
    guard: 'THE REPORTED ONE: a boss is not over before its music is',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    radius: 11,\n    health: 480,',
      replace: '    radius: 11,\n    health: 150,',
    },
  },
  {
    decision: '0124',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ A PHASE NOBODY SEES. 0111 keys every boss's behaviour to its remaining health; a phase that
      lasts two seconds is an event the model resolves and the player never answers — the same defect
      as a one-second music rung (0123) and a body with no dwell time (0105). This narrows one phase
      rather than touching health, so it is the phase table being wrong rather than the boss.
    */
    broke: 'a phase narrowed to a sliver of the health bar, so the boss changes and nobody sees it',
    guard: 'and every phase lasts long enough to be seen as one',
    edit: {
      path: 'src/content/bosses.ts',
      find: '      { upTo: 0.6, fireEvery: 66, shots: 3, spread: 0.5, patrolScale: 1.4 },',
      replace: '      { upTo: 0.62, fireEvery: 66, shots: 3, spread: 0.5, patrolScale: 1.4 },\n      { upTo: 0.6, fireEvery: 66, shots: 3, spread: 0.5, patrolScale: 1.4 },',
    },
  },
  {
    decision: '0124',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE RUN THAT STOPS GETTING HARDER. Seven bosses with one idea each (`docs/game.md`) is not
      served by a level-seven boss that dies faster than level one's, and nothing else in the
      repository would notice — every other boss guard is about a single fight.
    */
    broke: 'the last boss made softer than the first, so the run stops escalating',
    guard: 'and a later boss is a longer fight than an earlier one',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    radius: 16,\n    health: 1140,',
      replace: '    radius: 16,\n    health: 400,',
    },
  },
];
