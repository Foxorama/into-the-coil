// The breaks behind docs/decisions/0299-a-shard-is-killable.md.
//
// ⚠️ TWO CLAIMS AND THEY PULL IN OPPOSITE DIRECTIONS, WHICH IS THE WHOLE OF WHY THIS DECISION IS
// SMALL AND STILL NEEDED A DECISION. A shard has to be killable — that is the report — and killing
// one must never make more, which is what the skip it replaces was protecting. A probe for each, and
// the second one restores the bug the old code was written to avoid rather than a hypothetical.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0299',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE SHIPPED BEHAVIOUR, PUT BACK.** The stage skip at the top of `feedVoids` is exactly what
      the report is about: a shard the player's fire passes straight through. One line, and it is the
      line that was there.
    */
    broke: 'the stage skip put back in `feedVoids`, so a shard cannot be shot at all',
    guard: '0299 — THE REPORTED ONE: a SHARD can be killed too',
    edit: {
      path: 'src/app/frame.ts',
      find: '    for (let s = w.playerShots.size - 1; s >= 0; s--) {\n      const shot = w.playerShots.at(s);',
      replace:
        '    if (blast.turnsLeft > 0) continue;\n' +
        '    for (let s = w.playerShots.size - 1; s >= 0; s--) {\n      const shot = w.playerShots.at(s);',
    },
  },
  {
    decision: '0299',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE RECURSION, RESTORED — AND IT IS THE REASON THE OLD SKIP EXISTED.** `spendVoid` bursting
      whatever it is handed is the tidy-up a later reader reaches for: the stage check looks redundant
      beside a function called *burst*, and taking it out gives every shard seven children of its own,
      for ever. The game plays for about four seconds.

      ⚠️ **AND IT IS THE HALF A GUARD ABOUT *CAN A SHARD BE KILLED* CANNOT SEE.** Under this break a
      shard still takes damage and still dies on schedule; what changes is the pool behind it, which
      is why the guard counts what it saw as well as what it killed.
    */
    broke: 'a spent shard bursting like a thrown blast, so a ring can be farmed into a full pool',
    guard: '0299 — THE REPORTED ONE: a SHARD can be killed too',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0311, which reads the spent shot off the pool once and puts its own arm above
      // this one. The line dropped is unchanged: the stage check that stops a shard bursting.
      find: '  if (spent.turnsLeft > 0) {\n    w.enemyShots.releaseAt(index);\n    return;\n  }',
      replace: '',
    },
  },
  /*
    ── ⚠️ THERE IS NO PROBE FOR THE SOFTNESS, AND IT WAS WRITTEN BEFORE IT WAS DELETED ──────────────

    It set `shardAppetite` back to the row's own six and expected the guard to redden. **It would not
    have.** The fixture feeds a shard one pulse a step for `SHOTS.void.health * 3` steps — eighteen
    damage — so a shard at six still dies well inside the window and every assertion still holds. It
    would have reported STILL GREEN, which `scripts/probes/0087-never-parks.mjs` already records the
    cost of: a probe that reddens nothing reads as cover.

    ⚠️ **AND THE HONEST FIX IS NOT TO TIGHTEN THE GUARD UNTIL IT CATCHES THIS.** *A shard is softer
    than a thrown blast* is a tuning number, not an invariant —
    `docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md`'s test asked of it says no, twice
    over: it ranks one thing against another on a single channel, and there is no reason a later
    design may not want a shard that is exactly as tough as what threw it. What holds the third is
    derivation — `shardAppetite` reads the row rather than restating it — and a hand on the game.
  */
];
