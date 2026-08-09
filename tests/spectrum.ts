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
