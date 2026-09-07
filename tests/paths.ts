/**
 * A PEN THAT REMEMBERS WHERE THE INK WENT, so the art can be measured without a browser.
 *
 * ⚠️ **`src/render/bake.ts` IS THE ONE PART OF THE PICTURE NO GUARD COULD READ.** Every shape in it
 * is drawn imperatively into a `CanvasRenderingContext2D`, and the only way to see the result was to
 * bake a real atlas — which needs a `document`, which means `dist/` and a real Chromium. So the
 * silhouettes have been held by prose and by eyes since the file was written, and
 * `reports/enemy-silhouettes-2026-08-05.md` records what that costs: a shape reasoned to be
 * *obviously not a diamond*, which shipped as a diamond.
 *
 * ⚠️ **THE FIX IS THE ONE `skyField` AND `bakeSize` ALREADY MADE** — state the quantity a guard needs
 * in something node can hold. `drawKind` now takes a `Pen`, which is fifteen members; this implements
 * one, flattens the arcs, and hands back the sub-paths as polygons. What
 * `docs/decisions/0149-a-hull-has-an-interior.md` asks of the picture is then arithmetic.
 *
 * ⚠️ **IT IS A TRACE OF THE REAL DRAWING AND NOT A SECOND COPY OF IT.**
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` is about guards that re-derive what
 * they are guarding and therefore only prove the code agrees with itself. Nothing here knows what a
 * boss looks like: it is handed whatever `drawKind` draws, including the shapes a future edit puts
 * there.
 *
 * ── WHAT IT DOES NOT MODEL ───────────────────────────────────────────────────────────────────────
 *
 * **The stroke.** Every path is treated as its fill. The outline is half a `lineWidth` outside the
 * fill on every hull, so a containment claim made against the fill is the stricter of the two — and
 * it is the fill that decides what a silhouette is.
 *
 * **Transforms.** `bakeOne` rotates the context for the top-down view before calling `drawKind`;
 * nothing here is rotated, because a rotation moves the hull and its accent together and no claim
 * below survives or fails because of it. `docs/decisions/0031-landscape-is-the-shipped-orientation.md`
 * means the side profile is the one that ships anyway.
 */

import type { Pen } from '../src/render/bake.ts';

/** A point on a traced path, in the same pixels the drawing was asked for. */
export type Point = readonly [number, number];

/** One `fill()`: every sub-path the pen was carrying when it happened, as closed polygons. */
export interface Pass {
  readonly subpaths: readonly (readonly Point[])[];
  /** The fill rule it was filled under, which is `evenodd` everywhere in `bake.ts`. */
  readonly rule: CanvasFillRule;
  /**
   * The `globalAlpha` in force when it was filled.
   *
   * ⚠️ **ADDED FOR A CLAIM THAT IS ABOUT OPACITY AND NOTHING ELSE** — 0221. A planet's ground has to
   * have *"nothing behind it"*, which is not a shape, a position or a size: it is one number, and
   * without it here the only way to check it is to read the source and believe it.
   */
  readonly alpha: number;
  /**
   * The `fillStyle` in force when it was filled: a hex string, or `'gradient'` for a glow.
   *
   * ⚠️ **ADDED FOR 0227, WHICH LETS AN ARM PAINT IN ANY COLOUR.** A mark in the void's own colour is
   * a hole in the picture and is held to 0149's room-to-spare floor; a mark in any other colour is
   * paint on the hull and only has to stay on it. Telling the two apart is one string.
   */
  readonly colour: string;
}

/** One `fillRect()`: its rectangle and the alpha it was laid down at. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly alpha: number;
}

/**
 * One `stroke()`: the polylines it inked, and how wide.
 *
 * ⚠️ **THIS IS THE CEILING [0264](../docs/decisions/0264-the-real-bosses-are-drawn.md) COULD NOT SEE
 * PAST, AND IT WAS A DEFECT.** Its *What was rejected* says the predecessor's stacked-stroke spine —
 * the natural way to draw a taper, and the technique that makes the Jörmungandr work — was refused
 * because *"`tests/paths.ts` models a stroke as its fill, so a stroked spine would be a mark the
 * containment guard cannot see."* The guard was never RED. Its modelling limit picked the drawing
 * technique, which is [0192](../docs/decisions/0192-a-guard-holds-an-invariant.md) read backwards, and
 * `reports/the-vocabulary-is-the-ceiling-2026-09-08.md` is the measurement.
 *
 * ⚠️ **THE INVARIANT NEVER MOVED — only what could be measured against it.** *A mark stays inside the
 * collision silhouette* is as true of a stroke as of a fill; `strokeInside` below is how it is now
 * asked, and it is asked STRICTLY, without building an offset polygon: every point along the centre
 * line has to sit at least half a `lineWidth` clear of the hull's edge. That is exactly the region a
 * butt- or round-capped stroke inks, and it is conservative at an outside corner, where a mitre
 * reaches further than the guard credits it for.
 */
