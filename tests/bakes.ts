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

import { bakeLoops } from '../src/app/music.ts';
import { MUSIC_LAYERS, type MusicLayer } from '../src/content/music.ts';
import type { ThemeKind } from '../src/content/themes.ts';

/** One bake per rate and place, for the life of the process. A worker per suite, so it never spans files. */
const cache = new Map<string, Record<MusicLayer, Float32Array>>();

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
  const key = `${rate}/${theme ?? ''}`;
  let baked = cache.get(key);
  if (baked === undefined) {
    baked = bakeLoops(rate, theme);
    cache.set(key, baked);
  }
  const out = {} as Record<MusicLayer, Float32Array>;
  for (const layer of MUSIC_LAYERS) out[layer] = Float32Array.from(baked[layer]);
  return out;
}
