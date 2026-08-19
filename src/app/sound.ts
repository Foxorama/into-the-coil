/**
 * Sound: the cue table turned into samples at boot, and played back one buffer at a time.
 *
 * `docs/decisions/0072-a-cue-is-baked-and-played.md`.
 *
 * ── THE WHOLE ARGUMENT, IN ONE SENTENCE ─────────────────────────────────────────────────────────
 *
 * `docs/decisions/0022-frame-rate-is-a-feature.md` says **art is baked to bitmaps and blitted**;
 * this file is that sentence with the nouns changed. Every cue is synthesised once into an
 * `AudioBuffer` — the same relationship `src/render/bake.ts` has with the atlas — and a cue during
 * play is a one-shot source pointed at a buffer that already exists. The alternative, an oscillator
 * and an envelope built per shot, is the audio spelling of baking in the frame loop.
 *
 * It also keeps `docs/decisions/0003-single-file-build.md`: there is nothing to ship beside the page,
 * because the sounds are six numbers a row and a hundred lines of arithmetic.
 *
 * ── WHY THIS IS `app/` ──────────────────────────────────────────────────────────────────────────
 *
 * `docs/decisions/0015-the-layer-ladder.md` names it outright — `app/` is *"the shell: boot, the rAF
 * loop, input, audio, wiring"* — and its probe plants **`src/audio/`** as an example of the violation
 * the layer table exists to catch. So there is no new layer here and there was never a question.
 *
 * ── THE THREE HALVES, AND WHY THEY ARE SEPARATE ─────────────────────────────────────────────────
 *
 * 1. `sampleCue` — a row and a generator in, a `Float32Array` out. **No browser anywhere in it**,
 *    which is what lets `scripts/hear.mjs` write every cue to a `.wav` a human can listen to without
 *    launching the game. `docs/decisions/0027-measure-the-picture-not-the-model.md` owes an eyes-on
 *    rig before the first tuning pass on anything the player watches move; this is the same debt for
 *    the channel nothing can look at.
 * 2. `makeSpeaker` — **when** a cue may sound: the mute, the per-cue hold, the voice cap. Pure
 *    counting, no audio, so `tests/sound.test.ts` drives it directly.
 * 3. `makeAudioOut` — the only part that knows Web Audio exists.
 *
 * ⚠️ **The split is not tidiness, it is the only way the middle half is testable.** A speaker that
 * owned its own `AudioContext` could only be checked by a browser, and the two things most likely to
 * be wrong — a hold that never expires, a cap that counts the wrong thing — are arithmetic.
 *
 * ── ON THE FRAME BUDGET, STATED RATHER THAN ASSUMED ─────────────────────────────────────────────
 *
 * ⚠️ **This file is reached from a step and it allocates, and `tests/budget.test.ts` lists it as
 * deliberately cold with that reason.** A one-shot `AudioBufferSourceNode` is the platform's only way
 * to play a buffer — it cannot be pooled, because the spec forbids restarting one. So the allocation
 * is not removable, and it is bounded instead.
 *
 * ⚠️ **THE BOUND IS DERIVED NOW AND IT USED TO BE TYPED** —
 * `docs/decisions/0183-a-cue-is-limited-rather-than-refused.md`. `MAX_VOICES` was 4 and a fifth cue
 * on a step was DROPPED. What bounds the allocation instead is `hold`: every cue's is at least two
 * steps, so a kind sounds at most once per step and the ceiling is `CUE_KINDS.length` — **counted
 * from the table rather than chosen**, which is
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md`'s move done properly.
 */

import {
  CUES,
  CUE_KINDS,
  CUE_PAN_LIMIT,
  MAX_CUE_SECONDS,
  type CueKind,
  type CueLayer,
  type CueRow,
} from '../content/cues.ts';
import { ACROSS_SPAN } from '../sim/camera.ts';
import { makeMusicOut, bakeLoops, layerNotes, type MusicOut } from './music.ts';
import { bakedBy, type ThemeKind } from '../content/themes.ts';
import { MUSIC_LAYERS, type MusicLayer } from '../content/music.ts';
/*
  ⚠️ **THE CUE GRID COMES FROM THE GAMEPLAY CLOCK NOW, NOT FROM THE MUSIC** — 0159. `FIRE_GRID` and
  the cycle below used to be `STEPS_PER_BEAT`-derived, so *the sixteenth a cue lands on* was a
  statement about the beat. It is the same lattice at the same values; what it no longer claims is
  that the music is on it. **Whether a cue should follow the tune is the open question 0159 hands
  on**, and this import is where the answer will land.
*/
import { FIRE_GRID, VOLLEY_CYCLE } from '../content/cadence.ts';
import { makeRng, type Rng } from '../sim/rng.ts';

/**
 * The prefixed constructor older iOS still ships, declared rather than cast.
 *
 * ⚠️ `docs/decisions/0016-a-hub-enumerates-kinds.md` bans `any` and compiler suppressions on sight,
 * and the usual way this vendor name is reached is one of the two. A declaration is the honest form:
 * it says the property may not be there, and the code below has to handle that.
 *
 * ⚠️ **The suppression's own name could not be written in the sentence above**, because
 * `tests/registry.test.ts` scans the RAW source for it — comments included, deliberately, since a
 * stripper would hide exactly what is being looked for. The guard was right and this comment was
 * reworded; that is the ladder `docs/scaffold-plan.md` puts *remove the affordance* at the top of,
 * working on prose.
 */
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

/**
 * The rate every cue is baked at, in Hz.
 *
 * ⚠️ **IT WAS 22050 AND THE ARGUMENT FOR IT WAS PART OF THE PROBLEM** —
 * `docs/decisions/0089-a-cue-has-a-body.md`. *"The band limit is audibly the one an arcade cabinet
 * had"* was true and was a description of the thing the play-test rejected: an 11 kHz ceiling has no
 * air above it at all, and it is where a naive square's harmonics fold back hardest.
 *
 * ⚠️ **It costs nothing that ships.** The bake is CODE, not data — 0072's whole point — so the
 * single-file build is exactly the size it was; what doubles is about twenty milliseconds of
 * synthesis at the first press and the RAM the buffers sit in.
 *
 * An `AudioBuffer` may carry a rate the context does not run at; the browser resamples it on
 * playback, so the samples are the same on every device and the `.wav` `scripts/hear.mjs` writes is
 * what actually plays.
 */
export const SAMPLE_RATE = 44100;

/*
  ── `MAX_VOICES` WAS 4 AND A FIFTH CUE ON A STEP WAS DROPPED ─────────────────────────────────────

  ⚠️ **`docs/decisions/0183-a-cue-is-limited-rather-than-refused.md`**, answering *"let's remove the
  max voices."* It called itself *the frame budget's audio twin* and it was doing two jobs: bounding
  the allocation, and keeping the summed cues inside full scale. **Neither one needed a number.**

  ⚠️ **THE ALLOCATION IS BOUNDED BY `hold`, WHICH ALREADY EXISTED.** No cue's hold is under two
  steps, so a kind sounds at most once per step and the worst case is `CUE_KINDS.length` — a bound
  read off the table rather than typed over it, and one that moves when the table does.

  ⚠️ **AND THE LEVEL IS BOUNDED BY `CUE_LIMIT` BELOW**, which is a shaper on the bus rather than a
  refusal at the gate. A cap silences an event that happened; a limiter plays every one of them and
  leans on the loud instant, which is what a mix bus is for.
*/

/**
 * The share of full scale the CUES get, under the bus limiter that catches what it does not.
 *
 * ⚠️ **0.55 → 0.45 → 0.40, and the SECOND move is the one that matters** —
 * `docs/decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md`. The first was measured and
 * the same report came back: *"main sfx need to be lowered a bit, background music needs to be
 * raised a bit"*, said about the build the first move shipped in. A ratio computed from peaks was
 * not what the ear was reporting on, and 0092 has why.
 *
 * ⚠️ **The cues stay ahead of the music PERCEPTUALLY and no longer do at the peak, which is the
 * distinction 0092 draws.** `docs/decisions/0024-the-accessibility-floor-is-settings.md` makes every
 * cue information — a shield taken, a hit that did not land — and the music is not. But a cue is a
 * transient against a sustained bed: four of the loudest cues at once is a rare instant and the
 * music's peak is every kick, so holding the first above the second buys nothing the player can hear
 * and costs the thing they asked for twice.
 *
 * ⚠️ **AND IT IS NO LONGER THE WHOLE STORY** — 0183. This is what the cues are scaled BY; `CUE_LIMIT`
 * is what catches the instant that scaling was never going to cover, which is what let the voice cap
 * go. The number here has not moved and is still the one two reports settled.
 *
 * ⚠️ **EXPORTED FOR `scripts/hear.mjs`, WHICH IS THE ONLY THING THAT MAY READ IT.** The rig mixes
 * cues against music to hear the balance the player hears; a `0.4` typed into the rig would be a
 * second description of the mix, and the rig would go on reporting the old balance the day this
 * moved — the exact failure `docs/decisions/0027-measure-the-picture-not-the-model.md` is about,
 * arriving in the instrument built to prevent it.
 */
export const MASTER_GAIN = 0.4;

/** How long every cue takes to reach full amplitude, in seconds — short enough to read as an attack. */
const ATTACK_SECONDS = 0.004;

