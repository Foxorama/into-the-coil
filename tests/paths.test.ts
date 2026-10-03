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
import { edgeIndex, inside, nearestEdge, strokeOutside, tracingPen, type Pass, type Point, type Stroke } from './paths.ts';
import { drawKind } from '../src/render/bake.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { viewOf } from '../src/sim/camera.ts';

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
  composite: 'source-over',
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

/*
  ── 0421 — THE INDEX ANSWERS WHAT EVERY EDGE WOULD HAVE, TO THE BIT ───────────────────────────────

  `docs/decisions/0421-the-hull-is-asked-near.md`. `edgeIndex` is only allowed to be FASTER: the
  containment guards that ask it are the same guards they were, so any answer it gives that the full
  walk would not is every one of them measuring something else. Held on every kind the game draws,
  hull and paint, at the size it is drawn on a 1280×720 screen — curved hulls of 2,400 edges, the
  lattice and the ports cut by `evenodd`, the ring, the overlapping circles whose overlaps cancel —
  and at points chosen to be hard: exactly on vertices, where a ray grazes one, a hair either side
  of an edge, and far outside the grid.
*/
describe('0421 — edgeIndex is the full walk, only faster', () => {
  const scale = viewOf(1280, 720).scale;
  const ink = PALETTES[DEFAULT_PALETTE];

  /** A fixed spread of numbers in [0, 1), so the points are the same on every run and every machine. */
  const spread = (i: number): number => {
    const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  /** Points worth asking about a pass: on its vertices, just off its edges, and all around it. */
  const hardPoints = (pass: Pass): Point[] => {
    const all = pass.subpaths.flat();
    const xs = all.map((p) => p[0]);
    const ys = all.map((p) => p[1]);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    const out: Point[] = [];
    for (let i = 0; i < 12; i++) {
      const v = all[Math.floor(spread(i) * all.length)]!;
      out.push(v); // on a vertex: a ray through it, and a distance of exactly zero
      out.push([v[0] + 1, v[1]]); // the same height as a vertex, off to one side
      const off = (spread(i + 100) - 0.5) * 3;
      out.push([v[0] + off, v[1] - off / 2]); // a hair either side of an edge
    }
    for (let i = 0; i < 24; i++) out.push([minX - w / 4 + spread(i + 200) * w * 1.5, minY - h / 4 + spread(i + 300) * h * 1.5]);
    out.push([minX - 5 * w, minY - 5 * h], [maxX + 3 * w, (minY + maxY) / 2]); // far outside the grid
    return out;
  };

  it('THE ONE IT IS FOR: on every pass of every kind, inside and distance are the full walk’s, exactly', () => {
    const wrong: string[] = [];
    let asked = 0;
    /*
      ⚠️ **EACH SHAPE ONCE.** A hurt twin, a charged one and a charged hurt one are the same geometry
      under a different ink — `boss10Gape`'s four are one hull of 2,401 edges — and asking it four
      times asks the full walk four times for nothing. Keyed on the rule and every coordinate, so two
      passes share a key only if every question put to them has the same answer.
    */
    const shapes = new Set<string>();
    for (const kind of SPRITE_KINDS) {
      const { pen, trace } = tracingPen();
      drawKind(pen, kind, ink, SPRITE_EXTENT[kind] * scale, 'approach');
      trace.passes.forEach((pass, n) => {
        const shape = `${pass.rule}|${pass.subpaths.map((sp) => sp.map((p) => `${p[0]},${p[1]}`).join(';')).join('|')}`;
        if (shapes.has(shape)) return;
        shapes.add(shape);
        const index = edgeIndex(pass);
        for (const point of hardPoints(pass)) {
          asked++;
          const within = inside(pass, point);
          const near = nearestEdge(pass, point);
          if (index.inside(point) !== within) wrong.push(`${kind} pass ${n} at ${point.join(',')}: inside ${!within} for ${within}`);
          if (!Object.is(index.distance(point), near)) {
            wrong.push(`${kind} pass ${n} at ${point.join(',')}: distance ${index.distance(point)} for ${near}`);
          }
        }
      });
    }
    // 278,504 on 2026-09-30, over every distinct shape. A floor well under it, so a new kind costs
    // nothing here and a sample that has quietly stopped reaching the passes does not pass.
    expect(asked, 'the sample asked almost nothing, so it proves almost nothing').toBeGreaterThan(150_000);
    expect(wrong.slice(0, 8), `${wrong.length} answer(s) the full walk would not have given`).toEqual([]);
    /*
      ⚠️ **ITS OWN BUDGET, PER 0245: THREE TIMES 45.1 s**, measured under a whole-suite run on the
      development box on 2026-09-30; 7.9 s alone. It is the full walk's cost, paid once per distinct
      shape instead of on every body in every place.
    */
  }, 140_000);

  it('and a hole is a hole: a point in an evenodd gap is outside, as the full walk says', () => {
    // The shape the guards rely on it for — a square with a square cut out of it.
    const holed: Pass = {
      subpaths: [
        [[0, 0], [100, 0], [100, 100], [0, 100]],
        [[40, 40], [60, 40], [60, 60], [40, 60]],
      ],
      rule: 'evenodd',
      alpha: 1,
      colour: '#000000',
      composite: 'source-over',
    };
    expect(edgeIndex(holed).inside([50, 50])).toBe(false);
    expect(edgeIndex(holed).inside([20, 20])).toBe(true);
    expect(edgeIndex(holed).distance([50, 50])).toBe(10);
  });
});
