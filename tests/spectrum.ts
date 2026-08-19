/**
 * A-weighted band loudness — the one thing a test can say about a sound it cannot hear.
 *
 * ── IT LIVED IN `tests/sound.test.ts` AND 0095 IS WHY IT MOVED ──────────────────────────────────
 *
 * ⚠️ **Written for `docs/decisions/0089-a-cue-has-a-body.md`**, whose report was *"a tin shed heard
 * from outside"* — not a metaphor but a spectrum with a hump in the middle and nothing at either end,
 * which is a shape a number can see even though a test cannot hear.
 *
 * ⚠️ **`docs/decisions/0095-the-level-has-its-own-music.md` added a whole piece of music nobody has
 * heard**, and it is the same question about a different subject: a synthesised track with no sub and
 * no air is exactly the tin shed one octave wider. Copying thirty lines into a second suite would have
 * been the second description this project keeps finding in its documents; here it is one.
 *
 * ⚠️ **A-WEIGHTED, AND THE UNWEIGHTED VERSION WAS A REAL DEFECT.** The ear is thirty decibels less
 * sensitive at 50 Hz than at 2 kHz. Unweighted, this reported that every cue was nothing but sub —
 * true of the energy and false of the experience — and it would have passed a sound whose entire boom
 * sat at 30 Hz, where a laptop speaker reproduces nothing. That was the actual defect in the first
 * attempt at 0089's cues.
 *
 * ⚠️ **It is still not a substitute for listening.** `node scripts/hear.mjs` writes the files and a
 * hand gives the verdict — `docs/decisions/0027-measure-the-picture-not-the-model.md` for the channel
 * with nothing to look at.
 */

/** The bands, low to high. Named, because a failure message that says `4` helps nobody. */
export const BANDS: readonly [number, number, string][] = [
  [25, 60, 'sub'],
  [60, 130, 'low'],
  [130, 300, 'lowmid'],
  [300, 800, 'mid'],
  [800, 2000, 'himid'],
  [2000, 5000, 'hi'],
  [5000, 12000, 'air'],
];

/** IEC 61672 A-weighting, as a linear gain. */
export function aWeight(f: number): number {
  const f2 = f * f;
  return (
    ((12194 ** 2 * f2 * f2) /
      ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2))) *
    10 ** (2.0 / 20)
  );
}

/**
 * A-weighted loudness per band, in the samples' own units. Goertzel, six log-spaced probes each.
 *
 * ⚠️ **THE UNNORMALISED ONE, AND THE DIFFERENCE MATTERS MORE THAN IT LOOKS.** `spectrum` below
 * divides by its own loudest band, which makes it a measure of SHAPE — the right question for *is
 * this a hump in the middle*, and the wrong one for *is this mix bassier than that one*. Two
 * normalised profiles cannot be compared to each other at all: a mix with an enormous low-mid reports
 * a small sub because of the low-mid, not because of the sub.
 *
 * ⚠️ **0095 wrote a guard that did exactly that** and it compared the level's balance against the
 * title's as though they were energies. This is the function that assertion needed.
 */
export function bandEnergy(samples: Float32Array, rate: number): number[] {
  const out: number[] = [];
  for (const [lo, hi] of BANDS) {
    let total = 0;
    for (let k = 0; k < 6; k++) {
      const f = lo * Math.pow(hi / lo, (k + 0.5) / 6);
      const c = 2 * Math.cos((2 * Math.PI * f) / rate);
      let s1 = 0;
      let s2 = 0;
      for (let i = 0; i < samples.length; i++) {
        const s0 = samples[i]! + c * s1 - s2;
        s2 = s1;
        s1 = s0;
      }
      total += ((s1 * s1 + s2 * s2 - c * s1 * s2) / (samples.length * samples.length)) * aWeight(f) ** 2;
    }
    out.push(Math.sqrt((total / 6) * (hi - lo)));
  }
  return out;
}

/** The same, as a SHAPE: every band divided by the loudest, so only the balance is left. */
export function spectrum(samples: Float32Array, rate: number): number[] {
  const bands = bandEnergy(samples, rate);
  const peak = Math.max(...bands, 1e-12);
  return bands.map((v) => v / peak);
}

// ── AND THE SAME QUESTION ASKED OF TWO DIFFERENT SIGNALS, WHICH `bandEnergy` CANNOT ANSWER ──────

