// The breaks behind docs/decisions/0424-a-bake-is-kept-for-its-source.md.
//
// ⚠️ EVERY ONE OF THESE IS A STORE THAT IS FAST AND HANDS BACK OTHER MUSIC — a tree it was not baked
// from, a place it was not asked for, part of a layer — or a proof that fills the disk. None of them
// could be seen by an audio guard downstream: each would measure what it was handed and go green.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0424',
    suite: 'tests/bake-store.test.ts',
    // Which files exist and not what is in them: an edit to the synth reads last week's bake.
    broke: 'the key taken over the names of src/ alone, so an edited file keeps the bake of the file it was',
    guard: 'THE KEY IS EVERY BYTE',
    edit: {
      path: 'tests/bake-store.ts',
      find: '  for (const path of [...files.keys()].sort()) hash.update(`${path}\\0${files.get(path)}\\n`);',
      replace: '  for (const path of [...files.keys()].sort()) hash.update(`${path}\\n`);',
    },
  },
  {
    decision: '0424',
    suite: 'tests/bake-store.test.ts',
    broke: 'the key blind to the Node that baked it, so another maths library reads this one’s samples',
    guard: 'THE KEY IS EVERY BYTE',
    edit: {
      path: 'tests/bake-store.ts',
      find: '  hash.update(`node ${node}\\n`);',
      replace: '',
    },
  },
  {
    decision: '0424',
    suite: 'tests/bake-store.test.ts',
    broke: 'a layer kept under the base’s name whatever place it belongs to',
    guard: 'THE ONE IT IS FOR: a layer from the store is the layer baked here',
    edit: {
      path: 'tests/bake-store.ts',
      find: "  return join(STORE, treeKey(), `${rate}-${theme ?? 'base'}-${layer}.f32`);",
      replace: '  return join(STORE, treeKey(), `${rate}-base-${layer}.f32`);',
    },
  },
  {
    decision: '0424',
    suite: 'tests/bake-store.test.ts',
    broke: 'a file of any length read as a layer, so a truncated one is silence where the music was',
    guard: 'A PART OF A LAYER IS NOT A LAYER',
    edit: {
      path: 'tests/bake-store.ts',
      find: '  if (bytes.byteLength !== samples * 4) return null;',
      replace: '',
    },
  },
  {
    decision: '0424',
    suite: 'tests/bake-store.test.ts',
    broke: 'a read-only store keeping its bakes anyway, which under a proof is a set of them per probe',
    guard: 'A PROOF ONLY READS',
    edit: {
      path: 'tests/bake-store.ts',
      find: "  if (process.env.ITC_BAKE_STORE === 'read') return bakeLayer(layer, rate, theme);",
      replace: '',
    },
  },
  {
    decision: '0424',
    suite: 'tests/bake-store.test.ts',
    broke: 'the proof telling its vitests to write, so every probe that breaks src/ keeps a whole set of bakes',
    guard: 'A PROOF ONLY READS',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: "export const PROOF_BAKE_STORE = 'read';",
      replace: "export const PROOF_BAKE_STORE = 'write';",
    },
  },
];
