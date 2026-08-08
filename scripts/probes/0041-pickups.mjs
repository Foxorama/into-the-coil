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
      /*
        ⚠️ RE-ANCHORED TWICE, AND THE SECOND TIME TAUGHT SOMETHING. It removed one of approach's four
        `spread` pickups out of twenty-four; 0082 pointed it at one of three weapons; 0083 gave a level
        two missiles as well, and **removing a middle weapon stopped reddening this guard at all** —
        the missiles now sit in the gaps, so the worst stretch went from 94 seconds to 49 and the
        ceiling is 55.

        ⚠️ So the break is the LAST upgrade in the level, which leaves the run to the boss with nothing
        in it: 71 seconds from the last missile at 3,800 to the boss at 6,350. That is the defect the
        guard is actually about — a player who dies late flies the hardest stretch with the base weapon
        — and the middle-of-the-level version had quietly stopped being it.
      */
      find: "  { at: 4600, kind: 'weapon', lane: 50 },\n",
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
      // ⚠️ Re-anchored by 0082: the floor used to sit inside a `rapid` arm and now sits in the merged
      // ladder's only arm. Same edit, same guard, one fewer branch around it.
      find: '  const fireEvery = rung(ship.fireEvery, FASTEST_FIRE, gun);',
      replace: '  const fireEvery = rung(ship.fireEvery, 1, gun);',
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
      // ⚠️ Anchored on the UPGRADES line rather than on the whole returned literal, which is what it
      // was and what went stale the day 0053 turned the arm into a multi-line object. The twelve-space
      // indent is the `lifeLost` arm; `begin` has the same field at eight.
      find: '            upgrades: [],\n            difficulty: state.difficulty,',
      replace: '            upgrades: state.upgrades,\n            difficulty: state.difficulty,',
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
      // ⚠️ Re-expressed when 0056 gave collection a reach of its own. The break is unchanged and the
      // temptation it models is now STRONGER, not weaker: with a named scale already on this line,
      // multiplying the assist into it reads even more like consistency than passing `1` did.
      // ⚠️ The `if (flying)` is 0079's death-beat gate, and it is carried through the break rather
      // than dropped: removing it here would redden the wrong guard, on the wrong decision.
      find: '    if (flying) collectInto(w.pickups, w.ship, COLLECT_REACH, w.collected);',
      replace: '    if (flying && w.ship.invulnFor <= 0) collectInto(w.pickups, w.ship, w.tuning.hurtbox, w.collected);',
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
      // ⚠️ Re-anchored by 0082, which cut six pickups to three. The temptation is unchanged and the
      // stakes are higher: with only three faces left, giving two of them one silhouette makes a
      // third of the game's pickups unreadable rather than a sixth.
      find: '    sprite: SPRITE.pickupBomb,\n    spriteHit: SPRITE.pickupBomb,',
      replace: '    sprite: SPRITE.pickupShield,\n    spriteHit: SPRITE.pickupShield,',
    },
  },
];
