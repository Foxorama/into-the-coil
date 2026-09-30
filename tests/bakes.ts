/**
 * The music, synthesised once per process and handed out as copies.
 *
 * ── WHY A SUITE MAY NOT CALL `bakeLoops` MORE THAN ONCE ─────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0115-a-probe-runs-its-own-guard.md`.** `bakeLoops` synthesises 272 seconds of
 * audio and costs about two and a half seconds. `tests/music.test.ts` called it **six** times — four
 * inside `it` bodies and one at the head of each of two `describe`s — so fifteen of its thirty-six
 * seconds were the same numbers computed six times, and every one of its forty-two probes paid for
 * all of them.
 *
 * ⚠️ **`tests/music.test.ts` HAD ALREADY FOUND THIS ONCE AND FIXED IT LOCALLY.** Its mixer carries
 * *"BAKED AND MIXED ONCE, AND THE FULL SUITE IS WHAT SAID SO"* — a `describe`-scoped bake written
 * after four rungs meant four bakes and a five-second timeout. The finding was right and the scope
 * was too small; this is the same fix at the scope the cost actually has.
 *
 * ── COPIES, AND THAT IS NOT CAUTION ─────────────────────────────────────────────────────────────
 *
 * ⚠️ **A shared buffer would be a new way for one test to change another's subject**, and it would do
 * it silently — a stray write in test A moves what test B measures, with both green and neither
 * mentioning audio. That is the shape `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` exists to
 * refuse, and no probe can catch it because it is not a guard failing, it is a guard measuring
 * something else.
 *
 * ⚠️ **The copy costs about forty milliseconds against a bake's two and a half seconds**, so every
 * caller keeps exactly today's semantics — its own array, of its own bytes — at a sixtieth of the
 * price. Nothing here trades correctness for time; what is removed is only the repetition.
 *
 * ⚠️ **The cache is safe because the bake is DETERMINISTIC**, which is not an assumption:
 * `docs/decisions/0021-one-stream-per-concern.md` gives each layer its own named stream and
 * `tests/sound.test.ts` holds the prewarmed and cold paths equal sample for sample. Two bakes at one
 * rate cannot differ, so one bake is the whole answer.
 *
 * ⚠️ **`tests/sound.test.ts`'s cold-versus-prewarmed test deliberately does NOT use this.** Its
 * subject IS that baking twice gives the same answer, and handing it one bake twice would be the
 * guard measuring itself — the failure
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` is named for.
 */

import { Worker } from 'node:worker_threads';
import { availableParallelism } from 'node:os';
import { bakeLayer, layerNotes } from '../src/app/music.ts';
import { MUSIC_LAYERS, type MusicLayer } from '../src/content/music.ts';
import type { ThemeKind } from '../src/content/themes.ts';

/** One bake per rate and place, for the life of the process. A worker per suite, so it never spans files. */
const cache = new Map<string, Record<MusicLayer, Float32Array>>();

const keyOf = (rate: number, theme?: ThemeKind): string => `${rate}/${theme ?? ''}`;

/**
 * How long a caller may block on the pool before it is called hung. A bake is arithmetic that cannot
 * wait on anything, so this bounds a thread that died, not a slow machine: the whole game's music is
 * under a minute of CPU on the development box and this is ten.
 */
const POOL_DEADLINE_MS = 600_000;

/**
 * Every layer of every place in `themes` not already baked, baked on every core at once and cached.
 *
 * ── A PLACE IS BAKED ON EVERY CORE — `docs/decisions/0422-a-place-is-baked-on-every-core.md` ────
 *
 * ⚠️ **THE CLIP GUARD WAS 55 OF ITS 61 SECONDS BAKING, SEVEN PLACES ONE LAYER AT A TIME.** The Black
 * Heart alone was 29 s, and 13.5 of that its `groove`. Every layer has its own stream (0021) and
 * shares no state with any other, so the 161 layers of the seven places are 161 independent jobs, and
 * the floor is the slowest single layer rather than the sum.
 *
 * ⚠️ **SYNCHRONOUS, ON PURPOSE.** Every caller reads a bake in the line after asking for it, and
 * making them await would change forty call sites to save none. The threads write into shared memory
 * and this thread blocks in `Atomics.wait` until each job says it is done — node allows that on any
 * thread, and a bake has nothing to wait for but arithmetic.
 *
 * ⚠️ **A FAILED JOB IS BAKED AGAIN HERE**, so the exception a test reports is the synth's own, with
 * our stack, rather than *a worker failed*.
 */
export function primeLoops(rate: number, themes: readonly (ThemeKind | undefined)[]): void {
  const wanted = [...new Set(themes)].filter((theme) => !cache.has(keyOf(rate, theme)));
  if (wanted.length === 0) return;
  const asked = wanted.flatMap((theme) => MUSIC_LAYERS.map((layer) => ({ layer, theme })));
  const baked = bakeInPool(rate, asked);
  for (const theme of wanted) {
    const loops = {} as Record<MusicLayer, Float32Array>;
    asked.forEach((job, j) => {
      if (job.theme === theme) loops[job.layer] = baked[j]!;
    });
    cache.set(keyOf(rate, theme), loops);
  }
}

