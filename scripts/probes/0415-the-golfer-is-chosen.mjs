// The breaks behind docs/decisions/0415-the-golfer-is-chosen.md, as 0513 carried them onto the pilot
// screen.
//
// One per claim in tests/intro.browser.test.ts's way in: the press asked for at once rather than once
// loaded, the port baked with one golfer whoever was chosen, a pick that flies on the first tap, the
// panel not saying who is highlighted, Escape that does nothing before the menu, and cards with no faces.
// And one in tests/layout.browser.test.ts: the title's two buttons stacking on a phone, which the
// no-scrolling guard saw on CI's fonts and not on Windows', so it is held by shape.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0415',
    suite: 'tests/intro.browser.test.ts',
    // ⚠️ Re-pointed by 0513: the splash asks for its press where it gave way to the golfers.
    broke: 'the press asked for on the next step, before anything behind it has loaded',
    guard: 'puts up Press to begin only after it',
    edit: {
      path: 'src/app/mount.ts',
      find: '      if (prewarmDone() && splashSteps >= SPLASH_STEPS) {',
      replace: '      if (splashSteps >= 1) {',
    },
  },
  {
    decision: '0415',
    suite: 'tests/intro.browser.test.ts',
    broke: 'Feather running out of the bar whoever was chosen',
    guard: 'runs the pilot who was chosen out of the bar',
    edit: {
      path: 'src/app/mount.ts',
      // The pilot is named once since 0526, which bakes their ship with its fitted gun beside them.
      find: '      const pilot = GOLFERS[state.settings.pilot];',
      replace: '      const pilot = GOLFERS.feather;',
    },
  },
  {
    decision: '0415',
    suite: 'tests/intro.browser.test.ts',
    // ⚠️ Re-pointed by 0458 and again by 0513: a pick on the pilot screen is a look until it is repeated.
    broke: 'a tap on a pilot flying them at once, with no look first',
    guard: 'a first tap on another card says who they are',
    edit: {
      path: 'src/app/mount.ts',
      find: '      if (takes && kind === state.settings.pilot && (!pointer || pilotArmed)) {',
      replace: '      if (true) {',
    },
  },
  {
    decision: '0415',
    suite: 'tests/intro.browser.test.ts',
    // ⚠️ Re-pointed by 0513: the pick is shown on the card under the faces, which `showPilot` fills.
    broke: 'the pilot screen still naming the pilot before the tap',
    guard: 'a first tap on another card says who they are',
    edit: {
      path: 'src/app/mount.ts',
      find: "      dispatch({ slice: 'settings', type: 'pilot', pilot: kind });\n      showPilot();\n",
      replace: "      dispatch({ slice: 'settings', type: 'pilot', pilot: kind });\n",
    },
  },
  {
    decision: '0415',
    suite: 'tests/intro.browser.test.ts',
    broke: 'Escape on the splash doing nothing, so the name has to be sat through',
    guard: 'goes to the pilot screen on Escape',
    edit: {
      path: 'src/app/mount.ts',
      find: "    if (screen === 'splash' && e.key === 'Escape') {",
      replace: "    if (screen === 'title' && e.key === 'Escape') {",
    },
  },
  {
    decision: '0415',
    suite: 'tests/intro.browser.test.ts',
    // ⚠️ Re-pointed by 0513: the faces are the pilot screen's cards now.
    broke: 'the pilots offered as names with no faces',
    guard: 'THE ASK: shows the splash, puts up Press to begin',
    edit: {
      path: 'src/app/chrome.ts',
      find: '            button.append(portraitOf(golfer, prefix), name);',
      replace: '            button.append(name);',
    },
  },
  {
    decision: '0415',
    suite: 'tests/layout.browser.test.ts',
    // ⚠️ Re-pointed by 0458: the title's buttons are Fly and Settings, side by side on a phone, and
    // the break is the same row stacking into two. ⚠️ And by 0538: Fly leads alone, and the row held
    // is the quiet one under it, which a column stacks the same way.
    broke: 'the title’s buttons stacked on a phone, so the second takes a row of its own',
    guard: 'keeps the title’s choices in one row on a phone',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  .itc-title-choices { flex-direction: row; gap: min(0.45rem, 1.4cqh) min(0.6rem, 1.5cqw); }',
      replace: '  .itc-title-choices { flex-direction: column; gap: min(0.45rem, 1.4cqh) min(0.6rem, 1.5cqw); }',
    },
  },
];
