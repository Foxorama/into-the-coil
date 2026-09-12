// What a cue SOUNDS like, in the four quantities the reports about them are written in.
//
// ⚠️ **THE INSTRUMENT IS OWED BEFORE THE FIRST TUNING PASS, NOT AFTER THE SEVENTH** —
// docs/decisions/0027-measure-the-picture-not-the-model.md. `scripts/hear.mjs` writes a file a human
// can play, which is the verdict; this is the thing a *change* can be read off, so that a pass over
// the table is a diff rather than a claim. The music got `weigh-adrift`, `weigh-build`,
// `weigh-apart` and five more. The cues had a wav and nothing else.
//
// ⚠️ **AND THE COLUMNS ARE THE WORDS, WHICH IS THE WHOLE DESIGN.** Every report this project has had
// about the effects is in four phrases, and each one is a quantity:
//
//   "too tinny"                        → the SUB and LOW share of the cue's own weight
//   "a bit more throatier"             → the LOWMID share, and what saturation puts there
//   "more impact"                      → CREST, the peak over the body that follows it
//   "doesn't sound like an explosion"  → FALL, how far the centroid drops from onset to tail
//
// ⚠️ **FALL IS THE ONE WORTH READING TWICE.** A falling spectral centroid IS an explosion — the top
// leaves first and the bottom is left behind, which is what a filter opening downward over noise
// does. A flat centroid is a hiss and a rising one is a whoosh. `tests/sound.test.ts` holds the
// STRUCTURAL half of that (0089: the body has a lowpass and it falls); this measures how far, which
// is the half a table of numbers cannot state and an ear cannot put a number on.
//
// ⚠️ **EVERY NUMBER IS A RATIO OR A dB, AND NOT ONE IS AN ABSOLUTE LEVEL.** The row's gain is its
// share of the mix (see `CUES`) and moves for reasons that have nothing to do with timbre, so a
// column that moved when the mix moved would report a re-voice that never happened. The bands are
// normalised to the cue's own loudest, exactly as `tests/spectrum.ts` does for the guards.
//
// Usage:  node scripts/weigh-cue.mjs [--only=pulse,kill] [--loud] [--json]
//
// `--json` prints one object per cue, for diffing two runs against each other rather than by eye.
//
// ⚠️ `--loud` IS THE EXCEPTION TO THE PARAGRAPH ABOVE AND IS OFF BY DEFAULT FOR THE REASON IT GIVES.
// Every other column here is a ratio, so that a re-voice reads as a change and a mix move does not.
// But *"the sounds need to be massively buffed"* is a report about ABSOLUTE level — how big the thing
// is, not what it is made of — and answering it off the ratio columns is answering a different
// question. So: `peak` and `loud`, both post-`gain` and post-`MASTER_GAIN`, which is where the signal
// actually leaves the cue bus. They move when the mix moves, which is why they are behind a flag.
//
//   peak   the loudest sample, in dBFS. What the limiter sees, and `CUE_LIMIT` is 0.8 (−1.9 dBFS).
//   loud   A-weighted level of the cue's loudest 400 ms, in dBFS — the column a report about SIZE is
//          written in. `loudest` in tests/spectrum.ts is the measure, and its header says why the mean
//          over the whole cue was tried first and said a longer, heavier sound was a quieter one.

import { CUES, CUE_KINDS } from '../src/content/cues.ts';
import { MASTER_GAIN, SAMPLE_RATE, cueSeconds, sampleCue } from '../src/app/sound.ts';
import { makeRng } from '../src/sim/rng.ts';
import { BANDS, centroid, loudest, spectrum } from '../tests/spectrum.ts';

const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith('--only='))?.slice('--only='.length);
const asJson = args.includes('--json');
const loud = args.includes('--loud');

const db = (x) => 20 * Math.log10(Math.max(x, 1e-12));

// ⚠️ `centroid` LIVES IN `tests/spectrum.ts` AND IS IMPORTED, NOT REPEATED. It started here and
// moved the moment `tests/sound.test.ts` needed the same measure for 0179's guard — one
// description of *where has the energy gone*, on the same rule that put `bandEnergy` there.

/** Peak over the RMS of everything after the transient — how much of the sound is its front edge. */
function crestDb(samples, rate) {
  const peak = samples.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  const from = Math.min(samples.length - 1, Math.round(0.02 * rate));
  let sum = 0;
  let n = 0;
  for (let i = from; i < samples.length; i++) {
    sum += samples[i] * samples[i];
    n++;
  }
  return n > 0 ? db(peak) - db(Math.sqrt(sum / n)) : 0;
}

