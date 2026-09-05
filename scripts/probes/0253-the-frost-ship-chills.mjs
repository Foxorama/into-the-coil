// The frost ship chills — docs/decisions/0253-the-frost-ship-chills.md
//
// Every guard 0253 adds, broken on purpose. `node scripts/prove-guard.mjs 0253`.

export const PROBES = [
  {
    decision: '0253',
    suite: 'tests/frost.test.ts',
    // The frost inked as the enemy's bullet.
    broke: 'the frost drawn in the enemy’s bullet ink',
    guard: 'THE FROST: a shard between the acid and the rock',
    edit: {
      path: 'src/render/bake.ts',
      find: "  frost: 'frost',",
      replace: "  frost: 'enemy',",
    },
  },
  {
    decision: '0253',
    suite: 'tests/frost.test.ts',
    // The slow never applied: the cold is a number nobody reads.
    broke: 'the slow never applied to the stick, so the cold is a number nobody reads',
    guard: 'THE COLD, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.intent.along *= chill.slow;\n  w.intent.across *= chill.slow;\n',
      replace: '',
    },
  },
  {
    decision: '0253',
    suite: 'tests/frost.test.ts',
    // The steps inside never counted: no freeze, ever.
    broke: 'the steps inside the cold never counted, so the ship never freezes',
    guard: 'THE COLD, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.chilledFor++;\n  if (w.chilledFor >= chill.freezeAfter) {',
      replace: '  if (w.chilledFor >= chill.freezeAfter) {',
    },
  },
  {
    decision: '0253',
    suite: 'tests/frost.test.ts',
    // A frozen ship still answering the stick: a freeze that is a word.
    broke: 'a frozen ship still answering the stick, so the freeze is a word',
    guard: 'THE COLD, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '    w.frozenFor--;\n    w.intent.along = 0;\n    w.intent.across = 0;\n    return;',
      replace: '    w.frozenFor--;\n    return;',
    },
  },
  {
    decision: '0253',
    suite: 'tests/frost.test.ts',
    // Leaving the cold not clearing the count: a ship that dipped in and out freezes on its next visit at once.
    broke: 'leaving the cold not clearing the count, so a ship freezes on its next visit at once',
    guard: 'THE COLD, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (dAlong * dAlong + dAcross * dAcross > chill.radius * chill.radius) {\n    w.chilledFor = 0;\n    return;\n  }',
      replace: '  if (dAlong * dAlong + dAcross * dAcross > chill.radius * chill.radius) {\n    return;\n  }',
    },
  },
  {
    decision: '0253',
    suite: 'tests/frost.test.ts',
    // The adds called from the wrong table: raptors on the Rime Shelf.
    broke: 'the adds authored as raptors rather than the Rime Shelf’s own enemy',
    guard: 'THE ADDS AND THE BLASTS',
    edit: {
      path: 'src/content/bosses.ts',
      find: "attack: { kind: 'summon', enemy: 'shard', count: 2, formation: 'vee' } },",
      replace: "attack: { kind: 'summon', enemy: 'raptor', count: 2, formation: 'vee' } },",
    },
  },
  {
    decision: '0253',
    suite: 'tests/frost.test.ts',
    // The puff not thrown: a slowed ship looks like a slow player.
    broke: 'the puff of frost not thrown, so a slowed ship looks like a slow player',
    guard: 'THE PICTURE: a ship in the cold puffs',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.chilledFor % CHILL_PUFF_EVERY === 0) burst(w, w.ship.along, w.ship.across, BURST.chill);\n',
      replace: '',
    },
  },
];
