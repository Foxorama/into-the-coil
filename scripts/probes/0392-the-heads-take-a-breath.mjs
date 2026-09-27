// The break behind docs/decisions/0392-the-heads-take-a-breath.md.
//
// Asked for: *"the attacks from the different heads come too fast to each and merge together, needs to
// be a slightly longer pause, maybe .4 sec for each heads attack."*

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0392',
    suite: 'tests/hydra.test.ts',
    // The head's own air ignored: the round runs on the phase's cadence alone, as the play found it.
    broke: 'a head’s gap ignored, so each head throws on the round’s cadence alone',
    guard: 'THE REPORTED ONE, IN SECONDS: on every tier and at every round of heads',
    edit: {
      path: 'src/app/boss.ts',
      find: '      if (head.gap !== undefined) boss.fireIn += onFireGrid(head.gap);',
      replace: '      if (head.gap === undefined) boss.fireIn += onFireGrid(0);',
    },
  },
];
