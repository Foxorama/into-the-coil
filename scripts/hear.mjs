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
// Usage:  node scripts/hear.mjs [--out=cues.wav] [--gap=0.35] [--only=kill,blast] [--place=saurian]
//
// ⚠️ --place IS OWED BY docs/decisions/0190-a-place-owns-what-it-kills.md AND WAS NEARLY LEFT OUT.
// A place may re-voice seven of the fourteen cues, and this script read the flat `CUES` table — so
// the first hand-authored cue in the game would have been audible to the test suite and to nothing a
// person can run. docs/decisions/0184-the-measurement-reads-the-place.md is the record of what an
// instrument reading the wrong table costs: six mix decisions made against a phantom.
//                               [--music] [--play] [--solo [--rung=run]]
//                               [--level=approach [--fight=45] [--gap-units=85] [--solved]]
//
// --level writes A WHOLE LEVEL — start to boss death, at the rungs a distance decides, the ramps the
// mixer actually uses and the theme the level is in. It is the only mode that writes the SHAPE of a
// level rather than one of its arrangements, and it prints where every section boundary lands in the
// bar. docs/decisions/0116-the-rig-plays-the-level.md is why that number matters.
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
import { MASTER_GAIN, SAMPLE_RATE, cueSeconds, panFor, sampleCue, saturate, variantAt, velocitiesOf } from '../src/app/sound.ts';
import { makeRng } from '../src/sim/rng.ts';
import { bakeLoops } from '../src/app/music.ts';
import { THEME_KINDS, cueRowOf, rungOf } from '../src/content/themes.ts';
import { SOLVED_BY } from '../src/content/arrangement.ts';
import { profileOfLoops, solveLevel } from './solve-mix.mjs';
import { PHRASE_SECONDS, BAR_SECONDS, LAYER_BARS, LAYER_PAN, MUSIC_LADDER, MUSIC_LAYERS, MUSIC_DRIVE, MUSIC_GAIN, AURA_LAYERS, AURA_NEAR_UNITS, AURA_FAR_UNITS } from '../src/content/music.ts';

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
/*
  ⚠️ **AND `MASTER_GAIN` IS IN IT, WHICH IT WAS NOT** — 0114. `--music` wrote the bed at
  `MUSIC_GAIN` alone while `--play` wrote it at `MUSIC_GAIN × MASTER_GAIN`, so the two modes rendered
  the SAME music at two different reference levels. A player comparing the files heard *“a massive
  musical volume difference”* between a rung and a fight that are 0.42 and 0.48 RMS apart in the game
  — an artefact of this file, reported as a defect in the music, and very nearly tuned as one.

  ⚠️ **This is 0027 inside the instrument for the second time.** The first was the missing bus
  shaper, which under-reported a change by four and a half decibels. A rig that is not at the game's
  own gain is a rig that answers a question nobody asked.
*/
const busOf = (sum) => saturate(sum * MUSIC_GAIN, MUSIC_DRIVE) * MASTER_GAIN;
import {
  AURA_RAMP_SECONDS,
  RAMP_SECONDS,
  auraBuild,
  auraFor,
  auraNearness,
  levelWrites,
  panGains,
} from '../src/app/music.ts';
import { LEVEL_KINDS } from '../src/content/levels.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { VOLLEY_CYCLE } from '../src/content/cadence.ts';
import { UNITS_PER_SECOND, auraAt, levelTimeline, rungAt, targetGain } from './timeline.mjs';
import { UPGRADE_TIERS } from '../src/content/pickups.ts';
/*
  ⚠️ **THE ONE THING THIS SCRIPT TAKES FROM `rig/`, and the arrow points this way on purpose.**
  `rig/transport.ts` is the arithmetic of *what is sounding when*, guarded by `tests/dash.test.ts`;
  `rig/dash.ts` is the browser half and nothing imports it. A `.mjs` script importing a `.ts` module
  is what this file already does eight lines up — node strips the types.
*/
import { weaponAtTier } from '../rig/transport.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';

