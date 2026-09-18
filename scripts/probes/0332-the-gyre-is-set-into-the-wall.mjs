// The gyre is set into the wall — docs/decisions/0332-the-gyre-is-set-into-the-wall.md
//
// Every guard 0332 adds, broken on purpose. `node scripts/prove-guard.mjs 0332`.
//
// ⚠️ 0252's own six are next door and still 0252's: what this file holds is the eight-point compass,
// the wall from astern, the quickening ladder, the seat and the worn bodies.

export const PROBES = [
  {
    decision: '0332',
    suite: 'tests/gyre.test.ts',
    // The cog ticks a quarter turn rather than an eighth: it runs out of points half way round.
    broke: 'the cog turning a quarter of a turn a wall rather than an eighth',
    guard: 'THE SPIN: eight stances',
    edit: {
      path: 'src/app/boss.ts',
      find: '  return turnFor((at * TAU) / CURTAIN_STANCES.length + Math.PI);',
      replace: '  return turnFor((at * TAU) / 4 + Math.PI);',
    },
  },
  {
    decision: '0332',
    suite: 'tests/gyre.test.ts',
    // The hull aimed at the wall it has just thrown rather than the one it is about to: the tell is
    // a report on the past, which is the one thing a warning may not be.
    broke: 'the hull aimed at the wall it just threw rather than the one coming, so the spike reports rather than warns',
    guard: 'and the wall comes from the edge the spike is aimed at',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (uncoil.spin && w.bossWheelIn <= 0) swingTo(boss, cogTurn(w.bossUncoilAt), COG_TICK);',
      replace: '    if (uncoil.spin) swingTo(boss, cogTurn(w.bossUncoilAt - 1), COG_TICK);',
    },
  },
  {
    decision: '0332',
    suite: 'tests/gyre.test.ts',
    // The two edge walls swapped: the spike points at one edge and the wall comes over the other.
    broke: 'the near and far edges swapped in the compass, so the spike names the wrong side of the screen',
    guard: 'and the wall comes from the edge the spike is aimed at',
    edit: {
      path: 'src/content/bosses.ts',
      find: "  'alongFar',\n  'rakeFar',\n  'astern',\n  'rakeNear',\n  'alongNear',",
      replace: "  'alongNear',\n  'rakeFar',\n  'astern',\n  'rakeNear',\n  'alongFar',",
    },
  },
  {
    decision: '0332',
    suite: 'tests/gyre.test.ts',
    // The wall from astern thrown down the lane like every other one: nothing comes from behind.
    broke: 'the wall from astern laid at the hull and thrown down the lane, so nothing comes from behind',
    guard: 'THE EIGHT WALLS, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      find: '      footAlong = cameraAlong - ASTERN_BEHIND;\n      footAcross = 0;\n      runAlong = 0;\n      runAcross = 1;\n      velAlong = scrollPerStep + speed * ASTERN_SHARE;',
      replace: '      footAlong = boss.along;\n      footAcross = 0;\n      runAlong = 0;\n      runAcross = 1;\n      velAlong = -speed + scrollPerStep;',
    },
  },
  {
    decision: '0332',
    suite: 'tests/gyre.test.ts',
    // The wall from astern at the bullet's own rate: it covers the thirty-four units it has behind
    // the camera in half a second, which is less than the ship needs to cross to the hole.
    broke: 'the wall from astern coming up the lane at the bullet’s own speed, so the hole cannot be reached',
    guard: 'and the wall from astern can be beaten to its hole',
    edit: {
      path: 'src/app/boss.ts',
      find: 'const ASTERN_SHARE = 0.45;',
      replace: 'const ASTERN_SHARE = 1;',
    },
  },
  {
    decision: '0332',
    suite: 'tests/gyre.test.ts',
    // The ladder never read: the gap between two walls is the row's `every` from first to last.
    broke: 'the quickening never read, so the gap between two walls is flat for the whole fight',
    guard: 'THE WALLS QUICKEN',
    edit: {
      path: 'src/app/boss.ts',
      find: '  const quicken = uncoil.quicken;',
      replace: '  const quicken = null;',
    },
  },
  {
    decision: '0332',
    suite: 'tests/gyre.test.ts',
    // The floor ignored: the ladder converges and the count runs away short of the end of the bar.
    broke: 'the quickening’s floor ignored, so the gaps converge and the walls stop before the bar does',
    guard: 'THE WALLS QUICKEN',
    edit: {
      path: 'src/app/boss.ts',
      find: '    gap = next < quicken.least ? quicken.least : next;',
      replace: '    gap = next;',
    },
  },
  {
    decision: '0332',
    suite: 'tests/gyre.test.ts',
    // The socket arm patrolling: a cog set into a wall that slides along the wall.
    broke: 'the socket arm sliding across the lane rather than stopping on its seat',
    guard: 'SET INTO THE WALL',
    edit: {
      path: 'src/app/boss.ts',
      find: '      const want = move.at - boss.across;\n      const cap = row.patrol;',
      replace: '      const want = move.at - boss.across + 20;\n      const cap = row.patrol;',
    },
  },
  {
    decision: '0332',
    suite: 'tests/gyre.test.ts',
    // The housing never laid: the hull is a boss that stopped moving rather than one set into anything.
    broke: 'the housing never laid behind the hull, so the hull is a boss that stopped moving',
    guard: 'SET INTO THE WALL',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (seat !== null) reset(seat, head.along, head.across, AURA_FLAME);',
      replace: '      if (seat !== null) w.bossAura.clear();',
    },
  },
  {
    decision: '0332',
    suite: 'tests/gyre.test.ts',
    // The phase's body never worn: the cog is whole in the phase it is coming apart in.
    broke: 'the phase’s own body never worn, so the cog is whole in the phase it is coming apart in',
    guard: 'and it wears its damage',
    edit: {
      path: 'src/app/frame.ts',
      find: '    boss.spriteBase = worn.rest;\n    boss.spriteHit = worn.hit;',
      replace: '    boss.spriteBase = w.bossRow.sprite;\n    boss.spriteHit = w.bossRow.spriteHit;',
    },
  },
];
