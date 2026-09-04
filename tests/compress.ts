/**
 * The music bus's compressor, as a curve — the half of it that decides the range.
 *
 * `docs/decisions/0219-range-and-clean-stop-being-one-knob.md`.
 *
 * ── 0104 REFUSED A COMPRESSOR AND ITS REASON WAS RIGHT ─────────────────────────────────────────
 *
 * ⚠️ *"A compressor has an attack and a release, so it is a function of the signal's history;
 * `tests/music.test.ts` sums the layers sample by sample and could not model one, which would have
 * meant weakening the assertion that holds the mix in order to admit the thing that fixes it."*
 *
 * **That objection is not answered by disagreeing with it.** It is answered by noticing that a
 * compressor is two things bolted together, and only one of them is stateful:
 *
 * | | what it decides | modellable |
 * |---|---|---|
 * | threshold, knee, ratio | **how far apart two levels end up** | yes — a pure function of level |
 * | attack, release | how quickly it gets there | no — depends on history |
 *
 * ⚠️ **THE RANGE CLAIM DEPENDS ONLY ON THE FIRST ROW**, so that is what is modelled here and what
 * `tests/themes.test.ts` asserts on. **Nothing asserts on the envelope**, and that is stated rather
 * than hidden: a guard that pretended to hold the attack would be the weakened assertion 0104 refused.
 *
 * ⚠️ **AND THE CURVE IS THE SPEC'S, NOT AN APPROXIMATION OF IT.** The Web Audio specification defines
 * `DynamicsCompressorNode`'s static characteristic exactly — a quadratic soft knee of width `knee`
 * centred on `threshold`, linear at `ratio` above it, unity below — so this is the same arithmetic
 * the browser runs rather than a model fitted to it. **What is not modelled is the level DETECTOR**
 * that feeds it, which is where the envelope lives.
 */

import { MUSIC_COMPRESSOR } from '../src/content/music.ts';

/**
 * What the compressor makes of a level, in dB — its static input/output characteristic.
 *
 * ⚠️ **IN dB IN AND dB OUT**, because that is how the curve is defined and how a ratio means anything.
 * Callers holding a linear amplitude convert on the way in and back on the way out.
 *
 * ⚠️ **UNITY BELOW THE KNEE AND A STRAIGHT LINE ABOVE IT**, with the knee itself quadratic so the two
 * meet without a corner. A corner is audible as the compressor engaging, which on a bus whose level
 * steps at every rung change would be the artefact replacing the defect.
 */
export function compressedDb(db: number, comp = MUSIC_COMPRESSOR): number {
  const { threshold, knee, ratio } = comp;
  if (db <= threshold - knee / 2) return db;
  if (db >= threshold + knee / 2) return threshold + (db - threshold) / ratio;
  /*
    The knee: a quadratic joining the two, matching value and slope at both ends. `over` is how far
    into the knee the input is, from its bottom edge.
  */
  const over = db - (threshold - knee / 2);
  return db + ((1 / ratio - 1) * over * over) / (2 * knee);
}

/**
 * Run a whole buffer through the compressor, envelope and all, in place.
 *
 * ── ⚠️ THE CURVE ALONE IS A WAVESHAPER, AND THE FIRST DRAFT OF THIS FILE WAS ONE ────────────────
 *
 * ⚠️ **APPLYING `compressedDb` PER SAMPLE CHANGED THE RANGE BY NOTHING, AND THAT IS 0104 BEING
 * RIGHT.** With a threshold at −6 dBFS and a mix whose RMS is −13, almost every individual sample is
 * already below the threshold — so a per-sample curve leaves the level alone and merely bends the
 * peaks, which is distortion rather than compression. **The range reduction lives entirely in the
 * DETECTOR**, and a compressor without one is a shaper with extra parameters.
 *
 * ⚠️ **SO THE ENVELOPE IS MODELLED, WHICH 0104 SAID COULD NOT BE DONE.** Its words were *"a function
 * of the signal's history"* — true, and a one-pole follower is exactly that and nothing more: one
 * variable carried down a sample walk. What made it look impossible was that the guard of the day
 * summed layers with no state at all. **The objection was about the shape of the test, not about the
 * compressor**, and the answer is a walk that carries a number.
 *
 * ⚠️ **FEED-FORWARD, PEAK-DETECTING, GAIN IN dB** — the arrangement `DynamicsCompressorNode`
 * describes. It is a faithful model rather than the browser's exact implementation, and that
 * difference is real: what is claimed on it is the BAND a level occupies, which is set by the
 * threshold, knee and ratio, and only reached at the rate the envelope allows.
 */
export function compressBuffer(buffer: Float32Array, rate: number, comp = MUSIC_COMPRESSOR): void {
  /*
    ⚠️ **ONE-POLE COEFFICIENTS FROM THE TIME CONSTANTS**, so `attack` and `release` mean seconds here
    exactly as they do on the node. `exp(-1/(t·rate))` is the standard conversion and it is written
    once rather than inlined at both uses.
  */
  const rise = Math.exp(-1 / (comp.attack * rate));
  const fall = Math.exp(-1 / (comp.release * rate));
  // The detector's state, in dB. Starts at silence so the first bar is not compressed by history.
  let envelope = -120;
  for (let i = 0; i < buffer.length; i++) {
    const size = Math.abs(buffer[i]!);
    const level = size > 1e-9 ? 20 * Math.log10(size) : -120;
    /*
      ⚠️ **ATTACK WHEN THE SIGNAL IS LOUDER THAN THE ENVELOPE, RELEASE WHEN IT IS QUIETER.** Getting
      this the wrong way round produces a compressor that ignores transients and rides the noise
      floor, which sounds like the mix breathing and measures like nothing at all.
    */
    const coefficient = level > envelope ? rise : fall;
    envelope = level + (envelope - level) * coefficient;
    // The reduction the curve asks for at the level the DETECTOR sees, applied to the sample.
    buffer[i] = buffer[i]! * Math.pow(10, (compressedDb(envelope, comp) - envelope) / 20);
  }
}

/*
  ── `LEVEL_BAND_DB` STOOD HERE AND 0226 RETIRED IT ──────────────────────────────────────────────

  ⚠️ **2.5 dB was how wide a level's loudness was allowed to run, and the answer became zero.**
  `docs/decisions/0226-the-level-holds-one-loudness.md`: every rung of a place is held to its `run`
  loudness in the listener's unit, and `tests/themes.test.ts` asserts that directly, so a ceiling on
  the band has nothing left to hold. The compressor above stays — it is what keeps the hold's cost in
  gain smaller than its effect on the ear, which `scripts/solve-hold.mjs`'s bisection is for.
*/
