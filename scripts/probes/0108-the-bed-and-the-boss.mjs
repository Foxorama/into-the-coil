// The breaks behind docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md.
//
// ⚠️ THE FIRST TWO ARE THE SHIPPED GAME, RESTORED. A low end made entirely of transients and drums
// that are identical in every bar of every level are both states the ninth play-test was given, and
// every guard in the repository was green on both — the second of them for two whole decisions,
// because 0102 wrote its accent assertion over `beat` and `beat` is the title's.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0108',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE REPORTED ONE, and the edit is the one a hand actually makes: the sub written an octave up,
      where a bass line usually lives. It is still the same notes, the same envelope, the same gain and
      the same layer — it is simply at 82–131 Hz instead of 41–65, which is *heard* rather than *felt*.
      Every other bass guard in the file passes over it, including 0095's *a level has more sub than
      the title*.
    */
    broke: 'the sub written an octave up, where a bass usually lives and a chest does not',
    guard: 'THE REPORTED ONE: the band a chest resolves is a real share of the mix, not a corner of it',
    edit: {
      path: 'src/content/music.ts',
      find: '      steps: [\n        0, -4, 3, -2, 0, -4, -2, -5,\n        3, -2, 0, -4, 3, -2, -4, -5,\n      ],\n      pitched: true,\n      perBeat: 0.25,\n      octave: 0,',
      replace: '      steps: [\n        0, -4, 3, -2, 0, -4, -2, -5,\n        3, -2, 0, -4, 3, -2, -4, -5,\n      ],\n      pitched: true,\n      perBeat: 0.25,\n      octave: 1,',
    },
  },
  {
    decision: '0108',
    suite: 'tests/music.test.ts',
    // ⚠️ THE WHOLE LAYER CLOSED AT A LEVEL'S OPENING RUNG, which is the shipped ladder exactly: the
    // low end is the kick's tail and the chords' own sub, and *"a level has more sub than the title"*
    // is still true of it.
    broke: 'the sub closed at a level’s opening rung, so the floor is back to being a kick’s tail',
    /*
      ⚠️ RE-POINTED BY 0122, WHICH BROKE THE GUARD THIS NAMED. A deeper kick supplies enough of the
      sub band on its own to clear a ratio against the title, so closing `sub` stopped reddening it —
      `npm run prove` said WRONG TEST. The claim was always *the level has a FLOOR*, and it is now
      measured by attribution rather than by a total. This probe is unchanged; what it aims at is.
    */
    guard: 'AND THE FLOOR IS STILL THE SUB LAYER, not the kick’s tail',
    edit: {
      path: 'src/content/music.ts',
      find: '  run: { drone: 0.34, bass: 0, beat: 0, sub: 0.86,',
      replace: '  run: { drone: 0.34, bass: 0, beat: 0, sub: 0,',
    },
  },
  {
    decision: '0108',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE METRONOME ITSELF, RESTORED — the literal shipped pattern, four-on-the-floor at one weight
      in every bar. It is the third play report about this sound and the second decision to answer it;
      what makes it worth a probe is that 0102's assertion, which is about exactly this, stays green
      over it, because that one names `beat`.
    */
    broke: 'the level’s kick struck at one weight in every bar, which is the reported metronome',
    guard: 'THE METRONOME, in the layer that actually plays in a level',
    edit: {
      path: 'src/content/music.ts',
      find: '      steps: [1, 0.86, 0.94, 0.84, 1, 0.82, 0.96, 0.86, 1, 0.86, 0.94, 0.88, 1, 0.8, _, 0.72],',
      replace: '      steps: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],',
    },
  },
  {
    decision: '0108',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE ACCENT THROWN AWAY BETWEEN THE TABLE AND THE SAMPLES — one line, and every table-shaped
      assertion above it stays green. It is the failure 0102's own accent guard records having been
      written badly enough to miss the first time, arriving in the half of the piece 0102 could not
      reach at all.
    */
    /*
      ⚠️ THE GUARD THIS NAMES WAS REPAIRED BY 0156, AND THIS PROBE IS WHAT FOUND IT NEEDED REPAIRING.
      `hook`'s ring went from about 12 ms to 110 ms against a sixteenth of 100, so the window the
      guard took its peak from began containing the previous note's tail — and this break stopped
      reddening anything. It is unchanged; what it aims at now measures the INCREMENT at each onset,
      meaned over the whole loop. See docs/decisions/0156-a-strike-is-an-increment.md.
    */
    broke: 'a pitched note’s weight dropped on the way to the bake, so the table lies about the sound',
    guard: 'and a PITCHED note has a weight too, which half the piece never had',
    edit: {
      path: 'src/app/music.ts',
      find: '    const accent = voice.accents === undefined ? 1 : voice.accents[step % voice.accents.length] ?? 1;',
      replace: '    const accent = 1;',
    },
  },
  {
    decision: '0108',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE COUNTERPOINT TIDIED ONTO THE GRID, which is the edit a later hand makes for the best of
      reasons: every other voice in the piece is a power of two, so a `perBeat: 3` looks like a typo.
      It is the whole of what separates percussion from more drums, and nothing else can see it —
      the layer is the same length, the same loudness and the same number of strokes a bar.
    */
    broke: 'the shaker moved off triplets onto sixteenths, so the percussion is one more drum',
    guard: 'THE COUNTERPOINT: something a level opens does not divide the beat the way the drums do',
    edit: {
      path: 'src/content/music.ts',
      find: '      steps: Array.from({ length: 48 }, (_unused, i) => [0.95, 0.34, 0.5][i % 3]!),\n      pitched: false,\n      perBeat: 3,',
      replace: '      steps: Array.from({ length: 64 }, (_unused, i) => [0.95, 0.34, 0.5, 0.34][i % 4]!),\n      pitched: false,\n      perBeat: 4,',
    },
  },
  {
    decision: '0108',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE BOSS BACK TO OPENING ONE THING, which is the shipped ladder and the report: *"the boss
      music isn't increasing proportionally."* The fight is still the loudest rung, still has every
      layer the approach had, and still adds a melody — and the arrival is a nudge.
    */
    broke: 'the boss’s kit closed, so its rung opens one layer against the level’s four',
    guard: 'THE BOSS ARRIVES: it opens more than one new thing, and it is louder in the unit an ear integrates',
    edit: {
      path: 'src/content/music.ts',
      find: 'stomp: 0.92, frenzy: 0.86, wraith: 0.8, auraSlow: 1, auraFast: 0.9 },',
      replace: 'stomp: 0, frenzy: 0.86, wraith: 0, auraSlow: 1, auraFast: 0.9 },',
    },
  },
  {
    decision: '0108',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE BUS DRIVEN UNTIL THE LADDER IS ONE LEVEL. 0104 wrote a probe for this and pointed it at
      the clipping assertion, which cannot see it: `saturate` never returns past 1 whatever it is
      handed, so a bus squashed flat clips nothing. This is the guard that probe wanted.
    */
    broke: 'the music bus driven flat, so every rung of the ladder arrives at the same loudness',
    guard: 'and the shaper has not flattened the ladder it is meant to make room for',
    edit: {
      path: 'src/content/music.ts',
      find: 'export const MUSIC_DRIVE = 0.3;',
      replace: 'export const MUSIC_DRIVE = 40;',
    },
  },
];
