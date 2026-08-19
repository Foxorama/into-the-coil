// The breaks behind docs/decisions/0172-a-place-opens-with-its-own-four.md.
//
// ⚠️ THE FIRST ONE IS THE STATE THE GAME SHIPPED IN, AND IT IS THE ONE `weigh-apart` HAS BEEN
// DESCRIBING SINCE 2026-08-13. With the override ignored, every place is back on the shared `run`
// row and FIVE of the seven have literally the same four layers loudest — a sub, a kick, a bass and
// a pad. Every other guard in the repository is green over that, which is the whole finding.
//
// ⚠️ THE SECOND IS THE DEFECT THIS DECISION FOUND RATHER THAN THE ONE IT FIXED. `rungShape` read
// `MUSIC_LADDER` directly while `paceAt` read the place's own ladder, so the desk and the guard
// disagreed by 27 notes a bar at Ember Nebula's `run` the instant an override existed — and could
// not have disagreed by anything before that. It is `loudestOf`'s twin, and 0168's own guard, which
// exists to hold the desk and the arithmetic together, is what caught it for real.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0172',
    suite: 'tests/themes.test.ts',
    broke: 'every place back on the shared `run` row, which is five of seven opening on the same four sounds',
    guard: 'THE REPORTED ONE: no two places have the same four layers on top at `run`',
    edit: {
      path: 'src/content/themes.ts',
      find: '  return ladder?.[rung]?.[layer] ?? MUSIC_LADDER[rung][layer];',
      replace: '  return MUSIC_LADDER[rung][layer];',
    },
  },
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
      find: '        const want = Math.max(...MUSIC_LEVELS.map((rung) => rungOf(theme, rung, layer))) * mixOf(theme, layer);',
      replace: '        const want = Math.max(...MUSIC_LEVELS.map((rung) => MUSIC_LADDER[rung][layer])) * mixOf(theme, layer);',
    },
  },
];
