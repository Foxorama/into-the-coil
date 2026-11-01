// The breaks behind docs/decisions/0587-the-ray-gun-is-a-little-saucer.md and
// docs/decisions/0683-the-ray-gun-hangs-under-the-rim.md.
//
// ⚠️ 0705 made the gun a node — a ball with a ring of light, the same from above and from the side — so the
// saucer claim (*wider than it is tall*) and its probe here (`the gun a ball rather than a saucer`, which
// stretched the saucer's lens upward) are gone: a ball is exactly what that probe made, and the guard now
// asks for one. 0683's claim, nothing of the gun above the rim, holds on the node as it held on the saucer.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0683',
    suite: 'tests/mounts.test.ts',
    broke: 'the side view’s gun rode the top half again, in the pilot’s view',
    guard: 'THE ASK: from the side, every mark of it is below the rim, and it is round',
    // Re-anchored by 0705: the node's drop under the rim's nose, where the saucer's was.
    edit: { path: 'src/render/bake.ts', find: '  side: { x: 0.68, y: 0.32, r: 0.2 },', replace: '  side: { x: 0.68, y: -0.32, r: 0.2 },' },
  },
];
