// The fight happens in a room — docs/decisions/0335-the-fight-happens-in-a-room.md
//
// Every guard 0335 adds, broken on purpose. `node scripts/prove-guard.mjs 0335`.

export const PROBES = [
  {
    decision: '0335',
    suite: 'tests/gyre.test.ts',
    // The room authored away: the level scrolls straight through the fight, as twelve bosses do.
    broke: 'the gyre’s room authored away, so the level scrolls straight through the fight',
    guard: 'THE ROOM: the world comes to rest for the fight',
    edit: {
      path: 'src/content/bosses.ts',
      find: "    room: { stand: 60, settle: 150, mouth: 40, wall: SPRITE.roomWall },",
      replace: '    room: null,',
    },
  },
  {
    decision: '0335',
    suite: 'tests/gyre.test.ts',
    // The rate never read by the frame: the camera runs at the level's rate through the fight.
    broke: 'the room’s rate never read, so the camera runs straight through the room at full speed',
    guard: 'THE ROOM: the world comes to rest for the fight',
    edit: {
      path: 'src/app/frame.ts',
      find: '    w.scrollPerStep = scrollFor(w);',
      replace: '    w.scrollPerStep = w.scrollRate;',
    },
  },
  {
    decision: '0335',
    suite: 'tests/gyre.test.ts',
    // The trigger not set back by what the ramp travels: the camera overshoots its own rest.
    broke: 'the deceleration begun at the rest itself, so the camera coasts past the room it was stopping in',
    guard: 'THE ROOM: the world comes to rest for the fight',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const rolls = (w.scrollRate * room.settle) / 2;',
      replace: '  const rolls = 0;',
    },
  },
  {
    decision: '0335',
    suite: 'tests/gyre.test.ts',
    // The room never opens again: the level is held at its boss for ever.
    broke: 'the room never opening again, so a won fight leaves the level stopped at its boss',
    guard: 'THE ROOM: the world comes to rest for the fight',
    edit: {
      path: 'src/app/frame.ts',
      find: '  } else if (w.roomHold > 0) w.roomHold--;',
      replace: '  }',
    },
  },
  {
    decision: '0335',
    suite: 'tests/gyre.test.ts',
    // The far wall put somewhere other than the edge of the box the ship flies in.
    broke: 'the far wall put at the fight’s own distance rather than at the edge of the player’s box',
    guard: 'the room has walls on three sides',
    edit: {
      path: 'src/app/frame.ts',
      find: '    to: rest + PLAYER_LEAD,',
      replace: '    to: rest,',
    },
  },
  {
    decision: '0335',
    suite: 'tests/gyre.test.ts',
    // The room never laid: the walls are a thing the row names and nothing draws.
    broke: 'the room never laid, so the row names walls and the painter is handed none',
    guard: 'the room has walls on three sides',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.room = room === null || !Number.isFinite(rest) ? null : {',
      replace: '  w.room = true ? null : {',
    },
  },
];
