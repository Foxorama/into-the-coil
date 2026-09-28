// The breaks behind docs/decisions/0411-the-chase-begins-at-the-port.md.
//
// One per claim in tests/intro.test.ts and tests/intro.browser.test.ts, and one for the painter's place
// on tests/budget.test.ts's hot list: the page opens on the title again, the beats run out of order, the
// picture does not end in black or goes dark mid-shot, a baked piece is never drawn, a ship is still on
// the screen when its shot ends, the fighter covers the pilot, the pilot jumps between the run and the
// leap, the intro draws nothing, and a press either fails to skip or carries through onto a tier.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the page opens on the title again',
    guard: 'opens the page, has no panel',
    edit: {
      path: 'src/state/slices/screen.ts',
      find: "export const initialScreen: ScreenState = { current: 'intro' };",
      replace: "export const initialScreen: ScreenState = { current: 'title' };",
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the fighter goes after her before she has gone',
    guard: 'runs its beats in the order they are written',
    edit: {
      path: 'src/content/port.ts',
      find: '  blueRuns: 870,',
      replace: '  blueRuns: 800,',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the last fade taken out, so the title cuts in over the stars',
    guard: 'opens out of black and ends in it',
    edit: {
      path: 'src/render/port.ts',
      find: '  else if (t >= BEATS.fadeOut) dark = Math.min(1, (t - BEATS.fadeOut) / (BEATS.end - BEATS.fadeOut));',
      replace: '',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the hangar fading from the fighter’s launch rather than after it',
    guard: 'is never dark in the middle of a shot',
    edit: {
      path: 'src/render/port.ts',
      find: '  else if (t >= BEATS.cut - FADE && t < BEATS.outside)',
      replace: '  else if (t >= BEATS.blueGo - FADE && t < BEATS.outside)',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the alarm beacons baked and never drawn',
    guard: 'draws every piece of the port it bakes',
    edit: {
      path: 'src/render/port.ts',
      find: '      put(surface, view, PORT_SPRITE.beacon, at[0], at[1], lit, 0, 1 + 0.6 * sweep);',
      replace: '      void at;',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the Viper crawling off her pad, still in the hangar when the pilot comes out',
    guard: 'has the Viper through the bay before the bar door opens',
    edit: {
      path: 'src/render/port.ts',
      find: '  const viperAlong = STAGE.viperPad + launched(t, BEATS.viperGo);',
      replace: '  const viperAlong = STAGE.viperPad + launched(t, BEATS.viperGo) * 0.05;',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the fighter too slow to reach the bay before the dark',
    guard: 'has the fighter through the bay before the hangar fades',
    edit: {
      path: 'src/render/port.ts',
      find: '  const blueAlong = STAGE.bluePad + launched(t, BEATS.blueGo);',
      replace: '  const blueAlong = STAGE.bluePad + launched(t, BEATS.blueGo) * 0.3;',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the fighter holding station outside until the picture goes',
    guard: 'has both ships off the widest screen before the last fade',
    edit: {
      path: 'src/render/port.ts',
      find: '+ launched(s, BEATS.blueRuns - BEATS.outside);',
      replace: '+ launched(s, BEATS.fadeOut - BEATS.outside);',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the fighter drawn over the pilot, which is what the first photographs showed',
    guard: 'never lets the fighter cover the pilot',
    edit: {
      path: 'src/render/port.ts',
      find: '  // The canopy catching the light as the pilot drops in.',
      replace: '  put(surface, view, PORT_SPRITE.blue, blueAlong, blueAcross);\n  // The canopy catching the light as the pilot drops in.',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.test.ts',
    broke: 'the leap starting from the pad rather than from where the run ended',
    guard: 'carries the pilot from the run into the leap without a jump',
    edit: {
      path: 'src/render/port.ts',
      find: '      const along = LEAP_FROM + (toAlong - LEAP_FROM) * u;',
      replace: '      const along = STAGE.bluePad + (toAlong - STAGE.bluePad) * u;',
    },
  },
  {
    decision: '0411',
    suite: 'tests/budget.test.ts',
    broke: 'the intro’s painter building an array every frame',
    guard: 'no hot file allocates',
    edit: {
      path: 'src/render/port.ts',
      find: '  surface.clear();\n  if (t < BEATS.cut)',
      replace: '  surface.clear();\n  void [t].map((n) => n);\n  if (t < BEATS.cut)',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.browser.test.ts',
    broke: 'the frame clearing the canvas in place of drawing the intro',
    guard: 'draws the intro with no panel over it',
    edit: {
      path: 'src/app/frame.ts',
      find: '      paintPort(w.surface, w.view, w.intro + alpha);',
      replace: '      w.surface.clear();',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.browser.test.ts',
    broke: 'Enter’s default left alone, so the skip’s keypress starts a run on the tier it focused',
    guard: 'skips to the title on Enter',
    edit: {
      path: 'src/app/mount.ts',
      find: "    if (e instanceof KeyboardEvent && (e.key === 'Enter' || e.key === ' ')) e.preventDefault();",
      replace: '',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.browser.test.ts',
    broke: 'the skip unlocking the sound, which drains the prewarm and freezes the page for five seconds',
    guard: 'builds no sound on a skip',
    edit: {
      path: 'src/app/mount.ts',
      find: "    if (state.screen.current === 'intro') return;\n    audioOut.unlock();",
      replace: '    audioOut.unlock();',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.browser.test.ts',
    broke: 'a key that does not skip',
    guard: 'skips to the title on Space',
    edit: {
      path: 'src/app/mount.ts',
      find: "  window.addEventListener('keydown', skipIntro, { capture: true });",
      replace: '',
    },
  },
  {
    decision: '0411',
    suite: 'tests/intro.browser.test.ts',
    broke: 'a click that does not skip',
    guard: 'skips to the title on a click',
    edit: {
      path: 'src/app/mount.ts',
      find: "  window.addEventListener('pointerdown', skipIntro, { capture: true });",
      replace: '',
    },
  },
];