/**
 * How many time constants of exponential decay a cue spends.
 *
 * At 5, the tail is at 0.7% of peak when `seconds` runs out, which is inaudible — so the fade below
 * has almost nothing to do and cannot be heard doing it.
 */
const DECAY = 5;

/**
 * How long a cue takes to ramp to silence at the very end, in seconds.
 *
 * ── THIS LINE WAS DELETED ON EVIDENCE AND IS BACK ON EVIDENCE ───────────────────────────────────
 *
 * ⚠️ **0072 removed a fade-out here after a probe proved it could not matter, and the proof was
 * sound at the time.** With one oscillator and one shared `DECAY` of 5, the envelope was already at
 * 0.7% of peak when the buffer ended — a hundred times below where a click is audible — so the ramp
 * was defending a discontinuity the decay had already removed. `npm run prove` reported STILL GREEN
 * and the line went.
 *
 * ⚠️ **`docs/decisions/0089-a-cue-has-a-body.md` breaks the premise, not the reasoning.** A layer
 * carries its own `curve`, and a long rumble uses 1.4 — which ends at **25% of peak**, not 0.7%.
 * `tests/sound.test.ts` said so within the hour: *missile is still sounding when its buffer ends*.
 * The fade is load-bearing now in a way it never was, and this comment is here so the next person to
 * find 0072's argument does not delete it a second time.
 *
 * ⚠️ **Six milliseconds: long enough to remove a step, short enough that nothing can hear it end.**
 */
const RELEASE_SECONDS = 0.006;

/**
 * The resonance a lowpass gets when a layer does not name one, and the one a highpass always gets.
 *
 * ⚠️ **The highpass's is not a knob and should not become one.** Its whole job is to take the box out
 * of a noise body (`docs/decisions/0089-a-cue-has-a-body.md`); resonance at the corner would put a
 * peak back exactly where the peak is being removed from.
 */
const LOW_Q = 0.7;
const HIGH_Q = 0.6;

/**
 * PolyBLEP: what stops a square or a saw aliasing.
 *
 * ⚠️ **This is a real part of what *"too tinny, way too Atari 2600"* was** — 0089. A naive square
 * steps between two values, and every harmonic it produces above half the sample rate folds back down
 * to a frequency that is not a harmonic of anything. That is the harsh, cheap-digital edge, and at
 * this project's old 22 kHz it was worst on `pulse`, the sound the player hears most.
 *
 * Two lines of correction at each discontinuity and the folded partials go away.
 */
function blep(t: number, dt: number): number {
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
}

/**
 * A topology-preserving state-variable filter — lowpass and highpass out of one state.
 *
 * ⚠️ **THE SINGLE MOST IMPORTANT FUNCTION IN THIS FILE, and the game had nothing like it.** A boom
 * *is* noise behind a falling cutoff; the same noise unfiltered is a hiss, which is what every
 * explosion in the game used to be. The highpass is the other end: 130–300 Hz is the band that reads
 * as *inside a tin shed*, and a body that is not high-passed above it sits there.
 *
 * ⚠️ **Topology-preserving rather than the textbook Chamberlin form**, because a cutoff that sweeps
 * across most of the audible range in a fifth of a second walks the naive one straight into
 * instability, and an unstable filter is not a wrong sound — it is a `NaN` in a buffer.
 */
function makeFilter(): (x: number, cutoff: number, q: number) => { low: number; high: number } {
  let ic1 = 0;
  let ic2 = 0;
  return (x, cutoff, q) => {
    // Clamped under half the sample rate: `tan` goes to infinity at Nyquist, and a sweep authored
    // against one rate is played back at whatever `bakeCues` was given.
    const g = Math.tan((Math.PI * Math.min(Math.max(cutoff, 10), rateCeiling * 0.45)) / rateCeiling);
    const k = 1 / Math.max(0.5, q);
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const v3 = x - ic2;
    const v1 = a1 * ic1 + a2 * v3;
    const v2 = ic2 + a2 * ic1 + g * a2 * v3;
    ic1 = 2 * v1 - ic1;
    ic2 = 2 * v2 - ic2;
    return { low: v2, high: x - k * v1 - v2 };
  };
}

/**
 * The rate the filters are running at. Set by `sampleCue` before any layer is rendered.
 *
 * ⚠️ **Module state, which this project otherwise avoids, and the alternative was worse**: threading
 * the rate through `makeFilter` and both of its call sites per sample. The bake is single-threaded,
 * runs once, and is the only caller — `tests/sound.test.ts` bakes at two rates in one process and is
 * what would catch this if it ever stopped being true.
 */
let rateCeiling = SAMPLE_RATE;

/**
 * Soft saturation. What *meaty* is made of — harmonics from squashing, not from adding notes.
 *
 * Normalised by the same curve at unity, so raising `amount` adds harmonics without also adding
 * level: a drive that got louder would be indistinguishable from a gain in every guard below.
 *
 * ⚠️ **EXPORTED, because the MUSIC BUS runs through it too** —
 * `docs/decisions/0104-the-gun-plays-a-figure.md`. It is a `WaveShaperNode`'s curve there rather than
 * a per-sample call, and the reason it is this function and not a `DynamicsCompressorNode` is that a
 * compressor has an attack and a release: `tests/music.test.ts` could not model one, so the guard
 * that holds the mix would have to be weakened to admit it. This is **stateless and deterministic**,
 * so the guard applies the identical arithmetic and stays a real check.
 *
 * ⚠️ **Normalisation is what makes it an UPWARD compressor and that is the whole gain.** The slope at
 * zero is `k / tanh(k)`, so quiet passages come up while peaks are held at unity — which is exactly
 * what a bus with a 12 dB crest factor and 5 dB of unused headroom needs.
 */
export function saturate(x: number, amount: number): number {
  if (amount <= 0) return x;
  const k = 1 + amount * 6;
  return Math.tanh(x * k) / Math.tanh(k);
}

/**
 * How many points the limiter's curve is sampled at.
 *
 * ⚠️ **Odd, so that zero is a sample and not an interpolation between two.** An even count puts the
 * origin between points and the browser's linear read makes silence a hair off silence.
 */
const CURVE_POINTS = 1025;

/**
 * The threshold the cue bus runs clean up to, as a share of full scale.
 *
 * ⚠️ **0.8 IS WHERE THE FIFTH CUE IS**, which is the number this replaces. Post-`MASTER_GAIN` the
 * loudest cue peaks at 0.19 and the four loudest sum to 0.71, so **everything the retired
 * `MAX_VOICES` used to allow passes through untouched** — the shaper is identity below here. What it
 * catches is the instant a cap would have silenced.
 */
export const CUE_LIMIT = 0.8;

/**
 * A soft limiter: identity up to `threshold`, then a knee that cannot reach full scale.
 *
 * ── WHY NOT `saturate`, WHICH IS RIGHT THERE ────────────────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0183-a-cue-is-limited-rather-than-refused.md`.** `saturate` is normalised at
 * unity and is therefore an **upward** compressor — its slope at zero is `k / tanh(k)`, which at the
 * music bus's own drive is **2.82**. That is the property the music wants and the exact opposite of
 * what a cue bus needs: it would lift every quiet cue by 9 dB and rewrite a balance
 * `docs/decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md` took two reports to settle.
 *
 * ⚠️ **SO THE KNEE STARTS AT A THRESHOLD AND THE BOTTOM IS LEFT ALONE.** Below `threshold` this
 * returns `x`; above it the remaining headroom is spent asymptotically, so **no sum of cues reaches
 * 1** however many land at once.
 *
 * ⚠️ **STATELESS AND DETERMINISTIC, ON `saturate`'s OWN ARGUMENT.** A `DynamicsCompressorNode` has an
 * attack and a release that a headless guard cannot model, so the guard holding the bus would have to
 * be weakened to admit one. This is a `WaveShaperNode` curve in the browser and the identical
 * arithmetic in the test.
 */
export function limit(x: number, threshold: number): number {
  const sign = x < 0 ? -1 : 1;
  const size = x < 0 ? -x : x;
  if (size <= threshold) return x;
  const room = 1 - threshold;
  return sign * (threshold + room * Math.tanh((size - threshold) / room));
}

/**
 * One cue, synthesised.
 *
 * ⚠️ **A SEEDED generator, threaded in, exactly like everything else in this project** —
 * `docs/decisions/0021-one-stream-per-concern.md`. `Math.random` here would be defensible on the
 * grounds that noise is noise, and it would cost the two things that make this function worth
 * having: the `.wav` the rig writes would differ from the one the game plays, and a test could assert
 * nothing about the samples. Each cue gets its **own named stream**, so adding a thirteenth row
 * cannot change the twelve above it — the exact failure 0021 exists for, arriving in a new channel.
 *
 * ⚠️ **`from` and `to` are a RATE, not always a pitch** — see `src/content/cues.ts`. For the three
 * tones the phase advances at that many cycles a second; for noise it is how often a fresh random
 * value is held, which is what a chiptune noise channel's period was. One meaning, four waves.
 *
 * The sweep is exponential rather than linear because pitch is heard logarithmically: a linear ramp
 * from 880 to 330 spends most of its time in the last octave and reads as a sound that stalls.
 */
