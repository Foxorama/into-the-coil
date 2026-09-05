// The gyre spins — docs/decisions/0252-the-gyre-spins.md
//
// Every guard 0252 adds, broken on purpose. `node scripts/prove-guard.mjs 0252`.

export const PROBES = [
  {
    decision: '0252',
    suite: 'tests/gyre.test.ts',
    // The spin never read: every curtain stands across the lane, as before 0252.
    broke: 'the spin never read by the frame, so every curtain stands across the lane',
    guard: 'THE FOUR WALLS, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '        curtainStance(uncoil.spin, notch - 1),',
      replace: '        curtainStance(false, notch - 1),',
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
      find: '      velAlong = scrollPerStep;\n      velAcross = speed;',
      replace: '      velAlong = -speed + scrollPerStep;\n      velAcross = 0;',
    },
  },
  {
    decision: '0252',
    suite: 'tests/gyre.test.ts',
    // The hole read as a place across the lane on a line that is not across it: a different place every throw.
    broke: 'the hole read as a place across the lane rather than a share of the line, so it moves as the wall turns',
    guard: 'THE FOUR WALLS, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      find: '  const hole = (uncoil.at / ACROSS_SPAN) * length;',
      replace: '  const hole = uncoil.at;',
    },
  },
  {
    decision: '0252',
    suite: 'tests/gyre.test.ts',
    // The stances not going round: the fifth curtain has no stance.
    broke: 'the stances not taken round and round, so the fourth wall is the first again',
    guard: 'THE SPIN: the gyre’s curtain turns',
    edit: {
      path: 'src/app/boss.ts',
      find: '  return CURTAIN_STANCES[((k % CURTAIN_STANCES.length) + CURTAIN_STANCES.length) % CURTAIN_STANCES.length]!;',
      replace: '  return CURTAIN_STANCES[k % 3]!;',
    },
  },
  {
    decision: '0252',
    suite: 'tests/gyre.test.ts',
    // The slant not leaning: a second wall across the lane wearing the slant's name.
    broke: 'the slant not leaning, so it is the wall across the lane again',
    guard: 'THE FOUR WALLS, DRIVEN',
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
    guard: 'THE SPIN: the gyre’s curtain turns',
    edit: {
      path: 'src/content/bosses.ts',
      find: "    uncoil: { from: 0.5, every: 0.1, gap: 3, at: 26, hole: 14, spin: true },",
      replace: "    uncoil: { from: 0.5, every: 0.1, gap: 3, at: 26, hole: 14, spin: false },",
    },
  },
];
