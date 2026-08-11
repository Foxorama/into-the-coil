// The breaks behind docs/decisions/0086-the-teeth-wait-for-the-gun.md.
//
// ⚠️ EVERY PROBE HERE IS A CONTENT EDIT, and that is the subject rather than a shortcut. 0084's clamp
// is code and was already correct; what was wrong was a level table that put a three-health turret ten
// world units behind the pickup that lifts it. There is no expression to break, so a break has to be
// a wave moved — which is also the change somebody retuning level one would make without ever seeing
// the connection.
//
// ⚠️ THE ONE THAT IS NOT HERE is "the run-up removed from the spawner". The run-up is not in the
// spawner: the clamp is, and `scripts/probes/0084-dial.mjs` owns every break of it. This decision is
// the distance between the clamp lifting and the player flying what lifted it, and that distance lives
// in two places — the level table and the pickup's own linger — both of which are broken below.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0086',
    suite: 'tests/dial.test.ts',
    /*
      ⚠️ THE REPORTED DEFECT ITSELF, PUT BACK BYTE FOR BYTE. This line is what level one shipped up to
      and including 0084: a turret column at 2,310 against a weapon pickup at 2,300. Every guard in
      `tests/dial.test.ts` was green over it, because the clamp did exactly what it says — it lifted
      when the level offered the second weapon, and the turret arrived in the same third of a second.
    */
    broke: 'the turret put back ten units behind the pickup that lifts the clamp',
    guard: 'THE REPORTED ONE: level one authors nothing tough until the run-up is over',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 1594, enemy: 'weaver', formation: 'column', count: 5, lane: 30 },",
      replace: "  { at: 1598, enemy: 'turret', formation: 'column', count: 4, lane: 30 },",
    },
  },
  {
    decision: '0086',
    suite: 'tests/dial.test.ts',
    /*
      ⚠️ THE RUN-UP SET TO NOTHING, which is the tuning edit that looks like a tuning edit. A zero
      run-up is *the clamp is enough on its own* — the position this decision exists to disagree with —
      and it passes the content guard trivially, because every wave in the level is at least zero units
      after the pickup. What catches it is the relationship to the pickup's own wait: a player is still
      legitimately flying towards a pickup for seven seconds after it lands, and a run-up under that is
      a promise about a gun the player has not reached.
    */
    broke: 'the run-up cut to nothing, so the clamp lifting is the whole of the promise again',
    guard: 'and the run-up outlasts the wait the pickup itself gets',
    edit: {
      path: 'src/content/levels.ts',
      find: 'export const MULTI_HIT_RUNUP = 600;',
      replace: 'export const MULTI_HIT_RUNUP = 0;',
    },
  },
  {
    decision: '0086',
    suite: 'tests/dial.test.ts',
    /*
      ⚠️ THE OTHER SIDE OF THE SAME GAP, AND IT IS WHY THE FIELD GUARD IS DRIVEN RATHER THAN READ. The
      waves are untouched here; the pickup moves. A level that offered its second weapon at 3,300 would
      hold the clamp on past the lancer at 3,030 — so the tough wave arrives at one health, the player
      then gets the gun, and the level's teeth land in the wrong order with nothing in the table
      looking wrong.

      ⚠️ IT IS ALSO A PLAUSIBLE PICKUP RETUNE. `src/content/levels.ts` says what differs level to level
      is WHERE rather than how many, so moving one is the sanctioned kind of edit — and this is the one
      that silently unpicks the run-up from the far end.
    */
    broke: 'the pickup that lifts the clamp moved past the wave it was buying the player a gun for',
    guard: 'and it reaches the FIELD: the two events are that far apart in the real frame',
    edit: {
      path: 'src/content/levels.ts',
      // ⚠️ Level one's second weapon, which is the pickup the run-up is measured FROM. Both lines are
      // needed: a weapon at lane 34 sits at 1932 in `gauntlet` too, and an anchor that matched there
      // would move a different level's pickup and prove nothing about this one.
      find: "  { at: 1588, kind: 'weapon', lane: 34 },\n  { at: 2103, kind: 'weapon', lane: 68 },",
      replace: "  { at: 2700, kind: 'weapon', lane: 34 },\n  { at: 2103, kind: 'weapon', lane: 68 },",
    },
  },
];
