// The light is loud — docs/decisions/0520-the-light-is-loud.md
//
// Every guard 0520 adds, broken on purpose. `node scripts/prove-guard.mjs 0520`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0520',
    suite: 'tests/bolt.test.ts',
    // The heart in the glow's own ink: a coloured line, not a white one.
    broke: 'the hot heart stroked in the glow',
    guard: 'THE HOT HEART, IN LUMINANCE',
    edit: {
      path: 'src/render/bolt-inks.ts',
      find: '  return { glow, hot: shade(glow, 0.5), core };',
      replace: '  return { glow, hot: shade(glow, 0), core };',
    },
  },
  {
    decision: '0520',
    suite: 'tests/bolt.test.ts',
    // Every sprite laid as paint, the lights included.
    broke: 'a light kind blitted as a body',
    guard: 'A LIGHT IS ADDED',
    edit: {
      path: 'src/render/canvas.ts',
      find: '    const light = this.atlas.light !== undefined && this.atlas.light[sprite] === true;',
      replace: '    const light = false;',
    },
  },
  {
    decision: '0520',
    suite: 'tests/bolt.test.ts',
    // The game's lights read at the port's indices.
    broke: 'the port carrying the game’s lights unshifted',
    guard: 'the port keeps the game’s lights at the game’s indices',
    edit: {
      path: 'src/render/port-bake.ts',
      find: '    light: [...port.bitmaps.map(() => false), ...(game.light ?? game.bitmaps.map(() => false))],',
      replace: '    light: game.light,',
    },
  },
];
