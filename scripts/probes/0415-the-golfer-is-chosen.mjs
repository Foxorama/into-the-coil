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
    // ⚠️ Re-pointed by 0458: the menu's pick is the pilot band's, so the break is a band pick playing it.
    guard: 'takes a pick on the title, stays on the title, and says who is flying',
    edit: {
      path: 'src/app/mount.ts',
      find: "    } else if (name === 'pilot') {\n      dispatch({ slice: 'settings', type: 'pilot', pilot: GOLFER_KINDS[index] ?? DEFAULT_GOLFER });\n      showPilot();\n",
      replace:
        "    } else if (name === 'pilot') {\n      dispatch({ slice: 'settings', type: 'pilot', pilot: GOLFER_KINDS[index] ?? DEFAULT_GOLFER });\n      showPilot();\n      dispatch({ slice: 'screen', type: 'show', screen: 'intro' });\n",
    },
  },
  {
    decision: '0415',
    suite: 'tests/intro.browser.test.ts',
    broke: 'the menu still naming the golfer before the pick',
    // ⚠️ Re-pointed by 0458, on the band's arm: the same pick, and the line under the faces left stale.
    guard: 'takes a pick on the title, stays on the title, and says who is flying',
    edit: {
      path: 'src/app/mount.ts',
      find: "    } else if (name === 'pilot') {\n      dispatch({ slice: 'settings', type: 'pilot', pilot: GOLFER_KINDS[index] ?? DEFAULT_GOLFER });\n      showPilot();\n",
      replace: "    } else if (name === 'pilot') {\n      dispatch({ slice: 'settings', type: 'pilot', pilot: GOLFER_KINDS[index] ?? DEFAULT_GOLFER });\n",
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
    // ⚠️ Re-pointed by 0458: the title's buttons are Launch and Settings, side by side on a phone, and
    // the break is the same row stacking into two.
    broke: 'the title’s buttons stacked on a phone, so the second takes a row of its own',
    guard: 'keeps the title’s choices in one row on a phone',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  .itc-title-choices { flex-direction: row; gap: min(0.6rem, 1.5cqw); }',
      replace: '  .itc-title-choices { flex-direction: column; gap: min(0.6rem, 1.5cqw); }',
    },
  },
];
