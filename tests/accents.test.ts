import { describe, expect, it, vi } from 'vitest';

import { INK_OF, drawKind } from '../src/render/bake.ts';

/*
  ⚠️ **FILE-LEVEL, BECAUSE THE WORK IS SEVEN PLACES DEEP NOW AND THE DEFAULT IS A WALL CLOCK.** The
  containment claim samples every mark on every body in every place at a pixel a step; alone it takes
  under a second and inside `npm run check`, beside sixty other suites, it took eight — and vitest's
  five-second default called that a failure. `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`:
  a guard that reddens under load is reading the clock where it means work. The work is deterministic;
  the clock is not the measurement.
*/
vi.setConfig({ testTimeout: 60_000 });
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { SPRITE_EXTENT, SPRITE_KINDS, type SpriteKind } from '../src/content/sprites.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { THEME_KINDS, type ThemeKind } from '../src/content/themes.ts';
import { viewOf } from '../src/sim/camera.ts';
import { inside, tracingPen, type Pass, type Point } from './paths.ts';

/**
 * A SPRITE IS PAINTED, AND THE PAINT STAYS ON THE HULL.
 *
 * `docs/decisions/0227-a-sprite-is-painted-not-filled.md`, over the ground
 * `docs/decisions/0149-a-hull-has-an-interior.md` and
 * `docs/decisions/0194-a-hull-has-a-livery.md` laid: an arm may now paint any number of marks in any
 * shade of any ink over a sealed hull, and what is held is exactly what those two held over their
 * tables — with the table gone.
 *
 * ⚠️ **EVERY CLAIM HERE IS MEASURED OFF THE TRACE OF THE REAL DRAWING.** `tests/paths.ts` records
 * every fill `drawKind` makes, in order, with its alpha and its colour, so *is this mark on the hull*
 * is arithmetic over what was actually drawn rather than a reading of a table beside it — the
 * distinction `docs/decisions/0027-measure-the-picture-not-the-model.md` draws between a guard and a
 * second copy of the thing it guards. A guard over `ACCENT_OF` proved `ACCENT_OF`; this proves the
 * picture.
 *
 * ⚠️ **AND THE MEASUREMENTS ARE IN CSS PIXELS OF A 1280×720 SCREEN**, which is the screen every
 * play-test in `reports/` was given on. 0027: *"at least one assertion is written in units the player
 * experiences."*
 *
 * ── WHAT A BODY IS, AND WHAT IS NOT ONE ──────────────────────────────────────────────────────────
 *
 * A BODY has a hull: the first fill is its silhouette, sealed with the outline, and everything after
 * it is paint. The sky tiles, the landmarks, the box edge and the flares are not bodies — a starfield
 * is dozens of discs with no outline, and a fireball has no edge on purpose — so they are listed out
 * below rather than matched on a prefix, for the reason 0203 gave: a prefix would let a real hull
 * through the day somebody named one after a place.
 */

/** The screen the reports were made on, so a pixel here is a pixel somebody looked at. */
const DESKTOP = viewOf(1280, 720);

/** Kinds that are drawn without a hull, and are therefore not measured against one. */
const HULLLESS: readonly SpriteKind[] = [
  'skyFar',
  'skyNear',
  'skyRush',
  'skyNebula',
  'skyGround',
  'landmark',
  'landmarkB',
  'landmarkC',
  'bound',
  'burst0',
  'burst1',
  'burst2',
  'burst3',
  'spark0',
  'spark1',
];

/** Every kind with a hull: the ships, the enemies, the bosses, the shots, the pickups, the shell. */
const BODIES: readonly SpriteKind[] = SPRITE_KINDS.filter((kind) => !HULLLESS.includes(kind));

/** Every boss hull, off the rows that declare them rather than a list kept by hand. */
const BOSS_HULLS: readonly SpriteKind[] = BOSS_KINDS.map((kind) => SPRITE_KINDS[BOSSES[kind].sprite]!);

