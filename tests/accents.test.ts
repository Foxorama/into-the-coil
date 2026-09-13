import { describe, expect, it, vi } from 'vitest';

import { INK_OF, MOUTH_INK, drawKind } from '../src/render/bake.ts';

/*
  ⚠️ **FILE-LEVEL, BECAUSE THE WORK IS SEVEN PLACES DEEP NOW AND THE DEFAULT IS A WALL CLOCK.** The
  containment claim samples every mark on every body in every place at a pixel a step; alone it took
  under a second and inside `npm run check`, beside sixty other suites, it took eight — and vitest's
  five-second default called that a failure. `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`:
  a guard that reddens under load is reading the clock where it means work. The work is deterministic;
  the clock is not the measurement.

  ⚠️ **60s → 150s, AND THE MEASUREMENT IS BESIDE THE NUMBER BECAUSE 0245 SAYS IT HAS TO BE.** The
  sentence above is stale: *under a second* was one curved hull ago. The claim is O(outline samples ×
  hull edges), and a hull drawn with `curveLoop` flattens to some twelve hundred edges where a polygon
  has thirty — so the serpent (0277) and now the fish (0318) each cost what a dozen polygons cost.

  | | |
  |---|---|
  | alone, before the fish was redrawn | **13.4s** |
  | alone, after | **14.1s** — the redraw is a fifteenth of the cost and not the cause |
  | under `npx vitest run`, whole suite | **47.4s**, which the 60s ceiling survived and `npm run prove` did not |

  **150s is three times the worst measured under load**, per
  `docs/decisions/0245-a-budget-is-sized-under-load.md`. ⚠️ **AND THE NEXT CURVED HULL IS THE ONE TO
  MAKE THE WORK CHEAPER FOR, NOT TO RAISE THIS AGAIN FOR** — six bosses still ride the lifted kit
  undrawn, and each is a third of a minute. A bounding-box reject was tried at `distanceToEdge` and
  measured slower; the win left is fusing its edge walk with `inside`'s, which halves them.
*/
vi.setConfig({ testTimeout: 150_000 });
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { SPRITE_EXTENT, SPRITE_KINDS, type SpriteKind } from '../src/content/sprites.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { THEME_KINDS, type ThemeKind } from '../src/content/themes.ts';
import { viewOf } from '../src/sim/camera.ts';
import { inside, strokeOutside, tracingPen, type Pass, type Point } from './paths.ts';

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
  // The exhaust is a flame with no hull, on the burst's own terms — 0230; leaning both ways, 0241.
  'thrustIdle0',
  'thrustIdle1',
  'thrustBurn0',
  'thrustBurn1',
  'thrustEase',
  'thrustIdle0Climb',
  'thrustIdle0Dive',
  'thrustIdle1Climb',
  'thrustIdle1Dive',
  'thrustBurn0Climb',
  'thrustBurn0Dive',
  'thrustBurn1Climb',
  'thrustBurn1Dive',
  'thrustEaseClimb',
  'thrustEaseDive',
  // The serpent's aura is energy with no hull, on the exhaust's terms — 0305.
  'serpentAura0',
  'serpentAura1',
  'serpentAura2',
  'serpentAura3',
  'serpentAura4',
  'serpentAura5',
  'serpentStorm0',
  'serpentStorm1',
  'serpentStorm2',
  'serpentStorm3',
  'serpentStorm4',
  'serpentStorm5',
  // And the crown's flare, which IS the head's own flame with a discharge over it — 0310.
  'serpentFlare0',
  'serpentFlare1',
  'serpentFlare2',
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
 * The nodes of a boss's body — 0283. Off the rows, on `BOSS_HULLS`'s own terms.
 *
 * ⚠️ **A NODE IS A SLICE OF A HULL AND NOT A HULL**, which is the whole reason this list exists: the
 * outline rule below asks for exactly one stroke on the hull's own path, and a node must have NONE.
 */
