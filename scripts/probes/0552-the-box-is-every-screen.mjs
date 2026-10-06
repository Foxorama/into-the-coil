// The breaks behind docs/decisions/0552-the-box-is-every-screen.md.
//
// ⚠️ The first one restores code that SHIPPED and that every guard was green for, as 0080's first
// did: the clamp at the narrowest view's wall on every screen. Nothing about it looks wrong at 16:9,
// which is the one aspect the old guards were asked at.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0552',
    suite: 'tests/bound.test.ts',
    /*
      ⚠️ THE REPORTED ONE, restored exactly: the ship stopped at the narrowest view's wall. A 20:9
      phone's strip goes back to a quarter of the glass, through the real frame.
    */
    broke: 'the clamp back at the narrowest view’s wall, so a phone’s front quarter is out of reach again',
    guard: 'the strip in front of the wall is a sliver, and the wall is drawn where the ship stops',
    edit: {
      path: 'src/sim/flight.ts',
      find: '  const maxAlong = cameraAlong + leadFor(alongSpan);',
      replace: '  const maxAlong = cameraAlong + PLAYER_LEAD;',
    },
  },
  {
    decision: '0552',
    suite: 'tests/flight.test.ts',
    // The same break, asked of the clamp alone in every screen the report could have been made on.
    broke: 'the clamp back at the narrowest view’s wall, asked of the clamp alone',
    guard: 'the ship reaches the front of the picture',
    edit: {
      path: 'src/sim/flight.ts',
      find: '  const maxAlong = cameraAlong + leadFor(alongSpan);',
      replace: '  const maxAlong = cameraAlong + PLAYER_LEAD;',
    },
  },
  {
    decision: '0552',
    suite: 'tests/bound.test.ts',
    /*
      ⚠️ THE HALF-FIX: the clamp moved and the mark left where it was. The ship flies to the front of
      a phone and the line that says where it stops is drawn a quarter of the screen behind it —
      0074's *a line drawn near the wall teaches something false*.
    */
    broke: 'the wall’s mark left at the narrowest view’s wall while the clamp moved',
    guard: 'the strip in front of the wall is a sliver, and the wall is drawn where the ship stops',
    edit: {
      path: 'src/render/scene.ts',
      find: '  const inView = bound.inView + boxPastFor(view.alongSpan);',
      replace: '  const inView = bound.inView;',
    },
  },
  {
    decision: '0552',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE FIGHT LEFT AT 16:9: the box reaches a phone's front and the boss stays where the narrowest
      view put it, mid-screen, with room for the ship to fly round in front of it.
    */
    broke: 'the boss left at the narrowest view’s station while the box moved on',
    guard: 'and on a phone it holds the same place from the screen’s front edge',
    edit: {
      path: 'src/app/boss.ts',
      find: '  const station = cameraAlong + row.station + past + (reared?.stand ?? 0) + drift + rear;',
      replace: '  const station = cameraAlong + row.station + (reared?.stand ?? 0) + drift + rear;',
    },
  },
  {
    decision: '0552',
    suite: 'tests/spawns.test.ts',
    /*
      ⚠️ THE COST THE BOX MOVED ONTO THE FLANKS: a ceiling at the horizon, which put the flanker
      eleven units in front of a ship at the front of the widest view's box rather than 24.
    */
    broke: 'the flanker’s ceiling back at the horizon, so a ship at the front of a wide box is flanked at arm’s length',
    guard: 'THE OTHER REPORTED ONE: a flanker never enters behind the ship',
    edit: {
      path: 'src/sim/camera.ts',
      find: 'const FLANK_CEILING = MAX_ALONG_SPAN + FLANK_CLEAR_AIR;',
      replace: 'const FLANK_CEILING = MAX_ALONG_SPAN;',
    },
  },
];
