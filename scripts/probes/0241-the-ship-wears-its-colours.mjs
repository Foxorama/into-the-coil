// The ship wears its colours — docs/decisions/0241-the-ship-wears-its-colours.md
//
// Every guard 0241 adds, broken on purpose. `node scripts/prove-guard.mjs 0241`.

export const PROBES = [
  {
    decision: '0241',
    suite: 'tests/thrust.test.ts',
    // The climb frames pointed at the level bitmaps: a lean that changes nothing on the screen.
    broke: 'the idle’s climb frames given its level bitmaps, so a climb shows a level flame',
    guard: 'every thrust row has frames and a trail',
    edit: {
      path: 'src/content/exhaust.ts',
      find: '      climb: [SPRITE.thrustIdle0Climb, SPRITE.thrustIdle1Climb],',
      replace: '      climb: [SPRITE.thrustIdle0, SPRITE.thrustIdle1],',
    },
  },
  {
    decision: '0241',
    suite: 'tests/seekers.test.ts',
    // The seeker back in the ship's ink — the reported picture, restored exactly.
    broke: 'the seeker drawn in the ship’s ink again, so it is the third blue thing',
    guard: 'THE TWO TUBES: a seeker is told from a missile',
    edit: {
      path: 'src/render/bake.ts',
      find: "  seeker: 'ally',",
      replace: "  seeker: 'player',",
    },
  },
];
