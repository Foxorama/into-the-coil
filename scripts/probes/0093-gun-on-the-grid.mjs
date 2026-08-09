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
  {
    decision: '0093',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE LADDER PUT BACK OFF THE GRID, which is the defect exactly as it shipped — 9, 8, 7, 5, 4
      steps, of which one divided the old beat and none divides this one. Written here as the
      subdivisions that produce it, because that is the shape the ladder has now.

      The point of this probe is that it was INVISIBLE. Every guard over the weapon stayed green
      through it for as long as the game has had a gun: the rungs were distinct, monotonic, inside
      both floors and inside the pool. Nothing anywhere asked whether they were in time with
      anything, because until this decision nothing had a reason to.
    */
    broke: 'the fire ladder authored off the beat again, so the gun walks on and off the music',
    guard: 'and every rung is a whole number of steps AND a musical fraction of a beat',
    edit: {
      path: 'src/content/ships.ts',
      find: '    firePerBeat: [3, 3, 4, 4, 6],',
      replace: '    firePerBeat: [2.667, 3, 3.429, 4.8, 6],',
    },
  },
  {
    decision: '0093',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ A RUNG THAT DIVIDES THE BEAT BUT NOT THE LOOP. This is the failure the divisor check cannot
      see and the reason the player-unit guard is written over a whole loop instead: five volleys to a
      beat is a real musical value — a quintuplet — and it is on the grid by any reasonable reading.
      It also does not close with a two-bar loop, so the gun and the music come back together every
      FIVE loops rather than every one, and the phrase drifts inside itself.

      ⚠️ It is a quintuplet rather than nonsense on purpose: the plausible mistake here is a ladder
      authored by somebody who checked the beat and not the bar.
    */
    broke: 'a rung that closes with the beat but not with the loop, so the phrase drifts inside itself',
    guard: 'THE ASK, in the unit the player hears: the gun closes with the music every single loop',
    edit: {
      path: 'src/content/music.ts',
      find: 'export const STEPS_PER_BEAT = 24;',
      replace: 'export const STEPS_PER_BEAT = 20;',
    },
  },
  {
    decision: '0093',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE TEMPO TAKEN OFF THE STEP CLOCK, which is 0090's own tempo and was correct until this
      decision. 0.45s is 27 sim steps — a whole number, so it passes — and 0.4667s is 28.002, which is
      not. The break is the general failure rather than the specific old value: a beat that is not a
      whole number of steps is a gun that cannot be put in time at ANY cadence, because the gap
      between volleys is counted in steps and nothing else.

      ⚠️ 0090's own probe breaks the same constant for a different reason — a loop length that does
      not divide the sample rate. Two decisions, two failures, one number: worth knowing before
      assuming one of them is a copy.
    */
    broke: 'the beat taken off the sim clock, so no cadence can be a whole number of steps',
    guard: 'and the tempo is a whole number of sim steps, which is what makes any of it possible',
    edit: {
      path: 'src/content/music.ts',
      find: 'export const BEAT_SECONDS = 0.4;',
      replace: 'export const BEAT_SECONDS = 0.4667;',
    },
  },
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
      path: 'src/content/ships.ts',
      find: '    barrels: [1, 2, 3, 4, 4],',
      replace: '    barrels: [1, 2, 3, 3, 4],',
    },
  },
];
