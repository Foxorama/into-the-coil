// The break behind docs/decisions/0676-the-light-is-cast.md.
//
// ⚠️ It puts back the wall as the review found it: every tile the same, lit or not by the lamp over it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0676',
    suite: 'tests/light.browser.test.ts',
    broke: 'every wall tile the unlit one, whatever lamp hangs over it',
    guard: 'draws the dock’s wall under a lamp brighter than the wall between its lamps',
    edit: {
      path: 'src/render/port.ts',
      find: '  if (near < LAMP_UNDER) return high ? 2 : 1;\n  return near < LAMP_BESIDE && high ? 1 : 0;',
      replace: '  if (near < LAMP_UNDER) return 0;\n  return near < LAMP_BESIDE && high ? 0 : 0;',
    },
  },
];
