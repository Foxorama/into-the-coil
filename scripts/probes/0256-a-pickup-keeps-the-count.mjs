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
    // 0233's switch put back: a pickup of another kind re-fits what the ship already carries.
    // ⚠️ Re-aimed by 0577, which took the ladder and the switch with it: a new tube re-fitting the
    // tubes before it to its own kind is the switch in the one shape the tubes can still take.
    broke: 'a new tube re-fitting the tubes before it to its kind',
    guard: '0577 — a missile pickup fits its kind into the next empty tube',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '      const tubes = [...state.tubes, action.kind];',
      replace: '      const tubes = [...state.tubes.map(() => action.kind), action.kind];',
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
  /*
    `a level authoring a bomb of its own` and `a shield authored into a level` were here. Since 0575 a
    level authors places and no kinds, so a bomb or a shield written into one is not a thing the table
    can hold; what is left of both is a second place, which is 0082's probe.
  */
  {
    decision: '0256',
    suite: 'tests/pickups.test.ts',
    // The level's place pushed to the middle — *"about 20% of the way in"* lost.
    broke: 'a level’s pickup place moved to the middle of the level',
    // ⚠️ Renamed and re-anchored by 0575: the place is drawn, so it is not a missile's any more.
    guard: 'THE FIRST PLACE: every level offers a pickup about a fifth of the way in',
    edit: {
      path: 'src/content/levels.ts',
      // 2100 is still past the middle of a level whose boss is at 3988.
      find: '  { at: 798, lane: 36 },',
      replace: '  { at: 2100, lane: 36 },',
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
  // `a dropped bomb holding one face` was here; since 0575 every pickup holds one face, and a dropped
  // piece put on its row's first face is 0575's own probe.
];