export interface Stroke {
  readonly subpaths: readonly (readonly Point[])[];
  /**
   * Whether each sub-path was closed, positionally.
   *
   * ⚠️ **A FILL CLOSES EVERY SUB-PATH AND A STROKE DOES NOT, AND THE DIFFERENCE IS THE WHOLE GUARD.**
   * `inside` may treat a fill's sub-paths as closed because the canvas does. A stroked SPINE is an
   * open polyline from a skull to a tail, and a check that wrapped it would measure a segment
   * straight back across the void that was never inked — every stroke in the game would read as
   * leaving its hull, which is the shape of over-firing that gets a guard switched off.
   */
  readonly closed: readonly boolean[];
  /** The `lineWidth` in force, in the same pixels the drawing was asked for. */
  readonly width: number;
  readonly alpha: number;
  /** The `strokeStyle` in force: a hex string, or `'gradient'`. */
  readonly colour: string;
}

/** What a trace answers. `passes[0]` is the hull; a second pass is an accent. */
export interface Trace {
  readonly passes: readonly Pass[];
  /**
   * How many times the pen was stroked.
   *
   * ⚠️ **KEPT AS A COUNT ALONGSIDE `inks`, because guards read it as one** — 0227's *nothing strokes
   * after the seal* is a claim about how MANY, and rewriting those to count `inks` would be a change
   * to what they assert dressed up as a refactor.
   */
  readonly strokes: number;
  /** Every `stroke()`, in order, with its geometry — 0276. */
  readonly inks: readonly Stroke[];
  /** Every `fillRect`, in order. Empty for everything but a planet's ground. */
  readonly rects: readonly Rect[];
}

/**
 * How many segments a full circle is flattened into.
 *
 * ⚠️ **A polygon INSIDE the arc, so containment is answered conservatively.** A chord cuts the
 * corner, so the flattened hull is slightly smaller than the drawn one and the flattened accent
 * slightly smaller than its disc — the first makes containment harder to claim and the second makes
 * it easier, and at 128 segments the sagitta on the biggest hull in the game (`boss7`, 38 units) is
 * under a twentieth of a CSS pixel on the screen the guards measure at. Below anything a guard here
 * asserts by three orders of magnitude, and cheap: this runs once per kind, in a test.
 */
const ARC_SEGMENTS = 128;

/**
 * How many segments one Bézier is flattened into — 0276.
 *
 * ⚠️ **PER CURVE, where `ARC_SEGMENTS` is per full circle.** A body drawn as a chain of Béziers has
 * one of these per spine segment, and a serpent is nine of them: 288 points for a hull whose whole
 * job is to have no visible corner in it. The same conservatism argument as the arc's applies — a
 * chord cuts inside — and the same cheapness: this runs once per kind, in a test.
 */
const CURVE_SEGMENTS = 32;

