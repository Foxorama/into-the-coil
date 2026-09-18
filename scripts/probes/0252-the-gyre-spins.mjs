// The gyre spins — docs/decisions/0252-the-gyre-spins.md
//
// Every guard 0252 adds, broken on purpose. `node scripts/prove-guard.mjs 0252`.
//
// ⚠️ RE-ANCHORED BY 0332, which grew the stances from four to eight and renamed the guards that
// read them. `along` became `alongNear` — there is one at each edge now — and the walls' test names
// carry the new count. Every claim below is 0252's own; only the anchors moved.

export const PROBES = [
  {
    decision: '0252',
    suite: 'tests/gyre.test.ts',
    // The spin never read: every curtain stands across the lane, as before 0252.
    broke: 'the spin never read by the frame, so every curtain stands across the lane',
    guard: 'THE EIGHT WALLS, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0333, which throws the wall the count OWES rather than the one it reached.
      find: '        curtainStance(uncoil.spin, w.bossUncoilAt),',
      replace: '        curtainStance(false, w.bossUncoilAt),',
    },
  },
  {
    decision: '0252',
    suite: 'tests/gyre.test.ts',
    // The wall along the lane thrown down the lane like the others: it never falls.
    broke: 'the wall along the lane thrown down the lane rather than across it, so it never falls',
    guard: 'and the wall along the lane is a wall',
    edit: {
      path: 'src/app/boss.ts',
      find: '    case \'alongNear\':\n      length = span;\n      footAlong = cameraAlong;\n      footAcross = -bullet.radius;\n      runAlong = 1;\n      runAcross = 0;\n      velAlong = scrollPerStep;\n      velAcross = speed;',
      replace: '    case \'alongNear\':\n      length = span;\n      footAlong = cameraAlong;\n      footAcross = -bullet.radius;\n      runAlong = 1;\n      runAcross = 0;\n      velAlong = -speed + scrollPerStep;\n      velAcross = 0;',
    },
  },
  {
    decision: '0252',
    suite: 'tests/gyre.test.ts',
    // The hole read as a place across the lane on a line that is not across it: a different place every throw.
    broke: 'the hole read as a place across the lane rather than a share of the line, so it moves as the wall turns',
    guard: 'THE EIGHT WALLS, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      find: '  const hole = (uncoil.at / ACROSS_SPAN) * length;',
      replace: '  const hole = uncoil.at;',
    },
  },
  {
    decision: '0252',
    suite: 'tests/gyre.test.ts',
    // The stances not going round: the ninth curtain has no stance.
    broke: 'the stances not taken round and round, so the eighth wall is the first again',
    guard: 'THE SPIN: eight stances',
    edit: {
      path: 'src/app/boss.ts',
      find: '  return CURTAIN_STANCES[((k % CURTAIN_STANCES.length) + CURTAIN_STANCES.length) % CURTAIN_STANCES.length]!;',
      replace: '  return CURTAIN_STANCES[k % 7]!;',
    },
  },
  {
    decision: '0252',
    suite: 'tests/gyre.test.ts',
    // The slant not leaning: a second wall across the lane wearing the slant's name.
    broke: 'the slant not leaning, so it is the wall across the lane again',
    guard: 'THE EIGHT WALLS, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      find: '      length = ACROSS_SPAN * Math.SQRT2;\n      footAlong = boss.along;\n      footAcross = 0;\n      runAlong = Math.SQRT1_2;\n      runAcross = Math.SQRT1_2;',
      replace: '      length = ACROSS_SPAN;\n      footAlong = boss.along;\n      footAcross = 0;\n      runAlong = 0;\n      runAcross = 1;',
    },
  },
  {
    decision: '0252',
    suite: 'tests/gyre.test.ts',
    // The gyre's spin authored away.
    broke: 'the gyre’s spin authored away, so the upgrade is the lattice again',
    guard: 'THE SPIN: eight stances',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0260, which starts the curtain at nine tenths, and by 0332, which quickens it.
      find: "    uncoil: { from: 0.9, every: 0.1, gap: 3, at: 26, hole: 14, spin: true, quicken: { by: 0.88, least: 0.04 }, apart: 150 },",
      replace: "    uncoil: { from: 0.9, every: 0.1, gap: 3, at: 26, hole: 14, spin: false, quicken: { by: 0.88, least: 0.04 }, apart: 150 },",
    },
  },
];
