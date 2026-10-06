// The breaks behind docs/decisions/0562-the-plate-grows.md.
//
// ⚠️ The plate's type capped at a laptop's again, and the card left saying what it said before.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0562',
    suite: 'tests/foot.browser.test.ts',
    broke: 'the plate capped at the laptop size again',
    guard: 'sets the plate a third larger',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-hangar-panel, .itc-parts-panel, .itc-shop-panel { font-size: clamp(0.85rem, max(min(5.4cqh, 1.25rem), 2.5cqh), 2.2rem); }',
      replace: '.itc-hangar-panel, .itc-parts-panel, .itc-shop-panel { font-size: clamp(0.85rem, min(5.4cqh, 1.25rem), 2.2rem); }',
    },
  },
  {
    decision: '0562',
    suite: 'tests/foot.browser.test.ts',
    broke: 'the card never moved off the band it opened on',
    guard: 'names the option tried on',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    if (on !== undefined) panel.spoken = on;',
      replace: '    if (on === undefined) panel.spoken = on ?? panel.spoken;',
    },
  },
];