const CHAIN_BODIES: readonly SpriteKind[] = BOSS_KINDS.flatMap((kind) => {
  const chain = BOSSES[kind].chain;
  return chain === null ? [] : [SPRITE_KINDS[chain.sprite]!, SPRITE_KINDS[chain.spriteHit]!];
});

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

/**
 * How far a point is from the nearest edge of a pass, in the pass's own pixels. Unsigned.
 *
 * ⚠️ **A BOUNDING-BOX REJECT WAS TRIED HERE AND MEASURED SLOWER** — 0318. *A point is never nearer to
 * a segment than to that segment's own box* is exact and would skip most edges once `best` is small,
 * and it cost a second a run: the four comparisons are not cheaper than the projection they skip, on
 * a hull whose every edge is a fraction of a pixel long. The measurement is the reason this is a
 * comment and not code.
 */
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
  /*
    ⚠️ **A HULL OF ONE SUB-PATH HAS NO HOLES, SO THE GRID BELOW HAS NOTHING TO FIND.** The interior
    sweep exists for `boss3`'s lattice, `boss5`'s ports, `boss7`'s ring and the warden's aperture —
    gaps the sky shows through, which only a grid can catch a mark laid across. A simply-connected
    hull has none, and then Jordan says it: a closed mark whose whole BOUNDARY is inside such a hull
    has its interior inside too. This is an exact short-circuit and not a sampling compromise.

    ⚠️ **IT IS HERE BECAUSE 0277 MADE THIS SUITE TIME OUT.** The serpent went to 56 units with a
    curved outline of some twelve hundred flattened points, and the grid is its bounding box at two
    pixels a step — forty thousand points, each asked twice against that outline. The claim did not
    change; what changed is that it stopped being asked where it cannot fire. 76s → under a second.
  */
  if (hull.subpaths.length === 1) return worst;
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
          /*
            ⚠️ **THE FLASH WASH IS THE WHOLE TILE ON PURPOSE, AND IT IS NOT A MARK — 0287.** It used to
            be a `fillRect` and so was never in `passes` at all; it is a filled path now, because the
            cavity has to be held out of it. What this claim is about is a mark that LEAVES its hull —
            a plume, a halo — running into the next bitmap in the atlas. The wash cannot: `source-atop`
            clips it to the art it is laid over, so its bounding box says where the tile is and
            nothing about where the ink lands.
          */
          if (mark.colour === INK.impact && kind.endsWith('Hit')) return;
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
            const box = boundsOf({ ...mark, subpaths: [subpath] });
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

  it('and a hurt twin is its base’s art under ONE translucent wash of the flash ink', () => {
    /*
      ── 0278, AMENDING 0035 ─────────────────────────────────────────────────────────────────────

      ⚠️ **THIS HELD 0035's RULE — *the hull flat in its flash ink, with nothing painted on it* — AND
      PLAY REFUTED IT.** *"The 'hit' flash needs to be far more translucent instead of pure white —
      with the attack speed of all weapons, essentially you are just fighting a white outline."*

      ⚠️ **0035 WAS RIGHT ABOUT A HIT AND WRONG ABOUT A STEADY STATE.** *"A white ship with every
      panel still on it is a paler ship, not a hit"* holds when a hit is an EVENT. `IMPACT_FLASH_STEPS`
      is four, so any weapon landing more often than every fifteenth of a second holds the twin on
      continuously — and every gun in the game now does. What 0035 was protecting stopped being the
      exception and became the picture, and the art underneath it was never seen.

      ⚠️ **WHAT IS HELD NOW IS STRICTLY MORE, AND MOSTLY BY CONSTRUCTION.** `drawKind` draws a twin by
      drawing its BASE and laying the flash ink over exactly those pixels with `source-atop`, so *the
      same silhouette* and *the same marks* are no longer claims a guard has to compare hand-drawn
      shapes for — they are identities. What is left to hold is the part that can still go wrong: that
      there is exactly ONE wash, and that it is translucent. An opaque one is 0035's cutout again.

      ⚠️ **AND THE WASH IS A FILLED PATH RATHER THAN A `fillRect` SINCE 0287**, which moved it from
      `rects` to `passes` — so a twin draws its base's marks plus one. It is the LAST pass by
      construction (nothing is drawn after it) and that is how it is found here; everything the twin
      shares with its base is still identity rather than comparison.
    */
    for (const theme of THEME_KINDS) {
      for (const kind of BODIES) {
        if (!kind.endsWith('Hit')) continue;
        const base = kind.slice(0, -3) as SpriteKind;
        const twin = trace(kind, theme);
        const plain = trace(base, theme);
        expect(
          twin.passes.length,
          `${kind} at ${theme} draws ${twin.passes.length} marks where ${base} draws ${plain.passes.length} plus a ` +
            'wash, so a flash is a different picture',
        ).toBe(plain.passes.length + 1);
        expect(
          JSON.stringify(twin.passes[0]!.subpaths),
          `${kind} is a different shape from ${base}, so a flash changes the silhouette`,
        ).toBe(JSON.stringify(plain.passes[0]!.subpaths));
        expect(
          twin.rects.length,
          `${kind} lays ${twin.rects.length - plain.rects.length} rectangles its base does not, and since 0287 a ` +
            'flash is not one of them',
        ).toBe(plain.rects.length);
        const wash = twin.passes[twin.passes.length - 1]!;
        expect(
          wash.colour,
          `${kind}'s last mark is not the flash ink, so either the wash is not last or there is no wash`,
        ).toBe(INK.impact);
        expect(
          wash.alpha,
          `${kind}'s flash is laid at ${wash.alpha}, and at that it is 0035's cutout again — the animal under it is gone`,
        ).toBeLessThan(0.75);
        expect(wash.alpha, `${kind}'s flash is too faint at ${wash.alpha} to read as a hit`).toBeGreaterThan(0.3);
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

  it('0264 — THE HEADS: the hydra’s hull reaches forward in five places, and the serpent’s skull is wider than its neck', () => {
    /*
      *"The hydra shows no heads."* The report is about the SILHOUETTE — five necks were five
      notches in a front edge — so this is held over the hull pass and not the paint: five separate
      reaches into the front fifth of the box, each a head's width, is what a hydra's outline is.
      In the player's units: at the shipped camera the front fifth is more than a ship's width.
    */
    const hydra = SPRITE_KINDS[BOSSES.hydra.sprite]!;
    const hull = traceAt(hydra, COMMON).passes[0]!.subpaths[0]!;
    const half = COMMON / 2;
    const r = COMMON * 0.42;
    // Walk the outline: every run of consecutive vertices in the front fifth is one reach into it.
    const inFront = hull.map(([x]) => x < half - r * 0.8);
    let reaches = 0;
    for (let i = 0; i < inFront.length; i++) if (inFront[i] && !inFront[(i + inFront.length - 1) % inFront.length]) reaches++;
    expect(reaches, 'the hydra’s hull does not reach forward in five places').toBe(5);

    const serpent = SPRITE_KINDS[BOSSES.jormungandr.sprite]!;
    const body = traceAt(serpent, COMMON).passes[0]!.subpaths[0]!;
    /*
      ── THE SKULL IS LONGER THAN IT IS TALL — 0276, REPLACING A SPAN ─────────────────────────────

      ⚠️ **THIS HELD `skullSpan > 0.6` AND THE PROXY WAS RETIRED AFTER IT WAS INVALIDATED TWICE BY
      GOOD ART IN ONE SESSION.** A span in a fixed window only means *wider than its neck* while the
      neck is the gauge it was sized against and the window still contains the neck. Making the body
      serpentine moved the first (0.44 of `r` → 0.29); making the head elongated moved the second, and
      then made the claim FALSE — a real snake's head is about its neck's width, and the reference's
      is narrower. A guard re-tuned twice in a day is not being maintained, it is measuring the wrong
      quantity: `docs/decisions/0027-measure-the-picture-not-the-model.md`, and
      `docs/decisions/0192-a-guard-holds-an-invariant.md` on changing one and saying why.

      ⚠️ **WHAT IS HELD INSTEAD IS THE DEFECT THAT WAS ACTUALLY REPORTED, TWICE.** *"The head needs to
      be a bit more elongated and less blobby."* A head taller than it is long is a frog, and no paint
      on it reads as a snake — where a head merely narrower than its neck reads fine. The window is a
      share of the animal's OWN length, so it travels when the body is re-authored instead of silently
      pointing at the neck.

      ⚠️ **AND THE TENTACLE 0264 WAS NAMED FOR IS STILL HELD, BY THE GUARD THAT ALWAYS HELD IT**:
      `THE LORD: every place skins its real boss in a skin of its own` in `tests/foes.test.ts`. The
      grey tentacle was a skin fault and a face fault; the skin is guarded there, and the face is the
      maw, the fangs and the eye, which `0227` holds to the hull like every other mark.
    */
    /*
      ⚠️ **AND SINCE 0283 THE HULL IS THE SKULL, SO IT IS MEASURED WHOLE RATHER THAN SLICED.** The
      window above took the front fifteen per cent of the animal because the animal was the sprite;
      the body is a chain now and this bitmap is the head alone, so *the front fifteen per cent* is
      the tip of the snout and reported the drawing as a blob at 0.31 while it was nothing of the
      kind. What the claim was always about is the whole skull's proportion, and it can simply be
      asked for.
    */
    const headLong = Math.max(...body.map(([x]) => x)) - Math.min(...body.map(([x]) => x));
    const headTall = Math.max(...body.map(([, y]) => y)) - Math.min(...body.map(([, y]) => y));
    expect(
      headLong / headTall,
      `the serpent’s skull is ${headLong.toFixed(3)} long and ${headTall.toFixed(3)} tall, so it is a blob`,
    ).toBeGreaterThan(1);
    /*
      ⚠️ **AND *WIDER THAN ITS NECK* IS A REAL COMPARISON NOW RATHER THAN A PROXY — 0283.** It used to
      be a span measured in a window and was retired for being re-tuned twice in a day by good art;
      the neck is a number on the row now — the first entry of the chain's `girth` — so the two can be
      put side by side in world units. **The head-neck step is the single mark that says *snake*
      before any paint is on the animal**, and a serpent whose head is no wider than the body behind
      it is a worm however it is drawn.
    */
    const neck = BOSSES.jormungandr.chain?.girth[0] ?? 0;
    const skullTall = (headTall / COMMON) * SPRITE_EXTENT[serpent];
    expect(
      skullTall / neck,
      `the serpent’s skull is ${skullTall.toFixed(1)} units tall against a neck of ${neck} — a head no wider than ` +
        'the body behind it is a worm, whatever is painted on it',
    ).toBeGreaterThan(1.2);

    /*
      ⚠️ **AND THE BEND RULE MOVED TO THE ANIMAL — 0283.** *No bend tighter than the animal's own
      spine allows* was measured here, on a baked spine, because the whole serpent was one bitmap. The
      body is a chain now and the spine is laid out every step, so the rule is measured on the animal
      that is actually on the screen: `tests/serpent.test.ts`, driven, in world units.
    */

    /*
      ⚠️ **AND THE HURTBOX IS THE HEAD THAT IS DRAWN — 0288.** `radius` is a disc and the skull is not,
      so the two can never be equal; what they may not be is a different SIZE. A radius left where it
      was under a head redrawn larger is a head with edges the player shoots through, and one left
      under a head redrawn smaller is a head that eats shots off its own nose — which is
      `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` in both directions,
      and that decision's own finding is that this class gets REPORTED as a collision bug that does not
      exist.

      ⚠️ **THE BOUND IS THE SKULL'S OWN TWO AXES, so it travels when the art does** and nobody has to
      remember to move it. Both ends are numbers the picture supplies rather than ones anybody tuned.

      ⚠️ **AND *COVERS THE SHORT AXIS* IS NOT ENOUGH ON ITS OWN, WHICH THE PROBE FOUND.** The head is
      drawn about 20 units long and 13 tall; the disc it had before this decision was 14 across, which
      clears the height and leaves three units of snout and three of skull outside the thing the
      animal collides as. A disc can never match a head — what it may not do is stop three quarters of
      the way along one.
    */
    const hurt = BOSSES.jormungandr.radius * 2;
    const drawnTall = (headTall / COMMON) * SPRITE_EXTENT[serpent];
    const drawnLong = (headLong / COMMON) * SPRITE_EXTENT[serpent];
    expect(
      hurt,
      `the serpent's hurtbox is ${hurt.toFixed(1)} units across against a skull drawn ${drawnTall.toFixed(1)} tall, ` +
        'so the head has edges a shot passes through',
    ).toBeGreaterThanOrEqual(drawnTall);
    expect(
      hurt / drawnLong,
      `the serpent's hurtbox is ${hurt.toFixed(1)} units across against a skull drawn ${drawnLong.toFixed(1)} long, ` +
        `so it reaches ${((hurt / drawnLong) * 100).toFixed(0)}% of the way along the head and the rest of the ` +
        'animal is drawn where nothing can be hit',
    ).toBeGreaterThanOrEqual(0.75);
    expect(
      hurt,
      `the serpent's hurtbox is ${hurt.toFixed(1)} units across against a skull drawn ${drawnLong.toFixed(1)} long, ` +
        'so the head takes hits off its own nose',
    ).toBeLessThanOrEqual(drawnLong);
  });

  it('0287 — THE REPORTED ONE: the hit wash is held out of the mouth, and out of the SAME mouth the head paints', () => {
    /*
      ⚠️ **REPORTED FROM PLAY:** *"the hitbox flash for the mouth doesn't look right, it's a slightly
      off white triangle inside the mouth and it looks pretty weird."*

      ⚠️ **THE GAPE IS A NOTCH RATHER THAN A HOLE (0284), SO THE MOUTH IS PAINT.** 0278's wash is
      `source-atop` over everything the art covered, and the dark red filling the gape is covered
      pixels like anything else — washed, it lands within a hair of the flesh around it and the cavity
      flattens into a pale wedge. So the wash is a tile with the cavity taken out of it.

      ⚠️ **AND *THE SAME* CAVITY IS HALF THE CLAIM.** A second wedge authored beside the first would
      look right on the resting face and drift the moment a jaw angle moved — which is exactly what
      the FANGS did across three frames before 0285 made them one description. What is measured is
      that the hole in the wash is the mouth the head actually paints, point for point.
    */
    const twins = [
      ['boss8', 'boss8Hit'],
      ['boss8Gape', 'boss8GapeHit'],
      ['boss8Shut', 'boss8ShutHit'],
    ] as const;
    /** A path rounded to a hundredth of a pixel, so two ways of arriving at one shape compare equal. */
    const shape = (points: readonly Point[]): string =>
      points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
    for (const theme of THEME_KINDS) {
      for (const [base, twin] of twins) {
        const mouth = trace(base, theme).passes.find((p) => p.colour === MOUTH_INK);
        expect(mouth, `the ${base} paints no mouth interior, so this guard is measuring nothing`).toBeDefined();
        const passes = trace(twin, theme).passes;
        const wash = passes[passes.length - 1]!;
        /*
          ⚠️ **THE TILE AND THE CAVITY, IN THAT ORDER.** One `evenodd` fill of two sub-paths is what
          keeps this a single composite over a single bitmap — 0278's argument for `source-atop` is
          that a flash costs no second draw call, and a guard that let this become two fills would
          have given that away without anybody noticing.
        */
        expect(
          wash.subpaths.length,
          `the ${twin}'s flash wash is one solid shape, so it is laid over the open mouth and the cavity reads as a ` +
            'pale triangle — the defect this guard is named for',
        ).toBe(2);
        expect(
          shape(wash.subpaths[1]!),
          `the ${twin}'s wash is held out of a different shape from the mouth the ${base} paints, so the two will ` +
            'drift the first time a jaw angle moves',
        ).toBe(shape(mouth!.subpaths[0]!));
      }
    }
  });

  it('0285 — THE JAW: the snap and the strike throw it opposite ways from rest, by a distance the player can see', () => {
    /*
      ⚠️ **THE TELL AND THE SNAP MUST NOT LOOK ALIKE, AND *ALIKE* IS A CLAIM ABOUT PIXELS.** The head
      wears three mouths: `boss8Shut` when the ship crosses in front of it, `boss8` between times, and
      `boss8Gape` in the steps before a volley leaves. A gape that does not mean *a volley is coming*
      is a lie the fight tells once, so a snap that reads as a gape breaks the fight and not the art.

      ⚠️ **MEASURED AS THE AREA THE OUTLINE ENCLOSES, ON A 1280×720 SCREEN.** The gape is a NOTCH in
      the silhouette rather than a hole in it (0284), so how far the mouth is open IS how much of the
      skull's own box the outline gives back — swinging the jaw up fills the wedge in and swinging it
      down cuts more of it away. The obvious measurement, the chin's height, does not survive: the
      lowest point of this hull is the throat behind the hinge, which barely swings, and the two upper
      fangs hang below the bite line, so every window and every extreme picks the wrong vertex on at
      least one of the three frames. Comparing the three jaw ANGLES instead would compare the constant
      with itself — what the hinge does to the silhouette is exactly the question.
    */
    const face = BOSSES.jormungandr.face;
    if (face === null) throw new Error('the serpent has no faces');
    /**
     * The area a face's outline encloses, in CSS pixels² of that screen — shoelace over the hull.
     *
     * ⚠️ **A WIDER MOUTH IS A SMALLER NUMBER, WHICH IS THE RIGHT WAY ROUND AND NOT THE OBVIOUS ONE.**
     * The gape is the part of the box the outline gives BACK, so the flesh is what is left: swinging
     * the jaw down cuts more of the skull away and swinging it up hands some back. Written the other
     * way first, and the guard reported the snap opening the mouth by −2.9%.
     */
    const fleshOf = (index: number): number => {
      const hull = trace(SPRITE_KINDS[index]!).passes[0]!.subpaths[0]!;
      let twice = 0;
      for (let i = 0; i < hull.length; i++) {
        const [ax, ay] = hull[i]!;
        const [bx, by] = hull[(i + 1) % hull.length]!;
        twice += ax * by - bx * ay;
      }
      return Math.abs(twice) / 2;
    };
    const shut = fleshOf(face.shut);
    const rest = fleshOf(face.rest);
    const gape = fleshOf(face.gape);
    /*
      ⚠️ **AND THE ORDER IS THE INVARIANT, WHICH IS WHY IT IS THE ONLY THING HERE THAT FAILS.** Both
      being *different from rest* would be satisfied by two frames that opened by different amounts,
      which is the fight this guard exists to stop — and no redrawing of the skull makes a snap that
      opens the mouth correct. How FAR each throw moves is an opinion a lower hinge would change, so
      it is registered above and printed instead of failing: `tests/authored.ts`, `0285-throw`.
    */
    expect(
      gape < rest && rest < shut,
      `the serpent's outline encloses ${shut.toFixed(0)}px² shut, ${rest.toFixed(0)}px² at rest and ` +
        `${gape.toFixed(0)}px² agape, so the snap and the strike are not opposite throws of the same jaw and the ` +
        'tell is not a tell',
    ).toBe(true);
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
    /*
      ── ONE OUTLINE, AND EVERY OTHER STROKE IS PAINT — 0276 ──────────────────────────────────────

      ⚠️ **THIS WAS `strokes === 1`, AND THAT COUNT WAS NEVER THE INVARIANT.** The claim in the
      paragraph above is *one outline, however many fills go over it* — and it says fills only because
      `tests/paths.ts` could not see the geometry of a stroke, so a stroke was banned rather than
      held. `docs/decisions/0264-the-real-bosses-are-drawn.md` then rejected the predecessor's
      stacked-stroke spine on that basis, which is
      `docs/decisions/0192-a-guard-holds-an-invariant.md` read backwards: the drawing technique was
      picked by what the harness could measure. `reports/the-vocabulary-is-the-ceiling-2026-09-08.md`
      is the measurement, and 0276 lifts it.

      ⚠️ **WHAT IS HELD NOW IS STRICTLY MORE.** Exactly one stroke is the OUTLINE — the one laid on
      the hull's own path, which is what `seal` does and what makes a body read as one object — and
      every other stroke is paint, held to the same silhouette and the same alpha rule every fill
      has answered since 0227. A second outline still fails; a contour, a rim light or a scale no
      longer does.
    */
    /*
      ⚠️ **THE POINTS AND NOT THE COUNTS, WHICH IS WHAT THIS ALWAYS MEANT TO SAY — 0283.** *The one
      laid on the hull's own path* was tested by comparing how many sub-paths there were and how many
      points each held, and that is a shape's fingerprint only while every hull is a polygon nothing
      else in the drawing resembles. The serpent's body is a DISC: `tests/paths.ts` flattens its arc
      to five points, so four five-point scale arcs painted on it matched the hull by arithmetic and
      the guard reported the node *outlined five times* over a drawing with exactly one outline on it.

      ⚠️ **STRICTLY STRONGER, NOT LOOSER.** Every stroke this used to catch it still catches — a
      second outline is the same path and so still matches point for point — and it no longer catches
      a mark that merely has the same number of corners.
    */
    const same = (a: readonly (readonly Point[])[], b: readonly (readonly Point[])[]): boolean =>
      a.length === b.length &&
      a.every((s, i) => s.length === b[i]!.length && s.every(([x, y], j) => Math.abs(x - b[i]![j]![0]) < 1e-9 && Math.abs(y - b[i]![j]![1]) < 1e-9));
    /*
      ⚠️ **AND A CHAIN'S NODE MUST HAVE NONE, WHICH IS THE ONE EXCEPTION AND IS STRICTER RATHER THAN
      LOOSER — 0283.** *One outline round the hull* is what makes a body read as one object, and a
      node is not one: it is a slice of an animal, overlapped by the slices either side of it, so its
      own rim is drawn over its neighbour's flesh. Photographed at the shipped camera with `seal` on
      it, the serpent came back as a stack of croissants with a dark arc ruled across it eleven times.

      ⚠️ **THE CLAIM IS THEREFORE `0` AND NOT `≤ 1`.** An exemption that merely permitted the outline
      would let the defect back in silently; what is asserted is that a node does not have one.
    */
    for (const kind of BODIES) {
      const traced = trace(kind);
      const hull = traced.passes[0]!;
      const outlines = traced.inks.filter((ink) => same(ink.subpaths, hull.subpaths));
      if (CHAIN_BODIES.includes(kind)) {
        expect(
          outlines.length,
          `the ${kind} is outlined ${outlines.length} times, and a node of a body may not be outlined at all — ` +
            'its rim is drawn over the flesh of the node beside it, which is a scallop ruled across the animal',
        ).toBe(0);
        continue;
      }
      expect(outlines.length, `the ${kind} is outlined ${outlines.length} times`).toBe(1);
      expect(traced.inks[0], `the ${kind} paints a stroke before it is sealed`).toBe(outlines[0]);
      for (const [i, ink] of traced.inks.entries()) {
        if (i === 0 || ink.alpha < SOLID) continue;
        const over = strokeOutside(hull, ink);
        expect(
          over,
          `stroke ${i} on the ${kind} reaches ${over.toFixed(2)}px past its hull — a mark painted ` +
            'with a stroke is held to the silhouette exactly as a mark painted with a fill is',
        ).toBe(0);
      }
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
