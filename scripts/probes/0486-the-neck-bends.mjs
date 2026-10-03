// The neck bends — docs/decisions/0486-the-neck-bends.md
//
// Every guard 0486 adds, broken on purpose. `node scripts/prove-guard.mjs 0486`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0486',
    suite: 'tests/hydra.test.ts',
    // The report, put back: the head its own closed outline, sat on the end of a neck it is not part of.
    broke: 'the head’s bitmap the skull alone',
    guard: 'THE ASK, IN PIXELS',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const outline = headAndNeck(skull, sides.back.map(toTile), sides.throat.map(toTile));',
      replace: '  const outline = skull;',
    },
  },
  {
    decision: '0486',
    suite: 'tests/hydra.test.ts',
    // The head placed on a straight neck while its bitmap's neck turns with it: the two part at the knuckle.
    broke: 'the head stood where a straight neck would put it',
    guard: 'THE HEAD TURNS WITH ITS NECK, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const headAlong = knuckleAlong + joint.upper[0] * cc - joint.upper[1] * cs;',
      replace: '    const headAlong = rootAlong + Math.cos(angle) * row.reach;',
    },
  },
  {
    decision: '0486',
    suite: 'tests/hydra.test.ts',
    // The knuckle bending as far as the look asks, so a rising head swings round to face the ship.
    broke: 'no limit on the bend at the knuckle',
    guard: 'THE HEAD TURNS WITH ITS NECK, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: 'foldTurn(neckTurn + (bent > necks.bend ? necks.bend : bent < -necks.bend ? -necks.bend : bent))',
      replace: 'foldTurn(neckTurn + bent)',
    },
  },
  {
    decision: '0486',
    suite: 'tests/hydra.test.ts',
    // A head hit and the body left dark: the patchwork the plan names.
    broke: 'the body not lit by a hit on a head',
    guard: 'THE WHOLE ANIMAL FLASHES AS ONE',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (flashing) hull.sprite = hull.spriteHit;\n',
      replace: '',
    },
  },
  {
    decision: '0486',
    suite: 'tests/hydra.test.ts',
    // Each head lit by its own hit alone.
    broke: 'a head lit only by its own hit',
    guard: 'THE WHOLE ANIMAL FLASHES AS ONE',
    edit: {
      path: 'src/app/frame.ts',
      find: '    head.sprite = flashing ? row.headHit : row.head;',
      replace: '    head.sprite = head.flashFor > 0 ? row.headHit : row.head;',
    },
  },
  {
    decision: '0486',
    suite: 'tests/hydra.test.ts',
    // The necks laid in the order they grew, so which one lies over which is an accident of the phases.
    broke: 'the necks laid in the order they grew',
    guard: 'BACK TO FRONT',
    edit: {
      path: 'src/app/frame.ts',
      find: 'if (NECK_DEPTH[j]! < NECK_DEPTH[k]! || (NECK_DEPTH[j] === NECK_DEPTH[k] && j < k)) behind++;',
      replace: 'if (j < k) behind++;',
    },
  },
  {
    decision: '0486',
    suite: 'tests/hydra.test.ts',
    // The knuckle two knots from the head with nothing to hold it back, so the skull swallows the neck it turns with.
    broke: 'the knuckle with no clearance from the skull',
    guard: 'IN WORLD UNITS: every neck bends where it has left the body',
    edit: {
      path: 'src/content/necks.ts',
      find: '  let at = Math.round((NECK_KNOTS * 2) / 3);\n  while (at > 0 && Math.hypot(spine[at]![0] - hx, spine[at]![1] - hy) * rn < clear) at--;',
      replace: '  let at = NECK_KNOTS - 2;\n  void clear;',
    },
  },
];
