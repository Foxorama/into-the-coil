// The break behind docs/decisions/0209-the-rig-hears-in-stereo.md.
//
// ⚠️ THE DEFECT THIS PUTS BACK IS THE ONE THAT SHIPPED, AND IT SHIPPED UNDER A GREEN GUARD. The pan
// law is held to equal power across the whole sweep and LAYER_PAN is held not to lean — and four of
// the five modes in hear.mjs summed the layers to one number anyway. Every assertion about the width
// was true and every file a person could listen to was mono, --play included.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0209',
    suite: 'tests/music.test.ts',
    // Dropping the channel count reads as tidying a redundant argument — `wavOf` defaults to 1, so
    // the call still works, still writes a file, and the file still plays. It is only wrong in the
    // one respect nothing but an ear or this guard can see.
    broke: 'the --play render written mono again, folding the music and the cues to the same point',
    guard: 'every rig render that carries the music is written in stereo',
    edit: {
      path: 'scripts/hear.mjs',
      find: '    writeFileSync(`${base}-play-${level}-${tier}.wav`, wavOf(mix, SAMPLE_RATE, 2));',
      replace: '    writeFileSync(`${base}-play-${level}-${tier}.wav`, wavOf(mix, SAMPLE_RATE));',
    },
  },
];
