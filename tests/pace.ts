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
  MUSIC_ROOT,
  type MusicLevel,
} from '../src/content/music.ts';
import { mixOf, revoicedBy, voicesOf, type ThemeKind } from '../src/content/themes.ts';
import { BANDS, bandEnergy } from './spectrum.ts';

/** Which bands are the bottom and the top, resolved once from the one table that names them. */
/** The middle of each band, for the centre-of-mass. */
const MIDDLE = BANDS.map((band) => (band[0] + band[1]) / 2);
const LOW = BANDS.map((band) => band[1] <= 300);
const HIGH = BANDS.map((band) => band[0] >= 2000);

/** The two aura layers, which are the only gains that are a distance rather than a rung. */
const FOLLOWS_THE_BOSS: readonly MusicLayer[] = ['auraSlow', 'auraFast'];

/**
 * Where the NOTES are, in Hz — the mean pitch a rung is written at, weighted by nothing but count.
 *
 * ── AND IT IS NOT THE SPECTRAL CENTROID, WHICH IS THE MISTAKE THIS REPLACES ─────────────────────
 *
 * ⚠️ **`docs/decisions/0136-the-place-has-a-room-and-an-arc.md`.** Asked for: *"Up, Up, Up, drop,
 * sharp Down for the boss"*, and, of the fight, *"drop from the high octaves down into the lower tones
 * of hellfire and menace."* The obvious measure is the centre of mass of the SPECTRUM, and it was
 * tried first — it moved five hertz while an octave of material moved, because it is dominated by
 * whichever layers are loudest and continuous.
 *
 * ⚠️ **WORSE, IT ARGUES AGAINST THE OTHER HALF OF THE SAME REPORT.** The same brief asks the
 * percussion to get sharper and faster into the fight, and sharp percussion is broadband noise — so a
 * boss that correctly drops an octave in its TONES measures *higher* on a spectral centroid than the
 * section before it. Tuning against that number would have meant taking the fast metal back out.
 *
 * ⚠️ **A pitched step is a semitone over `MUSIC_ROOT` and an octave is a field on the voice**, so
 * where the notes sit is knowable exactly, from the content, with no audio at all. Unpitched voices
 * are skipped — a drum has no octave to drop.
 */
export function pitchOf(theme: ThemeKind | undefined, layer: MusicLayer): number | null {
  let sum = 0;
  let notes = 0;
  for (const voice of voicesOf(theme, layer)) {
    if (!voice.pitched) continue;
    for (const step of voice.steps) {
      if (step === null || step === undefined) continue;
      sum += MUSIC_ROOT * Math.pow(2, voice.octave + step / 12);
      notes++;
    }
  }
  return notes === 0 ? null : sum / notes;
}

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
): { notes: number; low: number; high: number; centre: number; pitch: number } {
  const nearness = rung === 'boss' || rung === 'bossPeak' ? 1 : AURA_LEVEL_CEILING;
  let notes = 0;
  let low = 0;
  let high = 0;
  let centre = 0;
  let pitch = 0;
  let pitched = 0;
  let total = 0;
  for (const layer of MUSIC_LAYERS) {
    const ceiling = FOLLOWS_THE_BOSS.includes(layer) ? nearness : 1;
    const gain = MUSIC_LADDER[rung][layer] * mixOf(theme ?? 'approach', layer) * ceiling;
    if (gain <= 0) continue;
    notes += notesPerBar(theme, layer);
    const where = pitchOf(theme, layer);
    if (where !== null) { pitch += where * gain; pitched += gain; }
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
      centre += at * MIDDLE[i]!;
    });
  }
  return {
    notes,
    low: total > 0 ? low / total : 0,
    high: total > 0 ? high / total : 0,
    /*
      ⚠️ **THE CENTRE OF MASS OF THE PITCH, WHICH IS THE ARC A LISTENER DESCRIBES** — 0136: *"Up, Up,
      Up, drop, sharp Down for the boss."* That is a claim about where the music SITS, and neither of
      the two numbers above can see it: a rung can hold its bottom share exactly and still climb, and
      the whole shape of this place is that it does.

      ⚠️ **Energy-weighted over the band centres**, in Hz, so it is a frequency a hand can reason
      about rather than an index. Logarithmic would be closer to how pitch is heard; linear is what
      makes a DROP show up as a drop rather than as a shrug, and the arc is what is being held.
    */
    centre: total > 0 ? centre / total : 0,
    /** Where the NOTES sit, gain-weighted — the arc 0136 is about, and the centroid cannot see it. */
    pitch: pitched > 0 ? pitch / pitched : 0,
  };
}

// ── HOW LOUD A LAYER ACTUALLY IS, AGAINST THE REST OF ITS OWN MIX ───────────────────────────────

