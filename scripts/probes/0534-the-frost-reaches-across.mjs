// The frost reaches across — docs/decisions/0534-the-frost-reaches-across.md
//
// Every guard 0534 adds, broken on purpose. `node scripts/prove-guard.mjs 0534`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0534',
    suite: 'tests/frost.test.ts',
    // The report, put back: the bolt's fuse a count of steps again, so the snowflakes stop mid-screen.
    broke: 'the bolt’s fuse back at 60 to 72 steps, so no snowflake reaches the back of the screen',
    guard: 'THE REACH, DRIVEN',
    edit: {
      path: 'src/content/shots.ts',
      find: "      { after: { least: 60, most: 'far' }, into: 'ring', shots: 6, pace: 0.16 },",
      replace: "      { after: { least: 60, most: 72 }, into: 'ring', shots: 6, pace: 0.16 },",
    },
  },
  {
    decision: '0534',
    suite: 'tests/frost.test.ts',
    // The other end of the roll: the far side read as the camera's trailing edge rather than the ship's box.
    broke: 'the far side read as the trailing edge, so a snowflake opens where the ship cannot fly',
    guard: 'THE REACH, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '  let steps = along < 0 ? (shot.along - w.cameraAlong - PLAYER_ALONG_MARGIN) / -along : Number.POSITIVE_INFINITY;',
      replace: '  let steps = along < 0 ? (shot.along - w.cameraAlong) / -along : Number.POSITIVE_INFINITY;',
    },
  },
  {
    decision: '0534',
    suite: 'tests/frost.test.ts',
    // The lane forgotten: a bolt from the fan's edge flies the length of the screen and opens off it.
    broke: 'the far side read along only, so a bolt from the fan’s edge opens its snowflake off the lane',
    guard: 'THE FISSION, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (shot.velAcross > 0) steps = Math.min(steps, (ACROSS_SPAN - shot.across) / shot.velAcross);\n  else if (shot.velAcross < 0) steps = Math.min(steps, shot.across / -shot.velAcross);\n',
      replace: '',
    },
  },
];
