// The cold reaches the start — docs/decisions/0484-the-cold-reaches-the-start.md
//
// Every guard 0484 adds or moves, broken on purpose. `node scripts/prove-guard.mjs 0484`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0484',
    suite: 'tests/frost.test.ts',
    // The report, put back: the cold held off the start, so the player never has to move for it.
    broke: 'the cold back at 108, clear of the start',
    guard: 'THE ASKED-FOR ONE, IN NUMBERS',
    edit: {
      path: 'src/content/bosses.ts',
      find: '      reach: 130,',
      replace: '      reach: 108,',
    },
  },
  {
    decision: '0484',
    suite: 'tests/frost.test.ts',
    // The plan's 150: with the hull at the top of the lane, the top-left corner is gone.
    broke: 'the cold at the plan’s 150, over a back corner',
    guard: 'THE ASKED-FOR ONE, IN NUMBERS',
    edit: {
      path: 'src/content/bosses.ts',
      find: '      reach: 130,',
      replace: '      reach: 150,',
    },
  },
  {
    decision: '0484',
    suite: 'tests/crowd.test.ts',
    // The pilot holding the lane it started in, inside a cold that now covers it.
    broke: 'the crowd pilot never falling back from the cold',
    guard: 'THE REPORTED ONE: in every phase of every fight in the game',
    edit: {
      path: 'tests/crowd.test.ts',
      find: 'stick.along = world.bossRow.chill !== null ? -1 : 0;',
      replace: 'stick.along = 0;',
    },
  },
];
