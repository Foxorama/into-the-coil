// The breaks behind docs/decisions/0686-the-menus-are-one-game.md: the music room's panel out of the plate every
// menu stands in, so its words are on the star field again; and the settings family's floor, which 0668's
// re-anchored probe takes out.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0686',
    suite: 'tests/menu.test.ts',
    broke: 'the music room’s panel with no plate and no backing of its own',
    guard: 'the music room, which does not dim, gives its panel a backing of its own',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-title-board, .itc-title-main, .itc-hangar-plate, .itc-parts-plate, .itc-music-panel, .itc-shop-plate, ',
      replace: '.itc-title-board, .itc-title-main, .itc-hangar-plate, .itc-parts-plate, .itc-shop-plate, ',
    },
  },
  {
    decision: '0686',
    suite: 'tests/layout.browser.test.ts',
    broke: 'each Settings tab centred on its own content, its strip at its own height',
    guard: 'with their strip at one height, on every device',
    edit: {
      path: 'src/app/chrome.ts',
      find: "${TABBED.map((screen) => `.${prefixFor(screen)}panel`).join(', ')} { min-height: min(40rem, 88cqh); justify-content: flex-start; }\n",
      replace: '',
    },
  },
];
