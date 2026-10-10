// The breaks behind docs/decisions/0589-more-looks.md: a look drawn as another, a rim drawn as another,
// and a flame put back in the frost's colour.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0589',
    suite: 'tests/more-looks.test.ts',
    broke: 'the Firebird’s tiger stripes drawn as its phoenix',
    guard: 'every ship has a fourth look, and no two of a ship’s looks are one picture',
    edit: { path: 'src/render/bake.ts', find: "  } else if (art === 'tiger') {", replace: "  } else if (art === ('tigerless' as ArtKind)) {" },
  },
  {
    decision: '0589',
    suite: 'tests/more-looks.test.ts',
    broke: 'the chrome wires drawn as the gold snowflakes',
    guard: 'no two rims are one picture',
    edit: {
      path: 'src/render/bake.ts',
      find: "      poly(ctx, f, shade(palette.trim, 0.8), snowflake(cx, cy, r * (2.5 / 3.6), turn + Math.PI / 10));\n      disc(ctx, f, palette.player, cx, cy, r * 0.28);",
      replace: "      poly(ctx, f, palette.hazard, snowflake(cx, cy, r * (2.5 / 3.6), turn));\n      disc(ctx, f, shade(palette.trim, 0.6), cx, cy, r * (0.95 / 3.6));",
    },
  },
  {
    decision: '0589',
    suite: 'tests/flames.test.ts',
    broke: 'the plasma flame back in the jade five degrees off the frost',
    guard: '0589: each new flame is held off the shot it was weighed against',
    edit: { path: 'src/content/flames.ts', find: "inks: { outer: '#18c24a', inner: '#8dff9e' }", replace: "inks: { outer: '#009e6a', inner: '#6fffc8' }" },
  },
];
