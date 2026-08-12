/**
 * How fast and how deep a place is at a rung — the two quantities a listener's words map onto.
 *
 * ── ONE DESCRIPTION, BECAUSE A SCRIPT AND A GUARD BOTH ASK ──────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0134-the-place-keeps-the-games-pace.md`.** `scripts/weigh-rung.mjs` prints
 * these for a hand and `tests/themes.test.ts` holds a floor under them; two copies of *what is pace*
 * is how the printed number and the asserted one drift apart, which is
 * `docs/decisions/0029-the-tracked-record-is-the-record.md` in arithmetic.
 *
 * ⚠️ **NEITHER IS A SUBSTITUTE FOR LISTENING**, on `tests/spectrum.ts`'s own terms. What they are for
 * is turning *"it doesn't fit the high paced gameplay"* and *"very high on the treble with no deep
 * bassy times"* into something that can be compared between two places and refused.
 */

import {
  AURA_LEVEL_CEILING,
  LAYER_BARS,
  MUSIC_LADDER,
  MUSIC_LAYERS,
  type MusicLayer,
  type MusicLevel,
} from '../src/content/music.ts';
import { mixOf, revoicedBy, voicesOf, type ThemeKind } from '../src/content/themes.ts';
import { BANDS, bandEnergy } from './spectrum.ts';

/** Which bands are the bottom and the top, resolved once from the one table that names them. */
const LOW = BANDS.map((band) => band[1] <= 300);
const HIGH = BANDS.map((band) => band[0] >= 2000);

/** The two aura layers, which are the only gains that are a distance rather than a rung. */
const FOLLOWS_THE_BOSS: readonly MusicLayer[] = ['auraSlow', 'auraFast'];

/**
 * How many notes one bar of `layer` sounds in `theme`.
 *
 * ⚠️ **Notes and not loudness.** `docs/decisions/0102-the-music-goes-somewhere.md` settled that the
 * tempo cannot change (0093) and that what rises when a listener says *faster* is the RATE OF EVENTS.
 * This counts them.
 */
export function notesPerBar(theme: ThemeKind | undefined, layer: MusicLayer): number {
  let notes = 0;
  for (const voice of voicesOf(theme, layer)) {
    for (const step of voice.steps) if (step !== null && step !== undefined) notes++;
  }
  return notes / LAYER_BARS[layer];
}

/**
 * What a rung is: how fast, and how the energy splits.
 *
 * ⚠️ **THE AURA IS AT WHAT THE LEVEL ALONE CAN RAISE, EXCEPT IN THE FIGHT** — 0107. Measuring every
 * rung at a boss at arm's length is a state that cannot exist before the boss is on the field, and
 * the first version of this did exactly that: it reported the aura as a fifth of the `surge` mix and
 * sent a tuning pass after a layer nobody can hear there.
 *
 * ⚠️ **The bake is the caller's problem to cache.** `bakeLayer` is real DSP; a guard that walks seven
 * themes and seven rungs must not bake the same layer forty-nine times, and `bakes` is the map that
 * stops it.
 */
export function rungShape(
  theme: ThemeKind | undefined,
  rung: MusicLevel,
  loops: Record<MusicLayer, Float32Array>,
  bakes: Map<string, number[]>,
): { notes: number; low: number; high: number } {
  const nearness = rung === 'boss' || rung === 'bossPeak' ? 1 : AURA_LEVEL_CEILING;
  let notes = 0;
  let low = 0;
  let high = 0;
  let total = 0;
  for (const layer of MUSIC_LAYERS) {
    const ceiling = FOLLOWS_THE_BOSS.includes(layer) ? nearness : 1;
    const gain = MUSIC_LADDER[rung][layer] * mixOf(theme ?? 'approach', layer) * ceiling;
    if (gain <= 0) continue;
    notes += notesPerBar(theme, layer);
    /*
      ⚠️ **THE AUDIO COMES FROM THE CALLER AND THE SPECTRUM IS CACHED UNDER WHOEVER OWNS IT** — this
      function synthesised its own at first, and every probe over `tests/themes.test.ts` paid for it:
      six places that state no material re-baked all twenty-three layers each, 161 bakes to look at
      44 distinct pieces of audio, and the suite went from 22 seconds to 118.
      `docs/decisions/0115-a-probe-runs-its-own-guard.md` is about precisely that cost.

      ⚠️ **A shared layer is keyed as the BASE's**, so the six sharing places answer from one entry —
      and the loops handed in are `loopsAt`'s, which the clipping guard next door has already paid
      for.
    */
    const own = theme !== undefined && revoicedBy(theme).includes(layer);
    const key = own ? `${theme}/${layer}` : `/${layer}`;
    let bands = bakes.get(key);
    if (bands === undefined) {
      bands = bandEnergy(loops[layer], 44100);
      bakes.set(key, bands);
    }
    bands.forEach((energy, i) => {
      const at = energy * gain;
      total += at;
      if (LOW[i]) low += at;
      if (HIGH[i]) high += at;
    });
  }
  return { notes, low: total > 0 ? low / total : 0, high: total > 0 ? high / total : 0 };
}
