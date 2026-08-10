// The breaks behind docs/decisions/0088-the-near-sky-goes-back-and-the-whole-sky-goes-faster.md.
//
// ⚠️ THIS IS THE THIRD PASS OVER ONE LAYER and the second over its speed, so the interesting break is
// not "the number went back" — `scripts/probes/0069-sky.mjs` and `scripts/probes/0078-sky-speed.mjs`
// already own those. It is the TRADE: 0088 loosened the speed ceiling from a half to two thirds, and
// the only thing paying for that is how little of the eye the near layer now takes. A pass that takes
// the payment back and leaves the ceiling where it is has both halves green in isolation, which is
// exactly the shape a guard set catches only if something asserts the two together.
//
// ⚠️ THERE WERE THREE AND THERE ARE NOW TWO. The alpha probe — *the near layer's alpha returned to
// 0.4* — has been RETIRED rather than re-anchored, because
// docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md moved this layer's alpha to 0.34
// on the report that 0088 had pushed it one pass too far. A break to 0.4 is now a sixth of a step
// from the shipped value and cannot go red against any rule that survives; what survives of 0088's
// alpha claim is *the near layer is a veil and not a bed*, and the probe for that is
// scripts/probes/0069-sky.mjs's, which takes it to solid. A probe kept for a superseded value is a
// probe that reports STILL GREEN for ever — decision 0019's own failure mode.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0088',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE HALF-READ OF THIS REPORT, and it is the one a hand does at speed. *"The background needs
      to move faster"* is satisfied by moving the far layer alone, and the far layer is the one nobody
      has ever complained about — so the change looks like it answers the complaint while leaving the
      layer the OTHER half of the report is about exactly where it was.

      ⚠️ It is 0078's break in a new place rather than a new break, and that is the point: the same
      mistake is available at every pass, and the guard that catches it is the ratio.
    */
    broke: 'only the far layer sped up, so the parallax pays for the speed a second time',
    guard: 'scales BOTH by the same factor, so the depth cue is not what paid for the speed',
    edit: {
      path: 'src/app/mount.ts',
      find: '{ sprite: SPRITE.skyNear, extent: SPRITE_EXTENT.skyNear, depth: 0.825 },',
      replace: '{ sprite: SPRITE.skyNear, extent: SPRITE_EXTENT.skyNear, depth: 0.4 },',
    },
  },
  {
    decision: '0088',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE COUNT TAKEN BACK TO WHAT MADE THE LAYER SPARSE, which is the assertion 0088 inverted.
      Fewer, bigger dots was 0069's answer when a near star was 0.35 units; at 0.2 the same reasoning
      runs the other way — more of them is what distance looks like — and the ink is what says which
      version is quieter rather than which is fewer.

      ⚠️ ON ITS OWN THIS BARELY MOVES THE INK, so it is paired with the size in one edit. A break that
      a guard cannot see is not a break, and the honest version of *the count went back* is *the count
      and the size went back together*, which is the layer 0088 replaced.
    */
    broke: 'the near layer returned to the fewer-and-bigger dots it had before',
    guard: 'and the near layer is the quiet one, on every count that buys attention',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const SKY_MAX_STAR_UNITS = { skyFar: 0.6, skyNear: 0.28, skyRush: 0.11 };',
      replace: 'const SKY_MAX_STAR_UNITS = { skyFar: 0.6, skyNear: 0.55, skyRush: 0.11 };',
    },
  },
];
