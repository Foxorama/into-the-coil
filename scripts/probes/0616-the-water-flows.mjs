// The breaks behind docs/decisions/0616-the-water-flows.md.
//
// One or more per guard 0616 adds to tests/duck.test.ts, and the one it reworks there that holds the landing to the picture.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0616',
    suite: 'tests/duck.test.ts',
    broke: 'a stream laid at the nozzle’s angle this step, as 0595’s rod was',
    guard: 'THE REPORTED ONE: it bows as the nozzle sweeps — its tip trails the nozzle round, in pixels',
    edit: { path: 'src/sim/stream.ts', find: '  return Math.sin(streamAngle(clock - age, sweep, period)) * speed * age;', replace: '  return Math.sin(streamAngle(clock, sweep, period)) * speed * age;' },
  },
  {
    decision: '0616',
    suite: 'tests/duck.test.ts',
    broke: 'a jet that opens at its whole length the step it is pressed',
    guard: 'runs out from the nozzle when it opens, at the water’s speed',
    edit: { path: 'src/sim/stream.ts', find: '  return clock < flight ? clock : flight;', replace: '  return flight;' },
  },
  {
    decision: '0616',
    suite: 'tests/duck.test.ts',
    broke: 'a jet whose water vanishes the step the nozzle stops',
    guard: 'flies on off the nozzle when it stops: the last of its water leaves it, still drawn',
    edit: { path: 'src/app/frame.ts', find: '  w.jetFor = jet.steps + jet.flight;', replace: '  w.jetFor = jet.steps;' },
  },
  {
    decision: '0616',
    suite: 'tests/duck.test.ts',
    broke: 'ripples hashed on where they are and the step, so they boil in place as 0610’s did',
    guard: 'its ripples ride out with its water, and do not boil in place',
    edit: {
      path: 'src/render/scene.ts',
      find: '          const ripple = jag(s * 131 + 7, from, 0) * (1 - between) + jag(s * 131 + 7, from + 1, 0) * between;',
      replace: '          const ripple = jag(s * 131 + 7, v + 1, page) + 0 * between * from;',
    },
  },
  {
    decision: '0616',
    suite: 'tests/duck.test.ts',
    broke: 'a stream drawn bowed and landed straight, as the rod was',
    guard: 'lands only where it is drawn, every step of it, the last included',
    edit: {
      path: 'src/app/frame.ts',
      find: '    STREAM_ACROSS[count] = rootAcross + streamAcross(clock, age, jet.sweep, jet.period, speed);',
      replace: '    STREAM_ACROSS[count] = rootAcross + streamAcross(clock + age, age, jet.sweep, jet.period, speed);',
    },
  },
];
