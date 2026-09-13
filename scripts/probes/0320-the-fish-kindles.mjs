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
      find: 'look: ABLAZE,',
      replace: 'look: KINDLED,',
    },
  },
  {
    decision: '0320',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ AND THE FIRE ON FROM THE FIRST STEP, WHICH IS THE DEFECT THAT SAYS NOTHING. A boss that is
      always burning is burning as decoration: the whole of what an aura carries is *how far into this
      am I*, and a fish that opens alight has spent that and bought a texture. It is also exactly the
      wallpaper 0317 spent a decision removing from the adds, one layer up.
    */
    broke: 'the fire lit from the first phase, so it decorates the boss instead of measuring it',
    guard: 'the fire is OFF for the first half',
    edit: {
      path: 'src/content/bosses.ts',
      find:
        "      { upTo: 1, fireEvery: 72, shots: 5, spread: 0.9, patrolScale: 1, stance: { kind: 'volley' }, look: null, shot: null, attack: null },",
      replace:
        "      { upTo: 1, fireEvery: 72, shots: 5, spread: 0.9, patrolScale: 1, stance: { kind: 'volley' }, look: KINDLED, shot: null, attack: null },",
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
