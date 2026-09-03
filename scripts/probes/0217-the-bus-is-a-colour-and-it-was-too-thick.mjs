// The break behind docs/decisions/0217-the-bus-is-a-colour-and-it-was-too-thick.md.
//
// ⚠️ THE DEFECT SHIPPED AS A NUMBER THAT HAD BEEN CHOSEN TWICE, EACH TIME CORRECTLY. MUSIC_DRIVE went
// 0.15 → 0.22 (0108, for the boss arriving proportionally) → 0.30 (0114, because the fight was "too
// subdued and quiet against the game sfx"). Both moves were measured and both were right about what
// they measured. Neither measured what the shaper COSTS, because nothing here could: the clip guard
// asks how much of the signal is flattened and the answer was 0.0089%, so it was green over a bus
// saturating hard enough that a listener called it distorted.
//
// ⚠️ SO THE GUARD IS NOT THAT THE BUS IS CLEAN — 0104 put the shaper there on purpose and a linear
// bus would be deleting a feature. It is that the bus stays at the colour that was chosen.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0217',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE VALUE AS IT SHIPPED, PUT BACK — and it is the value two earlier decisions each argued
      their way to. Nothing about the constant looks wrong; the table above it is a real measurement
      and the reasoning in both notes is sound. What neither could see is the quantity this adds.
    */
    broke: 'the bus driven back to 0.3, which is where the report came from',
    guard: 'no theme at any rung drives the bus past full scale',
    edit: {
      path: 'src/content/music.ts',
      find: 'export const MUSIC_DRIVE = 0.15;',
      replace: 'export const MUSIC_DRIVE = 0.3;',
    },
  },
  {
    decision: '0217',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ AND THE MEASURE ITSELF, WHICH IS THE HALF THAT COULD ROT SILENTLY. Fitting a gain and taking
      the residual is three dot products riding a loop that was already running; drop the fit and the
      residual becomes the whole signal, which passes any ceiling by miles and reports nothing. A
      measurement that always answers the same thing is the shape 0005 exists for.
    */
    broke: 'the distortion measured against nothing, so every bus reads clean whatever it does',
    guard: 'no theme at any rung drives the bus past full scale',
    edit: {
      path: 'tests/themes.test.ts',
      find: '        const fit = rung.cleanDotClean > 0 ? rung.dirtyDotClean / rung.cleanDotClean : 0;',
      replace: '        const fit = 0;',
    },
  },
];
