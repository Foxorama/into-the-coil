// The breaks behind docs/decisions/0225-a-landmark-is-not-a-carbon-copy.md.
//
// ⚠️ *"Lets go and add that seed to the landmarks and levels, it sounds like it's going to be needed to
// make the levels more interesting rather than carbon copies."* 0224 gave Saurian Belt three volcanoes
// and they came out identical — necessarily, because every entry blits one baked bitmap — with two of
// the three usually on screen together.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0225',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE SEED REACHING THE TABLE AND NOT THE PEN, WHICH IS EXACTLY WHAT THE FIRST VERSION DID. A
      drawing that takes a seed and ignores it compiles, bakes three canvases, blits three sprites and
      draws one object three times. **Nothing about the call site says otherwise** — the plumbing is all
      correct and the picture is a carbon copy.
    */
    broke: 'a drawing given the seed and ignoring it, so its three castings are one object',
    guard: 'every casting of a landmark is a different drawing',
    edit: {
      path: 'src/render/bake.ts',
      find: "  const rng = makeRng('sky').stream(`saurian/volcano${seed}`);",
      replace: "  const rng = makeRng('sky').stream('saurian/volcano0');",
    },
  },
  {
    decision: '0225',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ AND THE PLACE NOBODY IS LOOKING AT, WHICH IS WHERE THIS WOULD ACTUALLY HAPPEN. The Black Heart
      places ONE landmark, so its other two castings are never drawn — skipping the seed there costs
      nothing visible today and is the obvious economy. The guard holds every place that draws a
      landmark rather than every place that places two, because the claim is about the machinery.
    */
    broke: 'the place that places one landmark left un-seeded, where nothing would show it',
    guard: 'every casting of a landmark is a different drawing',
    edit: {
      path: 'src/render/bake.ts',
      // ⚠️ Re-anchored by 0229, which redrew the heart as an organ: the seed moves its apex and its
      // fullness now rather than a lean, and the break takes both.
      find: '  const droop = rng.range(0.0, 0.08);\n  const fullness = rng.range(-0.04, 0.05);',
      replace: '  const droop = 0.04;\n  const fullness = 0;',
    },
  },
  {
    decision: '0225',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE HALF THE DRAWING CANNOT ENFORCE, AND IT IS THE CLAIM THE REPORT ACTUALLY MADE. Three
      distinct castings are no use to a level that names the same one three times — and `variant: 0` is
      what a copied line says, so this is the likeliest way the carbon copies come back.
    */
    broke: 'a level placing three landmarks and naming one casting for two of them',
    guard: 'a level that places more than one uses more than one of them',
    edit: {
      path: 'src/content/levels.ts',
      find: '      { at: 2534, lane: 74, depth: 0.075, beat: 190, variant: 1 },',
      replace: '      { at: 2534, lane: 74, depth: 0.075, beat: 190, variant: 0 },',
    },
  },
];
