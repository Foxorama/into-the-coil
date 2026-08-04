/**
 * The seeded generator, and the stream isolation decision 0021 rests on.
 *
 * ── WHY THIS FILE ASSERTS EXACT BYTES, WHEN 0021 SAYS NOT TO ────────────────────────────────────
 *
 * 0021 tells content fixtures to assert PROPERTIES rather than byte sequences, because a new enemy
 * row legitimately changes what a seed produces. That rule is about consumers of the generator.
 * Here the exact sequence IS the contract: mulberry32 exists to give the same bytes on every machine
 * and every browser, so a fixture that only checked "returns a number in [0,1)" would pass against a
 * completely different algorithm and the cross-machine promise would be worth nothing.
 *
 * The reference values below were generated from the algorithm as specified, not copied from this
 * implementation's output — a fixture taken from the code it tests proves only that the code equals
 * itself, which is `state-shape.test.ts`'s "fixture that proved a copy" all over again.
 */

import { describe, expect, it } from 'vitest';
import { hashSeed, makeRng, Rng } from '../src/sim/rng.ts';

/** mulberry32(12345), first five draws. The cross-machine contract, to 12 decimal places. */
const SEED_12345 = [0.979728267761, 0.3067522645, 0.484205421526, 0.817934412509, 0.509428369347];

const draws = (rng: Rng, n: number): number[] => Array.from({ length: n }, () => rng.float());

describe('the sequence is stable, and stable across machines', () => {
  it('reproduces the specified mulberry32 stream for a known seed', () => {
    const actual = draws(new Rng(12345), SEED_12345.length);
    for (const [i, expected] of SEED_12345.entries()) {
      expect(actual[i]).toBeCloseTo(expected, 12);
    }
  });

  it('gives two generators on the same seed the same sequence', () => {
    expect(draws(new Rng(999), 20)).toEqual(draws(new Rng(999), 20));
  });

  it('gives different seeds different sequences', () => {
    expect(draws(new Rng(999), 20)).not.toEqual(draws(new Rng(1000), 20));
  });

  it('hashes a string seed to a stable 32-bit value', () => {
    expect(hashSeed('into-the-coil')).toBe(4213926099);
    expect(hashSeed('into-the-coil')).toBeLessThanOrEqual(0xffffffff);
  });

  it('seeds identically from a string and from that string hashed', () => {
    expect(draws(new Rng('into-the-coil'), 10)).toEqual(draws(new Rng(hashSeed('into-the-coil')), 10));
  });
});

describe('streams are independent — the whole of 0021', () => {
  it('derives a stream from its NAME, not from a draw', () => {
    // The parent must be untouched by taking a stream. This is the assertion that fails if anyone
    // reintroduces the predecessor's `fork()`, which derived a child from the parent's next value.
    const withStream = new Rng(42);
    withStream.stream('anything');
    withStream.stream('and-another');

    expect(draws(withStream, 10)).toEqual(draws(new Rng(42), 10));
  });

  it('gives distinct names distinct sequences', () => {
    const run = new Rng(42);
    expect(draws(run.stream('level:3'), 10)).not.toEqual(draws(run.stream('drops:3'), 10));
  });

  it('gives the same name the same sequence, however many times it is asked', () => {
    const run = new Rng(42);
    expect(draws(run.stream('level:3'), 10)).toEqual(draws(run.stream('level:3'), 10));
  });

  it('leaves one stream unmoved when another is drawn from — the sparkle case', () => {
    // v1.0: nobody draws a cosmetic. v1.1: the engine sparkle draws twenty times. The level must be
    // byte-identical across the two, which is the entire point of the decision.
    const before = draws(new Rng('run-seed').stream('level:3'), 10);

    const v11 = new Rng('run-seed');
    draws(v11.stream('cosmetic'), 20);
    const after = draws(v11.stream('level:3'), 10);

    expect(after).toEqual(before);
  });

  it('separates streams of the same run from the same stream of another run', () => {
    expect(draws(new Rng('run-a').stream('level:3'), 10)).not.toEqual(
      draws(new Rng('run-b').stream('level:3'), 10),
    );
  });

  it('has no fork affordance at all', () => {
    // Tier 1 of the ladder: the method is GONE, not deprecated. A `fork` that still exists is a
    // `fork` somebody calls.
    expect('fork' in new Rng(1)).toBe(false);
    expect(Object.getOwnPropertyNames(Rng.prototype)).not.toContain('fork');
  });
});

describe('the helpers draw what they claim to', () => {
  it('makes int() inclusive at BOTH ends', () => {
    // The off-by-one that silently makes the last row of every table unreachable.
    const rng = new Rng('coverage');
    const seen = new Set(Array.from({ length: 4000 }, () => rng.int(0, 3)));
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });

  it('keeps range() inside its bounds', () => {
    const rng = new Rng('bounds');
    for (let i = 0; i < 1000; i++) {
      const v = rng.range(-5, 5);
      expect(v).toBeGreaterThanOrEqual(-5);
      expect(v).toBeLessThan(5);
    }
  });

  it('can reach every element of an array with pick()', () => {
    const rng = new Rng('pick');
    const arr = ['a', 'b', 'c', 'd', 'e'] as const;
    const seen = new Set(Array.from({ length: 4000 }, () => rng.pick(arr)));
    expect(seen.size).toBe(arr.length);
  });

  it('throws rather than returning undefined on an empty pick()', () => {
    expect(() => new Rng(1).pick([])).toThrow(/empty array/);
  });

  it('respects the probability given to bool()', () => {
    const rng = new Rng('bool');
    const n = 10_000;
    const hits = Array.from({ length: n }, () => rng.bool(0.25)).filter(Boolean).length;
    expect(hits / n).toBeGreaterThan(0.22);
    expect(hits / n).toBeLessThan(0.28);
  });

  it('always draws twice for a gaussian, whatever the arguments', () => {
    // Draw COUNT is the contract 0021 is about, and gaussian is the one helper that consumes more
    // than one. A future single-draw approximation would shift every sequence downstream of it.
    const control = new Rng(7);
    draws(control, 2);
    const after = control.float();

    const measured = new Rng(7);
    measured.gaussian(10, 3);
    expect(measured.float()).toBe(after);
  });

  it('centres gaussian() on its mean', () => {
    const rng = new Rng('gauss');
    const n = 20_000;
    const mean = Array.from({ length: n }, () => rng.gaussian(100, 15)).reduce((a, b) => a + b, 0) / n;
    expect(mean).toBeGreaterThan(99);
    expect(mean).toBeLessThan(101);
  });

  it('exposes the seed it was built with, so a run can persist it', () => {
    expect(new Rng(12345).seed).toBe(12345);
    expect(new Rng('into-the-coil').seed).toBe(hashSeed('into-the-coil'));
    expect(makeRng(7).seed).toBe(7);
  });
});
