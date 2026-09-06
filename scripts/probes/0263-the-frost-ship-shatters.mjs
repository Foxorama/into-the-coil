// The frost ship shatters — docs/decisions/0263-the-frost-ship-shatters.md
//
// Every guard 0263 adds, broken on purpose. `node scripts/prove-guard.mjs 0263`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0263',
    suite: 'tests/frost.test.ts',
    // The pass never run: the row says three stages and the frame throws one bullet.
    broke: 'the fission pass never run, so a shard is one bullet after all',
    guard: 'THE FISSION, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '    fissionShots(w);\n',
      replace: '',
    },
  },
  {
    decision: '0263',
    suite: 'tests/frost.test.ts',
    // The fan re-aimed at the ship on every burst, which is the aimed attack 0110 removed.
    broke: 'the fan aimed at the ship rather than about the shard’s own heading',
    guard: 'THE FISSION, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const heading = Math.atan2(shot.velAcross, shot.velAlong - w.scrollPerStep);\n',
      replace: '    const heading = Math.atan2(w.ship.across - shot.across, w.ship.along - shot.along);\n',
    },
  },
  {
    decision: '0263',
    suite: 'tests/frost.test.ts',
    // A child's fuse lit a step late, so every stage after the first is a step longer than the row says.
    broke: 'a child’s fuse not lit where it is thrown, so the snowflake opens a step late',
    guard: 'THE FISSION, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '  child.fireIn = stage < row.fission.length ? row.fission[stage]!.after : 0;\n',
      replace: '  child.fireIn = 0;\n',
    },
  },
  {
    decision: '0263',
    suite: 'tests/frost.test.ts',
    // The melt silent: a bullet that vanishes, which is the failure 0036 is named for.
    broke: 'the melt not drawn, so a flake simply vanishes',
    guard: 'THE FISSION, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '        burst(w, along, across, BURST.melt);\n',
      replace: '',
    },
  },
  {
    decision: '0263',
    suite: 'tests/frost.test.ts',
    // The frost's stages taken off the row: spent by arriving, like everything else.
    broke: 'the frost given no stages, so nothing in the game has a life after the muzzle',
    guard: 'THE FISSION, DRIVEN',
    edit: {
      path: 'src/content/shots.ts',
      find: "    fission: [\n      { after: 45, into: 'fan', shots: 2, spread: 0.6 },\n      { after: 40, into: 'ring', shots: 6 },\n      { after: 90, into: 'nothing' },\n    ],",
      replace: '    fission: SPENT_BY_ARRIVING,',
    },
  },
  {
    decision: '0263',
    suite: 'tests/frost.test.ts',
    // The shard's death thrown as nothing.
    broke: 'the shard’s shatter taken off its row, so no body in the game shatters',
    guard: 'THE SHATTER, DRIVEN',
    edit: {
      path: 'src/content/enemies.ts',
      find: "    shatter: { shot: 'frost', shots: 6 },",
      replace: '    shatter: null,',
    },
  },
  {
    decision: '0263',
    suite: 'tests/frost.test.ts',
    // The shatter thrown at the first stage: six shards that open into seventy-two.
    broke: 'the shatter thrown at the shot’s first stage, so a dead add is seventy-two flakes',
    guard: 'THE SHATTER, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const last = Math.max(0, row.fission.length - 1);\n',
      replace: '  const last = 0;\n',
    },
  },
  {
    decision: '0263',
    suite: 'tests/frost.test.ts',
    // The adds down the lane in a vee again.
    broke: 'the shards called at the leading edge again, in a vee down the lane',
    guard: 'THE ADDS AND THE BLASTS',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0270, which said how many of the horde may stand.
      find: "attack: { kind: 'summon', enemy: 'shard', count: 2, formation: 'vee', from: 'sides', standing: 6 } },",
      replace: "attack: { kind: 'summon', enemy: 'shard', count: 2, formation: 'vee', from: 'lead', standing: 6 } },",
    },
  },
  {
    decision: '0263',
    suite: 'tests/frost.test.ts',
    /*
      ⚠️ **RE-POINTED BY 0270, AND THE OLD BREAK IS NOW UNREPRESENTABLE.** It set the last phase to
      `shots: 12` — twelve shards, a hundred and forty-four flakes — and proved that a volley counted
      in flakes rather than shards fills the pool. `docs/decisions/0270-a-shattering-volley-is-counted-in-shards.md`
      caps a shattering volley at `SHARD_VOLLEY` wherever it is thrown, so twelve is clamped to three
      before it reaches the pool: the break went red on a DIFFERENT guard, which 0019 reports as
      proving nothing.

      ⚠️ **So it breaks 0263's own mechanism instead — the fission — rather than the count.** A
      snowflake of twelve in place of six is one shard becoming twenty-four flakes, which is the same
      claim this probe always made (*a shard that becomes too much fills the pool*) expressed in the
      half of it 0270 does not stand in front of. Breaking the ceiling itself is 0270's probe to run,
      and two probes for one assertion is the second copy 0029 argues against.
    */
    broke: 'a snowflake of twelve rather than six, so one shard becomes twenty-four flakes',
    guard: 'the frost never fills the pool',
    edit: {
      path: 'src/content/shots.ts',
      find: "      { after: 40, into: 'ring', shots: 6 },",
      replace: "      { after: 40, into: 'ring', shots: 12 },",
    },
  },
];
