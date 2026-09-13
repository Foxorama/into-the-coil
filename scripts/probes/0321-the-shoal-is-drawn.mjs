// The shoal is drawn — docs/decisions/0321-the-shoal-is-drawn.md
//
// Every guard 0321 adds, broken on purpose. `node scripts/prove-guard.mjs 0321`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0321',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE HALO TAKEN OFF THE ADDS, WHICH IS THE MARK THE BRIEF WAS ACTUALLY ABOUT. Everything else
      stays: the form-shade, the lit edge, the eye with its pupil, the two silhouettes still separated
      the way 0314 asks. And both bodies go back to being cut-outs sitting on the void — *flat* is a
      claim about shading, and this is the shading that says the thing is made of the place it is in.
    */
    broke: 'the halo taken off both adds, so each is a cut-out on the void again',
    guard: 'THE ASKED-FOR ONE: neither add is FLAT',
    edit: {
      path: 'src/render/bake.ts',
      find: "  ctx.globalCompositeOperation = 'destination-over';\n  for (const [gap, alpha] of [\n    [0.05, 0.22],\n    [0.13, 0.09],\n  ] as const) {",
      replace: "  ctx.globalCompositeOperation = 'destination-over';\n  for (const [gap, alpha] of []) {",
    },
  },
  {
    decision: '0321',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ AND THE KITE DRAWN AS A CURVE, WHICH IS THE DRAFT THIS DECISION PHOTOGRAPHED AND PUT BACK. It
      is the prettier drawing and the wrong one: 0314 separates these two on *straight-edged and
      symmetrical* against *curved, with a top and a bottom*, and rounding the kite spends one of the
      two on an animal the player has half a second to tell from the other. Nothing else moves — same
      hull, same paint, same marks — which is exactly why nothing else can see it.
    */
    broke: 'the kite drawn as a curve, so both adds are curves and one legibility channel is spent',
    guard: 'the two are not drawn the SAME way',
    edit: {
      path: 'src/render/bake.ts',
      find: '      trace(ctx, f, KITE_HULL);',
      replace: '      curveLoop(ctx, f, KITE_HULL);',
    },
  },
];
