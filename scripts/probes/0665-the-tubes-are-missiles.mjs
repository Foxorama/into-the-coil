// The breaks behind docs/decisions/0665-the-tubes-are-missiles.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0665',
    suite: 'tests/pad-tubes.test.ts',
    // The upper canard taken off: a body as wide as its nose all the way back.
    broke: 'a tube with no canards',
    guard: 'THE ASK, IN ITS SHAPE: canards behind the warhead',
    edit: { path: 'src/render/bake.ts', find: '  [0.32, -0.42],\n  [0.2, -0.42],\n', replace: '' },
  },
  {
    decision: '0665',
    suite: 'tests/pad-tubes.test.ts',
    // The motor dark.
    broke: 'a tube with no light at its tail',
    guard: 'and its motor lit at the tail',
    edit: { path: 'src/render/bake.ts', find: '  glow(ctx, f, palette.hazard, tail![0], tail![1], 0.2 * k, 0.7);\n', replace: '' },
  },
];
