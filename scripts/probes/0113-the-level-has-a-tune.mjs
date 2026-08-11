// The breaks behind docs/decisions/0113-there-is-one-composition-and-seven-levels.md.
//
// ⚠️ THREE OF THESE GUARD THINGS THAT DID NOT EXIST BEFORE THIS DECISION, which is why they are here
// rather than folded into an older file: a level's opening had no melodic layer at all, the resident
// size of the loops was guarded by nothing, and the prewarm's ceiling was measuring a quantity nobody
// schedules. `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` is why every one of them is broken
// on purpose before it is trusted.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0113',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE ONE THE OLD GUARD COULD NOT SEE. The prewarm bounded SECONDS and never bytes, so the loops
      could grow without limit as long as each note stayed short — and the phrase doubling took them
      from 19.0 MB to 38.7 MB with every assertion in the repository green. Sixteen bars is the shipped
      value; thirty-two is what a hand reaches for the next time a play-test says *repetitive*.
    */
    broke: 'every melodic layer doubled again, so the loops are held in memory by nothing at all',
    guard: 'and the whole set is small enough to spread across the title screen',
    edit: {
      path: 'src/content/music.ts',
      find: '  sub: 16,\n  engine: 4,\n  perc: 4,\n  chords: 16,\n  groove: 16,\n  arp: 16,\n  call: 16,\n  hook: 16,',
      replace: '  sub: 32,\n  engine: 4,\n  perc: 4,\n  chords: 32,\n  groove: 32,\n  arp: 32,\n  call: 32,\n  hook: 32,',
    },
  },
  {
    decision: '0113',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE JOB, WHICH IS WHAT THE OLD CEILING SAID IT WAS MEASURING AND WAS NOT. `layerNotes` yields
      one job per note (0102), so what a scheduler cannot split is a single note — and a pad held for
      a quarter of a minute would have sailed through the layer-length ceiling that refused a
      sixteen-bar loop of four-hundred short ones.
    */
    broke: 'one note held for twenty seconds, which is a job no scheduler can hide',
    guard: 'and the whole set is small enough to spread across the title screen',
    edit: {
      path: 'src/content/music.ts',
      find: "      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.16, attack: 0.35, curve: 0.9, lowFrom: 520, lowTo: 300, q: 0.9 },",
      replace: "      note: { wave: 'saw', from: 0, to: 0, seconds: 20, gain: 0.16, attack: 0.35, curve: 0.9, lowFrom: 520, lowTo: 300, q: 0.9 },",
    },
  },
  {
    decision: '0113',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE REPORTED ONE, PUT BACK. *"It has no depth, no intricacy, no variety"* was said about a
      level whose opening rung carried a kick, a clap, percussion, a pad and a bass — and no melody
      whatsoever: `arp`, `hook`, `lead` and `toll` were all zero at `run`, for the first sixty seconds
      of every level. Closing `call` restores exactly that state, and the ladder's own rule — every
      rung opens something — is what catches it.
    */
    /*
      ⚠️ THIS PROBE POINTED AT THE WRONG GUARD AND `npm run prove` SAID SO. It first named *opens a
      layer at every step*, and the suite stayed GREEN — `run` opens five other layers and not one of
      them is a melody, so the ladder's own rule has no opinion about a level with no tune in it. A
      probe that does not fire is the harness reporting a MISSING guard, which is the more valuable
      half of 0019. The guard named below was written because of this line.
    */
    broke: "the level's opening rung given no melodic layer, which is the reported defect exactly",
    guard: 'THE REPORTED ONE: every rung inside a level has a tune in it, not just a bed',
    edit: {
      path: 'src/content/music.ts',
      find: '  run: { drone: 0.34, bass: 0, beat: 0, sub: 0.86, engine: 0.9, perc: 0.66, chords: 0.86, groove: 0.8, arp: 0, call: 0.62,',
      replace: '  run: { drone: 0.34, bass: 0, beat: 0, sub: 0.86, engine: 0.9, perc: 0.66, chords: 0.86, groove: 0.8, arp: 0, call: 0,',
    },
  },
  {
    decision: '0113',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE B-SECTION SILENTLY TRUNCATED. A sixteen-bar layer whose pattern spans eight plays its
      second half as silence — the loop is the right length, every gain is right, and half the piece
      is gone. It is the same class as 0090's silent layer, one level down: not a layer missing, but
      a layer's second half missing.
    */
    broke: "the chord progression's B-section dropped, so half of every phrase is silence",
    guard: '0095 — every pattern spans EXACTLY its own layer, which is both a floor and a ceiling',
    edit: {
      path: 'src/content/music.ts',
      find: '        0, -4, 3, -2, 0, -4, -2, -5,\n        3, -2, 0, -4, 3, -2, -4, -5,\n      ],\n      pitched: true,\n      perBeat: 0.25,\n      octave: 0,',
      replace: '        0, -4, 3, -2, 0, -4, -2, -5,\n      ],\n      pitched: true,\n      perBeat: 0.25,\n      octave: 0,',
    },
  },
];
