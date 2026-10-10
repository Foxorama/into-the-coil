// The breaks behind docs/decisions/0586-the-ships-are-lit.md: the lights never laid, the strobe never dark,
// and the ring standing still.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0586',
    suite: 'tests/lamps.test.ts',
    broke: 'the frame laying no light on any ship',
    guard: 'the fighter’s wingtips blink',
    edit: {
      path: 'src/app/frame.ts',
      find: '  for (let k = 0; k < lamps.length && turning + k < w.wheels.size; k++) {',
      replace: '  for (let k = 0; k < 0 && turning + k < w.wheels.size; k++) {',
    },
  },
  {
    decision: '0586',
    suite: 'tests/lamps.test.ts',
    broke: 'a strobe that never goes dark',
    guard: 'the fighter’s wingtips blink',
    edit: {
      path: 'src/content/ships.ts',
      find: "const STROBE: Lamp['frames'] = ['navStrobe', 'navDark', 'navStrobe', 'navDark', 'navDark', 'navDark'];",
      replace: "const STROBE: Lamp['frames'] = ['navStrobe', 'navStrobe', 'navStrobe', 'navStrobe', 'navStrobe', 'navStrobe'];",
    },
  },
  {
    decision: '0586',
    suite: 'tests/lamps.test.ts',
    broke: 'the saucer’s ring of lights standing still',
    guard: 'spins round its disc',
    edit: {
      path: 'src/content/ships.ts',
      find: "hold: 0.2, turn: 2, pad: 'edge' }",
      replace: "hold: 0.2, turn: null, pad: 'edge' }",
    },
  },
];
