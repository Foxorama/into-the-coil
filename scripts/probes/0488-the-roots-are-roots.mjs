// The roots are roots — docs/decisions/0488-the-roots-are-roots.md
//
// Every guard 0488 adds, broken on purpose. `node scripts/prove-guard.mjs 0488`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0488',
    suite: 'tests/serpent.test.ts',
    // The knot somewhere the serpent does not coil: it arrives round nothing.
    broke: 'the knot away from the coil’s centre',
    guard: 'THE ASK: the serpent’s room is framed by pieces of root',
    edit: {
      path: 'src/content/bosses.ts',
      find: '        { sprite: SPRITE.rootKnot, along: 107, across: ACROSS_SPAN / 2, turn: 0.4, far: false, entrance: true },',
      replace: '        { sprite: SPRITE.rootKnot, along: 140, across: ACROSS_SPAN / 2, turn: 0.4, far: false, entrance: true },',
    },
  },
  {
    decision: '0488',
    suite: 'tests/serpent.test.ts',
    // A root laid into the lane the ship flies: scenery that looks like a thing to fly round.
    broke: 'the top trunk laid inside the ship’s box',
    guard: 'IN LANE UNITS: no piece but the knot crosses the ship’s box',
    edit: {
      path: 'src/content/bosses.ts',
      find: '        { sprite: SPRITE.rootTrunk, along: 150, across: -3.5, turn: 0, far: false, entrance: false },',
      replace: '        { sprite: SPRITE.rootTrunk, along: 150, across: 10, turn: 0, far: false, entrance: false },',
    },
  },
  {
    decision: '0488',
    suite: 'tests/serpent.test.ts',
    // The knot left standing in the open lane for the whole fight.
    broke: 'the knot never sinking',
    guard: 'AND THE KNOT SINKS ONCE THE SERPENT HAS ARRIVED, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '  else if (w.bossSpawned && w.room.knot > 0) w.room.knot = Math.max(0, w.room.knot - 1 / KNOT_SINKS);',
      replace: '  else if (w.bossSpawned && w.room.knot > 0) w.room.knot = Math.max(0, w.room.knot - 0 / KNOT_SINKS);',
    },
  },
  {
    decision: '0488',
    suite: 'tests/serpent.test.ts',
    // The serpent coiling in round nothing, the knot already gone.
    broke: 'the knot not standing while the serpent coils in',
    guard: 'AND THE KNOT SINKS ONCE THE SERPENT HAS ARRIVED, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.bossPool.size > 0 && w.bossEntering >= 0) w.room.knot = 1;',
      replace: '  if (w.bossPool.size > 0 && w.bossEntering >= 0) w.room.knot = 0;',
    },
  },
];
