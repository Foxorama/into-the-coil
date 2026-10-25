// The breaks behind docs/decisions/0679-the-intros-staging.md.
//
// ⚠️ Two of the five undone: the intro under the strip's bar again, and her pad the pilot's cyan.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0679',
    suite: 'tests/staging.browser.test.ts',
    broke: 'the intro drawn under the strip’s bar again, its band left the void',
    guard: 'draws the room up into the strip’s band',
    edit: {
      path: 'src/render/port.ts',
      find: "  out.barAcross = 0;\n  if (base.alongAxis !== 'x' || base.scale <= 0) {\n    out.scale = base.scale;\n    out.gutterAlong = base.gutterAlong;\n    out.gutterAcross = base.gutterAcross;\n    out.barAcross = base.barAcross;",
      replace: "  out.barAcross = base.barAcross;\n  if (base.alongAxis !== 'x' || base.scale <= 0) {\n    out.scale = base.scale;\n    out.gutterAlong = base.gutterAlong;\n    out.gutterAcross = base.gutterAcross;\n    out.barAcross = base.barAcross;",
    },
  },
  {
    decision: '0679',
    suite: 'tests/staging.browser.test.ts',
    broke: 'her pad lit in the pilot’s cyan, as both were',
    guard: 'lights her pad violet and the pilot’s cyan',
    edit: { path: 'src/render/port-bake.ts', find: '      paintPad(ctx, VIPER.flame, VIPER.pad);', replace: '      paintPad(ctx, palette.player, PORT_INK.pad);' },
  },
];