/**
 * How wide a sprite is drawn on that screen, in CSS pixels — and therefore the `size` to trace at.
 *
 * `drawKind`'s whole coordinate system is a fraction of `size`, so tracing at the size the sprite
 * actually occupies makes every traced coordinate a CSS pixel of the real screen. Nothing is scaled
 * afterwards, and no test below has to know what `r` is.
 */
const cssSize = (kind: SpriteKind): number => SPRITE_EXTENT[kind] * DESKTOP.scale;

/** The palette the game opens in. */
const INK = PALETTES[DEFAULT_PALETTE];

/** Trace one kind at a stated size, in a place. `passes[0]` is the hull; the rest is paint. */
function traceAt(kind: SpriteKind, size: number, theme: ThemeKind = 'approach'): ReturnType<typeof tracingPen>['trace'] {
  const { pen, trace } = tracingPen();
  drawKind(pen, kind, INK, size, theme);
  return trace;
}

/**
 * Trace one kind at the size it is drawn on a 1280×720 screen, in a place.
 *
 * ⚠️ **IN EVERY PLACE, SINCE 0228.** An enemy's paint is its place's — a different motif on a
 * different skin in each of the seven — so a mark that fits at The Approach says nothing about
 * Saurian Belt's scales. Every claim below runs over `THEME_KINDS`.
 */
const trace = (kind: SpriteKind, theme: ThemeKind = 'approach'): ReturnType<typeof tracingPen>['trace'] =>
  traceAt(kind, cssSize(kind), theme);

/** How far a point is from the nearest edge of a pass, in the pass's own pixels. Unsigned. */
function distanceToEdge(pass: Pass, [px, py]: Point): number {
  let best = Number.POSITIVE_INFINITY;
  for (const subpath of pass.subpaths) {
    for (let i = 0; i < subpath.length; i++) {
      const [ax, ay] = subpath[i]!;
      const [bx, by] = subpath[(i + 1) % subpath.length]!;
      const dx = bx - ax;
      const dy = by - ay;
      const lengthSq = dx * dx + dy * dy;
      const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
      const ex = px - (ax + t * dx);
      const ey = py - (ay + t * dy);
      best = Math.min(best, Math.sqrt(ex * ex + ey * ey));
    }
  }
  return best;
}

/** Every point of a pass's outline, one per pixel of edge, so nothing slips between two samples. */
function outlineSamples(pass: Pass): Point[] {
  const out: Point[] = [];
  for (const subpath of pass.subpaths) {
    for (let i = 0; i < subpath.length; i++) {
      const [ax, ay] = subpath[i]!;
      const [bx, by] = subpath[(i + 1) % subpath.length]!;
      const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
      for (let s = 0; s < steps; s++) out.push([ax + ((bx - ax) * s) / steps, ay + ((by - ay) * s) / steps]);
    }
  }
  return out;
}

/** The pass's bounding box, in its own pixels. */
function boundsOf(pass: Pass): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const subpath of pass.subpaths) {
    for (const [x, y] of subpath) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY };
}

/**
 * How far inside the hull the whole mark stays, in CSS pixels — the smallest clearance anywhere on
 * it, or a negative number naming how far the worst point pokes out.
 *
 * ⚠️ **THE INTERIOR IS SAMPLED AS WELL AS THE OUTLINE, AND THAT IS NOT BELT-AND-BRACES.** A mark
 * whose outline sits comfortably on the hull can still be laid over a hole — `boss3`'s lattice,
 * `boss5`'s ports, `boss7`'s ring and the warden's aperture are each a gap the sky shows through, and
 * painting across one takes a hole away rather than adding a mark. Only a grid over the mark can see
 * it.
 *
 * ⚠️ **A POINT ON THE HULL'S OWN EDGE COUNTS AS INSIDE.** The ship's nose light and the pods' stripes
 * are authored to meet the outline, and a ray cast on a vertex is a coin toss; a point within a tenth
 * of a pixel of the edge is taken as on it.
 */
