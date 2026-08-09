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
  LOOP_SECONDS,
  MUSIC,
  MUSIC_GAIN,
  MUSIC_LADDER,
  MUSIC_LAYERS,
  MUSIC_ROOT,
  BOSS_APPROACH_UNITS,
  type MusicLayer,
  type MusicLevel,
  type MusicVoice,
} from '../content/music.ts';
import { sampleLayerInto } from './sound.ts';
import { makeRng, type Rng } from '../sim/rng.ts';

/**
 * One voice, expanded over the loop.
 *
 * ⚠️ **Every note is rendered with WRAP, which is the whole difference between a loop and a bar.** A
 * note whose tail runs past the end has to arrive at the start of the buffer, or every repetition
 * has a silent notch where the decay should be — and it is audible immediately, because it happens
 * at the same place every 3.6 seconds.
 */
function renderVoice(voice: MusicVoice, rate: number, rng: Rng, into: Float32Array): void {
  const step = BEAT_SECONDS / voice.perBeat;
  for (let i = 0; i < voice.steps.length; i++) {
    const value = voice.steps[i];
    if (value === null || value === undefined) continue;
    const at = i * step;
    if (at >= LOOP_SECONDS) break;
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
 * The four loops, in `MUSIC_LAYERS` order.
 *
 * ⚠️ **Each layer gets its OWN named stream** — `docs/decisions/0021-one-stream-per-concern.md`. The
 * only randomness in the music is the noise in the drums, and without this a fifth layer added later
 * would re-roll the four above it. It costs nothing and it is the rule.
 */
export function bakeLoops(rate: number): Record<MusicLayer, Float32Array> {
  const root = makeRng('music');
  const length = Math.round(LOOP_SECONDS * rate);
  const out = {} as Record<MusicLayer, Float32Array>;
  for (const layer of MUSIC_LAYERS) {
    const buffer = new Float32Array(length);
    const rng = root.stream(layer);
    for (const voice of MUSIC[layer]) renderVoice(voice, rate, rng, buffer);
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

/** What the shell drives. The one interface the browser half has to satisfy. */
export interface MusicOut {
  /** Start the four loops, in sync. Idempotent — a second call is ignored. */
  start(): void;
  /** Move to a level. A ramp, never a cut. */
  setLevel(level: MusicLevel): void;
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
  let started = false;
  let on = true;
  let current: MusicLevel = 'calm';

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
      for (const layer of MUSIC_LAYERS) {
        const source = ctx.createBufferSource();
        source.buffer = buffers[layer];
        source.loop = true;
        source.connect(gains[layer]);
        source.start(when);
      }
    },
    setLevel(level: MusicLevel): void {
      current = level;
      if (!on) return;
      for (const layer of MUSIC_LAYERS) {
        gains[layer].gain.cancelScheduledValues(ctx.currentTime);
        gains[layer].gain.setTargetAtTime(MUSIC_LADDER[level][layer], ctx.currentTime, RAMP_SECONDS / 3);
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
        this.setLevel(current);
      }
    },
    level(): MusicLevel {
      return current;
    },
  };
}