/** A pen that records, and the trace it is filling in. */
export function tracingPen(): { pen: Pen; trace: Trace } {
  const passes: Pass[] = [];
  const rects: Rect[] = [];
  const inks: Stroke[] = [];
  let subpaths: Point[][] = [];
  // Positional against `subpaths`: whether `closePath` (or a `rect`) ever closed each one — 0276.
  let closed: boolean[] = [];
  let current: Point[] | null = null;
  let strokes = 0;

  const start = (p: Point): Point[] => {
    const next: Point[] = [p];
    subpaths.push(next);
    closed.push(false);
    current = next;
    return next;
  };

  const pen = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: 'butt',
    globalAlpha: 1,
    // Recorded and not applied: a mark painted `destination-over` is still a mark, at its own alpha,
    // and the containment guards read alpha rather than order — 0236.
    globalCompositeOperation: 'source-over',

    beginPath(): void {
      subpaths = [];
      closed = [];
      current = null;
    },
    moveTo(x: number, y: number): void {
      start([x, y]);
    },
    lineTo(x: number, y: number): void {
      (current ?? start([x, y])).push([x, y]);
    },
    arc(x: number, y: number, radius: number, from: number, to: number, anticlockwise?: boolean): void {
      /*
        The canvas rule, and it matters for `warden`, `boss5`, `boss6` and `boss7`: an `arc` with a
        current point is joined to it by a straight line, and one without opens a sub-path. Every
        caller in `bake.ts` puts a `moveTo` at the arc's own start so the joining line is degenerate,
        which is exactly what this reproduces rather than assumes.
      */
      let span = to - from;
      if (anticlockwise === true) {
        while (span > 0) span -= Math.PI * 2;
      } else {
        while (span < 0) span += Math.PI * 2;
      }
      const steps = Math.max(2, Math.ceil((Math.abs(span) / (Math.PI * 2)) * ARC_SEGMENTS));
      for (let i = 0; i <= steps; i++) {
        const a = from + (span * i) / steps;
        const p: Point = [x + Math.cos(a) * radius, y + Math.sin(a) * radius];
        if (current === null) start(p);
        else current.push(p);
      }
    },
    /*
      ── THE TWO CURVES — 0276 ──────────────────────────────────────────────────────────────────

      ⚠️ **FLATTENED THE WAY `arc` ABOVE IS FLATTENED, AND FOR THE SAME REASON.** A chord of a convex
      curve lies inside it, so a flattened hull is slightly smaller than the drawn one and a flattened
      mark slightly smaller than its curve — containment gets harder to claim and easier to satisfy,
      which is the direction a guard is allowed to be wrong in.

      ⚠️ **A curve with no current point starts at its own first control point**, which is the canvas
      rule and not a convenience: `bake.ts` always puts a `moveTo` first, and reproducing the rule
      rather than assuming the caller is what let `arc` catch four hulls it would otherwise have
      mismeasured.
    */
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
      const from = current?.[current.length - 1] ?? start([cpx, cpy])[0]!;
      const path = current!;
      for (let i = 1; i <= CURVE_SEGMENTS; i++) {
        const t = i / CURVE_SEGMENTS;
        const u = 1 - t;
        path.push([
          u * u * from[0] + 2 * u * t * cpx + t * t * x,
          u * u * from[1] + 2 * u * t * cpy + t * t * y,
        ]);
      }
    },
    bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void {
      const from = current?.[current.length - 1] ?? start([c1x, c1y])[0]!;
      const path = current!;
      for (let i = 1; i <= CURVE_SEGMENTS; i++) {
        const t = i / CURVE_SEGMENTS;
        const u = 1 - t;
        path.push([
          u * u * u * from[0] + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x,
          u * u * u * from[1] + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y,
        ]);
      }
    },
    rect(x: number, y: number, w: number, h: number): void {
      // A rect is its own closed sub-path, and it leaves no current point behind it.
      subpaths.push([
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ]);
      closed.push(true);
      current = null;
    },
    closePath(): void {
      // A FILL treats every sub-path as closed whatever this did; a stroke does not, and `Stroke`
      // above is why the flag is kept rather than the current point merely being dropped — 0276.
      if (current !== null) closed[subpaths.indexOf(current)] = true;
      current = null;
    },
    fill(rule?: CanvasFillRule): void {
      passes.push({
        subpaths: subpaths.map((s) => [...s]),
        rule: rule ?? 'nonzero',
        alpha: pen.globalAlpha,
        colour: typeof pen.fillStyle === 'string' ? pen.fillStyle : 'gradient',
      });
    },
    stroke(): void {
      strokes++;
      inks.push({
        subpaths: subpaths.map((s) => [...s]),
        closed: [...closed],
        width: pen.lineWidth,
        alpha: pen.globalAlpha,
        colour: typeof pen.strokeStyle === 'string' ? pen.strokeStyle : 'gradient',
      });
    },
    fillRect(x: number, y: number, w: number, h: number): void {
      // `bound` returns before the fill this trace is about; a planet's ground uses it for the
      // shadow under its canopy, which is a claim about alpha rather than about a silhouette.
      rects.push({ x, y, w, h, alpha: pen.globalAlpha });
    },
    createRadialGradient(): CanvasGradient {
      // Only the nebula uses it. A trace of the sky is not a thing anything asks for.
      return { addColorStop(): void {} } as unknown as CanvasGradient;
    },
    /*
      ⚠️ **A FORM-SHADE IS A LINEAR GRADIENT, AND `fill` ABOVE ALREADY KNOWS WHAT TO DO WITH ONE** —
      a non-string `fillStyle` is recorded as `'gradient'`, which is how 0227 tells paint from a hole
      cut in the void's own ink. Nothing about the SHAPE of the mark changes, so nothing but this stub
      is owed: a gradient is a colour, and every claim here is about geometry and alpha.
    */
    createLinearGradient(): CanvasGradient {
      return { addColorStop(): void {} } as unknown as CanvasGradient;
    },
  };

  return {
    pen: pen as unknown as Pen,
    trace: {
      get passes(): readonly Pass[] {
        return passes;
      },
      get strokes(): number {
        return strokes;
      },
      get inks(): readonly Stroke[] {
        return inks;
      },
      get rects(): readonly Rect[] {
        return rects;
      },
    },
  };
}

