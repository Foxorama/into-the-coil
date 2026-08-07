/**
 * The frame budget, counted rather than timed.
 *
 * `docs/decisions/0022-frame-rate-is-a-feature.md` promised this guard would land in the same commit
 * as the rAF loop, proved against a deliberately over-populated scene.
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md` is what it turned into.
 *
 * ── WHY NOTHING HERE IS A STOPWATCH ─────────────────────────────────────────────────────────────
 *
 * A millisecond assertion in CI is calibrated against nothing. The runner is not a 2021 mid-range
 * Android, runner hardware varies between jobs, and the result fails on a busy afternoon and passes
 * on a broken commit. So the assertions are on **draw calls** and on **allocation**, both of which
 * are deterministic and neither of which is a proxy: a blit is the cost, not a stand-in for it.
 *
 * ── THE TWO HALVES, AND WHY NEITHER IS ENOUGH ALONE ─────────────────────────────────────────────
 *
 * The RUNTIME half runs the real painter over the worst-case scene and counts what it did. It cannot
 * see an allocation — a `.map()` in a hot loop produces exactly the right pixels.
 *
 * The SOURCE half scans the hot files for the syntax that allocates. It cannot see a loop that draws
 * twice. Together they cover both; either alone reads as thorough and is half a guard.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { advance, makeClock } from '../src/app/loop.ts';
import { ACROSS_SPAN, viewOf } from '../src/sim/camera.ts';
import { type Entity, makeEntity, reset, stepEntities } from '../src/sim/entity.ts';
import { Pool } from '../src/sim/pool.ts';
import { paintScene } from '../src/render/scene.ts';
import { bakeSize } from '../src/render/bake.ts';
import type { Surface } from '../src/render/surface.ts';
import { sprite } from './bodies.ts';
import { CAPACITY } from '../src/app/mount.ts';
import { MAX_SHIELDS } from '../src/content/ships.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

/**
 * The worst-case scene, as data rather than as a feeling — 0022's number.
 * ~150 enemy bullets, ~80 player projectiles, ~40 enemies, ~200 particles.
 */
const WORST_CASE = 500;

/** Long enough that anything accumulating per frame has visibly accumulated. Ten seconds of play. */
const FRAMES = 600;

/** A `Surface` that draws nothing and counts everything. The instrument, not a stand-in for one. */
class CountingSurface implements Surface {
  blits = 0;
  clears = 0;
  clear(): void {
    this.clears++;
  }
  blit(_sprite: number, x: number, y: number, _scale: number): void {
    this.blits++;
    // A NaN reaching a real canvas silently draws nothing, so the counting surface refuses it here
    // rather than letting a blank frame pass as a full one.
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`blit at a non-finite point: ${x}, ${y}`);
  }
}

/**
 * A `Surface` that records the leftmost and rightmost edge anything was drawn at.
 *
 * ⚠️ **Edges rather than centres**, because a tile is drawn centred and what matters is whether the
 * COVERAGE reaches the edge of the view. A guard on centres would pass with the screen half bare.
 */
class SpanSurface implements Surface {
  left = Number.POSITIVE_INFINITY;
  right = Number.NEGATIVE_INFINITY;
  clear(): void {}
  blit(sprite: number, x: number, _y: number, scale: number): void {
    const half = (SPRITE_EXTENT[SPRITE_KINDS[sprite]!] * scale) / 2;
    if (x - half < this.left) this.left = x - half;
    if (x + half > this.right) this.right = x + half;
  }
}

function fullPool(): Pool<Entity> {
  const pool = new Pool<Entity>(WORST_CASE, makeEntity);
  for (let i = 0; i < WORST_CASE; i++) {
    const e = pool.spawn()!;
    reset(e, 1000 + i, (i * 7) % ACROSS_SPAN, sprite(i % 16));
    e.velAlong = -0.5;
  }
  return pool;
}

