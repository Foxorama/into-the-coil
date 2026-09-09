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
    /*
      ⚠️ **RE-AIMED BY 0284, AND AT THE OTHER HALF OF THE SAME CLAIM.** This guard holds two things
      about the serpent's head — that it is longer than it is tall, and that it is **wider than the
      neck behind it** — and the break used to squash the skull. It cannot any more: 0283 makes the
      head the whole hull and 0284 covers it in paint, so every squash strands the eye, the nostril or
      a fang outside the silhouette and `THE 0149 ONE` fires first. A probe that reddens two guards
      has not shown which one holds what.

      ⚠️ **SO THE NECK IS THICKENED INSTEAD**, which needs no art moved and is the same sentence read
      the other way round: *a head no wider than the body behind it is a worm, whatever is painted on
      it.* 0283 put the neck on the row, so it can simply be said.
    */
    broke: 'the serpent’s neck thickened past its skull, so the head is no wider than the body behind it',
    guard: '0264 — THE HEADS',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0286, which made the body twenty-six segments: only the neck matters here.
      find: '      girth: [6, 8.5,',
      replace: '      girth: [30, 8.5,',
    },
  },
];
