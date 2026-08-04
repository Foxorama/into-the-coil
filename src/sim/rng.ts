/**
 * Seeded, deterministic PRNG — the ONLY source of randomness in the game.
 *
 * Ported from the predecessor (`C:\Golf-Stars/src/sim/rng.ts`) under decision 0020: it is 90 lines of
 * mulberry32 with no domain in it at all, which makes it the one module that crosses as code rather
 * than as a pattern.
 *
 * `Math.random` is banned below the shell and `tests/layering.test.ts` enforces it — see
 * `docs/decisions/0015-the-layer-ladder.md`. Randomness is an ARGUMENT: thread an `Rng` instead.
 *
 * Algorithm: mulberry32 — tiny, fast, statistically fine for a game, and fully specified, so the
 * exact byte sequence reproduces across machines and across browsers.
 *
 * ⚠️ **Draw order is a contract.** See `docs/decisions/0021-one-stream-per-concern.md`: a single
 * shared generator makes every draw depend on every draw before it, so adding one cosmetic roll
 * silently rebuilds every level. Take a named `stream()` per concern instead.
 */

/** Raw mulberry32 step: state in, [0,1) float out, next state captured by closure. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hash an arbitrary string into a 32-bit seed, so a generator can be seeded from a name — which is
 * what makes `stream()` possible. xfnv1a.
 */
export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class Rng {
  private next01: () => number;
  /** The seed this generator was constructed with — persist it to reproduce a run. */
  readonly seed: number;

  constructor(seed: number | string) {
    this.seed = typeof seed === 'string' ? hashSeed(seed) : seed >>> 0;
    this.next01 = mulberry32(this.seed);
  }

  /**
   * A named, independent generator derived from this one — the unit of isolation decision 0021 is
   * about. `run.stream('level:3')` and `run.stream('drops:3')` share a seed and share no sequence,
   * so a draw added to either can never move the other.
   *
   * ⚠️ **It consumes nothing.** The predecessor's `fork()` derived a child from the parent's NEXT
   * value, which means taking a fork is itself a draw — so adding a fork shifts everything after it,
   * the exact failure this method exists to prevent. It was deliberately not ported: the affordance
   * is removed rather than documented, per the instruction ladder in decision 0021.
   */
  stream(name: string): Rng {
    return new Rng(hashSeed(`${this.seed}:${name}`));
  }

  /** Float in [0, 1). */
  float(): number {
    return this.next01();
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next01() * (max - min);
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** True with probability p (default 0.5). */
  bool(p = 0.5): boolean {
    return this.next01() < p;
  }

  /** Uniformly pick one element. Throws on empty array (a bug, not a runtime case). */
  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error('Rng.pick: empty array');
    return arr[this.int(0, arr.length - 1)]!;
  }

  /**
   * Approx. standard-normal sample (Box–Muller, single value) scaled by `sd`, centred on `mean`.
   * Two draws, not one — which matters when counting draws.
   */
  gaussian(mean = 0, sd = 1): number {
    // Guard against log(0).
    const u1 = Math.max(this.next01(), 1e-12);
    const u2 = this.next01();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * sd;
  }
}

/** Convenience constructor. */
export function makeRng(seed: number | string): Rng {
  return new Rng(seed);
}
