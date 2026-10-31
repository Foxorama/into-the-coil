// The breaks behind docs/decisions/0701-the-duck-the-caddie-and-the-viper-are-finished.md.
//
// Each of the last three ships as it shipped before 0701 in the one respect a guard holds: no rim light. Since 0701
// 0698's guard walks every ship in `SHIP_KINDS` rather than a list, so each of these is also the guard seen to reach
// a ship it did not reach before.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0701',
    suite: 'tests/accents.test.ts',
    broke: 'the rim light left off the Aqua Duck, so the rubber has no lit edge — every other guard green',
    guard: '0698: every finished ship wears a rim light inside its edges, wide enough to be drawn',
    edit: {
      path: 'src/render/bake.ts',
      find: '  rimLight(ctx, f, shade(body, 0.55), 0.7, top, bottom, sealWidth, duckOutlinePen);\n}',
      replace: '  void top;\n  void bottom;\n  void sealWidth;\n  void duckOutlinePen;\n}',
    },
  },
  {
    decision: '0701',
    suite: 'tests/accents.test.ts',
    broke: 'the rim light left off the little caddie, so the disc is the flat coin it was at its edge — every other guard green',
    guard: '0698: every finished ship wears a rim light inside its edges, wide enough to be drawn',
    edit: {
      path: 'src/render/bake.ts',
      find: '  rimLight(ctx, f, shade(body, 0.5), 0.75, top, bottom, sealWidth, caddieOutline);\n}',
      replace: '  void top;\n  void bottom;\n  void sealWidth;\n  void caddieOutline;\n}',
    },
  },
  {
    decision: '0701',
    suite: 'tests/accents.test.ts',
    broke: 'the rim light left off the Viper, so the serpent has no lit back — every other guard green',
    guard: '0698: every finished ship wears a rim light inside its edges, wide enough to be drawn',
    edit: {
      path: 'src/render/bake.ts',
      find: '  rimLight(ctx, f, shade(body, 0.45), 0.75, top, bottom, sealWidth, viperOutlinePen);\n}',
      replace: '  void top;\n  void bottom;\n  void sealWidth;\n  void viperOutlinePen;\n}',
    },
  },
];
