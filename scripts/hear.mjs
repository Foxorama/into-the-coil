// The cue rig — every sound the game can make, written to a file a human can play.
//
// docs/decisions/0027-measure-the-picture-not-the-model.md owes an eyes-on rig BEFORE the first
// tuning pass on anything the player watches move, and names the failure it exists for: the
// predecessor spent eight passes improving a model that was already right while the thing the player
// watched did not move. Sound has the same shape and one thing worse — nothing in a test suite can
// hear, so every assertion about audio is necessarily about the model. This is the other instrument.
//
// ⚠️ IT WRITES WHAT THE GAME PLAYS, not an approximation of it. `sampleCue` is the function
// `src/app/sound.ts` bakes with, imported rather than re-implemented, and the noise comes from the
// same seeded stream — so the file below is sample-for-sample what a browser puts through the
// speakers. That is what decision 0021's seeded generator buys here, and it is why `Math.random`
// would have cost more than it looked like it was saving.
//
// ⚠️ IT FAILS LOUD, per the note in scripts/trace-frame.mjs: a tool whose only job is to produce an
// artefact for a human must exit non-zero when it produces nothing.
//
// Usage:  node scripts/hear.mjs [--out=cues.wav] [--gap=0.35] [--only=kill,blast] [--music]
//
// --music writes the four loops mixed at every level of the ladder, and then the whole arc: cruise,
// the approach opening up, the boss arriving. It is the only way to hear decision 0090 without
// playing to a boss.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { CUES, CUE_KINDS } from '../src/content/cues.ts';
import { SAMPLE_RATE, cueSeconds, sampleCue } from '../src/app/sound.ts';
import { makeRng } from '../src/sim/rng.ts';
import { bakeLoops } from '../src/app/music.ts';
import { LOOP_SECONDS, MUSIC_LADDER, MUSIC_LAYERS, MUSIC_GAIN, AURA_LAYERS, AURA_NEAR_UNITS, AURA_FAR_UNITS } from '../src/content/music.ts';
import { auraNearness } from '../src/app/music.ts';

const args = new Map(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const root = fileURLToPath(new URL('..', import.meta.url));
const out = resolve(root, args.get('out') ?? 'cues.wav');
const gap = Number(args.get('gap') ?? 0.35);
const only = args.get('only')?.split(',').filter(Boolean);

const kinds = only ? CUE_KINDS.filter((k) => only.includes(k)) : [...CUE_KINDS];
if (kinds.length === 0) {
  console.error(`no cues matched --only. Known: ${CUE_KINDS.join(', ')}`);
  process.exit(1);
}

/**
 * Sixteen-bit PCM, mono, at the rate the game bakes at.
 *
 * ⚠️ Sixteen bit rather than float, because the point is a file that opens in whatever the reader
 * has. The cues never exceed full scale (tests/sound.test.ts asserts it), so the conversion is a
 * scale rather than a limiter — and the clamp below is a guard against that assertion being wrong,
 * not a normal path.
 */
function wavOf(samples, rate) {
  const header = Buffer.alloc(44);
  const body = Buffer.alloc(samples.length * 2);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + body.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(body.length, 40);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    body.writeInt16LE(Math.round(clamped * 32767), i * 2);
  }
  return Buffer.concat([header, body]);
}

