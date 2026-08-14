// The breaks behind docs/decisions/0148-a-place-has-its-own-notes.md.
//
// ⚠️ THE FIRST ONE IS THE HALF OF THE OLD GUARD THAT WAS ALWAYS RIGHT, AND IT IS THE ONE THAT MAKES
// 0148 SAFE AT ALL. A place may now state a mode; it may not state a key. The cues are baked once, in
// A (0099), so a place whose scale does not contain its own root puts the player's gun a semitone
// from the level for three minutes. Nothing enforced this before, because nothing needed to — every
// place was hard-coded to the one scale that trivially contained it.
//
// ⚠️ THE SECOND IS THE DEFECT 0148 IS NAMED FOR, AS FAR AS IT CAN BE STATED WHILE FIVE PLACES STILL
// SHARE A MODE. Two places that choose the same notes are differentiated by rhythm, balance and
// timbre alone — which is the combination the report calls interchangeable. It goes red on a twin and
// stays quiet on a place that has not chosen yet, and `tests/themes.test.ts` says why that compromise
// rather than the stronger version: the stronger one is a bound the shipped design fails, which 0044
// says is not a bound.
//
// ⚠️ THE THIRD IS THE ONE THAT WOULD HAVE CAUGHT THE ORIGINAL DEFECT, and it is the reason the old
// guard is loosened rather than deleted. A place still means its notes: `scaleOf` is what a voice is
// checked against, and a hand that sharpens a note without declaring it is still writing a typo.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0148',
    /*
      ⚠️ D# FOR THE ROOT IS THE TRITONE, which is the worst case rather than an arbitrary one: it is
      the furthest a stated scale can put its tonic from the key the cues are in, and it is a note
      Saurian Belt's own `dread` already sounds — so the break is a plausible slip rather than an
      absurdity nobody would type.
    */
    suite: 'tests/themes.test.ts',
    broke: 'Saurian Belt stating a mode that does not contain the root the cues are baked in',
    guard: '0148 — A PLACE IS ROOTED ON A, whatever mode it states over it',
    edit: {
      path: 'src/content/themes.ts',
      find: 'scale: [0, 2, 3, 5, 7, 8, 10, 11],',
      replace: 'scale: [6, 2, 3, 5, 7, 8, 10, 11],',
    },
  },
  {
    decision: '0148',
    suite: 'tests/themes.test.ts',
    broke: 'a second place choosing the notes Saurian Belt already chose',
    guard: '0148 — NO TWO PLACES THAT CHOSE THEIR NOTES CHOSE THE SAME ONES',
    edit: {
      path: 'src/content/themes.ts',
      find: '    voices: NEBULA_VOICES,',
      replace: '    voices: NEBULA_VOICES,\n    scale: [0, 2, 3, 5, 7, 8, 10, 11],',
    },
  },
  {
    decision: '0148',
    /*
      ⚠️ THE NOTE PUT BACK IS THE ONE THE WHOLE DECISION IS ABOUT, SOUNDED WITHOUT BEING DECLARED.
      `THIRD`'s G# is what makes bars 8, 12 and 16 E major; taking the declaration away and leaving
      the note is exactly the state the old guard existed to refuse, and 0148 must not have bought
      its mode by giving that up.
    */
    suite: 'tests/themes.test.ts',
    broke: 'the G# sounding in the progression while the place still declares the natural minor',
    guard: '0148 — A RE-VOICED TUNE STAYS IN THE NOTES ITS OWN PLACE STATES',
    edit: {
      path: 'src/content/themes.ts',
      find: 'scale: [0, 2, 3, 5, 7, 8, 10, 11],',
      replace: 'scale: [0, 2, 3, 5, 7, 8, 10],',
    },
  },
];
