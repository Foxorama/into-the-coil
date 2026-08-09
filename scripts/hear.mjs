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
// Usage:  node scripts/hear.mjs [--out=cues.wav] [--gap=0.35] [--only=kill,blast]

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { CUES, CUE_KINDS } from '../src/content/cues.ts';
import { SAMPLE_RATE, cueSeconds, sampleCue } from '../src/app/sound.ts';
import { makeRng } from '../src/sim/rng.ts';

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
