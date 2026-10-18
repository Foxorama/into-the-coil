// The breaks behind docs/decisions/0620-the-weasel-keeps-its-overalls.md.
//
// ⚠️ The seat of Unity's overalls in the ball, in the navy they wear standing. Gone, the weasel is bare again;
// in another ink, it is a different weasel's trousers.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0620',
    suite: 'tests/riders.test.ts',
    broke: 'Unity bare from the waist down in the ball, as before the ask',
    guard: 'Unity keeps their overalls on in the ball',
    edit: {
      path: 'src/render/bake.ts',
      find: '  poly(ctx, f, navy, ps([...seat.map(([x, y]) => [x, -y] as Pt), ...[...seat].reverse()]));',
      replace: '  void seat;',
    },
  },
  {
    decision: '0620',
    suite: 'tests/riders.test.ts',
    broke: 'the overalls in the ball in a navy that is not the one Unity wears standing',
    guard: 'Unity keeps their overalls on in the ball',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const navy = shade(palette.player, -0.66);\n  const side = pose === 1 ? -1 : 1;',
      replace: '  const navy = shade(palette.player, -0.5);\n  const side = pose === 1 ? -1 : 1;',
    },
  },
];