export function sampleCue(row: CueRow, rate: number, rng: Rng, velocity = 1): Float32Array {
  rateCeiling = rate;
  const length = Math.max(1, Math.round(cueSeconds(row) * rate));
  const out = new Float32Array(length);
  for (const layer of row.layers) sampleLayer(layer, rate, rng, out);
  /*
    THE GLUE — `docs/decisions/0089-a-cue-has-a-body.md`.

    ⚠️ **Over the SUM, so the layers behave as one body rather than as a chord**, and gentle because
    the first draft was not: a `tanh` over a sum dominated by a boom ducks the transients along with
    it, which is half of what *"muffled"* turned out to mean. The top was being squashed by the
    bottom rather than being absent.
  */
  const release = Math.max(1, Math.round(RELEASE_SECONDS * rate));
  for (let i = 0; i < length; i++) {
    // The release, applied to the SUM: a layer that ends early is already silent, and the only edge
    // that can click is the end of the buffer itself.
    const left = length - i;
    const fade = left < release ? left / release : 1;
    /*
      ⚠️ **`velocity` scales the SUM, after the glue and not before it** — 0104. Before it, a quieter
      variant would also be a less saturated one, so the accents would differ in timbre as well as in
      weight and the four would stop being one sound played four ways. That is the same reason the
      glue is over the sum in the first place.
    */
    out[i] = saturate(out[i]!, row.glue) * row.gain * fade * velocity;
  }
  return out;
}

/**
 * One layer, summed into `out`.
 *
 * ⚠️ **Two filters per layer and they are built here rather than shared**, because each carries state
 * and a layer's sweep is its own. They cost nothing at bake time — this runs twelve times at the
 * first press and never again — and `tests/budget.test.ts` lists this file as deliberately cold.
 */
function sampleLayer(layer: CueLayer, rate: number, rng: Rng, out: Float32Array): void {
  sampleLayerInto(layer, rate, rng, out, Math.round((layer.at ?? 0) * rate), false);
}

/**
 * One layer at an arbitrary offset, optionally wrapping round the end of the buffer.
 *
 * ⚠️ **`wrap` is the whole difference between a cue and a LOOP** —
 * `docs/decisions/0090-the-music-is-four-loops.md`. A cue that runs past its buffer is a cue that was
 * authored too long and is cut off; a music note whose tail runs past the end of the loop has to
 * arrive at the START of it, or every repetition has a silent notch where the decay should be — at
 * the same place every 3.6 seconds, which is audible immediately.
 *
 * ⚠️ **Exported for `src/app/music.ts` and for nothing else.** The alternative was a second copy of
 * the oscillators, the filters and the envelope in the music file, which is how a project ends up
 * with a soundtrack that does not sound like its own game.
 */
export function sampleLayerInto(
  layer: CueLayer,
  rate: number,
  rng: Rng,
  out: Float32Array,
  start: number,
  wrap: boolean,
): void {
  rateCeiling = rate;
  const length = Math.max(1, Math.round(layer.seconds * rate));
  const attack = Math.max(1, Math.round((layer.attack ?? ATTACK_SECONDS) * rate));
  const curve = layer.curve ?? DECAY;
  const low = makeFilter();
  const high = makeFilter();
  /** Where in the waveform we are, in cycles. Fractional part is the position within one. */
  let phase = 0;
  /** The value sample-and-hold noise is currently holding. */
  let held = rng.range(-1, 1);
  let heldPhase = 0;
  for (let i = 0; i < length; i++) {
    const raw = start + i;
    // The wrap, and it is the only line `src/app/music.ts` needed that a cue did not.
    const at = wrap ? raw % out.length : raw;
    if (!wrap && at >= out.length) break;
    const u = i / length;
    // Exponential in the frequency, which is what makes it linear to the ear.
    const step = (layer.from * Math.pow((layer.to || layer.from) / layer.from, u)) / rate;
    phase += step;
    if (phase >= 1) phase -= 1;
    let value: number;
    if (layer.wave === 'sine') value = Math.sin(phase * Math.PI * 2);
    else if (layer.wave === 'tri') value = 4 * Math.abs(phase - 0.5) - 1;
    else if (layer.wave === 'saw') value = 2 * phase - 1 - blep(phase, step);
    else if (layer.wave === 'square') value = (phase < 0.5 ? 1 : -1) + blep(phase, step) - blep((phase + 0.5) % 1, step);
    else if (!layer.from) value = rng.range(-1, 1);
    else {
      // Sample and hold: one fresh draw per cycle, held flat in between. What a chiptune noise
      // channel did, and now the exception rather than the rule — everything that explodes is white.
      heldPhase += step;
      if (heldPhase >= 1) {
        heldPhase -= 1;
        held = rng.range(-1, 1);
      }
      value = held;
    }
    if (layer.highFrom) {
      value = high(value, sweep(layer.highFrom, layer.highTo, u), HIGH_Q).high;
    }
    if (layer.lowFrom) value = low(value, sweep(layer.lowFrom, layer.lowTo, u), layer.q ?? LOW_Q).low;
    if (layer.drive) value = saturate(value, layer.drive);
    let envelope = Math.exp(-curve * u);
    if (i < attack) envelope *= i / attack;
    out[at] = (out[at] ?? 0) + value * envelope * layer.gain;
  }
}

/** An exponential sweep from `a` to `b` at `u` in `[0, 1)`. `b` absent or zero means no sweep. */
function sweep(a: number, b: number | undefined, u: number): number {
  return b === undefined || b === 0 ? a : a * Math.pow(b / a, u);
}

/**
 * How long a cue is, in seconds — the layer that finishes last.
 *
 * ⚠️ **Derived rather than a field, so a row cannot claim a length it does not have.** It used to be
 * written on the row and read by four things; a layer that ran past it would simply have been cut off
 * mid-waveform, which is the click `tests/sound.test.ts` exists to catch.
 */
export function cueSeconds(row: CueRow): number {
  let longest = 0;
  for (const layer of row.layers) longest = Math.max(longest, (layer.at ?? 0) + layer.seconds);
  return longest;
}

/**
 * Every cue, synthesised in `CUE_KINDS` order.
 *
 * ⚠️ **Indexed by position in `CUE_KINDS`, which IS the bake order** — the same single-list
 * arrangement `src/content/sprites.ts` was rewritten into after three hand-kept descriptions of one
 * order made every entity in the game draw as the wrong thing.
 */
export function bakeCues(rate: number = SAMPLE_RATE): Float32Array[][] {
  // Its own root, so a cosmetic roll anywhere else in the game cannot move a waveform, and vice
  // versa — `docs/decisions/0021-one-stream-per-concern.md`.
  const root = makeRng('cues');
  return CUE_KINDS.map((kind) => velocitiesOf(CUES[kind]).map((v) => sampleCue(CUES[kind], rate, root.stream(kind), v)));
}

/**
 * The velocities a cue is baked at — its `figure`, or a single full-weight sounding.
 *
 * ⚠️ **THE single description of *how many buffers is this cue*, and four things ask it**: the bake,
 * the prewarm, the speaker's choice of variant and `tests/sound.test.ts`. A row with no figure
 * resolves to exactly what it was before 0104 — one buffer at full weight — so the field is opt-in
 * and eleven of the twelve rows are byte for byte unchanged.
 *
 * ⚠️ **THE SAME `Rng` STREAM FOR EVERY VARIANT, WHICH IS WHY THEY ARE ONE SOUND.** `bakeCues` draws
 * `stream(kind)` once per variant, so each gets an identically-seeded generator and the four differ
 * **only** in weight — same noise, same everything. Four different noise draws would be four
 * different sounds rather than one played four ways, which is the whole thing this mechanism is for.
 */
export function velocitiesOf(row: CueRow): readonly number[] {
  return row.figure ?? ONE_VELOCITY;
}

/** What a row with no figure gets. Module-level, so asking costs no allocation. */
const ONE_VELOCITY: readonly number[] = [1];

/** What actually makes a noise. The one interface the browser half has to satisfy. */
export interface AudioOut {
  /** Whether anything can be heard yet — false until a gesture has unlocked the context. */
  ready(): boolean;
  /**
   * Sound the cue at this index in `CUE_KINDS`, at variant `velocity`. Called only when the speaker
   * has allowed it.
   *
   * ⚠️ **`velocity` indexes the row's baked variants and is not a gain** — 0104. A gain would be a
   * `GainNode` per voice, which is a second allocation on the one path in this file that allocates
   * at all; the weights are baked instead, so an accented shot costs exactly what an unaccented one
   * does. **0183 took the voice cap off this path and that makes the saving matter more, not less.**
   */
  sound(index: number, velocity: number, pan: number): void;
  /**
   * Push the music down by `amount` for a moment, because a loud cue is landing — 0104.
   *
   * ⚠️ **On `AudioOut` rather than reached for through `music()`**, so `makeSpeaker` stays the pure
   * counting half with no opinion about whether a music bus exists. The web half forwards it; a test
   * double records it.
   */
  duck(amount: number): void;
}

