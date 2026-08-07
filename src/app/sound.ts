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

import { CUES, CUE_KINDS, MAX_CUE_SECONDS, type CueKind, type CueRow } from '../content/cues.ts';
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
 * ⚠️ **22050 rather than 48000, and it is a choice about the sound as much as the size.** It halves
 * the baked bytes and the synthesis time, its ceiling is 11kHz — above every partial these twelve
 * rows produce — and the band limit is audibly the one an arcade cabinet had. An `AudioBuffer` may
 * carry a rate the context does not run at; the browser resamples it on playback, so the samples are
 * the same on every device and the `.wav` `scripts/hear.mjs` writes is what actually plays.
 */
export const SAMPLE_RATE = 22050;

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

/** The share of full scale the whole mix gets, so `MAX_VOICES` at once cannot clip. */
const MASTER_GAIN = 0.55;

/** How long every cue takes to reach full amplitude, in seconds — short enough to read as an attack. */
const ATTACK_SECONDS = 0.004;

/**
 * How many time constants of exponential decay a cue spends.
 *
 * At 5, the tail is at 0.7% of peak when `seconds` runs out, which is inaudible — so the fade below
 * has almost nothing to do and cannot be heard doing it.
 */
const DECAY = 5;

/*
  ⚠️ **THERE IS NO FADE-OUT, AND THERE WAS ONE UNTIL A PROBE PROVED IT COULD NOT MATTER.** A buffer
  that stops mid-waveform clicks, so a two-millisecond ramp to zero at the end was written first and
  looked obviously correct. `npm run prove` reported STILL GREEN when it was deleted on purpose, and
  the reason is arithmetic: at `DECAY` time constants the envelope is already at 0.7% of peak when
  the buffer ends, which is a hundred times below where a click becomes audible. The ramp was
  defending a discontinuity the decay had already removed.

  `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` is what turned that from a comment nobody
  would have questioned into a line that is gone — and the assertion it left behind is the useful
  one: the guard now catches an envelope that never falls, which is a real failure, rather than a
  fade whose absence nothing can hear.
*/

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
  const length = Math.max(1, Math.round(row.seconds * rate));
  const out = new Float32Array(length);
  const attack = Math.max(1, Math.round(ATTACK_SECONDS * rate));
  /** Where in the waveform we are, in cycles. Fractional part is the position within one. */
  let phase = 0;
  /** The value sample-and-hold noise is currently holding, and the cycle it was drawn on. */
  let held = rng.range(-1, 1);
  let heldCycle = 0;
  for (let i = 0; i < length; i++) {
    const u = i / length;
    // Exponential in the frequency, which is what makes it linear to the ear.
    const freq = row.from * Math.pow(row.to / row.from, u);
    phase += freq / rate;
    let value: number;
    if (row.wave === 'sine') value = Math.sin(phase * Math.PI * 2);
    else if (row.wave === 'square') value = phase % 1 < 0.5 ? 1 : -1;
    else if (row.wave === 'saw') value = (phase % 1) * 2 - 1;
    else {
      // Sample and hold: one fresh draw per cycle of `freq`, held flat in between.
      const cycle = Math.floor(phase);
      if (cycle !== heldCycle) {
        heldCycle = cycle;
        held = rng.range(-1, 1);
      }
      value = held;
    }
    let envelope = Math.exp(-DECAY * u);
    if (i < attack) envelope *= i / attack;
    out[i] = value * envelope * row.gain;
  }
  return out;
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
    release(): void {
      void ctx?.close();
      ctx = null;
      master = null;
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
