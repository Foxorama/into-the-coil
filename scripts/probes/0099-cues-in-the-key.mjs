// The breaks behind docs/decisions/0099-the-cues-are-in-the-key.md.
//
// ⚠️ THE TIMING IS NOT WHAT IS BROKEN HERE, and that is worth saying because three decisions in a row
// were about timing. 0093, 0094 and 0096 own *the cadence is on the grid* and every one of their
// probes is unaffected by anything below — the report this decision answers said the sounds were
// *"close to on beat"* and still did not mesh, which is a statement about a third axis. What is
// broken below is HARMONY: the note, the interval, and where the key is allowed to live.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0099',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE SHIPPED PULSE, PUT BACK — the most frequent sound in the game at the two frequencies it
      had for its whole life. 190 is between F#3 and G3 and 78 is between D#2 and E2: neither is a
      note in any key, and this one is heard ten times a second over a drone sounding A.

      ⚠️ EVERY OTHER SOUND GUARD IS GREEN OVER THIS. It is the right length, the right shape, the
      right spectrum, under the ceiling, on the beat — and it is a wrong note.
    */
    broke: 'the pulse put back on the two frequencies it shipped with, which are not notes',
    guard: 'THE REPORTED ONE: every pitched cue glides between two notes of the key',
    edit: {
      path: 'src/content/cues.ts',
      find: "{ wave: 'square', from: inKey(13), to: inKey(4), seconds: 0.075",
      replace: "{ wave: 'square', from: 190, to: 78, seconds: 0.075",
    },
  },
  {
    decision: '0099',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE INTERVAL BROKEN WHILE BOTH ENDS STAY MUSICAL-LOOKING, which is the break a hand makes
      while tuning by ear. A death falling to a note that is IN the chromatic scale but not in this
      key — a B flat, one semitone off the G it lands on now — reads as a plausible edit and is the
      exact defect the whole decision is about: the interval is still a whole number of semitones, so
      the second assertion stays green and only the first one fires.
    */
    broke: 'the death dropped a semitone onto a note outside the key, which is the defect exactly',
    guard: 'THE REPORTED ONE: every pitched cue glides between two notes of the key',
    edit: {
      path: 'src/content/cues.ts',
      find: "{ wave: 'sine', from: inKey(12), to: inKey(-1), seconds: 1.2",
      replace: "{ wave: 'sine', from: inKey(12), to: inKey(-1) * Math.pow(2, -1 / 12), seconds: 1.2",
    },
  },
  {
    decision: '0099',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE SYNTHESISER MADE TO IGNORE THE DESTINATION, which no assertion over the TABLE can see:
      every row still names two notes in the key and every interval is still whole. What changes is
      that the sound in the room is a steady tone rather than a fall, and only the measured assertion
      knows the difference. It is the audio channel's version of
      docs/decisions/0027-measure-the-picture-not-the-model.md.
    */
    broke: 'the sweep destination ignored, so every glide is a held note the table says is a fall',
    guard: 'THE SAMPLES: what a layer puts in the room lies inside the interval its row names',
    edit: {
      path: 'src/app/sound.ts',
      find: '    const step = (layer.from * Math.pow((layer.to || layer.from) / layer.from, u)) / rate;',
      replace: '    const step = layer.from / rate;',
    },
  },
  {
    decision: '0099',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE SCALE OPENED TO THE CHROMATIC SET, which is the change that makes this whole decision
      mean nothing while every assertion in the file still passes on the numbers it has today. Twelve
      notes to the octave is *any note*, and *any note* is what an arbitrary frequency already was —
      so the rule survives as a sentence and stops being a constraint. It is caught by naming the
      scale rather than by counting it.
    */
    broke: 'the scale opened to all twelve semitones, so *in the key* stops meaning anything',
    guard: 'and the scale is the natural MINOR, so nothing a cue sounds can be wrong over the drone',
    edit: {
      path: 'src/content/cues.ts',
      find: 'export const SCALE: readonly number[] = [0, 2, 3, 5, 7, 8, 10];',
      replace: 'export const SCALE: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];',
    },
  },
];
