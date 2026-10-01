// The breaks behind docs/decisions/0442-the-ray-gun.md.
//
// Asked for: *"a ray gun that fires four concentric purple energy rings that explode on impact with a
// small energy explosion."*

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0442',
    suite: 'tests/ray.test.ts',
    // No burst: a ring is spent where it lands and nothing goes off, so the ray is a slow pulse.
    broke: 'the rings landed and went off as nothing',
    guard: 'THE ASK: a ring that lands goes off there',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (rayHits !== null) burstRays(w, rayHits);',
      replace: '    if (rayHits === null) burstRays(w, w.landed);',
    },
  },
  {
    decision: '0442',
    suite: 'tests/ray.test.ts',
    // The ring's landing never logged, so there is nowhere for a burst to go off.
    broke: 'a ring landing on a body left no place for its burst',
    guard: 'THE ASK: a ring that lands goes off there',
    edit: {
      path: 'src/app/frame.ts',
      find: "    const rayHits = w.weapon.flight === 'burst' ? w.landed : null;",
      replace: "    const rayHits = w.weapon.flight === 'chain' ? w.landed : null;",
    },
  },
  {
    decision: '0442',
    suite: 'tests/ray.test.ts',
    // The pages never turn: four rings that never ripple.
    broke: 'a ring in flight kept its first page',
    guard: 'and a ring in flight ripples',
    edit: {
      path: 'src/app/frame.ts',
      find: '    // And a ring\'s ripple — 0442.\n    stepRays(w);',
      replace: '    // And a ring\'s ripple — 0442.',
    },
  },
];
