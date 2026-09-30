// The breaks behind docs/decisions/0422-a-place-is-baked-on-every-core.md.
//
// ⚠️ THE POOL THIS DECISION ADDED IS GONE — docs/decisions/0423-the-pool-is-taken-out-and-a-page-boot-is-sized-under-the-suite.md
// took it back out, and its three probes went with it. What stands is the guard on the cache's copies,
// which holds a claim `tests/bakes.ts` had made in prose since 0115.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0422',
    suite: 'tests/bakes.test.ts',
    broke: 'the cached bake handed out itself rather than a copy, so one test can move another’s subject',
    guard: 'and what it hands out is a copy',
    edit: {
      path: 'tests/bakes.ts',
      find: '  for (const layer of MUSIC_LAYERS) out[layer] = Float32Array.from(baked[layer]);',
      replace: '  for (const layer of MUSIC_LAYERS) out[layer] = baked[layer];',
    },
  },
];
