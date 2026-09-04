// The breaks behind docs/decisions/0224-the-mountain-is-awake.md.
//
// ⚠️ *"Saurian needs blue skies, but exploding volcanoes adding volcanic effects at some points in the
// level."* The blue skies landed in 0221. **Points, plural, is the half that needed the slot**: 0203
// built a landmark to be the one thing in the sky that can be somewhere in particular, and every place
// that has used it since has used it once.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0224',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE PILLARS' OWN RULE, ON A LEVEL THAT PLACES THREE. Ember Nebula's landmark is tied to where
      its organ opens, so moving the section moves the landmark; three volcanoes on three section
      boundaries means the level escalates WITH its music rather than beside it. A landmark nudged to a
      round number looks tidier and is the drift 0029 is about.
    */
    broke: 'a volcano moved off its section boundary, so the level stops escalating with its own music',
    guard: 'a volcano arrives on each of the level’s own section boundaries',
    edit: {
      path: 'src/content/levels.ts',
      find: '      { at: 2534, lane: 74, depth: 0.075, beat: 190, variant: 1 },',
      replace: '      { at: 2500, lane: 74, depth: 0.075, beat: 190, variant: 1 },',
    },
  },
  {
    decision: '0224',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE ONE THE BENCH FOUND, AND NOTHING ELSE COULD HAVE. On a planet the ground is painted LAST
      (0221) and a landmark FIRST, so the ground is what a volcano's base disappears behind. The first
      draft's cone ended at lane 76 with the ridges starting at 81: **drawn correctly, sized correctly,
      floating.** Raising a landmark is also the obvious thing to do when it looks buried.
    */
    broke: 'a volcano lifted until its base clears the horizon, so the mountain hangs in the air',
    guard: 'a landmark on a planet has its feet IN the ground',
    edit: {
      path: 'src/content/levels.ts',
      find: '      { at: 1249, lane: 56, depth: 0.07, beat: 190, variant: 0 },',
      replace: '      { at: 1249, lane: 18, depth: 0.07, beat: 190, variant: 0 },',
    },
  },
  {
    decision: '0224',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ AND THE HOLE 0220 OPENED, NOW REACHABLE FROM THE OTHER SIDE. `LANDMARK_OF` and a level's
      `landmarks` have to name the same places; Saurian Belt is the first place to gain a drawing AND
      entries in one change, so it is the first where dropping the drawing leaves three empty sprites
      blitted at exactly the right positions for a whole level.
    */
    broke: 'the volcano drawing removed while its level still places three of them',
    guard: 'no level places a landmark in a place that draws none',
    edit: {
      path: 'src/render/bake.ts',
      find: '  saurian: (ctx, _ink, glow, space, size, seed) => drawVolcano(ctx, glow, space, size, seed),',
      replace: '  saurian: null,',
    },
  },
];
