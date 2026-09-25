// The breaks behind docs/decisions/0372-a-death-keeps-the-ladders.md.
//
// ⚠️ HALF OF THESE ARE THE RULES 0372 REVERSED, PUT BACK. A death that takes the ladders, a continue
// that restocks and a clear that pays were each the shipped behaviour for months, so each is exactly
// what a revert or a copy of an old arm would write — and each is a working game.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0372',
    suite: 'tests/run.test.ts',
    // 0039's rule, the one this decision reverses: a death empties the ladders.
    broke: 'a death that empties the ladders again',
    guard: 'a death costs the life and nothing else: both ladders, both kinds and the arsenal stay',
    edit: {
      path: 'src/state/slices/run.ts',
      // The twelve-space indent is the `lifeLost` arm; every other arm has these at eight.
      find: '            upgrades: state.upgrades,\n            weapon: state.weapon,',
      replace: '            upgrades: [],\n            weapon: state.weapon,',
    },
  },
  {
    decision: '0372',
    suite: 'tests/run.test.ts',
    // 0233's half of it: the ladder kept and the gun put back to the base — a switch undone by dying.
    broke: 'a death that keeps the ladder and puts the base gun back',
    guard: 'a death costs the life and nothing else: both ladders, both kinds and the arsenal stay',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '            weapon: state.weapon,\n            missile: state.missile,',
      replace: "            weapon: 'pulse',\n            missile: 'straight',",
    },
  },
  {
    decision: '0372',
    suite: 'tests/run.test.ts',
    // 0085's continue: the charges reset to the starting kit.
    broke: 'a continue that resets the charges to the starting kit',
    guard: 'refills the lives and keeps everything the run was carrying',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '        lives: livesFor(state.difficulty),\n        level: state.level,\n        arsenal: state.arsenal,',
      replace: '        lives: livesFor(state.difficulty),\n        level: state.level,\n        arsenal: startingArsenal(),',
    },
  },
  {
    decision: '0372',
    suite: 'tests/run.test.ts',
    // 0068's continue: *"as if they had started a new run"* — no upgrades.
    broke: 'a continue that empties the ladders',
    guard: 'refills the lives and keeps everything the run was carrying',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '        arsenal: state.arsenal,\n        upgrades: state.upgrades,\n        weapon: state.weapon,\n        missile: state.missile,\n        difficulty: state.difficulty,\n      };\n    case \'lifeLost\':',
      replace: '        arsenal: state.arsenal,\n        upgrades: [],\n        weapon: state.weapon,\n        missile: state.missile,\n        difficulty: state.difficulty,\n      };\n    case \'lifeLost\':',
    },
  },
  {
    decision: '0372',
    suite: 'tests/bombs.test.ts',
    // 0053's *"gains one per level cleared"*, which 0372 took away to pay for the continue.
    broke: 'a level clear that pays every special a charge again',
    guard: 'a level clear pays nothing into the arsenal',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '        level: state.level + 1,\n        arsenal: state.arsenal,',
      replace: '        level: state.level + 1,\n        arsenal: state.arsenal.map((entry) => ({ kind: entry.kind, charges: entry.charges + 1 })),',
    },
  },
  {
    decision: '0372',
    suite: 'tests/boss-share.test.ts',
    // The share read and never used: every bomb on a boss is a flat six again.
    broke: 'the share ignored, so a thrown bomb is a flat blast on a boss',
    guard: 'lands its share of the boss’s full health once',
    edit: {
      path: 'src/sim/collide.ts',
      find: '    const share = blast.bossShare * fullHealth;',
      replace: '    const share = 0;',
    },
  },
  {
    decision: '0372',
    suite: 'tests/boss-share.test.ts',
    /*
      ⚠️ THE ONE `blastInto` WOULD HAVE WRITTEN: every piece of the animal the blast covers billed
      once each. At a flat six that was a long animal taking a little more; at a share of the whole it
      is a bomb on the coil taking a quarter of the fight.
    */
    broke: 'the share billed once per node the blast covers',
    guard: 'lands its share of the boss’s full health once',
    edit: {
      path: 'src/sim/collide.ts',
      find:
        '    if (!blastReaches(blast, head, corridor) && !blastReachesAny(blast, nodes, corridor)) continue;\n' +
        '    const share = blast.bossShare * fullHealth;\n' +
        '    head.health -= (share > blast.damage ? share : blast.damage) * damageScale;',
      replace:
        '    let times = blastReaches(blast, head, corridor) ? 1 : 0;\n' +
        '    for (let t = 0; t < nodes.size; t++) if (blastReaches(blast, nodes.at(t), corridor)) times++;\n' +
        '    if (times === 0) continue;\n' +
        '    const share = blast.bossShare * fullHealth;\n' +
        '    head.health -= (share > blast.damage ? share : blast.damage) * damageScale * times;',
    },
  },
  {
    decision: '0372',
    suite: 'tests/boss-share.test.ts',
    // The share with no floor, so a small boss is hit softer by a "stronger" bomb than it was.
    broke: 'the share with no floor under it',
    guard: 'and never less than the blast’s own damage',
    edit: {
      path: 'src/sim/collide.ts',
      find: '    head.health -= (share > blast.damage ? share : blast.damage) * damageScale;',
      replace: '    head.health -= share * damageScale;',
    },
  },
  {
    decision: '0372',
    suite: 'tests/boss-share.test.ts',
    // The row's share never reaching the blast the throw makes.
    broke: 'the thrown blast never armed with the special’s share',
    guard: 'is armed with the share by the throw',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0374, which reads the thrown special's own row rather than the bomb's.
      find: '      blast.bossShare = row.bossShare;\n',
      replace: '',
    },
  },
  {
    decision: '0372',
    suite: 'tests/boss-share.test.ts',
    // The arc strikes the boss by hand, so it is the one gun a weight in the pairings would miss.
    broke: 'the arc’s strike on a boss ignoring the row’s weight',
    guard: 'arc: doubling the row’s bossWeight shortens the fight',
    edit: {
      path: 'src/app/frame.ts',
      find: 'w.weapon.damage * open * gunWeightOn(w.bossRow, w.weapon.kind),',
      replace: 'w.weapon.damage * open,',
    },
  },
  {
    decision: '0372',
    suite: 'tests/boss-share.test.ts',
    // And the pairings: a weight that only the arc reads is a constant with a field's name.
    broke: 'the shots’ pairing with a boss ignoring the row’s weight',
    guard: 'pulse: doubling the row’s bossWeight shortens the fight',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const gunOpen = open * gunWeightOn(w.bossRow, w.weapon.kind);',
      replace: '    const gunOpen = open;',
    },
  },
  {
    decision: '0372',
    suite: 'tests/boss-share.test.ts',
    // The boss's own entry skipped, so the serpent's authored 1 is the arc's 1.5 again.
    broke: 'a boss’s own gun weight ignored for the gun’s row',
    guard: 'and a boss’s own entry wins over the gun’s row',
    edit: {
      path: 'src/content/bosses.ts',
      find: '  return boss.gunWeights?.[gun] ?? WEAPONS[gun].bossWeight;',
      replace: '  return WEAPONS[gun].bossWeight;',
    },
  },
];
