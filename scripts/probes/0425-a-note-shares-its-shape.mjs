// The breaks behind docs/decisions/0425-a-note-shares-its-shape.md.
//
// ⚠️ EVERY ONE OF THESE IS A SYNTH THAT IS FAST AND WRONG IN THE ONE WAY REUSE CAN BE: a key that leaves
// out part of a shape, so a note wears the envelope, sweep or vibrato of the note before it. The music
// would change and every audio guard would measure the changed music. Or the reuse never happens, and
// the guard that holds it would be holding nothing.
//
// Whether each table holds what the loop used to compute is the fingerprint in the decision and the
// synth's own guards, whose probes (0072, 0089, 0099) were re-aimed onto the tables and are red there.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0425',
    suite: 'tests/shapes.test.ts',
    broke: 'the lowpass’s destination left out of the key, so a note sweeps to where the one before it swept',
    guard: 'THE KEY: a note that differs in any one part of its shape does not wear the shape before it',
    edit: {
      path: 'src/app/sound.ts',
      find: '    layer.lowFrom ?? 0,\n    layer.lowTo,',
      replace: '    layer.lowFrom ?? 0,',
    },
  },
  {
    decision: '0425',
    suite: 'tests/shapes.test.ts',
    broke: 'the vibrato left out of the key, so a steady note wobbles as the one before it did',
    guard: 'THE KEY: a note that differs in any one part of its shape does not wear the shape before it',
    edit: {
      path: 'src/app/sound.ts',
      find: '    layer.vibrato ?? 0,\n',
      replace: '',
    },
  },
  {
    decision: '0425',
    suite: 'tests/shapes.test.ts',
    broke: 'the length left out of the key, so a longer note is cut to the envelope of a shorter one',
    guard: 'THE KEY: a note that differs in any one part of its shape does not wear the shape before it',
    edit: {
      path: 'src/app/sound.ts',
      find: '    rate,\n    length,\n    attack,',
      replace: '    rate,\n    attack,',
    },
  },
  {
    decision: '0425',
    suite: 'tests/shapes.test.ts',
    broke: 'a shape never found again, so every note builds its own and the reuse this is for never happens',
    guard: 'and a note that differs only in pitch and weight DOES share it',
    edit: {
      path: 'src/app/sound.ts',
      find: '  if (known !== undefined) {',
      replace: '  if (known !== undefined && built < 0) {',
    },
  },
];
