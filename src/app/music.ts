/**
 * The music: four patterns turned into four loops at boot, played at four gains.
 *
 * `docs/decisions/0090-the-music-is-four-loops.md`. The tables are next door in
 * `src/content/music.ts`; what is here is the expansion, the mixer and the one rule that decides how
 * far up the ladder a run has got.
 *
 * ── THREE HALVES, ON `src/app/sound.ts`'s OWN TERMS ─────────────────────────────────────────────
 *
 * 1. `bakeLoops` — patterns in, `Float32Array`s out. **No browser in it**, so `scripts/hear.mjs`
 *    can write the music to a `.wav` for the only instrument that can judge it — 0027 for the
 *    channel with nothing to look at.
 * 2. `musicLevelFor` — how far up the ladder the run is. Pure arithmetic over two numbers, so
 *    `tests/music.test.ts` drives it directly and no browser is involved in the thing most likely to
 *    be wrong.
 * 3. `makeMusicOut` — the only part that knows Web Audio exists.
 *
 * ⚠️ **The synthesiser is `src/app/sound.ts`'s and is imported rather than repeated.** A note is a
 * `CueLayer`; the music and the effects come out of one instrument, which is what stops the
 * soundtrack sounding like it was made somewhere else. What this file adds is the wrap-around, which
 * is the only thing a loop needs that a cue does not.
 */

import {
  BEAT_SECONDS,
  PHRASE_SECONDS,
  secondsOfLayer,
  MUSIC,
  MUSIC_GAIN,
  MUSIC_LADDER,
  MUSIC_LAYERS,
  MUSIC_ROOT,
  BOSS_APPROACH_UNITS,
  AURA_LAYERS,
  AURA_NEAR_UNITS,
  AURA_FAR_UNITS,
  AURA_CURVE,
  type MusicLayer,
  type MusicLevel,
  type MusicVoice,
} from '../content/music.ts';
import { sampleLayerInto } from './sound.ts';
import { makeRng, type Rng } from '../sim/rng.ts';
import { STEPS_PER_SECOND } from '../state/screens.ts';

/**
 * One voice, expanded over the loop.
 *
 * ⚠️ **Every note is rendered with WRAP, which is the whole difference between a loop and a bar.** A
 * note whose tail runs past the end has to arrive at the start of the buffer, or every repetition
 * has a silent notch where the decay should be — and it is audible immediately, because it happens
 * at the same place every 3.6 seconds.
 */
function renderVoice(voice: MusicVoice, seconds: number, rate: number, rng: Rng, into: Float32Array): void {
  const step = BEAT_SECONDS / voice.perBeat;
  for (let i = 0; i < voice.steps.length; i++) {
    const value = voice.steps[i];
    if (value === null || value === undefined) continue;
    const at = i * step;
    // ⚠️ Its OWN layer's length since 0095, not one shared loop — a pattern longer than the layer it
    // is in is a pattern with its tail silently cut, and the two lengths are 2 bars and 4.
    if (at >= seconds) break;
    /*
      ⚠️ **A pitched voice REPLACES the note's own sweep and a drum keeps it.** A kick is a fall from
      150 to 45 whatever the key is; a bass note is the key. One field, two meanings, and the row
      says which — `src/content/music.ts` has the argument.
    */
    const pitch = voice.pitched ? MUSIC_ROOT * Math.pow(2, voice.octave + value / 12) : 0;
    const note = voice.pitched
      ? { ...voice.note, from: pitch, to: pitch }
      : voice.note;
    sampleLayerInto(note, rate, rng, into, Math.round(at * rate), true);
  }
}

/**
 * Every loop, in `MUSIC_LAYERS` order — **and they are no longer all the same length.**
 *
 * ⚠️ **Each layer gets its OWN named stream** — `docs/decisions/0021-one-stream-per-concern.md`. The
 * only randomness in the music is the noise in the drums, and without this a fifth layer added later
 * would re-roll the four above it. It costs nothing and it is the rule.
 *
 * ⚠️ **A LAYER IS A WHOLE MULTIPLE OF THE SHORTEST, WHICH IS 0090 AMENDED RATHER THAN BROKEN** —
 * `docs/decisions/0095-the-level-has-its-own-music.md`. Identical lengths were how 0090 guaranteed
 * that four loops started together can never come apart; **whole multiples give exactly the same
 * guarantee** — a 4-bar pad and a 2-bar drum loop realign every 4 bars, for ever, because both are
 * an exact number of samples. What identical lengths also did was forbid a chord progression, and a
 * progression is what a power ballad IS.
 */
