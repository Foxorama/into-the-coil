// The breaks behind docs/decisions/0041-a-pickup-is-the-answer-to-what-a-death-costs.md.
//
// ⚠️ Two of these are faults that were IN THE REPOSITORY when this decision was written: the level
// authored in 0040 really did leave a 28-second stretch with nothing to rearm from, and the
// collection path really was one edit away from being routed through the assisted hurtbox. They are
// the real edits rather than invented ones.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0041',
    suite: 'tests/pickups.test.ts',
    // ⚠️ THE ONE THAT SHIPPED. Removing two upgrades leaves a level that still reads as generous —
    // there are nine left — and a player who dies at the wrong moment flies half a minute unarmed.
    broke: 'a level stretch left with nothing to rearm from, which is what 0040 shipped',
    guard: 'never leaves the player unarmed for long',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 4700, kind: 'spread', lane: 40 },\n",
      replace: '',
    },
  },
  {
    decision: '0041',
    suite: 'tests/pickups.test.ts',
    // A constant subtraction is the obvious way to write "fires faster", and it reads better than a
    // multiply right up until the sixth one, when the gap between shots is zero.
    broke: 'rapid fire made a constant subtraction, so enough of them reach zero',
    guard: 'never fires faster than a hit can be read',
    edit: {
      path: 'src/content/pickups.ts',
      // ⚠️ The FLOOR removed, not the factor changed. A first attempt subtracted a constant instead
      // and `npm run prove` reported WRONG TEST: it broke stacking rather than the floor, because the
      // floor still caught it. The break has to be the thing the guard is about.
      find: '      if (faster < FASTEST_FIRE) damage++;\n      else fireEvery = faster;',
      replace: '      fireEvery = faster;',
    },
  },
  {
    decision: '0041',
    suite: 'tests/pickups.test.ts',
    // "Deduplicate the upgrades" is a tidy-looking edit and it silently deletes the stacking rule
    // `docs/game.md` asks for.
    broke: 'the upgrade list deduplicated, so a second of a kind is swallowed by the first',
    guard: 'stacks — the second of a kind is not swallowed by the first',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '        upgrades: [...state.upgrades, action.upgrade],',
      replace: '        upgrades: state.upgrades.includes(action.upgrade) ? state.upgrades : [...state.upgrades, action.upgrade],',
    },
  },
  {
    decision: '0041',
    suite: 'tests/run.test.ts',
    // 0039's rule, now that there is a second field for it to be forgotten in. The arsenal is
    // cleared right there on the line above, which is what makes this the plausible miss.
    broke: 'a death that leaves the weapon upgrades on the ship',
    guard: 'a death clears the arsenal back to base',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '        : { lives: state.lives - 1, level: state.level, arsenal: [], upgrades: [] };',
      replace: '        : { lives: state.lives - 1, level: state.level, arsenal: [], upgrades: state.upgrades };',
    },
  },
  {
    decision: '0041',
    suite: 'tests/pickups.test.ts',
    // ⚠️ The assist rule broken by the obvious code. Every other collision on this line takes
    // `w.tuning.hurtbox`, so passing it here looks like consistency rather than like a regression.
    broke: 'collection run through the assisted hurtbox, so an assist costs the player pickups',
    guard: 'is collectable while the ship is invulnerable',
    edit: {
      path: 'src/app/frame.ts',
      find: '    collectInto(w.pickups, w.ship, 1, w.collected);',
      replace: '    if (w.ship.invulnFor <= 0) collectInto(w.pickups, w.ship, w.tuning.hurtbox, w.collected);',
    },
  },
  {
    decision: '0041',
    suite: 'tests/pickups.test.ts',
    // One sprite for every pickup with the ink doing the work is the version of this that gets
    // written when somebody is adding a fourth kind in a hurry.
    broke: 'two pickups sharing a silhouette, told apart by ink alone',
    guard: 'every kind has its own silhouette',
    edit: {
      path: 'src/content/pickups.ts',
      find: '    sprite: SPRITE.pickupSpread,\n    spriteHit: SPRITE.pickupSpread,',
      replace: '    sprite: SPRITE.pickupRapid,\n    spriteHit: SPRITE.pickupRapid,',
    },
  },
];
