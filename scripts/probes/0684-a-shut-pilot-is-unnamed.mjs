// The breaks behind docs/decisions/0684-a-shut-pilot-is-unnamed.md: a shut pilot named on the card, in its
// tooltip, or in the sentence that says what opens them.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0684',
    suite: 'tests/hidden.browser.test.ts',
    broke: 'the shut face named under the card and in its label',
    guard: 'THE ASK: under a shut face the title says ?????',
    edit: {
      path: 'src/app/chrome.ts',
      find: '              const said = closed ? HIDDEN_NAME : GOLFERS[golfer].name;',
      replace: '              const said = GOLFERS[golfer].name;',
    },
  },
  {
    decision: '0684',
    suite: 'tests/hidden.browser.test.ts',
    broke: 'the name written once at build, so a lock met while the page is open leaves ????? on the card',
    guard: 'a lock met opens the name with the face',
    edit: {
      path: 'src/app/chrome.ts',
      find: '              if (shownName instanceof HTMLElement) shownName.textContent = closed ? HIDDEN_NAME : GOLFERS[golfer].goesBy;',
      replace: '              if (shownName instanceof HTMLElement) shownName.textContent = HIDDEN_NAME;',
    },
  },
  {
    decision: '0684',
    suite: 'tests/marmot.test.ts',
    broke: 'the band’s sentence naming the pilot it opens',
    guard: 'the band says who still has to clear the game',
    edit: {
      path: 'src/state/screens.ts',
      find: '    const hint = lockHint(GOLFERS[kind].opens, record, HIDDEN_NAME);',
      replace: '    const hint = lockHint(GOLFERS[kind].opens, record, GOLFERS[kind].name);',
    },
  },
];
