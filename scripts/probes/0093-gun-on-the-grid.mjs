// The breaks behind docs/decisions/0093-the-gun-is-on-the-grid.md.
//
// ⚠️ THE ONE THAT IS NOT HERE is "the music left at 133⅓ BPM". There is no edit that stages it as a
// FAILURE: 27 steps a beat is a perfectly valid tempo and every guard in the repository was green
// with it — that is the whole point of the decision. What it costs is a fire ladder with three rungs
// and a 3× hole in it, and "the ladder you could have had" is an argument rather than a red test.
// The tempo IS reachable through the loop guard below, which is the honest version: a beat that is
// not a whole number of sim steps fails, and that is the property the gun actually depends on.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  /*
    ── THREE PROBES STOOD HERE AND 0159 RETIRED THEM WITH THE GUARDS THEY NAMED ──────────────────

    ⚠️ docs/decisions/0159-the-two-clocks-come-apart.md. They broke: the fire ladder authored off the
    beat, a rung that closes with the beat but not with the loop, and the tempo taken off the step
    clock. All three were real and all three went red on demand; what they held is the COUPLING —
    a cadence must divide a beat, and a beat must be a whole number of sim steps — and that is what
    0159 removes on purpose.

    ⚠️ A PROBE WHOSE GUARD HAS BEEN DELETED CANNOT BE RE-ANCHORED, ONLY RETIRED. Leaving one aimed
    at a test that no longer exists is the orphan docs/decisions/0019-a-probe-must-be-seen-to-apply.md
    is written about, wearing the disguise of a probe that used to work.

    ⚠️ THE TWO BELOW SURVIVE BECAUSE THEIR CLAIMS DO: the missile's counter-rhythm against the pulse,
    and every tier of the barrel ladder buying something. Neither was ever a claim about the music.
    The break that replaced the first of the three is in scripts/probes/0159-the-two-clocks-come-apart.mjs.
  */
  {
    decision: '0093',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE MISSILE GIVEN ITS OWN LADDER AGAIN. This is the state the game shipped in and it is the
      one that looks most like good design: two weapons, two independently tunable cadences. What it
      cost was invisible — the 5:1 counter-beat the play-test praised was an accident of two
      interpolations starting five apart, and any tune to either ladder would have dissolved it
      without a single test noticing.

      Broken as a ratio of 4, which is a perfectly sensible number and lands the missile ON the
      pulse's own subdivisions instead of across them. That is the point: the failure is not an
      absurd value, it is a reasonable one.
    */
    broke: 'the missile put on a ratio that lands on the pulse’s beats instead of across them',
    guard: 'THE COUNTER-BEAT: the missile is an exact ratio of the pulse at every rung, and was an accident',
    edit: {
      path: 'src/content/pickups.ts',
      find: 'export const MISSILE_BEAT_RATIO = 5;',
      replace: 'export const MISSILE_BEAT_RATIO = 4;',
    },
  },
  {
    decision: '0093',
    // ⚠️ The guard lives with the LADDERS rather than with the grid — `every upgrade is worth taking`
    // in `tests/pickups.test.ts` compares the base against one upgrade and would not see two middle
    // tiers collapsing into each other. A first draft pointed there and `npm run prove` reported
    // STILL GREEN.
    suite: 'tests/missiles.test.ts',
    /*
      ⚠️ THE BARRELS PUT BACK TO WHAT `rung(1, MAX_BARRELS, gun)` PRODUCED — 1, 2, 3, 3, 4. That was
      correct while the cadence moved at every tier, and it is not now: the rate can only step where
      the beat has a subdivision, so tiers 2 and 3 share one. With the old barrels beside it they
      would share a WEAPON, and `docs/game.md`'s *every upgrade is worth taking* would be false for
      the third weapon pickup of a run.

      ⚠️ This is the coupling the decision is most likely to be broken by later, because the two
      ladders look independent and are not.
    */
    broke: 'the barrels interpolated again, so the tier that cannot buy rate buys nothing at all',
    guard: 'THE TIERS: each ladder is exactly UPGRADE_TIERS long, and every tier changes something',
    edit: {
      // ⚠️ Re-anchored by 0233: the ladder is the weapon kind's now, not the ship's.
      path: 'src/content/weapons.ts',
      find: '    barrels: [1, 2, 3, 4, 4],',
      replace: '    barrels: [1, 2, 3, 3, 4],',
    },
  },
];
