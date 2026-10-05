// The breaks behind docs/decisions/0513-the-pilot-flies.md.
//
// ⚠️ The way in has three presses in it — the splash's, the pilot's, the skip's — and each has a press
// it must refuse: the pilot screen a thumb's first landing, the run the key that skipped into it. Most
// breaks below let one of those through. The splash refused a pad's too, until 0531 took it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0513',
    suite: 'tests/intro.browser.test.ts',
    broke: 'the splash going on by itself once loaded, before the press that turns the sound on',
    guard: 'waits there for a press',
    edit: {
      path: 'src/app/mount.ts',
      find: "        if (splashPressed) dispatch({ slice: 'screen', type: 'show', screen: 'title' });\n        else chrome.setActionShown('splash', 0, true);",
      replace: "        dispatch({ slice: 'screen', type: 'show', screen: 'title' });",
    },
  },
  {
    decision: '0513',
    suite: 'tests/intro.browser.test.ts',
    broke: 'the intro ending on the title, with the flight it was played for not flown',
    guard: 'plays the intro on the first Fly, plays its cues, and hands over to the run by itself',
    edit: {
      path: 'src/state/screens.ts',
      find: "    timeout: { steps: INTRO_STEPS, then: 'playing' },",
      replace: "    timeout: { steps: INTRO_STEPS, then: 'title' },",
    },
  },
  {
    decision: '0513',
    suite: 'tests/intro.test.ts',
    broke: 'the end of a pause read as the end of an intro, beginning a new run over the held one',
    guard: 'the count-in running out does not begin another',
    edit: {
      path: 'src/state/screens.ts',
      find: "  return then === 'playing' && !SCREENS[from].inRun;",
      replace: "  return then === 'playing';",
    },
  },
  {
    decision: '0513',
    suite: 'tests/intro.browser.test.ts',
    broke: 'the Escape that skipped the intro heard again by the run it skipped into, and pausing it',
    guard: 'the Escape does not pause the run it skipped into',
    edit: {
      path: 'src/app/mount.ts',
      find: '    e.stopPropagation();\n    leaveIntro();',
      replace: '    leaveIntro();',
    },
  },
  {
    decision: '0513',
    suite: 'tests/intro.browser.test.ts',
    broke: "a thumb's first landing on the boot's highlighted pilot flying them",
    guard: 'the first tap on the pilot already highlighted at boot is a look',
    edit: {
      path: 'src/app/mount.ts',
      find: '  let pilotArmed = false;',
      replace: '  let pilotArmed = true;',
    },
  },
  {
    decision: '0513',
    suite: 'tests/menu.browser.test.ts',
    broke: 'A on the pilot band stepping to the next pilot, as every other band does',
    guard: 'A on the pilot band flies the pilot it is on',
    edit: {
      path: 'src/app/chrome.ts',
      find: "      if (band !== undefined && band.press === 'takes') onChoice(band.name, band.index, false);",
      replace: "      if (band !== undefined && band.press === 'never') onChoice(band.name, band.index, false);",
    },
  },
  {
    decision: '0513',
    suite: 'tests/intro.browser.test.ts',
    // ⚠️ Re-pointed by 0538: the title's line says what the pilot flies, and the bio is the hangar's.
    broke: 'the line naming the pilot and never saying what they fly',
    guard: 'a first tap on another card says who they are',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    pilotCard.craft.textContent = ship.label;',
      replace: '',
    },
  },
];
