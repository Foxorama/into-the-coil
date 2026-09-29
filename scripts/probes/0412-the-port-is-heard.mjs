// The breaks behind docs/decisions/0412-the-port-is-heard.md.
//
// One per claim: a cue that sounds over a picture that does not show it, a cue the intro never plays,
// the skip offered before the game has loaded, a press that unlocks at once and freezes the picture, a
// press after the load that is only remembered, the intro's cues never played, Escape that does not
// skip and Escape that asks for sound, Enter carrying through onto a tier, and a Skip button that does
// nothing when clicked.

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
      find: "  { at: BEATS.door, cue: 'door' },",
      replace: '',
    },
  },
  {
    decision: '0412',
    suite: 'tests/intro.browser.test.ts',
    broke: 'the skip offered from the first frame, before anything behind the intro has loaded',
    guard: 'is not offered until the game has loaded',
    edit: {
      path: 'src/app/mount.ts',
      find: '      if (!introReady && prewarmDone()) {',
      replace: '      if (!introReady) {',
    },
  },
  {
    decision: '0412',
    suite: 'tests/intro.browser.test.ts',
    broke: 'a press on the intro unlocking at once, which drains the prewarm and freezes the picture',
    guard: 'turns the sound on without skipping or freezing',
    edit: {
      path: 'src/app/mount.ts',
      find: '      if (introReady) audioOut.unlock();\n      else introWantsSound = true;\n      return;\n    }\n    audioOut.unlock();',
      replace: '      audioOut.unlock();\n      return;\n    }\n    audioOut.unlock();',
    },
  },
  {
    decision: '0412',
    suite: 'tests/intro.browser.test.ts',
    broke: 'a press after the load only remembered, so the sound never comes on',
    guard: 'turns the sound on at once when the game has loaded',
    edit: {
      path: 'src/app/mount.ts',
      find: '      if (introReady) audioOut.unlock();\n      else introWantsSound = true;\n      return;\n    }\n    audioOut.unlock();',
      replace: '      introWantsSound = true;\n      return;\n    }\n    audioOut.unlock();',
    },
  },
  {
    decision: '0412',
    suite: 'tests/intro.browser.test.ts',
    broke: 'the sound on and the intro’s beats never played',
    guard: 'and the intro plays its cues',
    edit: {
      path: 'src/app/mount.ts',
      find: '        if (audioOut.ready()) speaker.play(INTRO_CUES[introCueNext]!.cue);\n',
      replace: '',
    },
  },
  {
    decision: '0412',
    suite: 'tests/intro.browser.test.ts',
    broke: 'Escape no longer a skip',
    guard: 'skips at once on Escape',
    edit: {
      path: 'src/app/mount.ts',
      find: "    if (e.key !== 'Escape' && !(activates && introReady)) return;",
      replace: '    if (!(activates && introReady)) return;',
    },
  },
  {
    decision: '0412',
    suite: 'tests/intro.browser.test.ts',
    broke: 'Escape asking for the sound like any other press',
    guard: 'and Escape still asks for no sound once it is offered',
    edit: {
      path: 'src/app/mount.ts',
      find: "      if (e instanceof KeyboardEvent && e.key === 'Escape') return;\n",
      replace: '',
    },
  },
  {
    decision: '0412',
    suite: 'tests/intro.browser.test.ts',
    broke: 'Enter’s default left alone, so the skip’s keypress starts a run on the tier it focused',
    guard: 'goes to the title on Enter once it is offered',
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
    guard: "goes to the title on the pad's confirm",
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
    guard: 'goes to the title on a click',
    edit: {
      path: 'src/app/chrome.ts',
      find: "  skip.addEventListener('click', () => onSkip());",
      replace: '',
    },
  },
];
