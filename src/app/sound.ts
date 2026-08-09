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
 * is not removable, and it is bounded instead: at most `MAX_VOICES` per fixed step, asserted. That is
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md`'s own move — count the thing, do not
 * time it — applied to the one budget it did not anticipate.
 */

import { CUES, CUE_KINDS, MAX_CUE_SECONDS, type CueKind, type CueLayer, type CueRow } from '../content/cues.ts';
import { makeMusicOut, bakeLoops, type MusicOut } from './music.ts';
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

/**
 * How many cues may START on one fixed step.
 *
 * ⚠️ **This is the frame budget's audio twin and it is the honest guard in this file.** Every voice
 * is one unavoidable allocation and one more thing in the mix; four is enough for the densest real
 * instant in the game — a bomb going off among a volley, killing two things and taking a shield —
 * and it is a hard ceiling rather than a target. Past it the extra cues are DROPPED, not queued: a
 * queued cue arrives after the thing it was about, which is worse than silence.
 *
 * ⚠️ **Dropping is the same choice `src/sim/pool.ts` makes for a spawn**, and it is safe for the same
 * reason: every cue has a visual twin (`src/content/cues.ts`), so a dropped one loses emphasis and
 * never loses information. That is 0024's *no information by audio alone* doing work it was not
 * obviously written for.
 */
export const MAX_VOICES = 4;

/**
 * The share of full scale the CUES get, so `MAX_VOICES` at once cannot clip.
 *
 * ⚠️ **0.55 → 0.45, reported from play** — *"the game sfx are too loud over the background music"*.
 * At 0.55 the four loudest cues at once reached 0.92 of full scale against the music's 0.52, which is
 * a ratio of nearly two to one; it is 1.12 now.
 *
 * ⚠️ **The cues stay AHEAD of the music and always must.**
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` makes every cue information — a shield
 * taken, a hit that did not land — and the music is not. When the two compete it is the music that
 * gives way, which is why this moved less far than `MUSIC_GAIN` moved up.
 */
const MASTER_GAIN = 0.45;

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
 */
function saturate(x: number, amount: number): number {
  if (amount <= 0) return x;
  const k = 1 + amount * 6;
  return Math.tanh(x * k) / Math.tanh(k);
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
export function sampleCue(row: CueRow, rate: number, rng: Rng): Float32Array {
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
    out[i] = saturate(out[i]!, row.glue) * row.gain * fade;
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
export function bakeCues(rate: number = SAMPLE_RATE): Float32Array[] {
  // Its own root, so a cosmetic roll anywhere else in the game cannot move a waveform, and vice
  // versa — `docs/decisions/0021-one-stream-per-concern.md`.
  const root = makeRng('cues');
  return CUE_KINDS.map((kind) => sampleCue(CUES[kind], rate, root.stream(kind)));
}

/** What actually makes a noise. The one interface the browser half has to satisfy. */
export interface AudioOut {
  /** Whether anything can be heard yet — false until a gesture has unlocked the context. */
  ready(): boolean;
  /** Sound the cue at this index in `CUE_KINDS`. Called only when the speaker has allowed it. */
  sound(index: number): void;
}

export interface Speaker {
  /**
   * A fixed step happened. Resets the per-step voice count and advances the clock holds are measured
   * against.
   */
  step(): void;
  /** Sound a cue, if the mute, the hold and the voice cap all allow it. */
  play(kind: CueKind): void;
  /** Whether the player wants sound at all. */
  setOn(on: boolean): void;
  /** How many voices started on the current step — the counted budget, for the guard to read. */
  voices(): number;
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
  let voices = 0;
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

  return {
    step(): void {
      clock++;
      voices = 0;
    },
    play(kind: CueKind): void {
      if (!on) return;
      const index = indexOf[kind];
      /*
        ⚠️ **`voices` counts what SOUNDED, never what was asked for**, and that is the load-bearing
        part rather than the order of the two checks below. A cap that counted drops would let four
        retriggers of one held cue fill the step's budget and lock out the different cues behind them
        — the cap causing precisely the failure it exists to prevent.

        ⚠️ **An earlier draft of this comment claimed the ORDER mattered and it does not**: whichever
        check runs first, a held repeat returns before `voices` moves. `npm run prove` reported STILL
        GREEN on a probe that swapped them, which is
        `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` catching a guard standing over nothing.
        The order below is cheap-first and that is all it is.
      */
      if (clock - (lastAt[index] ?? 0) < CUES[kind].hold) return;
      if (voices >= MAX_VOICES) return;
      if (!out.ready()) return;
      lastAt[index] = clock;
      voices++;
      out.sound(index);
    },
    setOn(next: boolean): void {
      on = next;
    },
    voices(): number {
      return voices;
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
export function makeAudioOut(): WebAudioOut {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let buffers: AudioBuffer[] = [];
  let music: MusicOut | null = null;

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
        master.connect(ctx.destination);
        /*
          The bake, and it happens exactly once — this is `bakeAtlas`'s moment for the other channel.
          It is on the gesture rather than at boot because a buffer needs a context to live in, and
          the samples are cheap enough that the press it rides on cannot feel it: twelve cues, about
          four seconds of mono at 22kHz.
        */
        const samples = bakeCues(SAMPLE_RATE);
        buffers = samples.map((data) => {
          const buffer = ctx!.createBuffer(1, data.length, SAMPLE_RATE);
          // `getChannelData().set` rather than `copyToChannel`, which types its argument as a
          // `Float32Array<ArrayBuffer>` specifically and rejects the plain one `sampleCue` returns.
          buffer.getChannelData(0).set(data);
          return buffer;
        });
        /*
          THE MUSIC, on the same gesture and out of the same context — decision 0090. It is built
          here rather than lazily
          because the four loops have to START together, and a layer created later starts wherever
          the bar happens to be.
        */
        music = makeMusicOut(ctx, master, bakeLoops(SAMPLE_RATE), SAMPLE_RATE);
      }
      // Every time, not only on the first: a backgrounded tab suspends the context behind us.
      if (ctx.state === 'suspended') void ctx.resume();
    },
    sound(index: number): void {
      const buffer = buffers[index];
      if (ctx === null || master === null || buffer === undefined) return;
      /*
        ⚠️ **THE ONE UNAVOIDABLE ALLOCATION, and the reason this file is on the cold list with its
        reason written out.** A `BufferSourceNode` is single-use by specification — `start()` may be
        called once and the node cannot be rewound — so there is no pool to take it from. What bounds
        it is `MAX_VOICES`, checked by the speaker before this is ever reached.
      */
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(master);
      source.start();
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
