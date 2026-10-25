// The breaks behind docs/decisions/0682-the-phone-pass.md.
//
// ⚠️ Four ways back to the phone the review played: the pause plate at the score's elbow again, the score's digits
// popping over the plate with no reach kept beside them, the plate held upright growing past the screen's foot, and
// a keeper's bubble over the balance.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0682',
    suite: 'tests/pause.browser.test.ts',
    broke: 'the pause plate 0.6 em from the score again on a touch screen',
    guard: 'the pause plate stands its own width clear of the score',
    edit: { path: 'src/app/chrome.ts', find: '  .itc-playing-corner { gap: var(--itc-strip); }', replace: '  .itc-playing-corner { gap: 0.6em; }' },
  },
  {
    decision: '0682',
    suite: 'tests/pause.browser.test.ts',
    broke: 'no reach kept beside the digits, so their pop stands over the gap',
    guard: 'the pause plate stands its own width clear of the score',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  .itc-playing-score-pop { margin-left: calc(0.22 * 8 * 1.45 * (1ch + 0.05em)); }',
      replace: '  .itc-playing-score-pop { margin-left: 0; }',
    },
  },
  {
    decision: '0682',
    suite: 'tests/layout.browser.test.ts',
    broke: 'the plate held upright no longer scrolls, so it grows past the screen',
    guard: 'draws all of every standing screen on a phone held upright',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-hangar-plate, .itc-parts-plate, .itc-shop-plate { min-height: 0; overflow-y: auto; }',
      replace: '.itc-hangar-plate, .itc-parts-plate, .itc-shop-plate { min-height: auto; overflow-y: visible; }',
    },
  },
  {
    decision: '0682',
    suite: 'tests/layout.browser.test.ts',
    broke: 'the bubble hung where the keeper is, whatever the balance under it',
    guard: 'stands the keeper\'s bubble clear of the balance on every tab',
    edit: { path: 'src/app/chrome.ts', find: '    if (sheet !== null && sheet.parentElement === stand) {', replace: '    if (sheet === null) {' },
  },
];
