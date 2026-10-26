// The breaks behind docs/decisions/0587-the-ray-gun-is-a-saucer.md and
// docs/decisions/0646-the-ray-gun-hangs-under-the-rim.md: the gun rode above the rim again from the side,
// and squashed into a ball rather than a saucer.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0646',
    suite: 'tests/mounts.test.ts',
    broke: 'the side view’s gun rode the top half again, in the pilot’s view',
    guard: 'THE ASK: from the side, every mark of it is below the rim',
    edit: { path: 'src/render/bake.ts', find: '  side: { x: 0.6, y: 0.2, r: 0.26 },', replace: '  side: { x: 0.6, y: -0.2, r: 0.26 },' },
  },
  {
    decision: '0587',
    suite: 'tests/mounts.test.ts',
    broke: 'the gun a ball rather than a saucer',
    guard: 'THE ASK: from the side, every mark of it is below the rim',
    edit: { path: 'src/render/bake.ts', find: '  const up = R * 0.28;\n  const down = R * 0.22;', replace: '  const up = R * 0.9;\n  const down = R * 0.22;' },
  },
];
