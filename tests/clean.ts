/**
 * How hard each place drives the music bus, and how much the bus distorts when it does.
 *
 * `docs/decisions/0217-the-bus-is-a-colour-and-it-was-too-thick.md`. Reported 2026-09-03: *"the
 * approach compared to ember nebula sounds distorted a bit and some of the boss music has similar
 * distortion, it just doesn't sound crystal clear and clean."*
 *
 * ── ⚠️ IT IS NOT CLIPPING, AND THE FIRST DRAFT OF THIS FILE SAID IT WAS ─────────────────────────
 *
 * ⚠️ **`tests/music.test.ts`'s *no rung clips* DOES bake with no theme and scale by `MUSIC_LADDER`
 * directly — but it is not the guard that covers this.** `tests/themes.test.ts` walks **every place
 * at every rung**, through `rungOf`, `mixOf` and the aura's own ceiling, and models the browser's
 * clamp correctly. It is thorough, it is green, and it is green for a good reason.
 *
 * ⚠️ **THE PEAKS THIS FILE REPORTS OVER FULL SCALE ARE SINGLE SAMPLES.** Ember Nebula's `boss` reaches
 * **1.33** for an instant — and that guard measures the quantity that actually matters, *what share
 * of the signal is flattened against the end of the curve*, which is **0.0089%** at worst. About one
 * sample in eleven thousand, each 0.054 dB out. **Nobody can hear that**, and 0176 already refused to
 * trim 1.85 dB off the music to make it go away.
 *
 * ⚠️ **SO THE THING A LISTENER IS HEARING IS THE SATURATION ITSELF**, working hardest where the mix
 * is loudest. That is why the loud rungs and the loud places are the ones named, and it is a
 * quantity no clipping guard would ever report — the bus is doing exactly what it was told to.
 *
 * ── WHAT DISTORTION IS, WHEN THE BUS IS A SATURATOR ON PURPOSE ──────────────────────────────────
 *
 * ⚠️ **`saturate` IS NOT A FAULT.** `docs/decisions/0104-the-gun-plays-a-figure.md` puts a `tanh`
 * shaper on the music bus deliberately — *"what meaty is made of"* — so *is there distortion* is the
 * wrong question and the answer is always yes. **How much, and whether it varies between places, is
 * the question a listener comparing two places is actually asking.**
 *
 * ⚠️ **SO IT IS MEASURED AS THE PART OF THE OUTPUT NO GAIN EXPLAINS.** Fit the best single multiplier
 * to the clean signal, and whatever is left over is what the shaper added. That is the standard
 * definition of non-linear distortion and it needs no reference tone.
 */

import { bakeLayer } from '../src/app/music.ts';
import { SAMPLE_RATE, saturate } from '../src/app/sound.ts';
import {
  MUSIC_COMPRESSOR,
  MUSIC_DRIVE,
  MUSIC_GAIN,
  MUSIC_LAYERS,
  PHRASE_SECONDS,
  type MusicLayer,
  type MusicLevel,
} from '../src/content/music.ts';
import { auraCeilingOf, mixOf, revoicedBy, rungOf, type ThemeKind } from '../src/content/themes.ts';
import { compressBuffer } from './compress.ts';

/** Which layers the aura scales, so a fight is measured at the loudness a fight reaches. */
const FOLLOWS_THE_BOSS: readonly MusicLayer[] = ['auraSlow', 'auraFast'];

const cache = new Map<string, Float32Array>();

/**
 * A place's material, per layer, baked once.
 *
 * ⚠️ **Keyed as the base's for a layer the place does not re-voice**, so the six places that share a
 * layer answer from one entry — the same accounting `tests/arc.ts` does, and worth about as little,
 * because a place re-voices nearly everything.
 */
function layerOf(theme: ThemeKind, layer: MusicLayer, rate: number): Float32Array {
  const own = revoicedBy(theme).includes(layer);
  const key = `${own ? theme : ''}/${layer}@${rate}`;
  let buffer = cache.get(key);
  if (buffer === undefined) {
    buffer = bakeLayer(layer, rate, own ? theme : undefined);
    cache.set(key, buffer);
  }
  return buffer;
}