/**
 * A-weighted RMS per band, measured with filters rather than with probes.
 *
 * ── WHY THIS IS NOT `bandEnergy`, AND THE MISTAKE THAT MADE IT NECESSARY ────────────────────────
 *
 * ⚠️ **`bandEnergy` SAMPLES SIX FREQUENCIES AND MULTIPLIES BY THE BANDWIDTH**, which is a density
 * estimate — correct for a signal spread across the band, and badly wrong for one that is not. A
 * tone lands between two probes and is counted at a fraction of its power; noise is seen by all six
 * and is counted in full. **The wider the band, the bigger the error**, and `air` is 7,000 Hz wide
 * against `sub`'s 35.
 *
 * ⚠️ **THAT IS HARMLESS EVERYWHERE IT IS ALREADY USED AND FATAL FOR THE NEW QUESTION.** Every
 * existing caller asks for a RATIO WITHIN ONE SIGNAL — `spectrum` normalises by the signal's own
 * loudest band, `rungShape` takes `low / total` and `high / total`. The bias is in the numerator and
 * the denominator alike and it cancels. **Comparing two different layers to each other does not
 * cancel it**, and the first attempt at `heardAt` put Ember Nebula's `ride` — a noise burst in the
 * widest band there is — at the TOP of a ranking a listener had just put at the bottom.
 *
 * ⚠️ **A REAL BANDPASS HAS NO SUCH PREFERENCE.** Two cascaded biquads per band, RMS of what comes
 * out, A-weighted at the band's own centre: a tone and a hiss of equal power in the band both measure
 * their power, because the filter passes the whole band rather than seven points of it.
 *
 * ⚠️ **THE SKIRTS ARE 12 dB AN OCTAVE AND THAT IS LEFT DELIBERATELY SOFT.** A brick wall would be
 * further from the ear, not closer — auditory filters leak, which is most of why masking exists at
 * all. What this must not do is prefer one KIND of sound to another, and it does not.
 *
 * ⚠️ **`bandEnergy` IS NOT CHANGED**, because six guards are written over its numbers and every one
 * of them is a ratio it answers correctly. Two functions is the honest outcome here: they measure
 * different things and the comment above says which is for which.
 */
export function bandLevels(samples: Float32Array, rate: number): number[] {
  const out: number[] = [];
  for (const [lo, hi] of BANDS) {
    // The geometric centre, because a band spanning an octave and a half is not centred on its mean.
    const f0 = Math.sqrt(lo * hi);
    const w0 = (2 * Math.PI * f0) / rate;
    const alpha = Math.sin(w0) / (2 * (f0 / (hi - lo)));
    // RBJ's constant-peak-gain bandpass, normalised by a0 so the difference equation is direct.
    const a0 = 1 + alpha;
    const b0 = alpha / a0;
    const b2 = -alpha / a0;
    const a1 = (-2 * Math.cos(w0)) / a0;
    const a2 = (1 - alpha) / a0;

    // Two passes of the same section — 12 dB an octave, and the state is per pass.
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    let u1 = 0, u2 = 0, v1 = 0, v2 = 0;
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      const x0 = samples[i]!;
      const y0 = b0 * x0 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x0; y2 = y1; y1 = y0;
      const v0 = b0 * y0 + b2 * u2 - a1 * v1 - a2 * v2;
      u2 = u1; u1 = y0; v2 = v1; v1 = v0;
      sum += v0 * v0;
    }
    out.push(Math.sqrt(sum / samples.length) * aWeight(f0));
  }
  return out;
}

/**
 * The centre of gravity of a window's spectrum, in Hz.
 *
 * ⚠️ **UNWEIGHTED, AND IT IS THE ONE MEASURE HERE THAT IS.** A-weighting models what a human hears as
 * LOUD, which is the right question for *is this layer audible* and the wrong one for *where has the
 * energy gone*: it discounts the bottom by about thirty decibels, so an explosion whose whole point is
 * that it ends low would measure as barely moving. `bandEnergy` above answers the first question.
 *
 * ⚠️ **A Goertzel sweep rather than a transform** — 48 log-spaced probes from 30 Hz to 12 kHz is
 * enough to place a centre of gravity, and it keeps this file free of an FFT nothing else here needs.
 *
 * `docs/decisions/0179-an-explosion-ends-low.md` is what it was written for.
 */
export function centroid(samples: Float32Array, from: number, to: number, rate: number): number {
  const lo = Math.max(0, Math.floor(from * rate));
  const hi = Math.min(samples.length, Math.ceil(to * rate));
  if (hi - lo < 64) return 0;
  let num = 0;
  let den = 0;
  for (let k = 0; k < 48; k++) {
    const f = 30 * Math.pow(12000 / 30, k / 47);
    const c = 2 * Math.cos((2 * Math.PI * f) / rate);
    let s1 = 0;
    let s2 = 0;
    for (let i = lo; i < hi; i++) {
      const s = samples[i]! + c * s1 - s2;
      s2 = s1;
      s1 = s;
    }
    num += f * Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - c * s1 * s2));
    den += Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - c * s1 * s2));
  }
  return den > 0 ? num / den : 0;
}
