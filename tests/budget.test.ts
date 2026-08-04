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
import type { Surface } from '../src/render/surface.ts';

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

function fullPool(): Pool<Entity> {
  const pool = new Pool<Entity>(WORST_CASE, makeEntity);
  for (let i = 0; i < WORST_CASE; i++) {
    const e = pool.spawn()!;
    reset(e, 1000 + i, (i * 7) % ACROSS_SPAN, i % 16);
    e.velAlong = -0.5;
  }
  return pool;
}

describe('the worst-case scene costs one blit per entity, and nothing else', () => {
  it('draws exactly one call per live entity, plus one clear', () => {
    const surface = new CountingSurface();
    const pool = fullPool();
    paintScene(surface, viewOf(1920, 1080), pool, 900, 0.5);
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
      paintScene(surface, view, pool, 900, (frame % 60) / 60);
      if (frame > 0) expect(surface.blits, `frame ${frame} drew a different amount`).toBe(previous);
      previous = surface.blits;
    }
  });

  it('holds in portrait too, at the same cost', () => {
    // Two orientations, one scene, one price — the difficulty parity of 0023 seen from the frame side.
    const pool = fullPool();
    const flat = new CountingSurface();
    const upright = new CountingSurface();
    paintScene(flat, viewOf(2400, 1080), pool, 900, 0.25);
    paintScene(upright, viewOf(1080, 2400), pool, 900, 0.25);
    expect(upright.blits).toBe(flat.blits);
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
        reset(e, camera + 200 + pool.size, (pool.size * 7) % ACROSS_SPAN, pool.size % 16);
        e.velAlong = -0.5;
      }
      advance(clock, 16.7);
      for (let s = 0; s < clock.steps; s++) {
        camera += 0.6;
        stepEntities(pool, camera);
      }
      paintScene(surface, view, pool, camera, clock.alpha);
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
const HOT_FILES = ['src/app/loop.ts', 'src/sim/pool.ts', 'src/sim/entity.ts', 'src/render/scene.ts', 'src/render/surface.ts'];

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

  it('keeps line numbers honest across a block comment', () => {
    const src = ['/*', ' * a comment', ' */', 'const e = new Thing();'].join('\n');
    expect(allocationsIn('planted.ts', src)[0]!.line).toBe(4);
  });
});