function clearance(hull: Pass, mark: Pass): number {
  let worst = Number.POSITIVE_INFINITY;
  for (const point of outlineSamples(mark)) {
    const gap = distanceToEdge(hull, point);
    if (gap < 0.1) continue;
    worst = Math.min(worst, inside(hull, point) ? gap : -gap);
  }
  const { minX, minY, maxX, maxY } = boundsOf(mark);
  for (let x = minX; x <= maxX; x += 2) {
    for (let y = minY; y <= maxY; y += 2) {
      const point: Point = [x, y];
      if (!inside(mark, point)) continue;
      if (inside(hull, point)) continue;
      const gap = distanceToEdge(hull, point);
      if (gap < 0.1) continue;
      worst = Math.min(worst, -gap);
    }
  }
  return worst;
}

/**
 * The clearance a mark in the void's own colour must keep, in CSS pixels on a 1280×720 screen.
 *
 * ⚠️ **0149's NUMBER, FOR 0149's MARKS.** A mark in `space` is a hole in the picture, and a hull
 * whose ink between that hole and the outside is thinner than the smallest thing this game will draw
 * has a bite out of its silhouette rather than a mark on it. 2.5px is
 * `docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md`'s floor read as a gap. **A mark in
 * any other colour is paint, and paint may run to the edge** — the ship's nose light does.
 */
const HOLE_CLEARANCE_PX = 2.5;

/** The alpha at or above which a mark is solid, and therefore has to be on the hull. */
const SOLID = 0.9;

/**
 * How far outside its hull a translucent mark may reach: to the sprite's own drawing radius.
 *
 * ⚠️ **A PLUME AND A HALO LEAVE THE HULL, AND THAT IS THE PICTURE RATHER THAN A LOOPHOLE.** An
 * exhaust trails the ship and a bolt is lit around its edge; neither is solid, so neither moves the
 * silhouette the collision and the extents are about. What they may not do is reach the sprite's
 * box, where the next bitmap begins — `drawKind`'s `r` is 42% of the extent, and the halo's limit is
 * that radius plus the margin to the box, less a pixel of the outline.
 */
const REACH = 1.16;

/** The hull pass and every mark painted over it, in a place. */
function hullAndPaint(kind: SpriteKind, theme: ThemeKind = 'approach'): { hull: Pass; paint: readonly Pass[] } {
  const passes = trace(kind, theme).passes;
  const hull = passes[0];
  if (hull === undefined) throw new Error(`${kind} draws nothing`);
  return { hull, paint: passes.slice(1) };
}

