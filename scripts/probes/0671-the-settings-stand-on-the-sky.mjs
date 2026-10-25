// The breaks behind docs/decisions/0671-the-settings-stand-on-the-sky.md.
//
// ⚠️ Each puts back what the review photographed: Settings' tabs on the void with no plate, and the pause a
// black screen over a run the player stopped to look at.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0671',
    suite: 'tests/pause.browser.test.ts',
    broke: 'the pause and Quit painting the void over the frozen field',
    guard: 'the pause and Quit stand over the frozen field',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    if (row.dims) root.style.background = row.inRun ? `color-mix(in srgb, ${colours.space} 70%, transparent)` : colours.space;',
      replace: '    if (row.dims) root.style.background = colours.space;',
    },
  },
  {
    decision: '0671',
    suite: 'tests/chrome.test.ts',
    broke: 'the sky the title’s alone again',
    guard: 'Settings and its tabs stand on the title’s sky',
    edit: {
      path: 'src/app/chrome.ts',
      find: "const SKIED: readonly Screen[] = PANELLED.filter((screen) => screen === 'title' || TABBED.includes(screen));",
      replace: "const SKIED: readonly Screen[] = PANELLED.filter((screen) => screen === 'title');",
    },
  },
  {
    decision: '0671',
    suite: 'tests/chrome.test.ts',
    broke: 'Settings’ tabs standing in no plate',
    guard: 'Settings and its tabs stand on the title’s sky',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-shop-plate, ${TABBED.map((s) => `.${prefixFor(s)}panel`).join(\', \')} {',
      replace: '.itc-shop-plate {',
    },
  },
];
