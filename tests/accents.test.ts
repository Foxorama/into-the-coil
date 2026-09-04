import { describe, expect, it } from 'vitest';

import { ACCENT_OF, INK_OF, drawKind } from '../src/render/bake.ts';
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { SPRITE_EXTENT, SPRITE_KINDS, type SpriteKind } from '../src/content/sprites.ts';
import { DEFAULT_PALETTE, PALETTES, type PaletteName } from '../src/content/palette.ts';
import { viewOf } from '../src/sim/camera.ts';
import { inside, tracingPen, type Pass, type Point } from './paths.ts';

/**
 * A HULL HAS AN INTERIOR, AND IT IS INSIDE THE HULL.
 *
 * `docs/decisions/0149-a-hull-has-an-interior.md`, from
 * `reports/where-the-art-ceiling-is-2026-08-14.md`: *"every ship, every enemy and all seven bosses
 * are one flat colour with an outline. A hull cannot have a cockpit, a vent, a gun port or a lit
 * core, because there is nowhere for a second colour to come from."*
 *
 * ⚠️ **THE THREE CLAIMS ARE THE ONES THE REPORT NAMED, AND TWO OF THEM COULD NOT BE CHECKED BY
 * READING.** The hulls are drawn imperatively, three of them are holed with `evenodd`, and `boss6` is
 * three overlapping circles and a bar whose overlaps CANCEL — so *is this mark on the hull* is
 * arithmetic. `tests/paths.ts` traces the real drawing; everything below is measured off that trace
 * rather than off the numbers in `ACCENT_OF`, which is the distinction
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` draws between a guard and a second copy
 * of the thing it guards.
 *
 * ⚠️ **AND THE MEASUREMENTS ARE IN CSS PIXELS OF A 1280×720 SCREEN**, which is the screen every
 * play-test in `reports/` was given on. 0027: *"at least one assertion is written in units the player
 * experiences, because a guard measuring a quantity defined in terms of the constant it guards proves
 * only that the code agrees with itself."* A clearance in fractions of `r` would have been exactly
 * that — `r` is the constant the accents are authored in.
 */

/** The screen the reports were made on, so a pixel here is a pixel somebody looked at. */
const DESKTOP = viewOf(1280, 720);

/** Every boss hull, off the rows that declare them rather than a list kept by hand. */
const BOSS_HULLS: readonly SpriteKind[] = BOSS_KINDS.map((kind) => SPRITE_KINDS[BOSSES[kind].sprite]!);

/** …and their hurt silhouettes, which share a `case` arm and therefore share an accent. */
const BOSS_HURT: readonly SpriteKind[] = BOSS_KINDS.map((kind) => SPRITE_KINDS[BOSSES[kind].spriteHit]!);

/**
 * How wide a sprite is drawn on that screen, in CSS pixels — and therefore the `size` to trace at.
 *
 * `drawKind`'s whole coordinate system is a fraction of `size`, so tracing at the size the sprite
 * actually occupies makes every traced coordinate a CSS pixel of the real screen. Nothing is scaled
 * afterwards, and no test below has to know what `r` is.
 */
const cssSize = (kind: SpriteKind): number => SPRITE_EXTENT[kind] * DESKTOP.scale;

/** The palette the game opens in. The accents are `space`, which every palette has — see below. */
const INK = PALETTES[DEFAULT_PALETTE];

/** Trace one kind at a stated size. `passes[0]` is the hull; a second pass is its accent. */
function traceAt(kind: SpriteKind, size: number): ReturnType<typeof tracingPen>['trace'] {
  const { pen, trace } = tracingPen();
  drawKind(pen, kind, INK, size);
  return trace;
}

/** Trace one kind at the size it is drawn on a 1280×720 screen. */
const trace = (kind: SpriteKind): ReturnType<typeof tracingPen>['trace'] => traceAt(kind, cssSize(kind));

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
 * How far inside the hull the whole accent stays, in CSS pixels — the smallest clearance anywhere on
 * it, or a negative number naming how far the worst point pokes out.
 *
 * ⚠️ **THE INTERIOR IS SAMPLED AS WELL AS THE OUTLINE, AND THAT IS NOT BELT-AND-BRACES.** An accent
 * whose outline sits comfortably on the hull can still be laid over a hole — `boss3`'s lattice,
 * `boss5`'s ports and `boss7`'s ring are each a gap the sky shows through, and painting opaque
 * `space` across one takes a hole away rather than adding a mark. That is the distinction the report
 * drew between the two effects, and only a grid over the mark can see it.
 */
