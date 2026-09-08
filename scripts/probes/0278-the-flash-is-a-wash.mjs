// The flash is a wash, not a cutout — docs/decisions/0278-the-flash-is-a-wash.md
//
// Every guard 0278 adds, broken on purpose. `node scripts/prove-guard.mjs 0278`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0278',
    suite: 'tests/accents.test.ts',
    // 0035's cutout, back: an opaque wash is a white silhouette however it was arrived at.
    broke: 'the wash laid opaque, which is the white outline the report was about',
    guard: 'and a hurt twin is its base’s art under ONE translucent wash of the flash ink',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const FLASH_WASH = 0.55;',
      replace: 'const FLASH_WASH = 1;',
    },
  },
  {
    decision: '0278',
    suite: 'tests/accents.test.ts',
    // Twice over: a second wash is a darker flash nobody authored, and the count is the claim.
    broke: 'the wash laid twice, so a flash is two washes deep and no row says so',
    guard: 'and a hurt twin is its base’s art under ONE translucent wash of the flash ink',
    edit: {
      path: 'src/render/bake.ts',
      find: '    ctx.fillRect(0, 0, size, size);\n    ctx.globalAlpha = 1;',
      replace: '    ctx.fillRect(0, 0, size, size);\n    ctx.fillRect(0, 0, size, size);\n    ctx.globalAlpha = 1;',
    },
  },
  {
    decision: '0278',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ THE BASE NOT DRAWN UNDER IT. `source-atop` paints only where pixels already are, so a twin
      with nothing beneath it is an EMPTY bitmap — the boss vanishes on every hit. That is a worse
      failure than the one this decision fixes, and it is one deleted line away.
    */
    broke: 'the twin drawn without its base under it, so a hit erases the body instead of lighting it',
    guard: 'and a hurt twin is its base’s art under ONE translucent wash of the flash ink',
    edit: {
      path: 'src/render/bake.ts',
      find: '    drawKind(ctx, kind.slice(0, -3) as SpriteKind, palette, size, theme);\n',
      replace: '',
    },
  },
];