describe('0227 — a sprite is painted, and the paint stays on the hull', () => {
  it('THE 0149 ONE: every solid mark on a body is inside its hull, in CSS pixels of a 1280×720 screen', () => {
    /*
      ⚠️ **The bound the report asked for, and it is a claim about the SPRITE and not about the
      mark.** A hull's outer bounds are what `src/content/sprites.ts`'s extents, the pairing in
      `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md` and
      `docs/decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md`'s half-a-screen rule are all
      written against. A solid mark over the edge is a body bigger than the thing it collides as.
    */
    const measured: string[] = [];
    for (const theme of THEME_KINDS) {
      for (const kind of BODIES) {
        const { hull, paint } = hullAndPaint(kind, theme);
        paint.forEach((mark, i) => {
          if (mark.alpha < SOLID) return;
          const gap = clearance(hull, mark);
          if (!Number.isFinite(gap)) return;
          measured.push(`${kind}#${i + 1}: ${gap.toFixed(2)}px`);
          const floor = mark.colour === INK.space ? HOLE_CLEARANCE_PX : 0;
          expect(
            gap,
            `mark ${i + 1} on the ${kind} at ${theme} (${mark.colour}) comes within ${gap.toFixed(2)}px of the outside ` +
              `of its hull against a floor of ${floor} (${measured.slice(-6).join(', ')}) — a negative number means it ` +
              'is over the edge or over a hole, and either way the silhouette the player reads is not the one the file draws',
          ).toBeGreaterThanOrEqual(floor);
        });
      }
    }
  });

  it('and a translucent mark — a plume, a halo — stays inside the sprite’s own box', () => {
    for (const theme of THEME_KINDS) {
      for (const kind of BODIES) {
        const { paint } = hullAndPaint(kind, theme);
        const half = cssSize(kind) / 2;
        const r = cssSize(kind) * 0.42;
        paint.forEach((mark, i) => {
          if (mark.alpha >= SOLID) return;
          const box = boundsOf(mark);
          const reach = Math.max(half - box.minX, box.maxX - half, half - box.minY, box.maxY - half) / r;
          expect(
            reach,
            `translucent mark ${i + 1} on the ${kind} at ${theme} reaches ${reach.toFixed(2)} of the drawing radius, ` +
              `past the ${REACH} where the next bitmap begins`,
          ).toBeLessThanOrEqual(REACH);
        });
      }
    }
  });

  it('and no solid mark on a body is too thin to be drawn at all', () => {
    /*
      ⚠️ **2.5 CSS pixels, which is not a new number** —
      `docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md`, found when the sky's marks
      baked below a pixel and vanished. A mark is decoration, so nothing announces it if it fails; it
      would simply not be there, and the body would be the flat ink the report is about.

      ⚠️ **Solid marks only.** A glow's edge is the gradient's fade and has no width to measure.
    */
    for (const theme of THEME_KINDS) {
      for (const kind of BODIES) {
        const { paint } = hullAndPaint(kind, theme);
        paint.forEach((mark, i) => {
          if (mark.alpha < SOLID) return;
          for (const subpath of mark.subpaths) {
            const box = boundsOf({ subpaths: [subpath], rule: mark.rule, alpha: mark.alpha, colour: mark.colour });
            const thinnest = Math.min(box.maxX - box.minX, box.maxY - box.minY);
            expect(
              thinnest,
              `mark ${i + 1} on the ${kind} at ${theme} is ${thinnest.toFixed(2)}px across on a 1280×720 screen, so it is not drawn`,
            ).toBeGreaterThanOrEqual(2.5);
          }
        });
      }
    }
  });

  it('and a hurt twin is the hull flat in its flash ink, with nothing painted on it', () => {
    /*
      ⚠️ **0035's rule, read over the trace.** A flash is *the SAME shape in a different ink*, so that
      it reads as *that thing being hurt* rather than as a second object. A white ship with every
      panel still on it is a paler ship; the twin is the silhouette and the outline and no more — the
      one exception being the seven bosses' carved interiors, which 0149 put on both and which are
      holes rather than paint.
    */
    for (const theme of THEME_KINDS) {
      for (const kind of BODIES) {
      if (!kind.endsWith('Hit')) continue;
      const base = kind.slice(0, -3) as SpriteKind;
      const { hull, paint } = hullAndPaint(kind, theme);
      const { hull: baseHull } = hullAndPaint(base, theme);
      expect(JSON.stringify(hull.subpaths), `${kind} is a different shape from ${base}, so a flash changes the silhouette`).toBe(
        JSON.stringify(baseHull.subpaths),
      );
      for (const mark of paint) {
        expect(mark.colour, `${kind} at ${theme} carries paint (${mark.colour}) on its flash, so a hit reads as a paler ${base}`).toBe(
          INK.space,
        );
      }
      }
    }
  });

  it('and no body is drawn in the void’s own ink, which is the one paint could not be told from', () => {
    for (const kind of BODIES) {
      expect(INK_OF[kind], `the ${kind} is drawn in an ink its own marks would not be told apart from`).not.toBe('space');
    }
  });
});

