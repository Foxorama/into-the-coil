// The break behind docs/decisions/0156-a-strike-is-an-increment.md.
//
// ⚠️ 0108 ALREADY HAS A PROBE OVER THIS GUARD AND IT IS NOT THIS ONE. That one throws the accent
// away entirely — `const accent = 1` — which is the failure 0108 was written to catch, and it is
// what CI found had stopped reddening anything once `hook` began to ring past its own sixteenth.
//
// ⚠️ THIS ONE IS THE CLASS THE OLD ASSERTION COULD NOT SEE AT ALL, ring or no ring. `weak / strong
// < 0.95` is a statement about DIRECTION: it passes for any accent under about 0.95, so a weight
// arriving at the wrong SIZE was invisible to it whatever the material did. 0156 asserts the
// measured weight against the table's own number, and that is what this proves is worth having.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0156',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE EDIT A LATER HAND ACTUALLY MAKES, AND FOR A GOOD REASON. A square root over a gain is
      the standard "perceptual" correction — loudness does not follow amplitude — and applying one
      here is a one-token change that leaves the gallop leaning, leaves every table-shaped assertion
      green, and leaves the layer at the same peak. It is wrong because `accents` is documented as
      how hard a note is STRUCK, which is the amplitude, and because the mix is solved against those
      numbers: a 0.76 that arrives at 0.87 is a quantity the arrangement is no longer holding.

      ⚠️ MEASURED, WHICH IS THE POINT: the shipped guard reads 0.777 against its 0.95 threshold and
      is GREEN over this. 0156's guard reads 0.894 and 0.944 against 0.76 and 0.82 in the table —
      errors of 0.134 and 0.124 against a tolerance of 0.1, and RED.
    */
    broke: 'the accent square-rooted on the way to the note, so a weight arrives at the wrong size',
    guard: 'and a PITCHED note has a weight too, which half the piece never had',
    edit: {
      path: 'src/app/music.ts',
      find: '    const accent = voice.accents === undefined ? 1 : voice.accents[step % voice.accents.length] ?? 1;',
      replace: '    const accent = voice.accents === undefined ? 1 : Math.sqrt(voice.accents[step % voice.accents.length] ?? 1);',
    },
  },
];
