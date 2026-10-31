// The breaks behind docs/decisions/0704-the-pickup-faces-are-finished.md.
//
// The faces as they shipped before 0704, in the one respect a guard holds: no rim light. Two ways it goes: the
// shared helper loses its light, so every face is flat at once; or one face skips the helper, so it is the one
// flat icon beside eleven finished ones — the case the guard is for.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0704',
    suite: 'tests/accents.test.ts',
    broke: 'the rim light taken out of faceRim, so all twelve pickup faces are the flat icons they were',
    guard: '0704: every pickup face wears a rim light inside its edges, wide enough to be drawn',
    edit: {
      path: 'src/render/bake.ts',
      find: '  rimLight(ctx, f, shade(ink, 0.5), 0.75, top, bottom, sealWidth, outline);\n}',
      replace: '  void top;\n  void bottom;\n  void sealWidth;\n  void outline;\n  void f;\n}',
    },
  },
  {
    decision: '0704',
    suite: 'tests/accents.test.ts',
    broke: "the nova's face drawn without its rim, the one flat face beside eleven finished ones",
    guard: '0704: every pickup face wears a rim light inside its edges, wide enough to be drawn',
    edit: {
      path: 'src/render/bake.ts',
      find: '      faceRim(ctx, fg, ink, (pen) => trace(pen, fg, points));\n',
      replace: '',
    },
  },
];
