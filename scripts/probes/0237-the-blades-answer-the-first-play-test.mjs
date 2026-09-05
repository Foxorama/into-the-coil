// The blades answer the first play-test — docs/decisions/0237-the-blades-answer-the-first-play-test.md
//
// Every guard 0237 adds, broken on purpose. `node scripts/prove-guard.mjs 0237`.

export const PROBES = [
  {
    decision: '0237',
    suite: 'tests/blades.test.ts',
    /*
      ⚠️ A probe stood here — THE EDGE NO LONGER ENDS A BLADE, so a spiral wider than the lane leaves
      by one edge and comes back in by another — and 0242 retired it: a blade coils up the lane now
      and starts at the top of its loop, so the furthest across it ever gets is where it was thrown,
      and the only edge it can meet is the leading one, which the pool's own cull holds as well.
      The break no longer produces the defect, and a probe that reddens nothing proves nothing.
    */
    /*
      ⚠️ 0234'S CLOCK PUT BACK, so a blade is spent a second after it is thrown — a third of the way
      to the edge, wherever that leaves it. The reported picture, restored exactly.
    */
    broke: 'the blade’s own clock restored, so it vanishes a third of the way to the edge',
    // ⚠️ Re-aimed by 0242: `THE WHIRLPOOL` became `THE EDGE` when the ring became a coil.
    guard: 'THE EDGE: a blade is on the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: '  blade.lifeFor = 0;',
      // ⚠️ Forty and not sixty since 0240: on a ring centred ahead of the ship, sixty steps happens
      // to end a first-rung blade a step from the edge behind, which is the picture the guard allows.
      replace: '  blade.lifeFor = 40;',
    },
  },
  {
    decision: '0237',
    suite: 'tests/blades.test.ts',
    // The ladder authored flat, so a rung buys a fire-rate step and nothing about the spiral.
    broke: 'the loop the same size at every rung, so an upgrade buys no more band',
    guard: 'THE LADDER: a rung is a wider band',
    // ⚠️ Re-anchored by 0239 and 0240 as the spiral was rewound, and re-aimed by 0242: the ladder
    // is the loop's radius now, and a rung buys a wider band rather than more of a turn.
    edit: {
      path: 'src/content/weapons.ts',
      find: '    coil: [7, 9, 12, 15, 18],',
      replace: '    coil: [7, 7, 7, 7, 7],',
    },
  },
];
