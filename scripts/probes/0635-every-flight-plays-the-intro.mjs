// The break behind docs/decisions/0635-every-flight-plays-the-intro.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0635',
    suite: 'tests/run-ends.browser.test.ts',
    broke: 'the intro the first flight of a visit’s alone again, so a second run goes straight in',
    guard: '0635 — and the next flight plays the intro',
    edit: {
      path: 'src/app/mount.ts',
      // Re-anchored by 0666, whose pilot with no story flies straight in above this.
      find: "    dispatch({ slice: 'screen', type: 'show', screen: 'intro' });\n  }\n  /** Where a screen goes",
      replace:
        '    if (flownThisVisit) {\n' +
        '      startRun();\n' +
        '      return;\n' +
        '    }\n' +
        '    flownThisVisit = true;\n' +
        "    dispatch({ slice: 'screen', type: 'show', screen: 'intro' });\n" +
        '  }\n' +
        '  let flownThisVisit = false;\n' +
        '  /** Where a screen goes',
    },
  },
];
