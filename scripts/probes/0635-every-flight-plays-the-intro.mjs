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
      /*
        Re-anchored by 0666, whose pilot with no story flies straight in above this; and by 0674, which put the
        visit's flag back behind a setting — so the break is every flight treated as the first, setting or none.
      */
      find: '    if (flownThisVisit && !INTROS[state.settings.intro].everyFlight) {',
      replace: '    if (flownThisVisit) {',
    },
  },
];
