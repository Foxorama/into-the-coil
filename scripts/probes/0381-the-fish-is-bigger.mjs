// The fish is bigger, and its tail is one animal — docs/decisions/0381-the-fish-is-bigger.md
//
// Every guard 0381 adds, broken on purpose. `node scripts/prove-guard.mjs 0381`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0381',
    suite: 'tests/volans.test.ts',
    // THE ASKED-FOR ONE: the hull back at 0318's 42 across, with every face and the hit twin.
    broke: 'the fish drawn at its old size again',
    guard: 'THE ASKED-FOR ONE: the fish is drawn a fifth bigger than it was',
    edit: {
      path: 'src/content/sprites.ts',
      find: '  boss9: 50,\n  boss9Hit: 50,',
      replace: '  boss9: 42,\n  boss9Hit: 42,',
    },
  },
  {
    decision: '0381',
    suite: 'tests/volans.test.ts',
    // The hurtbox left where it was on a bigger drawing: a fish easier to hit than it looks.
    broke: 'the hurtbox not grown with the drawing',
    guard: 'THE ASKED-FOR ONE: the fish is drawn a fifth bigger than it was',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    radius: 18,\n    // Doubled by 0260, from 760.',
      replace: '    radius: 15,\n    // Doubled by 0260, from 760.',
    },
  },
  {
    decision: '0381',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE KNOB PUT BACK: the body's stump run out past the fin's base again, which is the shape
      0374 shipped and the play photographed as a flap pinned to a knob.
    */
    broke: 'the body’s stump run out past the fin’s base again, so the knob shows beside the fin',
    guard: 'and the join is under the flesh',
    edit: {
      path: 'src/render/bake.ts',
      find: '  [0.78, -0.12],\n  [0.8, -0.05],\n  [0.8, 0.05],\n  [0.78, 0.12],\n  [0.74, 0.16],\n  [0.7, 0.17],\n  [0.58, 0.25],\n  [0.5, 0.42],',
      replace: '  [0.8, -0.11],\n  [0.9, -0.05],\n  [0.9, 0.05],\n  [0.8, 0.11],\n  [0.74, 0.16],\n  [0.7, 0.17],\n  [0.58, 0.25],\n  [0.5, 0.42],',
    },
  },
  {
    decision: '0381',
    suite: 'tests/volans.test.ts',
    // The fin's base pulled back behind its root: nothing under the stump, and the join is a seam.
    broke: 'the fin’s base pulled back behind its root, so the stump ends beside it',
    guard: 'and the join is under the flesh',
    edit: {
      path: 'src/render/bake.ts',
      find:
        '  [-0.2, -0.24],\n  [-0.02, -0.34],\n  [0.28, -0.72],\n  [0.48, -1.04],\n  [0.48, -1.04],\n  [0.37, -0.56],\n  [0.2, -0.1],\n  [0.2, 0.1],\n  [0.37, 0.56],\n  [0.48, 1.04],\n  [0.48, 1.04],\n  [0.28, 0.72],\n  [-0.02, 0.34],\n  [-0.2, 0.24],\n  [-0.26, 0.1],\n  [-0.27, 0],\n  [-0.26, -0.1],\n];\n\n/** The grown body\'s tail',
      replace:
        '  [0.12, -0.1],\n  [0.16, -0.24],\n  [0.28, -0.72],\n  [0.48, -1.04],\n  [0.48, -1.04],\n  [0.37, -0.56],\n  [0.2, -0.1],\n  [0.2, 0.1],\n  [0.37, 0.56],\n  [0.48, 1.04],\n  [0.48, 1.04],\n  [0.28, 0.72],\n  [0.16, 0.24],\n  [0.12, 0.1],\n  [0.1, 0.05],\n  [0.1, 0],\n  [0.1, -0.05],\n];\n\n/** The grown body\'s tail',
    },
  },
];
