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
import { LAYER_PAN } from '../src/content/music.ts';
import { panGains } from '../src/app/music.ts';
import { BANDS, bandEnergy, bandLevels } from './spectrum.ts';

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
 * A place's BALANCE: how far under its own loudest layer each layer sits, in dB, on the better of the
 * two measures.
 *
 * ── THE QUANTITY *IT ALL SOUNDS THE SAME* IS ABOUT, AND NOTHING MEASURED IT ─────────────────────
 *
 * ⚠️ **`docs/decisions/0147-a-place-is-a-balance.md`.** Reported, having heard five new places:
 * *"level 4, 5, 6 were pretty bland and very similar to the other levels, it didn't feel like I'd
 * travelled somewhere else in the galaxy."* Every measurement this project had was **one place
 * against the base** — is it fast enough, is it deep enough, can its layers be heard. All three are
 * green on seven places that are one arrangement with different notes in it.
 *
 * ⚠️ **THE BETTER OF RMS AND PEAK, on `underTheLoudest`'s own terms**: RMS alone calls every sparse
 * layer a whisper, and a balance is about what a listener notices rather than about mean power.
 *
 * ⚠️ **A layer no rung ever opens is `-Infinity` and is skipped by every caller**, which is why this
 * returns the raw record rather than a tidy array — the callers disagree about what to do with a
 * silent layer and both answers are right for their question.
 */
export function profileOf(
  theme: ThemeKind | undefined,
  loops: Record<MusicLayer, Float32Array>,
): Record<MusicLayer, number> {
  const levels = layerLevels(theme, loops);
  const out = {} as Record<MusicLayer, number>;
  for (const layer of MUSIC_LAYERS) {
    const under = underTheLoudest(levels, layer);
    out[layer] = Math.max(under.rms, under.peak);
  }
  return out;
}

/**
 * How far apart two places' balances are, in dB RMS over the layers both of them sound.
 *
 * ⚠️ **Zero is *the same mix, whatever the notes are*.** Measured across the seven places on the day
 * 0147 was written: **1.9 dB** between The Labyrinth and The Toxic Mire, which the report calls
 * interchangeable, and **6.0 dB** between Saurian Belt and The Black Heart, which it does not.
 */
export function apartBy(a: Record<MusicLayer, number>, b: Record<MusicLayer, number>): number {
  let sum = 0;
  let counted = 0;
  for (const layer of MUSIC_LAYERS) {
    if (!Number.isFinite(a[layer]) || !Number.isFinite(b[layer])) continue;
    const d = a[layer] - b[layer];
    sum += d * d;
    counted++;
  }
  return counted === 0 ? 0 : Math.sqrt(sum / counted);
}

/**
 * How far down a place keeps its quietest third, in dB — a negative number.
 *
 * ⚠️ **THIS IS WHERE EVERY PLACE KEEPS ITS CHARACTER, WHICH IS THE DEFECT 0147 IS NAMED FOR.** On the
 * day it was written the bottom third of all seven places was the same seven layers — `call`,
 * `frenzy`, `wraith`, `arp`, `crash`, `hook`, `ride` — averaging −17 to −22 dB down. Those are the
 * tune, the lasers, the roar, the twin lead and the hydra. **The loud part of every place was a sub,
 * a kick, a bass and a pad, and those are the same four sounds in all seven.**
 */
