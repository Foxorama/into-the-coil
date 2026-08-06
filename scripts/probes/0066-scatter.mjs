// The breaks behind docs/decisions/0066-a-death-scatters-what-it-took.md.
//
// ⚠️ The one worth understanding is the ORDER. `lifeLost` empties the upgrade list, so a scatter
// dispatched after it throws nothing at all — and every other assertion in this file is about a
// scatter that happened, so a scatter that never happens looks like a screen with nothing on it,
// which is exactly what the game looked like before this decision.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0066',
    suite: 'tests/pickups.test.ts',
    // ⚠️ THE REPORTED ONE: a death that takes the upgrades and gives nothing back. It is what shipped.
    broke: 'the scatter removed, so a death takes the upgrades and offers none of them back',
    guard: 'THE REPORTED ONE: one pickup per upgrade, where the ship was',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const item = w.pickups.spawn();\n    // A scatter one pickup short is dropped rather than grown',
      replace: '    const item = null;\n    // A scatter one pickup short is dropped rather than grown',
    },
  },
  {
    decision: '0066',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE CYCLE, LEFT ON. A scattered `spread` turns into a `missileSpread` a few seconds later and
      the game hands the player something they never found — which is 0052 working exactly as designed
      on a body it was never meant to reach.
    */
    broke: 'the scatter left cycling, so what comes back is not what was lost',
    guard: 'does not cycle, so what comes back is what was lost',
    edit: { path: 'src/app/frame.ts', find: '    if (item.lifeFor > 0) continue;\n    const face', replace: '    const face' },
  },
  {
    decision: '0066',
    suite: 'tests/pickups.test.ts',
    // And the counterweight: the same rule applied to every pickup would switch the cycle off for the
    // whole game. 0052 is the decision that must not be undone by this one.
    broke: 'the no-cycling rule widened to every pickup, which undoes 0052 entirely',
    guard: 'an AUTHORED pickup still cycles',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (item.lifeFor > 0) continue;\n    const face',
      replace: '    if (item.lifeFor >= 0) continue;\n    const face',
    },
  },
  {
    decision: '0066',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THROWN ALONG AS WELL AS ACROSS, which is what an explosion looks like in a game that does not
      scroll. Here it puts the whole scatter off the front or the back of the view inside two seconds
      — 0034's *every speed is in the camera's frame*, and the tidiest-looking way to break it.
    */
    broke: 'the scatter thrown along the lane too, so it leaves the screen before it can be reached',
    guard: 'holds the distance the ship died at, rather than flying off the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: '    item.velAlong = w.scrollPerStep;',
      replace: '    item.velAlong = w.scrollPerStep + SCATTER_SPEED * side;',
    },
  },
  {
    decision: '0066',
    suite: 'tests/pickups.test.ts',
    // The fan flattened. Six upgrades then arrive stacked on one lane, which is one pickup the player
    // can reach and five they cannot.
    broke: 'the fan flattened, so a whole loadout arrives stacked on one lane',
    guard: 'spreads across the lane instead of stacking on one line',
    edit: {
      path: 'src/app/frame.ts',
      find: '    item.velAcross = SCATTER_SPEED * side * (1 - rank * 0.15);',
      replace: '    item.velAcross = 0;\n    void side;\n    void rank;',
    },
  },
  {
    decision: '0066',
    suite: 'tests/pickups.test.ts',
    // The timer removed. *"A short timer so there's enough time to grab some, but maybe not all"* —
    // without it a death hands the whole loadout back and costs the player nothing at all.
    broke: 'the short timer removed, so a death costs the player nothing',
    guard: 'is gone on a short timer, and says so when it goes',
    edit: { path: 'src/app/frame.ts', find: '    item.lifeFor = SCATTER_STEPS;', replace: '    void SCATTER_STEPS;' },
  },
  {
    decision: '0066',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE ORDER, which is the one thing `src/app/frame.ts` cannot state. `lifeLost` empties the
      upgrade list, so a scatter dispatched after it throws nothing — and the code reads perfectly.
    */
    broke: 'the scatter moved after the reducer that empties the list, so it throws nothing',
    guard: 'THE REPORTED ONE: one pickup per upgrade, where the ship was',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const kind = w.pickupKinds[upgrades[i]!];',
      replace: '    if (i >= 0) return;\n    const kind = w.pickupKinds[upgrades[i]!];',
    },
  },
];
