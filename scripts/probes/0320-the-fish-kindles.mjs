// The fish kindles — docs/decisions/0320-the-fish-kindles.md
//
// Every guard 0320 adds, broken on purpose. `node scripts/prove-guard.mjs 0320`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0320',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE SECOND STAGE DROPPED, WHICH IS THE CHEAP VERSION OF THIS WHOLE CHANGE AND LOOKS FINE IN
      EVERY SCREENSHOT. The fish still kindles, still burns for the back half of the bar, still has an
      aura in its own inks — and it is a boss with ONE costume change rather than an escalation the
      picture keeps saying. The eight faces it costs are the whole argument, so removing them is the
      break that has to be seen.
    */
    broke: 'the second stage dropped, so the fish kindles once and never grows',
    guard: 'THE ASKED-FOR ONE: it is drawn three different ways',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0380: two stages are ablaze now, and the break is the THIRD going back to
      // kindled — a fish that grew its fins and then lost them, which is the *never goes back* half.
      find: "look: ABLAZE, shot: null, attack: { kind: 'breaker'",
      replace: "look: KINDLED, shot: null, attack: { kind: 'breaker'",
    },
  },
  {
    decision: '0320',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE FIRE OUT AT THE FIRST STAGE. 0320 held the opposite — cold for the first half, so the fire
      measured the fight — and 0380 put the burning stages first on the player's word; what the aura
      carries now is the LADDER, kindled to ablaze to white-hot, and a cold first stage is the wall the
      play named. Re-aimed by 0380; the sentence it breaks is the guard's own.
    */
    broke: 'the fire out at the first stage, so the fish arrives as the wall the play named',
    guard: 'the fire is ON from the first stage',
    edit: {
      path: 'src/content/bosses.ts',
      find: "      { upTo: 1, fireEvery: 54, shots: 7, spread: 1.1, patrolScale: 1.3, stance: { kind: 'volley' }, look: KINDLED,",
      replace: "      { upTo: 1, fireEvery: 54, shots: 7, spread: 1.1, patrolScale: 1.3, stance: { kind: 'volley' }, look: null,",
    },
  },
  {
    decision: '0320',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ AND THE FINS GROWN ON THE EDGE THE PLAYER FLIES INTO. This is the version of the morph that is
      obvious to draw and wrong to ship: a bigger animal at the last phase, so four phases of learning
      where 42 units of fish ENDS are handed back at the rung where the fight is hardest. Every other
      claim stays green — it still kindles, still in three stages, still in its own fire.
    */
    broke: 'the wings grown on the LEADING edge, so the hull a player flies into changes at a health threshold',
    guard: 'the grown body is the same animal to DODGE',
    edit: {
      path: 'src/render/bake.ts',
      find: '  [-0.66, -0.19],\n  [-0.52, -0.21],\n  [-0.42, -0.46],\n  [-0.26, -0.74],\n  [-0.06, -0.95],\n  [0.02, -1],\n  [0.02, -1],\n  /*',
      replace: '  [-0.66, -0.24],\n  [-0.52, -0.3],\n  [-0.42, -0.55],\n  [-0.26, -0.82],\n  [-0.06, -1],\n  [0.04, -1.04],\n  [0.04, -1.04],\n  /*',
    },
  },
];