export function quietestThird(profile: Record<MusicLayer, number>): number {
  const ranked = MUSIC_LAYERS.filter((l) => Number.isFinite(profile[l])).sort((a, b) => profile[b] - profile[a]);
  const third = ranked.slice(Math.ceil((ranked.length * 2) / 3));
  return third.reduce((sum, l) => sum + profile[l], 0) / third.length;
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

// ── AND WHETHER A LAYER SURVIVES THE SUM, WHICH IS A DIFFERENT QUESTION ─────────────────────────

/**
 * What one layer has left after everything playing beside it, in the band it lives in and the ear it
 * favours.
 *
 * ── EVERY MEASUREMENT ABOVE THIS LINE IS OF A SOLOED LAYER ──────────────────────────────────────
 *
 * ⚠️ **Reported 2026-08-16, of Ember Nebula at `push`:** *"I'm not hearing ride, hook or lead at all
 * here when playing the entire sequence."* `layerLevels` puts `hook` at −11.0 dB and `lead` at −9.4 —
 * mid-cluster, nowhere near `AUDIBLE_FLOOR_DB` — so the model has no complaint about two layers a
 * listener says are not there.
 *
 * ⚠️ **AND IT CANNOT HAVE ONE, BECAUSE IT NEVER RENDERS THE MIX.** `loudestOf` takes each layer to the
 * loudest gain ANY rung gives it and compares it to another layer at ITS loudest — an arrangement no
 * rung plays. The comparison is broadband, so a layer buried in the one band it occupies scores on
 * the energy it has everywhere else. And it is **mono**, so `LAYER_PAN` — the whole of
 * `docs/decisions/0118-the-mix-has-a-width.md`, added expressly to stop layers masking each other —
 * has never appeared in a number this repository prints.
 *
 * ⚠️ **MASKING IS WHAT *I CANNOT HEAR IT* MEANS ONCE A GAIN IS RULED OUT**, and 0118 said so: *"two
 * sounds in the same frequency band had nothing to separate them but level — which is why the answer
 * has been a gain six times running."* This is the quantity those six passes were tuning blind.
 *
 * ⚠️ **THE BEST WINDOW AND NOT THE AVERAGE ONE.** A listener picks a part out where it is clearest,
 * not where it is typical — so a layer is credited with the single band-and-ear that flatters it
 * most, and a layer that scores badly HERE has nowhere at all to be heard. The counterpart rule is
 * that only bands the layer actually lives in count: within 12 dB of its own loudest band. Without
 * that, a hiss with a millionth of its energy at 40 Hz would score `+∞` in a band nothing else uses.
 *
 * ⚠️ **POWER-SUMMED, because the layers are uncorrelated.** Adding amplitudes would say twelve layers
 * at −20 dB bury one at 0, which is arithmetic about a single phase-locked tone rather than about a
 * band of music.
 *
 * ⚠️ **`bandLevels` AND NOT `bandEnergy`, AND THE FIRST VERSION OF THIS USED THE WRONG ONE.** It put
 * Ember Nebula's `ride` at the TOP of the ranking — a layer the report that produced this function
 * names as inaudible — because `bandEnergy` estimates a density and a noise burst in the 7,000 Hz
 * `air` band is the shape that flatters most. `tests/spectrum.ts` has the whole argument. **The
 * measurement disagreeing with the ear was the measurement being wrong, and it was caught only
 * because the ear had already spoken.**
 *
 * ⚠️ **`panGains` IS THE GAME'S, imported rather than restated** — `src/app/music.ts` keeps it for
 * `scripts/hear.mjs` for exactly this reason, and a pan law is the fifth place
 * `docs/decisions/0116-the-rig-plays-the-level.md`'s drift could happen.
 *
 * ⚠️ **IT IS STILL NOT A SUBSTITUTE FOR LISTENING**, on `tests/spectrum.ts`'s terms. Masking in an ear
 * spreads upward across bands and this does not model that, so it is a floor under *nothing else is
 * on top of it here*, not a claim that the layer is audible.
 */
export interface Heard {
  layer: MusicLayer;
  /** What this place takes it to AT THIS RUNG — not the loudest any rung ever does. */
  gain: number;
  /** dB under the loudest layer sounding at this rung, A-weighted over every band. */
  down: number;
  /** dB over everything else, in the best band it lives in, on the ear that favours it. */
  margin: number;
  /** Which band that was. */
  band: string;
  /** Which ear that was. */
  ear: 'L' | 'R';
  /**
   * The single loudest layer sitting in that window, and how far over this one it is.
   *
   * ⚠️ **THE SUM IS WHAT MASKS AND ONE LAYER IS WHAT A HAND CAN MOVE**, which is why both are here.
   * `margin` is against everything, because that is what masking is; this names the one to argue
   * with. Where a window has a single dominant occupant the two nearly agree, and where they diverge
   * the layer is being buried by a crowd and no single edit will free it.
   */
  by: MusicLayer;
  /** How far `by` is over this layer in that window, in dB. Negative means nothing there is louder. */
  byDb: number;
}

/**
 * Every layer sounding at `rung`, by how much of it survives the rest of the mix — worst first.
 *
 * @param loops the baked composition for this place, on `layerLevels`' terms.
 * @param bakes the band-energy cache `rungShape` uses, keyed identically so the two share it.
 */
export function heardAt(
  theme: ThemeKind | undefined,
  rung: MusicLevel,
  loops: Record<MusicLayer, Float32Array>,
  bakes: Map<string, number[]>,
): Heard[] {
  const nearness = rung === 'boss' || rung === 'bossPeak' ? 1 : AURA_LEVEL_CEILING;

  /** Every sounding layer's A-weighted band energies, already at this rung's gain. */
  const sounding: { layer: MusicLayer; gain: number; bands: number[] }[] = [];
  for (const layer of MUSIC_LAYERS) {
    const ceiling = FOLLOWS_THE_BOSS.includes(layer) ? nearness : 1;
    const gain = MUSIC_LADDER[rung][layer] * mixOf(theme ?? 'approach', layer) * ceiling;
    if (gain <= 0) continue;
    /*
      ⚠️ **A `heard/` PREFIX, BECAUSE THIS IS NOT THE MEASUREMENT `rungShape` CACHES.** Both walk the
      same layers and both want a per-band figure, so sharing the map is worth it — but one holds
      `bandEnergy` and the other `bandLevels`, and an unprefixed key would have each silently answer
      with the other's numbers. A shared cache of two different quantities is one description too few.
    */
    const own = theme !== undefined && revoicedBy(theme).includes(layer);
    const key = own ? `heard/${theme}/${layer}` : `heard//${layer}`;
    let bands = bakes.get(key);
    if (bands === undefined) {
      bands = bandLevels(loops[layer]!, 44100);
      bakes.set(key, bands);
    }
    sounding.push({ layer, gain, bands: bands.map((energy) => energy * gain) });
  }

  const power = (xs: number[]): number => Math.sqrt(xs.reduce((sum, x) => sum + x * x, 0));
  const db = (a: number, b: number): number => (a <= 0 || b <= 0 ? -Infinity : 20 * Math.log10(a / b));
  const loudest = Math.max(...sounding.map((s) => power(s.bands)), 1e-12);

  const out: Heard[] = [];
  for (const it of sounding) {
    const ears = panGains(LAYER_PAN[it.layer]);
    // Where this layer LIVES: within 12 dB of its own loudest band, and nowhere else counts.
    const home = Math.max(...it.bands, 1e-12) / 4;
    let margin = -Infinity;
    let band = BANDS[0]![2];
    let ear: 'L' | 'R' = 'L';
    let by = it.layer;
    let byDb = -Infinity;
    it.bands.forEach((mine, i) => {
      if (mine < home) return;
      for (const side of ['left', 'right'] as const) {
        const others = sounding.filter((other) => other.layer !== it.layer);
        const rest = power(others.map((other) => other.bands[i]! * panGains(LAYER_PAN[other.layer])[side]));
        const at = db(mine * ears[side], rest);
        if (at > margin) {
          margin = at;
          band = BANDS[i]![2];
          ear = side === 'left' ? 'L' : 'R';
          // The loudest single occupant of the window this layer settled on — recomputed here rather
          // than tracked per band, because only the winning window is ever reported.
          let most = 0;
          for (const other of others) {
            const at2 = other.bands[i]! * panGains(LAYER_PAN[other.layer])[side];
            if (at2 > most) { most = at2; by = other.layer; }
          }
          byDb = db(most, mine * ears[side]);
        }
      }
    });
    out.push({ layer: it.layer, gain: it.gain, down: db(power(it.bands), loudest), margin, band, ear, by, byDb });
  }
  return out.sort((a, b) => a.margin - b.margin);
}
