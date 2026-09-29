// The break behind docs/decisions/0417-a-place-is-baked-by-its-name.md.
//
// The memo put back on the backdrop colour, which The Approach shares with the title — so level one
// is flown in the title's weather and tests/place.browser.test.ts counts the title's sky on it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0417',
    suite: 'tests/place.browser.test.ts',
    broke: 'the sky memoised on the backdrop colour, so level one keeps the title’s weather',
    guard: 'has the place’s glow on the canvas, a few seconds after the title',
    edit: {
      path: 'src/app/mount.ts',
      find: '    if (place === bakedPlace) return;',
      replace: '    if (want === (bakedPlace === null ? PALETTES[palette].space : THEMES[bakedPlace].space[palette])) return;',
    },
  },
];
