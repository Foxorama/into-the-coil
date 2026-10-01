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
    // ⚠️ Re-titled by 0441: the guard walks the tube rungs in every ship, against each ship's own gun.
    guard: 'THE COUNTER-BEAT: the missile crosses the gun at every tube rung, in every ship',
    edit: {
      path: 'src/content/pickups.ts',
      find: 'export const MISSILE_BEAT_RATIO = 5;',
      replace: 'export const MISSILE_BEAT_RATIO = 4;',
    },
  },
  /*
    ⚠️ `the barrels interpolated again, so the tier that cannot buy rate buys nothing at all` WAS
    HERE, and it is retired with its subject: docs/decisions/0441-a-pilot-flies-their-own-ship.md
    took the gun's ladder, so there is no tier of barrels left to collapse into its neighbour. THE
    TIERS in tests/missiles.test.ts walks the tubes now, which are the one ladder left.
  */
];
