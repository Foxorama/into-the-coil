/**
 * THE INSTRUMENT'S OWN TESTS — 0276.
 *
 * ⚠️ **`tests/paths.ts` IS A GUARD THAT EVERY OTHER ART GUARD IS BUILT ON, AND IT HAD NONE.** Five
 * suites read it — `accents`, `foes`, `places`, `signature`, `guns-played` — and each asserts a
 * property of the picture *through* it. A defect in the pen is therefore not one red test: it is
 * every art guard in the repository quietly measuring the wrong thing, and
 * [0027](../docs/decisions/0027-measure-the-picture-not-the-model.md) is exactly about a guard that
 * fires on the wrong quantity.
 *
 * ⚠️ **`strokeOutside` IS WHY THIS FILE EXISTS NOW.** It is new arithmetic —
 * `reports/the-vocabulary-is-the-ceiling-2026-09-08.md` — and two of the cases below are bugs it
 * actually had while being written: it closed every polyline, so a stroked spine measured a return
 * leg back across the void that was never inked; and an earlier draft checked only the vertices, so a
 * long segment could cross a waist and out into space between two contained ends.
 *
 * These are INVARIANTS and not tastes — [0192](../docs/decisions/0192-a-guard-holds-an-invariant.md).
 * A change to the pen that makes any of them false is a change to what every art guard means.
 */

import { describe, expect, it } from 'vitest';
import { inside, strokeOutside, tracingPen, type Pass, type Point, type Stroke } from './paths.ts';

/** A 100×100 square hull with a corner at the origin. */
const SQUARE: Pass = {
  subpaths: [
    [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ],
  ],
  rule: 'evenodd',
  alpha: 1,
  colour: '#fff',
  composite: 'source-over',
};

/**
 * A horseshoe: the square above with a bite taken out of its right-hand side, `x > 30` between
 * `y = 30` and `y = 70`. Anything crossing the middle from the top arm to the bottom one is outside.
 */
const HORSESHOE: Pass = {
  subpaths: [
    [
      [0, 0],
      [100, 0],
      [100, 30],
      [30, 30],
      [30, 70],
      [100, 70],
      [100, 100],
      [0, 100],
    ],
  ],
  rule: 'evenodd',
  alpha: 1,
  colour: '#fff',
  composite: 'source-over',
};

const line = (points: readonly Point[], width: number, closed = false): Stroke => ({
  subpaths: [points],
  closed: [closed],
  width,
  alpha: 1,
  colour: '#fff',
});

describe('the pen records what was drawn', () => {
  it('flattens a Bézier INSIDE the curve, so containment stays conservative', () => {
    const { pen, trace } = tracingPen();
    pen.beginPath();
    pen.moveTo(0, 0);
    // A quarter-circle-ish bulge to the right. Every flattened point must sit on or inside it.
    pen.quadraticCurveTo(100, 0, 100, 100);
    pen.closePath();
    pen.fill();
    const [flat] = trace.passes;
    expect(flat!.subpaths[0]!.length).toBeGreaterThan(8);
    // The control polygon is the triangle (0,0) (100,0) (100,100); a quadratic lies inside its hull.
    const hull: Pass = {
      subpaths: [
        [
          [0, 0],
          [100, 0],
          [100, 100],
        ],
      ],
      rule: 'nonzero',
      alpha: 1,
      colour: '#fff',
      composite: 'source-over',
    };
    for (const p of flat!.subpaths[0]!.slice(1, -1)) expect(inside(hull, p)).toBe(true);
  });

  it('records a stroke with its width, and a fill still records none', () => {
    const { pen, trace } = tracingPen();
    pen.beginPath();
    pen.moveTo(10, 10);
    pen.lineTo(90, 10);
    pen.lineWidth = 6;
    pen.strokeStyle = '#abcdef';
    pen.stroke();
    expect(trace.strokes).toBe(1);
    expect(trace.inks).toHaveLength(1);
    expect(trace.inks[0]!.width).toBe(6);
    expect(trace.inks[0]!.colour).toBe('#abcdef');
    expect(trace.inks[0]!.closed[0]).toBe(false);
  });

  it('marks a sub-path closed only when closePath said so', () => {
    const { pen, trace } = tracingPen();
    pen.beginPath();
    pen.moveTo(10, 10);
    pen.lineTo(90, 10);
    pen.closePath();
    pen.moveTo(10, 90);
    pen.lineTo(90, 90);
    pen.stroke();
    expect(trace.inks[0]!.closed).toEqual([true, false]);
  });
});

describe('strokeOutside', () => {
  it('is zero for a centre line with room for its own width', () => {
    expect(strokeOutside(SQUARE, line([[50, 20], [50, 80]], 20))).toBe(0);
  });

  it('reports the overhang when the line is too near an edge for its width', () => {
    // Five in from the left edge, twenty wide: the ink reaches ten, so five of it is out.
    expect(strokeOutside(SQUARE, line([[5, 20], [5, 80]], 20))).toBeCloseTo(5, 6);
  });

  it('reports a centre line that has left the hull entirely', () => {
    // Twenty outside the left edge, twenty wide: twenty out, plus the ten the ink adds.
    expect(strokeOutside(SQUARE, line([[-20, 50], [-20, 60]], 20))).toBeCloseTo(30, 6);
  });

  it('SAMPLES ALONG a segment and not only its ends', () => {
    // Both ends deep in an arm of the horseshoe; the middle out in the bite. Vertices alone pass.
    expect(strokeOutside(HORSESHOE, line([[80, 15], [80, 85]], 2))).toBeGreaterThan(0);
  });

  it('does NOT wrap an OPEN polyline back to its start, and DOES wrap a closed one', () => {
    // Down the top arm, along the spine, back out the bottom arm — every segment inside the metal.
    const round: readonly Point[] = [
      [70, 15],
      [15, 15],
      [15, 85],
      [70, 85],
    ];
    expect(strokeOutside(HORSESHOE, line(round, 2))).toBe(0);
    // Closed, the return leg cuts straight across the bite, which is void.
    expect(strokeOutside(HORSESHOE, line(round, 2, true))).toBeGreaterThan(0);
  });
});
