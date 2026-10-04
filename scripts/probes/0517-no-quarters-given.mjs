// The breaks behind docs/decisions/0517-no-quarters-given.md.
//
// ⚠️ The setting changes one thing — which screen a run that ran out goes to — so the breaks that
// matter are the ones that put the wrong screen there: a continue offered on no quarters, a run that
// forgets the credits it began on, a Freeplay that is not kept between visits, and an account that
// leaves out the level the run died on.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0517',
    suite: 'tests/credits.test.ts',
    broke: 'every run that runs out offered the continue, whatever its credits',
    guard: 'ends on the game-over screen when no quarters are given',
    edit: {
      path: 'src/state/root.ts',
      find: '    const over = CREDITS[state.run.credits].continues ? SHOW_GAME_OVER : SHOW_ENDED;',
      replace: '    const over = SHOW_GAME_OVER;',
    },
  },
  {
    decision: '0517',
    suite: 'tests/credits.test.ts',
    broke: 'a run begun on Freeplay given the default credits instead',
    guard: 'is offered the continue on Freeplay',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '        credits: action.credits,',
      replace: '        credits: DEFAULT_CREDIT,',
    },
  },
  {
    decision: '0517',
    suite: 'tests/credits.test.ts',
    broke: 'the continues band left out of what is kept',
    guard: 'Freeplay is kept between visits',
    edit: {
      path: 'src/save/settings.ts',
      find: '    steer: settings.steer,\n    credits: settings.credits,\n  };',
      replace: '    steer: settings.steer,\n  };',
    },
  },
  {
    decision: '0517',
    suite: 'tests/credits.test.ts',
    broke: 'the account adding up the cleared levels and not the one the run died on',
    guard: 'adds up every cleared level and the one being flown',
    edit: {
      path: 'src/app/score.ts',
      find: '  let kills = score.kills;',
      replace: '  let kills = 0;',
    },
  },
];
