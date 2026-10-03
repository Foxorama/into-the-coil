// The light is additive — docs/decisions/0470-the-light-is-additive.md
//
// Every guard 0470 adds, broken on purpose. `node scripts/prove-guard.mjs 0470`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0470',
    suite: 'tests/bolt.test.ts',
    // The context left adding: every blit after a bolt is added to the frame.
    broke: 'the compositing mode not put back after a bolt',
    guard: 'THE LIGHT IS ADDITIVE, AND THE CONTEXT IS PUT BACK',
    edit: {
      path: 'src/render/canvas.ts',
      find: "    ctx.globalCompositeOperation = 'source-over';\n    ctx.globalAlpha = 1;\n  }\n}",
      replace: '    ctx.globalAlpha = 1;\n  }\n}',
    },
  },
  {
    decision: '0470',
    suite: 'tests/bolt.test.ts',
    // An added black is nothing: the rim that gives the glow its edge, drawn so it does not exist.
    broke: 'the flash’s rim added rather than laid',
    guard: 'THE LIGHT IS ADDITIVE, AND THE CONTEXT IS PUT BACK',
    edit: {
      path: 'src/render/canvas.ts',
      find: "  { width: 6, alpha: 0.5, ink: 'dark', additive: false },",
      replace: "  { width: 6, alpha: 0.5, ink: 'dark', additive: true },",
    },
  },
  {
    decision: '0470',
    suite: 'tests/bolt.test.ts',
    // The inner glow no louder than the body: a band with a line down it, which was the report.
    broke: 'the beam’s inner glow flattened to the body’s alpha',
    guard: 'THE ASK, LAYERS',
    edit: {
      path: 'src/render/canvas.ts',
      find: "  { width: 2.4, alpha: 0.4, ink: 'glow', additive: true },",
      replace: "  { width: 2.4, alpha: 0.28, ink: 'glow', additive: true },",
    },
  },
  {
    decision: '0470',
    suite: 'tests/bolt.test.ts',
    // The fade as it was: a straight line over eight steps, a wire dimming.
    broke: 'the flash’s fade put back to a straight line',
    guard: 'THE ASK, FLASHIER',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const fade = Math.pow(e.lifeFor / BOLT_STEPS, BOLT_FADE_POWER);',
      replace: '    const fade = e.lifeFor / BOLT_STEPS;',
    },
  },
  {
    decision: '0470',
    suite: 'tests/bolt.test.ts',
    // The core at one width from landing to death.
    broke: 'the core as wide dying as struck',
    guard: 'THE ASK, FLASHIER',
    edit: {
      path: 'src/render/scene.ts',
      find: 'const BOLT_CORE_DYING = 0.6;',
      replace: 'const BOLT_CORE_DYING = 1.2;',
    },
  },
  {
    decision: '0470',
    suite: 'tests/bolt.test.ts',
    // The per-leg cap gone: a short link at thirteen vertices is a scribble.
    broke: 'the jag’s per-leg ceiling removed',
    guard: 'a short link is a bolt and not a knot',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const amp = warning || beam ? 0 : jagAmp > legCap ? legCap : jagAmp;',
      replace: '    const amp = warning || beam ? 0 : jagAmp;\n    void legCap;',
    },
  },
  {
    decision: '0470',
    suite: 'tests/bolt.test.ts',
    // No bloom: the beam lights at the width it holds.
    broke: 'the ignition bloom set to nothing',
    guard: 'and a beam blooms as it ignites',
    edit: {
      path: 'src/render/scene.ts',
      find: 'const BEAM_IGNITE = 1.25;',
      replace: 'const BEAM_IGNITE = 1;',
    },
  },
  {
    decision: '0470',
    suite: 'tests/bolt.browser.test.ts',
    // The inner glows gone: the column is a body and a core, with no fall-off between.
    broke: 'the beam’s inner and hot glows put out',
    guard: 'IN PIXELS: a beam over the Black Heart',
    edit: {
      path: 'src/render/canvas.ts',
      find: "  { width: 2.4, alpha: 0.4, ink: 'glow', additive: true },\n  { width: 1.4, alpha: 0.6, ink: 'glow', additive: true },",
      replace: "  { width: 2.4, alpha: 0, ink: 'glow', additive: true },\n  { width: 1.4, alpha: 0, ink: 'glow', additive: true },",
    },
  },
  {
    decision: '0470',
    suite: 'tests/bolt.browser.test.ts',
    // The body laid as paint again — the yellow 0459 chose, tinting the vessel it crosses.
    broke: 'the beam’s body laid source-over',
    guard: 'IN PIXELS: added beats laid',
    edit: {
      path: 'src/render/canvas.ts',
      find: "  { width: 4, alpha: 0.28, ink: 'glow', additive: true },",
      replace: "  { width: 4, alpha: 0.28, ink: 'glow', additive: false },",
    },
  },
  {
    decision: '0470',
    suite: 'tests/bolt.browser.test.ts',
    // The flash's glow nearly out: a core with no light round it, invisible against the sky.
    broke: 'the flash’s glow dimmed to nothing',
    guard: 'IN PIXELS: the arc over The Approach',
    edit: {
      path: 'src/render/canvas.ts',
      find: "  { width: 6, alpha: 0.5, ink: 'dark', additive: false },\n  { width: 4, alpha: 0.55, ink: 'glow', additive: true },",
      replace: "  { width: 6, alpha: 0.5, ink: 'dark', additive: false },\n  { width: 4, alpha: 0.05, ink: 'glow', additive: true },",
    },
  },
];
