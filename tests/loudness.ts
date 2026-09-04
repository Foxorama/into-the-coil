/**
 * Loudness in the listener's unit — ITU-R BS.1770 K-weighting, at any sample rate.
 *
 * `docs/decisions/0226-the-level-holds-one-loudness.md`.
 *
 * ── EVERY LOUDNESS NUMBER THIS PROJECT HAD PRINTED WAS UNWEIGHTED RMS ───────────────────────────
 *
 * ⚠️ **AND THE REPORT WAS ABOUT THE PARTS RMS BARELY SEES.** `run → push` opens `arp`, `ride`, `hook`
 * and `lead` — the bright, dense, mid-band material — over a bed whose RMS is dominated by `sub`. An
 * unweighted sum weighs a 40 Hz sine the same as a 3 kHz arpeggio; an ear does not, and neither does
 * the standard every broadcaster and streaming service measures programme loudness with. The
 * K-weighting is a +4 dB high shelf above ~1.5 kHz followed by a high-pass at ~38 Hz, and after it a
 * mean square in dB is LUFS.
 *
 * ⚠️ **DESIGNED FOR THE RATE RATHER THAN TABULATED**, because the standard tabulates its coefficients
 * at 48 kHz only and this project's model runs at 22.05 and 44.1. The two filters are the standard's
 * — a high shelf and a high-pass with the parameters below, which are the ones the reference
 * implementations (`libebur128`, `pyloudnorm`) derive the table from — and `tests/themes.test.ts`
 * checks that at 48 kHz the design reproduces the table to six places, so the derivation is a fact
 * rather than a citation.
 *
 * ⚠️ **NO GATING.** BS.1770's integrated loudness gates out silence and quiet passages; what is
 * measured here is a phrase of continuous music at one rung, and a gate would only ever remove the
 * bars a listener also hears. Short-term loudness over a window is the quantity, and it is called
 * `loud` throughout rather than LUFS-I to keep that honest.
 */

interface Biquad {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

/** Stage one: the high shelf. The standard's parameters, as the reference implementations state them. */
const SHELF = { hz: 1681.974450955533, db: 3.999843853973347, q: 0.7071752369554196 } as const;
/** Stage two: the high-pass. */
const HIGH_PASS = { hz: 38.13547087602444, q: 0.5003270373238773 } as const;

/**
 * ⚠️ **`libebur128`'s FORM AND NOT THE COOKBOOK'S, WHICH IS WHAT THE PARAMETERS ABOVE GO WITH.** The
 * textbook high-shelf biquad fed the same three numbers lands 0.44 dB low at 1.5 kHz — measured
 * against the table before this was written — because the standard's shelf is a bilinear design
 * with its own gain split (`Vb` below, the exponent included). Reproducing the table is the check
 * that this is the right one; a shelf with the right shape and the wrong gain would pass an ear and
 * fail the standard.
 */
function highShelf(rate: number): Biquad {
  const K = Math.tan((Math.PI * SHELF.hz) / rate);
  const Vh = Math.pow(10, SHELF.db / 20);
  const Vb = Math.pow(Vh, 0.4996667741545416);
  const norm = 1 + K / SHELF.q + K * K;
  return {
    b0: (Vh + (Vb * K) / SHELF.q + K * K) / norm,
    b1: (2 * (K * K - Vh)) / norm,
    b2: (Vh - (Vb * K) / SHELF.q + K * K) / norm,
    a1: (2 * (K * K - 1)) / norm,
    a2: (1 - K / SHELF.q + K * K) / norm,
  };
}

function highPass(rate: number): Biquad {
  const K = Math.tan((Math.PI * HIGH_PASS.hz) / rate);
  const norm = 1 + K / HIGH_PASS.q + K * K;
  /*
    ⚠️ **THE NUMERATOR IS LEFT AT 1, −2, 1**, unnormalised, which is how the standard's table states
    it — its stage-two row is exactly that — and what makes the design reproduce the table rather
    than a filter with the same shape and a different gain.
  */
  return { b0: 1, b1: -2, b2: 1, a1: (2 * (K * K - 1)) / norm, a2: (1 - K / HIGH_PASS.q + K * K) / norm };
}

/** The two stages for a rate — exported so the 48 kHz design can be checked against the table. */
export function kWeighting(rate: number): [Biquad, Biquad] {
  return [highShelf(rate), highPass(rate)];
}

/** Run a buffer through the K-weighting, returning a new buffer. Direct form I; state starts at rest. */
export function kWeighted(input: Float32Array, rate: number): Float32Array {
  let x = input;
  for (const { b0, b1, b2, a1, a2 } of kWeighting(rate)) {
    const y = new Float32Array(x.length);
    let x1 = 0;
    let x2 = 0;
    let y1 = 0;
    let y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const x0 = x[i]!;
      const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      y[i] = y0;
      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }
    x = y;
  }
  return x;
}

/**
 * The loudness of a buffer, in LUFS — K-weighted mean square in dB, with the standard's −0.691 offset
 * that puts a full-scale 1 kHz sine at −3.01.
 */
export function loudnessOf(buffer: Float32Array, rate: number): number {
  const z = kWeighted(buffer, rate);
  let sum = 0;
  for (let i = 0; i < z.length; i++) sum += z[i]! * z[i]!;
  return z.length === 0 || sum <= 0 ? -Infinity : -0.691 + 10 * Math.log10(sum / z.length);
}
