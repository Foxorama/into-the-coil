// The shipped mix and the solved one, side by side, as stereo files a human can A/B.
//
// Usage:  node scripts/hear-solved.mjs [theme] [--rung=push] [--seconds=26]
//
// ⚠️ IT EXISTS BECAUSE A MIX CHANGE JUDGED FROM A TABLE IS THE MISTAKE THIS PROJECT KEEPS MAKING —
// docs/decisions/0027-measure-the-picture-not-the-model.md, for the channel nothing can look at.
// docs/decisions/0154-the-mix-is-authored-as-intent.md solves every layer onto a role's target and
// the numbers all land; whether the RESULT is music is a question only an ear answers.
//
// ⚠️ STEREO, BECAUSE THE WHOLE FINDING IS ABOUT MASKING AND MASKING IS PER EAR. 0118 gave every
// layer a place and no rendered file has ever used it — a mono render of this change would flatten
// the one axis it is most about. `panGains` is the game's own law, imported rather than restated.
//
// ⚠️ THROUGH THE GAME'S OWN BUS, so a difference heard here is a difference the game makes:
// MUSIC_GAIN, then `saturate` at MUSIC_DRIVE, then MASTER_GAIN — the chain `makeMusicOut` builds.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bakeLoops, panGains } from '../src/app/music.ts';
import { MASTER_GAIN, SAMPLE_RATE, saturate } from '../src/app/sound.ts';
import {
  AURA_LEVEL_CEILING,
  LAYER_PAN,
  MUSIC_DRIVE,
  MUSIC_GAIN,
  MUSIC_LADDER,
  MUSIC_LAYERS,
} from '../src/content/music.ts';
import { THEME_KINDS, mixOf } from '../src/content/themes.ts';
import { solveLevel } from './solve-mix.mjs';

const args = process.argv.slice(2);
const rung = args.find((a) => a.startsWith('--rung='))?.slice('--rung='.length) ?? 'push';
const seconds = Number(args.find((a) => a.startsWith('--seconds='))?.slice('--seconds='.length) ?? 26);
const theme = args.find((a) => !a.startsWith('--')) ?? 'nebula';

if (!THEME_KINDS.includes(theme)) {
  console.error(`no such place: ${theme}. One of ${THEME_KINDS.join(', ')}.`);
  process.exit(1);
}
if (!(rung in MUSIC_LADDER)) {
  console.error(`no such rung: ${rung}. One of ${Object.keys(MUSIC_LADDER).join(', ')}.`);
  process.exit(1);
}

const root = fileURLToPath(new URL('..', import.meta.url));
const bus = (sum) => saturate(sum * MUSIC_GAIN, MUSIC_DRIVE) * MASTER_GAIN;

function wavOf(samples, rate, channels) {
  const header = Buffer.alloc(44);
  const body = Buffer.alloc(samples.length * 2);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + body.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2 * channels, 28);
  header.writeUInt16LE(2 * channels, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(body.length, 40);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    body.writeInt16LE(Math.round(clamped * 32767), i * 2);
  }
  return Buffer.concat([header, body]);
}

/** The mix at `gains`, interleaved stereo, through the bus. */
function render(loops, gains, length) {
  const out = new Float32Array(length * 2);
  for (const layer of MUSIC_LAYERS) {
    const gain = gains[layer];
    if (gain <= 0) continue;
    const loop = loops[layer];
    const { left, right } = panGains(LAYER_PAN[layer]);
    for (let i = 0; i < length; i++) {
      const v = loop[i % loop.length] * gain;
      out[i * 2] += v * left;
      out[i * 2 + 1] += v * right;
    }
  }
  for (let i = 0; i < out.length; i++) out[i] = bus(out[i]);
  return out;
}

const loops = bakeLoops(SAMPLE_RATE, theme);
// ⚠️ **THE LEVEL IS SOLVED AND THEN ONE RUNG IS TAKEN OUT OF IT** — 0166. A rung solved alone is the
// independent solve; rendering that would hand a listener a file the dashboard does not play.
const { shipped, gains, offset } = solveLevel(theme, loops)[rung];
const length = Math.round(seconds * SAMPLE_RATE);

const base = resolve(root, `${theme}-${rung}`);
const a = render(loops, shipped, length);
const b = render(loops, gains, length);

/*
  ── THE TWO FILES ARE LEVEL-MATCHED ON THE RENDERED AUDIO, AND ESTIMATING IT WAS WRONG ───────────

  ⚠️ **`solveMix` HOLDS THE SUMMED POWER OF THE LOOPS AND THAT IS NOT THE OUTPUT LEVEL.** A power sum
  assumes the layers are uncorrelated; they are emphatically not — `sub`, `engine` and `groove` all
  strike the same downbeat in the same key — so a bass-heavy mix sums far higher in AMPLITUDE than in
  power. Held to 0.11 dB by the solve's own arithmetic, the rendered arc came out **8.7 dB apart**.

  ⚠️ **AND AN UNMATCHED A/B IS WORSE THAN NO A/B**, because the quieter file is judged thin and the
  verdict is about this script. Measuring the actual samples is the only honest way to match them,
  and it costs one pass over audio that has already been rendered.

  ⚠️ **THE DIFFERENCE IS REPORTED RATHER THAN HIDDEN.** If the solved balance genuinely needs a
  master trim to reach the shipped loudness, that is a real finding about the change and belongs in
  the output — it is a level question, separate from the balance being judged here.
*/
const rmsOf = (x) => {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return Math.sqrt(s / x.length);
};
const trim = rmsOf(a) / rmsOf(b);
for (let i = 0; i < b.length; i++) b[i] *= trim;

writeFileSync(`${base}-shipped.wav`, wavOf(a, SAMPLE_RATE, 2));
writeFileSync(`${base}-solved.wav`, wavOf(b, SAMPLE_RATE, 2));

const nearness = rung === 'boss' || rung === 'bossPeak' ? 1 : AURA_LEVEL_CEILING;
console.log(`${theme} / ${rung} — ${seconds}s, stereo, through the game's bus`);
console.log(`  ${base}-shipped.wav   MUSIC_LADDER x mixOf, aura at ${nearness}`);
console.log(`  ${base}-solved.wav    the arrangement, anchored ${offset >= 0 ? '+' : ''}${offset.toFixed(1)} dB off the stated targets`);
console.log(
  `\nlevel-matched on the rendered audio: the solved mix was ${(-20 * Math.log10(trim)).toFixed(1)} dB ` +
    `${trim > 1 ? 'quieter' : 'louder'} and has been trimmed to match. A master trim of that size is what ` +
    `wiring this in would cost in loudness — a separate question from the balance.`,
);
console.log('\nthe layers that move most:');
const moved = MUSIC_LAYERS.filter((l) => shipped[l] > 0)
  .map((l) => ({ l, db: 20 * Math.log10(gains[l] / shipped[l]) }))
  .sort((a, b) => Math.abs(b.db) - Math.abs(a.db))
  .slice(0, 6);
for (const { l, db } of moved) console.log(`  ${l.padEnd(10)} ${db >= 0 ? '+' : ''}${db.toFixed(1)} dB`);
