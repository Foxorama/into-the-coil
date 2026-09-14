// How a cue sits IN THE MUSIC — the four quantities the report about that is written in.
//
// ⚠️ **THE INSTRUMENT IS OWED BEFORE THE TUNING PASS, NOT AFTER IT** —
// docs/decisions/0027-measure-the-picture-not-the-model.md, and this channel has now had the same
// report three times. `scripts/weigh-cue.mjs` measures a cue ALONE — its bands, its centroid, its
// level — and every column in it is right about a sound nobody is playing music underneath. The
// report this exists for is about the pair:
//
//   "they don't fit into the music or other sounds so they sound discordant because they're in their
//    own little area of sound so we need to blend with them a bit more melody and a slightly deeper
//    bass to make them fit the game"
//
// ⚠️ **AND `scripts/hear.mjs --play` ALREADY WRITES THE PAIR, WHICH IS WHY THIS IS THE MISSING HALF.**
// That mode exists because a play-test said *"the game sound effects don't blend in with the music at
// all"* — so the rig a hand can judge has been there since 0114 and there has never been a NUMBER a
// change could be read off. A wav is the verdict; this is the diff.
//
// WHAT IT PRINTS, and every column is a phrase from the report
//
//   melody   dB by which the cue's energy prefers the KEY's own frequencies to the quarter-tones
//            between them, measured over the whole scale lattice from 27.5 Hz up. Noise is 0; a glide
//            is near 0 because it spends the same time on a note as beside one; a HELD scale tone is
//            the only thing that scores. "More melody" is this column going up.
//   stands   the same ratio at ONE frequency — the loudest scale tone in the sound, against the
//            quarter-tone beside it. `melody` is broadband and a cue is mostly noise by design, so a
//            note added under a wash moves it by a decibel or two however clearly it is heard; this
//            says whether there is a note AT ALL and how far it stands over the wash at its own pitch.
//            Read the pair: `melody` is *how tonal is this*, `stands` is *is there a note in it*.
//   note     the loudest scale tone in it, named.
//   bottom   the share of the cue's A-weighted energy in `sub` + `low` (25–130 Hz), against the bed's
//            own share of the same bands at this rung. "A slightly deeper bass" is this going up, and
//            it is a SHARE so that a quieter cue does not read as a thinner one.
//   apart    the band in which the cue most exceeds the bed's profile, and by how much. Both profiles
//            are normalised to their own total first, so this is about SHAPE — *its own little area of
//            sound* is a cue whose energy is somewhere the music's is not.
//
// ⚠️ **`bandLevels` AND NOT `bandEnergy`, BECAUSE THIS COMPARES TWO DIFFERENT SIGNALS.** The header of
// tests/spectrum.ts has the whole argument: six probes times a bandwidth is a density estimate that
// counts a tone at a fraction of its power and noise in full, which cancels inside one signal's ratio
// and does not cancel between two. A cue against a bed is exactly the case it does not cancel in.
//
// ⚠️ **THE BED IS FOLDED TO MONO AND THE CUE IS TOO, WHICH IS A STATED MODEL.** 0118 gives every layer
// a position and `hear.mjs --play` honours it, because a file is listened to. This asks *where in the
// spectrum is this energy*, and an answer that changed with which ear a cue was panned to would be
// answering about the pan. `weigh-heard.mjs` is the instrument that reads position.
//
// Usage:
//   node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-fit.mjs
//        [--only=bossAcid,bossVoid] [--place=approach] [--rung=boss] [--json]

import { CUE_KINDS, MUSIC_ROOT, SCALE } from '../src/content/cues.ts';
import { MASTER_GAIN, SAMPLE_RATE, sampleCue, saturate } from '../src/app/sound.ts';
import { makeRng } from '../src/sim/rng.ts';
import { bakeLoops } from '../src/app/music.ts';
import { THEME_KINDS, cueRowOf, rungOf } from '../src/content/themes.ts';
import { MUSIC_DRIVE, MUSIC_GAIN, MUSIC_LAYERS, MUSIC_LEVELS, PHRASE_SECONDS } from '../src/content/music.ts';
import { BANDS, bandLevels, keyFit } from '../tests/spectrum.ts';

const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith('--only='))?.slice('--only='.length);
const place = args.find((a) => a.startsWith('--place='))?.slice('--place='.length) ?? 'approach';
const rung = args.find((a) => a.startsWith('--rung='))?.slice('--rung='.length) ?? 'boss';
const asJson = args.includes('--json');

if (!THEME_KINDS.includes(place)) throw new Error(`--place=${place} is no theme: ${THEME_KINDS.join(', ')}`);
if (!MUSIC_LEVELS.includes(rung)) throw new Error(`--rung=${rung} is no rung: ${MUSIC_LEVELS.join(', ')}`);

const kinds = only ? only.split(',') : CUE_KINDS;
for (const kind of kinds) if (!CUE_KINDS.includes(kind)) throw new Error(`${kind} is no cue`);

/*
  ⚠️ **THE ARITHMETIC IS `tests/spectrum.ts`'s AND IS NOT REPEATED HERE**, on `weigh-heard.mjs`'s own
  terms and 0029's reason: a printed figure that disagrees with an asserted one is the tracked record
  drifting inside one repository. `keyFit` is the measurement, `tests/authored.ts` records it every
  run, and this file is the FORMATTING and the bed it is read against.
*/

