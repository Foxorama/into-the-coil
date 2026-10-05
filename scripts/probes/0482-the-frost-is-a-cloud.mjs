// The frost is a cloud — docs/decisions/0482-the-frost-is-a-cloud.md
//
// Every guard 0482 adds, broken on purpose. `node scripts/prove-guard.mjs 0482`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0482',
    suite: 'tests/frost.test.ts',
    // The report, put back: the snowflake flies at the shard's whole speed, too much and then nothing.
    broke: 'the snowflake at the shard’s whole speed',
    guard: 'THE REPORTED ONE, IN LANE UNITS AND SECONDS',
    edit: {
      path: 'src/content/shots.ts',
      find: "into: 'ring', shots: 6, pace: 0.16 },",
      replace: "into: 'ring', shots: 6 },",
    },
  },
  {
    decision: '0482',
    suite: 'tests/frost.test.ts',
    // And the two bangs close together again: the second fuse at its old length.
    broke: 'the second burst under a second after the first',
    guard: 'THE REPORTED ONE, IN LANE UNITS AND SECONDS',
    edit: {
      path: 'src/content/shots.ts',
      // Re-anchored by 0534, whose bolt runs on to the far side: the short end is what this breaks.
      find: "      { after: { least: 60, most: 'far' }, into: 'ring', shots: 6, pace: 0.16 },",
      replace: "      { after: { least: 36, most: 'far' }, into: 'ring', shots: 6, pace: 0.16 },",
    },
  },
];