export interface Speaker {
  /**
   * A fixed step happened. Resets the per-step voice count and advances the clock holds are measured
   * against.
   *
   * ⚠️ **`beatStep` is the SIM's own step count and is a different clock from the hold's** — 0104. A
   * hold is counted in steps since the speaker was built, so that it expires on the screens the
   * simulation is not running (0063); a `figure` is counted against the MUSIC, which is phase-locked
   * to `world.steps` and to nothing else
   * (`docs/decisions/0094-in-time-is-not-in-phase.md`). Passing the world's number in is what makes
   * an accent land where the bar says rather than where the speaker happens to have got to.
   *
   * ⚠️ **Defaulted, because most callers have no world** — the menus tick this too, and the only cue
   * they can sound has no figure.
   */
  step(beatStep?: number): void;
  /**
   * Sound a cue, if the mute, the hold and the voice cap all allow it.
   *
   * ⚠️ **`across` is WHERE IT HAPPENED, in world units, and it is optional on purpose** — 0127. The
   * caller hands over the coordinate it already has and `panFor` owns the arithmetic; a call with
   * nothing to give is centred, which is the honest answer for the chime and for a menu.
   */
  play(kind: CueKind, across?: number): void;
  /** Whether the player wants sound at all. */
  setOn(on: boolean): void;
}

/**
 * Which of a row's `count` baked weights a cue landing on sim step `step` is struck at.
 *
 * ── WHERE IN THE BEAT, NOT HOW MANY HAVE GONE BY ────────────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0104-the-gun-plays-a-figure.md`.** The obvious build is a counter that advances
 * every time the cue sounds, and it drifts: the gun's cadence changes four times up the ladder
 * (`src/content/ships.ts`), a volley the pool refuses is silent
 * (`src/app/frame.ts`), and either one slides every later accent off the bar for the rest of the run.
 * That is `docs/decisions/0094-in-time-is-not-in-phase.md`'s lesson — *in time is not in phase* —
 * arriving one layer up.
 *
 * ⚠️ **So the position is a property of WHEN, and a cue that never sounds moves nothing.** Two shots
 * inside one sixteenth genuinely land on the same slot and are struck the same, which is correct
 * rather than a rounding: they are one sixteenth, played twice.
 *
 * ⚠️ **`FIRE_GRID` is the unit and it is imported rather than restated.** It is the grid every
 * cadence in the game is already snapped to (0096), so the accents and the shots divide the cycle
 * the same way by construction — and a `figure` of four entries is exactly one `VOLLEY_CYCLE`.
 *
 * ⚠️ **THAT USED TO BE A CLAIM ABOUT A BEAT AND IS NOT ONE NOW** — 0159. The lattice and the values
 * are unchanged; what is gone is the guarantee that the music divides its bar the same way. Today
 * they still coincide, because the tempo has not moved yet.
 *
 * Exported for `tests/sound.test.ts`, which drives it directly.
 */
/**
 * How many fixed panner nodes the cue bus keeps, spread evenly across the field.
 *
 * ── A POOL, BECAUSE A PANNER PER VOICE WOULD BREAK A CLAIM THIS FILE ALREADY MAKES ──────────────
 *
 * ⚠️ **`tests/budget.test.ts` names this file cold with a stated reason**: *"it allocates one
 * single-use audio source per voice because the platform has no other way to play a buffer."* A
 * `StereoPannerNode` per voice would make that sentence false and double the allocation on the one
 * path `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` could not otherwise see. These
 * are built with the context and never replaced.
 *
 * ⚠️ **ODD, so there is a bucket exactly at centre.** An even count straddles it, which would give
 * every unplaced cue — the chime, a menu, anything with no position — a small permanent offset to
 * one side.
 *
 * ⚠️ **Nine is a resolution argument and not a memory one.** A `StereoPannerNode` costs nothing
 * worth counting; what nine buys is a step of 0.125 of the limit between neighbours, which is well
 * under what a listener resolves for a transient.
 */
export const PAN_BUCKETS = 9;

/**
 * How long the cue room's tail is, in seconds.
 *
 * ── EVERY SOUND IN THIS GAME HAPPENED IN AN ANECHOIC CHAMBER ────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0173-a-cue-happens-somewhere.md`.** Reported 2026-08-18: *"the cues and sfx
 * need to be reworked as we haven't touched them since we spent all the time on the music and they're
 * still the old mono sounds and haven't been reworked as stereo sounds with deep bass, reverb and
 * actually decent sound."*
 *
 * ⚠️ **THE MUSIC HAS HAD A ROOM SINCE 0136 AND THE CUES NEVER DID**, which is the whole of why they
 * sound like they were made somewhere else — `src/app/music.ts`'s own header says the two channels
 * come out of one instrument so that exactly this does not happen, and the reverb was the one part of
 * the instrument the cues could not reach. A cue was a dry mono buffer into a fixed panner: correct
 * position, no space at all.
 *
 * ⚠️ **1.1 SECONDS IS A HALL AND NOT A CATHEDRAL.** The music's own room is about two seconds
 * (`addRoom`, three combs at 0.8 feedback), and that is a place a chord can hang in. A cue is
 * information — `docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md` for the ear — so
 * its tail has to be gone before the next one matters. `FASTEST_FIRE` is 0.067 s, and the pulse
 * states no room at all for that reason.
 */
export const CUE_ROOM_SECONDS = 1.1;

/**
 * How dark the tail gets, as the lowpass the impulse is drawn behind, in Hz at the head and the end.
 *
 * ⚠️ **AIR ABSORBS TREBLE AND A TAIL THAT DOES NOT IS A SPRING** — the same sentence `ROOM_DAMP` in
 * `src/app/music.ts` is written under, and the same reason. What differs is the destination: a cue
 * room is small and bright at the front, so it starts higher and lands lower.
 */
const CUE_ROOM_TOP = 7200;
const CUE_ROOM_END = 900;

/** How much of the wet path reaches the master. A cue's own `air` is the send; this is the return. */
export const CUE_ROOM_GAIN = 0.5;

/**
 * A stereo room, drawn once — the impulse the cue bus is convolved with.
 *
 * ── THE WIDTH IS THE TAIL, AND THAT IS WHY THIS IS NOT A CHANGE TO THE BUFFERS ──────────────────
 *
 * ⚠️ **THE TWO CHANNELS ARE DRAWN FROM INDEPENDENT NOISE**, so the tail is decorrelated and the room
 * is genuinely wide where the dry sound is a point. **That is what *stereo* has to mean for a cue**:
 * the position of the event is information the player uses to dodge —
 * `docs/decisions/0127-a-cue-has-a-place.md` — so widening the DRY signal would be
 * spending a fact to buy a feeling. The dry stays where it happened and the room is everywhere, which
 * is also what happens in a room.
 *
 * ⚠️ **IT IS A CONVOLUTION ON A BUS RATHER THAN A BAKE INTO EVERY BUFFER**, and the difference is
 * per-sounding cost. `addRoom` is a post-pass over a loop baked once a level; a cue is baked once and
 * PLAYED ten times a second, so a wet tail baked into the buffer would lengthen every one of them and
 * cost the same convolution again at every sounding. One `ConvolverNode` for the whole channel is the
 * same arithmetic done once. **The buffers are untouched and still mono**, so nothing that measures a
 * cue had to change.
 *
 * ⚠️ **EARLY REFLECTIONS FIRST, AND THEY ARE WHAT SAYS *SMALL*.** An exponential noise tail on its
 * own is a plate; a handful of discrete taps in the first thirty milliseconds is what an ear reads as
 * walls at a distance. They are at prime-ish spacings so they do not stack into a pitch.
 *
 * ⚠️ **SEEDED, ON ITS OWN STREAM** — `docs/decisions/0021-one-stream-per-concern.md`. A room drawn
 * from the cue stream would move every cue's noise the day its length changed.
 */
export function makeRoomImpulse(rate: number, rng: Rng): [Float32Array, Float32Array] {
  rateCeiling = rate;
  const length = Math.max(1, Math.round(CUE_ROOM_SECONDS * rate));
  const out: [Float32Array, Float32Array] = [new Float32Array(length), new Float32Array(length)];
  // Prime-ish, in seconds, so no two taps land on a common multiple and ring.
  const EARLY: readonly number[] = [0.0071, 0.0113, 0.0173, 0.0229, 0.0293];
  for (let c = 0; c < 2; c++) {
    const line = out[c]!;
    const damp = makeFilter();
    // @setup: one generator per channel, drawn once at unlock.
    const stream = rng.stream(c === 0 ? 'left' : 'right');
    for (let i = 0; i < length; i++) {
      const u = i / length;
      // Exponential, so the tail reads as a decay rather than as a fade — and it reaches -60 dB at
      // the end of the buffer rather than being cut off there.
      const decay = Math.pow(10, -3 * u);
      const cutoff = CUE_ROOM_TOP * Math.pow(CUE_ROOM_END / CUE_ROOM_TOP, u);
      line[i] = damp(stream.range(-1, 1) * decay, cutoff, 0.7).low;
    }
    for (let e = 0; e < EARLY.length; e++) {
      const at = Math.round((EARLY[e]! + (c === 0 ? 0 : 0.0019)) * rate);
      if (at < length) line[at] = line[at]! + (c === 0 ? 1 : -1) * (0.62 - e * 0.1);
    }
    /*
      ⚠️ **NORMALISED, AND THE FIRST VERSION WAS NOT** —
      `docs/decisions/0174-a-send-has-to-mean-something.md`. Reported on the first listen: *"the enemy
      death sounds like it's happening inside a tin can, it doesn't fit an explosion or a gamey sound
      at all."* Measured, the wet was **15.7 dB over the dry peak on `blast`, 17.6 on `death` and 18.4
      on `bossDown`** — every explosion in the game was mostly reverb.

      ⚠️ **`normalize = false` MEANS THE LEVEL IS AUTHORED, AND 0173 SAID SO AND THEN DID NOT AUTHOR
      IT.** A convolution sums the whole impulse per input sample, so a 1.1-second full-amplitude noise
      buffer has an enormous integrated gain — `CUE_ROOM_GAIN` and every `air` were chosen against a
      scale nobody had measured. **The tail LENGTH was measured and length is insensitive to level**,
      which is how a guard, a decision and a confirmation table all went green over an 18 dB error.

      ⚠️ **SCALED BY `1 / sqrt(sum of squares)`, WHICH IS THE ONE FACTOR THAT MAKES `air` READABLE.** A
      convolution's RMS gain over broadband input is the impulse's root energy, so this makes
      `air × CUE_ROOM_GAIN == 1` mean *the wet is as loud as the dry* — and every value in `CUES` then
      means the share of itself it looks like it means.
    */
    let energy = 0;
    for (let i = 0; i < length; i++) energy += line[i]! * line[i]!;
    const scale = energy > 0 ? 1 / Math.sqrt(energy) : 0;
    for (let i = 0; i < length; i++) line[i] = line[i]! * scale;
  }
  return out;
}


