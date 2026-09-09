// A cavity is not washed — docs/decisions/0287-a-cavity-is-not-washed.md
//
// Every guard 0287 adds, broken on purpose. `node scripts/prove-guard.mjs 0287`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0287',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ **THE STATE OF `main` BEFORE THIS DECISION, IN ONE LINE: A SOLID WASH.** The flash ink laid
      over the whole tile, so the dark red filling the gape — a MARK, because 0284 made the mouth a
      notch rather than a hole — washes to within a hair of the flesh around it and the cavity
      flattens. *"A slightly off white triangle inside the mouth."*
    */
    broke: 'the wash laid over the whole tile again, so the open mouth lights up with the flesh',
    guard: 'THE REPORTED ONE: the hit wash is held out of the mouth',
    edit: {
      path: 'src/render/bake.ts',
      find: '    cavityOf(ctx, f, kind);',
      replace: '',
    },
  },
  {
    decision: '0287',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ **AND THE CAVITY AUTHORED A SECOND TIME**, which is the half of the claim that is not about
      the flash at all. A wedge written out beside the one the head paints looks right on whichever
      face it was tuned against and drifts on the others the moment a jaw angle moves — measured in
      fractions of a pixel when the FANGS did it across three frames, and invisible until 0285 made
      them one description. Same shape, one word out of place.
    */
    broke: 'the wash held out of a second wedge authored beside the mouth rather than out of the mouth',
    guard: 'and out of the SAME mouth the head paints',
    edit: {
      path: 'src/render/bake.ts',
      // ⚠️ Re-anchored by 0288, which leans every point of the skull on its way to the canvas.
      find: '  trace(ctx, f, leant(parted(MOUTH, JAWS[jaw])));',
      replace: '  trace(ctx, f, leant(parted(MOUTH.map(([x, y]) => [x * 0.98, y]), JAWS[jaw])));',
    },
  },
];