/**
 * Whether a point is inside a filled pass, under that pass's own fill rule.
 *
 * ⚠️ **THE FILL RULE IS READ OFF THE PASS RATHER THAN ASSUMED**, because it is what makes three of
 * the seven hulls the shapes they are: `boss3`'s lattice, `boss5`'s gun ports and `boss7`'s ring are
 * all holes cut by `evenodd`, and `boss6` is three overlapping circles and a bar whose overlaps
 * CANCEL. A containment check that ignored the rule would call a hole solid and pass an accent that
 * paints opaque void over a gap the sky shows through.
 */
export function inside(pass: Pass, [px, py]: Point): boolean {
  let crossings = 0;
  let winding = 0;
  for (const subpath of pass.subpaths) {
    for (let i = 0; i < subpath.length; i++) {
      const [ax, ay] = subpath[i]!;
      const [bx, by] = subpath[(i + 1) % subpath.length]!;
      if (ay <= py === by <= py) continue;
      // Where the edge crosses the horizontal ray, and therefore which side of the point it is on.
      const at = ax + ((py - ay) / (by - ay)) * (bx - ax);
      if (at <= px) continue;
      crossings++;
      winding += by > ay ? 1 : -1;
    }
  }
  return pass.rule === 'evenodd' ? crossings % 2 === 1 : winding !== 0;
}

/** How far `p` is from the nearest edge of `pass`, ignoring which side of it `p` is on. */
function clearanceFrom(pass: Pass, [px, py]: Point): number {
  let best = Infinity;
  for (const subpath of pass.subpaths) {
    for (let i = 0; i < subpath.length; i++) {
      const [ax, ay] = subpath[i]!;
      const [bx, by] = subpath[(i + 1) % subpath.length]!;
      const dx = bx - ax;
      const dy = by - ay;
      const len = dx * dx + dy * dy;
      // Where the foot of the perpendicular falls, clamped to the segment: a corner is its own answer.
      const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len));
      best = Math.min(best, Math.hypot(px - (ax + t * dx), py - (ay + t * dy)));
    }
  }
  return best;
}

/**
 * How far outside `pass` a `stroke` reaches, in the drawing's own pixels — zero when it stays in.
 *
 * ⚠️ **THIS IS WHAT 0264 SAID COULD NOT EXIST, AND IT IS TWENTY LINES** — see `Stroke` above. The
 * claim it answers is the one every accent already answers: *a mark stays inside the collision
 * silhouette.* A stroke inks half a `lineWidth` either side of its centre line, so the question is
 * the centre line's CLEARANCE rather than its containment, and no offset polygon has to be built.
 *
 * ⚠️ **IT SAMPLES ALONG EVERY SEGMENT AND NOT JUST THE VERTICES.** A spine drawn as two long
 * segments across a waisted hull has both ends well inside and its middle out in the void, and a
 * vertex-only check would call that contained. The sampling is by DISTANCE, so it does not get
 * coarser as a segment gets longer.
 *
 * ⚠️ **AND IT IS CONSERVATIVE AT AN OUTSIDE CORNER**, where a mitre joins reach further than half a
 * width. That is the direction a guard is allowed to be wrong in: it under-reports, so it can pass a
 * stroke that pokes out by a mitre and can never fail one that does not.
 */
export function strokeOutside(pass: Pass, stroke: Stroke): number {
  const half = stroke.width / 2;
  /*
    A tenth of the stroke's own width, floored so a hairline cannot ask for a million samples. What
    it has to be finer than is the narrowest waist a hull has, and a waist narrower than a fifth of
    the line drawn down it is not a waist — it is 0264's *nothing on a hull thinner than the outline*.
  */
  const step = Math.max(half / 5, 0.5);
  let worst = 0;
  stroke.subpaths.forEach((subpath, s) => {
    // An open polyline has one fewer segment than it has points: no wrap from the tail to the head.
    const segments = stroke.closed[s] === true ? subpath.length : subpath.length - 1;
    for (let i = 0; i < segments; i++) {
      const [ax, ay] = subpath[i]!;
      const [bx, by] = subpath[(i + 1) % subpath.length]!;
      const span = Math.hypot(bx - ax, by - ay);
      const steps = Math.max(1, Math.ceil(span / step));
      for (let k = 0; k <= steps; k++) {
        const p: Point = [ax + ((bx - ax) * k) / steps, ay + ((by - ay) * k) / steps];
        // Outside the hull entirely, or inside it but closer to the edge than the ink reaches.
        const reach = inside(pass, p) ? half - clearanceFrom(pass, p) : half + clearanceFrom(pass, p);
        worst = Math.max(worst, reach);
      }
    }
  });
  return Math.max(0, worst);
}
