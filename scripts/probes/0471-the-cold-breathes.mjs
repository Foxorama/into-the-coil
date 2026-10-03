// The cold breathes — docs/decisions/0471-the-cold-breathes.md
//
// Every guard 0471 adds, broken on purpose. `node scripts/prove-guard.mjs 0471`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0471',
    suite: 'tests/frost.test.ts',
    // The report, put back: the cold snaps from its reach to its rest on one step.
    broke: 'the retract one step long, so the cold resets rather than drawing back',
    guard: 'THE REPORTED ONE, IN THE LANE',
    edit: {
      path: 'src/content/bosses.ts',
      find: '      swell: 390,\n      retract: 150,',
      replace: '      swell: 390,\n      retract: 1,',
    },
  },
  {
    decision: '0471',
    suite: 'tests/frost.test.ts',
    // A retract that runs the wrong way: the cold keeps swelling past its top and then wraps.
    broke: 'the retract swelling on instead of drawing back',
    guard: 'THE PULSE, DRIVEN',
    edit: {
      path: 'src/content/bosses.ts',
      find: '  if (t < chill.swell + chill.retract) return ease(1 - (t - chill.swell) / chill.retract);',
      replace: '  if (t < chill.swell + chill.retract) return chill.reach + (t - chill.swell) / chill.retract;',
    },
  },
];