export function bakeLoops(rate: number): Record<MusicLayer, Float32Array> {
  const root = makeRng('music');
  const out = {} as Record<MusicLayer, Float32Array>;
  for (const layer of MUSIC_LAYERS) {
    const seconds = secondsOfLayer(layer);
    const buffer = new Float32Array(Math.round(seconds * rate));
    const rng = root.stream(layer);
    for (const voice of MUSIC[layer]) renderVoice(voice, seconds, rate, rng, buffer);
    out[layer] = buffer;
  }
  return out;
}

/**
 * How far up the ladder a run is, from where the camera is and where the boss is.
 *
 * ── THE SIM KNOWS NOTHING ABOUT THIS, AND THAT IS 0024's BAN ────────────────────────────────────
 *
 * ⚠️ **Two numbers in, a name out.** `src/app/frame.ts` cannot see whether the player has sound on
 * and must not be able to; this reads the world in the other direction — a distance the level script
 * already carries — so nothing about the music can reach a step. It is the same shape as the cue
 * calls: the shell asks the world a question, the world is never told the answer.
 *
 * ⚠️ **`playing` is not a parameter and the caller decides**, because *is the player in a level* is a
 * fact about the screen and screens are `src/state/screens.ts`'s. Everything not in a level is
 * `calm`, which is the title, the level break and the run-over screen, and it is why the drone never
 * stops: the music is one continuous piece and the levels happen inside it.
 */
export function musicLevelFor(cameraAlong: number, bossAt: number, bossOnField: boolean): MusicLevel {
  if (bossOnField) return 'boss';
  return bossAt - cameraAlong <= BOSS_APPROACH_UNITS ? 'approach' : 'run';
}

/**
 * How near the boss is, `0` at `AURA_FAR_UNITS` and `1` at `AURA_NEAR_UNITS`.
 *
 * ⚠️ **The gap between the HULLS, not between the centres.** Two bosses of different sizes at the
 * same centre distance are not the same distance away — `src/content/bosses.ts` runs from a radius of
 * 11 to one of 13 and will run wider — and what the player is judging is the gap they are flying
 * into. Passing the radii in rather than a raw distance is what keeps that true when a boss changes
 * size.
 *
 * ⚠️ **Bent on the way out, so the last few units are where it moves.** A linear ramp spends most
 * of its travel at distances the player is not thinking about; the interesting part of *"as it gets
 * closer"* is the end, and this is the curve that puts it there.
 *
 * ⚠️ **IT WAS `clamped * clamped` AND THE EXPONENT IS NOW A CONSTANT** —
 * `docs/decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md`. Squaring put 0091's shape in
 * far harder than 0091's sentence asked for, and the reason it survived a decision and a play-test is
 * that a multiply has no number in it: the only edits the shape admitted were *square it* and *do
 * not*. `AURA_CURVE` is the knob that was missing, and the argument for its value is on it.
 *
 * ⚠️ **`0` when there is no boss**, which is what makes the aura's absence the same code path as a
 * boss on the far side of the screen rather than a branch somewhere else.
 */
export function auraNearness(gap: number): number {
  const span = AURA_FAR_UNITS - AURA_NEAR_UNITS;
  const raw = (AURA_FAR_UNITS - gap) / span;
  const clamped = raw < 0 ? 0 : raw > 1 ? 1 : raw;
  return Math.pow(clamped, AURA_CURVE);
}

/**
 * How near the boss is, from the two bodies rather than from a distance.
 *
 * ⚠️ **THE SUBTRACTION LIVES HERE AND IT USED TO LIVE AT THE CALL SITE, WHICH A PROBE CAUGHT.** *The
 * gap is between the hulls* is part of the rule, and with it written in `src/app/mount.ts` the only
 * thing a test could drive was the curve — so `npm run prove` reported STILL GREEN when the radii
 * were dropped. A rule that lives in the shell is a rule with no guard over it.
 *
 * ⚠️ **A bigger boss is NEARER at the same centre distance**, which is the whole point: a radius runs
 * from 11 to 13 across the seven and will run wider, and what the player is judging is the space they
 * are flying into rather than where two centres are.
 */
export function auraNearnessFor(bossAlong: number, bossRadius: number, shipAlong: number, shipRadius: number): number {
  return auraNearness(Math.abs(bossAlong - shipAlong) - bossRadius - shipRadius);
}

