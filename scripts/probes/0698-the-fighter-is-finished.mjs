// The breaks behind docs/decisions/0698-the-fighter-is-finished.md.
//
// Each is the fighter as it shipped before 0698, or the finish laid where it cannot be seen: a flat
// ship that every containment guard in the suite is green on, which is why the finish needs a guard
// of its own.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0698',
    suite: 'tests/accents.test.ts',
    broke: 'the rim light left off the fighter, so it is the flat cut-out it was — every other guard green',
    guard: '0698: the fighter is finished — a rim light inside its edges, wide enough to be drawn',
    edit: {
      path: 'src/render/bake.ts',
      find: "  rimLight(ctx, f, mix(body, '#ffffff', 0.35), 0.8, top, bottom, sealWidth, outline);\n}",
      replace: '  void top;\n  void bottom;\n  void sealWidth;\n  void outline;\n}',
    },
  },
  {
    decision: '0698',
    suite: 'tests/accents.test.ts',
    broke: 'the rim light laid over the hull rather than atop it, so it widens the silhouette and is not a rim',
    guard: '0698: the fighter is finished — a rim light inside its edges, wide enough to be drawn',
    edit: {
      path: 'src/render/bake.ts',
      find: "  ctx.globalCompositeOperation = 'source-atop';\n  ctx.globalAlpha = RIM_ALPHA;\n  ctx.strokeStyle = rim;",
      replace: "  ctx.globalCompositeOperation = 'source-over';\n  ctx.globalAlpha = RIM_ALPHA;\n  ctx.strokeStyle = rim;",
    },
  },
];
