// The breaks behind docs/decisions/0345-ember-nebula-is-in-colour.md.
//
// ⚠️ *"It needs to be a more vibrant beautiful backdrop"* is answered with hue, a ceiling a place may
// state, and dust that flows — and each of those has a way of quietly not happening.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0345',
    suite: 'tests/gases.test.ts',
    broke: 'no cloud ever given a gas, so five colours in the table are two on the screen',
    guard: 'THE REPORTED ONE: every gas the place states is on the screen',
    edit: {
      path: 'src/render/bake.ts',
      find: '      gas: gases > 0 && i % 3 === 2 ? Math.floor(i / 3) % gases : null,',
      replace: '      gas: null,',
    },
  },
  {
    decision: '0345',
    suite: 'tests/gases.test.ts',
    broke: 'one palette stating fewer gases than the other, so a cloud’s index points at nothing',
    guard: 'and both palettes state the same NUMBER of gases',
    edit: {
      path: 'src/content/themes.ts',
      find: "      'high-contrast': ['#3a1030', '#22124a', '#0e3034', '#4a1814'],",
      replace: "      'high-contrast': ['#3a1030', '#22124a'],",
    },
  },
  {
    decision: '0345',
    suite: 'tests/gases.test.ts',
    broke: 'every place handed gases whether it states any, which is one place’s colour in seven skies',
    guard: '0282 — a place that states no gases has the two colours it always had',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const gases = THEMES[theme].gases?.vivid.length ?? 0;',
      replace: '  const gases = THEMES[theme].gases?.vivid.length ?? 4;',
    },
  },
  {
    decision: '0345',
    suite: 'tests/gases.test.ts',
    broke: 'the dust drawn in a handful of straight pieces again, which is slabs and zigzags on a desktop',
    guard: 'THE ONE THE 1080p PHOTOGRAPH FOUND: Ember Nebula’s dust has no corner in it',
    edit: {
      path: 'src/render/bake.ts',
      find: '    const SAMPLES = 128;',
      replace: '    const SAMPLES = 5;',
    },
  },
  {
    decision: '0345',
    suite: 'tests/sky.test.ts',
    /*
      ⚠️ THE HOLE A THIRD COLOUR OPENS, WHICH IS 0223's OWN ONE LEVEL ON. The floor blends the backdrop
      against the LOUDEST colour a place states; a gas it had never heard of could be as bright as it
      liked. The break is a gas nobody would mistake for dark.
    */
    broke: 'a gas far brighter than the ember, which the contrast floor must count or it counts nothing',
    guard: 'every ink clears the floor against the backdrop WITH EVERYTHING THE SKY DRAWS ON IT',
    edit: {
      path: 'src/content/themes.ts',
      find: "      vivid: ['#b0246e', '#5a2ab0', '#1f7a80', '#c8403a'],",
      replace: "      vivid: ['#b0246e', '#5a2ab0', '#1f7a80', '#fff2d8'],",
    },
  },
  {
    decision: '0345',
    suite: 'tests/budget.test.ts',
    // A place may state its own cloud ceiling; what it may not do is state one past the shared bound.
    broke: 'Ember Nebula’s cloud ceiling stated above the faintest field of stars',
    guard: '0112 — and the one thing bigger than a bullet has no edge, is faint, and is furthest away',
    edit: {
      path: 'src/render/bake.ts',
      find: '    cloudCeiling: 0.31,',
      replace: '    cloudCeiling: 0.6,',
    },
  },
];
