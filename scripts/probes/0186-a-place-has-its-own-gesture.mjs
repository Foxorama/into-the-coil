// The breaks behind docs/decisions/0186-a-place-has-its-own-gesture.md.
//
// ⚠️ THE GESTURE ITSELF HAS NO BREAK, AND 0019 ASKS THAT BE WRITTEN DOWN RATHER THAN COVERED. What
// changed is that Saurian Belt's chord is chopped instead of held, and
// docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md is explicit that musical shape must not
// be asserted on — a threshold that says *a chord may not be held this long* would flag a healthy
// place as readily as a sick one. `node scripts/weigh-gesture.mjs` prints the reading and states no
// verdict, so putting the pad back reddens nothing and that is correct.
//
// ⚠️ WHAT IS GUARDED IS WHAT THE CHANGE COST, WHICH IS THE GAIN. A pad holding 4.4 beats puts out far
// more energy than sixteenths at 44 ms, so the gate needed four times the multiplier to keep the same
// role. Leaving the old number behind is the plausible mistake — it is the one an author makes by
// changing the instrument and not the fader — and it puts the part the report is about back under
// everything.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0186',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE GATE LEFT AT THE PAD'S GAIN. `chords` reads 1.5 at `push` because the instrument under it
      changed; at 0.34 the layer is still gated, still dark, still fast — and 12.9 dB under the role
      the arrangement gave it, which is the exact state the report describes from the other side.
    */
    broke: "the gated chord left at the held pad's gain, so the part the report is about is inaudible",
    guard: '0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT',
    edit: {
      path: 'src/content/themes.ts',
      find: '      push: { chords: 1.5, ride: 0.8, groove: 1.05, perc: 0.86 },',
      replace: '      push: { chords: 0.34, ride: 0.8, groove: 1.05, perc: 0.86 },',
    },
  },
  {
    decision: '0186',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE GLUE'S HIGHPASS REMOVED, which walks the pad straight back into the bottom
      docs/decisions/0185-the-belt-gets-its-bottom.md cleared. It is one field, it is invisible in a
      diff of a table full of filters, and it undoes the previous decision without touching it.
    */
    broke: "the glue voice's highpass removed, so the pad walks back into the bottom 0185 cleared",
    guard: '0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT',
    edit: {
      path: 'src/content/saurian.ts',
      find: "      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.05, attack: 0.3, curve: 1.4, lowFrom: 2200, lowTo: 900, q: 1.2, highFrom: 190 },",
      replace: "      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.6, attack: 0.3, curve: 1.4, lowFrom: 520, lowTo: 300, q: 1.2 },",
    },
  },
];
