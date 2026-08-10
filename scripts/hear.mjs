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
//                               [--music] [--play] [--solo [--rung=run]]
//
// --solo writes ONE FILE PER LAYER at a rung's own gains, so a sound a player can hear and not name
// can be named. It is the answer to three rounds of *"the metronome"* being guessed at, and the
// reason it is a separate mode is that every other mode in this file mixes the layers together.
//
// --music writes the four loops mixed at every level of the ladder, and then the whole arc: cruise,
// the approach opening up, the boss arriving. It is the only way to hear decision 0090 without
// playing to a boss.
//
// --play writes THE GAME: the music at a rung with the gun, the missiles and the explosions over it,
// at their own cadences and at the gains the mixer actually uses.
//
// ⚠️ --play EXISTS BECAUSE EVERY OTHER MODE ANSWERS THE WRONG QUESTION, and a play-test said so:
// *"the game sound effects don't blend in with the music at all… they're timingly in sync, but the
// sound doesn't mesh."* That is a claim about the two channels TOGETHER, and until this flag the rig
// could write each of them alone and nothing could write the thing being complained about. Four mix
// passes were tuned without it. docs/decisions/0027-measure-the-picture-not-the-model.md is the rule
// and this is the debt it names, for the channel nothing can look at.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { CUES, CUE_KINDS } from '../src/content/cues.ts';
import { MASTER_GAIN, SAMPLE_RATE, cueSeconds, sampleCue, saturate, variantAt, velocitiesOf } from '../src/app/sound.ts';
import { makeRng } from '../src/sim/rng.ts';
import { bakeLoops } from '../src/app/music.ts';
import { PHRASE_SECONDS, BAR_SECONDS, LAYER_BARS, MUSIC_LADDER, MUSIC_LAYERS, MUSIC_DRIVE, MUSIC_GAIN, AURA_LAYERS, AURA_NEAR_UNITS, AURA_FAR_UNITS, STEPS_PER_BEAT } from '../src/content/music.ts';

/*
  ⚠️ **THE MUSIC BUS AS IT ACTUALLY LEAVES, AND THE RIG DID NOT HAVE IT FOR ONE COMMIT** —
  `docs/decisions/0104-the-gun-plays-a-figure.md`. `makeMusicOut` puts `saturate` on the bus at
  `MUSIC_DRIVE`, and the first version of this file went on writing the pre-shaper sum — so the
  instrument built to measure the mix was reporting a mix nobody hears, and it under-reported the
  change it had just been used to choose by about four and a half decibels.

  ⚠️ **One helper, used by BOTH modes**, because `--music` and `--play` each summed the bus in their
  own loop and either could have been fixed alone. That is the second description this whole file
  exists to avoid.
*/
const busOf = (sum) => saturate(sum * MUSIC_GAIN, MUSIC_DRIVE);
import { auraNearness } from '../src/app/music.ts';
import { SHIPS } from '../src/content/ships.ts';
import { UPGRADE_TIERS, weaponFor } from '../src/content/pickups.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';

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
  /*
    ⚠️ THE PHRASE, NOT THE SHORTEST LOOP — 0095. Layers are 2 bars and 4 bars now, and every one of
    them is indexed by ITS OWN length below. A single shared modulo would truncate the chords and the
    lead to their first two bars, so the one instrument that can judge this music would be playing a
    different piece from the game. That is exactly the class of defect 0027 is about, in the file
    written to prevent it.
  */
  const length = Math.round(PHRASE_SECONDS * SAMPLE_RATE);
  const at = (layer, i) => loops[layer][i % loops[layer].length];
  const mix = (level, repeats) => {
    const out = new Float32Array(length * repeats);
    for (let i = 0; i < out.length; i++) {
      let v = 0;
      for (const layer of MUSIC_LAYERS) v += at(layer, i) * MUSIC_LADDER[level][layer];
      out[i] = Math.max(-1, Math.min(1, busOf(v)));
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
    for (const layer of MUSIC_LAYERS) v += at(layer, i) * (from[layer] + (to[layer] - from[layer]) * t);
    arc[i] = Math.max(-1, Math.min(1, busOf(v)));
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
      v += at(layer, i) * (AURA_LAYERS.includes(layer) ? ceiling * near : ceiling);
    }
    close[i] = Math.max(-1, Math.min(1, busOf(v)));
  }
  writeFileSync(`${base}-aura.wav`, wavOf(close, SAMPLE_RATE));
  console.log(`music: ${MUSIC_LAYERS.length} loops, a ${PHRASE_SECONDS}s phrase, ${Object.keys(MUSIC_LADDER).length} levels`);
  console.log(`wrote ${base}-{${Object.keys(MUSIC_LADDER).join(',')},arc}.wav`);
  process.exit(0);
}

