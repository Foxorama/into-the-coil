// The breaks behind docs/decisions/0212-the-room-walks-the-level.md.
//
// ⚠️ THE FIRST TWO ARE THE DEFECT THAT ACTUALLY SHIPPED, PUT BACK. 0210's music room held one fixed
// rung — `run` — on the stated ground that it was "the rung a level spends most of its length at",
// which had been true until 0158 gave every level a four-entry section script and was 17-30% by the
// time it was written down. Reported one day later: "why the ingame music sounds different from the
// music that plays in the music menu section." scripts/weigh-room.mjs is the measurement.
//
// ⚠️ AND THE REST ARE THE THINGS ONLY A PICTURE CAN SEE, which is 0027's own subject. A walk that
// does not advance, a screen that paints over the place it is auditioning, and a camera the room
// borrows and keeps are all invisible to every headless assertion in this repository — the model
// agrees with itself in each case, and the player is looking at a still image.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0212',
    suite: 'tests/music.test.ts',
    // Reads as a simplification: the room only ever wants one rung, so why walk to find it.
    broke: 'the room back on one fixed rung, which is 0210 as it shipped and the reported defect',
    guard: 'agrees with a run at every section boundary',
    edit: {
      path: 'src/app/music.ts',
      find: '  const fought = along - level.bossAt;\n  if (fought < 0) return musicLevelFor(along, false, level.sections);',
      replace: "  const fought = along - level.bossAt;\n  if (fought < 0) return 'run';",
    },
  },
  {
    decision: '0212',
    suite: 'tests/music.test.ts',
    // A straight line from full health to none is the obvious curve, and it is the one that was
    // written first. Nothing at the call site suggests it hands `boss` eleven seconds.
    broke: 'the fight on a linear health curve, so BOSS_PEAK_HEALTH lands a fifth of the way in',
    guard: 'holds each rung of the fight for a whole phrase',
    edit: {
      path: 'src/app/music.ts',
      find: '  const health =\n    through < 0.5\n      ? 1 - (1 - BOSS_PEAK_HEALTH) * (through / 0.5)\n      : BOSS_PEAK_HEALTH * (1 - (through - 0.5) / 0.5);',
      replace: '  const health = 1 - through;',
    },
  },
  {
    decision: '0212',
    suite: 'tests/room.browser.test.ts',
    /*
      ⚠️ THE ONE THE HEADLESS SUITE CANNOT SEE. Every unit assertion about the walk is a function of
      `along`, and this leaves `along` at zero for ever: `auditionRung(level, 0)` is still exactly
      right, the readout still says which place is playing, and the whole model agrees with itself
      over a picture that never moves. This is what a rate measured in seconds of music per second of
      watching is FOR.
    */
    broke: 'the walk stopped advancing, so the room is a still picture the model calls correct',
    guard: 'advances at a second of music per second of watching',
    edit: {
      path: 'src/app/mount.ts',
      find: '    auditionAlong += SCROLL_PER_STEP;',
      replace: '',
    },
  },
  {
    decision: '0212',
    suite: 'tests/menu.test.ts',
    // Looks like tidying an inconsistency: every other panelled screen dims, so why not this one.
    broke: 'the music room dimming again, which paints the space colour over the place it auditions',
    guard: 'the screens that show the scene through them are the two that say so',
    edit: {
      path: 'src/state/screens.ts',
      find: "    dims: false,\n    timeout: null,\n  },\n};",
      replace: "    dims: true,\n    timeout: null,\n  },\n};",
    },
  },
  {
    decision: '0212',
    suite: 'tests/room.browser.test.ts',
    /*
      ⚠️ THIS ONE SHIPPED INTO THE WORKING COPY AND WAS CAUGHT BY LOOKING AT THE SCREEN. The readout
      is marked `hidden` until something plays, and `hidden` is a User Agent rule of `display: none` —
      so the `display: flex` that lays the block out beats it on specificity and the room opened with
      an empty outlined bar under the heading, reading nothing.

      ⚠️ NOTHING COULD HAVE CAUGHT IT WITHOUT LOOKING. The element was in the DOM, was marked hidden,
      and said so to `element.hidden`, to the accessibility tree and to every query about it. Only a
      computed style — or an eye — can see the difference, which is 0027 exactly.
    */
    broke: 'the readout laid out over its own hidden attribute, so the room opens showing an empty bar',
    guard: 'advances at a second of music per second of watching',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-music-now[hidden] { display: none; }',
      replace: '',
    },
  },
  {
    decision: '0212',
    suite: 'tests/room.browser.test.ts',
    /*
      ⚠️ NOTHING IN `src/` READS THE RESTORED CAMERA, which is why deleting this looks free. What it
      costs is a run resumed after a visit opening wherever the listener left the walk — and the only
      thing that can see it is the star field, drawn off that camera.
    */
    broke: 'the run camera left where the walk finished, because the room never puts it back',
    guard: "leaves the run's camera where it found it",
    edit: {
      path: 'src/app/mount.ts',
      find: '    auditionAll = false;\n    audition = null;\n    auditionLevel = null;\n    releaseCamera();',
      replace: '    auditionAll = false;\n    audition = null;\n    auditionLevel = null;',
    },
  },
];
