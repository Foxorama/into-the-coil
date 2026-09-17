// The album's own tracks that are not a level: the title track.
//
// Usage:  node scripts/album.mjs --title --out=C:/itc-renders/album/title.wav
//
// ⚠️ IT PLAYS A SCORE ON A CLOCK — `src/content/title-track.ts` — through the same note renderer, room and bus
// the game uses (`sampleLayerInto`, `addRoom`, `saturate` at `MUSIC_DRIVE`, `MUSIC_GAIN × MASTER_GAIN`), so the
// title track is the title screen's own instruments at the game's own level. Every level track is
// `scripts/hear.mjs --level=<kind> --album`; this is the one piece that has no level to walk.
//
// ⚠️ EACH PART IS SET TO A LEVEL IN dBFS BEFORE THE SCORE SCALES IT (`TARGET_DB`), because the title's parts
// were never mixed against each other — three of them are new — and a level stated in the unit a listener
// hears is the one that can be checked on the render.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BAR_SECONDS, BEAT_SECONDS, MUSIC_DRIVE, MUSIC_GAIN } from '../src/content/music.ts';
import { MUSIC_ROOT } from '../src/content/cues.ts';
import { MASTER_GAIN, SAMPLE_RATE, sampleLayerInto, saturate } from '../src/app/sound.ts';
import { addRoom, panGains } from '../src/app/music.ts';
import { makeRng } from '../src/sim/rng.ts';
import { TITLE_PARTS, TITLE_SCORE } from '../src/content/title-track.ts';
import { CODA_SECONDS, codaOn } from '../src/content/codas.ts';

