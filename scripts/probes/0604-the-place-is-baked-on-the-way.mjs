// The breaks behind docs/decisions/0604-the-place-is-baked-on-the-way.md.
//
// ⚠️ NOTHING HERE BREAKS HOW SMOOTH THE BURN IS — docs/decisions/0192-a-guard-holds-an-invariant.md.
// Frame times are a property of the machine; the decision has the bench's numbers and says why no
// guard holds them. What these break is what the smoothness rests on and what the chart was reported
// for: the place baked ahead is the place swapped to, the plate is clear of the readout, and the route
// ahead can be seen.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0604',
    suite: 'tests/place-held.test.ts',
    /*
      ⚠️ THE WRONG PLACE BAKED: one place further on. The swap would find nothing that fits, bake the
      right one on the spot, and freeze exactly as before — with nothing on screen to say so.
    */
    broke: 'the break bakes the place after the one being flown to',
    guard: 'bakes, from the break, exactly the place the burn will swap to',
    edit: {
      path: 'src/app/music.ts',
      find: "  if (screen === 'cleared') return placeFor(runLevel);",
      replace: "  if (screen === 'cleared') return placeFor(runLevel + 1);",
    },
  },
  {
    decision: '0604',
    suite: 'tests/place-held.test.ts',
    // Baking on after the swap: the place on screen re-baked behind itself for the rest of the burn.
    broke: 'the place is still baked ahead after it has been swapped in',
    guard: 'and bakes nothing once the swap has happened',
    edit: {
      path: 'src/app/music.ts',
      find: "  if (screen === 'travel' && !swapped) return placeFor(runLevel);",
      replace: "  if (screen === 'travel') return placeFor(runLevel);",
    },
  },
  {
    decision: '0604',
    suite: 'tests/travel.browser.test.ts',
    // The report put back: the plate a rem and a quarter from the top, under the lives and the score.
    broke: 'the plate back at its old top margin, behind the readout',
    guard: 'sits under the readout and the score rather than behind them',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  margin-top: calc(clamp(${STRIP.fontFloorRem}rem, ${STRIP.fontCqh}cqh, ${STRIP.fontCapRem}rem) * ${STRIP.padEm + STRIP.plateEm + STRIP.padEm});',
      replace: '  margin-top: min(1.25rem, 4cqh);',
    },
  },
  {
    decision: '0604',
    suite: 'tests/travel.test.ts',
    // The other half of the report: the route ahead in the raw sky ink, which is 1.0 to 1 on the plate.
    broke: 'the route ahead in the unlifted sky ink',
    guard: 'and the route ahead can be seen on the plate',
    edit: {
      path: 'src/app/chrome.ts',
      find: 'export const CHART_AHEAD_LIFT = 0.6;',
      replace: 'export const CHART_AHEAD_LIFT = 0;',
    },
  },
  {
    decision: '0604',
    suite: 'tests/travel.test.ts',
    // And at its old strength in a lifted ink — the alpha is the other half of what reaches the eye.
    broke: 'the route ahead at its old three tenths',
    guard: 'and the route ahead can be seen on the plate',
    edit: {
      path: 'src/render/bake.ts',
      find: 'export const CHART_AHEAD_ALPHA = 0.85;',
      replace: 'export const CHART_AHEAD_ALPHA = 0.3;',
    },
  },
  {
    decision: '0604',
    suite: 'tests/travel.test.ts',
    // The first value written for it, which cuts the first place's destination ring.
    broke: 'the bezel drawn at 0.49, through the first place’s ring',
    guard: 'and every stop is inside the canvas, ring and all',
    edit: {
      path: 'src/render/bake.ts',
      find: 'export const CHART_BEZEL = 0.497;',
      replace: 'export const CHART_BEZEL = 0.49;',
    },
  },
  {
    decision: '0604',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ THE DASHED LEGS IN THEIR PLACES' COLOURS — the chart's one claim, *these are behind you*, lost
      by the redraw. The guard finds a leg by where it starts now rather than by its index, and this is
      what says that still sees a leg.
    */
    broke: 'the route ahead drawn in its places’ colours',
    guard: 'and the drawing is one disc per level where the curve says',
    edit: {
      path: 'src/render/bake.ts',
      find: '      ctx.strokeStyle = faint;\n      ctx.globalAlpha = CHART_AHEAD_ALPHA;',
      replace: '      ctx.strokeStyle = glowOf(leg + 1);\n      ctx.globalAlpha = CHART_AHEAD_ALPHA;',
    },
  },
];
