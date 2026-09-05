// The breaks behind docs/decisions/0041-a-pickup-is-the-answer-to-what-a-death-costs.md.
//
// ⚠️ Two of these are faults that were IN THE REPOSITORY when this decision was written: the level
// authored in 0040 really did leave a 28-second stretch with nothing to rearm from, and the
// collection path really was one edit away from being routed through the assisted hurtbox. They are
// the real edits rather than invented ones.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  /*
    ── THE PROBE FOR *a level stretch left with nothing to rearm from* WAS HERE ─────────────────────

    It was the one that shipped in 0040, re-anchored twice through 0082 and 0083, and its guard —
    `THE TARGET: a level offers exactly enough weapons to cap the guns` — went with its premise in
    `docs/decisions/0256-a-pickup-keeps-the-count.md`: a death costs one rung now, so a level does
    not have to rearm a player who is never unarmed. What a level authors is 0256's own probe file.
  */
  {
    decision: '0041',
    suite: 'tests/pickups.test.ts',
    // A constant subtraction is the obvious way to write "fires faster", and it reads better than a
    // multiply right up until the sixth one, when the gap between shots is zero.
    broke: 'rapid fire made a constant subtraction, so enough of them reach zero',
    guard: 'never fires faster than a hit can be read',
    edit: {
      // ⚠️ The FLOOR removed, not the factor changed. A first attempt subtracted a constant instead
      // and `npm run prove` reported WRONG TEST: it broke stacking rather than the floor, because the
      // floor still caught it. The break has to be the thing the guard is about.
      // ⚠️ Re-anchored by 0082: the floor used to sit inside a `rapid` arm and now sits in the merged
      // ladder's only arm. Same edit, same guard, one fewer branch around it.
      // ⚠️ AND RE-ANCHORED AGAIN BY 0093, which is the larger move: the cadence is a note value read
      // off the ship's own ladder rather than an interpolation towards `FASTEST_FIRE`, so the floor
      // is no longer a term in an expression that can be edited. The break is now *the ladder
      // authored past the floor* — which is the same failure the guard names, reached from content
      // instead of from arithmetic, and is the honest shape of it now that the rungs are a table.
      // ⚠️ Re-anchored by 0233: the ladder is the weapon kind's now, not the ship's.
      path: 'src/content/weapons.ts',
      find: '    fireEvery: [8, 8, 6, 6, 4],',
      replace: '    fireEvery: [8, 8, 6, 6, 1],',
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
      // ⚠️ Re-anchored by 0233: the arm is a ternary now — the same kind appends, another kind
      // starts the ladder again — and the break is the appending half deduplicated.
      // ⚠️ Re-anchored by 0243: the appended half is `rungs`, the count the pickup was worth.
      // ⚠️ Re-anchored by 0256: one arm again — a switch keeps the count — clamped at the cap.
      find: '      const upgrades = tiersOf(state.upgrades, action.upgrade) < UPGRADE_TIERS ? [...state.upgrades, action.upgrade] : state.upgrades;',
      replace: '      const upgrades = state.upgrades.includes(action.upgrade) ? state.upgrades : [...state.upgrades, action.upgrade];',
    },
  },
  {
    decision: '0041',
    suite: 'tests/run.test.ts',
    // 0039's rule, now that there is a second field for it to be forgotten in. The line above is the
    // arsenal, which is what makes this the plausible miss.
    //
    // ⚠️ RENAMED GUARD TWICE, and `npm run prove` is the only thing that could have said so.
    // `docs/decisions/0085-a-death-does-not-cost-the-bombs.md` inverted the assertion this points at
    // and retitled it with the rule; `anchorFailures` cannot see that, because the probe's own anchor
    // still resolves perfectly. `docs/decisions/0256-a-pickup-keeps-the-count.md` did it again: a
    // death costs a RUNG now, so the break is a death that costs nothing at all.
    broke: 'a death that leaves the whole ladder on the ship',
    guard: 'a death costs one rung per ladder, keeps the gun, and leaves the arsenal exactly where it was',
    edit: {
      path: 'src/state/slices/run.ts',
      // ⚠️ Anchored on the UPGRADES line rather than on the whole returned literal, which is what it
      // was and what went stale the day 0053 turned the arm into a multi-line object. The twelve-space
      // indent is the `lifeLost` arm; `begin` has the same field at eight.
      find: '            upgrades: afterDeath(state.upgrades),',
      replace: '            upgrades: state.upgrades,',
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
