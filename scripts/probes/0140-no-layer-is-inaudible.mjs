// The breaks behind docs/decisions/0140-no-layer-is-inaudible.md.
//
// ⚠️ THE FIRST ONE IS THE REPORTED DEFECT, PUT BACK. Ember Nebula's ride at 0.05 is what the player
// was listening to when they said "hook I can barely hear and drive is quite loud and clear by
// comparison" — 38.1 dB under the loudest layer of its own place, ten decibels below anything else
// in the game. Every guard in the repository was green over it, because until this decision nothing
// multiplied a gain by the material underneath it.
//
// ⚠️ THE SECOND ONE IS THE GUARD'S OWN LOAD-BEARING CLAUSE, and it is the more interesting probe.
// A floor that condemned a layer on RMS alone looks strictly stricter and is simply wrong: `crash`
// strikes four times in twelve seconds, so it reads 38 dB down on RMS while being the most
// conspicuous sound in the approach. The `&&` is what separates "quiet because it is sparse" from
// "quiet because it cannot be heard", and CLAUDE.md's no-counting-guard warning is about exactly the
// version that flags the healthy one.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0140',
    suite: 'tests/themes.test.ts',
    broke: 'Ember Nebula’s ride back to the level the report was written about',
    guard: '0140 — NO LAYER A RUNG OPENS IS INAUDIBLE UNDER THE REST OF ITS OWN PLACE',
    edit: {
      path: 'src/content/nebula.ts',
      /*
        ⚠️ **THE ANCHOR MOVED WITH THE VOICE, AND `npm run prove` IS WHY THIS WAS NOT SILENT** —
        `docs/decisions/0152-a-layer-is-heard-in-the-sum.md` lengthened this note from 0.025 s at
        curve 9 to 0.07 at curve 4, and the harness refused to run at all rather than reporting green
        over a probe that no longer applies. That is 0019 doing its whole job.

        ⚠️ **AND THE REPLACEMENT HAD TO MOVE TOO, WHICH IS THE PART A FIND-AND-REPLACE WOULD MISS.**
        The energy of a note goes as `gain² × seconds / curve`, so the same envelope change that fixed
        the defect made this voice about **6× louder at any gain** — 0.02 was inaudible under the old
        2.8 ms envelope and is comfortably audible under the new 17 ms one. **A probe whose anchor
        still matches but whose break no longer breaks is the failure 0019 cannot see**, and the only
        thing that catches it is running the suite and watching the colour.
      */
      find: "seconds: 0.07, gain: 0.1, attack: 0.0004",
      replace: "seconds: 0.07, gain: 0.006, attack: 0.0004",
    },
  },
  {
    decision: '0140',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE FLOOR APPLIED TO ONE MEASURE, WHICH IS THE STRICTER-LOOKING MISTAKE. It condemns `crash`
      and `arp` in places where both are working, so the guard would arrive already red and the first
      thing anybody did with it would be to widen the number until it went quiet — which is how a
      threshold stops meaning anything.
    */
    broke: 'the floor condemning a layer on RMS alone, so a sparse cymbal reads as inaudible',
    guard: '0140 — NO LAYER A RUNG OPENS IS INAUDIBLE UNDER THE REST OF ITS OWN PLACE',
    edit: {
      path: 'tests/themes.test.ts',
      find: 'if (under.rms < AUDIBLE_FLOOR_DB && under.peak < AUDIBLE_FLOOR_DB) {',
      replace: 'if (under.rms < AUDIBLE_FLOOR_DB) {',
    },
  },
];
