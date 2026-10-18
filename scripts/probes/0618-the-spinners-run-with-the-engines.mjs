// The breaks behind docs/decisions/0618-the-spinners-run-with-the-engines.md.
//
// ⚠️ The spinners wind with what the engines are doing: a pace that ignored the ask would turn at the
// Mothership's pace for good and pass every guard 0527 wrote; one that jumped to its pace would spin a
// wheel round in a step.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0618',
    suite: 'tests/wheels.test.ts',
    broke: 'the spinners at the idle pace whatever the engines do',
    guard: 'turn faster under the burn and slower under the brake',
    edit: {
      path: 'src/app/frame.ts',
      find: '    w.wheelPace += (row.pace[thrustOf(w.warp, w.intent.along)] - w.wheelPace) * WHEEL_PACE_EASE;',
      replace: '    w.wheelPace += (row.pace.idle - w.wheelPace) * WHEEL_PACE_EASE;',
    },
  },
  {
    decision: '0618',
    suite: 'tests/wheels.test.ts',
    broke: 'the burn pace the same as the idle',
    guard: 'turn faster under the burn and slower under the brake',
    edit: {
      path: 'src/content/rims.ts',
      find: 'pace: { idle: 1, burn: 2.5, ease: 0.35 }',
      replace: 'pace: { idle: 1, burn: 1, ease: 0.35 }',
    },
  },
  {
    decision: '0618',
    suite: 'tests/wheels.test.ts',
    broke: 'the wheels turned by the pace on the run clock, so a change of pace jumps them round',
    guard: 'turn faster under the burn and slower under the brake',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const rolled = w.wheelClock;\n  const rolledWas = w.wheelWas;',
      replace: '  const rolled = now * w.wheelPace;\n  const rolledWas = was * w.wheelPace;',
    },
  },
];
