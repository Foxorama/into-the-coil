// The breaks behind docs/decisions/0657-the-menus-show-what-you-have.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0657',
    suite: 'tests/tries.browser.test.ts',
    // 0561 back: a shut option drawn on a band that fits.
    broke: 'a locked option drawn on a band that fits',
    guard: '0657 — a shut gun is off the band',
    edit: {
      path: 'src/app/mount.ts',
      find: '      chrome.setHidden(name, opens.map((o) => !o));\n',
      replace: '',
    },
  },
  {
    decision: '0657',
    suite: 'tests/tries.browser.test.ts',
    // A step that lands on whatever is next, drawn or not.
    broke: 'a step onto an option the band does not draw',
    guard: '0657 — a shut gun is off the band',
    edit: {
      path: 'src/app/chrome.ts',
      find: '        if (band.hidden[next] !== true) break;\n      }\n      if (next !== from && band.hidden[next] !== true) tryOn(band, next, true);',
      replace: '        break;\n      }\n      if (next !== from) tryOn(band, next, true);',
    },
  },
  {
    decision: '0657',
    suite: 'tests/menus-round.browser.test.ts',
    // 0458's dim arrow back.
    broke: 'an arrow going nowhere drawn dim',
    guard: '0657 — THE ASK: an arrow that goes nowhere is not drawn',
    edit: {
      path: 'src/app/chrome.ts',
      find: "${each('-band-step:disabled')} { visibility: hidden; cursor: default; }",
      replace: "${each('-band-step:disabled')} { opacity: 0.2; cursor: default; }",
    },
  },
  {
    decision: '0657',
    suite: 'tests/cosmo.browser.test.ts',
    // Every ware on the shelves, owned or not.
    broke: 'owned wares left on Cosmo’s shelves',
    guard: 'THE ASK: what is owned is off the shelves',
    edit: {
      path: 'src/app/mount.ts',
      find: '      chrome.setHidden(kind, off);\n',
      replace: '',
    },
  },
  {
    decision: '0657',
    suite: 'tests/cosmo.browser.test.ts',
    // A press on a shelf steps it, as it did: A goes to the next ware.
    broke: 'a press on a shelf that steps it',
    guard: 'THE ASK: what is owned is off the shelves',
    edit: {
      path: 'src/state/screens.ts',
      find: "          press: 'acts',",
      replace: "          press: 'steps',",
    },
  },
  {
    decision: '0657',
    suite: 'tests/menus-round.browser.test.ts',
    // Every flame a tongue of fire again.
    broke: 'Bubble Jets pictured as a jet',
    guard: '0657 — Bubble Jets is pictured as bubbles',
    edit: {
      path: 'src/app/chrome.ts',
      find: "FLAMES[flame].look === 'bubbles' ? 'itc-shop-art-flame itc-shop-art-bubbles'",
      replace: "FLAMES[flame].look !== FLAMES[flame].look ? 'itc-shop-art-flame itc-shop-art-bubbles'",
    },
  },
];
