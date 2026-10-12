// The breaks behind docs/decisions/0606-the-menus-come-round.md.
//
// ⚠️ Every way the three asks could be quietly undone: a band's arrow that stops at its end again, the tier
// that comes round when it is a ladder, an arrow's press grown sideways over its neighbour again, and a
// table that draws no tier.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0606',
    suite: 'tests/menus-round.browser.test.ts',
    broke: 'a band’s arrow standing at its end, as every band did before',
    guard: 'steps every band that comes round all the way round',
    edit: { path: 'src/app/chrome.ts', find: "    const rounds = round || band.ends === 'round';\n", replace: '    const rounds = round;\n' },
  },
  {
    decision: '0606',
    suite: 'tests/menus-round.browser.test.ts',
    broke: 'the tier coming round from the hardest to the easiest',
    guard: 'steps every band that comes round all the way round',
    edit: {
      path: 'src/state/screens.ts',
      find: "        // 0606: the one ladder on the title, and it stops at its ends — `ends`' note.\n        ends: 'stop',",
      replace: "        // 0606: the one ladder on the title, and it stops at its ends — `ends`' note.\n        ends: 'round',",
    },
  },
  {
    decision: '0606',
    suite: 'tests/menus-round.browser.test.ts',
    broke: 'an arrow’s press grown sideways over the chip and the next band’s arrow, as 0566 grew it',
    guard: 'lands every tap on an arrow on that arrow',
    edit: {
      path: 'src/app/chrome.ts',
      find: "  .itc-hangar-band-step::after, .itc-parts-band-step::after, .itc-shop-band-step::after { content: ''; position: absolute; inset: -0.45rem 0; }",
      replace: "  .itc-hangar-band-step::after, .itc-parts-band-step::after, .itc-shop-band-step::after { content: ''; position: absolute; inset: -0.7rem -0.6rem; }",
    },
  },
  {
    decision: '0606',
    suite: 'tests/menus-round.browser.test.ts',
    broke: 'the table drawing no tier',
    guard: 'draws each run’s tier on the title’s table',
    edit: { path: 'src/app/chrome.ts', find: "          [line.tier, 'board-tier'],\n", replace: '' },
  },
  {
    decision: '0606',
    suite: 'tests/menus-round.browser.test.ts',
    broke: 'the tier put away on a phone, as how far the run got is',
    guard: 'draws each run’s tier on the title’s table',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  .itc-title-body .itc-title-board-tier { grid-column: 2; font-size: 0.78em; margin-top: -0.35em; opacity: 0.7; }',
      replace: '  .itc-title-body .itc-title-board-tier { display: none; }',
    },
  },
  {
    decision: '0606',
    suite: 'tests/score.test.ts',
    broke: 'two tiers saying the same word',
    guard: 'the table says the tier each run was flown on',
    edit: { path: 'src/content/difficulty.ts', find: "    short: 'Burn',\n", replace: "    short: 'Savior',\n" },
  },
];