/*
  ── ONE LAYER AT A TIME, WHICH IS THE ONE QUESTION EVERY OTHER MODE ANSWERS BY MIXING AWAY ────────

  ⚠️ **A REPORT NAMES A SOUND AND THIS PROJECT HAS NEVER BEEN ABLE TO NAME IT BACK.** *"A note that
  almost sounds like a bell ring, which is what I've been calling the metronome sound"* is the third
  round that phrase has arrived in, and each previous round GUESSED which layer it was: 0102 answered
  it in `beat`, 0108 answered it in `engine`. Two different layers, from the same four words, with
  nothing in the repository able to settle it — and `docs/decisions/0027-measure-the-picture-not-the-model.md`
  is precisely about a channel nobody can look at being tuned from a description.

  ⚠️ **SO THE FILE NAME IS THE ANSWER.** Sixteen files, one per layer, each the layer alone through
  the same bus the game plays it through. A player who has one of them open can say *that one* and the
  guessing stops. It is the cheapest instrument in this file and it is the one that should have been
  written first.

  ⚠️ **AT THE RUNG'S OWN GAIN, AND SILENT LAYERS ARE SKIPPED RATHER THAN FAKED.** The complaint is
  about the first sixty seconds of a level, which is `run` — and eight of the sixteen layers are at
  zero there. Writing them anyway at some borrowed gain would answer *what does this layer sound
  like* when the question is *what am I hearing right now*. `--rung=boss` opens everything.
*/
if (args.has('solo')) {
  const rung = args.get('rung') ?? 'run';
  if (!(rung in MUSIC_LADDER)) {
    console.error(`unknown --rung=${rung}. Known: ${Object.keys(MUSIC_LADDER).join(', ')}`);
    process.exit(1);
  }
  const loops = bakeLoops(SAMPLE_RATE);
  const base = out.replace(/\.wav$/, '');
  // Two full phrases, so a layer whose loop is the phrase is heard coming round rather than guessed at.
  const length = Math.round(PHRASE_SECONDS * SAMPLE_RATE) * 2;
  const written = [];
  const silent = [];
  for (const layer of MUSIC_LAYERS) {
    const gain = MUSIC_LADDER[rung][layer];
    if (gain <= 0) {
      silent.push(layer);
      continue;
    }
    const solo = new Float32Array(length);
    const loop = loops[layer];
    // The same bus the mix goes through, so a layer heard here is the layer heard in the game —
    // `busOf` is shared with `--music` and `--play` for the reason stated on it.
    for (let i = 0; i < length; i++) solo[i] = Math.max(-1, Math.min(1, busOf(loop[i % loop.length] * gain)));
    writeFileSync(`${base}-solo-${layer}.wav`, wavOf(solo, SAMPLE_RATE));
    /*
      ⚠️ **THE AURA'S ROW IS A CEILING AND NOT A GAIN, AND SAYING *gain* HERE WOULD BE THE EXACT
      DEFECT THIS MODE EXISTS TO END.** `src/app/music.ts` multiplies these two by `auraFor(build,
      nearness)`, so at the START of a level — which is the rung this defaults to and the stretch the
      report is about — they are at nothing and climbing.
      `docs/decisions/0107-a-level-is-a-place.md` is the build; 0091 is the proximity. A listener
      handed `level-solo-auraSlow.wav` and told it was *what is open at `run`* would be told a
      falsehood by the instrument built to stop them being told one.
    */
    const how = AURA_LAYERS.includes(layer) ? `ceiling ${gain}, ×build — silent at level start` : `gain ${gain}`;
    written.push(`${layer} (${LAYER_BARS[layer]} bars, ${(LAYER_BARS[layer] * BAR_SECONDS).toFixed(1)}s, ${how})`);
  }
  if (written.length === 0) {
    console.error(`every layer is silent at ${rung}`);
    process.exit(1);
  }
  const heard = written.length - MUSIC_LAYERS.filter((l) => AURA_LAYERS.includes(l) && MUSIC_LADDER[rung][l] > 0).length;
  console.log(`solo at rung "${rung}" — ${heard} layers actually sounding, ${written.length} written:`);
  for (const line of written) console.log(`  ${base}-solo-${line}`);
  if (silent.length > 0) console.log(`silent at ${rung}, not written: ${silent.join(', ')}`);
  process.exit(0);
}