describe('the worst-case scene costs one blit per entity, and nothing else', () => {
  it('draws exactly one call per live entity, plus one clear', () => {
    const surface = new CountingSurface();
    const pool = fullPool();
    paintScene(surface, viewOf(1920, 1080), [pool], 900, 0.5);
    expect(surface.blits, 'the painter is doing more work per entity than a blit').toBe(WORST_CASE);
    expect(surface.clears).toBe(1);
  });

  it('costs the same per frame after ten seconds as it did on the first frame', () => {
    // The shape this catches: work that accumulates. A per-frame subscription, a growing list, a
    // painter that redraws its own history — all of them look correct on frame one.
    const surface = new CountingSurface();
    const view = viewOf(1920, 1080);
    const pool = fullPool();
    let previous = 0;
    for (let frame = 0; frame < FRAMES; frame++) {
      surface.blits = 0;
      paintScene(surface, view, [pool], 900, (frame % 60) / 60);
      if (frame > 0) expect(surface.blits, `frame ${frame} drew a different amount`).toBe(previous);
      previous = surface.blits;
    }
  });

  it('costs the same split across layers as it does in one pool', () => {
    /*
      The scene is drawn as several pools now, in a declared order (`src/app/frame.ts`). The cost
      must be a property of how many entities exist and not of how they are filed — a painter that
      cleared per layer, or blitted a layer twice, would look completely correct on screen.

      ⚠️ It also pins the CLEAR at one. Four layers is four chances to wipe the frame, and the three
      extra wipes would be invisible in a screenshot and would quadruple the most expensive single
      call the painter makes.
    */
    const one = new CountingSurface();
    const many = new CountingSurface();
    const view = viewOf(1920, 1080);
    paintScene(one, view, [fullPool()], 900, 0.5);

    const quarters: Pool<Entity>[] = [];
    for (let q = 0; q < 4; q++) {
      const pool = new Pool<Entity>(WORST_CASE / 4, makeEntity);
      for (let i = 0; i < WORST_CASE / 4; i++) {
        const e = pool.spawn()!;
        reset(e, 1000 + i, (i * 7) % ACROSS_SPAN, sprite(i % 16));
      }
      quarters.push(pool);
    }
    paintScene(many, view, quarters, 900, 0.5);

    expect(many.blits, 'splitting the scene into layers changed what it costs to draw').toBe(one.blits);
    expect(many.clears, 'each layer wiped the frame — the painter clears once, not once per pool').toBe(1);
  });

  it('holds in portrait too, at the same cost', () => {
    // Two orientations, one scene, one price — the difficulty parity of 0023 seen from the frame side.
    const pool = fullPool();
    const flat = new CountingSurface();
    const upright = new CountingSurface();
    paintScene(flat, viewOf(2400, 1080), [pool], 900, 0.25);
    paintScene(upright, viewOf(1080, 2400), [pool], 900, 0.25);
    expect(upright.blits).toBe(flat.blits);
  });
});

/**
 * THE SKY IS BAKED AND BLITTED, AND IT COSTS A FIXED HANDFUL OF CALLS.
 *
 * `docs/decisions/0065-the-sky-is-baked-and-blitted.md`. Asked for in play: *"needs a starry
 * background or a background of some kind."*
 *
 * ⚠️ **The two things a background can do to a frame budget are grow with the camera and grow with
 * the screen**, and both are invisible on the machine it was written on: a wrapping tile drawn one
 * too many times on some frames costs a blit nobody notices, and a per-star draw costs nothing at
 * 1280×720 and everything on a phone with a full screen. Both are counted here.
 */
