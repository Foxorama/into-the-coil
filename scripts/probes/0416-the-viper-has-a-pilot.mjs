// The breaks behind docs/decisions/0416-the-viper-has-a-pilot.md.
//
// One per claim in tests/intro.test.ts's 0416 block (Venoma's two went with her run in 0444): a surge
// that is not there on the step its launch is heard, a surge that never settles, no sky outside, and a
// sky that goes past at a rate of its own rather than the level's.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  /*
    The two breaks on Venoma's run — nobody running for the Viper, and the Viper drawn over her — went
    with the run and the two guards they broke: docs/decisions/0444-the-intro-is-the-pilots.md.
  */
  {
    decision: '0416',
    suite: 'tests/intro.test.ts',
    broke: 'the Viper’s surge left out on the pad',
    guard: 'surges the jets on the step each launch is heard',
    edit: {
      path: 'src/render/port.ts',
      find: '  if (surge > 0) put(surface, view, PORT_SPRITE.viperSurge, along, across, surge);\n',
      replace: '',
    },
  },
  {
    decision: '0416',
    suite: 'tests/intro.test.ts',
    broke: 'a surge a tenth of a second after the launch it belongs to is heard',
    guard: 'surges the jets on the step each launch is heard',
    edit: {
      path: 'src/render/port.ts',
      find: '  if (t < go || t >= go + SURGE_STEPS) return 0;',
      replace: '  if (t < go + 6 || t >= go + SURGE_STEPS) return 0;',
    },
  },
  {
    decision: '0416',
    suite: 'tests/intro.test.ts',
    broke: 'a surge that never dies back into the burn',
    guard: 'surges the jets on the step each launch is heard',
    edit: {
      path: 'src/render/port.ts',
      // Held at a fifth rather than let run out: past its end the curve is NaN, which draws nothing,
      // and a break that draws nothing is the break this guard already passes over.
      find: '  if (t < go || t >= go + SURGE_STEPS) return 0;\n  return Math.pow(1 - (t - go) / SURGE_STEPS, SURGE_CURVE);',
      replace: '  if (t < go) return 0;\n  return Math.max(0.2, Math.pow(Math.max(0, 1 - (t - go) / SURGE_STEPS), SURGE_CURVE));',
    },
  },
  {
    decision: '0416',
    suite: 'tests/intro.test.ts',
    broke: 'no sky past the ships outside',
    guard: 'flies the level’s own sky past the ships',
    edit: {
      path: 'src/render/port.ts',
      find: '  paintSky(surface, view, fallen(s, SKY_SPEED), sky, 0, 0, GAME_BASE);',
      replace: '',
    },
  },
  {
    decision: '0416',
    suite: 'tests/intro.test.ts',
    broke: 'the sky outside going past at 0411’s rate rather than the level’s',
    guard: 'flies the level’s own sky past the ships',
    edit: {
      path: 'src/render/port.ts',
      find: '  paintSky(surface, view, fallen(s, SKY_SPEED), sky, 0, 0, GAME_BASE);',
      replace: '  paintSky(surface, view, fallen(s, SKY_SPEED * 2.3), sky, 0, 0, GAME_BASE);',
    },
  },
];
