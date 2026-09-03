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
}

/** One `fillRect()`: its rectangle and the alpha it was laid down at. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly alpha: number;
}

/** What a trace answers. `passes[0]` is the hull; a second pass is an accent. */
export interface Trace {
  readonly passes: readonly Pass[];
  readonly strokes: number;
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

/** A pen that records, and the trace it is filling in. */
export function tracingPen(): { pen: Pen; trace: Trace } {
  const passes: Pass[] = [];
  const rects: Rect[] = [];
  let subpaths: Point[][] = [];
  let current: Point[] | null = null;
  let strokes = 0;

  const start = (p: Point): Point[] => {
    const next: Point[] = [p];
    subpaths.push(next);
    current = next;
    return next;
  };

  const pen = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: 'butt',
    globalAlpha: 1,

    beginPath(): void {
      subpaths = [];
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
    rect(x: number, y: number, w: number, h: number): void {
      // A rect is its own closed sub-path, and it leaves no current point behind it.
      subpaths.push([
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ]);
      current = null;
    },
    closePath(): void {
      // Every sub-path is treated as closed when it is measured, so this only ends the current one.
      current = null;
    },
    fill(rule?: CanvasFillRule): void {
      passes.push({ subpaths: subpaths.map((s) => [...s]), rule: rule ?? 'nonzero', alpha: pen.globalAlpha });
    },
    stroke(): void {
      strokes++;
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
