// The breaks behind docs/decisions/0439-the-top-is-one-strip.md.
//
// The two ways the strip came apart before it was one: the bar hung lower than the plates beside it,
// and the score stood in a column taller than the row.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0439',
    suite: 'tests/hud.browser.test.ts',
    broke: 'the boss bar hung below the line the readout and the score sit on',
    guard: '0439 — THE ASK: the readout, the boss bar and the score sit on one line',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-playing-boss { filter: none; padding: 0 0.9em; }',
      replace: '.itc-playing-boss { filter: none; padding: 0 0.9em; margin-top: 0.9em; }',
    },
  },
  {
    decision: '0439',
    suite: 'tests/hud.browser.test.ts',
    broke: 'the score stood as a column again, taller than the plates beside it',
    guard: '0439 — THE ASK: the readout, the boss bar and the score sit on one line',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-playing-score { flex-direction: row; align-items: center;',
      replace: '.itc-playing-score { flex-direction: column; align-items: center;',
    },
  },
];