export interface DriveAt {
  theme: ThemeKind;
  rung: MusicLevel;
  /** The loudest sample reaching the shaper, as a share of full scale. Over 1 is where tanh bites. */
  peak: number;
  /** The loudest sample LEAVING the shaper. With the clamp modelled it can never exceed `saturate(1)`. */
  out: number;
  /** How much of the output no single gain explains, in dB below the output. Less negative is dirtier. */
  distortion: number;
  /**
   * What the rung sums to THROUGH the shaper, in dB — the loudness a listener actually gets.
   *
   * ── THE ARC MEASURES THE BUS BEFORE THE SHAPER, AND THAT IS NOT WHAT ANYBODY HEARS ─────────────
   *
   * ⚠️ **`tests/arc.ts` says so out loud** — *"the bus's `saturate` curve is not applied, so a jump
   * measured here is an upper bound"* — which was the safe direction for a guard about something
   * being too loud and is the **wrong** direction for a guard about a contrast between two rungs. A
   * shaper compresses the loud rung more than the quiet one, so the gap a player hears is always
   * SMALLER than the gap the arc reports, and by an amount that changes with `MUSIC_DRIVE`.
   *
   * ⚠️ **WHICH MEANS 0217 MOVED EVERY CONTRAST IN THE GAME AND NOTHING MEASURED IT.** Halving the
   * drive was measured as *boss-over-run +1.7 → +2.1 dB* and recorded as a gain; the same arithmetic
   * applies to `run → push`, where it is the thing that was reported.
   */
  rms: number;
}

/**
 * What one place at one rung does to the bus.
 *
 * ⚠️ **THE WHOLE PHRASE, BECAUSE A PEAK IS A MOMENT.** Layers loop at different lengths and
 * `PHRASE_SECONDS` is where they all come round; a shorter window would miss the bar where the long
 * patterns line up, which is exactly the bar a listener notices.
 *
 * ⚠️ **THE AURA AT ITS CEILING FOR THE FIGHT RUNGS**, because that is the loudness a fight actually
 * reaches — 0091 makes the aura's row a ceiling rather than a gain, and measuring it at zero would
 * report a boss nobody meets.
 */
