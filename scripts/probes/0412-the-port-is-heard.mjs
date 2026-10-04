// The breaks behind docs/decisions/0412-the-port-is-heard.md.
//
// One per claim: a cue that sounds over a picture that does not show it, a cue the intro never plays,
// an early press that unlocks at once and freezes the page, the intro's cues never played, Escape that
// does not skip the intro and Escape that asks for sound, Enter carrying through onto a tier, the pad's
// confirm never a skip, and a Skip button that does nothing when clicked.
//
// ⚠️ **TWO WERE RETIRED BY 0415, AND THE REASON IS THAT THEIR SUBJECT IS GONE.** *The skip offered
// before the game has loaded* and *a press after the load only remembered* were both about an intro
// that could start before loading finished. Since 0415 the intro is reached only through a golfer
// picked on a screen that appears once loading has finished — so the skip is always up from the first
// frame and the pick has already turned the sound on. The early press now happens on the splash, and
// the probe on it points there.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0412',
    suite: 'tests/intro.test.ts',
    broke: 'the door heard half a second before it opens',
    guard: 'plays every cue on a step that draws its twin',
    edit: {
      path: 'src/content/port.ts',
      find: "  { at: BEATS.door, cue: 'door' },",
      replace: "  { at: BEATS.door - 30, cue: 'door' },",
    },
  },
  {
    decision: '0412',
    suite: 'tests/sound.test.ts',
    broke: 'the door cue left in the table with no beat that plays it',
    guard: 'no cue in the table is dead weight',
    edit: {
      path: 'src/content/port.ts',
      /*
        ⚠️ **ONE DOOR AGAIN SINCE 0444.** 0416 opened the bar a second time for Venoma, and this edit
        spanned both rows because taking out only the golfer's left hers playing the cue (the full proof
        on #443 reported it STILL GREEN). 0444 took her run and her door out, so the one row is the break.
      */
      find: "  { at: BEATS.door, cue: 'door' },\n",
      replace: '',
    },
  },
  {
    decision: '0412',
    suite: 'tests/intro.browser.test.ts',
    broke: 'an early press unlocking at once, which runs the whole load on the press and freezes the page',
    // 0513: the splash's own press now, which is the early one.
    guard: 'keeps a press made while it loads',
    edit: {
      path: 'src/app/mount.ts',
      find: '      if (prewarmDone()) unlockAudio();\n      else introWantsSound = true;\n      return;\n    }\n    unlockAudio();',
      replace: '      unlockAudio();\n      return;\n    }\n    unlockAudio();',
    },
  },
  {
    decision: '0412',
    suite: 'tests/intro.browser.test.ts',
    broke: 'the sound on and the intro’s beats never played',
    // 0513: the intro is the first flight's, and the sound came on at the splash.
    guard: 'plays the intro on the first Fly, plays its cues',
    edit: {
      path: 'src/app/mount.ts',
      find: '        if (audioOut.ready()) speaker.play(INTRO_CUES[introCueNext]!.cue);\n',
      replace: '',
    },
  },
  {
    decision: '0412',
    suite: 'tests/intro.browser.test.ts',
    broke: 'Escape no longer a skip of the intro',
    guard: 'goes on Escape',
    edit: {
      path: 'src/app/mount.ts',
      // Re-anchored by 0418, which asks the row whether it skips and the intro whether it may yet.
      find: "    if (e.key !== 'Escape' && !(activates && skipsNow())) return;",
      replace: '    if (!(activates && skipsNow())) return;',
    },
  },
  {
    decision: '0412',
    suite: 'tests/intro.browser.test.ts',
    broke: 'Escape asking for the sound like any other press',
    // 0513: the golfers' screen is gone; Escape on the splash is the press that asks for nothing.
    guard: 'goes to the pilot screen on Escape, and builds no sound',
    edit: {
      path: 'src/app/mount.ts',
      find: "    if (e instanceof KeyboardEvent && e.key === 'Escape' && (screen === 'splash' || screen === 'intro')) return;\n",
      replace: '',
    },
  },
  {
    decision: '0412',
    suite: 'tests/intro.browser.test.ts',
    broke: 'Enter’s default left alone, so the skip’s keypress starts a run on the tier it focused',
    guard: 'goes on Enter',
    edit: {
      path: 'src/app/mount.ts',
      find: '    if (activates) e.preventDefault();',
      replace: '',
    },
  },
  {
    decision: '0412',
    suite: 'tests/intro.browser.test.ts',
    broke: 'the pad’s confirm heard as a request for sound and never as the skip',
    guard: "goes on the pad's confirm",
    edit: {
      path: 'src/app/mount.ts',
      find: '      if (menuAsk.confirm && introReady) leaveIntro();',
      replace: '',
    },
  },
  {
    decision: '0412',
    suite: 'tests/intro.browser.test.ts',
    broke: 'a Skip button that does nothing when it is clicked',
    guard: 'goes on a click',
    edit: {
      path: 'src/app/chrome.ts',
      find: "  skip.addEventListener('click', () => onSkip());",
      replace: '',
    },
  },
];
