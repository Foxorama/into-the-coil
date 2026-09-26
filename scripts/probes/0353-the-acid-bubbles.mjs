// The breaks behind docs/decisions/0353-the-acid-bubbles.md.
//
// Asked for: *"little popping bubbles on the ground for the mire at the moment, we'll add them as
// obstacles later."*

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0353',
    suite: 'tests/mire.test.ts',
    // The bubbles placed half a tile along from the pools they belong to.
    broke: 'bubbles blitted half a tile from their pools, rising out of bare ground',
    guard: 'every bubble rises from one of the pools',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const start = left + spot.at * span;',
      replace: '    const start = left + (spot.at + 0.5) * span;',
    },
  },
  {
    decision: '0353',
    suite: 'tests/mire.test.ts',
    // The baker back on a stream of its own: two sets of pools that are only written alike.
    // In the bed since 0383, where the pools went when the ground became a wall.
    broke: 'the bed baked from its own positions, so the bubbles rise from pools that are not drawn',
    guard: 'the bed is baked with those same pools',
    edit: {
      path: 'src/render/bake.ts',
      find: '      const at = (spot.at + round) * drawing - part * size;',
      replace: '      const at = (spot.at + 0.01 + round) * drawing - part * size;',
    },
  },
  {
    decision: '0353',
    suite: 'tests/mire.test.ts',
    // The clock taken out: a bubble frozen where it formed, which is a spot on the picture.
    broke: 'bubbles not riding the sim’s clock, so every pool is a still picture of bubbles',
    guard: 'the camera stops and the pools do not',
    edit: {
      path: 'src/render/scene.ts',
      find: '      const lives = time / period + k / count + streakHash(p * 7.3 + 0.5);',
      replace: '      const lives = 0 * time / period + k / count + streakHash(p * 7.3 + 0.5);',
    },
  },
  {
    decision: '0353',
    suite: 'tests/mire.test.ts',
    // A bigger bubble, which is what a *"little"* one grows into the first time someone can't see it.
    broke: 'a bubble grown to a shot’s size, low in the lane where shots are read',
    guard: 'a bubble and its pop are both under the smallest shot',
    edit: {
      path: 'src/content/sprites.ts',
      find: '  bubble: 1.5,',
      replace: '  bubble: 2.4,',
    },
  },
  /*
    ── *EVERY PLANET GIVEN THE MIRE'S POOLS* STOOD HERE, AND 0383 DELETED IT WITH ITS GUARD ────────

    It broke `planetSky`, which handed every planet's ground layer the Mire's pools. No sky layer holds
    pools since 0383 — they lie in the bed under the Mire's bank, and bubbles are painted only with a
    floor that has a bed — so *only a place that states pools bubbles* could no longer go red for any
    change to the content or the painter: no other place lays a floor. Deleted rather than kept green
    over nothing, per 0192.
  */
];
