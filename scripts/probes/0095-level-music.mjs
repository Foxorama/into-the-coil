// The breaks behind docs/decisions/0095-the-level-has-its-own-music.md.
//
// ⚠️ THE ONE THAT IS NOT HERE is "the music is not any good". Nothing in a suite can hear a chord
// progression, and the whole of what this decision adds is content — a kick pattern, four chords and
// a tune. `node scripts/hear.mjs --music` writes all of it to a .wav and the verdict is a hand, per
// docs/decisions/0027-measure-the-picture-not-the-model.md. What IS guarded is every way the content
// can be structurally wrong while sounding like it is there at all.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0095',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ A LAYER LENGTH THAT IS NOT A MULTIPLE OF THE SHORTEST — three bars against two. This is the
      amendment's failure mode wearing the amendment's clothes, and it is the reading a careful person
      arrives at: three and two DO realign, every six bars, so *the layers cannot drift apart* is still
      literally true. What is not true is that anything restarts at six bars. A re-phase lands on the
      phrase (`PHRASE_SECONDS`, the longest layer), so a three-bar layer would be cut a third of the
      way through its pattern every time a correction fired.

      0090's rule was *identical*; 0095's is *divides*; the space between them is exactly this.
    */
    broke: 'a layer length that shares no phrase with the others, so a correction cuts it mid-pattern',
    guard: '0095 — THE AMENDMENT: every layer is a whole MULTIPLE of the shortest, which is the same guarantee',
    edit: {
      path: 'src/content/music.ts',
      find: '  chords: 16,',
      replace: '  chords: 3,',
    },
  },
  {
    decision: '0095',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE PHRASE MEASURED FROM THE SHORTEST LAYER RATHER THAN THE LONGEST. It reads as the obvious
      thing — a loop is a loop, take the base one — and it is how the code was written before the
      lengths differed. Under it a re-phase would land on a 2-bar boundary, which is the middle of the
      4-bar progression: 0090's seam, arriving at runtime, in the one layer that carries the harmony.
    */
    broke: 'the phrase taken from the shortest layer, so a correction lands halfway through the chords',
    guard: '0095 — THE AMENDMENT: every layer is a whole MULTIPLE of the shortest, which is the same guarantee',
    edit: {
      path: 'src/content/music.ts',
      find: 'export const PHRASE_BARS = Math.max(...Object.values(LAYER_BARS));',
      replace: 'export const PHRASE_BARS = Math.min(...Object.values(LAYER_BARS));',
    },
  },
  {
    decision: '0095',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ A LEVEL LAYER CLOSED ON ENTERING A LEVEL, dressed as one of the title's. This is what the
      named `TITLE_ONLY` list is defending: without it the rule *some layers may close at `run`* is a
      hole big enough to drive the whole ladder through, and a level that quietly dropped its own
      engine would read as an additive ladder to every other guard in the file.
    */
    broke: 'a level layer listed as the title’s, so the rule that permits one closure permits any',
    guard: 'opens a layer at every step and never opens one twice',
    edit: {
      path: 'src/content/music.ts',
      find: "export const TITLE_ONLY: readonly MusicLayer[] = ['bass', 'beat'];",
      replace: "export const TITLE_ONLY: readonly MusicLayer[] = ['bass', 'beat', 'engine'];",
    },
  },
  {
    decision: '0095',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE DRONE CLOSED AT `run`, so the two pieces have nothing joining them. It is the tidy reading
      of *the title has its own music*: if `calm` is a separate piece, close all of it. What that costs
      is 0090's *the music never stops* — the change of piece stops being a swell and becomes an edit,
      with a moment of nothing at the boundary while two crossfades pass each other.
    */
    broke: 'the drone closed on entering a level, so the two pieces have nothing joining them',
    guard: 'and something is open at EVERY level, because the music never stops',
    edit: {
      path: 'src/content/music.ts',
      find: '  run: { drone: 0.34, bass: 0, beat: 0, sub: 0.86, engine: 0.9, perc: 0.66, chords: 0.86, groove: 0.8, arp: 0, ride: 0, call: 0.62, hook: 0, drive: 0, toll: 0, crash: 0, dread: 0, lead: 0, counter: 0, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.5, auraFast: 0.28 },',
      replace: '  run: { drone: 0, bass: 0, beat: 0, sub: 0.86, engine: 0.9, perc: 0.66, chords: 0.86, groove: 0.8, arp: 0, ride: 0, call: 0.62, hook: 0, drive: 0, toll: 0, crash: 0, dread: 0, lead: 0, counter: 0, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.5, auraFast: 0.28 },',
    },
  },
  {
    decision: '0095',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE CHORD PATTERN LEFT AT THE OLD LENGTH while its layer grew. Four entries at one per bar is
      four bars; two entries is the progression truncated to A minor and F, with the last two bars
      silent — and `renderVoice` would not complain, because a short pattern is a legal pattern.
      The layer is not silent, so 0090's silence guard passes; it is simply half empty.
    */
    broke: 'the chord progression truncated to half its layer, leaving two bars of nothing',
    guard: '0095 — every pattern spans EXACTLY its own layer, which is both a floor and a ceiling',
    edit: {
      path: 'src/content/music.ts',
      // ⚠️ Anchored on the SECOND chord voice, whose `accents` line follows `octave` directly — the
      // first now carries a comment between the two, and a probe that includes it would restrand the
      // moment anybody rewords a sentence. 0113 lengthened this layer to sixteen bars, so the break
      // truncates a sixteen-bar progression to two rather than an eight-bar one to one; the defect
      // it describes — a pattern that spans a fraction of its layer — is unchanged.
      find: '      steps: [\n        0, -4, 3, -2, 0, -4, -2, -5,\n        3, -2, 0, -4, 3, -2, -4, -5,\n      ],\n      pitched: true,\n      perBeat: 0.25,\n      octave: 1,\n      accents: [1, 0.82, 0.9, 0.76, 1, 0.84, 0.92, 0.68],\n      note: { wave: \'saw\', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.17, attack: 0.07, curve: 1.5, lowFrom: 890, lowTo: 2380, q: 1.2 },',
      replace: '      steps: [0, -4],\n      pitched: true,\n      perBeat: 0.25,\n      octave: 1,\n      accents: [1, 0.82, 0.9, 0.76, 1, 0.84, 0.92, 0.68],\n      note: { wave: \'saw\', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.17, attack: 0.07, curve: 1.5, lowFrom: 890, lowTo: 2380, q: 1.2 },',
    },
  },
];
