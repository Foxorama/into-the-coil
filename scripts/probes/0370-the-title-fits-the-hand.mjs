// The title fits the hand — docs/decisions/0370-the-title-fits-the-hand.md
//
// Every guard 0370 adds, broken on purpose. `node scripts/prove-guard.mjs 0370`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0370',
    suite: 'tests/layout.browser.test.ts',
    // ⚠️ THE TIERS' LINES TAKEN AWAY ON A SHORT SCREEN AGAIN, which is what shipped: three names on a
    // phone and nothing to choose between them by.
    broke: 'the tiers’ hints and facts hidden on a short screen again, so a phone chooses by name alone',
    guard: 'THE REPORTED ONE: every tier shows what it is and what it gives, readably, on every device',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  .itc-title-column { grid-row: 2; }',
      replace: '  .itc-title-action-hint, .itc-title-action-detail { display: none; }\n  .itc-title-column { grid-row: 2; }',
    },
  },
  {
    decision: '0370',
    suite: 'tests/layout.browser.test.ts',
    // ⚠️ THE FLOOR TAKEN OFF: on the smallest phone a card's explanation comes out at eight pixels,
    // drawn and unreadable — which is the same report in a smaller font.
    broke: 'the floor under a card’s lines taken off, so the smallest phone sets them at eight pixels',
    guard: 'THE REPORTED ONE: every tier shows what it is and what it gives, readably, on every device',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  font-size: max(0.62em, 0.7rem);',
      replace: '  font-size: 0.62em;',
    },
  },
  {
    decision: '0370',
    suite: 'tests/layout.browser.test.ts',
    // ⚠️ THE FACTS SAID BY NOTHING: the line is built and empty, so a tier says how it feels and not
    // what it gives — the lives and the shields are what a player compares tiers by.
    broke: 'a tier’s facts line said by nothing, so the lives and shields are missing from every card',
    guard: 'THE REPORTED ONE: every tier shows what it is and what it gives, readably, on every device',
    edit: {
      path: 'src/content/difficulty.ts',
      find: '  return `${lives} · ${shields}`;',
      replace: "  return lives.length < 0 ? shields : '';",
    },
  },
];
