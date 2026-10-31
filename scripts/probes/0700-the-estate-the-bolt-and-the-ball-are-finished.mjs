// The breaks behind docs/decisions/0700-the-estate-the-bolt-and-the-ball-are-finished.md.
//
// Each ship as it shipped before 0700 in the one respect a guard holds: no rim light, so a flat cut-out that every
// containment guard in the suite is green on. One probe a ship, because the list in 0698's guard is the queue's
// progress and each ship's finish is its own call — a probe that only dropped a ship from the list could not redden
// the guard (0699 wrote one and saw it STILL GREEN).

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0700',
    suite: 'tests/accents.test.ts',
    broke: 'the rim light left off the estate, so it is the flat gilt cut-out it was — every other guard green',
    guard: '0698: every finished ship wears a rim light inside its edges, wide enough to be drawn',
    edit: {
      path: 'src/render/bake.ts',
      find: '  rimLight(ctx, f, shade(paint, 0.45), 0.75, top, bottom, sealWidth, carOutline);\n}',
      replace: '  void top;\n  void bottom;\n  void sealWidth;\n  void carOutline;\n}',
    },
  },
  {
    decision: '0700',
    suite: 'tests/accents.test.ts',
    broke: 'the rim light left off the Thunderbolt, so its black lacquer and its rider are found by nothing — every other guard green',
    guard: '0698: every finished ship wears a rim light inside its edges, wide enough to be drawn',
    edit: {
      path: 'src/render/bake.ts',
      find: '  rimLight(ctx, f, chrome, 0.7, top, bottom, sealWidth, bikeOutline);\n}',
      replace: '  void top;\n  void bottom;\n  void sealWidth;\n  void bikeOutline;\n}',
    },
  },
  {
    decision: '0700',
    suite: 'tests/accents.test.ts',
    broke: 'the rim light left off the Hamster Ball, so the plastic has no lit edge — every other guard green',
    guard: '0698: every finished ship wears a rim light inside its edges, wide enough to be drawn',
    edit: {
      path: 'src/render/bake.ts',
      find: '  rimLight(ctx, f, shade(plastic, 0.55), 0.75, top, bottom, sealWidth, ballOutline);\n}',
      replace: '  void top;\n  void bottom;\n  void sealWidth;\n  void ballOutline;\n}',
    },
  },
];
