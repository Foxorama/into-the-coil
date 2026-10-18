// The breaks behind docs/decisions/0632-the-enemies-are-finished.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0632',
    suite: 'tests/accents.test.ts',
    broke: 'the eight shared kinds painted and not finished, flat cut-outs again',
    guard: '0632: every enemy in every place is finished',
    edit: {
      path: 'src/render/bake.ts',
      find: '  finishBody(ctx, f, skin, (pen) => body.outline(pen, f, n));\n',
      replace: '',
    },
  },
  {
    decision: '0632',
    suite: 'tests/accents.test.ts',
    broke: 'the rim light at its share of the radius alone, under a pixel on a small enemy at the fight’s camera',
    guard: '0632: every enemy in every place is finished',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const RIM_FLOOR = 2.5;',
      replace: 'const RIM_FLOOR = 0;',
    },
  },
];
