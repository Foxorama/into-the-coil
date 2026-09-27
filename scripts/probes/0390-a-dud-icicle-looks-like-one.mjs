// The breaks behind docs/decisions/0390-a-dud-icicle-looks-like-one.md.
//
// Asked for: *"for the ice attacks (across all levels) we need a different icicle art for the
// non-exploding icicles so that the player knows whether an icicle is going to explode or not."*

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0390',
    suite: 'tests/frost.test.ts',
    // The flakes left in the shard's art: the melt looks exactly like the thing that bursts.
    broke: 'a flake that will melt drawn as a shard that will burst',
    guard: 'THE FISSION, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (!bursts && row.spriteSpent !== undefined) {',
      replace: '  if (!bursts && row.spriteSpent === undefined) {',
    },
  },
  {
    decision: '0390',
    suite: 'tests/frost.test.ts',
    // Every child dressed as spent: a bolt that will still open into six looks like one that will not.
    broke: 'a bolt that will still burst drawn as one that will melt',
    guard: 'THE FISSION, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: "  const bursts = stage < row.fission.length && row.fission[stage]!.into !== 'nothing';",
      replace: "  const bursts = stage < 0 && row.fission[stage]!.into !== 'nothing';",
    },
  },
  {
    decision: '0390',
    suite: 'tests/accents.test.ts',
    // The row's spent art the shard itself: the mechanism runs and the picture does not change.
    broke: 'the frost row’s spent art set to its shard, so nothing on the screen tells them apart',
    guard: 'and every shot that can melt without bursting says what it looks like',
    edit: {
      path: 'src/content/shots.ts',
      find: '    spriteSpent: SPRITE.frostSpent,',
      replace: '    spriteSpent: SPRITE.frost,',
    },
  },
  {
    decision: '0390',
    suite: 'tests/accents.test.ts',
    // The icicle drawn squat: its own art, but a silhouette no longer told from the star at a glance.
    broke: 'the icicle drawn squat, so it is not a needle',
    guard: 'THE ASK, IN CSS PIXELS: the icicle that will not burst is a needle',
    edit: {
      path: 'src/render/bake.ts',
      // Re-anchored by 0393, which cut the icicle on eight edges: the root swollen as wide as it is long,
      // so its paint still sits inside the hull and only the silhouette stops being a needle.
      find: '        [0.2, -0.3],\n        [0.62, -0.22],\n        [0.82, 0],\n        [0.62, 0.22],\n        [0.2, 0.3],',
      replace: '        [0.2, -0.8],\n        [0.62, -0.7],\n        [0.82, 0],\n        [0.62, 0.7],\n        [0.2, 0.8],',
    },
  },
];
