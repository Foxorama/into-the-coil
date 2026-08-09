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
  {
    decision: '0094',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE WRAP REMOVED, so a drift of one whole loop is treated as a drift. It is the line most
      likely to be deleted as pointless by somebody reading `rephaseIn` for the first time — the
      music is a LOOP, so being exactly one behind is being in phase, sample for sample. Without it
      a backgrounded tab returns with tens of seconds of "error" and the correction is a lurch.
    */
    broke: 'the loop wrap removed, so a whole loop of drift reads as drift and a returning tab lurches',
    guard: 'THE TRICK: a whole loop of drift is no drift at all, so a backgrounded tab is a small correction',
    edit: {
      path: 'src/app/music.ts',
      find: '  const error = drift - Math.round(drift / PHRASE_SECONDS) * PHRASE_SECONDS;',
      replace: '  const error = drift;',
    },
  },
  {
    decision: '0094',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE CORRECTION TAKEN OFF THE LOOP BOUNDARY and applied where it was noticed. This is the
      obvious simplification — the error is known, so shift by the error — and it restarts the loops
      mid-phrase, cutting every tail that crosses the join. That is exactly the notch 0090's seam
      guard exists to keep out of the BAKE, arriving at runtime instead, where no bake-time guard can
      see it.
    */
    broke: 'the correction applied where it was noticed rather than at a loop boundary, cutting every tail',
    guard: 'and the correction always lands on a loop boundary, because a loop has no other seam',
    edit: {
      path: 'src/app/music.ts',
      find: '  let delay = PHRASE_SECONDS - (simElapsed % PHRASE_SECONDS);',
      replace: '  let delay = 0;',
    },
  },
  {
    decision: '0094',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE SETTLING RULE REMOVED, which is the allocation ceiling as well as a correctness rule. A
      driven sim races ahead of a standing audio clock and asks for a correction every frame; the
      real loop does a milder version of it whenever `src/app/loop.ts` runs several steps in one
      frame. `tests/sound.browser.test.ts` counted 37 source nodes where it expected 7 — which is how
      this line came to exist.
    */
    broke: 'the settling rule removed, so a sim catching up asks for a correction every frame',
    guard: 'and corrects nothing until the anchor has played a whole loop, which is the allocation ceiling',
    edit: {
      path: 'src/app/music.ts',
      find: '  if (audioElapsed < PHRASE_SECONDS) return null;',
      replace: '  if (audioElapsed < 0) return null;',
    },
  },
];
