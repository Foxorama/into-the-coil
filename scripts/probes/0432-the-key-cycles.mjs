// The breaks behind docs/decisions/0432-the-key-cycles.md.
//
// A cycling key can lie two ways a still image of the title will never show: every face up at once,
// stacked into one smudge, or every face on the same clock so one is shown forever and the others
// never are. Both look like a key in a screenshot taken at the right moment.
//
// ⚠️ Re-anchored by 0458, which moved the key off the title into How to play's `buildGuide`: the same
// two lines, at the shallower indent of a function of their own.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0432',
    suite: 'tests/hud.browser.test.ts',
    broke: 'every face of a cycling pickup on the same clock, so one face is all the key ever says',
    guard: '0432 — one row per pickup',
    edit: {
      path: 'src/app/chrome.ts',
      find: "          turn.style.animationDelay = String((-((count - face) % count) * PICKUP_CYCLE_STEPS) / STEPS_PER_SECOND) + 's';",
      replace: "          turn.style.animationDelay = '0s';",
    },
  },
  {
    decision: '0432',
    suite: 'tests/hud.browser.test.ts',
    broke: 'the turns never set, so every face of a row is up at once',
    guard: '0432 — one row per pickup',
    edit: {
      path: 'src/app/chrome.ts',
      find: "          turn.style.animationName = prefix + 'key-face-' + String(count);",
      replace: "          turn.style.animationName = 'none';",
    },
  },
];