/**
 * Where a cue sits in the field, from the `across` coordinate of the thing that made it.
 *
 * ⚠️ **THE SINGLE DESCRIPTION, AND THE CALL SITES DELIBERATELY DO NOT DO THIS ARITHMETIC.** Seventeen
 * places call `onCue` (`src/app/frame.ts`, `src/app/boss.ts`); each has a world coordinate to hand
 * and none of them should own the conversion, or the day the lane changes width sixteen of them are
 * right and one is not. `ACROSS_SPAN` is imported for the same reason.
 *
 * ⚠️ **The lane runs 0 to `ACROSS_SPAN` and the middle is the middle.** Clamped, because a body may
 * be culled slightly outside the lane (`docs/decisions/0048-a-threat-may-arrive-from-the-side.md`)
 * and a shot that leaves the field must not pan past the limit on its way out.
 *
 * ⚠️ **`undefined` is the centre and it is not a fallback.** The chime answers a setting, not a place
 * (`src/app/mount.ts`), and a menu has no world at all — those are genuinely centred rather than
 * unknown.
 */
export function panFor(across: number | undefined): number {
  if (across === undefined) return 0;
  const half = ACROSS_SPAN / 2;
  const off = (across - half) / half;
  const clamped = off < -1 ? -1 : off > 1 ? 1 : off;
  return clamped * CUE_PAN_LIMIT;
}

/** Which of the fixed panners a pan lands on. */
export function panBucket(pan: number): number {
  const middle = (PAN_BUCKETS - 1) / 2;
  const at = Math.round(middle + (pan / CUE_PAN_LIMIT) * middle);
  return at < 0 ? 0 : at > PAN_BUCKETS - 1 ? PAN_BUCKETS - 1 : at;
}

export function variantAt(count: number, step: number): number {
  if (count <= 1) return 0;
  const slot = Math.floor(((step % VOLLEY_CYCLE) + VOLLEY_CYCLE) % VOLLEY_CYCLE / FIRE_GRID);
  return slot % count;
}

/**
 * When a cue may sound. No audio in here at all, which is what makes it testable.
 *
 * ⚠️ **Three gates, in this order, and the order is the cheap-first one**: off, then held, then
 * capped. A muted game does no work per cue beyond a boolean.
 */
export function makeSpeaker(out: AudioOut): Speaker {
  /** Fixed steps since the speaker was built. Only ever goes up. */
  let clock = 0;
  /** The SIM's step count, which is the clock the music is in phase with — 0104. */
  let beat = 0;
  let on = true;
  /**
   * The step each cue last sounded on, by index. Pre-filled with a number far enough below zero that
   * every cue is free to sound on step one — `-Infinity` would work and this stays an integer array.
   */
  const lastAt = CUE_KINDS.map(() => -1e9);
  /** Kind to index, resolved once, so `play` costs one property read rather than a list scan. */
  const indexOf = {} as Record<CueKind, number>;
  CUE_KINDS.forEach((kind, index) => {
    indexOf[kind] = index;
  });
  /*
    ⚠️ **How many variants each row was baked at, resolved once.** `play` runs on the hot path and
    may not reach into `CUES[kind].figure` to read a length sixty times a second — the same reason
    `indexOf` exists one line up.
  */
  const variantsOf = CUE_KINDS.map((kind) => velocitiesOf(CUES[kind]).length);
  /*
    ⚠️ **The cues asked for since the last grid step, as flags** — 0104. A `Uint8Array` rather than a
    list, so a step that queues three cues allocates nothing: this is reached from a fixed step and
    `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` counts allocations there.

    ⚠️ **A FLAG and not a count, which is the behaviour as well as the storage.** Two kills inside one
    sixteenth are one sounding, exactly as two on consecutive steps already were — that is what
    `hold` says about a flam and this cannot be looser than it.
  */
  // @setup: one array for the speaker's lifetime, cleared in place at every grid step.
  const waiting = new Uint8Array(CUE_KINDS.length);
  /*
    ⚠️ **WHERE A WAITING CUE CAME FROM, because the flag above cannot carry it** — 0127. A gridded
    cue sounds up to a sixteenth after it was asked for, and by then the body that made it has moved
    or been released; a pan read at flush time would place the explosion wherever the pool happens to
    be pointing. Recorded at the moment of the ask, like the accent is.

    ⚠️ **The FIRST of a collapsed pair wins.** Two kills inside one sixteenth are one sounding — the
    rule `hold` already states — and the one that has *"paid for its place in the bar"* is the one
    that arrived first, so this is written only on the 0 → 1 transition.
  */
  // @setup: one array for the speaker's lifetime, written in place beside `waiting`.
  const waitingPan = new Float32Array(CUE_KINDS.length);

  /** Sound `index` now, if the hold allows it. The last gate before the browser. */
  const emit = (index: number, pan: number): void => {
    if (clock - (lastAt[index] ?? 0) < CUES[CUE_KINDS[index]!]!.hold) return;
    if (!out.ready()) return;
    lastAt[index] = clock;
    out.sound(index, variantAt(variantsOf[index] ?? 1, beat), pan);
    /*
      ⚠️ **AFTER the cue is known to have sounded, never when it was asked for** — 0104. A cue the
      hold refused is a cue the player never hears, and ducking the music for it would be the track
      getting out of the way of nothing.

      ⚠️ **THE VOICE CAP WAS THE OTHER REFUSAL AND 0183 REMOVED IT**, along with the counter that fed
      it: nothing read the count once the cap was gone, and a tally kept for a guard that no longer
      asks is the shape this file has just spent a decision deleting.
    */
    const depth = CUES[CUE_KINDS[index]!]!.duck;
    if (depth !== undefined) out.duck(depth);
  };

  return {
    step(beatStep?: number): void {
      clock++;
      // The world's own count when there is a world, and the speaker's own when there is not.
      beat = beatStep ?? beat + 1;
      /*
        ⚠️ **The flush is BEFORE anything this step asks for**, which is what keeps a queued cue from
        losing its slot to one that arrived later. A cue that waited a sixteenth has already paid for
        its place in the bar; the cap is a budget for the step, and the thing that waited goes first.
      */
      if (beat % FIRE_GRID !== 0) return;
      for (let i = 0; i < waiting.length; i++) {
        if (waiting[i] === 0) continue;
        waiting[i] = 0;
        emit(i, waitingPan[i] ?? 0);
      }
    },
    play(kind: CueKind, across?: number): void {
      if (!on) return;
      const index = indexOf[kind];
      const pan = panFor(across);
      /*
        ⚠️ **A HELD REPEAT IS A NO-OP AND NEVER A SIDE EFFECT**, which is what survives 0183 of the
        paragraph that stood here. It was about a cap that counted drops rather than soundings — four
        retriggers of one held cue filling the step's budget and locking out the cues behind them —
        and there is no budget to eat any more. What is still true, and still guarded, is that a cue
        the hold refuses moves nothing: not `lastAt`, not the duck, not the grid's waiting flag.

        ⚠️ **An earlier draft claimed the ORDER of the checks mattered and it does not.**
        `npm run prove` reported STILL GREEN on a probe that swapped them, which is
        `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` catching a guard standing over nothing.
      */
      /*
        ⚠️ **A GRIDDED CUE WAITS AND IS NOT DROPPED** — 0104. It is marked and sounds at the next
        sixteenth, which is at most `FIRE_GRID` steps away; the hold, the cap and the ready check are
        all asked THERE rather than here, because the answer at the moment it actually sounds is the
        one that matters. Asking now would let a cue reserve a voice for a step it does not sound on.

        ⚠️ **Exactly on a grid step it still waits, and that is not an off-by-one.** `step` flushes
        before anything this step asks for, so a cue arriving after the flush has already missed it —
        and one sixteenth later is where the next slot is.
      */
      if (CUES[kind].onGrid === true) {
        // The first of a collapsed pair keeps its place — the note on `waitingPan` has why.
        if (waiting[index] === 0) waitingPan[index] = pan;
        waiting[index] = 1;
        return;
      }
      emit(index, pan);
    },
    setOn(next: boolean): void {
      on = next;
    },
  };
}