function clearance(hull: Pass, accent: Pass): number {
  let worst = Number.POSITIVE_INFINITY;
  for (const point of outlineSamples(accent)) {
    const gap = distanceToEdge(hull, point);
    worst = Math.min(worst, inside(hull, point) ? gap : -gap);
  }
  const { minX, minY, maxX, maxY } = boundsOf(accent);
  for (let x = minX; x <= maxX; x += 2) {
    for (let y = minY; y <= maxY; y += 2) {
      const point: Point = [x, y];
      if (!inside(accent, point)) continue;
      if (!inside(hull, point)) worst = Math.min(worst, -distanceToEdge(hull, point));
    }
  }
  return worst;
}

/**
 * The clearance every accent must keep, in CSS pixels on a 1280×720 screen.
 *
 * ⚠️ **A ROOM-TO-SPARE NUMBER AND NOT A CONTAINMENT ONE.** *Inside the hull* is `> 0`; this is 2.5px,
 * which is `docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md`'s own floor read as a
 * gap instead of a mark — a hull whose ink between an accent and the outside is thinner than the
 * smallest thing this game will draw has an accent that reads as a bite out of the silhouette rather
 * than as a mark on it. **Measured, not guessed**: the seven come in at 17.3, 9.1, 5.7, 14.8, 16.2,
 * 5.2 and 8.6 CSS pixels, so the tightest is `boss6` — whose eyes sit in three overlapping lobes —
 * at twice the floor. The failure message prints every measurement, so a change that spends the
 * margin says by how much.
 */
const CLEARANCE_PX = 2.5;

/**
 * Every kind that wears an interior, which is no longer only the bosses — 0194.
 *
 * ⚠️ **DERIVED FROM `ACCENT_OF` RATHER THAN LISTED**, so a livery authored tomorrow is measured by
 * every guard below without anybody remembering to add it. That is the whole failure
 * `docs/decisions/0016-a-hub-enumerates-kinds.md` is about, and this file used to hold a list of seven.
 */
const ACCENTED: readonly SpriteKind[] = SPRITE_KINDS.filter((kind) => ACCENT_OF[kind] !== null);

/**
 * The hull pass and every ink group over it, flattened into one.
 *
 * ⚠️ **THE ACCENT IS N PASSES NOW AND IT USED TO BE EXACTLY ONE** — 0194 groups the shapes by ink and
 * fills once per group, so `passes[1]` is only the first colour. Every claim in this file is about
 * *the marks on the hull*, not about which colour they are, so they are measured together — and a
 * livery that put a canopy over the edge in its third ink would otherwise have gone unmeasured.
 */
function hullAndAccent(kind: SpriteKind): { hull: Pass; accent: Pass } {
  const passes = trace(kind).passes;
  const hull = passes[0];
  if (hull === undefined) throw new Error(`${kind} draws nothing`);
  const rest = passes.slice(1);
  return {
    hull,
    // ⚠️ `alpha` is carried through rather than defaulted: a `Pass` grew one in 0221 and an accent
    // synthesised at full opacity would be a claim about the drawing that this file never checked.
    accent: {
      subpaths: rest.flatMap((pass) => pass.subpaths),
      rule: rest[0]?.rule ?? 'evenodd',
      alpha: rest[0]?.alpha ?? 1,
    },
  };
}

