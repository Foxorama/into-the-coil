// The breaks behind docs/decisions/0219-range-and-clean-stop-being-one-knob.md.
//
// ⚠️ FOUR REPORTS ON THE SAME SIX SECONDS, AND THE FIRST THREE ANSWERS WERE ALL ABOUT SHAPE. 0215
// made the rise gentler, 0218 made it evener, and neither made anything quieter — because the report
// was "the volume is decent for the intro section and then requires a volume control down for later
// sections", which is a claim about a BAND that one speaker setting has to cover.
//
// ⚠️ AND RANGE AND CLEANLINESS WERE THE SAME KNOB UNTIL NOW. `saturate` narrows a range by squashing,
// so every decibel of range it took out arrived as distortion; 0217 halved it for cleanliness and
// widened every contrast in the game as a side effect nobody had measured. A compressor separates the
// two, which is what 0104 declined and what tests/compress.ts answers.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0219',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE BUS AS IT WAS, WITH NO COMPRESSOR ON IT. Nothing about the graph looks wrong without one —
      it is the arrangement 0104 chose deliberately and defended in writing. What it cannot do is hold
      a band, and the band is what a player sets their speaker to.
    */
    broke: 'the compressor bypassed, so the band is back to what one speaker setting cannot cover',
    guard: 'no boundary inside a level is bigger than the one that opens it',
    edit: {
      path: 'tests/clean.ts',
      find: '  compressBuffer(mixed, rate, comp);',
      replace: '',
    },
  },
  {
    decision: '0219',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE THRESHOLD PUT WHERE IT INTUITIVELY BELONGS, WHICH IS WHERE IT DOES NOTHING. −6 is the
      obvious choice — at the quiet end, so the quiet end is left alone — and it was the first thing
      tried. A compressor only narrows a range where BOTH ends are above it, so at −6 every rung passed
      through equally and the band read 3.8 dB before and 3.8 dB after. **A change that measures as no
      change is the one a probe has to be able to see.**
    */
    broke: 'the threshold raised to the quiet end, where a ratio has nothing to work on',
    guard: 'no boundary inside a level is bigger than the one that opens it',
    edit: {
      path: 'src/content/music.ts',
      find: '  threshold: -18,',
      replace: '  threshold: -6,',
    },
  },
  {
    decision: '0219',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE ENVELOPE DROPPED, LEAVING THE STATIC CURVE — WHICH IS A WAVESHAPER. This was the first
      draft of the model and it is the subtle one: applying the curve per sample looks like a
      compressor, reads like a compressor, and changes the band by nothing, because at a −18 threshold
      most individual samples are below it and the reduction lives entirely in the DETECTOR. 0104's
      "a function of the signal's history" is exactly this, and the answer is a walk that carries a
      number rather than a weaker claim.
    */
    broke: 'the detector removed, so the compressor is a waveshaper with extra parameters',
    guard: 'no boundary inside a level is bigger than the one that opens it',
    edit: {
      path: 'tests/compress.ts',
      find: '    const coefficient = level > envelope ? rise : fall;\n    envelope = level + (envelope - level) * coefficient;',
      replace: '    envelope = level;',
    },
  },
];
