// The title fits the hand — docs/decisions/0370-the-title-fits-the-hand.md
//
// Every guard 0370 adds, broken on purpose. `node scripts/prove-guard.mjs 0370`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0370',
    suite: 'tests/layout.browser.test.ts',
    // ⚠️ THE TIERS' LINES TAKEN AWAY ON A SHORT SCREEN AGAIN, which is what shipped: three names on a
    // phone and nothing under any of them.
    broke: 'the tiers’ lines hidden on a short screen again, so a phone chooses by name alone',
    guard: 'THE REPORTED ONE: every tier shows its line under its name, readably, on every device',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  .itc-title-column { grid-row: 2; }',
      replace: '  .itc-title-action-hint { display: none; }\n  .itc-title-column { grid-row: 2; }',
    },
  },
  {
    decision: '0370',
    suite: 'tests/layout.browser.test.ts',
    // ⚠️ THE FLOOR TAKEN OFF: on the smallest phone a card's line comes out at eight pixels, drawn and
    // unreadable — which is the same report in a smaller font.
    broke: 'the floor under a card’s line taken off, so the smallest phone sets it at eight pixels',
    guard: 'THE REPORTED ONE: every tier shows its line under its name, readably, on every device',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  font-size: max(0.62em, 0.7rem);',
      replace: '  font-size: 0.62em;',
    },
  },
];
