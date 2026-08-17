// The breaks behind docs/decisions/0094-in-time-is-not-in-phase.md.
//
// ⚠️ THE ONE THAT IS NOT HERE is "the music told the sim where the beat is". It is the design this
// decision most obviously invites — align the GUN to the audio clock rather than the audio to the
// sim — and there is no edit that stages it, because it is not a line: it is an import edge from the
// shell into `src/app/frame.ts` that would make a player with the sound off fly a different game.
// docs/decisions/0024-the-accessibility-floor-is-settings.md forbids it and
// docs/decisions/0015-the-layer-ladder.md would not allow the arrow. The decision carries it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0094',
    suite: 'tests/combat.test.ts',
    /*
      ⚠️ THE RELOAD PUT BACK TO A CADENCE, which is the code as it shipped and is the correct way to
      write a metronome if all you want is a tempo. It keeps the interval between volleys exact
      forever; what it does not keep is WHERE those volleys sit in the bar, and every guard 0093
      landed stays green through it because every one of them is about the rate.
    */
    broke: 'the fire clock reloaded to its cadence again, so the gun keeps time at an arbitrary phase',
    guard: 'THE ASK: every volley lands on a multiple of its own cadence, counted from the run’s origin',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.fireIn = stepsToGrid(w.steps, w.weapon.fireEvery);\n  const row = SHOTS[w.shipRow.shot];',
      replace: '  w.fireIn = w.weapon.fireEvery;\n  const row = SHOTS[w.shipRow.shot];',
    },
  },
  {
    decision: '0094',
    suite: 'tests/combat.test.ts',
    /*
      ⚠️ THE RESPAWN ALONE PUT BACK, and it is the half most likely to be missed by a reader fixing
      the one above. A death is the single moment in a run guaranteed to land at an arbitrary place
      in the bar, so this is where the phase actually goes — and it is the most repeated event in a
      level. The gun would be on the grid for the first life and off it for the rest of the run.
    */
    broke: 'a respawn restarting the fire clock, so the phase is wherever the player happened to die',
    guard: 'and a DEATH rejoins the grid rather than restarting it, which is where the phase used to go',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.fireIn = stepsToGrid(w.steps, w.weapon.fireEvery);\n  w.missileIn = stepsToGrid(w.steps, w.weapon.missileEvery);',
      replace: '  w.fireIn = w.weapon.fireEvery;\n  w.missileIn = w.weapon.missileEvery;',
    },
  },
  {
    decision: '0094',
    suite: 'tests/combat.test.ts',
    /*
      ⚠️ THE STEP COUNTER TICKING ON A STEP THE GAME IS NOT STEPPING. It reads as a tidy-up — a clock
      should count steps, and `step()` was called — and it advances the beat while the death beat is
      holding the world still, so the grid the gun rejoins after a respawn is one the music was never
      on. The counter has to mean *steps of the GAME*.
    */
    broke: 'the sim clock counting steps in which nothing moved, so a held world still advances the beat',
    guard: 'and the clock counts the steps the GAME ran, which is not the same as the steps called',
    edit: {
      path: 'src/app/frame.ts',
      find: '    w.steps++;\n    w.prevCameraAlong = w.cameraAlong;',
      replace: '    w.prevCameraAlong = w.cameraAlong;',
    },
  },
  /*
    ── THREE PROBES STOOD HERE AND 0160 RETIRED THEM WITH THEIR GUARDS ─────────────────────────

    docs/decisions/0160-the-music-free-runs.md. They broke the loop wrap, the boundary landing and
    the settling rule — all three inside rephaseIn, all three red on demand, and all three aimed at
    guards that no longer exist. The function corrected the music towards the SIM step clock, and
    docs/decisions/0159-the-two-clocks-come-apart.md stopped that being a clock the music shares.

    ⚠️ THE THREE ABOVE SURVIVE BECAUSE THEIR SUBJECT IS THE GUN, NOT THE MUSIC: the reload landing
    on its own cadence from the run origin, a death rejoining that lattice rather than restarting
    it, and the sim clock counting only steps the game ran. None of them was ever a claim about a
    beat, which is why 0159 left them standing and 0160 leaves them standing too.
  */
];
