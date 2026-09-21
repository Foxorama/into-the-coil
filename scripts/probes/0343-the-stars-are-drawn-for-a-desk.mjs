// The breaks behind docs/decisions/0343-the-stars-are-drawn-for-a-desk.md.
//
// ⚠️ THE REPORT WAS IN PIXELS AND COLOURS, SO THE BREAKS ARE. *"Drawn out, big, chunky and just
// monocoloured on desktop."* Each break below puts back one half of that picture, or removes one of
// the two things that make a bright star affordable: that a palette whose decoration is the void
// never sees one, and that the light stays under what `skyCover` looks at.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0343',
    suite: 'tests/stars.test.ts',
    broke: 'the core cap lifted, so every star with a radius is a hard coin again',
    guard: 'THE REPORTED ONE, IN PIXELS: no star in The Approach has a hard edge wider than a point',
    edit: {
      path: 'src/render/bake.ts',
      find: 'export const STAR_CORE_UNITS = 0.11;',
      replace: 'export const STAR_CORE_UNITS = 0.6;',
    },
  },
  {
    decision: '0343',
    suite: 'tests/stars.test.ts',
    broke: 'the painter ignoring a star’s own colour, so the field is one ink again',
    guard: 'THE OTHER HALF OF THE REPORT: The Approach’s stars come in colours',
    edit: {
      path: 'src/render/bake.ts',
      find: '    const colour = plain || star.tint === null ? ink : star.tint;',
      replace: '    const colour = ink;',
    },
  },
  {
    decision: '0343',
    suite: 'tests/stars.test.ts',
    broke: 'the high-contrast palette handed the tinted field, which is a cosmetic overriding a setting',
    guard: '0024 — and on a palette whose decoration is the void, every star is the sky ink and nothing glows',
    edit: {
      path: 'src/render/bake.ts',
      find: '      drawSky(ctx, kind, size, theme, palette.glass === palette.space && palette.trim === palette.space);',
      replace: '      drawSky(ctx, kind, size, theme, false);',
    },
  },
  {
    decision: '0343',
    suite: 'tests/stars.test.ts',
    /*
      ⚠️ A BUDGET ONLY FIRES WHEN IT IS BREACHED — 0222's own probe file says so — so the break is the
      breach: the change an author reaches for on a place whose brief is *more stars*, taken far enough
      that the contrast guards are no longer measuring the sky that is drawn.
    */
    broke: 'The Approach’s stars made fat and bright until they are light `skyCover` cannot see',
    guard: 'THE BUDGET: the light a place’s stars put in the sky stays under what `skyCover` can see',
    edit: {
      path: 'src/render/bake.ts',
      // Anchored on The Approach's own count since 0345, when a second place authored a `lean: 5`.
      find: '      far: 9,\n      near: 1.6,\n      lean: 5,\n      floor: 0.07,',
      replace: '      far: 9,\n      near: 1.6,\n      lean: 0.4,\n      floor: 0.9,',
    },
  },
  {
    decision: '0343',
    suite: 'tests/stars.test.ts',
    broke: 'the shared six-hundredths margin back on a dense field, so a bare stripe arrives at every join',
    guard: 'THE ONE A DENSE FIELD MAKES VISIBLE: no bare stripe crosses the screen where the tile joins',
    edit: {
      path: 'src/render/bake.ts',
      find: "  const dotsOnly = kind !== 'skyRush' && style.stars !== undefined;",
      replace: '  const dotsOnly = false;',
    },
  },
  {
    decision: '0343',
    suite: 'tests/stars.test.ts',
    broke: 'the default dropped, so a place that states no stars is tinted anyway',
    guard: '0282 — a place that authors no stars draws the shared field, untinted',
    edit: {
      path: 'src/render/bake.ts',
      find: "        tint: null,\n        halo: 0,\n      });\n      continue;",
      replace: "        tint: '#ffffff',\n        halo: 0,\n      });\n      continue;",
    },
  },
];