describe('a hull has an interior', () => {
  it('THE REPORTED ONE: every boss is drawn in two inks, and the file offered one', () => {
    /*
      ⚠️ **The whole of the report's finding, stated as the smallest thing that would have caught it.**
      `drawKind` set ONE `fillStyle` and ended every arm at a single `fill`, so *one flat colour with
      an outline* was not a choice about these seven shapes — it was the only picture the function
      could produce.
    */
    for (const kind of BOSS_HULLS) {
      expect(ACCENT_OF[kind], `the ${kind} hull has no interior, so it is one flat ink again`).not.toBeNull();
      expect(trace(kind).passes.length, `the ${kind} hull is drawn with one fill, so it is one ink`).toBe(2);
    }
  });

  it('and a hurt boss carries the same interior, so a flash is still one object being hurt', () => {
    /*
      `src/render/bake.ts` states the rule as *the SAME shape in a different ink* — a boss and its hurt
      sprite share a `case` arm on purpose, so that a flash reads as *that thing being hurt* rather
      than as a second object appearing. An accent on one and not the other would put the shape back
      in play, which is `tests/legibility.test.ts`'s subject arriving from a new direction.
    */
    for (let i = 0; i < BOSS_HULLS.length; i++) {
      const hull = BOSS_HULLS[i]!;
      const hurt = BOSS_HURT[i]!;
      expect(ACCENT_OF[hurt], `${hurt} and ${hull} carry different interiors, so a flash changes the shape`).toBe(
        ACCENT_OF[hull],
      );
    }
  });

  it('and the interior stays inside the hull, with room to spare, in CSS pixels of a 1280×720 screen', () => {
    const measured: string[] = [];
    for (const kind of ACCENTED) {
      const { hull, accent } = hullAndAccent(kind);
      const gap = clearance(hull, accent);
      measured.push(`${kind}: ${gap.toFixed(2)}px`);
      expect(
        gap,
        `the ${kind}'s interior comes within ${gap.toFixed(2)}px of the outside of its hull ` +
          `(${measured.join(', ')}) — a negative number means it is over the edge or over a hole, ` +
          'and either way the silhouette the player reads is not the one the file draws',
      ).toBeGreaterThanOrEqual(CLEARANCE_PX);
    }
  });

  it('and the interior never moves the silhouette, which is what collision and screen share are', () => {
    /*
      ⚠️ **The bound the report asked for, and it is a claim about the SPRITE and not about the mark.**
      A hull's outer bounds are what `src/content/sprites.ts`'s extents, the pairing in
      `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md` and
      `docs/decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md`'s half-a-screen rule are all
      written against. The clearance above already implies this; it is asserted separately because it
      is the property those three files depend on, and a future accent that is legal on a hull with a
      wide margin would still be illegal if it grew the box.
    */
    for (const kind of ACCENTED) {
      const { hull, accent } = hullAndAccent(kind);
      const outer = boundsOf(hull);
      const inner = boundsOf(accent);
      expect(inner.minX, `the ${kind}'s interior reaches past the front of its own hull`).toBeGreaterThan(outer.minX);
      expect(inner.minY, `the ${kind}'s interior reaches past the top of its own hull`).toBeGreaterThan(outer.minY);
      expect(inner.maxX, `the ${kind}'s interior reaches past the back of its own hull`).toBeLessThan(outer.maxX);
      expect(inner.maxY, `the ${kind}'s interior reaches past the bottom of its own hull`).toBeLessThan(outer.maxY);
    }
  });

  it('and no mark on one is too thin to be drawn at all', () => {
    /*
      ⚠️ **2.5 CSS pixels, which is not a new number** —
      `docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md`, found when the sky's marks
      baked below a pixel and vanished. An accent is decoration, so nothing announces it if it fails;
      it would simply not be there, and the boss would be the flat ink the report is about.
    */
    for (const kind of ACCENTED) {
      const { accent } = hullAndAccent(kind);
      for (const subpath of accent.subpaths) {
        const box = boundsOf({ subpaths: [subpath], rule: accent.rule, alpha: accent.alpha });
        const thinnest = Math.min(box.maxX - box.minX, box.maxY - box.minY);
        const why = `a mark on the ${kind} is ${thinnest.toFixed(2)}px across, so it is not drawn`;
        expect(thinnest, why).toBeGreaterThanOrEqual(2.5);
      }
    }
  });

  it('and it is drawn in an ink that means nothing, in every palette', () => {
    /*
      ⚠️ **`space`, and the two obvious alternatives are both wrong.** `impact` is the hit-flash ink,
      so a permanently impact-coloured core would muddy the one piece of feedback
      `docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md` exists for; `hazard` means
      *this will hurt you*. `space` means nothing — which is what
      `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md` allows
      decoration to mean.

      ⚠️ **AND THE CONTRAST IS ALREADY HELD, BUT NOT WHERE THE REPORT SAID.** An accent sits on the
      hull and never on the backdrop, so its pair is `space` against the hull's own ink — the
      outline's pair. `tests/palette.test.ts`'s *every ink is legible against space* holds that for
      every ink in every palette; `tests/themes.test.ts` skips `space` outright, because a backdrop is
      the thing space is measured against. What is asserted here is only the half neither covers: that
      no accented hull is itself drawn in `space`, which would be one ink on one ink.
    */
    for (const kind of ACCENTED) {
      expect(INK_OF[kind], `the ${kind} is drawn in an ink its interior would not be told apart from`).not.toBe(
        'space',
      );
    }
    for (const name of Object.keys(PALETTES) as PaletteName[]) {
      expect(PALETTES[name].space, `the ${name} palette has no space ink for an interior to be drawn in`).toBeTruthy();
    }
  });
});