describe('the sky costs a fixed number of calls, whatever the camera is doing', () => {
  /** The real sky, built the way `src/app/mount.ts` builds it rather than restated. */
  const SKY = [
    { sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.12 },
    { sprite: SPRITE.skyNear, extent: SPRITE_EXTENT.skyNear, depth: 0.3 },
  ];

  it('draws the same number of tiles on every frame of a whole level', () => {
    /*
      ⚠️ **THE ONE THAT MATTERS, and it is a modulo bug that nothing else could see.** A tiling offset
      taken with `%` alone, or a count that rounds rather than ceils, draws an extra tile on some
      cameras and one too few on others — the cost wobbles and, worse, a seam of empty space crosses
      the screen once per tile. Ten thousand units of camera is more than a level.
    */
    const view = viewOf(1920, 1080);
    const counts = new Set<number>();
    for (let camera = 0; camera < 10_000; camera += 37) {
      const surface = new CountingSurface();
      paintScene(surface, view, [], camera, 0.5, SKY);
      counts.add(surface.blits);
    }
    expect([...counts], `the sky's cost varies with the camera: ${[...counts].join(', ')}`).toHaveLength(1);
  });

  it('and the same number on every device the clamp allows', () => {
    // A tile is `ACROSS_SPAN` units and the view is 150 to 240 (0023), so the count varies by one at
    // most between the narrowest and the widest. What must not vary is the ORDER of it.
    for (const view of [viewOf(1500, 1000), viewOf(2400, 1000), viewOf(1000, 1500)]) {
      const surface = new CountingSurface();
      paintScene(surface, view, [], 4321, 0.5, SKY);
      expect(surface.blits, `a ${view.alongSpan}-unit view drew ${surface.blits} sky tiles`).toBeLessThanOrEqual(
        SKY.length * 5,
      );
      expect(surface.blits, 'the sky drew nothing at all').toBeGreaterThan(0);
    }
  });

  it('covers the whole view, so no seam of empty space ever crosses the screen', () => {
    /*
      ⚠️ **In world units against the view, which is what the player would see go past.** The count
      has to be *span ÷ tile* rounded UP, plus one for the tile straddling the trailing edge. Both
      halves are one character and both are invisible at a glance: `round` for `ceil` is short by a
      whole tile on the widest device only, and dropping the `+ 1` is short at every camera that is
      not exactly on a tile boundary.

      ⚠️ **Every view the clamp allows**, which is where the `ceil` half lives: at 16:9 the span is
      1.78 tiles and rounding up and to-nearest agree, so a test on one device proves nothing.
    */
    /*
      ⚠️ **ONE LAYER AT A TIME, and measuring both at once hid the bug this exists for.** The layers
      move at different rates, so at any given camera one is nearly aligned with a tile boundary and
      the other is not — and a `SpanSurface` fed both records the widest pair of edges, which is the
      LUCKIER layer's coverage. The first version of this test passed with a layer visibly a tile
      short. A guard that aggregates the thing it is comparing is not a guard.
    */
    for (const view of [viewOf(1500, 1000), viewOf(1920, 1080), viewOf(2400, 1000)]) {
      for (const camera of [0, 13, 49.5, 99.9, 100, 100.1, 1234.5]) {
        for (const layer of SKY) {
          const surface = new SpanSurface();
          paintScene(surface, view, [], camera, 0.5, [layer]);
          // The tiles have to reach from at or before the trailing edge to at or past the far one.
          // `SpanSurface` records the extremes in CSS pixels.
          const where = `a ${view.alongSpan}-unit view at camera ${camera}, depth ${layer.depth}`;
          expect(surface.left, `${where}: the sky starts ${surface.left.toFixed(0)}px in`).toBeLessThanOrEqual(
            view.gutterAlong + 0.001,
          );
          expect(surface.right, `${where}: the sky stops short`).toBeGreaterThanOrEqual(
            view.gutterAlong + view.alongSpan * view.scale - 0.001,
          );
        }
      }
    }
  });

  it('is not entities, so it costs the pools nothing', () => {
    // The rule this decision is really about: `CAPACITY` totals 0022's worst case exactly, so a
    // starfield of bodies would have come out of the pools that hold bullets.
    const before = Object.values(CAPACITY).reduce((sum, n) => sum + n, 0);
    expect(before, 'the sky took slots from the entity budget').toBeLessThanOrEqual(WORST_CASE);
  });

  it('and the bake ceiling is a RESOLUTION, so the biggest bitmap is not the blurriest', () => {
    /*
      ⚠️ **The ceiling was a flat pixel count and it always meant this.** 256px is a 26-unit boss at
      ten pixels per unit — so the number was a resolution wearing a size's clothes, and it only
      looked like a size while nothing was bigger than a boss. A sky tile is four times that: under a
      flat cap it bakes at a quarter of the detail and blits at three times its own resolution, and
      the picture is wrong on the biggest thing on the screen and nowhere else.

      Stated as the property rather than as the number: at a resolution high enough that everything is
      capped, every kind is capped at the SAME pixels per world unit.
    */
    const far = 10_000;
    const resolutions = SPRITE_KINDS.map((kind) => bakeSize(SPRITE_EXTENT[kind], far) / SPRITE_EXTENT[kind]);
    for (const ppu of resolutions) {
      expect(ppu, `the cap gives ${ppu} pixels per unit where another kind gets ${resolutions[0]}`).toBeCloseTo(
        resolutions[0]!,
        6,
      );
    }
    // And it is a ceiling rather than a floor: below it, the ask is honoured.
    expect(bakeSize(10, 4), 'a modest resolution was rounded up to the ceiling').toBe(40);
  });
});

