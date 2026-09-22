// The breaks behind docs/decisions/0358-the-wall-is-drawn-while-it-is-met.md.
//
// ⚠️ Three ways for the WHEN to be wrong while the WHERE stays right: always (the line the player
// asked to be rid of), only at the stop (the report 0074 answered), and never gone once met. 0074's
// own probes still hold the where.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0358',
    suite: 'tests/bound.test.ts',
    // The mark handed to the painter on every frame again. Every other test in the suite passes,
    // because a wall drawn always is drawn while it is met.
    broke: 'the wall drawn at all times again, which is the line the player asked to be rid of',
    guard: 'THE ASK: at rest in the middle of the box, no mark is drawn',
    edit: {
      path: 'src/app/frame.ts',
      find: 'w.boundPress > 0 ? w.bound : null',
      replace: 'w.bound',
    },
  },
  {
    decision: '0358',
    suite: 'tests/bound.test.ts',
    /*
      ⚠️ THE REPORT 0074 ANSWERED, RESTORED IN A SMALLER SHAPE: the mark shown only once the clamp is
      already biting. The player is stopped and shot before anything says why — a reveal distance of
      nought is the tidy-looking value that does it.
    */
    broke: 'the mark shown only once the ship is already stopped, which is the report 0074 answered',
    guard: 'arrives as the ship pushes in, before the stop',
    edit: {
      path: 'src/app/frame.ts',
      find: 'export const BOUND_NEAR = 8;',
      replace: 'export const BOUND_NEAR = 0;',
    },
  },
  {
    decision: '0358',
    suite: 'tests/bound.test.ts',
    // The hold never run down. Met once, the wall is drawn for the rest of the level.
    broke: 'the hold never run down, so the wall once met stays drawn for the rest of the run',
    guard: 'and goes when the ship leaves it',
    edit: {
      path: 'src/app/frame.ts',
      find: '    else if (w.boundPress > 0) w.boundPress--;',
      replace: '',
    },
  },
];
