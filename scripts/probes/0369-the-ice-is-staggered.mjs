// The ice is staggered — docs/decisions/0369-the-ice-is-staggered.md
//
// Every guard 0369 adds, broken on purpose. `node scripts/prove-guard.mjs 0369`.
//
// ⚠️ THE FIRST TWO RESTORE WHAT WAS REPORTED, one arm at a time: the Rime Shelf's sprays and both
// fights' walls throwing every shard on one step, which is how every volley in the game left the hull.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0369',
    suite: 'tests/frost.test.ts',
    // What was reported, in the spray: the Rime Shelf's second and last phases throw their shards together.
    broke: 'a fan of a staggering row thrown on one step, as every volley was',
    guard: 'THE STAGGER, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      find: '      if (bullet.stagger !== undefined && count > 1) {\n        staggerVolley(boss, row, bullet, kind, speed, scrollPerStep, shots, count, fireGapFor(bullet.stagger, tier), first, step, 0);',
      replace: '      if (bullet.stagger === -1) {\n        staggerVolley(boss, row, bullet, kind, speed, scrollPerStep, shots, count, fireGapFor(bullet.stagger, tier), first, step, 0);',
    },
  },
  {
    decision: '0369',
    suite: 'tests/frost.test.ts',
    // What was reported, in the wall: the frost ship's opening and the hydra's frost head.
    broke: 'a wall of a staggering row thrown on one step, as every volley was',
    guard: 'THE STAGGER, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      find: '      if (bullet.stagger !== undefined) {\n        staggerVolley(',
      replace: '      if (bullet.stagger === -1) {\n        staggerVolley(',
    },
  },
  {
    decision: '0369',
    suite: 'tests/frost.test.ts',
    /*
      The next volley timed to the last shot rather than a stagger past it. `spray` runs before the
      gate, so on a tier whose cadence is shorter than the volley the last shard of one and the first
      of the next leave on one step — the pair the stagger exists to stop, put back at the seam.
    */
    broke: 'the next volley waiting for the last shot and no longer, so the seam throws two at once',
    guard: 'THE STAGGER, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      find: '  const until = Math.ceil((steps + every) / FIRE_GRID) * FIRE_GRID;',
      replace: '  const until = Math.ceil(steps / FIRE_GRID) * FIRE_GRID;',
    },
  },
  {
    decision: '0369',
    suite: 'tests/frost.test.ts',
    // The other half of the ask: every shard burning the same fuse, which is what a fixed one was.
    broke: 'the fuse read at the short end of its range every time, so nothing is random',
    guard: 'THE STAGGER, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '  return fuse.least + w.fuseRng.int(0, fuse.most - fuse.least);',
      replace: '  return fuse.least;',
    },
  },
  {
    decision: '0369',
    suite: 'tests/frost.test.ts',
    /*
      A first fuse wider than the stagger — more random, and exactly the trade the row's comment
      refuses: a shard that burns long and the one after it that burns short open on one step.
    */
    broke: 'a first fuse wider than the stagger, so a long one and a short one open together',
    guard: 'THE STAGGER, DRIVEN',
    edit: {
      path: 'src/content/shots.ts',
      find: "      { after: { least: 38, most: 56 }, into: 'fan', shots: 2, spread: 0.6 },",
      replace: "      { after: { least: 38, most: 96 }, into: 'fan', shots: 2, spread: 0.6 },",
    },
  },
  {
    decision: '0369',
    suite: 'tests/frost.test.ts',
    /*
      The stagger read flat rather than through the tier — the first version of this decision, and
      what *"make it harder on burn"* was said about: the Rime Shelf's last phase was 59 shards at Burn
      against Savior's 60, because the stagger and not the cadence bound it. One call site is enough:
      the spray is where that phase lives.
    */
    broke: 'the spray’s stagger read flat, so Burn’s frost sprays are Savior’s',
    guard: 'THE STAGGER, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      find: 'shots, count, fireGapFor(bullet.stagger, tier), first, step, 0);',
      replace: 'shots, count, bullet.stagger, first, step, 0);',
    },
  },
  {
    decision: '0369',
    suite: 'tests/frost.test.ts',
    // A fuse rolled outside the row's range: the fission drive checks every one it lights.
    broke: 'a fuse rolled past the end of its range',
    guard: 'THE FISSION, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '  return fuse.least + w.fuseRng.int(0, fuse.most - fuse.least);',
      replace: '  return fuse.least + w.fuseRng.int(0, fuse.most - fuse.least) + 1;',
    },
  },
  {
    decision: '0369',
    suite: 'tests/frost.test.ts',
    // The ranges back at the old fuses' centres, which put the snowflake in the far half at the short end.
    broke: 'the second fuse back at the old centre, so the shortest pair opens the snowflake in the far half',
    guard: 'THE FISSION, DRIVEN',
    edit: {
      path: 'src/content/shots.ts',
      find: "      { after: { least: 36, most: 48 }, into: 'ring', shots: 6 },",
      replace: "      { after: { least: 26, most: 48 }, into: 'ring', shots: 6 },",
    },
  },
];
