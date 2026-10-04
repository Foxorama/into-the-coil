// The ray gun hangs under the lip — docs/decisions/0493-the-ray-gun-hangs-under-the-lip.md
//
// Every guard 0493 adds, broken on purpose. `node scripts/prove-guard.mjs 0493`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0493',
    suite: 'tests/mounts.test.ts',
    // The gun painted over the disc again, as it was: a thing sitting on the saucer.
    broke: 'the ray gun painted once more after the dome, over the disc',
    guard: 'UNDER THE LIP: the emitter is painted before the disc’s face, so the face covers it to the rim',
    edit: {
      path: 'src/render/bake.ts',
      find: '  disc(ctx, f, palette.impact, -0.15 * D, -0.17 * D, 0.075, 0.9);\n}',
      replace: '  disc(ctx, f, palette.impact, -0.15 * D, -0.17 * D, 0.075, 0.9);\n  paintRaygun(ctx, f, palette);\n}',
    },
  },
  {
    decision: '0493',
    suite: 'tests/mounts.test.ts',
    // The muzzle back to 0467's orb: a small point that fires a large ring.
    broke: 'the muzzle back to the small orb it was',
    guard: 'A RING IN, A RING OUT: the muzzle is a dish the size of the smallest ring the gun fires',
    edit: {
      path: 'src/render/bake.ts',
      find: '  dish: { x: 1.13 - 0.112, r: 0.112 },',
      replace: '  dish: { x: 1.05, r: 0.08 },',
    },
  },
];
