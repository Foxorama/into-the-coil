// The tentacles pull out of the heart — docs/decisions/0403-the-tentacles-pull-out-of-the-heart.md
//
// Every guard 0403 adds, broken on purpose. `node scripts/prove-guard.mjs 0403`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0403',
    suite: 'tests/medusa.test.ts',
    // A tentacle that stings while it is still sweeping out of the background across the ship.
    broke: 'the tentacles stinging before they are out',
    guard: 'THE TENTACLES, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '      node.damage = drawn >= 1 ? w.bossRow.damage : 0;',
      replace: '      node.damage = w.bossRow.damage;',
    },
  },
  {
    decision: '0403',
    suite: 'tests/medusa.test.ts',
    // Tentacles the ship flies through: the answer the player did not give.
    broke: 'the tentacles never stinging',
    guard: 'THE TENTACLES, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '      node.damage = drawn >= 1 ? w.bossRow.damage : 0;',
      replace: '      node.damage = 0;',
    },
  },
  {
    decision: '0403',
    suite: 'tests/medusa.test.ts',
    // The lasers out of the middle of the bell, where nothing that fires them is drawn.
    broke: 'the lasers rooted at the hull’s centre rather than the tips',
    guard: 'THE LASERS FROM THE TIPS',
    edit: {
      // Re-anchored by 0452: the tips' reach is each root's own along now, not a sum on every beam.
      path: 'src/content/bosses.ts',
      find: 'const MEDUSA_LASERS = MEDUSA_TIPS.map((tip) => [-MEDUSA_REACH, tip] as const);',
      replace: 'const MEDUSA_LASERS = MEDUSA_TIPS.map((tip) => [0, tip] as const);',
    },
  },
  {
    decision: '0403',
    suite: 'tests/medusa.test.ts',
    // Each laser its own zigzag, so two neighbours swing into one another and the gap closes.
    broke: 'a seed a beam in a volley that flies together',
    guard: 'THE LASERS FROM THE TIPS',
    edit: {
      path: 'src/app/boss.ts',
      find: '          bolt.spin = attack.together === true ? volleySeed : beamRng.int(0, 0x7fffffff);',
      replace: '          bolt.spin = beamRng.int(0, 0x7fffffff);',
    },
  },
  {
    decision: '0403',
    suite: 'tests/medusa.test.ts',
    // The tentacles waving on through a held volley, their tips off the lasers they fire.
    broke: 'the tentacles never braced while a volley is held',
    guard: 'THE LASERS FROM THE TIPS',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const braced = hull.holdFor > 0 ? 1 : 0;',
      replace: '  const braced = hull.holdFor > 0 ? 0 : 0;',
    },
  },
  {
    decision: '0403',
    suite: 'tests/medusa.test.ts',
    // The tips back at the old beams' six apart, which leaves no room between two neighbours.
    broke: 'the tips six apart',
    guard: 'IN LANE UNITS: the room between two neighbouring lasers',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'const MEDUSA_TIPS = [-26, -13, 0, 13, 26] as const;',
      replace: 'const MEDUSA_TIPS = [-12, -6, 0, 6, 12] as const;',
    },
  },
];
