// The breaks behind docs/decisions/0422-a-place-is-baked-on-every-core.md.
//
// ⚠️ EVERY ONE OF THESE IS A POOL THAT IS FAST AND BAKES OTHER MUSIC — the only way it can fail, and
// the one no audio guard downstream could see: they would all measure what they were handed and go
// green. The guard is the same layer baked in the caller's own thread, compared byte for byte.
//
// What they cannot prove is the speed, for 0115's reason.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0422',
    suite: 'tests/bakes.test.ts',
    // The class 0134 named for the guards, arriving in the pool: a place's material replaced by the base's.
    broke: 'a thread baking the base composition whatever place it was asked for',
    guard: 'THE ONE IT IS FOR: every layer from the pool is the layer baked in this thread, to the byte',
    edit: {
      path: 'tests/bake-worker.mjs',
      find: '    const { buffer, notes } = layerNotes(layer, rate, theme ?? undefined);',
      replace: '    const { buffer, notes } = layerNotes(layer, rate, undefined);',
    },
  },
  {
    decision: '0422',
    suite: 'tests/bakes.test.ts',
    broke: 'a layer copied into its slot only half written, so the rest of it is silence',
    guard: 'THE ONE IT IS FOR: every layer from the pool is the layer baked in this thread, to the byte',
    edit: {
      path: 'tests/bake-worker.mjs',
      find: '    into.set(buffer);',
      replace: '    into.set(buffer.subarray(0, buffer.length >> 1));',
    },
  },
  {
    decision: '0422',
    suite: 'tests/bakes.test.ts',
    // Heaviest first is the order the threads take jobs in; handed back in that order, every layer
    // arrives under another layer's name.
    broke: 'the bakes handed back in the order the threads took them rather than the order asked',
    guard: 'THE ONE IT IS FOR: every layer from the pool is the layer baked in this thread, to the byte',
    edit: {
      path: 'tests/bakes.ts',
      find: '    out[job.at] = Atomics.load(done, j) === 1',
      replace: '    out[j] = Atomics.load(done, j) === 1',
    },
  },
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