/*
  ── THE GAME: THE MUSIC WITH THE GAME PLAYED OVER IT ──────────────────────────────────────────────

  ⚠️ **This is the only mode that can answer the question the play-test actually asked**, which is
  about the two channels together. `--music` writes a bed nobody shoots over; the default mode writes
  cues in silence with a third of a second between them, which is a sound the player never hears once.

  ⚠️ **BOTH GAINS ARE THE MIXER'S OWN, IMPORTED RATHER THAN TYPED.** `MUSIC_GAIN × MASTER_GAIN` for
  the bed and `MASTER_GAIN` for a cue is exactly what `makeMusicOut` and `makeAudioOut` wire up, so
  the balance in this file is the balance in the game. A number restated here would keep reporting
  the old mix the day either moved — which is 0027's failure arriving inside the instrument built to
  prevent it.

  ⚠️ **The gun fires on ITS OWN GRID and the explosions do not, which is the point.** `fireEvery` and
  `missileEvery` are absolute multiples, exactly as `stepsToGrid` places them
  (`docs/decisions/0094-in-time-is-not-in-phase.md`); the kills and hits below land on arbitrary steps
  because that is where `src/app/frame.ts` fires them — on the step a collision resolves. If the
  explosions sound loose against the bed in this file, they are loose in the game.
*/
if (args.has('play')) {
  const loops = bakeLoops(SAMPLE_RATE);
  const at = (layer, i) => loops[layer][i % loops[layer].length];
  /*
    ⚠️ **Every WEIGHT of every cue, and `put` picks the one the speaker would** — 0104. A rig that
    fired the gun at full weight on every shot would be writing a file with no accents in it, which is
    the exact sound this decision exists to stop being written.
  */
  const baked = {};
  for (const kind of CUE_KINDS) {
    baked[kind] = velocitiesOf(CUES[kind]).map((v) => sampleCue(CUES[kind], SAMPLE_RATE, makeRng('cues').stream(kind), v));
  }
  const base = out.replace(/\.wav$/, '');
  const perStep = SAMPLE_RATE / STEPS_PER_SECOND;
  /*
    ⚠️ **A seeded stream of its own, so the scattered kills are the same every run.** Two files that
    differ because the rig rolled differently cannot be compared, and comparing two takes is most of
    what this rig is for — `docs/decisions/0021-one-stream-per-concern.md`.
  */
  const scatter = makeRng('hear').stream('play');

  /**
   * Lay one cue in at `step`, struck at the weight its figure gives that point in the beat.
   *
   * ⚠️ `variantAt` is the speaker's own function rather than a copy of its arithmetic, so an accent
   * pattern that moved would move here too.
   */
  const put = (into, kind, step) => {
    const start = Math.round(step * perStep);
    const data = baked[kind][variantAt(baked[kind].length, Math.round(step))];
    for (let i = 0; i < data.length; i++) {
      const j = start + i;
      if (j >= 0 && j < into.length) into[j] += data[i] * MASTER_GAIN;
    }
  };

  /**
   * Bars of `level`, with a ship at weapon/missile tier `tier` shooting and things dying.
   *
   * Returns the mix and the two halves of it separately, because *"background too quiet"* is a claim
   * about the RATIO and neither half alone can answer it.
   */
  const scene = (level, tier, bars) => {
    const steps = bars * 4 * STEPS_PER_BEAT;
    const length = Math.round(steps * perStep);
    const carried = [];
    for (let i = 0; i < tier; i++) carried.push('weapon', 'missile');
    const weapon = weaponFor(SHIPS.proof, carried);
    const bed = new Float32Array(length);
    const cues = new Float32Array(length);
    // The bed, at the mixer's own two gains.
    for (let i = 0; i < length; i++) {
      let v = 0;
      for (const layer of MUSIC_LAYERS) v += at(layer, i) * MUSIC_LADDER[level][layer];
      bed[i] = busOf(v) * MASTER_GAIN;
    }
    // The gun and the tubes, on their grids. One cue per volley, never one per barrel.
    for (let s = 0; s < steps; s += weapon.fireEvery) put(cues, 'pulse', s);
    if (weapon.launchers > 0) for (let s = 0; s < steps; s += weapon.missileEvery) put(cues, 'missile', s);
    /*
      ⚠️ **A kill about every two beats and a hit between them, on ARBITRARY steps.** That rate is a
      hand's guess at an ordinary stretch of a level rather than a measured one, and it is the only
      number in this mode that is; what it is FOR is the placement, which is not a guess — nothing
      quantises these, so `scatter` picking the step is exactly as musical as the game is.
    */
    for (let s = 0; s < steps; s += STEPS_PER_BEAT * 2) {
      put(cues, 'kill', s + Math.floor(scatter.range(0, STEPS_PER_BEAT * 2)));
      put(cues, 'hit', s + Math.floor(scatter.range(0, STEPS_PER_BEAT * 2)));
      put(cues, 'threat', s + Math.floor(scatter.range(0, STEPS_PER_BEAT * 2)));
    }
    const mix = new Float32Array(length);
    for (let i = 0; i < length; i++) mix[i] = bed[i] + cues[i];
    return { mix, bed, cues };
  };

  /** Peak, RMS and how many samples went past full scale. */
  const measure = (data) => {
    let peaked = 0;
    let sumSq = 0;
    let clipped = 0;
    for (const v of data) {
      peaked = Math.max(peaked, Math.abs(v));
      sumSq += v * v;
      if (Math.abs(v) > 1) clipped++;
    }
    return { peak: peaked, rms: Math.sqrt(sumSq / data.length), clipped };
  };

  const takes = [
    ['run', 0, 'a level opening'],
    ['run', 2, 'mid level, two of each'],
    ['surge', UPGRADE_TIERS, 'the surge, maxed'],
    ['boss', UPGRADE_TIERS, 'the boss, maxed'],
  ];
  /*
    ⚠️ **THE LAST COLUMN IS THE REPORTED DEFECT AS A NUMBER.** *"Volume levels are still way off,
    background too quiet"* is a statement about how much of what the player hears is music, and this
    is the only place in the repository that computes it. Negative decibels mean the bed is quieter
    than the things shooting over it.
  */
  console.log('take                  rung      tier  peak   rms     clip  music vs cues');
  for (const [level, tier, what] of takes) {
    const { mix, bed, cues } = scene(level, tier, 4);
    const all = measure(mix);
    const ratio = 20 * Math.log10(measure(bed).rms / measure(cues).rms);
    writeFileSync(`${base}-play-${level}-${tier}.wav`, wavOf(mix, SAMPLE_RATE));
    console.log(
      `${what.padEnd(21)} ${level.padEnd(9)} ${String(tier).padStart(4)}  ` +
        `${all.peak.toFixed(3)}  ${all.rms.toFixed(4)}  ${String(all.clipped).padStart(4)}  ` +
        `${ratio >= 0 ? '+' : ''}${ratio.toFixed(1)}dB`,
    );
  }
  console.log(`\nwrote ${base}-play-*.wav — the bed at MUSIC_GAIN × MASTER_GAIN, the cues at MASTER_GAIN`);
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
