// The breaks behind docs/decisions/0069-the-sky-is-behind-the-game.md.
//
// ⚠️ The guard reads `skyField` — what will be DRAWN — and never the ceiling constant. The second
// probe is why: it restores the shape the old code had, a fraction of the TILE, which is how a star
// larger than a bullet stayed in the build unnoticed. A test asserting the constant against a number
// written beside it goes green on that break and on the first one.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0069',
    suite: 'tests/budget.test.ts',
    // THE REPORTED ONE, restored: the near layer at the size it shipped at, which is 1.2 world units
    // against a pulse's 0.9 — the background drawing discs bigger than the smallest thing that kills.
    broke: 'the near layer’s stars restored to the size they shipped at',
    guard: 'THE REPORTED ONE: no star is drawn as big as the smallest thing that can kill the player',
    // ⚠️ The ceiling became per-layer again in 0080, which gave the near field its own perspective —
    // so the break restores the near layer alone, which is exactly what it always meant.
    edit: {
      path: 'src/render/bake.ts',
      find: 'const SKY_MAX_STAR_UNITS = { skyFar: 0.6, skyNear: 0.28, skyRush: 0.24 };',
      replace: 'const SKY_MAX_STAR_UNITS = { skyFar: 0.6, skyNear: 1.2, skyRush: 0.24 };',
    },
  },
  {
    decision: '0069',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE SHAPE THE BUG HAD, not merely the value. A fraction of the tile cannot be compared with
      anything: `0.012` reads as *just over one percent* and is 1.2 world units on a tile
      `ACROSS_SPAN` across. Restoring the form is the break most likely to be reintroduced by someone
      tidying a conversion away.
    */
    broke: 'the size ceiling written as a fraction of the tile again, which is how it hid',
    guard: 'THE REPORTED ONE: no star is drawn as big as the smallest thing that can kill the player',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const biggest = perUnit * SKY_MAX_STAR_UNITS[kind];',
      replace: "  const biggest = size * (kind === 'skyNear' ? 0.012 : 0.006);",
    },
  },
  {
    decision: '0069',
    suite: 'tests/budget.test.ts',
    // The other half of the report. Size alone puts the stars under a bullet; the alpha is what puts
    // them behind the game, and a layer drawn as solidly as the far one is the state before this.
    broke: 'the near layer drawn as solidly as the far one',
    guard: 'and the near layer is the quiet one, on every count that buys attention',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const SKY_ALPHA = { skyFar: 1, skyNear: 0.34, skyRush: 0.46 };',
      replace: 'const SKY_ALPHA = { skyFar: 1, skyNear: 1, skyRush: 0.46 };',
    },
  },
];