const args = new Map(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
/*
  ⚠️ THE PLACE, OR `undefined` FOR THE BASE COMPOSITION — 0190. `undefined` is not a fallback here,
  it is the mode this script has always had: what every level shares, which is still what six of the
  seven play.
*/
const place = args.get('place');
if (place !== undefined && !THEME_KINDS.includes(place)) {
  console.error(`unknown --place. Known: ${THEME_KINDS.join(', ')}`);
  process.exit(1);
}
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
/**
 * Each music layer's pan gains, once — `docs/decisions/0209-the-rig-hears-in-stereo.md`.
 *
 * ⚠️ **`panGains` IS THE MIXER'S OWN LAW, NOT A COPY OF IT.** `src/app/music.ts` exports it for
 * exactly this reason: a rig that re-derived equal-power panning would drift from the
 * `StereoPannerNode`s the player actually hears, which is the drift 0116 exists to refuse.
 */
const PAN_OF = {};
for (const layer of MUSIC_LAYERS) PAN_OF[layer] = panGains(LAYER_PAN[layer]);

/**
 * The music bed as an interleaved stereo buffer, at whatever gain each layer holds at each sample.
 *
 * ⚠️ **THIS EXISTS BECAUSE FOUR MODES SUMMED THE LAYERS TO ONE NUMBER AND `--level` DID NOT.**
 * `docs/decisions/0118-the-mix-has-a-width.md` gave every layer a position, and every render except
 * `--level` then threw it away — including `--play`, whose entire purpose is judging the music and
 * the cues TOGETHER. One helper rather than a fifth copy of the same loop is
 * `docs/decisions/0126-the-dashboard-is-the-instrument.md`'s *one description* applied here.
 *
 * ⚠️ **THE SHAPER IS PER CHANNEL, AND THAT IS NOT A DETAIL.** A `WaveShaperNode` on a stereo bus
 * shapes each side on its own; one curve over a mono sum and then split is a different sound. It was
 * already argued once, in `--level`, and is now argued in one place instead of two.
 */
function bedStereo(length, at, gainAt, layers = MUSIC_LAYERS) {
  const track = new Float32Array(length * 2);
  for (let i = 0; i < length; i++) {
    let left = 0;
    let right = 0;
    for (const layer of layers) {
      const v = at(layer, i) * gainAt(layer, i);
      left += v * PAN_OF[layer].left;
      right += v * PAN_OF[layer].right;
    }
    track[i * 2] = Math.max(-1, Math.min(1, busOf(left)));
    track[i * 2 + 1] = Math.max(-1, Math.min(1, busOf(right)));
  }
  return track;
}

function wavOf(samples, rate, channels = 1) {
  const header = Buffer.alloc(44);
  const body = Buffer.alloc(samples.length * 2);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + body.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  // 0118: interleaved when `channels` is 2. Every other mode still writes mono.
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
  /*
    One rung, in the width the player hears it in — 0209, replacing a mono sum.

    ⚠️ **`repeats` IS CARRIED AND WAS ALMOST DROPPED.** The mono version took it and was called with
    2, so each rung wrote two phrases; the first stereo version took only a level and silently halved
    every file. Nothing would have failed — a 25.6s file where a 51.2s one used to be is a shorter
    listen, not an error, and the only way it surfaced was reading the durations back.
  */
  const mixWide = (level, repeats) =>
    bedStereo(length * repeats, at, (layer) => MUSIC_LADDER[level][layer]);
  const order = ['run', 'run', 'approach', 'approach', 'boss', 'boss', 'boss'];
  // The ramp the gain nodes do, at the same time constant `src/app/music.ts` gives them.
  const ramp = Math.round(1.6 * SAMPLE_RATE);
  // 0209: stereo, like everything else the bed is rendered into now.
  const arc = bedStereo(length * order.length, at, (layer, i) => {
    const slot = Math.floor(i / length);
    const into = i - slot * length;
    const from = MUSIC_LADDER[order[slot]];
    const to = MUSIC_LADDER[order[Math.min(order.length - 1, slot + 1)]];
    const t = into > length - ramp ? (into - (length - ramp)) / ramp : 0;
    return from[layer] + (to[layer] - from[layer]) * t;
  });
  const base = out.replace(/\.wav$/, '');
  for (const level of Object.keys(MUSIC_LADDER)) {
    writeFileSync(`${base}-${level}.wav`, wavOf(mixWide(level, 2), SAMPLE_RATE, 2));
  }
  writeFileSync(`${base}-arc.wav`, wavOf(arc, SAMPLE_RATE, 2));

  /*
    THE AURA CLOSING IN — decision 0091, and the one thing the ladder's own levels cannot show. Every
    other file this writes is a STEP; the aura is a continuous quantity, so what has to be heard is a
    boss walking from the far end of its range to the near end while everything else holds still.
  */
  const closeLength = length * 4;
  const close = bedStereo(closeLength, at, (layer, i) => {
    const t = i / closeLength;
    const gap = AURA_FAR_UNITS + 10 - t * (AURA_FAR_UNITS + 10 - AURA_NEAR_UNITS);
    const ceiling = MUSIC_LADDER.boss[layer];
    return AURA_LAYERS.includes(layer) ? ceiling * auraNearness(gap) : ceiling;
  });
  writeFileSync(`${base}-aura.wav`, wavOf(close, SAMPLE_RATE, 2));
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
  /*
    ⚠️ **A PLACE, BECAUSE THIS MODE COULD ONLY EVER HEAR LEVEL ONE AND THERE ARE SEVEN** —
    `docs/decisions/0152-a-layer-is-heard-in-the-sum.md`. Reported: *"the dashboard shows me what is
    supposedly playing… arp is not audible at all"*, of Ember Nebula. `bakeLoops` took no theme here,
    so the one instrument built to isolate a layer rendered **the base composition's** arp whatever
    place the report was about — and six of the seven places re-voice that layer.

    ⚠️ **THAT IS THE DEFECT THIS MODE EXISTS TO END, ARRIVING INSIDE THE MODE ITSELF.** The comment
    above is about a report naming a sound that nothing could name back; a soloed layer from the wrong
    place is the same failure with an answer confident enough to act on.
  */
  const theme = args.get('theme');
  if (theme !== undefined && !THEME_KINDS.includes(theme)) {
    console.error(`unknown --theme=${theme}. Known: ${THEME_KINDS.join(', ')}`);
    process.exit(1);
  }
  const loops = bakeLoops(SAMPLE_RATE, theme);
  const base = out.replace(/\.wav$/, '');
  // Two full phrases, so a layer whose loop is the phrase is heard coming round rather than guessed at.
  const length = Math.round(PHRASE_SECONDS * SAMPLE_RATE) * 2;
  const written = [];
  const silent = [];
  for (const layer of MUSIC_LAYERS) {
    /*
      ⚠️ **`targetGain` AND NOT `MUSIC_LADDER` ALONE, WHICH IS THE SAME DEFECT AGAIN ONE LINE DOWN.**
      `scripts/timeline.mjs` says of it, in as many words, *"the theme is in it, and no mode of the
      rig has ever applied one"* — and this mode still did not. Ember Nebula takes `arp` to **1.66**
      at `push`, where the ladder alone says 0.64: **the file written to answer *what does this layer
      sound like* was 8 dB under what the game plays**, and the dashboard fader beside it read 1.66.

      ⚠️ **IT IS THE ONE DESCRIPTION THE DASHBOARD ALREADY USES** — `rig/transport.ts` calls this
      same function — so a soloed file and the fader now agree by construction rather than by
      inspection. `docs/decisions/0152-a-layer-is-heard-in-the-sum.md`.
    */
    const gain = targetGain(theme ?? 'approach', rung, layer, 1);
    if (gain <= 0) {
      silent.push(layer);
      continue;
    }
    const loop = loops[layer];
    /*
      The same bus the mix goes through, so a layer heard here is the layer heard in the game —
      `busOf` is shared with `--music` and `--play` for the reason stated on it.

      ⚠️ **AND AT ITS OWN POSITION — 0209.** A layer's pan is part of what it sounds like, and this
      mode exists so a sound a player can hear and cannot name can be named. Folded to the middle,
      the one thing a listener has to locate it by is thrown away — which is the same defect
      `--play` had, one layer down.
    */
    const solo = bedStereo(length, (_l, i) => loop[i % loop.length], () => gain, [layer]);
    writeFileSync(`${base}-solo-${layer}.wav`, wavOf(solo, SAMPLE_RATE, 2));
    /*
      ⚠️ **THE AURA'S ROW IS A CEILING AND NOT A GAIN, AND SAYING *gain* HERE WOULD BE THE EXACT
      DEFECT THIS MODE EXISTS TO END.** `src/app/music.ts` multiplies these two by `auraFor(build,
      nearness)`, so at the START of a level — which is the rung this defaults to and the stretch the
      report is about — they are at nothing and climbing.
      `docs/decisions/0107-a-level-is-a-place.md` is the build; 0091 is the proximity. A listener
      handed `level-solo-auraSlow.wav` and told it was *what is open at `run`* would be told a
      falsehood by the instrument built to stop them being told one.
    */
    // ⚠️ The aura is written at FULL proximity now rather than at its ceiling, because `targetGain`
    // takes the nearness as an argument and 1 is the only value that is a real moment of the game —
    // the boss at arm's length. The label says so, which is what the paragraph above requires of it.
    const how = AURA_LAYERS.includes(layer)
      ? `${gain.toFixed(2)} at full proximity — quieter for all of the level before the fight`
      : `gain ${gain.toFixed(2)}`;
    written.push(`${layer} (${LAYER_BARS[layer]} bars, ${(LAYER_BARS[layer] * BAR_SECONDS).toFixed(1)}s, ${how})`);
  }
  if (written.length === 0) {
    console.error(`every layer is silent at ${rung}`);
    process.exit(1);
  }
  // ⚠️ THROUGH rungOf SINCE 0184. This mode already resolves every GAIN through the place — see
  // targetGain above — and then counted with the shared row, so a place that opens a layer the shared
  // ladder closes was written to disk and left out of its own tally.
  const heard =
    written.length -
    MUSIC_LAYERS.filter((l) => AURA_LAYERS.includes(l) && rungOf(theme ?? 'approach', rung, l) > 0).length;
  console.log(`solo at rung "${rung}" — ${heard} layers actually sounding, ${written.length} written:`);
  for (const line of written) console.log(`  ${base}-solo-${line}`);
  if (silent.length > 0) console.log(`silent at ${rung}, not written: ${silent.join(', ')}`);
  process.exit(0);
}

/*
  ── A WHOLE LEVEL, AT THE RUNGS AND THE RAMPS AND THE PLACE THE GAME ACTUALLY USES ────────────────

  ⚠️ **`docs/decisions/0116-the-rig-plays-the-level.md`.** Every other mode in this file writes a
  RUNG. `--music` writes something it calls an arc, and it is not a level: seven equal slots of one
  phrase each, in a fixed order typed into this file, with a LINEAR fade over the last 1.6 seconds of
  each. A level is 42s / 50s / 16.1s / 10.6s, in an order a distance decides, with an EXPONENTIAL
  approach that begins the instant the rung changes.

  ⚠️ **SO THE ONE THING NOBODY COULD LISTEN TO IS THE SHAPE OF A LEVEL**, which is what six rounds of
  *"repetitive"*, *"goes nowhere"* and *"push and surge sound the same"* are all about. A rung heard
  on its own answers *what does this arrangement sound like*; the question being asked is *what does
  the next two minutes sound like*, and it has never been written to a file.

  ⚠️ **IT WALKS THE CAMERA rather than listing the rungs.** `musicLevelFor` is called with the
  distance a real camera would be at, so the boundaries land where the level puts them and a level
  retuned tomorrow is heard retuned. Typing the order in is what `--music` does and it is why that
  mode cannot show a boundary landing in the wrong place — it puts every one of them at a phrase.

  ⚠️ **AND THE THEME IS IN IT**, which no mode in this file has ever applied. `mixOf` is 0107's
  multiplier, so `--level=eye` is The Black Heart's mix and not level one's. Seven levels that a play-test
  says sound identical have never once been rendered as themselves.
*/
if (args.has('level')) {
  const kind = args.get('level') === '' ? LEVEL_KINDS[0] : args.get('level');
  if (!LEVEL_KINDS.includes(kind)) {
    console.error(`unknown --level=${kind}. Known: ${LEVEL_KINDS.join(', ')}`);
    process.exit(1);
  }
  const fightSeconds = Number(args.get('fight') ?? 45);
  const { bossAt, theme, toBoss, total: totalSeconds, marks } = levelTimeline(kind, fightSeconds);
  /*
    ⚠️ **THE PLACE'S OWN MATERIAL, AND THIS MODE IS THE ONLY ONE THAT KNOWS THE PLACE** — 0128. Baking
    without the theme would render Ember Nebula with level one's engine and level one's tune while the
    printed header said otherwise, which is exactly the class of drift
    `docs/decisions/0116-the-rig-plays-the-level.md` is named for — and the same omission `mixOf` had
    before 0116 found it.
  */
  const loops = bakeLoops(SAMPLE_RATE, theme);
  const at = (layer, i) => loops[layer][i % loops[layer].length];

  /*
    ⚠️ **THE WHOLE LEVEL AT THE SOLVED BALANCE, WHICH IS THE ONLY WAY THE CHANGE CAN BE JUDGED.**
    `scripts/hear-solved.mjs` renders one rung; six rounds of *"repetitive"* and *"goes nowhere"* are
    about the ARC, and a mix change judged a rung at a time is judged on the wrong question — this
    file's own argument for `--level` existing at all.
  */
  /*
    ⚠️ **THE WHOLE LEVEL AT ONCE, BECAUSE A RUNG IS NOT SOLVABLE ON ITS OWN ANY MORE** — 0166. Looping
    `solveMix` per rung here would render the INDEPENDENT solve while the dashboard plays the
    trajectory, which is a rendered file disagreeing with the instrument — and this file exists to be
    listened to against that instrument.
  */
  const solved = args.has('solved') ? {} : null;
  if (solved !== null) {
    const level = solveLevel(theme, loops, profileOfLoops(loops));
    for (const rung of Object.keys(MUSIC_LADDER)) solved[rung] = level[rung].gains;
  }

  /*
    ⚠️ **THE FIGHT'S GAP IS A STATED CHOICE AND NOT A MEASUREMENT**, so it is named here rather than
    left to look like one. The aura's nearness is a distance the PLAYER steers (0091), so a rig has
    no honest value for it — `--music`'s `-aura.wav` is the mode that sweeps the range. What this
    holds is the middle of the reachable span, which is where a player who is neither pressing nor
    retreating sits, and `--gap=` moves it.
  */
  const gapUnits = Number(args.get('gap-units') ?? (AURA_NEAR_UNITS + AURA_FAR_UNITS) / 2);
  const nearnessInFight = auraNearness(gapUnits);

  const total = Math.round(totalSeconds * SAMPLE_RATE);
  /*
    ⚠️ **INTERLEAVED STEREO — 0118, and the mode had to grow it or it could not show the change.** The
    pan law is `panGains`, exported from the mixer for exactly this: the game's field is made by a
    browser node, so the only alternative was this file keeping its own idea of one, which is the
    class of drift `docs/decisions/0116-the-rig-plays-the-level.md` is named for.
  */
  const track = new Float32Array(total * 2);
  const pan = {};
  for (const layer of MUSIC_LAYERS) pan[layer] = panGains(LAYER_PAN[layer]);
  /*
    ⚠️ **The gains are smoothed in BLOCKS and the audio is not.** A rung is a step function of a
    camera position, so asking `musicLevelFor` per sample is 5.3 million answers to a question that
    changes four times. 64 samples is 1.45ms — two orders of magnitude under the 1.6s time constant
    it is approximating — so nothing about the shape of the ramp is lost.
  */
  const BLOCK = 64;
  /*
    ⚠️ **`levelWrites` IS THE MIXER'S OWN DECISION AND THE RIG ASKS IT** — 0117, on
    `docs/decisions/0116-the-rig-plays-the-level.md`'s rule. A rig that smoothed toward a target on
    its own schedule would go on drawing the OLD behaviour the day the game started quantising, which
    is the third time this file would have drifted from the thing it measures.
  */
  const held = {};
  const ramp = {};
  const headingFor = {};
  for (const layer of MUSIC_LAYERS) {
    held[layer] = targetGain(theme, 'calm', layer, 0);
    ramp[layer] = { at: 0, target: held[layer], tau: RAMP_SECONDS / 3 };
  }

  for (let i = 0; i < total; i += BLOCK) {
    const second = i / SAMPLE_RATE;
    const rung = rungAt(kind, second, fightSeconds);
    const aura = auraAt(kind, second, nearnessInFight);
    // The loops begin at t = 0 here, so the anchor is zero and bar zero is the file's own start.
    for (const w of levelWrites(rung, theme, aura, 0, second, headingFor)) {
      /*
        ⚠️ **`--solved` SWAPS THE TARGET AND NOTHING ELSE** —
        `docs/decisions/0154-the-mix-is-authored-as-intent.md`. The ramps, the bar-line quantisation
        (0117), the camera walk and the aura all stay exactly as the mixer does them, so the file
        differs from the shipped one **only in the balance**, which is the one thing being judged.

        ⚠️ **THE AURA IS NEVER OVERRIDDEN**, because its target here is a live distance the walk is
        computing per block — 0091 — and the solve deliberately does not own it.
      */
      /*
        ⚠️ **`headingFor` KEEPS THE MIXER'S OWN VALUE, AND FEEDING THE SOLVED ONE BACK SILENCES THE
        FILE.** `levelWrites` uses `headingFor` to decide whether a target has CHANGED — 0117 — so
        storing the solved value there makes the mixer see a difference on *every block*, re-issue the
        write, and re-quantise `at` to the next bar line each time. The ramp start is then always in
        the future, `t >= r.at` is never true, and every gain sits at the `calm` value it was
        initialised to. **The rendered arc came out 8.7 dB down and read as a mastering problem** —
        the solve itself holds level to 0.11 dB per rung, which is what made it look like one.
      */
      headingFor[w.layer] = w.target;
      const target = solved !== null && SOLVED_BY(w.layer) ? solved[rung][w.layer] : w.target;
      ramp[w.layer] = { at: w.at, target, tau: w.tau };
    }
    for (let n = 0; n < BLOCK && i + n < total; n++) {
      const t = (i + n) / SAMPLE_RATE;
      let left = 0;
      let right = 0;
      for (const layer of MUSIC_LAYERS) {
        const r = ramp[layer];
        /*
          ⚠️ **`setTargetAtTime` HOLDS UNTIL ITS START TIME AND THEN APPROACHES**, which is the whole
          of what 0117 changed: the wait for the downbeat is in the `t >= r.at` and it is the thing
          this file has to draw honestly or the fix cannot be judged by ear.
        */
        if (t >= r.at) held[layer] += (r.target - held[layer]) * (1 - Math.exp(-1 / (SAMPLE_RATE * r.tau)));
        const v = at(layer, i + n) * held[layer];
        left += v * pan[layer].left;
        right += v * pan[layer].right;
      }
      /*
        ⚠️ **The shaper is PER CHANNEL, which is what a `WaveShaperNode` on a stereo bus does.** One
        curve applied to a mono sum and then split would be a different sound — and it is the shape of
        error 0104 found when the shaper was missing altogether.
      */
      track[(i + n) * 2] = Math.max(-1, Math.min(1, busOf(left)));
      track[(i + n) * 2 + 1] = Math.max(-1, Math.min(1, busOf(right)));
    }
  }

  const base = out.replace(/\.wav$/, '');
  writeFileSync(`${base}-level-${kind}.wav`, wavOf(track, SAMPLE_RATE, 2));

  /*
    ⚠️ **WHERE IN THE BAR EACH BOUNDARY LANDS, WHICH IS THE ONE THING A LISTENER CANNOT COUNT AND A
    RIG CAN.** A section change heard away from a downbeat does not read as a section change; it
    reads as the mix wobbling. This prints the number so the next report about *"push and surge sound
    the same"* has somewhere to look that is not a gain.
  */
  console.log(`${kind} — theme ${theme}, boss at ${bossAt} units (${toBoss.toFixed(1)}s at ${UNITS_PER_SECOND} units/s)`);
  console.log(`fight ${fightSeconds}s, aura gap held at ${gapUnits} units (nearness ${nearnessInFight.toFixed(2)})\n`);
  console.log('  rung        the game decides   beat      the music moves   beat     lasts');
  for (const { rung, second, lasts, beat, movesAt, moves } of marks) {
    console.log(
      `  ${rung.padEnd(10)} ${second.toFixed(2).padStart(14)}s ${beat.toFixed(2).padStart(7)} ` +
        `${movesAt.toFixed(2).padStart(17)}s ${moves.beat.toFixed(2).padStart(7)}  ` +
        `${lasts.toFixed(1).padStart(7)}s ${moves.onBar ? '' : '<-- MID-BAR'}`,
    );
  }
  const decidedOff = marks.slice(1).filter((m) => !m.onBar).length;
  const heardOff = marks.slice(1).filter((m) => !m.moves.onBar).length;
  /*
    ⚠️ **TWO NUMBERS, BECAUSE THEY ARE TWO DIFFERENT CLAIMS** — 0117. The first is where a camera
    crossed a distance and will stay ugly for ever; the second is where the player hears it, and it is
    the one that was the defect.
  */
  console.log(`\n${decidedOff} of ${marks.length - 1} rung boundaries fall mid-bar, where the camera puts them.`);
  console.log(`${heardOff} of ${marks.length - 1} are HEARD mid-bar.`);
  console.log(`wrote ${base}-level-${kind}.wav (${(total / SAMPLE_RATE).toFixed(0)}s)`);
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
    // ⚠️ THROUGH `cueRowOf` SINCE A PLACE MAY RE-VOICE A CUE — 0190, on 0184's terms.
    const row = cueRowOf(place, kind);
    baked[kind] = velocitiesOf(row).map((v) => sampleCue(row, SAMPLE_RATE, makeRng('cues').stream(kind), v));
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
  /**
   * One cue, at its own place in the field — 0209.
   *
   * ⚠️ **`across` IS WHERE IT HAPPENED AND THE RIG USED TO HAVE NO OPINION ABOUT IT.** The game pans
   * every cue through `panFor` into one of `PAN_BUCKETS` (`src/app/sound.ts`), so a kill on the left
   * of the lane arrives on the left. This mode existed to answer *"the game sound effects don't blend
   * in with the music"* — a question about two channels together — and rendered BOTH of them folded
   * to the middle, which is the one arrangement in which everything maximally collides.
   *
   * ⚠️ **THE POSITIONS ARE DRAWN, AND THAT IS A STATED MODEL RATHER THAN A MEASUREMENT.** Nothing
   * here knows where an enemy was; what is known is that they are spread across the lane, so the
   * scatter stream places them. Centre — `undefined` — is kept for the ship's own gun, which is where
   * the player's shots actually come from.
   */
  const put = (into, kind, step, across) => {
    const start = Math.round(step * perStep);
    const data = baked[kind][variantAt(baked[kind].length, Math.round(step))];
    const g = panGains(panFor(across));
    const frames = into.length / 2;
    for (let i = 0; i < data.length; i++) {
      const j = start + i;
      if (j >= 0 && j < frames) {
        into[j * 2] += data[i] * MASTER_GAIN * g.left;
        into[j * 2 + 1] += data[i] * MASTER_GAIN * g.right;
      }
    }
  };

  /**
   * Bars of `level`, with a ship at weapon/missile tier `tier` shooting and things dying.
   *
   * Returns the mix and the two halves of it separately, because *"background too quiet"* is a claim
   * about the RATIO and neither half alone can answer it.
   */
  const scene = (level, tier, bars) => {
    const steps = bars * 4 * VOLLEY_CYCLE;
    const length = Math.round(steps * perStep);
    /*
      ⚠️ **ONE DESCRIPTION OF WHAT A TIER IS, SHARED WITH THE DASHBOARD** —
      `docs/decisions/0126-the-dashboard-is-the-instrument.md`. This mode built the upgrade list
      inline; `rig/dash.ts` needs exactly the same ship, and two copies of *a tier is one of each,
      that many times* is how the WAV rig and the dashboard end up laying different guns over the
      same bed while both look right. `docs/decisions/0083-two-ladders-of-four.md` is the fact.
    */
    const weapon = weaponAtTier(tier);
    /*
      The bed, at the mixer's own two gains, and IN ITS OWN WIDTH — 0209.

      `busOf` carries MASTER_GAIN now, so applying it again here would render the bed twice as quiet
      as the game does — which is exactly the two-reference-levels bug one mode up.
    */
    const bed = bedStereo(length, at, (layer) => MUSIC_LADDER[level][layer]);
    const cues = new Float32Array(length * 2);
    // The gun and the tubes, on their grids. One cue per volley, never one per barrel.
    // The ship's own gun and tubes have no `across`: they come from where the player is, which is
    // the middle of the field as far as the cue bus is concerned.
    for (let s = 0; s < steps; s += weapon.fireEvery) put(cues, 'pulse', s);
    if (weapon.launchers > 0) for (let s = 0; s < steps; s += weapon.missileEvery) put(cues, 'missile', s);
    /*
      ⚠️ **A kill about every two beats and a hit between them, on ARBITRARY steps.** That rate is a
      hand's guess at an ordinary stretch of a level rather than a measured one, and it is the only
      number in this mode that is; what it is FOR is the placement, which is not a guess — nothing
      quantises these, so `scatter` picking the step is exactly as musical as the game is.
    */
    for (let s = 0; s < steps; s += VOLLEY_CYCLE * 2) {
      // 0209: and each one somewhere in the lane, because that is where the thing that made it was.
      put(cues, 'kill', s + Math.floor(scatter.range(0, VOLLEY_CYCLE * 2)), scatter.range(0, ACROSS_SPAN));
      put(cues, 'hit', s + Math.floor(scatter.range(0, VOLLEY_CYCLE * 2)), scatter.range(0, ACROSS_SPAN));
      put(cues, 'threat', s + Math.floor(scatter.range(0, VOLLEY_CYCLE * 2)), scatter.range(0, ACROSS_SPAN));
    }
    /*
      ⚠️ **THE BOSS FIRES IN THE BOSS TAKES, AND UNTIL NOW IT DID NOT** — 0114. `bossShot` is the
      loudest cue in the game and a fight is the only place it sounds, so a boss take without it was
      measuring a quieter fight than the player ever hears. It is what the report *“the boss music was
      better, but too subdued and quiet against the game sfx themselves”* is largely about, and this
      rig could not see it.

      ⚠️ **On the boss's own cadence rather than scattered**, because it IS quantised (0096) — unlike
      the kills and hits above, which nothing snaps.
    */
    if (level === 'boss' || level === 'bossPeak') {
      for (let s = 0; s < steps; s += VOLLEY_CYCLE * 3) put(cues, 'bossShot', s);
    }
    // Interleaved, so the sum is over both channels — 0209.
    const mix = new Float32Array(length * 2);
    for (let i = 0; i < mix.length; i++) mix[i] = bed[i] + cues[i];
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
    ['boss', UPGRADE_TIERS, 'the boss arrives, maxed'],
    ['bossPeak', UPGRADE_TIERS, 'the boss at its peak, maxed'],
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
    writeFileSync(`${base}-play-${level}-${tier}.wav`, wavOf(mix, SAMPLE_RATE, 2));
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
  const row = cueRowOf(place, kind);
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
