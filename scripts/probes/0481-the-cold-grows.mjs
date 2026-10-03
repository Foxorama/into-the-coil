// The cold grows rather than zooming — docs/decisions/0481-the-cold-grows.md
//
// Every guard 0481 adds or moves, broken on purpose. `node scripts/prove-guard.mjs 0481`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0481',
    suite: 'tests/frost.test.ts',
    // The report, put back: the flakes swelled with the cold, so at its top every one is a saucer.
    broke: 'a patch swelled with the cold’s radius',
    guard: 'THE REPORTED ONE, IN PIXELS',
    edit: {
      path: 'src/app/frame.ts',
      find: '      patch.swell = w.chillRadius > 0 ? 1 : 0;',
      replace: '      patch.swell = w.chillRadius / chill.radius;',
    },
  },
  {
    decision: '0481',
    suite: 'tests/frost.test.ts',
    // The flakes stood still on the hull as the cold grew: the field grows and nothing in it moves out.
    broke: 'the patches held at the cold’s rest while it swells',
    guard: 'THE REPORTED ONE, IN PIXELS',
    edit: {
      path: 'src/app/frame.ts',
      find: '      patch.along = head.along + Math.cos(angle) * ring.at * w.chillRadius;\n      patch.across = head.across + Math.sin(angle) * ring.at * w.chillRadius;',
      replace: '      patch.along = head.along + Math.cos(angle) * ring.at * chill.radius;\n      patch.across = head.across + Math.sin(angle) * ring.at * chill.radius;',
    },
  },
  {
    decision: '0481',
    suite: 'tests/frost.test.ts',
    // The veil back at its old weight, which the report said overpowers the screen.
    broke: 'the cold’s marks at the weight that overpowered the screen',
    guard: 'THE ASKED-FOR ONE, HEAVILY TRANSPARENT',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const CHILL_OPACITY = 0.25;',
      replace: 'const CHILL_OPACITY = 0.45;',
    },
  },
];
