// The breaks behind docs/decisions/0085-a-death-does-not-cost-the-bombs.md.
//
// ⚠️ THE WHOLE DECISION IS ONE EXPRESSION ON ONE LINE, and every wrong version of it is a working
// game. A death that restocks, a death that keeps, a death that tops up and a continue that keeps are
// four readings of *"bombs should be reset on a continue, but not on player death"*, and only one of
// them is the ask. What separates them is which of two arms of one reducer the restock lives in, so
// the probes below are all edits to that expression: the guards have to tell the four apart, and
// until 0085 they could not — every death restocked, so the continue's own line was a copy of the
// line above it and a fixture reaching the run-over screen was already holding what it was about to
// be handed.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0085',
    suite: 'tests/run.test.ts',
    /*
      ⚠️ THE REPORTED DEFECT, PUT BACK. This is the shipped behaviour of every build up to 0084 and it
      is `scripts/probes/0039-run.mjs`'s deleted probe run in the other direction — 0039's rule was
      that a death goes back to the starting kit, and the play-test that produced 0085 is a hand
      saying that the charges are not what a death should cost.
    */
    broke: 'the restock put back on a death, so a run’s banked charges never survive one',
    // ⚠️ Renamed by 0256: a death costs one rung of the ladder now, and the guard says so.
    guard: 'a death costs one rung per ladder, keeps the gun, and leaves the arsenal exactly where it was',
    edit: {
      path: 'src/state/slices/run.ts',
      // Anchored on the ARSENAL line rather than on the whole returned literal, for the reason
      // 0042's probe gives: a literal goes stale the day a field is added to it, and two have been.
      find: '            arsenal: state.arsenal,\n            upgrades: afterDeath(state.upgrades),',
      replace: '            arsenal: startingArsenal(),\n            upgrades: afterDeath(state.upgrades),',
    },
  },
  {
    decision: '0085',
    suite: 'tests/continue.test.ts',
    /*
      ⚠️ THE OTHER HALF OF THE SENTENCE, AND IT IS THE HALF A TIDY-UP WOULD DELETE. With the restock
      gone from the death arm, `continued` and `lifeLost` differ by one field — so making the continue
      carry the arsenal too looks like removing a duplicated decision rather than deleting the only
      thing the ask asked to be reset. A run would then be continuable with an arsenal it had spent a
      whole run accumulating, which is the free continue getting freer.
    */
    broke: 'the continue keeping the arsenal too, so nothing in the game ever resets the charges',
    guard: 'restocks the run with everything a fresh one carries',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '        lives: livesFor(state.difficulty),\n        level: state.level,\n        arsenal: startingArsenal(),',
      replace: '        lives: livesFor(state.difficulty),\n        level: state.level,\n        arsenal: state.arsenal,',
    },
  },
  {
    decision: '0085',
    suite: 'tests/bombs.test.ts',
    /*
      ⚠️ THE GENEROUS READING, WHICH IS THE ONE THAT WOULD BE WRITTEN IN GOOD FAITH. *Keep what the
      player had* and *never leave them with nothing* sound like the same kindness, and the second
      one hands a ship that died empty the starting two — which is exactly the restock 0085 removed,
      surviving in the only case where anybody would notice it as a gift rather than as a cost.

      ⚠️ It is invisible to a guard that banks charges before dying, because a topped-up arsenal and a
      kept one are the same list whenever the player is above the starting kit. The guard this names
      is the one that empties the arsenal first.
    */
    broke: 'a death topping the arsenal up to the starting kit rather than leaving it alone',
    guard: 'and a death does not TOP UP an arsenal the player has emptied',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '            arsenal: state.arsenal,\n            upgrades: afterDeath(state.upgrades),',
      replace:
        '            arsenal: state.arsenal.map((e) => ({ kind: e.kind, charges: Math.max(e.charges, SPECIALS[e.kind].charges) })),\n            upgrades: afterDeath(state.upgrades),',
    },
  },
];
