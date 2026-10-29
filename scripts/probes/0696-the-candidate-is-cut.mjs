// The break behind docs/decisions/0696-the-candidate-is-cut.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0696',
    suite: 'tests/brand.test.ts',
    // The unfurl card spelling the name its own way — the surface a rename would miss, since HTML cannot import.
    broke: 'an og:title that spells the name differently from brand.ts',
    guard: "index.html's unfurl titles agree with brand.ts",
    edit: {
      path: 'index.html',
      find: '    <meta property="og:title" content="Into the Coil" />\n',
      replace: '    <meta property="og:title" content="Into The Coil" />\n',
    },
  },
  {
    decision: '0696',
    suite: 'tests/brand.test.ts',
    // The card with no picture: a relative image is one a scraper on another host cannot fetch.
    broke: 'an og:image that is a relative path',
    guard: "index.html's unfurl titles agree with brand.ts",
    edit: {
      path: 'index.html',
      find: '    <meta property="og:image" content="https://intothecoil.vulpecula.games/icon-512.png" />\n',
      replace: '    <meta property="og:image" content="icon-512.png" />\n',
    },
  },
];