describe('the pools are the worst-case scene, and they add up to it', () => {
  it('never asks the frame to draw more entities than the budget was measured for', () => {
    /*
      ⚠️ **NOTHING HELD THIS UNTIL A POOL WAS ADDED TO THE GAME.** `src/app/mount.ts` said *"the total
      is now EXACTLY 500"* in a comment, and 0022's worst case is the number every assertion in this
      file is written against — so the two agreed only for as long as somebody did the arithmetic in
      their head. The next pool would have been added the same way, and `docs/state-of-play.md` has
      three of them queued: missiles, shield orbs and a bomb's blast.

      ⚠️ **A ceiling, not an equality.** Spending the budget exactly is not a virtue; what 0022 fixes
      is the most the frame may ever be asked to draw, on a 2021 mid-range Android that this runner is
      not. A pool added by taking slots from another passes; a pool added by arithmetic in somebody's
      head does not.
    */
    const total = Object.values(CAPACITY).reduce((sum, n) => sum + n, 0);
    expect(
      total,
      `the pools total ${total} entities against 0022's worst case of ${WORST_CASE}. A new pool comes ` +
        'out of an existing share — the particle share is the one 0022 names as sheddable — or the ' +
        'decision is reopened, and that conversation is WebGL rather than the phone.',
    ).toBeLessThanOrEqual(WORST_CASE);
  });

  it('gives the shell exactly as many slots as the ship has shields', () => {
    // The one pool whose size is a rule rather than a budget: a mark per shield, and the pickup
    // refuses a fourth — `src/content/ships.ts`. A pool one short would drop a mark the player owns.
    expect(CAPACITY.shieldOrbs, 'the shell cannot draw everything the ship can carry').toBe(MAX_SHIELDS);
  });
});

describe('the pool is the ceiling, and it is never exceeded', () => {
  it('never hands out more than its capacity, and never grows', () => {
    const pool = new Pool<Entity>(WORST_CASE, makeEntity);
    for (let i = 0; i < WORST_CASE; i++) expect(pool.spawn()).not.toBe(null);
    expect(pool.spawn(), 'a full pool grew instead of refusing').toBe(null);
    expect(pool.capacity).toBe(WORST_CASE);
    expect(pool.size).toBe(WORST_CASE);
  });

  it('constructs every entity once, and never again however long it runs', () => {
    // THE allocation assertion the runtime half can actually make. `make` is the only place an
    // entity object can come from, so counting its calls counts entity allocation exactly.
    let built = 0;
    const pool = new Pool<Entity>(WORST_CASE, () => {
      built++;
      return makeEntity();
    });
    expect(built).toBe(WORST_CASE);

    const surface = new CountingSurface();
    const view = viewOf(1920, 1080);
    const clock = makeClock();
    let camera = 0;
    for (let frame = 0; frame < FRAMES; frame++) {
      // Refill whatever the cull retired, which is the churn a real wave produces.
      for (let e = pool.spawn(); e !== null; e = pool.spawn()) {
        reset(e, camera + 200 + pool.size, (pool.size * 7) % ACROSS_SPAN, sprite(pool.size % 16));
        e.velAlong = -0.5;
      }
      advance(clock, 16.7);
      for (let s = 0; s < clock.steps; s++) {
        camera += 0.6;
        stepEntities(pool, camera);
      }
      paintScene(surface, view, [pool], camera, clock.alpha);
    }
    expect(built, 'entities were constructed during play — the pool is not a pool').toBe(WORST_CASE);
    expect(pool.capacity).toBe(WORST_CASE);
  });
});

