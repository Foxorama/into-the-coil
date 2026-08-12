// The breaks behind docs/decisions/0132-a-place-may-be-another-piece-entirely.md.
//
// ⚠️ THE FIRST ONE IS NOT AN INVENTED MISTAKE — IT IS THE ONE THIS DECISION ACTUALLY MADE. Ember
// Nebula's first cathedral bell put 49% of its energy under 130 Hz on a layer that sits at −0.5, and
// every guard in the repository was green, because the band rule bakes `MUSIC` and only `MUSIC`. The
// edit below restores that bell. If the new guard ever stops firing, the next six places can each
// pan a bass across the field and nothing will say so.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0132',
    suite: 'tests/themes.test.ts',
    broke: 'a place re-voicing a placed layer into the bottom octave, which the base-only band rule cannot see',
    guard: '0132 — A PLACE’S OWN MATERIAL IS HELD TO THE SAME BAND RULE AS THE BASE',
    edit: {
      path: 'src/content/nebula.ts',
      find: "      octave: 2,\n      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.9, gain: 0.34, attack: 0.008, curve: 1.25, lowFrom: 1700, lowTo: 900, q: 1.8 },",
      replace:
        "      octave: 1,\n      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.9, gain: 0.44, attack: 0.008, curve: 1.25, lowFrom: 1250, lowTo: 380, q: 1.8 },",
    },
  },
  {
    decision: '0132',
    suite: 'tests/themes.test.ts',
    broke: 'a choir voice held for longer than the prewarm can spend on one job',
    guard: 'and to the same LONGEST NOTE rule, which is the job the prewarm cannot split',
    edit: {
      path: 'src/content/nebula.ts',
      find: 'seconds: BEAT_SECONDS * 6, gain: 0.15, attack: 0.55, curve: 1.4, lowFrom: 760',
      replace: 'seconds: BEAT_SECONDS * 8, gain: 0.15, attack: 0.55, curve: 1.4, lowFrom: 760',
    },
  },
];
