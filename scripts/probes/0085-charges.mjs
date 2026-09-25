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
    // ⚠️ Renamed with the guard by 0266, which took the rung out of the death rule. `anchorFailures`
    // cannot see a rename — the probe's own anchor still resolves — so `npm run prove` reporting
    // NOTHING WAS PROVEN is the only thing that could have said so, and did.
    // ⚠️ Renamed again by 0372, which keeps the ladders through a death as well as the charges.
    guard: 'a death costs the life and nothing else: both ladders, both kinds and the arsenal stay',
    edit: {
      path: 'src/state/slices/run.ts',
      // Anchored on the ARSENAL line rather than on the whole returned literal, for the reason
      // 0042's probe gives: a literal goes stale the day a field is added to it, and two have been.
      // The twelve-space indent is the `lifeLost` arm; `continued` has the same pair at eight.
      find: '            arsenal: state.arsenal,\n            upgrades: state.upgrades,',
      replace: '            arsenal: startingArsenal(),\n            upgrades: state.upgrades,',
    },
  },
  /*
    ⚠️ `the continue keeping the arsenal too` WAS HERE, and it is the rule now — 0372: *"keep them
    all."* The break against it, a continue that resets the charges, is in
    `scripts/probes/0372-a-death-keeps-the-ladders.mjs`.
  */
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
      find: '            arsenal: state.arsenal,\n            upgrades: state.upgrades,',
      replace:
        '            arsenal: state.arsenal.map((e) => ({ kind: e.kind, charges: Math.max(e.charges, SPECIALS[e.kind].charges) })),\n            upgrades: state.upgrades,',
    },
  },
];
