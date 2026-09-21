// The breaks behind docs/decisions/0351-rime-shelf-is-ice.md.
//
// Asked for: *"needs to be far far more icy — different whites and blues and aquas and teals etc."*
// Answered: *"an off-white balanced colour… I'll see how it plays out"*, with the floor and the foe
// inks where they are. Every break below is a way this pass could have spent the floor without saying so.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0351',
    suite: 'tests/ice.test.ts',
    // The coping in a true off-white — the obvious way to answer *"whites"*, and one no stated colour holds.
    broke: 'the crest coped in an off-white the place never states, so the land guard cannot see it',
    guard: 'THE FLOOR UNDER THE ICE',
    edit: {
      path: 'src/render/bake.ts',
      find: '  ctx.strokeStyle = lit;\n  ctx.lineWidth = Math.max(1, size * 0.0022);',
      replace: "  ctx.strokeStyle = '#dfeef2';\n  ctx.lineWidth = Math.max(1, size * 0.0022);",
    },
  },
  {
    decision: '0351',
    suite: 'tests/ice.test.ts',
    // A shadow mixed UP instead of down: brighter than anything stated, in the body of the cliff.
    broke: 'the lower floes lit brighter than the palest stated ice',
    guard: 'THE FLOOR UNDER THE ICE',
    edit: {
      path: 'src/render/bake.ts',
      find: '  facets(ctx, low, size * 0.014, mix(face, deep, 0.3), mix(face, deep, 0.6), mix(deep, land, 0.4));',
      replace: "  facets(ctx, low, size * 0.014, mix(lit, '#ffffff', 0.3), mix(face, deep, 0.6), mix(deep, land, 0.4));",
    },
  },
  {
    decision: '0351',
    suite: 'tests/jungle.test.ts',
    // The ask taken literally: the palest ice stated as an off-white.
    broke: 'the palest ice stated as an off-white, so the game’s own inks are lost against it',
    guard: 'THE FLOOR: every colour a planet’s land is lit in',
    edit: {
      path: 'src/content/themes.ts',
      find: "      vivid: { far: '#1c4a60', canopy: '#0d5462', lit: '#3c5062' },",
      replace: "      vivid: { far: '#1c4a60', canopy: '#0d5462', lit: '#dfeef2' },",
    },
  },
  {
    decision: '0351',
    suite: 'tests/places.test.ts',
    // The specks at the width they were drawn before this pass: a compact mark a bullet wide.
    broke: 'the snow drawn as thick as the shards were, so a speck is the size of a bullet',
    guard: 'THE HOLE: no compact structure mark is the size of something that can kill you',
    edit: {
      path: 'src/render/bake.ts',
      find: '          width: rng.range(0.002, 0.004) * size,',
      replace: '          width: rng.range(0.004, 0.008) * size,',
    },
  },
  {
    decision: '0351',
    suite: 'tests/sky.test.ts',
    // The paler sky the ask names, taken further than the room it has.
    broke: 'the haze thickened past the room the snow gave back, so the sky is under the floor',
    guard: 'every ink clears the floor against the backdrop WITH EVERYTHING THE SKY DRAWS ON IT',
    edit: {
      path: 'src/render/bake.ts',
      find: '    daylight: { mid: 0.4, deep: 0.5, horizon: 0.6, haze: 0.15 },',
      replace: '    daylight: { mid: 0.4, deep: 0.5, horizon: 0.6, haze: 0.45 },',
    },
  },
];
