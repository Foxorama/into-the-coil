// The break behind docs/decisions/0119-off-stops-the-loops.md.
//
// ⚠️ THE GUARD THIS REDDENS HAD ALREADY SEEN THE BUG AND COULD NOT HOLD IT DOWN, which is the whole
// story: it failed on one CI run and passed on the next against identical code, because whether the
// loops had started depended on whether a frame landed between a `pointerdown` and a `click`.
// `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md` says establish which it
// is rather than rerun. It was the code, and the guard was made deterministic in the same change —
// without that, this probe would itself be a coin flip.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0119',
    suite: 'tests/sound.browser.test.ts',
    /*
      ⚠️ OFF GOES BACK TO MUTING RATHER THAN STOPPING. `applyMusicLevel` calls `start()` every frame
      and it refuses only while `on` is false; the audio is unlocked by a capture-phase
      `pointerdown`, which lands BEFORE the click that applies the setting. So the loops start during
      the very gesture that turns the sound off, `started` stays true for ever, and turning it back
      on finds nothing to do — a game that is silent until the player reloads.
    */
    broke: 'off left muting the bus instead of stopping the loops, so turning it back on has nothing to start',
    guard: 'and turning it back on says so, because a setting with no feedback is a broken build',
    edit: {
      path: 'src/app/music.ts',
      find: '      if (!started) return;\n      const off = ctx.currentTime + STOP_AFTER_SECONDS;',
      replace: '      if (true) return;\n      const off = ctx.currentTime + STOP_AFTER_SECONDS;',
    },
  },
];