describe('a boss differs from every other by more than its interior', () => {
  /** Every hull traced at one size, so *the same drawing* is a question about shape and not scale. */
  const COMMON = 400;

  /** A hull's geometry as a comparable string: every vertex, rounded to a tenth of a pixel. */
  const shapeOf = (kind: SpriteKind): string =>
    traceAt(kind, COMMON)
      .passes[0]!.subpaths.map((s) => s.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '))
      .join(' | ');

  it('THE 0081 ONE: no two boss hulls are the same drawing once the interiors are taken off', () => {
    /*
      ⚠️ **The rule the report pointed at the new axis.**
      `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md` is about
      what the player must TELL APART; an interior is a second channel, and a second channel is
      exactly the thing that can quietly become the ONLY one. Two bosses given one hull and two
      accents would read as one boss twice and every guard in the repository would be green — which is
      not hypothetical: five bosses shipped with no hit interaction at all because two sprites baked
      identically, and `tests/legibility.test.ts` carries that post-mortem.

      ⚠️ **It compares the hull pass and not the finished bitmap ON PURPOSE.** Comparing the drawing
      with its accent on would let an accent supply the difference, which is the failure being
      refused.
    */
    const seen = new Map<string, SpriteKind>();
    for (const kind of BOSS_HULLS) {
      const shape = shapeOf(kind);
      const twin = seen.get(shape);
      expect(twin, `the ${kind} and the ${twin} are one hull, so only their interiors tell them apart`).toBeUndefined();
      seen.set(shape, kind);
    }
    expect(seen.size, 'seven bosses, fewer than seven hulls').toBe(BOSS_HULLS.length);
  });

  it('and no two of them wear the same interior either', () => {
    // Seven accents, one per boss — the report's own wording. A shared one is the smell it names,
    // fourteen `SpriteKind`s standing in for seven bosses and a `variant` that does not exist.
    const seen = new Map<string, SpriteKind>();
    for (const kind of BOSS_HULLS) {
      const shape = JSON.stringify(ACCENT_OF[kind]);
      const twin = seen.get(shape);
      expect(twin, `the ${kind} and the ${twin} carry the same interior`).toBeUndefined();
      seen.set(shape, kind);
    }
  });
});

describe('an interior costs nothing to draw', () => {
  it('is one more fill in the SAME bitmap, and not a second sprite over the first', () => {
    /*
      ⚠️ **What this is really holding is the blit count**, and the blit count is held by
      `tests/budget.test.ts` — *the worst-case scene costs one blit per entity, and nothing else*.
      `docs/decisions/0022-frame-rate-is-a-feature.md` and
      `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` count draw calls and allocations
      rather than path segments, so a second fill at bake time is free and a second BITMAP would not
      be. `scripts/probes/0149-a-hull-has-an-interior.mjs` reddens that guard with a boss blitted
      twice, which is what an interior implemented as an overlay sprite would cost.

      What is asserted here is the half budget.test.ts cannot see: that the second fill happens inside
      one `drawKind`, on one path, with no extra stroke.
    */
    for (const kind of BOSS_HULLS) {
      const traced = trace(kind);
      expect(traced.passes.length, `the ${kind} is baked in ${traced.passes.length} fills`).toBe(2);
      expect(traced.strokes, `the ${kind}'s interior is stroked as well as filled, so it has an outline`).toBe(1);
    }
  });

  it('and a kind with no interior is drawn exactly as it was', () => {
    // The forty-four `null`s are not decoration on the table: nothing outside the bosses may grow a
    // second fill without saying so here first.
    for (const kind of SPRITE_KINDS) {
      if (ACCENT_OF[kind] !== null) continue;
      /*
        These return before the fill at the bottom of `drawKind` and paint their own way.

        ⚠️ **`landmark` JOINS THEM BY 0203 AND IS NOT A `sky*` NAME**, which is the whole reason it
        has to be listed rather than caught by the prefix: it is a backdrop by role and not by
        spelling. A prefix test would have let a real hull grow a second fill the moment somebody
        named one `skySomething`, and it would have refused this one for being named honestly.
      */
      // ⚠️ **ALL THREE CASTINGS SINCE 0225**, and they are listed rather than matched on a prefix for
      // the reason above: `landmarkB` is a backdrop by role, and a `startsWith('landmark')` would let a
      // real hull through the day somebody names one after a place.
      if (kind.startsWith('sky') || kind === 'bound') continue;
      if (kind === 'landmark' || kind === 'landmarkB' || kind === 'landmarkC') continue;
      expect(trace(kind).passes.length, `${kind} has no interior in the table but bakes two fills`).toBe(1);
    }
  });

  it('and every sprite kind has said whether it has one', () => {
    // The table is the guard — `docs/decisions/0016-a-hub-enumerates-kinds.md`. A missing row is a
    // type error; this is what says the row set is still the sprite set and not a copy of it.
    expect(Object.keys(ACCENT_OF).sort()).toEqual([...SPRITE_KINDS].sort());
  });
});