/** The browser half, plus the two things only it can do: unlock, and let go. */
export interface WebAudioOut extends AudioOut {
  /**
   * A user gesture happened. Builds the context and the buffers the first time, and resumes a
   * context the browser suspended.
   */
  unlock(): void;
  release(): void;
  /**
   * The music, once the context exists — null before the first gesture.
   *
   * ⚠️ **The music rides the SAME unlock as the cues and cannot have its own.** A second context
   * would be a second thing to resume when a tab comes back, and the one that got missed would be
   * silent for the rest of the run. See docs/decisions/0090-the-music-is-four-loops.md.
   */
  music(): MusicOut | null;
}

/**
 * Web Audio, and nothing else in the game may name it.
 *
 * ── THE UNLOCK, WHICH IS THE PART THAT ACTUALLY BITES ───────────────────────────────────────────
 *
 * ⚠️ **Every browser refuses to make a sound before the player has touched something**, and a
 * context created outside a gesture starts suspended. So the context is built on the FIRST GESTURE
 * rather than at boot: a player who never presses anything pays nothing, and the press that starts a
 * run is the press that turns the sound on. The title screen cannot be got past without one
 * (`docs/decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md` put the tier there),
 * so no gameplay cue can ever be the first thing that needed the unlock.
 *
 * ⚠️ **A GAMEPAD CANNOT GRANT ACTIVATION, AND IT ASKS FOR THE UNLOCK ANYWAY.** The Gamepad API
 * produces no DOM events at all — it is polled — and user activation is granted by input EVENTS, so
 * there is nothing for the platform to attribute a pad press to. `src/app/mount.ts` calls `unlock`
 * from the menu-pad path regardless, and that is not a gesture of futility: activation is **sticky
 * per page**, so a player who clicked anything at all earlier already has it and the `resume()`
 * below then succeeds.
 *
 * What is left after that is narrow and honest: a player who loads the page, touches nothing but a
 * pad, and whose browser has never seen a click on this origin, gets silence until they tap or press
 * a key. `docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md` made the pad
 * first-class for every button in the game and cannot make it first-class for this — but the earlier
 * wording of this comment said *nothing in this repository can*, which was true of the platform and
 * false about the code: not trying was a choice this file had made.
 *
 * ⚠️ **`resume()` on every unlock, not only the first.** A context is suspended again when a tab is
 * backgrounded on mobile, and the gesture that brings the player back is the one that has to revive
 * it — a first-run-only unlock is silent for the rest of the session after one phone call.
 */
/**
 * Everything the synthesiser can produce before a context exists, kept from the title screen.
 *
 * ── THE BAKE WAS A BUDGET, AND THE BUDGET WAS AN ARTEFACT ───────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0102-the-music-goes-somewhere.md`.** `docs/decisions/0095-the-level-has-its-own-music.md`
 * capped the chords at four bars and said why in as many words: *"eight-bar chords and lead would be
 * about 900ms on this machine — a freeze at tap to start."* So the length of the music was decided by
 * how long it takes to synthesise, and the report this decision answers is *"a few seconds of sound
 * repeated for minutes."*
 *
 * ⚠️ **NEITHER BAKE NEEDS THE CONTEXT, AND BOTH ALREADY RUN AT A FIXED RATE.** `bakeCues` and
 * `bakeLoops` are handed `SAMPLE_RATE` — 44100, a constant — and return `Float32Array`s. The only
 * thing that needs an `AudioContext` is `createBuffer`, which is microseconds. The 718ms was sitting
 * on the gesture for no reason except that it had always been written there.
 *
 * ⚠️ **So it runs on the title screen, a VOICE at a time.** The largest single voice is about twenty
 * milliseconds, which is inside a frame; by the time a player has read the difficulty names the whole
 * set is waiting. **The cap on how much music there can be is gone**, which is what pays for the two
 * new layers and the eight-bar progression.
 *
 * ⚠️ **`unlock` still bakes synchronously if this is empty**, which is not a fallback nobody reaches:
 * it is the path every headless test takes, and it is what a player who presses *before* the prewarm
 * finishes gets. One description of the samples, two ways of arriving at them, and
 * `tests/sound.test.ts` holds that they are identical.
 */
let prewarmed: { cues: Float32Array[][]; loops: Record<MusicLayer, Float32Array> } | null = null;

/**
 * Synthesise everything, spread across frames, and keep it for the first gesture.
 *
 * ⚠️ **Idempotent and cheap to call twice** — a second call while one is in flight does nothing, and
 * a call after it has finished does nothing. `src/app/mount.ts` fires it once at boot.
 *
 * ⚠️ **`schedule` is injected rather than reaching for `setTimeout`**, so a test can drive it to
 * completion synchronously and `src/app/sound.ts` stays the file that knows about Web Audio rather
 * than the file that knows about the event loop.
 */
export function prewarmAudio(schedule: (run: () => void) => void = (run) => void setTimeout(run, 0)): void {
  if (prewarmed !== null || warming) return;
  warming = true;
  /*
    ⚠️ **The CUES first, because they are what a press needs immediately.** A player who taps and
    starts a run hears a chime and then a gun; the music has a beat and a half of grace before its
    first bar matters, and `makeMusicOut` starts the loops a moment in the future anyway.
  */
  const cues: Float32Array[][] = [];
  const loops = {} as Record<MusicLayer, Float32Array>;
  const jobs: (() => void)[] = [];
  /*
    ⚠️ **ONE JOB PER VARIANT, not one per kind** — 0104, on the same measurement that made a music job
    one NOTE rather than one layer. A row with a figure is four bakes; pushing them as one job would
    put four synthesis passes on a single frame, which is the hitch the prewarm exists to remove.

    ⚠️ **The row's list is claimed up front and filled in place**, so the ordering inside a kind is the
    figure's own however the jobs are interleaved — `bakeCues` produces the same nesting and
    `tests/sound.test.ts` holds the two identical.
  */
  for (const kind of CUE_KINDS) {
    const variants = velocitiesOf(CUES[kind]);
    const into: Float32Array[] = [];
    cues.push(into);
    variants.forEach((velocity, at) => {
      jobs.push(() => {
        into[at] = sampleCue(CUES[kind], SAMPLE_RATE, cueStreams.stream(kind), velocity);
      });
    });
  }
  /*
    ⚠️ **A JOB IS ONE NOTE, AND A MEASUREMENT IS WHY.** The first version pushed one job per LAYER,
    and `chords` — six voices of long detuned pads over eight bars — measured **428ms** on its own.
    Moving a 428ms freeze off the gesture and onto the title screen is moving a hitch rather than
    removing one. A note is about thirty milliseconds at the very worst (`src/app/music.ts`).

    ⚠️ **The buffer is claimed up front and filled in place**, so a press that arrives mid-prewarm
    finds `prewarmed` still null and takes the cold path — a half-filled buffer is never reachable.
  */
  for (const layer of MUSIC_LAYERS) {
    const { buffer, notes } = layerNotes(layer, SAMPLE_RATE);
    loops[layer] = buffer;
    for (const note of notes) jobs.push(note);
  }
  /*
    ⚠️ **THE WHOLE SET IS HELD SO A GESTURE CAN FINISH IT INSTEAD OF STARTING AGAIN** — see
    `drainPrewarm` below. Without this the partial work is unreachable and a press mid-prewarm
    re-synthesises everything from zero, which is what it did for its whole life.
  */
  pending = { jobs, at: 0, cues, loops };
  const step = (): void => {
    /*
      ⚠️ **A SLICE IS A TIME BUDGET AND IT USED TO BE ONE JOB, WHICH MADE THE PREWARM 4× ITS OWN
      WORK** — `docs/decisions/0157-the-prewarm-was-scheduled-one-note-at-a-time.md`. A browser
      clamps a nested `setTimeout` to about **4 ms**, so ~3,000 one-note jobs spent 12–20 seconds of
      wall clock doing **3.6 seconds** of synthesis — and a press inside that window paid for the
      lot. The jobs are unchanged and run in the same order, so the samples are identical; what
      moves is how many of them a slice does.

      ⚠️ **Measured rather than counted, and 0025 is not what this argues with.** That decision is
      about asserting a BUDGET in a guard, where CI is not the target machine. This is a scheduler
      deciding how much work to do before yielding, which is the one place a clock is the right
      instrument — a fixed job count would be a guess about a machine.
    */
    if (pending === null) return;
    pending.at = sliceOf(pending.jobs, pending.at);
    if (pending.at >= pending.jobs.length) {
      prewarmed = { cues: pending.cues, loops: pending.loops };
      pending = null;
      warming = false;
      return;
    }
    schedule(step);
  };
  schedule(step);
}

/**
 * How long one prewarm slice may spend synthesising before it yields, in milliseconds.
 *
 * ⚠️ **Under a frame at 60Hz, and the yield after it is what a browser clamps to about 4 ms** — so a
 * slice plus its gap is roughly two frames, and the prewarm costs about half the main thread while it
 * runs rather than 4% of it. It finishes in a little over its own synthesis time instead of four
 * times it.
 */
const PREWARM_SLICE_MS = 8;

/** A prewarm in flight: the jobs it has left, and the half-filled set they are filling. */
let pending: { jobs: (() => void)[]; at: number; cues: Float32Array[][]; loops: Record<MusicLayer, Float32Array> } | null =
  null;