describe('a boss differs from every other by more than its paint', () => {
  /** Every hull traced at one size, so *the same drawing* is a question about shape and not scale. */
  const COMMON = 400;

  /** A pass's geometry as a comparable string: every vertex, rounded to a tenth of a pixel. */
  const shapeOf = (pass: Pass): string =>
    pass.subpaths.map((s) => s.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')).join(' | ');

  it('THE 0081 ONE: no two boss hulls are the same drawing once the paint is taken off', () => {
    /*
      ⚠️ **The rule the report pointed at the new axis.**
      `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md` is about
      what the player must TELL APART; paint is a second channel, and a second channel is exactly the
      thing that can quietly become the ONLY one. Two bosses given one hull and two liveries would
      read as one boss twice and every guard in the repository would be green — which is not
      hypothetical: five bosses shipped with no hit interaction at all because two sprites baked
      identically, and `tests/legibility.test.ts` carries that post-mortem.

      ⚠️ **It compares the hull pass and not the finished bitmap ON PURPOSE.** Comparing the drawing
      with its paint on would let the paint supply the difference, which is the failure being refused.
    */
    const seen = new Map<string, SpriteKind>();
    for (const kind of BOSS_HULLS) {
      const shape = shapeOf(traceAt(kind, COMMON).passes[0]!);
      const twin = seen.get(shape);
      expect(twin, `the ${kind} and the ${twin} are one hull, so only their paint tells them apart`).toBeUndefined();
      seen.set(shape, kind);
    }
    expect(seen.size, 'seven bosses, fewer than seven hulls').toBe(BOSS_HULLS.length);
  });

  it('and every boss is painted, and no two wear the same paint', () => {
    // Seven interiors, one per boss — 0149's own wording, held over the trace now rather than over
    // the table it used to read.
    const seen = new Map<string, SpriteKind>();
    for (const kind of BOSS_HULLS) {
      const paint = traceAt(kind, COMMON).passes.slice(1);
      expect(paint.length, `the ${kind} hull is one flat ink again`).toBeGreaterThan(0);
      const shape = paint.map(shapeOf).join(' || ');
      const twin = seen.get(shape);
      expect(twin, `the ${kind} and the ${twin} carry the same paint`).toBeUndefined();
      seen.set(shape, kind);
    }
  });
});

describe('paint costs nothing to draw', () => {
  it('is more fills in the SAME bitmap, and not a second sprite over the first', () => {
    /*
      ⚠️ **What this is really holding is the blit count**, and the blit count is held by
      `tests/budget.test.ts` — *the worst-case scene costs one blit per entity, and nothing else*.
      `docs/decisions/0022-frame-rate-is-a-feature.md` and
      `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` count draw calls and allocations
      rather than path segments, so a fill at bake time is free and a second BITMAP would not be.
      `scripts/probes/0149-a-hull-has-an-interior.mjs` reddens that guard with a boss blitted twice,
      which is what paint implemented as an overlay sprite would cost.

      What is asserted here is the half budget.test.ts cannot see: that every body is sealed exactly
      once — one outline, however many fills go over it.
    */
    for (const kind of BODIES) {
      const traced = trace(kind);
      expect(traced.strokes, `the ${kind} is outlined ${traced.strokes} times`).toBe(1);
    }
  });

  it('and every kind that is not a body is one the list above names on purpose', () => {
    // The hull-less list is a claim about the atlas, so a kind added to the union lands in BODIES
    // and is measured — unless somebody comes here and says why it should not be.
    for (const kind of HULLLESS) expect(SPRITE_KINDS, `${kind} is listed as hull-less and is not a kind`).toContain(kind);
    expect(new Set(HULLLESS).size, 'a kind is listed hull-less twice').toBe(HULLLESS.length);
    expect(BODIES.length + HULLLESS.length).toBe(SPRITE_KINDS.length);
  });
});