const NAMES = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
function nameOf(f) {
  const semitones = Math.round(12 * Math.log2(f / MUSIC_ROOT));
  return `${NAMES[((semitones % 12) + 12) % 12]}${1 + Math.floor(semitones / 12)}`;
}

/** The bed this place plays at this rung, folded to mono and through the mixer's own bus. */
function bedOf() {
  const loops = bakeLoops(SAMPLE_RATE, place === 'approach' ? undefined : place);
  const length = Math.round(PHRASE_SECONDS * SAMPLE_RATE);
  const bed = new Float32Array(length);
  for (const layer of MUSIC_LAYERS) {
    const gain = rungOf(place, rung, layer);
    if (gain <= 0) continue;
    const loop = loops[layer];
    for (let i = 0; i < length; i++) bed[i] += loop[i % loop.length] * gain;
  }
  // The shaper and the bus gain the mixer itself applies — `hear.mjs`'s `busOf`, one signal wide.
  for (let i = 0; i < length; i++) bed[i] = saturate(bed[i] * MUSIC_GAIN, MUSIC_DRIVE) * MASTER_GAIN;
  return bed;
}

/** A band profile normalised to its own total, so two signals can be compared by shape. */
const shapeOf = (samples) => {
  const levels = bandLevels(samples, SAMPLE_RATE);
  const total = levels.reduce((a, b) => a + b, 0) || 1e-12;
  return levels.map((v) => v / total);
};

const bed = bedOf();
const bedShape = shapeOf(bed);
const bedBottom = bedShape[0] + bedShape[1];

/**
 * The four columns, of any signal at all.
 *
 * ⚠️ **THE SAME ARITHMETIC FOR A CUE AND FOR A MUSIC LAYER, WHICH IS WHAT MAKES THE NUMBERS MEAN
 * SOMETHING.** `--layers` runs it over the bed's own layers at this rung: those are voices that
 * unarguably state notes in the key, so they are the calibration a column with no scale on it needs.
 * An instrument nobody has shown a known answer to is a number, not a measurement —
 * docs/decisions/0027-measure-the-picture-not-the-model.md, and 0308 is what happens without it.
 */
function measure(name, samples) {
  const fit = keyFit(samples, SAMPLE_RATE);
  const shape = shapeOf(samples);
  const bottom = shape[0] + shape[1];
  let apart = { band: BANDS[0][2], by: -Infinity };
  BANDS.forEach(([, , band], i) => {
    const by = 10 * Math.log10((shape[i] + 1e-9) / (bedShape[i] + 1e-9));
    if (by > apart.by) apart = { band, by };
  });

  return {
    cue: name,
    melody: fit.melody,
    stands: fit.stands,
    note: fit.note > 0 ? nameOf(fit.note) : '—',
    noteHz: Math.round(fit.note),
    deepest: fit.deepest > 0 ? nameOf(fit.deepest) : '—',
    deepestHz: Math.round(fit.deepest),
    bottom,
    apart: apart.band,
    apartBy: apart.by,
  };
}

const rows = [];
if (args.includes('--layers')) {
  const loops = bakeLoops(SAMPLE_RATE, place === 'approach' ? undefined : place);
  for (const layer of MUSIC_LAYERS) {
    const gain = rungOf(place, rung, layer);
    if (gain <= 0) continue;
    const loop = loops[layer];
    const solo = new Float32Array(loop.length);
    for (let i = 0; i < loop.length; i++) solo[i] = saturate(loop[i] * gain * MUSIC_GAIN, MUSIC_DRIVE) * MASTER_GAIN;
    rows.push(measure(layer, solo));
  }
  rows.push(measure('THE BED', bed));
} else {
  for (const kind of kinds) {
    const row = cueRowOf(place, kind);
    const samples = sampleCue(row, SAMPLE_RATE, makeRng('weigh-fit').stream(kind), 1);
    for (let i = 0; i < samples.length; i++) samples[i] *= MASTER_GAIN;
    rows.push(measure(kind, samples));
  }
}

if (asJson) {
  for (const row of rows) console.log(JSON.stringify(row));
} else {
  console.log(`${place} at ${rung} — the bed's own bottom (25–130 Hz) is ${(bedBottom * 100).toFixed(1)}% of its energy`);
  console.log('cue          | melody | stands |  top note |  low note | bottom | apart');
  for (const row of rows) {
    console.log(
      [
        row.cue.padEnd(12),
        `${row.melody >= 0 ? '+' : ''}${row.melody.toFixed(1)}dB`.padStart(6),
        `${row.stands >= 0 ? '+' : ''}${row.stands.toFixed(1)}dB`.padStart(6),
        `${row.note} ${row.noteHz}Hz`.padStart(9),
        `${row.deepest} ${row.deepestHz}Hz`.padStart(9),
        `${(row.bottom * 100).toFixed(1)}%`.padStart(6),
        `${row.apart} ${row.apartBy >= 0 ? '+' : ''}${row.apartBy.toFixed(1)}dB over the bed`,
      ].join(' | '),
    );
  }
}
