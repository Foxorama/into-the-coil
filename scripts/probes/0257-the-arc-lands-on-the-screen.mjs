// The arc lands on the screen — docs/decisions/0257-the-arc-lands-on-the-screen.md
//
// Every guard 0257 adds, broken on purpose. `node scripts/prove-guard.mjs 0257`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0257',
    suite: 'tests/weapons.test.ts',
    // The bound removed: the chain reaches past the screen again, which is what shipped.
    broke: 'the screen bound taken off the chain, so a bolt lands on a body the player has not seen',
    guard: '0257 — THE SCREEN: from the front of the box',
    edit: {
      path: 'src/sim/collide.ts',
      find: '    if (target.along + target.radius > edge) continue;\n',
      replace: '',
    },
  },
  {
    decision: '0257',
    suite: 'tests/weapons.test.ts',
    // The bound on the centre rather than the hull: a body half over the edge is struck on its first frame.
    broke: 'the bound measured on the body’s centre, so a hull still crossing the edge is struck',
    guard: '0257 — THE SCREEN: from the front of the box',
    edit: {
      path: 'src/sim/collide.ts',
      find: '    if (target.along + target.radius > edge) continue;',
      replace: '    if (target.along > edge) continue;',
    },
  },
  {
    decision: '0257',
    suite: 'tests/weapons.test.ts',
    // The edge passed as the widest view rather than the player's own, so a 16:9 screen is struck past.
    broke: 'the chain bounded by the widest view any device has rather than the one the player has',
    guard: '0257 — THE SCREEN: from the front of the box',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const edge = w.cameraAlong + w.view.alongSpan;',
      replace: '  const edge = w.cameraAlong + w.view.alongSpan * 2;',
    },
  },
];