/**
 * Finish a prewarm that is still walking, synchronously, and hand back the completed set.
 *
 * ── A PRESS USED TO THROW AWAY EVERYTHING THE PREWARM HAD ALREADY DONE ──────────────────────────
 *
 * ⚠️ **`docs/decisions/0157-the-prewarm-was-scheduled-one-note-at-a-time.md`.** The gesture path read
 * `prewarmed?.cues ?? bakeCues(…)`, and `prewarmed` is only set on the LAST job — so a press with 90%
 * of the work done re-synthesised **100%** of it. Measured at 4.6 seconds of frozen main thread, on
 * the build that shipped.
 *
 * ⚠️ **The jobs are the prewarm's own, in the prewarm's own order**, so what this produces is
 * bit-identical to letting it finish — which is the property `tests/sound.test.ts` already holds
 * between the prewarmed and cold paths, and now holds across this third one.
 *
 * ⚠️ **It does nothing if there is no prewarm in flight**, so the cold path is still reachable and is
 * still what a page that never started one takes.
 */
export function drainPrewarm(): void {
  if (pending === null) return;
  while (pending.at < pending.jobs.length) pending.jobs[pending.at++]!();
  prewarmed = { cues: pending.cues, loops: pending.loops };
  pending = null;
  warming = false;
}

/** Whether a prewarm is in flight, so a second call does not start a second set. */
let warming = false;

/**
 * Synthesise the layers a PLACE plays differently, spread across frames, and hand back a whole set.
 *
 * ── THE BOUNDARY BAKE, WHICH TWO DECISIONS HAVE NOW LEFT OPEN ───────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0133-the-place-is-baked-at-the-boundary.md`.**
 * `docs/decisions/0128-a-place-plays-its-own-material.md` built the storage model and stopped short
 * of wiring it, and `docs/decisions/0132-a-place-may-be-another-piece-entirely.md` wrote a whole
 * composition into it — so **a real run has been playing the base composition whatever level it was
 * in**, for two decisions running.
 *
 * ⚠️ **IT REPLACES AND DOES NOT CACHE, AND THAT IS A MEASUREMENT RATHER THAN A PREFERENCE.**
 * [`what-a-whole-place-costs`](../../reports/what-a-whole-place-costs-2026-08-12.md): Ember Nebula is
 * 46.85 MB of its own audio, so a set kept per place is 94.8 MB against a 56 MB ceiling and seven of
 * them are not a number worth writing down. The arrays handed to `setLoops` are copied into
 * `AudioBuffer`s and **nothing here keeps a reference to them**, so the steady state is one
 * composition however many places a run visits.
 *
 * ⚠️ **THE BASE SET IS SHARED RATHER THAN COPIED**, which is 0128's whole cost model: a layer this
 * place does not state comes back as the SAME `Float32Array`, and `setLoops` compares by identity and
 * does not even make a buffer for it. A place that states nothing is therefore free and is a no-op
 * end to end — which is what makes calling this on every screen safe.
 *
 * ⚠️ **ONE JOB PER NOTE, AND ONE PER LAYER BEFORE IT, on `prewarmAudio`'s own terms.** Claiming
 * twenty-one buffers up front is 47 MB of allocation and zeroing in a single call, from a frame; a
 * layer's buffer is therefore claimed by its own job and pushes its notes onto the queue behind it.
 * The longest single job is the longest single NOTE, which `tests/themes.test.ts` holds under three
 * seconds for a place exactly as `tests/sound.test.ts` holds it for the base.
 *
 * ⚠️ **Cancellable, because a run can leave a place before its material arrives.** The returned
 * function stops the walk; a half-built set is never handed anywhere, so there is nothing to undo.
 *
 * ⚠️ **Nothing happens before the prewarm has finished**, because there is no base set to share from
 * and baking one here would be the three-second freeze 0102 exists to have removed. A boundary is
 * minutes after the first press; the title screen is where this cannot yet work and also where no
 * level has a place.
 */
export function bakePlace(
  theme: ThemeKind,
  ready: (loops: Record<MusicLayer, Float32Array>) => void,
  schedule: (run: () => void) => void = (run) => void setTimeout(run, 0),
): () => void {
  const base = prewarmed?.loops;
  if (base === undefined) return () => {};
  const own = { ...base } as Record<MusicLayer, Float32Array>;
  const jobs: (() => void)[] = [];
  // ⚠️  and not  — a place may state a ROOM for a layer it shares the notes of,
  // and that layer's buffer is different too (0136). Sharing the dry array would drop the room.
  for (const layer of bakedBy(theme)) {
    jobs.push(() => {
      const { buffer, notes } = layerNotes(layer, SAMPLE_RATE, theme);
      own[layer] = buffer;
      for (const note of notes) jobs.push(note);
    });
  }
  let next = 0;
  let stopped = false;
  const step = (): void => {
    if (stopped) return;
    /*
      ⚠️ **THE SAME SLICE THE PREWARM TAKES, AND THIS HAD THE SAME DEFECT** — 0157. One job per
      `setTimeout` against a ~4 ms clamp, in the code that runs at every level BOUNDARY: 0133 needs
      this finished before the boundary or the level arrives playing the piece it is leaving.
      `sliceOf` is the one description of how much a slice does.

      ⚠️ **The job list GROWS while it is walked** — a layer's job pushes that layer's notes — so the
      end is `next >= jobs.length` re-read each time rather than a length captured up front.
    */
    next = sliceOf(jobs, next);
    if (next >= jobs.length) {
      ready(own);
      return;
    }
    schedule(step);
  };
  schedule(step);
  return () => {
    stopped = true;
  };
}

/**
 * Run jobs from `at` until the slice is spent, and say where it got to.
 *
 * ⚠️ **AT LEAST `PREWARM_SLICE_JOBS`, THEN UNTIL THE CLOCK SAYS STOP, AND BOTH HALVES ARE LOAD-BEARING.**
 * The time budget is what makes a slice the right size on the machine it is actually running on. The
 * job floor is what makes the *ratio* of yields to work a property of the code rather than of the
 * machine — without it, a loaded CI box does one job per slice and is indistinguishable from the
 * schedule 0157 removed, which is a guard that measures the runner
 * (`docs/decisions/0025-the-frame-budget-is-counted-not-timed.md`).
 *
 * ⚠️ **The floor's worst case is bounded and small.** A note is about 30 ms at the very worst
 * (`src/app/music.ts`) and averages nearer 1.2, so a floor of four is normally invisible and cannot
 * exceed about 120 ms even if every job in it were the worst one in the piece.
 */
function sliceOf(jobs: (() => void)[], at: number): number {
  const until = performance.now() + PREWARM_SLICE_MS;
  let done = 0;
  let next = at;
  while (next < jobs.length) {
    jobs[next++]!();
    done++;
    if (done >= PREWARM_SLICE_JOBS && performance.now() >= until) break;
  }
  return next;
}

/**
 * The fewest jobs a slice does before its clock may stop it.
 *
 * ⚠️ **It exists so the guard can be written about the CODE rather than about the machine** — see
 * `sliceOf`. `tests/sound.test.ts` asserts the slice count against `jobs / PREWARM_SLICE_JOBS`, which
 * is an arithmetic bound that holds on any hardware; a guard written against elapsed time passed here
 * and failed under `npm run prove`'s own parallel load, which is exactly
 * `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`.
 */
export const PREWARM_SLICE_JOBS = 4;

/**
 * The prewarmed set, or `null` if there is not one. **For `tests/sound.test.ts` and nothing else.**
 *
 * ⚠️ **Exported because the property that matters cannot be checked from outside**: the prewarmed
 * samples and the cold ones have to be identical, and *the same game sounds different depending on
 * how fast you pressed* would be invisible to every other assertion in the suite.
 */
export function takePrewarmed(): { cues: Float32Array[][]; loops: Record<MusicLayer, Float32Array> } | null {
  return prewarmed;
}

/** Throw away the prewarmed set, so a test can drive both paths. For `tests/sound.test.ts` only. */
export function resetPrewarm(): void {
  prewarmed = null;
  warming = false;
  // ⚠️ The half-filled set goes too, or a drain after a reset completes the set the reset threw away.
  pending = null;
}

/**
 * The cue streams, hoisted so the prewarm and the cold bake draw from the same generator.
 *
 * ⚠️ **`docs/decisions/0021-one-stream-per-concern.md` and it is what makes the two paths
 * identical.** `bakeCues` makes a fresh root and takes a named stream per cue; doing anything else
 * here would give the prewarmed samples different noise from the cold ones, and *the same game
 * sounds different depending on how fast you pressed* is the worst kind of bug there is.
 */
// @setup: one generator for the lifetime of the module, seeded exactly as `bakeCues` seeds its own.
const cueStreams = makeRng('cues');