/**
 * How loud a cue IS, in dBFS at the master — `--loud`'s second column.
 *
 * ⚠️ **`loudest` LIVES IN `tests/spectrum.ts` AND IS IMPORTED, NOT REPEATED**, exactly as `centroid`
 * is and for the reason written there: `tests/authored.test.ts` holds a claim about this quantity, and
 * a printed figure that disagrees with an asserted one is
 * `docs/decisions/0029-the-tracked-record-is-the-record.md` happening in arithmetic. Its own header
 * has why this is the loudest 400 ms rather than a mean over the length.
 */
const loudDb = (samples) => db(loudest(samples, SAMPLE_RATE) * MASTER_GAIN);

const kinds = only ? only.split(',') : CUE_KINDS;
const rows = [];

for (const kind of kinds) {
  const row = CUES[kind];
  if (row === undefined) throw new Error(`no cue named ${kind} — the kinds are: ${CUE_KINDS.join(', ')}`);
  const samples = sampleCue(row, SAMPLE_RATE, makeRng('cues').stream(kind));
  const seconds = cueSeconds(row);
  const bands = spectrum(samples, SAMPLE_RATE);
  // The onset is the first 25 ms; the tail is the last third. Both are windows a listener has,
  // rather than sample indices, and both are long enough to place a centroid at 30 Hz.
  const onset = centroid(samples, 0, Math.min(0.025, seconds / 3), SAMPLE_RATE);
  const tail = centroid(samples, (seconds * 2) / 3, seconds, SAMPLE_RATE);
  rows.push({
    kind,
    seconds: Number(seconds.toFixed(3)),
    sub: Number(bands[0].toFixed(3)),
    low: Number(bands[1].toFixed(3)),
    lowmid: Number(bands[2].toFixed(3)),
    mid: Number(bands[3].toFixed(3)),
    himid: Number(bands[4].toFixed(3)),
    hi: Number(bands[5].toFixed(3)),
    air: Number(bands[6].toFixed(3)),
    crestDb: Number(crestDb(samples, SAMPLE_RATE).toFixed(1)),
    peakDb: Number(db(samples.reduce((m, v) => Math.max(m, Math.abs(v)), 0) * MASTER_GAIN).toFixed(1)),
    loudDb: Number(loudDb(samples).toFixed(1)),
    onsetHz: Math.round(onset),
    tailHz: Math.round(tail),
    fallDb: Number(db(tail / Math.max(onset, 1e-9)).toFixed(1)),
  });
}

if (asJson) {
  console.log(JSON.stringify(rows, null, 1));
} else {
  const head = [
    'cue',
    'secs',
    ...BANDS.map((b) => b[2]),
    ...(loud ? ['peak', 'loud'] : []),
    'crest',
    'onset',
    'tail',
    'fall',
  ];
  const widths = head.map((h) => h.length);
  const body = rows.map((r) => [
    r.kind,
    r.seconds.toFixed(2),
    r.sub.toFixed(3),
    r.low.toFixed(3),
    r.lowmid.toFixed(3),
    r.mid.toFixed(3),
    r.himid.toFixed(3),
    r.hi.toFixed(3),
    r.air.toFixed(3),
    ...(loud ? [`${r.peakDb}dB`, `${r.loudDb}dB`] : []),
    `${r.crestDb}dB`,
    `${r.onsetHz}Hz`,
    `${r.tailHz}Hz`,
    `${r.fallDb}dB`,
  ]);
  for (const line of body) line.forEach((cell, i) => (widths[i] = Math.max(widths[i], cell.length)));
  console.log(head.map((h, i) => h.padStart(widths[i])).join('  '));
  for (const line of body) console.log(line.map((cell, i) => cell.padStart(widths[i])).join('  '));
  console.log(
    '\nbands are a share of the cue’s own loudest, A-weighted (tests/spectrum.ts).\n' +
      'crest = peak over the RMS after 20 ms — how much of the sound is its front edge.\n' +
      'onset/tail = unweighted spectral centroid over the first 25 ms and the last third.\n' +
      'fall = tail over onset in dB. A falling centroid IS an explosion; flat is a hiss.' +
      (loud
        ? '\npeak/loud are the ONE absolute pair, post-gain and post-MASTER_GAIN — dBFS at the bus.\n' +
          'loud is A-weighted RMS over the whole cue: what *massively buffed* is a report about.'
        : ''),
  );
}