const args = new Map(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const out = resolve(args.get('out') ?? 'title.wav');
const R = SAMPLE_RATE;

/** Where each part sits at its own level of 1, in dBFS RMS on the bus before the shaper. */
// The lead at −28.5, where it was −25: heard, *"into the coil title at 53 — wham, suddenly loud."* It arrived over one bar
// six decibels over every other part, and the track rose four decibels in two seconds.
const TARGET_DB = { drone: -31, pad: -31, bass: -26, heart: -31, arp: -31, lead: -28.5, flute: -25.5 };

const render = (voices, seconds, wrap, rng) => {
  const buf = new Float32Array(Math.round(seconds * R));
  for (const voice of voices) {
    const step = BEAT_SECONDS / voice.perBeat;
    voice.steps.forEach((value, k) => {
      if (value === null || value === undefined) return;
      const pitch = voice.pitched ? MUSIC_ROOT * Math.pow(2, voice.octave + value / 12) : 0;
      const accent = voice.accents ? voice.accents[k % voice.accents.length] ?? 1 : 1;
      const note = voice.pitched
        ? { ...voice.note, from: pitch, to: pitch, gain: voice.note.gain * accent }
        : { ...voice.note, gain: voice.note.gain * value };
      sampleLayerInto(note, R, rng, buf, Math.round(k * step * R), wrap);
    });
  }
  return buf;
};
const rmsDb = (buf) => {
  let e = 0;
  for (const v of buf) e += v * v;
  return 10 * Math.log10(e / buf.length + 1e-20);
};

if (!args.has('title')) {
  console.error('usage: node scripts/album.mjs --title [--out=title.wav]');
  process.exit(1);
}

// The loops, each at its target level.
const names = Object.keys(TITLE_PARTS);
const loops = {};
for (const name of names) {
  const part = TITLE_PARTS[name];
  const buf = render(part.voices, part.bars * BAR_SECONDS, true, makeRng('music').stream(`title-${name}`));
  addRoom(buf, R, part.air);
  const scale = 10 ** ((TARGET_DB[name] - rmsDb(buf)) / 20) / MUSIC_GAIN;
  for (let i = 0; i < buf.length; i++) buf[i] *= scale;
  loops[name] = buf;
}

// The score, as a level per part per sample, moving across each section's first bar.
const scoreBars = TITLE_SCORE.reduce((n, s) => n + s.bars, 0);
const codaAt = scoreBars * BAR_SECONDS;
const total = Math.round((codaAt + CODA_SECONDS) * R);
const levelAt = (name, t) => {
  let startBar = 0;
  let before = 0;
  for (const section of TITLE_SCORE) {
    const start = startBar * BAR_SECONDS;
    const end = (startBar + section.bars) * BAR_SECONDS;
    const level = section.parts[name] ?? 0;
    if (t < end) {
      // A part falling away takes the section's glide; one arriving still takes a bar.
      const into = (t - start) / (BAR_SECONDS * (level < before ? section.glide ?? 1 : 1));
      return into >= 1 ? level : before + (level - before) * into;
    }
    before = level;
    startBar += section.bars;
  }
  // At the coda the loops let go over a third of a second.
  return before * Math.max(0, 1 - (t - codaAt) / 0.35);
};

// The coda, on the title's own instruments.
const coda = { left: new Float32Array(total), right: new Float32Array(total) };
const borrowed = { drone: 'drone', chords: 'pad', sub: 'bass', call: 'lead', engine: 'heart' };
for (const part of codaOn({
  // The drone opened the piece and let go of it; the ending is not where it comes back.
  drone: [],
  pad: TITLE_PARTS.pad.voices,
  low: TITLE_PARTS.bass.voices.filter((v) => v.octave === 0),
  lead: TITLE_PARTS.lead.voices,
  kit: TITLE_PARTS.heart.voices,
})) {
  const name = borrowed[part.layer];
  const buf = render(part.voices, CODA_SECONDS, false, makeRng('coda').stream(`title-${name}`));
  addRoom(buf, R, TITLE_PARTS[name].air);
  // The coda part at the same scale its loop was set to.
  const loopBuf = render(TITLE_PARTS[name].voices, TITLE_PARTS[name].bars * BAR_SECONDS, true, makeRng('music').stream(`title-${name}`));
  addRoom(loopBuf, R, TITLE_PARTS[name].air);
  const scale = 10 ** ((TARGET_DB[name] - rmsDb(loopBuf)) / 20) / MUSIC_GAIN;
  const p = panGains(TITLE_PARTS[name].pan);
  const start = Math.round(codaAt * R);
  for (let k = 0; k < buf.length && start + k < total; k++) {
    coda.left[start + k] += buf[k] * scale * p.left;
    coda.right[start + k] += buf[k] * scale * p.right;
  }
}

const track = new Float32Array(total * 2);
const pans = Object.fromEntries(names.map((n) => [n, panGains(TITLE_PARTS[n].pan)]));
const BLOCK = 64;
for (let i = 0; i < total; i += BLOCK) {
  const t = i / R;
  const levels = Object.fromEntries(names.map((n) => [n, levelAt(n, t)]));
  for (let k = 0; k < BLOCK && i + k < total; k++) {
    let left = coda.left[i + k];
    let right = coda.right[i + k];
    for (const n of names) {
      if (levels[n] <= 0) continue;
      const v = loops[n][(i + k) % loops[n].length] * levels[n];
      left += v * pans[n].left;
      right += v * pans[n].right;
    }
    track[(i + k) * 2] = Math.max(-1, Math.min(1, saturate(left * MUSIC_GAIN, MUSIC_DRIVE) * MASTER_GAIN));
    track[(i + k) * 2 + 1] = Math.max(-1, Math.min(1, saturate(right * MUSIC_GAIN, MUSIC_DRIVE) * MASTER_GAIN));
  }
}
const fade = Math.round(1.5 * R);
for (let k = 0; k < fade; k++) {
  const g = 1 - k / fade;
  track[(total - fade + k) * 2] *= g;
  track[(total - fade + k) * 2 + 1] *= g;
}

const header = Buffer.alloc(44);
const body = Buffer.alloc(track.length * 2);
header.write('RIFF', 0);
header.writeUInt32LE(36 + body.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(R, 24);
header.writeUInt32LE(R * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(body.length, 40);
for (let i = 0; i < track.length; i++) body.writeInt16LE(Math.round(Math.max(-1, Math.min(1, track[i])) * 32767), i * 2);
writeFileSync(out, Buffer.concat([header, body]));
console.log(`wrote ${out} (${(total / R).toFixed(1)} s)`);
