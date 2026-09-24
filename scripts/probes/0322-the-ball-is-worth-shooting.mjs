// The ball is worth shooting — docs/decisions/0322-the-ball-is-worth-shooting.md
//
// Every guard 0322 adds, broken on purpose. `node scripts/prove-guard.mjs 0322`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0322',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE STATE OF `main` BEFORE THIS DECISION, IN ONE LINE.** The growth was a step per BITE — a
      constant tuned on a six-point void and applied to a thirty-point ball — so how big the ball got was
      chosen by the player's rate of fire. Put back here as the same constant this file's own 0291 probe
      still names on the void's row, so what reddens is the claim and not an arithmetic slip.
    */
    broke: 'the swell put back to a step per bite, so the weakest gun makes the biggest wall again',
    guard: 'THE REPORTED ONE: how big a fed ball gets is what it ATE',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const swell = row.swallows!.swell ** (damage / row.health);',
      replace: '  const swell = 1.1;',
    },
  },
  {
    decision: '0322',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **AND THE CEILING IN WORLD UNITS, BROKEN FROM THE CONTENT SIDE.** The guard above holds that the
      size is a function of what was eaten; this one holds that what the row asks for is a thing the player
      can fly around. A row is what an author touches, so a row is where this break belongs — and at 4 the
      ball reaches 28.8 units across a hundred-unit lane, which is four ship-widths of wall.
    */
    broke: 'the ball asking to be four times its own size when fed, which is a wall across the lane',
    guard: 'and a fed ball is a TARGET rather than a wall',
    edit: {
      path: 'src/content/shots.ts',
      find: '    swallows: { swell: 1.5 },',
      replace: '    swallows: { swell: 4 },',
    },
  },
  {
    decision: '0322',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE APPETITE PUT BACK TO WHAT SHIPPED.** Thirty points is four seconds of the opening gun against
      a flight of two and a half, so the ball reaches the ship with damage still in it — which is the report
      this decision is named for, and the bar 0311 wrote down for itself and never drove.

      ⚠️ **Re-anchored by 0364, and THIRTY NO LONGER FAILS THE BAR.** The serpent's station moved out by a
      fifth, so the ball flies 128.8 units to the ship: the opening gun empties a thirty at step 185 of a
      202-step flight on every tier, and the named guard stayed green (the ATE guard went red instead, on
      its own fixture: 15 is not a whole number of bites of 2 or 6). At 36 the ball reaches the ship full
      on every tier, and 18 is whole in every bite the ATE guard feeds, so only the claim reddens.
    */
    broke: 'the appetite at thirty-six, so the opening gun cannot empty a ball before it arrives',
    guard: 'THE REPORTED ONE: the OPENING gun clears a ball before it reaches the ship',
    edit: {
      path: 'src/content/shots.ts',
      // ⚠️ Re-anchored by 0324, which took the appetite to 13.2 — *"about 10% more health."*
      find: '    radius: 3.6,\n    health: 13.2,',
      replace: '    radius: 3.6,\n    health: 36,',
    },
  },
  {
    decision: '0322',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE MECHANISM, TAKEN OUT WHILE THE ROW GOES ON ASKING FOR IT.** This is the half `fireEvery` cannot
      buy: with the line gone the phase still says `gap: 24` and the void still lands on the spray's last
      globe, because a sweep's hold is a floor and the cadence is what it floors. A probe on the ROW would
      prove the row is read; this proves the gap is SPENT.
    */
    broke: 'the head’s gap never added, so the round moves on the instant the spray stops',
    guard: 'and the void gets a lane the spray has LEFT',
    edit: {
      path: 'src/app/boss.ts',
      find: '      if (head.gap !== undefined) boss.fireIn += onFireGrid(head.gap);',
      replace: '',
    },
  },
  {
    decision: '0322',
    suite: 'tests/serpent.test.ts',
    // And the row's own side of it: the acid head stops asking for room, which is the authored half.
    broke: 'the acid head’s gap taken off the row, so the void follows the spray with no lane between them',
    guard: 'and the void gets a lane the spray has LEFT',
    edit: {
      path: 'src/content/bosses.ts',
      /*
        ⚠️ Re-anchored by 0324: the hurt phase has TWO acid heads now and they are the same line, so the
        line alone appears twice. The void head below it is what makes the first one — the one this
        guard's own fixture measures, at `headAt` 0 — the unique half of the pair.
      */
      find: "globes: 21, every: 3 }, cue: 'bossAcid', gap: 24 },\n            { shot: 'void', attack: { kind: 'spray' }, cue: 'bossVoid' },",
      replace: "globes: 21, every: 3 }, cue: 'bossAcid' },\n            { shot: 'void', attack: { kind: 'spray' }, cue: 'bossVoid' },",
    },
  },
  {
    decision: '0322',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **AND THE OPENING'S OWN COUNT, BOTH WAYS ROUND.** The ask is *"slightly fewer acid balls, then
      increase them"*, so what is held is the PAIR: five while whole is the state that was reported, and the
      guard has to see it.
    */
    broke: 'the opening phase back at five globes, so the arc no longer grows as the animal is hurt',
    guard: 'THE REPORTED ONE: whole, it throws a forward arc',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ The spread is in the anchor because another boss opens at 78 with three shots as well.
      find: "{ upTo: 1, fireEvery: 78, shots: 3, spread: 0.9,",
      replace: "{ upTo: 1, fireEvery: 78, shots: 5, spread: 0.9,",
    },
  },
];
