// The real bosses are drawn — docs/decisions/0264-the-real-bosses-are-drawn.md
//
// Every guard 0264 adds, broken on purpose. `node scripts/prove-guard.mjs 0264`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0264',
    suite: 'tests/foes.test.ts',
    // The serpent back in the raiders' grey.
    broke: 'the Approach’s lord given its raiders’ skin, which is the grey tentacle',
    guard: 'THE LORD: every place skins its real boss in a skin of its own',
    edit: {
      path: 'src/content/themes.ts',
      find: "    lord: { hull: '#2f8a5a', plate: '#123d2a', lit: '#b8ff9a', eye: '#ffc030' },",
      replace: "    lord: { hull: '#9a9a9a', plate: '#4c4c56', lit: '#ff7286', eye: '#ff4040' },",
    },
  },
  {
    decision: '0264',
    suite: 'tests/foes.test.ts',
    // The lord skinned on the palette that declares its decoration void.
    broke: 'the lord skinned on the high-contrast palette, which 0024 says gets the flat game',
    guard: 'THE LORD: every place skins its real boss in a skin of its own',
    edit: {
      path: 'src/content/themes.ts',
      find: '  return foeOf(theme, palette) === null ? null : THEMES[theme].lord;',
      replace: '  void palette;\n  return THEMES[theme].lord;',
    },
  },
  {
    decision: '0264',
    suite: 'tests/foes.test.ts',
    // The table says lord and the painter reads foe.
    broke: 'the painter sealing every boss in the place’s foe skin, so the lord row is a row nobody reads',
    guard: 'and the lord’s hull is sealed in it',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const skin = hurt ? null : LORD_HULLS.includes(kind) ? lordOf(theme, palette) : foeOf(theme, palette);',
      replace: '  const skin = hurt ? null : foeOf(theme, palette);',
    },
  },
  {
    decision: '0264',
    suite: 'tests/accents.test.ts',
    // The hydra's heads taken off: five necks and nothing at the end of them.
    broke: 'the hydra’s skulls taken off its necks, so the hull is five stumps',
    guard: '0264 — THE HEADS',
    edit: {
      path: 'src/render/bake.ts',
      find: '    for (const [px, py] of HYDRA_HEAD) out.push(at(px, py));\n',
      replace: '',
    },
  },
  {
    decision: '0264',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ **RE-POINTED FOR 0276, AND IT BREAKS THE OPPOSITE FAULT NOW.** The guard used to hold a span
      — *no wider than its neck, so it is a tentacle* — and that proxy was retired when it turned out
      to be FALSE of a good serpent: a real snake's head is about its neck's width. What the guard
      holds instead is *longer than it is tall*, so what reddens it is the blob, which is the fault
      this project actually shipped twice. The tentacle's other half, the skin, is still held by
      `THE LORD` in `tests/foes.test.ts`.
    */
    broke: 'the serpent’s skull squashed taller than it is long, which is the blob the report named',
    guard: '0264 — THE HEADS',
    edit: {
      path: 'src/render/bake.ts',
      find: '  [-0.7, 0.088],\n  [-0.83, 0.122],\n  [-0.98, 0.131],\n  [-1.07, 0.09],\n  [-1.085, 0.026],\n  [-1.065, -0.04],\n  [-0.97, -0.097],\n  [-0.82, -0.138],',
      replace: '  [-0.78, 0.2],\n  [-0.87, 0.24],\n  [-0.95, 0.18],\n  [-0.97, 0.0],\n  [-0.95, -0.18],\n  [-0.87, -0.24],\n  [-0.78, -0.2],',
    },
  },
];
