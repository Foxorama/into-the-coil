// The breaks behind docs/decisions/0159-the-two-clocks-come-apart.md.
//
// ⚠️ THE ONE THAT IS NOT HERE is "the tempo left tied to the step clock". There is no edit that
// stages it as a FAILURE — that coupling was the shipped game for two months and every guard in the
// repository was green over it, which is the whole point of the decision. What it cost was a rule
// that a weapon may only fire at one of the eight divisors of 24, and "the arsenal you could have
// had" is an argument rather than a red test. Exactly the shape 0093's own probe file opens by
// naming about the tempo it replaced, arriving one decision later from the other side.
//
// ⚠️ WHAT IS HERE INSTEAD is the property the sim keeps once the music lets go: a ladder is still a
// LADDER. While every rung had to divide 24 there were eight legal values and a hand could barely
// author a ladder that went backwards; now that any integer is legal, "an upgrade makes the gun
// faster" is a real thing to check rather than a thing the arithmetic happened to give.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  /*
    `the fire ladder authored so an upgrade slows the missiles down` was here; 0577 took the tubes'
    ladder, the last a pickup climbed, so there is no rung left to be slower than the one before it.
  */
  {
    decision: '0159',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ A CADENCE THE FIXED-STEP CLOCK CANNOT EXPRESS. `docs/decisions/0022-frame-rate-is-a-feature.md`
      steps at a fixed 60 Hz and a gap between volleys is counted in whole steps, so 6.5 is not a
      slightly-wrong number — it is a number the sim rounds silently, differently at different tiers.

      ⚠️ THIS HALF USED TO BE CARRIED BY THE DIVISOR RULE FOR FREE: nothing that divides 24 is
      fractional. Removing the rule is what makes it worth asserting on its own, which is the class of
      thing to look for whenever a constraint is dropped — what was it holding up that nobody listed?
    */
    broke: 'a cadence authored as a fraction of a step, which the fixed-step clock rounds away',
    guard: 'every rung is a whole number of steps, and the ladder never gets SLOWER',
    edit: {
      // ⚠️ Re-anchored by 0233: the ladder is the missile kind's now, not the ship's.
      path: 'src/content/missiles.ts',
      // ⚠️ Re-anchored by 0235: the seeker shares the ladder, so the straight row's `seek: 0` is
      // what makes this the straight missile's. And by 0577, which made the ladder one note value.
      find: '    missileEvery: 4,\n    seek: 0,',
      replace: '    missileEvery: 4.5,\n    seek: 0,',
    },
  },
];
