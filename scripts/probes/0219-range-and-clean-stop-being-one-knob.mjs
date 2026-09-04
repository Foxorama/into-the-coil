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
//
// ── TWO PROBES STOOD HERE AND 0226 RETIRED THEM ─────────────────────────────────────────────────
//
// ⚠️ "THE COMPRESSOR BYPASSED" AND "THE DETECTOR REMOVED" reddened the band guard, and the band guard
// is gone: docs/decisions/0226-the-level-holds-one-loudness.md holds every rung to its `run` by a
// solved table, and measured, the compressor moves that held band by 0.17 LU at most — under the
// guard's own slack, because the range is content now and the node only colours it. A probe whose
// break the tree cannot see is what 0005 says not to keep. What the node still does that a guard can
// read is lift the bus by its makeup gain, and that is the probe below.
/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0219',
    suite: 'tests/picture.browser.test.ts',
    /*
      ⚠️ THE THRESHOLD PUT WHERE IT INTUITIVELY BELONGS. −6 is the obvious choice — at the quiet end,
      so the quiet end is left alone — and it was the first thing tried. 0219 found it did nothing to
      the band; 0226 found the thing it DOES change: the node's makeup gain is a function of the
      threshold, so moving it makes `MUSIC_COMPRESSOR.makeup` a lie about the browser, and the game
      divides out the wrong number.
    */
    broke: 'the threshold raised to the quiet end, so the makeup gain the content records is no longer the node’s',
    guard: 'the browser’s compressor lifts what passes below its knee by exactly what the content says',
    edit: {
      path: 'src/content/music.ts',
      find: '  threshold: -18,',
      replace: '  threshold: -6,',
    },
  },
];