/**
 * How far the loops may fall out of phase with the sim before they are moved, in seconds.
 *
 * ── WHY THERE IS A THRESHOLD AT ALL RATHER THAN A CONTINUOUS SERVO ──────────────────────────────
 *
 * `docs/decisions/0094-in-time-is-not-in-phase.md`. The obvious build is a servo on `playbackRate`,
 * nudging the loops a fraction of a percent until the error is gone — no allocation, no seam, no
 * discontinuity anywhere. **It cannot correct the errors this game actually produces.** A trim small
 * enough to be inaudible as pitch is about 0.2%, which takes twenty-five seconds to absorb fifty
 * milliseconds; `src/app/loop.ts`'s `MAX_STEPS` is 5, so a single 200ms hitch throws away seven steps
 * and 117ms in one frame. The servo would spend its life behind.
 *
 * ⚠️ **So the correction is a JUMP, and the threshold is what keeps it rare.** 50ms is half a
 * sixteenth-note triplet at 150 BPM — the point at which a gun locked to the sim stops reading as
 * locked to the music. Below it nothing moves at all.
 *
 * ⚠️ **Crystal drift alone never reaches this and is not what it is for.** `AudioContext.currentTime`
 * and the display clock track the same system clock to within tens of parts per million: under ten
 * milliseconds across a three-minute level, a tenth of a sixteenth. **What this exists for is dropped
 * steps** — a sim that fell behind wall clock and, by 0022's design, does not try to catch up.
 */
const REPHASE_SECONDS = 0.05;

/**
 * How far ahead a re-phase must be scheduled, in seconds.
 *
 * Long enough that the audio thread has the buffer switch before it needs it, and short enough that
 * the correction lands inside the loop it was decided in.
 */
const SCHEDULE_AHEAD = 0.06;

/**
 * Seconds until the loops should be restarted to put them back in phase with the sim, or `null` when
 * they are close enough to leave alone.
 *
 * ⚠️ **Pure, and separated from the browser for exactly the reason `musicLevelFor` is** — this is the
 * arithmetic most likely to be wrong and the only part a headless test can drive. `makeMusicOut`
 * below does nothing but ask this and act on the answer.
 *
 * ⚠️ **THE ERROR IS WRAPPED INTO HALF A LOOP EITHER WAY, AND THAT IS THE WHOLE TRICK.** The music is
 * a loop, so being one entire loop behind is *being in phase* — audibly identical, sample for sample.
 * Without the wrap, a backgrounded tab returns with an error of many seconds and the correction is a
 * lurch; with it, thirty seconds away is at worst 1.6 seconds out and usually far less.
 *
 * @param audioElapsed seconds of audio played since the loops were last anchored
 * @param simElapsed seconds the SIM has run since that same instant
 * @param minAhead the least notice the scheduler will accept
 */
export function rephaseIn(audioElapsed: number, simElapsed: number, minAhead: number): number | null {
  /*
    ⚠️ **NOTHING IS CORRECTED UNTIL THE CURRENT ANCHOR HAS PLAYED A WHOLE LOOP, AND IT IS A RATE LIMIT
    AS MUCH AS A RULE.** Each correction re-anchors, so this is also the ceiling on how often the swap
    can happen: six source nodes per `PHRASE_SECONDS` at the very worst, which is the budget
    [`the-gun-on-the-grid-mapped`](../../reports/the-gun-on-the-grid-mapped-2026-08-09.md) costed the
    idea at before it was built.

    ⚠️ **`tests/sound.browser.test.ts` is what put it here**, by counting source nodes and finding 37
    where it expected 7. A test drives the sim as fast as it can while the audio clock stands still,
    so the measured error grows without bound and every frame asks for a correction — and the real
    game can do a milder version of the same thing, because `src/app/loop.ts` may run five steps in
    one frame. **A phase error measured over less than a loop is measuring the catch-up**, not the
    drift, and there is nothing to correct before the loop has been round once.
  */
  if (audioElapsed < PHRASE_SECONDS) return null;
  const drift = audioElapsed - simElapsed;
  const error = drift - Math.round(drift / PHRASE_SECONDS) * PHRASE_SECONDS;
  if (Math.abs(error) <= REPHASE_SECONDS) return null;
  /*
    ⚠️ **The correction lands on a loop boundary of the SIM's, never wherever we happen to notice.**
    A loop restarted mid-phrase cuts every tail crossing the join — which is the notch
    `docs/decisions/0090-the-music-is-four-loops.md`'s seam guard exists to keep out of the bake, and
    it would be no better arriving at runtime. At a boundary the loop was going back to zero anyway,
    so all the correction moves is WHEN.

    Never zero, on `stepsToGrid`'s reasoning in `src/app/frame.ts`: exactly on a boundary the answer
    is a whole loop away, not now.
  */
  let delay = PHRASE_SECONDS - (simElapsed % PHRASE_SECONDS);
  while (delay < minAhead) delay += PHRASE_SECONDS;
  return delay;
}

