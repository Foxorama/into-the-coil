// The breaks behind docs/decisions/0415-the-golfer-is-chosen.md.
//
// One per claim in tests/intro.browser.test.ts's way in: the golfers offered at once rather than once
// loaded, the port baked with one golfer whoever was picked, a pick from the menu that plays the intro,
// the menu not saying who is flying, Escape that does nothing before the menu, and cards with no faces.
// And one in tests/layout.browser.test.ts: Pilot as a fifth card on a phone, wrapping onto a row of
// its own — which the no-scrolling guard saw on CI's fonts and not on Windows', so it is held by shape.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0415',
    suite: 'tests/intro.browser.test.ts',
    broke: 'the golfers offered on the next step, before anything behind them has loaded',
    guard: 'shows the splash first, and the golfers only after it',
    edit: {
      path: 'src/app/mount.ts',
      find: '      if (prewarmDone() && splashSteps >= SPLASH_STEPS) {',
      replace: '      if (splashSteps >= 1) {',
    },
  },
  {
    decision: '0415',
    suite: 'tests/intro.browser.test.ts',
    broke: 'Feather running out of the bar whoever was picked',
    guard: 'runs the golfer who was picked out of the bar',
    edit: {
      path: 'src/app/mount.ts',
      find: 'port = bakePort(colours, resolution, GOLFERS[state.settings.pilot]);',
      replace: 'port = bakePort(colours, resolution, GOLFERS.feather);',
    },
  },
  {
    decision: '0415',
    suite: 'tests/intro.browser.test.ts',
    broke: 'a pick from the menu playing the intro rather than coming back',
    guard: 'opens the golfers, and a pick comes straight back to the menu',
    edit: {
      path: 'src/app/mount.ts',
      find: "screen: selectFromMenu ? 'title' : 'intro' });",
      replace: "screen: 'intro' });",
    },
  },
  {
    decision: '0415',
    suite: 'tests/intro.browser.test.ts',
    broke: 'the menu’s Pilot still naming the golfer before the pick',
    guard: 'opens the golfers, and a pick comes straight back to the menu',
    edit: {
      path: 'src/app/mount.ts',
      find: "      dispatch({ slice: 'settings', type: 'pilot', pilot: GOLFER_KINDS[index] ?? DEFAULT_GOLFER });\n      showPilot();\n",
      replace: "      dispatch({ slice: 'settings', type: 'pilot', pilot: GOLFER_KINDS[index] ?? DEFAULT_GOLFER });\n",
    },
  },
  {
    decision: '0415',
    suite: 'tests/intro.browser.test.ts',
    broke: 'Escape on the splash doing nothing, so the name has to be sat through',
    guard: 'goes to the menu on Escape from the splash',
    edit: {
      path: 'src/app/mount.ts',
      find: "    if ((screen === 'splash' || screen === 'select') && e.key === 'Escape') {",
      replace: "    if (screen === 'select' && e.key === 'Escape') {",
    },
  },
  {
    decision: '0415',
    suite: 'tests/intro.browser.test.ts',
    broke: 'the golfers offered as names with no faces',
    guard: 'shows the splash first, and the golfers only after it',
    edit: {
      path: 'src/app/chrome.ts',
      find: '        control.prepend(portrait);',
      replace: '',
    },
  },
  {
    decision: '0415',
    suite: 'tests/layout.browser.test.ts',
    broke: 'Pilot as a fifth card on a phone, wrapping onto a row of its own under the tiers',
    guard: 'keeps the title’s choices in one row on a phone',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  .itc-title-choices > :nth-child(-n+3) { grid-row: span 2; }',
      replace: '',
    },
  },
];
