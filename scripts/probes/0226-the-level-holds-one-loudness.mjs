// The breaks behind docs/decisions/0226-the-level-holds-one-loudness.md.
//
// ⚠️ SIX REPORTS ON THE SAME STRETCH OF THE APPROACH, AND FIVE ANSWERS WERE EACH CORRECT ABOUT A
// MODEL. The sixth said the premise — "the tempo should be increasing, but the volume should be
// consistent for each track for the level" — and the picture, rendered through the browser's own
// graph for the first time, said two things the model could not: the compressor 0219 added lifts the
// whole bus by 4.5 dB, and a level's loudness moves with its rung by about two LU.
/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0226',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ ONE RUNG OF ONE PLACE LET OFF ITS HOLD. The Approach's `push` back at the ladder's own level
      is exactly the shipped state the six reports were about, and the number it climbs by — about
      two LU, K-weighted, through the bus — is what the guard has to be able to see.
    */
    broke: 'The Approach’s push let off its hold, so the level climbs at 41 seconds again',
    guard: 'every rung of a place holds its run loudness',
    edit: {
      path: 'src/content/themes.ts',
      find: '  approach: { push: 0.6744, surge: 0.5683,',
      replace: '  approach: { push: 1, surge: 0.5683,',
    },
  },
  {
    decision: '0226',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE HOLD APPLIED TO NOTHING. `rungOf` multiplying the hold in is the one seam every caller
      reads through; a `rungOf` that forgot it would leave the table in the tree, every solver happy,
      and the game playing the climb — which is 0162's own warning about a mechanism no data reaches.
    */
    broke: 'rungOf ignores the hold, so the table exists and nothing plays it',
    guard: 'every rung of a place holds its run loudness',
    edit: {
      path: 'src/content/themes.ts',
      find: '  return rungIn(ladder, rung, layer) * holdOf(theme, rung);',
      replace: '  return rungIn(ladder, rung, layer);',
    },
  },
  {
    decision: '0226',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE FILTER DESIGN WITH ONE PARAMETER WRONG. The shelf's corner moved by a semitone still
      looks like a loudness curve and prints numbers with the right sign; what it is not is the
      standard, and the table check is what says so.
    */
    broke: 'the K-weighting shelf designed at the wrong corner frequency',
    guard: 'the K-weighting designed for a rate reproduces the standard’s table at 48 kHz',
    edit: {
      path: 'tests/loudness.ts',
      find: 'const SHELF = { hz: 1681.974450955533,',
      replace: 'const SHELF = { hz: 1781.974450955533,',
    },
  },
  {
    decision: '0226',
    suite: 'tests/picture.browser.test.ts',
    /*
      ⚠️ THE MAKEUP GAIN SAID TO BE NOTHING. This is the state the tree was in from 0219 until now: a
      compressor wired in with no idea that the node lifts what passes through it. The guard reads the
      lift off a real DynamicsCompressorNode, which is the only place it can be read.
    */
    broke: 'the compressor’s makeup gain recorded as zero, which is what every model assumed',
    guard: 'the browser’s compressor lifts what passes below its knee by exactly what the content says',
    edit: {
      path: 'src/content/music.ts',
      find: '  makeup: 4.5,',
      replace: '  makeup: 0,',
    },
  },
];
