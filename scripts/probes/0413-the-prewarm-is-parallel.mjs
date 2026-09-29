// The breaks behind docs/decisions/0413-the-prewarm-is-parallel.md.
//
// One per claim: the loops walked here although a pool was handed over, a drain that leaves what is
// still on a worker empty, a late reply that overwrites a set already handed to the speaker, and the
// pool handed over only after the prewarm has started — which every headless test would pass.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0413',
    suite: 'tests/sound.test.ts',
    broke: 'the loops walked on the page although a pool was handed over',
    guard: '0413 — WITH A POOL, THE LOOPS GO TO IT',
    edit: {
      path: 'src/app/sound.ts',
      find: '    if (baker !== null) {\n      remote.add(layer);',
      replace: '    if (baker === undefined) {\n      remote.add(layer);',
    },
  },
  {
    decision: '0413',
    suite: 'tests/sound.test.ts',
    broke: 'a press with layers still out leaving them empty',
    guard: '0413 — AND A PRESS WITH LAYERS STILL OUT BAKES THEM HERE',
    edit: {
      path: 'src/app/sound.ts',
      find: '  for (const layer of pending.remote) pending.loops[layer] = bakeLayer(layer, SAMPLE_RATE);\n',
      replace: '',
    },
  },
  {
    decision: '0413',
    suite: 'tests/sound.test.ts',
    broke: 'a late reply from the pool overwriting a set already handed to the speaker',
    guard: '0413 — AND A PRESS WITH LAYERS STILL OUT BAKES THEM HERE',
    edit: {
      path: 'src/app/sound.ts',
      find: '        if (!set.remote.delete(layer)) return;',
      replace: '        set.remote.delete(layer);',
    },
  },
  {
    decision: '0413',
    suite: 'tests/intro.browser.test.ts',
    broke: 'the pool handed over after the prewarm has started, so every layer is walked on the page again',
    guard: 'sends every base layer of the music to the bake pool',
    edit: {
      path: 'src/main.ts',
      find: '  useLayerBaker(makeBakePool());\n  const mounted = mount(app, DEFAULT_PALETTE);',
      replace: '  const mounted = mount(app, DEFAULT_PALETTE);\n  useLayerBaker(makeBakePool());',
    },
  },
];
