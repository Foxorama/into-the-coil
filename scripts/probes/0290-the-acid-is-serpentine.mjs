// The acid is serpentine — docs/decisions/0290-the-acid-is-serpentine.md
//
// Every guard 0290 adds, broken on purpose. `node scripts/prove-guard.mjs 0290`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0290',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE STATE OF `main` BEFORE THIS DECISION, IN ONE NUMBER: THREE.** The phase's own count, in
      a plain fan — *"the 3 blobs now."* Setting the beads back to one leaves the wave's arithmetic
      running over exactly the shots the phase asks for, which is the volley the report is about.
    */
    broke: 'one bead per shot, so the wave is drawn with the phase’s three points',
    guard: 'THE REPORTED ONE: the acid leaves as a WAVE',
    edit: {
      path: 'src/app/boss.ts',
      find: '      const beads = count * attack.beads;',
      replace: '      const beads = count;',
    },
  },
  {
    decision: '0290',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **AND NINE BEADS IN A PLAIN FAN, WHICH IS THE HALF A COUNT WOULD MISS.** Three blobs with more
      blobs: the density is the report's word and the shape is its meaning. A fan's headings march one
      way from first to last, so the reversals go to zero while every count in the guard stays met.
    */
    broke: 'the heading marched across the fan instead of waved, so nine beads are a fan',
    guard: 'THE REPORTED ONE: the acid leaves as a WAVE',
    edit: {
      path: 'src/app/boss.ts',
      find: '        const angle = Math.PI + boss.firePhase + along * Math.sin(t * attack.waves * TAU);',
      replace: '        const angle = Math.PI + boss.firePhase + along * (t - 0.5) * 2;',
    },
  },
  {
    decision: '0290',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **AND THE RAKE DROPPED, WHICH IS THE THING THIS ATTACK INHERITED ON PURPOSE.** The serpent's
      opening phase turns and its later phases index heads by a count; the crash that came of sharing
      one field between the two is held by a guard that opens by asserting the opening phase raked. An
      acid attack that stood still would leave that guard green and measuring nothing, so the turn is
      named where the shape is.
    */
    broke: 'the serpentine spray no longer turning, so the guard below it measures a rake that never happens',
    guard: 'THE THREE WEAPONS: a raking fan of acid',
    edit: {
      path: 'src/app/boss.ts',
      find: '      boss.firePhase += attack.turn;\n      const beads = count * attack.beads;',
      replace: '      const beads = count * attack.beads;',
    },
  },
];
