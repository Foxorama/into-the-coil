// The breaks behind docs/decisions/0185-the-belt-gets-its-bottom.md.
//
// ⚠️ THE FIRST IS THE SHIPPED DEFECT, RESTORED — the pad standing in the bottom, which is the state
// docs/decisions/0181-the-floor-has-a-bottom.md measured and could not fix. A triangle at octave 0
// with no highpass, 7.6 dB over `sub` in `sub`'s own window; the whole of this decision is that it
// moved out and the drums took the room.
//
// ⚠️ THE SECOND IS THE HALF A LISTENER WOULD CALL THE BRIEF. Saurian Belt is *a cross between ancient
// jurassic and eurobeat techno trance*, and five of its six known-adrift entries were the two halves
// of that sentence — `toll` and `dread` for the primeval material, `drive` for the floor. Putting the
// per-rung lifts back on the shared row buries them again.
//
// ⚠️ AND THE DRUMS DELIBERATELY HAVE NO BREAK OF THEIR OWN, WHICH 0019 ASKS TO BE WRITTEN DOWN. The
// kick, the stab and the floor tom are gains, and nothing asserts a gain: what they buy is the share
// under 300 Hz, which `tests/themes.test.ts` holds as a FLOOR the place already cleared. A break that
// shrank them would go green, correctly — 0181 recorded the same thing about the tom it added, and
// the honest version is to say so rather than to write a probe that proves the harness runs.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  /*
    ── THE PAD BREAK IS RETIRED, BECAUSE THE VOICE IT BROKE NO LONGER EXISTS ──────────────────────

    ⚠️ docs/decisions/0186-a-place-has-its-own-gesture.md replaced Saurian Belt's held pad with a
    gate, so *the pad back in the bottom* has nothing left to point at: there is no sustained
    sub-octave triangle in this place any more.

    ⚠️ THE CLAIM IS NOT LOST, IT MOVED ONE FILE OVER. 0186's second break removes the highpass from
    the one sustained voice that survives and reddens the same guard — which is the same sentence
    about the same defect, aimed at the code that can still commit it.
  */

  {
    decision: '0185',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE JURASSIC HALF BACK ON THE SHARED ROW. `toll` and `dread` are what *ancient* is made of in
      this place and `drive` is what *eurobeat* is; with the three rungs removed the shared ladder
      answers for all of them and the brief stops being audible. This is the lever 0162 exists for,
      driven by the guard 0164 exists for.
    */
    broke: "the place's own rungs above `surge` removed, so the brief's two halves go back under the kit",
    guard: '0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT',
    edit: {
      path: 'src/content/themes.ts',
      // ⚠️ RE-ANCHORED BY 0186, which raised `dread` at `bossPeak` and added `chords` to two rows.
      // The break is unchanged — the place's own rungs above `surge` taken away.
      find:
        "      approach: { chords: 1.7, toll: 1.6, dread: 1.5, drive: 1.55, ownA: 1.48, sub: 1.5, engine: 1.35 },\n" +
        "      boss: { dread: 1.7 },\n" +
        "      bossPeak: { dread: 2.9, drone: 1.25, sub: 1.499 },",
      replace: '',
    },
  },
];
