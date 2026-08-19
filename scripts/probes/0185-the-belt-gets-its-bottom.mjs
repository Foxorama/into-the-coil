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
  {
    decision: '0185',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE PAD BACK IN THE BOTTOM. `chords` returns to the `low` window as the loudest layer in the
      place, and the layers it was sitting on go back under — which is the measurement 0181 took and
      the reason a new drum moved the place by 0.004.
    */
    broke: 'the pad back in the bottom, where it was standing on the kick and the sub',
    guard: '0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT',
    edit: {
      path: 'src/content/saurian.ts',
      find:
        "      octave: 1,\n" +
        "      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.16, attack: 0.12, curve: 1.2, lowFrom: 620, lowTo: 380, q: 0.9, highFrom: 200 },",
      replace:
        "      octave: 0,\n" +
        "      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.34, attack: 0.12, curve: 1.2, lowFrom: 520, lowTo: 300, q: 0.9 },",
    },
  },
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
      find:
        "      approach: { toll: 1.6, dread: 1.5, drive: 1.55 },\n" +
        '      boss: { dread: 1.7 },\n' +
        '      bossPeak: { dread: 2.4, drone: 1.25 },',
      replace: '',
    },
  },
];
