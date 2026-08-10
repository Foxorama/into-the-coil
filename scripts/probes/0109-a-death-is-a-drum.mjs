// The breaks behind docs/decisions/0109-a-death-is-a-drum.md.
//
// ⚠️ ALL FOUR ARE THE SHIPPED CUE, RESTORED ONE FIELD AT A TIME. Every one of them was green under
// every guard in the repository, including 0104's own — which is the point: 0104 gave this row two
// of the four things it needed and wrote its assertions over the two it gave the gun.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0109',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE REPORTED ONE. A duck of 0.18 on an event a level sends twice a second, against a duck that
      takes 0.445s to recover — the music turned down for the whole level, wearing an effect's clothes.
      It looks like restraint on the page: it is the shallowest of the four ducks in the table.
    */
    broke: 'the music pushed down for every enemy death, which is a level spent with the bed held under',
    guard: 'THE REPORTED ONE: nothing the level script schedules by the hundred pushes the music down',
    edit: {
      path: 'src/content/cues.ts',
      find: "  kill: {\n    twin: 'debris-burst',",
      replace: "  kill: {\n    twin: 'debris-burst',\n    duck: 0.18,",
    },
  },
  {
    decision: '0109',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE LENGTH PUT BACK, which is the half nothing could see: 0.46s is 1.15 beats, so at two
      bodies a second the explosions overlap themselves into a rumble. `MAX_CUE_SECONDS` allows two
      whole seconds and `hold` is deliberately shorter than every row in the table, so neither of the
      two existing length rules has an opinion about it.
    */
    broke: 'the death lengthened past a beat, so two of them are one smeared event',
    guard: 'and a punctuation mark is shorter than the beat it lands on, so two of them are two events',
    edit: {
      path: 'src/content/cues.ts',
      find: "{ wave: 'sine', from: inKey(6), to: inKey(1), seconds: 0.26, gain: 0.6, attack: 0.002, curve: 3.2 },",
      replace: "{ wave: 'sine', from: inKey(6), to: inKey(1), seconds: 0.46, gain: 0.6, attack: 0.002, curve: 3.2 },",
    },
  },
  {
    decision: '0109',
    suite: 'tests/sound.test.ts',
    // ⚠️ THE ACCENT REMOVED. The second most repeated sound in the game, bit-identical every time —
    // 0102's definition of a metronome, in the row 0104 did not reach.
    broke: 'the death struck at one weight every time, which is the gun’s own defect in the other cue',
    guard: 'and it is struck at more than one weight, which is the field 0104 gave the gun and not this',
    edit: {
      path: 'src/content/cues.ts',
      find: '    figure: [1, 0.72, 0.86, 0.74],',
      replace: '',
    },
  },
  {
    decision: '0109',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE CUE PUT BACK UNDER THE MUSIC. `inKey(-6)` is 31 Hz and 0108 put the bed's own fundamental
      at 41–65 — so the loudest repeated event in a level was sweeping through the band the bass now
      occupies, twice a second. Every spectral guard in the repository passes over it, because they all
      ask whether a band carries something rather than whether two things are fighting for one.
    */
    broke: 'the death swept below the music’s own fundamental, so it is under the bed rather than in it',
    guard: 'and the band the music’s own fundamental sits in is not claimed by it',
    edit: {
      path: 'src/content/cues.ts',
      find: "{ wave: 'sine', from: inKey(6), to: inKey(1), seconds: 0.26,",
      replace: "{ wave: 'sine', from: inKey(6), to: inKey(-6), seconds: 0.26,",
    },
  },
];
