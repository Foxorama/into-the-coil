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
    // The mouth a small point again, firing a large ring. Re-anchored by 0587, whose mouth is an edge-on ring.
    broke: 'the muzzle back to the small orb it was',
    guard: 'A RING IN, A RING OUT: the mouth is an edge-on ring as tall as the first ring the gun throws',
    edit: {
      path: 'src/render/bake.ts',
      find: '    mouth(cx + R * 0.55, cy, R * 0.55);',
      replace: '    mouth(cx + R * 0.55, cy, R * 0.25);',
    },
  },
];
