// A wall leaves the hull — docs/decisions/0367-a-wall-leaves-the-hull.md
//
// Every guard 0367 adds, broken on purpose. `node scripts/prove-guard.mjs 0367`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0367',
    suite: 'tests/pilots.test.ts',
    // ⚠️ THE WALL PUT DOWN IN ITS SLOTS AGAIN, which is what shipped: bullets in mid air, 10 to 23
    // units past a sower's wingtips, with nothing on the screen to say where they came from.
    broke: 'the wall put down in its slots again, so its bullets appear in mid air',
    guard: 'THE REPORTED ONE: a wall leaves the hull that fired it, and fans out to its slots',
    edit: {
      path: 'src/app/frame.ts',
      find: '            reset(shot, e.along, e.across, bullet, bulletKind);\n            shot.velAlong = -speed + w.scrollPerStep;\n            shot.velAcross = side * speed;',
      replace: '            reset(shot, e.along, across, bullet, bulletKind);\n            shot.velAlong = -speed + w.scrollPerStep;\n            shot.velAcross = side * speed;',
    },
  },
  {
    decision: '0367',
    suite: 'tests/pilots.test.ts',
    // ⚠️ NEVER STOPPED ON ITS SLOT: the fan goes on opening into a V, and the hole the player was
    // promised grows with every step it travels.
    broke: 'a wall’s shot never stopped on its slot, so the fan goes on opening into a V',
    guard: 'THE REPORTED ONE: a wall leaves the hull that fired it, and fans out to its slots',
    edit: {
      path: 'src/app/frame.ts',
      find: '    shot.across = shot.steerAcross;\n    shot.velAcross = 0;\n    shot.steerAcross = 0;',
      replace: '    shot.steerAcross = 0;',
    },
  },
];
