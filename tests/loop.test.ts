/**
 * The fixed-timestep clock.
 *
 * See `docs/decisions/0022-frame-rate-is-a-feature.md`. The claim is that the simulation rate and
 * the display rate are independent numbers, and it is checkable: feed the same second of wall clock
 * in 30Hz, 60Hz and 144Hz frames and the same number of steps must come out.
 *
 * `runLoop` itself is not tested here — it is the rAF wiring, and everything that could be wrong
 * about it lives in `advance`, which takes elapsed time as an argument and therefore needs no
 * browser, no fake timers, and no patience.
 */

import { describe, expect, it } from 'vitest';
import { advance, type Clock, makeClock, MAX_STEPS, STEP_MS } from '../src/app/loop.ts';

/** Run `frames` frames of `elapsed` ms each; report the totals. */
function play(elapsed: number, frames: number): { steps: number; dropped: number; clock: Clock } {
  const clock = makeClock();
  let steps = 0;
  let dropped = 0;
  for (let i = 0; i < frames; i++) {
    advance(clock, elapsed);
    steps += clock.steps;
    dropped += clock.dropped;
  }
  return { steps, dropped, clock };
}

describe('the sim rate and the display rate are independent numbers', () => {
  it('runs 60 steps a second whatever the display is doing', () => {
    // THE assertion 0022 rests on. One second of wall clock, five refresh rates, one answer.
    //
    // ⚠️ Asserted against the time actually fed in, not against a flat 60, and the difference is
    // real: `(1000 / 90) * 90` is 999.9999999999999, so a 90Hz second is a hair short of a second
    // and honestly produces 59 steps with the remainder held in `carry`. Demanding 60 would be
    // demanding that the clock invent the missing microsecond.
    const counts: number[] = [];
    for (const [name, hz] of [
      ['30Hz', 30],
      ['60Hz', 60],
      ['90Hz', 90],
      ['120Hz', 120],
      ['144Hz', 144],
    ] as const) {
      const frame = 1000 / hz;
      const { steps } = play(frame, hz);
      expect(steps, `${name} simulated a different amount of time than it was given`).toBe(
        Math.floor((frame * hz) / STEP_MS),
      );
      counts.push(steps);
    }
    // And the same claim in human terms: a second of play is a second of play on every display.
    for (const steps of counts) {
      expect(steps).toBeGreaterThanOrEqual(59);
      expect(steps).toBeLessThanOrEqual(60);
    }
  });

  it('runs the same number of steps for a second delivered unevenly', () => {
    // A real frame budget is not uniform. Jitter must not change how much game happened.
    const clock = makeClock();
    const uneven = [8, 25, 12, 30, 9, 16, 40, 11, 17, 14];
    let steps = 0;
    let elapsed = 0;
    while (elapsed < 1000) {
      const dt = uneven[Math.floor(elapsed / 100) % uneven.length]!;
      advance(clock, dt);
      steps += clock.steps;
      elapsed += dt;
    }
    // Within one step of the elapsed time — the remainder is sitting in `carry`, not lost.
    expect(Math.abs(steps - Math.floor(elapsed / STEP_MS))).toBeLessThanOrEqual(1);
  });

  it('loses no time — carry plus steps always accounts for every millisecond', () => {
    const clock = makeClock();
    let fed = 0;
    for (let i = 0; i < 500; i++) {
      const dt = 1 + (i % 23);
      advance(clock, dt);
      fed += dt;
    }
    // Every ms is either simulated or waiting in carry. Nothing was dropped at these frame times.
    expect(clock.carry).toBeGreaterThanOrEqual(0);
    expect(clock.carry).toBeLessThan(STEP_MS);
    expect(fed / STEP_MS - clock.carry / STEP_MS).toBeCloseTo(Math.round((fed - clock.carry) / STEP_MS), 6);
  });
});

describe('interpolation', () => {
  it('always reports an alpha inside the step it is interpolating', () => {
    const clock = makeClock();
    for (const dt of [0, 0.5, 1, 8, 16.7, 33, 100, 1000, 60000]) {
      advance(clock, dt);
      expect(clock.alpha, `alpha out of range after a ${dt}ms frame`).toBeGreaterThanOrEqual(0);
      expect(clock.alpha).toBeLessThan(1);
    }
  });

  it('is the carry expressed as a fraction of a step', () => {
    const clock = makeClock();
    advance(clock, STEP_MS * 1.5);
    expect(clock.steps).toBe(1);
    expect(clock.alpha).toBeCloseTo(0.5, 9);
    expect(clock.carry).toBeCloseTo(STEP_MS * 0.5, 9);
  });

  it('reports no step and a growing alpha on a display faster than the sim', () => {
    // At 144Hz most frames run no step at all and draw an interpolated position instead. A clock
    // that forced a step per frame would run the game at 144Hz, which is the bug this prevents.
    const clock = makeClock();
    advance(clock, 1000 / 144);
    expect(clock.steps).toBe(0);
    expect(clock.alpha).toBeGreaterThan(0);
  });
});

describe('the spiral of death is capped, and the loss is reported', () => {
  it('never runs more than MAX_STEPS however long the frame took', () => {
    const clock = makeClock();
    for (const stall of [200, 1000, 30_000, 600_000]) {
      advance(clock, stall);
      expect(clock.steps, `a ${stall}ms stall asked for more than the cap`).toBe(MAX_STEPS);
      expect(clock.dropped, 'time was discarded without being reported').toBeGreaterThan(0);
    }
  });

  it('discards the debt rather than carrying it, so the next frame starts clean', () => {
    // Carrying it forward is what makes the spiral: the catch-up frame is slower, which owes more.
    const clock = makeClock();
    advance(clock, 5000);
    expect(clock.carry).toBeLessThan(STEP_MS);
    advance(clock, 16.7);
    expect(clock.steps, 'the frame after a stall was still paying off the stall').toBeLessThanOrEqual(2);
    expect(clock.dropped).toBe(0);
  });

  it('drops nothing at any frame rate a real display produces', () => {
    for (const hz of [24, 30, 50, 60, 90, 120, 144, 240]) {
      expect(play(1000 / hz, hz).dropped, `${hz}Hz is being treated as a stall`).toBe(0);
    }
  });
});

describe('a clock survives the frames that are not frames', () => {
  it('treats a non-finite or negative elapsed as no time at all', () => {
    // The first frame after a tab is restored, and the first frame full stop.
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -1, -10_000]) {
      const clock = makeClock();
      advance(clock, bad);
      expect(clock.steps, `${bad} produced steps`).toBe(0);
      expect(clock.carry).toBe(0);
      expect(Number.isFinite(clock.alpha)).toBe(true);
    }
  });

  it('starts at rest', () => {
    expect(makeClock()).toEqual({ carry: 0, steps: 0, alpha: 0, dropped: 0 });
  });

  it('is deterministic — the same frames give the same steps every time', () => {
    // Everything downstream of this rests on it: the seeded run, the resume, the replays.
    expect(play(16.7, 300).steps).toBe(play(16.7, 300).steps);
    expect(play(7.3, 500).steps).toBe(play(7.3, 500).steps);
  });
});