/** What the shell drives. The one interface the browser half has to satisfy. */
export interface MusicOut {
  /** Start the four loops, in sync. Idempotent — a second call is ignored. */
  start(): void;
  /**
   * Keep the loops in phase with the sim's own clock, given how many steps it has run.
   *
   * Called every frame and does nothing almost every time — 0094.
   */
  phaseTo(simSteps: number): void;
  /**
   * Move to a level, with how near the boss is. A ramp, never a cut.
   *
   * `nearness` scales the aura layers and is ignored by every other one — 0091.
   */
  setLevel(level: MusicLevel, nearness: number): void;
  /** Silence the music without stopping it, for the sound setting. */
  setOn(on: boolean): void;
  /** Which level is currently asked for, so a guard can read it. */
  level(): MusicLevel;
}

/**
 * How long a change of level takes, in seconds.
 *
 * ⚠️ **Long enough to be a build and short enough to be about the boss.** A cut between levels would
 * be one piece of music stopping and another starting, which is the thing four synchronised loops
 * exist to avoid; at 1.6 seconds the beat arrives over about four beats of the bar it arrives in.
 */
const RAMP_SECONDS = 1.6;

/**
 * How long the AURA takes to follow the boss, in seconds.
 *
 * ⚠️ **A quarter of a level change, because it is tracking a thing the player is steering.** At
 * `RAMP_SECONDS` the aura would still be swelling after the player had already backed out of range,
 * which is a sound that reports where they were rather than where they are.
 */
const AURA_RAMP_SECONDS = 0.4;

/**
 * The Web Audio half.
 *
 * ⚠️ **Four sources and four gains for the whole run, created once.** This is the answer to the
 * allocation problem `src/app/sound.ts` has to state a bound for instead: a looping
 * `AudioBufferSourceNode` is started once and never replaced, so the music adds nothing at all to the
 * per-step budget `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` counts.
 *
 * ⚠️ **All four start at ONE timestamp**, which is what keeps them in phase for the length of a run.
 * Starting them as they are needed would put each one wherever the bar happened to be.
 */
