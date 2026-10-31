// The breaks behind docs/decisions/0697-the-bitmap-has-a-budget.md.
//
// Each is the game as it shipped before 0697, or a budget that forgot one of its two callers: every
// one bakes a picture that is sharp on the sheet at 1080p and stretched on the pad, which is exactly
// where it was reported from.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0697',
    suite: 'tests/budget.test.ts',
    broke: 'the budget gone, so the ceiling is the sky’s ten a unit for every kind again — the shipped defect',
    guard: 'under the budget a ship is baked at the pixels it is drawn at',
    edit: {
      path: 'src/render/bake.ts',
      find: 'export const BITMAP_BUDGET = 480;',
      replace: 'export const BITMAP_BUDGET = 0;',
    },
  },
  {
    decision: '0697',
    suite: 'tests/budget.test.ts',
    broke: 'the pad’s own budget sized for the fight, so the ship on the pad is stretched by the stand’s camera',
    guard: 'under the budget a ship is baked at the pixels it is drawn at',
    edit: {
      path: 'src/render/port-bake.ts',
      find: 'export const SHARP_BUDGET = 768;',
      replace: 'export const SHARP_BUDGET = 240;',
    },
  },
  {
    decision: '0697',
    suite: 'tests/budget.test.ts',
    broke: 'the budget applied as the ceiling for every kind, so a sky tile bakes at four a unit — 0065’s defect back',
    guard: 'the bake ceiling is a RESOLUTION, so the biggest bitmap is not the blurriest',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const ceiling = Math.max(extent * MAX_PIXELS_PER_UNIT, budget);',
      replace: '  const ceiling = budget;',
    },
  },
];