/**
 * Each asked layer, in the order asked, exactly as `bakeLayer(layer, rate, theme)` returns it — baked
 * on every core at once. `primeLoops` is this over whole places; `tests/clean.ts` asks it for the
 * layers its own cache is missing.
 */
export function bakeInPool(rate: number, asked: readonly { layer: MusicLayer; theme?: ThemeKind | undefined }[]): Float32Array[] {
  if (asked.length === 0) return [];
  // @setup: each layer's slot, sized by the same `layerNotes` the thread will run — setup only, no notes.
  const jobs = asked.map(({ layer, theme }, at) => {
    const { buffer, notes } = layerNotes(layer, rate, theme);
    return { at, layer, theme: theme ?? null, shared: new SharedArrayBuffer(buffer.byteLength), weight: buffer.length * notes.length };
  });
  // Heaviest first, so the long layers start at once rather than last. The order changes no sample.
  jobs.sort((a, b) => b.weight - a.weight);
  const next = new SharedArrayBuffer(4);
  const status = new SharedArrayBuffer(4 * jobs.length);
  const done = new Int32Array(status);
  /*
    ⚠️ **HALF THE CORES, BECAUSE THE SUITE IS RUNNING BESIDE IT.** Every core made each bake a burst that
    took the whole machine while four suites baked at once — and the browser suites' page boots are
    wall-clock waits that a starved machine misses (0044's class). The floor is one layer, 13.5 s, and
    half the cores already reach within a few seconds of it.
  */
  const threads = Math.max(1, Math.min(Math.floor(availableParallelism() / 2), jobs.length));
  const pool = Array.from(
    { length: threads },
    () =>
      new Worker(new URL('./bake-worker.mjs', import.meta.url), {
        workerData: { rate, jobs: jobs.map(({ layer, theme, shared }) => ({ layer, theme, shared })), next, status },
      }),
  );
  const deadline = Date.now() + POOL_DEADLINE_MS;
  try {
    for (let j = 0; j < jobs.length; j++) {
      while (Atomics.load(done, j) === 0) {
        if (Date.now() > deadline) throw new Error(`the bake pool did not finish ${jobs[j]!.theme ?? 'base'}/${jobs[j]!.layer} in ${POOL_DEADLINE_MS / 1000} s`);
        Atomics.wait(done, j, 0, 1000);
      }
    }
  } finally {
    for (const thread of pool) void thread.terminate();
  }
  const out: Float32Array[] = new Array(asked.length);
  jobs.forEach((job, j) => {
    out[job.at] = Atomics.load(done, j) === 1 ? new Float32Array(job.shared) : bakeLayer(job.layer, rate, job.theme ?? undefined);
  });
  return out;
}

/**
 * Every loop at `rate`, exactly as `bakeLoops` returns them — fresh arrays on every call.
 *
 * A drop-in for `bakeLoops(rate)` in a test. Anything whose subject is the bake itself should call
 * `bakeLoops` directly instead, and the header says which one that is.
 *
 * ── AND IT TAKES A PLACE NOW, BECAUSE A GUARD WAS MEASURING THE WRONG AUDIO ─────────────────────
 *
 * ⚠️ **`docs/decisions/0134-the-place-keeps-the-games-pace.md`.** *No theme at any rung drives the
 * bus past full scale* baked this with no argument and then applied **every theme's multipliers to
 * level one's samples** — so the one thing it exists to catch, a place whose own material clips, was
 * the one thing it could not see. It went green over Ember Nebula's whole composition
 * ([0132](../docs/decisions/0132-a-place-may-be-another-piece-entirely.md)) without ever baking a
 * note of it.
 *
 * ⚠️ **THIS IS THE THIRD GUARD IN TWO DECISIONS TO HAVE THAT SHAPE** — the band rule and the
 * longest-note rule were the other two — and the class is one sentence: *a guard written before a
 * place could re-voice anything bakes `MUSIC` and means it.* Anything that measures AUDIO and loops
 * over `THEME_KINDS` is suspect until it passes a theme in here.
 *
 * ⚠️ **A place that states nothing costs nothing**, because `bakeLoops` hands back byte-identical
 * audio for it and the cache is keyed on the name — six of the seven places still share one bake.
 */
export function loopsAt(rate: number, theme?: ThemeKind): Record<MusicLayer, Float32Array> {
  primeLoops(rate, [theme]);
  const baked = cache.get(keyOf(rate, theme))!;
  const out = {} as Record<MusicLayer, Float32Array>;
  for (const layer of MUSIC_LAYERS) out[layer] = Float32Array.from(baked[layer]);
  return out;
}