export function makeAudioOut(): WebAudioOut {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let buffers: AudioBuffer[][] = [];
  let music: MusicOut | null = null;
  /*
    ⚠️ **THE FIELD, AS A FIXED SET OF PLACES RATHER THAN A NODE PER SOUND** — 0127. `PAN_BUCKETS`
    panners are wired into the master when the context is built and never touched again, so a cue
    still costs exactly one allocation — the source node the platform gives no way around, which is
    the reason `tests/budget.test.ts` names this file cold.
  */
  let places: StereoPannerNode[] = [];
  /**
   * One send per cue kind, into the one room — `docs/decisions/0173-a-cue-happens-somewhere.md`.
   *
   * ⚠️ **PER KIND AND NOT PER VOICE, WHICH IS THE WHOLE REASON THIS IS AFFORDABLE.** A `GainNode` per
   * sounding would be a second allocation on the one path `tests/budget.test.ts` names this file cold
   * for, and it names exactly one: *"it allocates one single-use audio source per voice because the
   * platform has no other way to play a buffer."* Fourteen gains built with the context keep that
   * sentence true — `PAN_BUCKETS` above is the same argument for the same reason.
   *
   * ⚠️ **SO THE WET IS NOT POSITIONED, AND THAT IS CORRECT RATHER THAN A SAVING.** The dry signal goes
   * to its own panner and carries the fact the player dodges on (0127); the tail arrives from
   * everywhere, which is what a tail does in a room.
   */
  let sends: GainNode[] = [];


  return {
    ready(): boolean {
      return ctx !== null && ctx.state === 'running';
    },
    unlock(): void {
      if (ctx === null) {
        /*
          ⚠️ **`webkitAudioContext` is still the only name on older iOS**, and a missing constructor
          is a real state rather than an error: the game is silent and everything else works. Read
          off `window` with a guard rather than through a cast, per
          `docs/decisions/0016-a-hub-enumerates-kinds.md`'s ban on `any`.
        */
        const Ctor = window.AudioContext ?? window.webkitAudioContext;
        if (Ctor === undefined) return;
        ctx = new Ctor();
        master = ctx.createGain();
        master.gain.value = MASTER_GAIN;
        /*
          ⚠️ **THE BUS CANNOT CLIP, WHICH IS WHAT LET THE VOICE CAP GO** — 0183. Every cue and the
          room's return arrive at `master`; this sits between it and the speaker, so it is the LAST
          thing in the chain and the only place a total can be bounded. Below `CUE_LIMIT` it is
          identity, so nothing the old cap allowed is touched.

          ⚠️ **THE CURVE IS SAMPLED ONCE AND IS DEFINED OVER [-1, 1]**, which is the whole domain a
          `WaveShaperNode` reads — 0176's third break is about a guard that forgot the browser clamps
          outside it. Here the clamp is the backstop rather than the mechanism: the knee has already
          taken anything that large below full scale.
        */
        // @setup: one shaper and one curve at context creation, read by the audio thread thereafter.
        const ceiling = ctx.createWaveShaper();
        const curve = new Float32Array(CURVE_POINTS);
        for (let i = 0; i < CURVE_POINTS; i++) curve[i] = limit((i / (CURVE_POINTS - 1)) * 2 - 1, CUE_LIMIT);
        ceiling.curve = curve;
        master.connect(ceiling);
        ceiling.connect(ctx.destination);
        /*
          The bake, and it happens exactly once — this is `bakeAtlas`'s moment for the other channel.
          It is on the gesture rather than at boot because a buffer needs a context to live in, and
          the samples are cheap enough that the press it rides on cannot feel it: twelve cues, about
          four seconds of mono at 22kHz.
        */
        /*
          The places a cue may sound from, evenly across the field and built once — 0127. The
          middle bucket is exactly centre, which is where everything with no position goes.
        */
        // @setup: nine panners at context creation, read by the audio thread thereafter.
        places = [];
        for (let i = 0; i < PAN_BUCKETS; i++) {
          const place = ctx.createStereoPanner();
          place.pan.value = ((i / (PAN_BUCKETS - 1)) * 2 - 1) * CUE_PAN_LIMIT;
          place.connect(master);
          places.push(place);
        }
        /*
          ⚠️ **THE ROOM, BUILT ONCE AND NEVER TOUCHED AGAIN** — 0173. `normalize = false` because the
          impulse's level is authored: the browser's default rescales an impulse to unit power, which
          would make `CUE_ROOM_GAIN` mean something different on every engine and the tail's own decay
          unreadable from the code that draws it.
        */
        /*
          ⚠️ **AT `ctx.sampleRate` AND NOT AT `SAMPLE_RATE`, WHICH IS THE ONE THING A CONVOLVER MAKES
          FATAL.** Every other buffer in this file is created at the bake rate and RESAMPLED by the
          source node if the device disagrees — 44.1 kHz material on a 48 kHz context plays a hair
          slow and nobody has ever noticed. **A `ConvolverNode` throws instead**: *"the buffer sample
          rate of 44100 does not match the context rate of 48000"*, on the gesture, which takes the
          whole speaker down. Found by `tests/*.browser.test.ts` on the first run, and by nothing
          else — the headless guards bake at a rate they choose and never build a graph.
        */
        // @setup: one convolver, one return gain and fourteen sends at context creation.
        const room = ctx.createConvolver();
        room.normalize = false;
        const impulse = makeRoomImpulse(ctx.sampleRate, makeRng('room'));
        const tail = ctx.createBuffer(2, impulse[0].length, ctx.sampleRate);
        tail.getChannelData(0).set(impulse[0]);
        tail.getChannelData(1).set(impulse[1]);
        room.buffer = tail;
        const wet = ctx.createGain();
        wet.gain.value = CUE_ROOM_GAIN;
        room.connect(wet);
        wet.connect(master);
        sends = CUE_KINDS.map((kind) => {
          const send = ctx!.createGain();
          send.gain.value = CUES[kind].air ?? 0;
          send.connect(room);
          return send;
        });
        /*
          ⚠️ **FINISH THE PREWARM RATHER THAN RACE IT** — 0157. This is the gesture, and the two
          reads below are the only places the cold path is taken. A prewarm in flight has already
          synthesised most of what they are about to ask for, and for its whole life this threw that
          away: `prewarmed` is set on the LAST job, so 90% done read as not started.
        */
        drainPrewarm();
        const samples = prewarmed?.cues ?? bakeCues(SAMPLE_RATE);
        buffers = samples.map((variants) =>
          variants.map((data) => {
            const buffer = ctx!.createBuffer(1, data.length, SAMPLE_RATE);
            // `getChannelData().set` rather than `copyToChannel`, which types its argument as a
            // `Float32Array<ArrayBuffer>` specifically and rejects the plain one `sampleCue` returns.
            buffer.getChannelData(0).set(data);
            return buffer;
          }),
        );
        /*
          THE MUSIC, on the same gesture and out of the same context — decision 0090. It is built
          here rather than lazily
          because the four loops have to START together, and a layer created later starts wherever
          the bar happens to be.
        */
        music = makeMusicOut(ctx, master, prewarmed?.loops ?? bakeLoops(SAMPLE_RATE), SAMPLE_RATE);
      }
      // Every time, not only on the first: a backgrounded tab suspends the context behind us.
      if (ctx.state === 'suspended') void ctx.resume();
    },
    sound(index: number, velocity: number, pan: number): void {
      const variants = buffers[index];
      // The speaker takes the modulo, so an out-of-range variant is a bug rather than a state — but
      // a missing buffer is silence and never a throw, on the same terms as an absent context.
      const buffer = variants?.[velocity] ?? variants?.[0];
      const place = places[panBucket(pan)];
      if (ctx === null || master === null || buffer === undefined || place === undefined) return;
      /*
        ⚠️ **THE ONE UNAVOIDABLE ALLOCATION, and the reason this file is on the cold list with its
        reason written out.** A `BufferSourceNode` is single-use by specification — `start()` may be
        called once and the node cannot be rewound — so there is no pool to take it from. What bounds
        it is `CUE_KINDS.length`, which `hold` gives and 0183 has the arithmetic for.
      */
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      // Into its PLACE rather than straight at the master — 0127. The panner is already wired to the
      // master, so the bus and every gain on it are unchanged.
      source.connect(place);
      /*
        ⚠️ **AND INTO ITS SEND, WHICH IS ONE EXTRA `connect` AND NO EXTRA NODE** — 0173. A dry cue is
        a cue in an anechoic chamber, which is what every one of them was. The gain is the row's own
        `air`, set once at unlock, so a cue that states none never reaches the room at all.
      */
      const send = sends[index];
      if (send !== undefined && send.gain.value > 0) source.connect(send);
      source.start();
    },
    duck(amount: number): void {
      // Silently nothing before the first gesture, exactly as `sound` is — a game with no context yet
      // has no bed to push down.
      music?.duck(amount);
    },
    music(): MusicOut | null {
      return music;
    },
    release(): void {
      void ctx?.close();
      ctx = null;
      master = null;
      music = null;
      buffers = [];
      places = [];
      /*
        ⚠️ **AND THE SENDS, WHICH IS THE HALF THAT WOULD HAVE THROWN RATHER THAN LEAKED** — 0173. Every
        other line here drops a reference; this one drops a node belonging to a CLOSED context, and
        `source.connect` across two contexts is an `InvalidAccessError` rather than silence. `places`
        is the same shape and has always been cleared here for the same reason.
      */
      sends = [];
    },
  };
}

/**
 * The longest any cue may be, in samples — what `MAX_CUE_SECONDS` means at the baked rate.
 *
 * Exported so `tests/sound.test.ts` asserts the ceiling in the unit the buffers are actually measured
 * in, rather than re-deriving it and thereby agreeing with itself.
 */
export const MAX_CUE_SAMPLES = Math.round(MAX_CUE_SECONDS * SAMPLE_RATE);
