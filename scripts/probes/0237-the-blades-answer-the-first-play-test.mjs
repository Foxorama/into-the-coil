// The blades answer the first play-test — docs/decisions/0237-the-blades-answer-the-first-play-test.md
//
// Every guard 0237 adds, broken on purpose. `node scripts/prove-guard.mjs 0237`.

export const PROBES = [
  {
    decision: '0237',
    suite: 'tests/blades.test.ts',
    /*
      ⚠️ THE EDGE NO LONGER ENDS A BLADE, so a spiral wider than the lane leaves by one edge and
      comes back in by another — and is drawn beyond the edge in between. Nothing else ends it until
      the pool's own cull forty units outside the lane.
    */
    broke: 'the edge of the screen no longer ending a blade, so it leaves by one edge and comes back by another',
    guard: 'THE WHIRLPOOL: a blade is on the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: '      w.playerShots.releaseAt(i);\n      continue;\n    }\n    b.velAlong = along - b.along;',
      replace: '      // (the edge no longer ends it)\n    }\n    b.velAlong = along - b.along;',
    },
  },
  {
    decision: '0237',
    suite: 'tests/blades.test.ts',
    /*
      ⚠️ 0234'S CLOCK PUT BACK, so a blade is spent a second after it is thrown — a third of the way
      to the edge, wherever that leaves it. The reported picture, restored exactly.
    */
    broke: 'the blade’s own clock restored, so it vanishes a third of the way to the edge',
    guard: 'THE WHIRLPOOL: a blade is on the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: '  blade.lifeFor = 0;',
      replace: '  blade.lifeFor = 60;',
    },
  },
  {
    decision: '0237',
    suite: 'tests/blades.test.ts',
    // The ladder authored flat, so a rung buys a fire-rate step and nothing about the spiral.
    broke: 'the spiral wound the same at every rung, so an upgrade buys no more of a turn',
    guard: 'THE LADDER: a rung is more of a turn',
    edit: {
      path: 'src/content/weapons.ts',
      find: '    orbit: [70, 100, 130, 160, 190],',
      replace: '    orbit: [70, 70, 70, 70, 70],',
    },
  },
];
