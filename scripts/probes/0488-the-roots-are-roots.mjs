// The roots are roots — docs/decisions/0488-the-roots-are-roots.md
//
// Every guard 0488 adds, broken on purpose. `node scripts/prove-guard.mjs 0488`. Its knot and the two
// probes that held it sinking went in 0515.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0488',
    suite: 'tests/serpent.test.ts',
    // Three of the five pieces gone: two roots are not a frame.
    broke: 'the room framed by two pieces',
    guard: 'THE ASK: the serpent’s room is framed by pieces of root',
    edit: {
      path: 'src/content/bosses.ts',
      find: '        { sprite: SPRITE.rootTip, along: 118, across: 128, turn: Math.PI, far: false },\n        { sprite: SPRITE.rootTrunk, along: 185, across: 123.5, turn: Math.PI, far: false },\n        { sprite: SPRITE.rootFork, along: 232, across: 58, turn: Math.PI, far: true },\n',
      replace: '',
    },
  },
  {
    decision: '0488',
    suite: 'tests/serpent.test.ts',
    // A root laid into the lane the ship flies: scenery that looks like a thing to fly round.
    broke: 'the top trunk laid inside the ship’s box',
    guard: 'IN LANE UNITS: no piece crosses the ship’s box',
    edit: {
      path: 'src/content/bosses.ts',
      find: '        { sprite: SPRITE.rootTrunk, along: 150, across: -3.5, turn: 0, far: false },',
      replace: '        { sprite: SPRITE.rootTrunk, along: 150, across: 10, turn: 0, far: false },',
    },
  },
];