/**
 * What one layer puts out at the loudest its place ever takes it.
 *
 * ── THE QUANTITY NOTHING HERE HAS EVER PRINTED, AND THE REPORT THAT ASKED FOR IT ────────────────
 *
 * ⚠️ **`docs/decisions/0140-no-layer-is-inaudible.md`.** Reported, of the dashboard's audition
 * buttons, 2026-08-13: *"is it on purpose that we've got such varied volume levels on the effects?
 * Hook and Drive for example, hook I can barely hear and drive is quite loud and clear by
 * comparison."*
 *
 * ⚠️ **A GAIN IS NOT A LOUDNESS, WHICH IS THE WHOLE FINDING.** `MUSIC_LADDER` × `mixOf` is what a
 * hand sets and what [0130](../docs/decisions/0130-a-layer-can-be-heard-on-its-own.md) puts in the
 * fader — and the faders across a place span about **7 dB** while what comes out of them spans
 * **38 dB and more**. Nothing multiplied the gain by the material until this, so every mix number in
 * this project has been set against a quantity nobody could see.
 *
 * ⚠️ **BOTH RMS AND PEAK, BECAUSE ONE OF THEM LIES ABOUT SPARSE LAYERS.** RMS counts the silence
 * between notes, so a cymbal struck once a bar scores near zero while being perfectly audible when it
 * lands; peak counts only the loudest sample, so a continuous pad scores the same as a click. A
 * layer is only called inaudible when **both** say so.
 */
export interface LayerLevel {
  layer: MusicLayer;
  /** The loudest gain this place ever takes it to — the value 0130's audition button writes. */
  gain: number;
  /** Root-mean-square of the whole loop, times that gain. */
  rms: number;
  /** The loudest single sample of the loop, times that gain. */
  peak: number;
}

/** The loudest gain a place ever takes a layer to, over every rung. Mirrors `rig/transport.ts`. */
function loudestOf(theme: ThemeKind | undefined, layer: MusicLayer): number {
  let most = 0;
  for (const rung of Object.keys(MUSIC_LADDER) as MusicLevel[]) {
    const ceiling = FOLLOWS_THE_BOSS.includes(layer) ? AURA_LEVEL_CEILING : 1;
    // `undefined` is *the base composition* and level one is the place that plays it unmixed —
    // the same reading `rungShape` above takes, rather than a second opinion about what no theme means.
    const at = MUSIC_LADDER[rung][layer] * mixOf(theme ?? 'approach', layer) * ceiling;
    if (at > most) most = at;
  }
  return most;
}

/**
 * Every layer of a place, by what it actually puts out, loudest first.
 *
 * @param loops the baked composition for this place — passed in rather than baked here, because a
 *        bake is about four seconds and both callers already have one.
 */
export function layerLevels(theme: ThemeKind | undefined, loops: Record<MusicLayer, Float32Array>): LayerLevel[] {
  const out: LayerLevel[] = [];
  for (const layer of MUSIC_LAYERS) {
    const buffer = loops[layer];
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < buffer.length; i++) {
      const v = buffer[i]!;
      sum += v * v;
      const size = v < 0 ? -v : v;
      if (size > peak) peak = size;
    }
    const gain = loudestOf(theme, layer);
    out.push({ layer, gain, rms: Math.sqrt(sum / buffer.length) * gain, peak: peak * gain });
  }
  return out.sort((a, b) => b.rms - a.rms);
}

/**
 * How far under the loudest layer of its own place a layer sits, in decibels — a negative number.
 *
 * ⚠️ **RELATIVE TO THE PLACE AND NOT TO FULL SCALE**, so it survives a change to `MUSIC_GAIN`, to the
 * bus shaper, or to any master a later decision puts in front of it. What is being asked is *can this
 * be heard against the rest of what is playing*, and that is a ratio.
 */
export function underTheLoudest(levels: readonly LayerLevel[], layer: MusicLayer): { rms: number; peak: number } {
  const top = levels[0]!;
  const it = levels.find((l) => l.layer === layer)!;
  const db = (a: number, b: number): number => (a <= 0 || b <= 0 ? -Infinity : 20 * Math.log10(a / b));
  return { rms: db(it.rms, top.rms), peak: db(it.peak, top.peak) };
}

/**
 * How far under the loudest layer of its own place a layer may sit before it is called inaudible.
 *
 * ── A HAND'S GUESS, FROM THE MEASURED SPREAD, AND THE SPREAD HAD A GAP IN IT ────────────────────
 *
 * ⚠️ **`docs/decisions/0140-no-layer-is-inaudible.md`.** Chosen the way
 * [0102](../docs/decisions/0102-the-music-goes-somewhere.md) chose its distances — by hand, marked as
 * a hand's guess, and against a measurement rather than a taste. Asked for in those terms: *"I'm not
 * entirely [sure] how to specify the floor by ear at the moment, so let's go from the measured spread
 * and then see how it plays out as the min floor."*
 *
 * ⚠️ **THE DATA HAD A TEN-DECIBEL HOLE IN IT, WHICH IS WHY THIS IS NOT A THRESHOLD FITTED TO ONE
 * CASE.** Every layer of every place, ranked by the better of its two measures: Ember Nebula's `ride`
 * at **−38.1 dB**, then a **10.0 dB gap**, then `arp` at −28.1 and a tight cluster of `ride`, `crash`
 * and `arp` from −25.0 to −23.6. One layer is on the far side of a chasm and the rest are a
 * population. **−33 dB sits in the hole**, five decibels clear of the healthy cluster.
 *
 * ⚠️ **THAT IS WHAT CLAUDE.md's *no counting guard* DEMANDS OF A NUMBER LIKE THIS** — line ceilings
 * and slice ceilings were each refused because every candidate flagged a healthy file as loudly as a
 * sick one. This one flags exactly one layer out of 161, and that layer is ten decibels clear of the
 * next. If a later mix pass closes the gap, this number stops being defensible and should go rather
 * than be widened.
 */
export const AUDIBLE_FLOOR_DB = -33;
