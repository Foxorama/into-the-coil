// The breaks behind docs/decisions/0172-a-place-opens-with-its-own-four.md.
//
// ⚠️ THE ONE THAT WAS FIRST HERE IS RETIRED — docs/decisions/0192-a-guard-holds-an-invariant.md.
// *No two places open on the same four* is what this decision is FOR, and it is still the thing to
// watch — but two places that open alike and diverge later is a legal shape for a level to have, so it
// is a claim rather than a law. `tests/authored.test.ts` measures it and prints it.
//
// ⚠️ THE FIRST REMAINING ONE IS THE DEFECT THIS DECISION FOUND RATHER THAN THE ONE IT FIXED. `rungShape` read
// `MUSIC_LADDER` directly while `paceAt` read the place's own ladder, so the desk and the guard
// disagreed by 27 notes a bar at Ember Nebula's `run` the instant an override existed — and could
// not have disagreed by anything before that. It is `loudestOf`'s twin, and 0168's own guard, which
// exists to hold the desk and the arithmetic together, is what caught it for real.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0172',
    suite: 'tests/themes.test.ts',
    broke: "the shape arithmetic back on the shared ladder, so the desk's pace and the guard's disagree",
    guard: '0168 — THE DESK’S PACE IS THE GUARD’S PACE, layer for layer and rung for rung',
    edit: {
      path: 'tests/pace.ts',
      // ⚠️ RE-ANCHORED BY 0184, WHICH HOISTED THIS LINE OUT OF `rungShape` AND `heardAt` INTO ONE
      // `gainIn`. The claim is unchanged and is now made in one place instead of two — which is the
      // whole of 0184: the copy this probe was pointed at had been corrected and the other had not.
      find: "  return rungOf(theme ?? 'approach', rung, layer) * mixOf(theme ?? 'approach', layer) * ceiling;",
      replace: "  return MUSIC_LADDER[rung][layer] * mixOf(theme ?? 'approach', layer) * ceiling;",
    },
  },
  {
    decision: '0172',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ THE AUDITION READ OFF THE SHARED LADDER, WHICH IS `loudestOf`'S DEFECT IN THE INSTRUMENT
      RATHER THAN IN THE GUARD. `loudestGain` in rig/transport.ts has gone through `targetGain` →
      `rungOf` since the day it was written; the guard that checks it composed the same answer out of
      `MUSIC_LADDER` and `mixOf`, which was a faithful copy while every ladder was absent and a second
      opinion the moment one was not.
    */
    broke: 'the audition guard composing its expectation from the shared ladder rather than the place’s',
    guard: 'an audition is the LOUDEST this place ever takes the layer, off the game’s own tables',
    edit: {
      path: 'tests/dash.test.ts',
      // ⚠️ RE-ANCHORED BY 0189, which split this expectation in two so it could state the fallback
      // for a layer the place closes at every rung. The break is unchanged — the guard composing
      // its answer from the shared row — and it still reddens on `perc`, which Saurian Belt takes
      // to 2.21 where the shared ladder's loudest is 0.96.
      find: '        const own = Math.max(...MUSIC_LEVELS.map((rung) => rungOf(theme, rung, layer)));',
      replace: '        const own = Math.max(...MUSIC_LEVELS.map((rung) => rungIn(undefined, rung, layer)));',
    },
  },
];