export function driveAt(
  theme: ThemeKind,
  rung: MusicLevel,
  rate = SAMPLE_RATE,
  /*
    ⚠️ **THE BUS'S TWO KNOBS, AS ARGUMENTS, SO A FIX CAN BE MEASURED BEFORE IT IS MADE.** Both default
    to what ships. `trim` is a per-place level and `drive` is how hard the shaper is worked, and the
    report *"doesn't sound crystal clear and clean"* has a different answer depending on which one is
    responsible — so the instrument has to be able to try each without the tree being edited under it.
  */
  trim = 1,
  drive = MUSIC_DRIVE,
  comp = MUSIC_COMPRESSOR,
): DriveAt {
  const length = Math.round(PHRASE_SECONDS * rate);
  const nearness = rung === 'boss' || rung === 'bossPeak' ? 1 : auraCeilingOf(theme);
  const gains = {} as Record<MusicLayer, number>;
  for (const layer of MUSIC_LAYERS) {
    const ceiling = FOLLOWS_THE_BOSS.includes(layer) ? nearness : 1;
    gains[layer] = rungOf(theme, rung, layer) * mixOf(theme, layer) * ceiling * trim;
  }

  /*
    ⚠️ **THE BUFFERS ARE HOISTED, AND THE FIRST DRAFT LOOKED THEM UP PER LAYER PER SAMPLE.** That is a
    `Map` hit twenty-three times a sample over a million samples over forty-nine combinations, and it
    took the script past ten minutes before it printed anything. The arithmetic is the same; what
    moved is where the lookup happens.
  */
  const buffers = MUSIC_LAYERS.map((layer) => layerOf(theme, layer, rate));
  const weights = MUSIC_LAYERS.map((layer) => gains[layer]!);

  let peak = 0;
  let out = 0;
  let dirtyDotClean = 0;
  let cleanDotClean = 0;
  let dirtyDotDirty = 0;
  /*
    ⚠️ **TWO PASSES WOULD BE TWO PHRASES OF ARITHMETIC**, so the fit's three sums are accumulated in
    the same walk as the peaks. The best multiplier is `<dirty,clean>/<clean,clean>` and the residual
    energy is `<dirty,dirty> - a<dirty,clean>`, which needs nothing the loop has not already added up.
  */
  /*
    ⚠️ **THE SUM IS BUILT BEFORE IT IS MEASURED, BECAUSE A COMPRESSOR HAS A MEMORY** — 0219. The bus
    is wired master → compressor → shaper, and the compressor's detector is a one-pole follower over
    the signal, so there is no way to evaluate it a sample at a time without the sample before it.
    That is the whole of what 0104 meant by *"a function of the signal's history"*, and it costs one
    buffer rather than a weakened assertion.
  */
  const mixed = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (let l = 0; l < buffers.length; l++) {
      const buffer = buffers[l]!;
      sum += buffer[i % buffer.length]! * weights[l]!;
    }
    mixed[i] = sum * MUSIC_GAIN;
  }
  compressBuffer(mixed, rate, comp);

  for (let i = 0; i < length; i++) {
    const clean = mixed[i]!;
    /*
      ⚠️ **CLAMPED FIRST, BECAUSE THAT IS WHAT A `WaveShaperNode` DOES** — 0176, and the first draft
      of this file got it wrong exactly as the guard 0176 fixed had. The curve is defined over [-1, 1]
      and the browser clamps anything outside it to the curve's ends, so `saturate` called unclamped
      models a shaper the game does not have — and the `out` column was reporting 1.03 for a bus that
      cannot exceed `saturate(1)`, which is 1.
    */
    const held = clean < -1 ? -1 : clean > 1 ? 1 : clean;
    const dirty = saturate(held, drive);
    const size = clean < 0 ? -clean : clean;
    if (size > peak) peak = size;
    const loud = dirty < 0 ? -dirty : dirty;
    if (loud > out) out = loud;
    dirtyDotClean += dirty * clean;
    cleanDotClean += clean * clean;
    dirtyDotDirty += dirty * dirty;
  }
  // The output's own RMS, which is `dirtyDotDirty` already accumulated — no second walk.
  const rms = 10 * Math.log10(dirtyDotDirty / length);

  const fit = cleanDotClean > 0 ? dirtyDotClean / cleanDotClean : 0;
  const residual = Math.max(0, dirtyDotDirty - fit * dirtyDotClean);
  const distortion =
    dirtyDotDirty <= 0 || residual <= 0 ? -Infinity : 10 * Math.log10(residual / dirtyDotDirty);
  return { theme, rung, peak, out, distortion, rms };
}

/**
 * How dirty the bus may get before a listener calls it distorted, in dB below the signal.
 *
 * ── SET FROM THE REPORT, WHICH NAMED A PLACE THAT IS FINE AND ONE THAT IS NOT ───────────────────
 *
 * ⚠️ **THE REPORT IS A COMPARISON AND THAT IS WHAT MAKES IT MEASURABLE**: *"the approach compared to
 * ember nebula sounds distorted a bit."* One place is the control and the other is the complaint, so
 * the threshold is not a taste — it is whatever separates them, checked against the five places
 * nobody mentioned.
 *
 * ⚠️ **AND `MUSIC_DRIVE` MEANS SOME OF THIS IS AUTHORED.** 0104 put the shaper there on purpose, so
 * a limit that demanded a linear bus would be deleting a feature. What is held is the SPREAD a
 * listener hears between places, not the presence of harmonics.
 */
export const DIRTY_CEILING_DB = -30;

/**
 * ⚠️ **WHY THERE IS NO CEILING CONSTANT HERE, AND THERE WAS ONE FOR AN HOUR.**
 *
 * With the browser's clamp modelled the bus **cannot** leave the shaper above `saturate(1)`, which is
 * 1 — so an output-level guard is a tautology, which is exactly what `tests/themes.test.ts` already
 * says about its own peak assertion: *"with the clamp modelled, the peak can no longer exceed 1 and
 * that assertion is a tautology kept for the shape of the thing."*
 *
 * **The trap this file exists to avoid is believing the level meter.** A bus driven to 1.33 comes out
 * at 1.00, so every peak reading says the mix is fine while the loudest third of the signal is being
 * squashed. Level cannot see saturation; only the residual can, which is what `DIRTY_CEILING_DB`
 * holds and what the report was about.
 */