// ── THE SOURCE HALF ──────────────────────────────────────────────────────────────────────────────

/**
 * The files that run every frame. Closed, and short on purpose: the value of the list is that adding
 * to it is a deliberate act, and that anything NOT on it is free to be written normally.
 */
const HOT_FILES = [
  'src/app/loop.ts',
  'src/app/frame.ts',
  'src/sim/pool.ts',
  'src/sim/entity.ts',
  // ⚠️ Added with the combat slice, and adding it is the deliberate act 0025 says this list exists
  // to require. Collision runs once per step over every pairing — the densest loop in the game, and
  // the one place where an innocent `.filter()` over "the live ones" would allocate hardest exactly
  // when the screen is fullest.
  'src/sim/collide.ts',
  'src/render/scene.ts',
  'src/render/surface.ts',
  'src/render/canvas.ts',
];

/**
 * Files that look like they belong above and deliberately do not, each with the reason.
 *
 * ⚠️ This list is why the split between `mount.ts` and `frame.ts` exists at all. Setup code
 * allocates — it creates canvases, bakes bitmaps, builds pools — and a scan that covered it would be
 * marked `@setup` line by line until the markers meant nothing. Separating the two files is what
 * lets the scan stay strict over the half that runs sixty times a second.
 */
const DELIBERATELY_COLD: Record<string, string> = {
  'src/app/mount.ts': 'boot and resize: creates the canvas, builds the pool, seeds the field. Never called from a frame.',
  'src/render/bake.ts': 'draws every sprite once at load. Allocating is what it is FOR; blitting afterwards is the point.',
};

interface AllocationRow {
  what: string;
  pattern: RegExp;
  /** A line that MUST match, so a typo'd pattern fails here rather than passing forever. */
  sample: string;
  /** A line it must leave alone, so the ban is precise rather than merely loud. */
  innocent: string;
}

/**
 * The syntax that allocates. Not a complete list of ways to make garbage — a complete list is not
 * reachable with a regex — but the ways it actually happens in a render loop, each of which is
 * invisible in review because every one of them is an ordinary line of TypeScript.
 */
