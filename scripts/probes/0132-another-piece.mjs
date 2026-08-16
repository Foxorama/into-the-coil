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
    /*
      ⚠️ THE BREAK MOVED IN 0136 AND THE REASON IS WORTH KEEPING. It used to restore the cathedral bell
      that this decision was written about — the real shipped defect — and that stopped tripping the
      rule twice over: 0136 gave the bell brighter partials, and `addRoom` puts broadband tail on every
      layer, which dilutes the low FRACTION the guard measures. So the guard is less sensitive than it
      was, and a break has to be correspondingly blunter to reach it.
      Both arp voices become sub sines: a hard-panned layer that is nothing but bottom.
    */
    edit: {
      path: 'src/content/nebula.ts',
      /*
        ⚠️ THE ANCHOR MOVED AGAIN, and this time the code was right to move. The material pass of
        2026-08-16 found this arp ringing 22 ms of a 100 ms sixteenth — 0152's defect — and lengthened
        both voices (`seconds` 0.24/0.22 -> 0.34/0.32, `curve` 2.4/2.8 -> 1.2/1.3) with a little gain
        behind them. `npm test` refused to run rather than report green over a probe that no longer
        applies, which is 0019 doing its whole job for the third time this session.

        ⚠️ IT ANCHORS ON ONE VOICE NOW, not on both. The old `find` spanned the whole pair — twenty
        numbers, every one of them a thing a tuning pass is entitled to move — so it was guaranteed to
        strand on the first person who touched the arp. The break is about REGISTER, and one rank
        driven to a loud bottom-octave sine reaches the band rule on its own.
      */
      find:
        "      octave: 2,\n      accents: [1, 0.7, 0.84, 0.68],\n      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.34, gain: 0.072, attack: 0.004, curve: 1.2, lowFrom: 3400, lowTo: 2400, q: 1.2 },",
      replace:
        "      octave: 0,\n      accents: [1, 0.7, 0.84, 0.68],\n      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.34, gain: 0.5, attack: 0.004, curve: 1.2 },",
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
