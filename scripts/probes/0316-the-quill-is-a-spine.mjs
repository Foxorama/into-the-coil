// The quill is a spine — docs/decisions/0316-the-quill-is-a-spine.md
//
// The drawing itself is held by 0262's probes, by `tests/accents.test.ts`'s containment and minimum
// mark, and by `tests/combat.test.ts`'s hurtbox band — the decision says why a guard over *what a
// silhouette looks like* would be 0295's content limiter. What IS this decision's own is the half
// that made the new shape legible in flight. `node scripts/prove-guard.mjs 0316`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0316',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE SPINE NOT TURNED TO ITS FLIGHT — which is what shipped until the first in-game photograph
      of a breaker: a rank of little bars sliding up the screen edge-on, while every assertion about
      where they WERE stayed green. 0262's *"the shaft points the way it flies"* is the claim this
      drawing rests on, and a wave off the edge is the first attack that sends one ninety degrees off.
    */
    broke: 'the spines of a breaker not turned to their flight, so the wave rises edge-on',
    guard: 'THE ASKED-FOR ONE: the wave comes up off the EDGE',
    edit: {
      path: 'src/app/boss.ts',
      find: '        shot.turn = turnFor(Math.atan2(-rise, 0));',
      replace: '        shot.turn = 0;',
    },
  },
];