export function makeMusicOut(
  ctx: AudioContext,
  destination: AudioNode,
  loops: Record<MusicLayer, Float32Array>,
  rate: number,
): MusicOut {
  const gains = {} as Record<MusicLayer, GainNode>;
  const buffers = {} as Record<MusicLayer, AudioBuffer>;
  // @setup: one array for the run, reused in place by `swapTo` — a re-phase replaces its contents
  // rather than allocating a second list.
  const sources: AudioBufferSourceNode[] = [];
  let started = false;
  let on = true;
  let current: MusicLevel = 'calm';
  let near = 0;
  /** Audio time at which loop position zero last began. */
  let anchorAudio = 0;
  /** Sim seconds at that same instant, or `null` until the first frame after a start. */
  let anchorSim: number | null = null;

  const master = ctx.createGain();
  master.gain.value = MUSIC_GAIN;
  master.connect(destination);

  for (const layer of MUSIC_LAYERS) {
    const data = loops[layer];
    const buffer = ctx.createBuffer(1, data.length, rate);
    buffer.getChannelData(0).set(data);
    buffers[layer] = buffer;
    const gain = ctx.createGain();
    gain.gain.value = MUSIC_LADDER.calm[layer];
    gain.connect(master);
    gains[layer] = gain;
  }

  /**
   * Put a fresh set of loops on the air at `when`, and take the old set off at exactly that instant.
   *
   * ⚠️ **A source node is single-use by specification**, which is why this allocates six of them —
   * the same fact `src/app/sound.ts` is on `tests/budget.test.ts`'s deliberately-cold list for. It
   * runs at a start and then only on a correction, which 0094 sizes at *rare*.
   *
   * ⚠️ **The old set is stopped AT `when` and not before**, so there is no instant with nothing
   * playing. Overlap of exactly zero is what makes the swap a join rather than a gap.
   */
  const swapTo = (when: number): void => {
    for (let i = 0; i < sources.length; i++) sources[i]!.stop(when);
    sources.length = 0;
    for (const layer of MUSIC_LAYERS) {
      const source = ctx.createBufferSource();
      source.buffer = buffers[layer];
      source.loop = true;
      source.connect(gains[layer]);
      source.start(when);
      sources.push(source);
    }
    anchorAudio = when;
  };

  return {
    /*
      ⚠️ **THE SOURCES ARE MADE HERE RATHER THAN ABOVE, AND A GUARD IS WHY.** Building them with the
      gains reads as tidier and it makes four looping voices exist from the moment the context does —
      so `tests/sound.browser.test.ts`'s *sound is off and the game played anyway* went red, correctly:
      it counts sources, and four of them running into a muted gain are still four of them running.

      Silence should be silence. Nothing is created until the music is actually wanted, which is also
      the honest reading of *the player turned it off*.
    */
    start(): void {
      if (started || !on) return;
      started = true;
      /*
        ⚠️ **ONE timestamp for all four, a hair in the future so none of them misses it.** This is the
        line the whole design rests on: four loops of identical length started at the same instant
        stay in phase for the length of a run, and there is no scheduler anywhere to re-align them if
        they do not.
      */
      const when = ctx.currentTime + 0.05;
      swapTo(when);
      // The sim's side of the anchor is not known until a frame reports it — 0094.
      anchorSim = null;
    },
    /*
      ⚠️ **IN TIME IS NOT IN PHASE, AND THIS IS THE HALF THAT IS NOT ARITHMETIC** — 0094. The gun runs
      on the fixed-step clock and these loops on the `AudioContext`'s; two crystals agree closely
      enough to ignore, and a sim that DROPS steps does not (`src/app/loop.ts` throws away everything
      past `MAX_STEPS` rather than spiralling, which is 0022 working as designed and costs the phase).

      ⚠️ **The sim is never told anything.** This reads `simSteps` out of the world and moves the
      audio; nothing about the music reaches a step, which is the same direction `musicLevelFor` runs
      in and the reason `docs/decisions/0024-the-accessibility-floor-is-settings.md` is not touched. A
      player with the sound off flies exactly the same game.
    */
    phaseTo(simSteps: number): void {
      if (!started || !on) return;
      const simSeconds = simSteps / STEPS_PER_SECOND;
      if (anchorSim === null) {
        // The first frame after a start: the loops begin slightly in the future, so the sim instant
        // that matches loop position zero is that far ahead of now.
        anchorSim = simSeconds + (anchorAudio - ctx.currentTime);
        return;
      }
      const delay = rephaseIn(ctx.currentTime - anchorAudio, simSeconds - anchorSim, SCHEDULE_AHEAD);
      if (delay === null) return;
      swapTo(ctx.currentTime + delay);
      anchorSim = simSeconds + delay;
    },
    setLevel(level: MusicLevel, nearness: number): void {
      current = level;
      near = nearness;
      if (!on) return;
      for (const layer of MUSIC_LAYERS) {
        /*
          ⚠️ **The aura follows the boss and everything else follows the level** — 0091. Its row in
          the ladder is a CEILING, and this is where it stops being one.

          ⚠️ **And it ramps far faster than a level change does.** A level is a structural move and
          wants a second and a half; the aura is the player flying at something, and at that time
          constant it would still be arriving after they had backed off again.
        */
        const aura = AURA_LAYERS.includes(layer);
        const target = MUSIC_LADDER[level][layer] * (aura ? nearness : 1);
        gains[layer].gain.cancelScheduledValues(ctx.currentTime);
        gains[layer].gain.setTargetAtTime(target, ctx.currentTime, (aura ? AURA_RAMP_SECONDS : RAMP_SECONDS) / 3);
      }
    },
    setOn(next: boolean): void {
      on = next;
      master.gain.setTargetAtTime(next ? MUSIC_GAIN : 0, ctx.currentTime, 0.08);
      // Switching it back on starts the loops if the run has been played in silence up to now. They
      // still start together, which is all the design asks — it is the phase BETWEEN them that has
      // to hold, never the phase against the level.
      if (next) {
        this.start();
        this.setLevel(current, near);
      }
    },
    level(): MusicLevel {
      return current;
    },
  };
}