/*
  THE MUSIC — decision 0090, and the only way to hear it without playing all the way to a boss.

  ⚠️ It writes the ARC as well as the levels, because the levels on their own answer the wrong
  question. What was asked for is a build — *"an increased beat and bass leading into the boss fight
  and really get pumping as the boss appears"* — and a build is a thing that happens between two
  states, not either of them.
*/
if (args.has('music')) {
  const loops = bakeLoops(SAMPLE_RATE);
  const length = Math.round(LOOP_SECONDS * SAMPLE_RATE);
  const mix = (level, repeats) => {
    const out = new Float32Array(length * repeats);
    for (let i = 0; i < out.length; i++) {
      let v = 0;
      for (const layer of MUSIC_LAYERS) v += loops[layer][i % length] * MUSIC_LADDER[level][layer];
      out[i] = Math.max(-1, Math.min(1, v * MUSIC_GAIN));
    }
    return out;
  };
  const order = ['run', 'run', 'approach', 'approach', 'boss', 'boss', 'boss'];
  const arc = new Float32Array(length * order.length);
  // The ramp the gain nodes do, at the same time constant `src/app/music.ts` gives them.
  const ramp = Math.round(1.6 * SAMPLE_RATE);
  for (let i = 0; i < arc.length; i++) {
    const slot = Math.floor(i / length);
    const into = i - slot * length;
    const from = MUSIC_LADDER[order[slot]];
    const to = MUSIC_LADDER[order[Math.min(order.length - 1, slot + 1)]];
    const t = into > length - ramp ? (into - (length - ramp)) / ramp : 0;
    let v = 0;
    for (const layer of MUSIC_LAYERS) v += loops[layer][i % length] * (from[layer] + (to[layer] - from[layer]) * t);
    arc[i] = Math.max(-1, Math.min(1, v * MUSIC_GAIN));
  }
  const base = out.replace(/\.wav$/, '');
  for (const level of Object.keys(MUSIC_LADDER)) {
    writeFileSync(`${base}-${level}.wav`, wavOf(mix(level, 2), SAMPLE_RATE));
  }
  writeFileSync(`${base}-arc.wav`, wavOf(arc, SAMPLE_RATE));

  /*
    THE AURA CLOSING IN — decision 0091, and the one thing the ladder's own levels cannot show. Every
    other file this writes is a STEP; the aura is a continuous quantity, so what has to be heard is a
    boss walking from the far end of its range to the near end while everything else holds still.
  */
  const close = new Float32Array(length * 4);
  for (let i = 0; i < close.length; i++) {
    const t = i / close.length;
    const gap = AURA_FAR_UNITS + 10 - t * (AURA_FAR_UNITS + 10 - AURA_NEAR_UNITS);
    const near = auraNearness(gap);
    let v = 0;
    for (const layer of MUSIC_LAYERS) {
      const ceiling = MUSIC_LADDER.boss[layer];
      v += loops[layer][i % length] * (AURA_LAYERS.includes(layer) ? ceiling * near : ceiling);
    }
    close[i] = Math.max(-1, Math.min(1, v * MUSIC_GAIN));
  }
  writeFileSync(`${base}-aura.wav`, wavOf(close, SAMPLE_RATE));
  console.log(`music: ${MUSIC_LAYERS.length} loops of ${LOOP_SECONDS}s, ${Object.keys(MUSIC_LADDER).length} levels`);
  console.log(`wrote ${base}-{${Object.keys(MUSIC_LADDER).join(',')},arc}.wav`);
  process.exit(0);
}

const silence = Math.round(gap * SAMPLE_RATE);
const pieces = [];
let total = 0;
let peak = 0;

console.log(`cue           layers  seconds  gain  hold  twin`);
for (const kind of kinds) {
  const row = CUES[kind];
  // The same stream the game bakes this cue from — one per kind, per decision 0021.
  const samples = sampleCue(row, SAMPLE_RATE, makeRng('cues').stream(kind));
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  pieces.push(samples, new Float32Array(silence));
  total += samples.length + silence;
  console.log(
    `${kind.padEnd(13)} ${String(row.layers.length).padStart(6)}  ${cueSeconds(row).toFixed(2).padStart(7)}  ` +
      `${row.gain.toFixed(2)}  ${String(row.hold).padStart(4)}  ${row.twin}`,
  );
}

const joined = new Float32Array(total);
let at = 0;
for (const piece of pieces) {
  joined.set(piece, at);
  at += piece.length;
}

writeFileSync(out, wavOf(joined, SAMPLE_RATE));

const seconds = total / SAMPLE_RATE;
if (peak <= 0) {
  console.error('every cue baked to silence — the synthesiser produced nothing');
  process.exit(1);
}
console.log(`\n${kinds.length} cues, ${seconds.toFixed(1)}s, peak ${peak.toFixed(3)} of full scale`);
console.log(`wrote ${out}`);