const ALLOCATIONS: AllocationRow[] = [
  {
    what: 'constructing an object',
    pattern: /\bnew\s+[A-Z]/,
    sample: 'const p = new Point(x, y);',
    innocent: 'const next = index + 1;',
  },
  {
    what: 'an array method that builds a new array or a closure per call',
    pattern: /\.\s*(map|filter|slice|concat|flatMap|reduce|forEach|sort|join|split|push|splice|unshift)\s*\(/,
    sample: 'const live = pool.items.filter((e) => e.alive);',
    innocent: 'for (let i = 0; i < pool.size; i++) total += pool.at(i).along;',
  },
  {
    what: 'an Object or Array helper, each of which materialises a fresh collection',
    pattern: /\bObject\.(keys|values|entries|assign|fromEntries)\s*\(|\bArray\.from\s*\(/,
    sample: 'for (const k of Object.keys(row)) sum += row[k];',
    innocent: 'const kind = row.sprite;',
  },
  {
    what: 'a spread, which copies whatever it touches',
    pattern: /\.\.\./,
    sample: 'const copy = { ...entity, along: 0 };',
    innocent: 'const along = entity.along;',
  },
  {
    what: 'a template literal, which builds a string every time it is evaluated',
    pattern: /`/,
    sample: 'surface.label(`${score}`);',
    innocent: "surface.label('score');",
  },
  {
    what: 'JSON, which allocates on both sides',
    pattern: /\bJSON\.(parse|stringify)\s*\(/,
    sample: 'const snapshot = JSON.stringify(entity);',
    innocent: 'const snapshot = entity.along;',
  },
];

/**
 * Whether `src` imports anything from `module` that survives to runtime.
 *
 * ⚠️ **Type-only imports do NOT count, and that is a deliberate departure from
 * `docs/decisions/0015-the-layer-ladder.md`**, which refuses that exemption for the layer arrow. The
 * two rules are about different things. 0015 is about coupling, and a type is the coupling that
 * hurts. This is about whether a function can be CALLED during a frame, which is a runtime question
 * — `import type { Atlas }` in the canvas backend is not just permitted, it is required.
 */
function importsAtRuntime(src: string, module: string): boolean {
  for (const m of src.matchAll(/\bimport\s+([\s\S]*?)\s*from\s+['"]([^'"]*)['"]/g)) {
    if (!m[2]!.endsWith(module)) continue;
    const clause = m[1]!.trim();
    if (clause.startsWith('type ')) continue;
    const braced = /^\{([\s\S]*)\}$/.exec(clause);
    if (braced === null) return true; // a default or namespace import is always a runtime edge
    const specifiers = braced[1]!
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (specifiers.some((s) => !s.startsWith('type '))) return true;
  }
  return false;
}

/** Comments blanked but LINE NUMBERS preserved, so a `@setup` marker still lines up with its code. */
function stripKeepingLines(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(?<!:)\/\/.*$/gm, '');
}

/** `// @setup: reason` on the line above exempts a line, and the reason has to be a real one. */
const SETUP = /\/\/\s*@setup:\s*(.+)$/;

interface Offence {
  file: string;
  line: number;
  what: string;
  text: string;
}

/** Every banned allocation in a file, ignoring lines the line above exempts. */
function allocationsIn(file: string, source: string): Offence[] {
  const raw = source.split('\n');
  const code = stripKeepingLines(source).split('\n');
  const out: Offence[] = [];
  for (let i = 0; i < code.length; i++) {
    const marker = i > 0 ? SETUP.exec(raw[i - 1] ?? '') : null;
    if (marker && marker[1]!.trim().length >= 20) continue;
    for (const row of ALLOCATIONS) {
      if (row.pattern.test(code[i] ?? '')) out.push({ file, line: i + 1, what: row.what, text: (raw[i] ?? '').trim() });
    }
  }
  return out;
}

describe('nothing allocates in the frame loop', () => {
  it('no hot file allocates, outside a line that says why it may', () => {
    const offences = HOT_FILES.flatMap((f) => allocationsIn(f, read(f)));
    expect(
      offences.map((o) => `${o.file}:${o.line} — ${o.what}\n      ${o.text}`),
      'these run every frame and each one makes garbage.\n' +
        'GC pauses are the main source of jank in a browser game, and a shooter allocates hardest ' +
        'exactly when it can least afford to. The usual fixes: mutate a pooled object instead of ' +
        'building one, hoist the closure out of the loop, return numbers instead of a point.\n' +
        'If the line genuinely runs once at boot, mark it `// @setup: <why>` on the line above.',
    ).toEqual([]);
  });

  it('every hot file exists and is actually on the list', () => {
    // A path that has been renamed makes this whole describe scan nothing at all.
    for (const f of HOT_FILES) expect(read(f).length, `${f} is on the hot list and is empty or missing`).toBeGreaterThan(0);
    expect(HOT_FILES).toContain('src/render/scene.ts');
    expect(HOT_FILES).toContain('src/sim/entity.ts');
    expect(HOT_FILES, 'the file that IS the frame is not being scanned').toContain('src/app/frame.ts');
    expect(HOT_FILES, 'the blit that runs 500 times a frame is not being scanned').toContain('src/render/canvas.ts');
    expect(HOT_FILES, 'the densest loop in the game is not being scanned').toContain('src/sim/collide.ts');
  });

  it('says why each cold file next door to a hot one is cold', () => {
    // The list is the argument for the mount/frame split. A file that drops off it silently is a
    // file that started running every frame without anyone saying so.
    for (const [file, reason] of Object.entries(DELIBERATELY_COLD)) {
      expect(read(file).length, `${file} is named as cold and does not exist`).toBeGreaterThan(0);
      expect(reason.length, `${file} is exempt without a stated reason`).toBeGreaterThan(40);
      expect(HOT_FILES, `${file} is on both lists`).not.toContain(file);
    }
  });

  it('the frame cannot reach the baker', () => {
    // The rule the two lists exist to hold: whatever else changes, baking may not move into a frame.
    const reaching = HOT_FILES.filter((f) => importsAtRuntime(read(f), 'bake.ts'));
    expect(
      reaching,
      `these run every frame and can call the baker: ${reaching.join(', ')}.\n` +
        'Art is drawn once at load and blitted thereafter (0022). A frame that can bake is a frame ' +
        'that will, the first time someone needs a sprite in a colour they have not got.',
    ).toEqual([]);
  });
});

/**
 * ⚠️ THE ASSERTIONS THAT KEEP THE SCAN ABOVE FROM BEING DECORATIVE.
 *
 * The hot files are written to pass it, so it runs over clean code and reports nothing — which is
 * exactly what a broken pattern also does.
 */
describe('the allocation scan is known to work, not merely green', () => {
  it('every pattern matches the line it exists to catch', () => {
    for (const row of ALLOCATIONS) {
      expect(row.pattern.test(row.sample), `${row.what}: the pattern misses its own sample`).toBe(true);
    }
  });

  it('and leaves an innocent line alone', () => {
    for (const row of ALLOCATIONS) {
      expect(row.pattern.test(row.innocent), `${row.what}: the pattern fires on a line it must not`).toBe(false);
    }
  });

  it('finds an allocation planted in a hot file', () => {
    const planted = ['const a = 1;', 'const copy = { ...entity };', 'const b = 2;'].join('\n');
    const found = allocationsIn('planted.ts', planted);
    expect(found.length).toBe(1);
    expect(found[0]!.line).toBe(2);
  });

  it('ignores an allocation that is explained, and only when it is explained', () => {
    const explained = ['// @setup: built once at boot and mutated in place forever after', 'const c = new Thing();'];
    expect(allocationsIn('planted.ts', explained.join('\n'))).toEqual([]);

    const unexplained = ['// @setup: because', 'const c = new Thing();'];
    expect(allocationsIn('planted.ts', unexplained.join('\n')).length, 'a hand-wave got through as a reason').toBe(1);

    const unmarked = ['// built once at boot and mutated in place forever after', 'const c = new Thing();'];
    expect(allocationsIn('planted.ts', unmarked.join('\n')).length, 'a plain comment exempted a line').toBe(1);
  });

  it('reads code and not the prose that explains it', () => {
    // The house style names the banned things in the doc comments of the files that ban them.
    const commented = ['/** Never use JSON.stringify or a `template` here. */', 'const d = 1;'].join('\n');
    expect(allocationsIn('planted.ts', commented)).toEqual([]);
  });

  it('tells a runtime import of the baker from a type-only one', () => {
    // THE distinction the whole check rests on. Its first version banned both, which would have
    // forced the canvas backend to stop naming the type it is handed.
    expect(importsAtRuntime("import { bakeAtlas } from './bake.ts';", 'bake.ts')).toBe(true);
    expect(importsAtRuntime("import type { Atlas } from './bake.ts';", 'bake.ts')).toBe(false);
    expect(importsAtRuntime("import { type Atlas } from './bake.ts';", 'bake.ts')).toBe(false);
    expect(importsAtRuntime("import { type Atlas, bakeAtlas } from './bake.ts';", 'bake.ts')).toBe(true);
    expect(importsAtRuntime("import Baker from './bake.ts';", 'bake.ts')).toBe(true);
    expect(importsAtRuntime("import { paintScene } from './scene.ts';", 'bake.ts')).toBe(false);
  });

  it('keeps line numbers honest across a block comment', () => {
    const src = ['/*', ' * a comment', ' */', 'const e = new Thing();'].join('\n');
    expect(allocationsIn('planted.ts', src)[0]!.line).toBe(4);
  });
});
