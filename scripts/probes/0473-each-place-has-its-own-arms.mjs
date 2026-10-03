// Each place has its own arms — docs/decisions/0473-each-place-has-its-own-arms.md
//
// Every guard 0473 adds or moves, broken on purpose. `node scripts/prove-guard.mjs 0473`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0473',
    suite: 'tests/arms.test.ts',
    // The report, put back in one place: the Rime Shelf's turret throws the Approach's slabs again.
    broke: 'the Rime Shelf turret armed with the slab every place threw',
    guard: 'THE REPORTED ONE: no two places arm a shared kind',
    edit: {
      path: 'src/content/arms.ts',
      find: "    turret: { shot: 'hail', attack: { kind: 'spray', shots: 3, spread: 0.6 }, fireEvery: 72 },",
      replace: "    turret: { shot: 'flak', attack: { kind: 'spray', shots: 3, spread: 0.6 }, fireEvery: 72 },",
    },
  },
  {
    decision: '0473',
    suite: 'tests/arms.test.ts',
    // The table is right and the game never reads it: a level boundary that keeps the last place's rows.
    broke: 'a level crossed into without its place’s rows',
    guard: 'THE FRAME SWAPS THEM, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: "  // What the place's raiders throw — 0473.\n  w.enemyRows = ROWS_OF[level.theme];",
      replace: "  // What the place's raiders throw — 0473.\n  void ROWS_OF;",
    },
  },
  {
    decision: '0473',
    suite: 'tests/arms.test.ts',
    // A stream whose shots all keep one speed: one bullet drawn on top of another, which is a lie.
    broke: 'a stream whose shots all leave at one speed',
    guard: 'and a stream is one heading, each shot slower',
    edit: {
      path: 'src/app/frame.ts',
      find: '          const pace = speed * (1 - attack.lag * s);',
      replace: '          const pace = speed;',
    },
  },
  {
    decision: '0473',
    suite: 'tests/signature.test.ts',
    // The first draft, which the moved guard caught: the crocodile throws its tooth at the ship, as the minnow does.
    broke: 'the Saurian lancer throwing a spine at the ship, which is the minnow’s',
    guard: 'and a firing signature sends a bullet-and-pattern no other kind sends',
    edit: {
      path: 'src/content/arms.ts',
      find: "    lancer: { shot: 'spine', attack: { kind: 'spray', shots: 1, spread: 0 }, fireEvery: 102 },",
      replace: "    lancer: { shot: 'spine', attack: { kind: 'aimed' }, fireEvery: 102 },",
    },
  },
];
