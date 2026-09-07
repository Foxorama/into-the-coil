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
    // The serpent's skull shrunk to its neck's width: the tentacle.
    broke: 'the serpent’s skull no wider than its neck, which is the tentacle the report named',
    guard: '0264 — THE HEADS',
    edit: {
      path: 'src/render/bake.ts',
      // ⚠️ RE-ANCHORED FOR 0276, which redrew the skull and renamed it `SERPENT_SKULL`. The guard it
      // reddens is unchanged, and so is what it means: a head no wider than the neck is the tentacle.
      find: '  [-0.76, 0.06],\n  [-0.92, 0.02],\n  [-1.04, -0.1],\n  [-1.09, -0.22],\n  [-1.04, -0.38],\n  [-0.92, -0.52],\n  [-0.78, -0.6],',
      replace: '  [-0.8, -0.1],\n  [-0.95, -0.12],\n  [-1.02, -0.2],\n  [-0.95, -0.4],\n  [-0.8, -0.45],',
    },
  },
];
