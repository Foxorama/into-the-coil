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
      // ⚠️ Re-anchored by 0266, which gave the reducer a count to apply: the clamp is the same
      // clamp, asked once against the room left on the ladder rather than once per event.
      // ⚠️ Re-anchored by 0372, which took the count away again: one rung a pickup.
      find: '      const upgrades = room > 0 ? [...state.upgrades, action.upgrade] : state.upgrades;',
      // ⚠️ Re-aimed by 0441: the tubes are the one ladder, so the fitted kind is the missile's.
      replace:
        '      const fitted = state.missile;\n' +
        '      const upgrades = action.kind === fitted ? (room > 0 ? [...state.upgrades, action.upgrade] : state.upgrades) : [...state.upgrades.filter((u) => u !== action.upgrade), action.upgrade];',
    },
  },
  /*
    ⚠️ **THREE PROBES WERE HERE — the rung, its floor, and the gun a death kept — AND
    docs/decisions/0266-a-death-throws-the-ladders-back.md DELETED THEM WITH THE RULE THEY BROKE.**
    *"A death reduces the power count by 1 (to a minimum of 1)"* was asked for, built and played, and
    what the play said was that it had landed alongside the deleted scatter and that the two together
    emptied the field. Their breaks are the current behaviour: *a death emptying the ladder* and *a
    death putting the base gun back on the ship* are what the code does now, and a probe cannot break
    a thing into what it already is. `scripts/probes/0266-a-death-throws-the-ladders-back.mjs` breaks
    the restored rule in the same three places.
  */
  {
    decision: '0256',
    suite: 'tests/death.test.ts',
    // The death dispatched on the step the hull reaches zero rather than at the end of the beat.
    broke: 'the death’s cost dispatched on the step the hull reached zero, before the beat',
    // ⚠️ Renamed by 0372: nothing is thrown now, and what shows the early dispatch is the life.
    guard: 'throws nothing out of the wreck, and the next ship flies the ladders the last one had',
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
    /*
      ⚠️ RE-AIMED BY 0441, which removed every level's weapon and made the weapon pickup the bomb
      pickup: the budget is one missile a level, and the bomb is the mid-boss's but for level one's.
      A `kind: 'weapon'` here names no kind any more and nothing in the guard counts it, so it could
      not redden — the extra is a bomb, the pickup that took the weapon's place.
    */
    broke: 'a level authoring a bomb of its own, which is how nine a level came back',
    guard: 'THE BUDGET: a level authors one missile and nothing else',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 864, kind: 'missile', lane: 28 },",
      replace: "  { at: 864, kind: 'missile', lane: 28 },\n  { at: 1700, kind: 'bomb', lane: 40 },",
    },
  },
  {
    decision: '0256',
    suite: 'tests/pickups.test.ts',
    // The shield authored back into a level, where it is the mid-boss's to drop.
    broke: 'a shield authored into a level rather than dropped by its mid-boss',
    // ⚠️ Renamed by 0441, which took the levels' weapons.
    guard: 'THE BUDGET: a level authors one missile and nothing else',
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
    // ⚠️ Re-anchored and renamed by 0372, which put a missile where the bomb was.
    // ⚠️ And by 0441, which put the bomb pickup where the weapon was.
    guard: 'the fights offer the rest: a mid-boss drops one bomb, one shield and one missile',
    edit: {
      path: 'src/content/levels.ts',
      find: "export const MID_BOSS_DROP: readonly PickupKind[] = ['bomb', 'shield', 'missile'];",
      replace: "export const MID_BOSS_DROP: readonly PickupKind[] = ['bomb', 'missile'];",
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
  /*
    ⚠️ TWO PROBES STOOD HERE AND 0441 RETIRED THEM WITH THE DIAL —
    docs/decisions/0441-a-pilot-flies-their-own-ship.md. *The dropped weapon not counted on the dial*
    and *the level's weapon count read off the list alone* broke `w.weaponsOffered` and
    `weaponsOfferedBy`, which went with the gun's ladder; their guards went with tests/dial.test.ts
    and with the dial's half of `THE DROP`.
  */
  {
    decision: '0256',
    suite: 'tests/pickups.test.ts',
    // A dropped weapon holding its face, which was 0243's rule for a scattered piece.
    // ⚠️ Renamed by 0441: the piece that cycles is the bomb pickup now.
    broke: 'a dropped bomb holding one face, as a scattered piece did',
    guard: 'and a dropped bomb cycles like an authored one',
    edit: {
      path: 'src/app/frame.ts',
      find: '  startCycle(item, row, index % row.faces.length);\n  item.bobPhase = index * GOLDEN_ANGLE;',
      replace: '  startCycle(item, row, index % row.faces.length);\n  item.faceIn = 0;\n  item.bobPhase = index * GOLDEN_ANGLE;',
    },
  },
];
