// The breaks behind docs/decisions/0363-the-rock-goes-up.md.
//
// Asked for: *"background rocks fire up into the air and off the screen, but they don't fall down as
// it's distracting."* Each break is a way the fall comes back.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0363',
    suite: 'tests/jungle.test.ts',
    /*
      What 0347 shipped and this decision removes: the apex put back inside the flight, at 0.4 of it,
      so every rock turns over in sight and falls back down the mountain.
    */
    broke: 'the throw’s apex put back inside the flight, so every rock falls back down in sight',
    guard: 'THE REPORTED ONE, IN PIXELS: rock climbs out of the crater and off the top of the screen, and none comes down',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const u = (1 - Math.sqrt(over / high)) / gone;',
      replace: '    const u = 2.5;',
    },
  },
  {
    decision: '0363',
    suite: 'tests/jungle.test.ts',
    // The first cut, exactly: solved to clear at t = 1, which the step clock never draws — 3px short.
    broke: 'the rock solved to clear the screen at the end of its flight, a step after it is last drawn',
    guard: 'THE REPORTED ONE, IN PIXELS: rock climbs out of the crater and off the top of the screen, and none comes down',
    edit: {
      path: 'src/render/scene.ts',
      find: '  const gone = (period - 1) / period;',
      replace: '  const gone = 1;',
    },
  },
];
