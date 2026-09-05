// A pickup keeps the count, a death costs a rung, a mid-boss drops the rest —
// docs/decisions/0256-a-pickup-keeps-the-count.md
//
// Every guard 0256 adds, broken on purpose. `node scripts/prove-guard.mjs 0256`.
//
// ⚠️ Three of these restore what SHIPPED — a switch starting the ladder again (0233), a death
// emptying it (0039), the nine pickups a level (0083) — which is what a probe is for: the previous
// answer is always the tidiest edit.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0256',
    suite: 'tests/run.test.ts',
    // 0233's rule put back: a pickup of another kind starts its ladder at one rung.
    broke: 'a switch starting the new kind’s ladder again at one rung',
    guard: 'a pickup of another kind switches the kind and keeps the count',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '      const upgrades = tiersOf(state.upgrades, action.upgrade) < UPGRADE_TIERS ? [...state.upgrades, action.upgrade] : state.upgrades;',
      replace:
        '      const fitted = action.upgrade === \'weapon\' ? state.weapon : state.missile;\n' +
        '      const upgrades = action.kind === fitted ? (tiersOf(state.upgrades, action.upgrade) < UPGRADE_TIERS ? [...state.upgrades, action.upgrade] : state.upgrades) : [...state.upgrades.filter((u) => u !== action.upgrade), action.upgrade];',
    },
  },
  {
    decision: '0256',
    suite: 'tests/run.test.ts',
    // 0039's rule put back: a death empties the list.
    broke: 'a death emptying the ladder, which is what shipped for four months',
    guard: 'a death costs one rung per ladder, keeps the gun, and leaves the arsenal exactly where it was',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '            upgrades: afterDeath(state.upgrades),',
      replace: '            upgrades: [],',
    },
  },
  {
    decision: '0256',
    suite: 'tests/run.test.ts',
    // The floor removed: a ladder at one loses its one, which is *"to a minimum of 1"* undone.
    broke: 'the floor under the cost removed, so a ladder at one rung is emptied',
    guard: 'a ladder at one rung keeps its one',
    edit: {
      path: 'src/content/pickups.ts',
      find: '    if (tiersOf(upgrades, kind) <= DEATH_KEEPS) continue;',
      replace: '    if (tiersOf(upgrades, kind) < DEATH_KEEPS) continue;',
    },
  },
  {
    decision: '0256',
    suite: 'tests/run.test.ts',
    // 0233's other half: a death takes the gun back to the ship's own.
    broke: 'a death putting the base gun back on the ship',
    guard: 'a death costs one rung per ladder, keeps the gun',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '            weapon: state.weapon,\n            missile: state.missile,\n            difficulty: state.difficulty,\n          };',
      replace: '            weapon: BASE_SHIP.weapon,\n            missile: BASE_SHIP.missile,\n            difficulty: state.difficulty,\n          };',
    },
  },
  {
    decision: '0256',
    suite: 'tests/death.test.ts',
    // The rung taken on the step the hull reaches zero rather than at the end of the beat.
    broke: 'the death’s cost dispatched on the step the hull reached zero, before the beat',
    guard: 'costs one rung per ladder at the end of the beat',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.onCue(\'death\', w.ship.across);',
      replace: '  w.onCue(\'death\', w.ship.across);\n  w.onDeath();',
    },
  },
  {
    decision: '0256',
    suite: 'tests/pickups.test.ts',
    // A level quietly given a second authored weapon — 0083's nine, one pickup at a time.
    broke: 'a level authoring a second weapon, which is how nine a level came back',
    guard: 'THE BUDGET: a level authors one weapon and one missile and nothing else',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 864, kind: 'missile', lane: 28 },",
      replace: "  { at: 864, kind: 'missile', lane: 28 },\n  { at: 1700, kind: 'weapon', lane: 40 },",
    },
  },
  {
    decision: '0256',
    suite: 'tests/pickups.test.ts',
    // The shield authored back into a level, where it is the mid-boss's to drop.
    broke: 'a shield authored into a level rather than dropped by its mid-boss',
    guard: 'THE BUDGET: a level authors one weapon and one missile and nothing else',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 854, kind: 'missile', lane: 56 },",
      replace: "  { at: 854, kind: 'missile', lane: 56 },\n  { at: 1500, kind: 'shield', lane: 50 },",
    },
  },
  {
    decision: '0256',
    suite: 'tests/pickups.test.ts',
    // The missile pushed to the middle of the level — *"about 20% of the way in"* lost.
    broke: 'a level’s missile moved to the middle of the level',
    guard: 'THE TUBE: every level offers a missile about a fifth of the way in',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 848, kind: 'missile', lane: 36 },",
      replace: "  { at: 2100, kind: 'missile', lane: 36 },",
    },
  },
  {
    decision: '0256',
    suite: 'tests/pickups.test.ts',
    // The shield dropped from the mid-boss's list, so nothing in the game offers armour.
    broke: 'the shield taken out of the mid-boss’s drop',
    guard: 'the fights offer the rest: a mid-boss drops one weapon, one shield and one bomb',
    edit: {
      path: 'src/content/levels.ts',
      find: "export const MID_BOSS_DROP: readonly PickupKind[] = ['weapon', 'shield', 'bomb'];",
      replace: "export const MID_BOSS_DROP: readonly PickupKind[] = ['weapon', 'bomb'];",
    },
  },
  {
    decision: '0256',
    suite: 'tests/bosses.test.ts',
    // The drop never thrown on the step the mid-boss dies.
    broke: 'the mid-boss’s death throwing nothing',
    guard: '0256 — THE DROP: the mid-boss’s death throws',
    edit: {
      path: 'src/app/frame.ts',
      find: '        dropPickups(w, w.cameraAlong + w.bossOffset, w.bossAcross, MID_BOSS_DROP);\n',
      replace: '',
    },
  },
  {
    decision: '0256',
    suite: 'tests/bosses.test.ts',
    // The drop thrown on the END boss's death too, 1.6 seconds before the level ends.
    broke: 'the end boss’s death throwing the drop as well, where nobody can reach it',
    guard: '0256 — THE DROP: the mid-boss’s death throws',
    edit: {
      path: 'src/app/frame.ts',
      find: '      } else {\n        w.clearedIn = BOSS_DEATH_STEPS;',
      replace: '      } else {\n        dropPickups(w, w.cameraAlong + w.bossOffset, w.bossAcross, MID_BOSS_DROP);\n        w.clearedIn = BOSS_DEATH_STEPS;',
    },
  },
  {
    decision: '0256',
    suite: 'tests/pickups.test.ts',
    // The dial not turned by a dropped weapon, so the top of the dial is 9 and nothing says so.
    broke: 'the dropped weapon not counted on the dial',
    guard: 'THE DROP: one piece per kind in the list, thrown from where the hull died, and the weapon turns the dial',
    edit: {
      path: 'src/app/frame.ts',
      find: "  if (kind === 'weapon') w.weaponsOffered++;\n  /*\n    ⚠️ **A DROPPED PIECE CYCLES",
      replace: "  /*\n    ⚠️ **A DROPPED PIECE CYCLES",
    },
  },
  {
    decision: '0256',
    suite: 'tests/dial.test.ts',
    // The content function reading the list alone, so the dial's top is recomputed wrong.
    broke: 'the level’s weapon count read off the list alone, without the drop',
    guard: 'THE ENDPOINT: the last boss is fought at exactly the top of the dial',
    edit: {
      path: 'src/content/levels.ts',
      find: "  if (level.midBoss !== null) for (const kind of MID_BOSS_DROP) if (kind === 'weapon') offered++;\n",
      replace: '',
    },
  },
  {
    decision: '0256',
    suite: 'tests/pickups.test.ts',
    // A dropped weapon holding its face, which was 0243's rule for a scattered piece.
    broke: 'a dropped weapon holding one face, as a scattered piece did',
    guard: 'a dropped weapon cycles like an authored one',
    edit: {
      path: 'src/app/frame.ts',
      find: '  startCycle(item, row, index % row.faces.length);\n  item.bobPhase = index * GOLDEN_ANGLE;',
      replace: '  startCycle(item, row, index % row.faces.length);\n  item.faceIn = 0;\n  item.bobPhase = index * GOLDEN_ANGLE;',
    },
  },
];
