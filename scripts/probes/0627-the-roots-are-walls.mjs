// The breaks behind docs/decisions/0627-the-roots-are-walls.md.
//
// ⚠️ The roots are met where they are drawn, by the ship and by every shot; and the serpent's body comes down
// through the far wall, breaks it, and is left out of the picture where it broke.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0627',
    suite: 'tests/serpent.test.ts',
    broke: 'the roots scenery to the ship again',
    guard: 'a ship flown into a root is put back out of it and hurt',
    edit: { path: 'src/app/frame.ts', find: '      rootsStrikeShip(w, shelled);', replace: '      void shelled;' },
  },
  {
    decision: '0627',
    suite: 'tests/serpent.test.ts',
    broke: 'shots flying on through the roots',
    guard: 'and a shot stops at a root',
    edit: { path: 'src/app/frame.ts', find: '    stoneStops(w);\n    rootsStop(w);', replace: '    stoneStops(w);' },
  },
  {
    decision: '0627',
    suite: 'tests/serpent.test.ts',
    broke: 'the wall met wider than the roots are drawn',
    guard: 'WHAT IS MET IS WHAT IS DRAWN',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const r = SPRITE_EXTENT[kind] * 0.42;\n    const cos = Math.cos(piece.turn);',
      replace: '    const r = SPRITE_EXTENT[kind] * 0.6;\n    const cos = Math.cos(piece.turn);',
    },
  },
  {
    decision: '0627',
    suite: 'tests/serpent.test.ts',
    broke: 'the serpent’s body going with its head, as before the ask',
    guard: 'wherever it dies, its body falls through the far wall',
    edit: {
      path: 'src/app/frame.ts',
      find: '        if (w.bossRow.slump !== undefined && w.bossBody.size > 0) w.slumpFor = 0;',
      replace: '        if (w.bossRow.slump !== undefined && w.bossBody.size < 0) w.slumpFor = 0;',
    },
  },
  {
    decision: '0627',
    suite: 'tests/serpent.test.ts',
    broke: 'a broken root still drawn',
    guard: 'wherever it dies, its body falls through the far wall',
    edit: {
      path: 'src/render/scene.ts',
      find: '      if (room.broken !== null && room.broken[i] === 1) continue;',
      replace: '      if (room.broken !== null && room.broken[i] === 2) continue;',
    },
  },
  {
    decision: '0627',
    suite: 'tests/serpent.test.ts',
    broke: 'the body hanging in the lane where it died, never falling through',
    guard: 'wherever it dies, its body falls through the far wall',
    edit: {
      path: 'src/content/bosses.ts',
      find: "    slump: { gravity: 0.045, stagger: 1, slide: 0.12 },",
      replace: "    slump: { gravity: 0, stagger: 1, slide: 0.12 },",
    },
  },
  {
    decision: '0627',
    suite: 'tests/serpent.test.ts',
    broke: 'a far wall with a way through it before anything broke it',
    guard: 'wherever it dies, its body falls through the far wall',
    edit: {
      path: 'src/content/bosses.ts',
      find: "        { sprite: SPRITE.rootTrunk, along: 207, across: 92, turn: Math.PI / 2, far: false, solid: true, breaks: true },",
      replace: "        { sprite: SPRITE.rootTrunk, along: 207, across: 60, turn: Math.PI / 2, far: false, solid: true, breaks: true },",
    },
  },
];
