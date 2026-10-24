// The breaks behind docs/decisions/0630-the-guns-are-not-blocks.md.
//
// ⚠️ Each puts one gun back to the block it was, in its ship's outline, which the guard reads at the fight's camera.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0630',
    suite: 'tests/launchers.test.ts',
    broke: 'the estate’s launcher a block again',
    guard: 'draws the estate’s launcher as a drum',
    edit: {
      path: 'src/render/bake.ts',
      find: '...roundel(ESTATE_STAR[0], ESTATE_STAR[1], ESTATE_DRUM, 16, Math.PI * 0.74, Math.PI * 2.26)',
      replace: '[12.6, -1.6], [15.9, -1.6]',
    },
  },
  {
    decision: '0630',
    suite: 'tests/launchers.test.ts',
    broke: 'the duck’s marker a box again, no grip and its front corner square',
    guard: 'draws the estate’s launcher as a drum',
    edit: {
      path: 'src/render/bake.ts',
      find: '  [15.8, 2.1],\n  [14.5, 2.4],\n  [14.2, 3.9],\n  [12.9, 3.9],\n  [13.1, 2.4],\n  [11.6, 2.4],',
      replace: '  [16, 2.4],\n  [11.6, 2.4],',
    },
  },
  {
    decision: '0630',
    suite: 'tests/launchers.test.ts',
    broke: 'the fighter’s pulse a block to its mouth again, no brake',
    guard: 'draws the estate’s launcher as a drum',
    // ⚠️ Re-anchored by 0662: the fighter hangs its pulse under its hull, so the brake the player sees is the mount's.
    edit: {
      path: 'src/render/bake.ts',
      find: '        p(mx - PULSE_BRAKE, -0.14),\n        p(mx, -0.14),\n        p(mx, 0.14),\n        p(mx - PULSE_BRAKE, 0.14),',
      replace: '        p(mx - PULSE_BRAKE, -0.1),\n        p(mx, -0.1),\n        p(mx, 0.1),\n        p(mx - PULSE_BRAKE, 0.1),',
    },
  },
];
