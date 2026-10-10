// The breaks behind docs/decisions/0541-the-looks-are-on-the-pad.md.
//
// Every look photographed on the pad (`scripts/shot-pad.mjs`) found two that never reached it: a flame
// chosen, and the saucer's paint and dome. Each put back as it was.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0541',
    suite: 'tests/pad.browser.test.ts',
    // The fit compared without its flame, as `sameFit` compares it.
    broke: 'a flame chosen compared away, so the pad burns the one it had',
    guard: 'burns the flame chosen, on the pad',
    edit: {
      path: 'src/app/mount.ts',
      // Re-anchored by 0584, which compares the shell after the flame.
      find: ' || portFit.fit.flame !== fit.flame || ',
      replace: ' || ',
    },
  },
  {
    decision: '0541',
    suite: 'tests/pad.browser.test.ts',
    // The side view's body in the factory's ink whatever was fitted.
    broke: 'the saucer on the pad in the factory’s paint whatever was fitted',
    guard: 'paints the saucer, and puts its look on its dome',
    edit: {
      path: 'src/render/port-bake.ts',
      find: '  const body = fit.livery ?? mix(palette.player, palette.acid, 0.55);',
      replace: '  const body = mix(palette.player, palette.acid, 0.55);',
    },
  },
  {
    decision: '0541',
    suite: 'tests/pad.browser.test.ts',
    // The dome plain glass whatever look was fitted.
    broke: 'the saucer’s dome plain glass whatever look was fitted',
    guard: 'paints the saucer, and puts its look on its dome',
    edit: {
      path: 'src/render/port-bake.ts',
      find: '  const glass = visor ? palette.hazard : palette.glass;',
      replace: '  const glass = palette.glass;',
    },
  },
];
