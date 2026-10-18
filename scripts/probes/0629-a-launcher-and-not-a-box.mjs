// The breaks behind docs/decisions/0629-a-launcher-and-not-a-box.md.
//
// ⚠️ Each breaks the launcher's drawing, and the guard reads the drawn silhouette at the fight's camera.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0629',
    suite: 'tests/launchers.test.ts',
    broke: 'the tubes a box on the roof again, the turret’s whole height',
    guard: 'runs back from the missile’s nose twice as long as it is tall',
    edit: {
      path: 'src/render/bake.ts',
      find: '  return [[pod.pylon[0], roofAt(pod.pylon[0])], ...pod.round, [pod.pylon[1], roofAt(pod.pylon[1])]];',
      replace: '  void pod;\n  return [[from, roofAt(from)], [from, top], [to, top], [to, roofAt(to)]];',
    },
  },
  {
    decision: '0629',
    suite: 'tests/launchers.test.ts',
    broke: 'the launcher sat flat on the roof, its pylon its whole length',
    guard: 'runs back from the missile’s nose twice as long as it is tall',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const pylon = [from + (to - from) * 0.28, from + (to - from) * 0.72] as const;',
      replace: '  const pylon = [from, to] as const;',
    },
  },
  {
    decision: '0629',
    suite: 'tests/launchers.test.ts',
    broke: 'the launcher a drum, as deep as half its length',
    guard: 'runs back from the missile’s nose twice as long as it is tall',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const r = Math.min((to - from) * 0.24, 1.15);',
      replace: '  const r = Math.min((to - from) * 0.3, 1.15) * 1.6;',
    },
  },
];
