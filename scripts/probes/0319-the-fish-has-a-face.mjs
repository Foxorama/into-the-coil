// The fish has a face — docs/decisions/0319-the-fish-has-a-face.md
//
// Every guard 0319 adds, broken on purpose. `node scripts/prove-guard.mjs 0319`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0319',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE SNAP DRAWN AS A SMALLER GAPE, WHICH IS THE ONE WRONG DRAWING 0285 IS NAMED FOR. Every
      other claim about this face stays green over it: there are still three silhouettes, they are
      still all different, the hurt twins still pair, and the mouth still answers the pilot. What is
      gone is the only thing that makes the gape MEAN anything — *a gape that does not mean a volley
      is coming is a lie the fight tells once*.
    */
    broke: 'the snap drawn as a smaller gape, so the tell and the bite are two degrees of one thing',
    guard: 'THE ASKED-FOR ONE: the mouth has three silhouettes',
    edit: {
      path: 'src/render/bake.ts',
      find: '  shut: [\n    [-0.9, 0.17],\n    [-1, 0],\n    [-1, 0],\n    [-0.9, -0.17],\n  ],',
      replace:
        '  shut: [\n    [-0.88, 0.15],\n    [-0.99, 0.19],\n    [-0.99, 0.19],\n    [-0.93, 0.09],\n    [-0.88, 0.02],\n' +
        '    [-0.88, -0.02],\n    [-0.93, -0.09],\n    [-0.99, -0.19],\n    [-0.99, -0.19],\n    [-0.88, -0.15],\n  ],',
    },
  },
  {
    decision: '0319',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE MOUTH PUT ON A CLOCK, WHICH IS THE MECHANISM THAT LOOKS RIGHT IN EVERY SCREENSHOT AND IS
      WRONG. It still moves, still snaps, still runs through all four silhouettes — and every player
      gets the same animal, which is 0282's *a mechanism whose output cannot differ per instance is a
      constant wearing a mechanism's clothes*. The pilot who holds a lane a third of the span away is
      bitten at anyway.
    */
    broke: 'the bite armed off a step counter rather than off the ship crossing the head',
    guard: 'it answers the PILOT and not a clock',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const side = gaze < -FACE_LOOK ? -1 : gaze > FACE_LOOK ? 1 : w.bossGazeSide;',
      replace: '  const side = w.steps % 48 < 24 ? -1 : 1;',
    },
  },
  {
    decision: '0319',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ AND THE GAPE HELD OPEN FOR THE WHOLE CADENCE, WHICH IS *aggressively moving its mouth* with
      the information taken out. The mouth still opens, still shuts, and still has a volley on the
      far end of every opening — what is gone is that the opening says WHEN. Measured: 564 of 876
      gaped steps are more than half a second from any volley, so it reddens on the pairing before it
      ever reaches the share. Both halves are the same claim read at two distances.
    */
    broke: 'the gape held for the whole cadence, so the mouth is open more often than it is shut',
    guard: 'the GAPE is the volley’s own tell',
    edit: {
      path: 'src/app/frame.ts',
      find: 'const FACE_GAPE = 20;',
      replace: 'const FACE_GAPE = 400;',
    },
  },
];
