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
      find: "attack: { kind: 'summon', enemy: 'shard', count: 2, formation: 'vee', from: 'sides' } },",
      replace: "attack: { kind: 'summon', enemy: 'shard', count: 2, formation: 'vee', from: 'lead' } },",
    },
  },
  {
    decision: '0263',
    suite: 'tests/frost.test.ts',
    // The last fifth counted in flakes rather than shards: the ring 0253 threw, back.
    broke: 'the last fifth throwing twelve shards a volley, which is a hundred and forty-four flakes',
    guard: 'the frost never fills the pool',
    edit: {
      path: 'src/content/bosses.ts',
      find: "      { upTo: 0.2, fireEvery: 60, shots: 3, spread: 1.2, patrolScale: 1.9, stance: { kind: 'volley' }, shot: null, attack: { kind: 'spray' } },",
      replace: "      { upTo: 0.2, fireEvery: 60, shots: 12, spread: 1.2, patrolScale: 1.9, stance: { kind: 'volley' }, shot: null, attack: { kind: 'spray' } },",
    },
  },
];
