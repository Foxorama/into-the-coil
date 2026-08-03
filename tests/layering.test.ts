import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { dirname as posixDirname, normalize as posixNormalize } from 'node:path/posix';

/**
 * THE LAYER LADDER — `src/` is a CLOSED SET of layers with a one-way import arrow.
 *
 * See `docs/decisions/0015-the-layer-ladder.md`. This file is the enforcement; the reasoning is
 * there, and the two must not both try to hold it.
 *
 * ── WHAT THIS GUARDS, AND WHY IT IS A GRAPH RATHER THAN A SIZE LIMIT ─────────────────────────────
 *
 * The predecessor's pain was measured over all 822 of its commits: `app.ts` 4,588 lines and 35.2%
 * of every commit, against `render/constellations.ts` 2,628 lines and 0.6%. Same order of size,
 * sixty-fold difference in cost. A line ceiling cannot tell those two apart — it flags both, and
 * the healthy one first, because it is the one nobody is editing. What separates them is which way
 * the arrows point: `app.ts` is where everything meets.
 *
 * So the thing held here is DIRECTION, not size. A layer may import strictly downward, and the set
 * of layers is closed — a new directory under `src/` fails this file until someone decides where it
 * sits, which is exactly the moment to have the argument.
 *
 * ── AND THE CAPABILITY BANS, WHICH ARE THE SAME RULE IN THE OTHER AXIS ───────────────────────────
 *
 * A layer also declares what it may REACH FOR. A `Math.random` inside the model is not a style
 * problem, it is the end of reproducibility; a `Date.now` in a painter is the end of frame-rate
 * independence. Both look completely ordinary in review and neither has a compiler that objects.
 *
 * ── NOT VACUOUS, THOUGH MOST LAYERS ARE EMPTY TODAY ──────────────────────────────────────────────
 *
 * `src/` holds two files right now, so every scan below runs over almost nothing — which is
 * indistinguishable from a scan whose extractor is broken, and is the shape decision 0005 exists to
 * refuse. Every extractor is therefore proved against a sample of the thing it must catch, in this
 * file: a broken regex fails HERE and now, not in six months when the first `sim/` module reaches
 * for the clock and nothing complains.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

// ── THE LADDER ───────────────────────────────────────────────────────────────────────────────────

/**
 * The layers. Closed union, so every table below is a `Record` over it and adding a layer fails to
 * BUILD until it has been given a directory, a set of imports it may make, and the capabilities it
 * is allowed to reach for.
 */
type Layer = 'brand' | 'sim' | 'content' | 'state' | 'save' | 'render' | 'app';

/** A thing a module can reach for that is not another module. */
type Capability = 'dom' | 'clock' | 'random' | 'storage';

interface CapabilityRow {
  /** The shape of a reach, in comment-stripped source. */
  pattern: RegExp;
  /** A line that MUST match, so a typo'd pattern fails here rather than passing forever. */
  sample: string;
  /** What is lost in the layers that are refused it. */
  cost: string;
}

const CAPABILITIES: Record<Capability, CapabilityRow> = {
  dom: {
    pattern: /\bdocument\b|\bwindow\b|\bnavigator\b|\bHTMLElement\b|\bCanvasRenderingContext2D\b|addEventListener|querySelector/,
    sample: "const app = document.querySelector('#app');",
    cost:
      'A module that touches the DOM cannot be run by a node test, and the whole point of the model ' +
      'and the reducer is that a stage can be played to completion without a browser.',
  },
  clock: {
    pattern: /\bDate\.now\b|new Date\b|performance\.now|setTimeout|setInterval|requestAnimationFrame/,
    sample: 'const now = performance.now();',
    cost:
      'A function that reads the clock cannot be replayed, cannot be stepped at a fixed dt, and gives ' +
      'a different answer on a slow frame. Time is an ARGUMENT below the shell — the shell owns the ' +
      'one rAF loop and passes dt down.',
  },
  random: {
    pattern: /Math\.random|crypto\.getRandomValues/,
    sample: 'const seed = Math.random();',
    cost:
      'The end of reproducibility, and it is silent: a seeded stage stops replaying, a bug report ' +
      'stops being actionable, and nothing goes red. Below the shell, randomness comes from a seeded ' +
      'generator that was passed in. The shell draws the seed once and that is the only sanctioned call.',
  },
  storage: {
    pattern: /localStorage|sessionStorage|indexedDB|document\.cookie/,
    sample: "localStorage.setItem('itc_save', json);",
    cost:
      'itch.io serves every HTML5 game from one shared origin, so a stray write lands in a bucket ' +
      "shared with strangers' data. Persistence goes through the save layer or it is not persistence, " +
      'it is a key nobody migrates and PRIVACY.md never hears about.',
  },
};

interface LayerRow {
  /** The directory that IS this layer, or `null` for a layer that is a single root file. */
  dir: string | null;
  /** What belongs here, in one line. */
  what: string;
  /** Layers this one may import. Itself is always allowed and is not listed. */
  mayImport: Layer[];
  /** Capabilities this layer may reach for. Everything else in `CAPABILITIES` is refused. */
  allows: Capability[];
  /** Why the row is drawn where it is — the part that has to survive a future argument. */
  why: string;
}

/**
 * ⚠️ `mayImport` is a LIST, not a rank. `save` and `render` sit at the same height and neither may
 * import the other, which no linear ordering can express: a ladder would have to put one under the
 * other and thereby permit an edge that is wrong in both directions. A painter that can read the
 * save reads it mid-frame; a save layer that can reach a painter persists a view.
 */
const LAYERS: Record<Layer, LayerRow> = {
  brand: {
    dir: null,
    what: 'the product name, id, version and build — `src/brand.ts`',
    mayImport: [],
    allows: [],
    why:
      'Identity is a leaf by construction, so every layer may name the game without any of them ' +
      'gaining a dependency on each other. Held separately by 0002 and tests/brand.test.ts.',
  },
  sim: {
    dir: 'src/sim',
    what: 'the model: state types, the step function, the seeded generator, the stage contract',
    mayImport: ['brand'],
    allows: [],
    why:
      'The layer whose entire value is that it can be run without a browser and replayed from a ' +
      'seed. It imports nothing that could take either away. The predecessor could simulate a whole ' +
      'round headlessly and could not simulate a single second of its boss fight, because the fight ' +
      'was written in the render layer — for a game whose fight IS the product, that is the mistake ' +
      'to not repeat.',
  },
  content: {
    dir: 'src/content',
    what: 'the tables: enemies, waves, weapons, upgrades, stages — rows, keyed by a closed union',
    mayImport: ['brand', 'sim'],
    allows: [],
    why:
      'A row may carry behaviour (an enemy brings its own tick), so it needs the model types — and ' +
      'nothing else. Measured on the predecessor, a file that is only rows is touched only when a ' +
      'row changes: its coldest table took 0.4% of commits and its hottest 6.2%, still below the ' +
      'coldest hub. The two hot ones held logic as well as rows, which is the actual rule.',
  },
  state: {
    dir: 'src/state',
    what: 'screens, actions, and the sliced reducer — see 0017',
    mayImport: ['brand', 'sim', 'content'],
    allows: [],
    why:
      'Pure `(State, Action) => State`, so the whole interactive flow is unit-testable without ' +
      'mounting anything. Persistence and painting are effects the shell performs on the result, ' +
      'never things the reducer does.',
  },
  save: {
    dir: 'src/save',
    what: 'the persisted schema, its migration chain, and the only code that may touch storage',
    mayImport: ['brand', 'sim', 'content', 'state'],
    allows: ['storage'],
    why:
      'The one layer granted `storage`, so every `itc_*` key is in one directory where PRIVACY.md ' +
      "can be cross-checked against it and a version can be bumped in one place. It knows the state's " +
      'shape because that is what it persists; nothing knows about it except the shell.',
  },
  render: {
    dir: 'src/render',
    what: 'painters — model and state in, pixels out. Never a decision, never a dispatch',
    mayImport: ['brand', 'sim', 'content', 'state'],
    allows: ['dom'],
    why:
      'Granted the DOM because painting is what it does, and refused the clock because time is an ' +
      'argument: a painter handed `t` can be scrubbed, previewed, screenshotted at an exact frame ' +
      'and tested. One that calls `performance.now()` can only be watched. Refused `random` for the ' +
      "same reason the model is — scenery gets its own seeded stream so an art pass cannot move a " +
      'spawn. Refused `save` because a painter that can read storage reads it mid-frame.',
  },
  app: {
    dir: 'src/app',
    what: 'the shell: boot, the rAF loop, input, audio, wiring — the only layer with side effects',
    mayImport: ['brand', 'sim', 'content', 'state', 'save', 'render'],
    allows: ['dom', 'clock', 'random', 'storage'],
    why:
      'Everything the other six are refused has to happen somewhere, and it happens here, where it ' +
      'is visible. This is also the layer that became the predecessor\'s 4,588-line attractor, so the ' +
      'rule that matters is the one 0016 carries: it enumerates SYSTEMS, never instances.',
  },
};

/**
 * `.ts` files sitting directly in `src/`, and which layer each belongs to. Closed: a new one fails
 * until it is declared, which is the same closed-allowlist shape `dist/`'s sidecars are held by.
 *
 * `main.ts` is the composition root and is `app` in every sense except its path. It stays at
 * `src/main.ts` because that string is the build's entry — `index.html` names it, and moving it to
 * satisfy a table would edit a shipped surface to make a test tidier.
 */
const ROOT_FILES: Record<string, Layer> = {
  'brand.ts': 'brand',
  'main.ts': 'app',
};

/**
 * Bare import specifiers `src/` may use. EMPTY, and that is the decision: the build emits one
 * self-contained page (0003), and a runtime dependency is the thing most likely to quietly stop
 * being inlinable. A node builtin would not survive the browser at all.
 */
const ALLOWED_BARE_IMPORTS: Record<string, string> = {};

// ── THE EXTRACTORS, each proved against a sample below ───────────────────────────────────────────

/**
 * Comments removed, so a scan reads code rather than prose.
 *
 * Load-bearing in this repo specifically: the house style is long doc comments that name the very
 * things these patterns ban — the paragraph above says `Math.random` and `performance.now()` — and
 * without this every capability scan would flag every file that explains itself.
 *
 * `//` preceded by `:` is left alone so a URL in a string survives. A `/*` inside a string literal
 * would still confuse it; the fixture below pins the behaviour that is relied on.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(?<!:)\/\/.*$/gm, ' ');
}

/** Every module specifier a file imports or re-exports, static and dynamic. */
function importsOf(src: string): string[] {
  const clean = stripComments(src);
  const out: string[] = [];
  for (const m of clean.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)) out.push(m[1]!);
  for (const m of clean.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]/g)) out.push(m[1]!);
  for (const m of clean.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm)) out.push(m[1]!);
  return [...new Set(out)];
}

/** Every `.ts` file under a directory, as repo-relative posix paths. */
function tsFilesUnder(dir: string): string[] {
  if (!existsSync(resolve(root, dir))) return [];
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const entry of readdirSync(resolve(root, d), { withFileTypes: true })) {
      const p = `${d}/${entry.name}`;
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.ts')) out.push(p);
    }
  };
  walk(dir);
  return out;
}

const LAYER_NAMES = Object.keys(LAYERS) as Layer[];

/** Which layer a repo-relative `src/` path belongs to, or `null` if nothing claims it. */
function layerOf(path: string): Layer | null {
  const rootFile = /^src\/([^/]+)$/.exec(path)?.[1];
  if (rootFile !== undefined) return ROOT_FILES[rootFile] ?? null;
  return LAYER_NAMES.find((l) => LAYERS[l].dir !== null && path.startsWith(`${LAYERS[l].dir}/`)) ?? null;
}

/** A relative specifier resolved against the importing file, or `null` for a bare one. */
function resolveRelative(from: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null;
  return posixNormalize(`${posixDirname(from)}/${spec}`).replace(/\\/g, '/');
}

const SRC = tsFilesUnder('src');

// ── THE ASSERTIONS ───────────────────────────────────────────────────────────────────────────────

describe('the layer ladder', () => {
  it('every directory under src/ is a declared layer', () => {
    const declared = new Set(LAYER_NAMES.map((l) => LAYERS[l].dir).filter((d): d is string => d !== null));
    const found = readdirSync(resolve(root, 'src'), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => `src/${e.name}`);
    const undeclared = found.filter((d) => !declared.has(d));
    expect(
      undeclared,
      `these directories under src/ belong to no layer: ${undeclared.join(', ')}.\n` +
        'A new directory is a new place for things to accumulate, and the moment to decide what may ' +
        'import it is now, not after something does. Add it to LAYERS with what it holds, what it may ' +
        'import and what it may reach for — or put the file in an existing layer.',
    ).toEqual([]);
  });

  it('every file at the root of src/ is declared', () => {
    const undeclared = SRC.filter((p) => /^src\/[^/]+$/.test(p)).filter(
      (p) => ROOT_FILES[p.slice('src/'.length)] === undefined,
    );
    expect(
      undeclared,
      `these sit loose at the root of src/: ${undeclared.join(', ')}.\n` +
        'The root of src/ is a closed set of two — identity and the composition root. Anything else ' +
        'has a layer; put it there.',
    ).toEqual([]);
  });

  it('no module imports a layer it was not given', () => {
    const offences: string[] = [];
    for (const path of SRC) {
      const from = layerOf(path);
      if (from === null) continue; // already failing above; do not double-report
      for (const spec of importsOf(read(path))) {
        const target = resolveRelative(path, spec);
        if (target === null) continue; // bare specifier — its own assertion below
        const to = layerOf(target);
        if (to === null || to === from) continue;
        if (!LAYERS[from].mayImport.includes(to)) {
          offences.push(`${path} (${from}) imports ${spec} (${to})`);
        }
      }
    }
    expect(
      offences,
      `the arrow points one way and these go against it:\n  ${offences.join('\n  ')}\n` +
        'The fix is almost never to widen `mayImport` — it is to move the thing being reached for ' +
        'DOWN, or to have the shell pass it in. Widening a row is a decision, and it needs a file in ' +
        'docs/decisions/ saying what it bought.',
    ).toEqual([]);
  });

  it('src/ imports nothing from outside src/', () => {
    const offences: string[] = [];
    for (const path of SRC) {
      for (const spec of importsOf(read(path))) {
        if (spec.startsWith('.')) continue;
        if (ALLOWED_BARE_IMPORTS[spec] !== undefined) continue;
        offences.push(`${path} imports '${spec}'`);
      }
    }
    expect(
      offences,
      `these reach outside src/:\n  ${offences.join('\n  ')}\n` +
        'The build emits one self-contained page (0003). A runtime dependency is the thing most ' +
        'likely to stop being inlinable without anyone noticing, and a node builtin does not survive ' +
        'the browser at all. If one is genuinely needed, add it to ALLOWED_BARE_IMPORTS with a reason.',
    ).toEqual([]);
  });

  it('no layer reaches for a capability it was not granted', () => {
    const offences: string[] = [];
    for (const path of SRC) {
      const layer = layerOf(path);
      if (layer === null) continue;
      const code = stripComments(read(path));
      for (const cap of Object.keys(CAPABILITIES) as Capability[]) {
        if (LAYERS[layer].allows.includes(cap)) continue;
        if (CAPABILITIES[cap].pattern.test(code)) {
          offences.push(`${path} (${layer}) reaches for ${cap} — ${CAPABILITIES[cap].cost}`);
        }
      }
    }
    expect(
      offences,
      `a layer reached past what it was granted:\n  ${offences.join('\n  ')}\n` +
        'Take it as an argument, not an obstacle: the capability is available one layer up, and the ' +
        'usual fix is to make the thing an ARGUMENT — pass in `dt`, pass in the seeded generator, ' +
        'hand the painter the state it should draw.',
    ).toEqual([]);
  });

  it('every layer row says what it holds and why it sits where it does', () => {
    // A row with no stated reason is a rule that cannot be argued with later, only obeyed or deleted.
    for (const name of LAYER_NAMES) {
      const row = LAYERS[name];
      expect(row.what.length, `layer ${name} does not say what it holds`).toBeGreaterThan(20);
      expect(row.why.length, `layer ${name} does not say why it sits where it does`).toBeGreaterThan(60);
      if (row.dir !== null) expect(row.dir.startsWith('src/'), `layer ${name} is not under src/`).toBe(true);
    }
    for (const cap of Object.keys(CAPABILITIES) as Capability[]) {
      expect(CAPABILITIES[cap].cost.length, `capability ${cap} does not say what refusing it buys`).toBeGreaterThan(60);
    }
  });

  it('the arrow points one way — the declared graph has no cycle', () => {
    expect(cycleIn(Object.fromEntries(LAYER_NAMES.map((l) => [l, LAYERS[l].mayImport])) as Record<Layer, Layer[]>)).toBe(
      null,
    );
  });
});

/** The first cycle in a graph, as a readable path, or `null`. Shared so it can be proved below. */
function cycleIn<T extends string>(graph: Record<T, T[]>): string | null {
  const done = new Set<T>();
  const onStack = new Set<T>();
  let found: string | null = null;
  const visit = (node: T, path: T[]): void => {
    if (found !== null) return;
    if (onStack.has(node)) {
      found = [...path, node].join(' -> ');
      return;
    }
    if (done.has(node)) return;
    onStack.add(node);
    for (const next of graph[node] ?? []) visit(next, [...path, node]);
    onStack.delete(node);
    done.add(node);
  };
  for (const node of Object.keys(graph) as T[]) visit(node, []);
  return found;
}

/**
 * ⚠️ THE ASSERTIONS THAT KEEP THE FILE ABOVE FROM BEING DECORATIVE.
 *
 * `src/` holds two files. Every scan above therefore runs over almost nothing and passes, which is
 * exactly what a broken extractor also does. These run the real extractors over samples of what
 * they exist to catch.
 */
describe('the guards above are known to work, not merely green', () => {
  it('every capability pattern matches its own sample', () => {
    for (const cap of Object.keys(CAPABILITIES) as Capability[]) {
      const { pattern, sample } = CAPABILITIES[cap];
      expect(pattern.test(sample), `${cap}'s pattern does not match the line it exists to catch`).toBe(true);
    }
  });

  it('a capability pattern does not fire on a neighbour', () => {
    // The bans have to be separable, or the failure message names the wrong one and the fix goes to
    // the wrong layer.
    expect(CAPABILITIES.random.pattern.test('const t = performance.now();')).toBe(false);
    expect(CAPABILITIES.storage.pattern.test("document.querySelector('#app')")).toBe(false);
    // A field called `spawnWindow` is not the global `window`.
    expect(CAPABILITIES.dom.pattern.test('interface Wave { spawnWindow: number }')).toBe(false);
    // A `Date`-typed field is not a call to the clock.
    expect(CAPABILITIES.clock.pattern.test('interface Run { started: Date }')).toBe(false);
  });

  it('the comment stripper hides prose and nothing else', () => {
    // The whole reason it exists: this repo explains its rules in the files the rules apply to.
    expect(stripComments('/** never call Math.random here */\nconst a = 1;')).not.toMatch(/Math\.random/);
    expect(stripComments('// document.querySelector is the shell\'s job\nexport const a = 1;')).not.toMatch(/document/);
    expect(stripComments('const a = 1; // trailing')).toMatch(/const a = 1;/);
    // A URL is not a comment, and treating it as one would truncate the rest of a real line.
    expect(stripComments("const u = 'https://vulpecula.games/x'; const bad = Math.random();")).toMatch(/Math\.random/);
  });

  it('the import extractor finds every form an import takes', () => {
    const fixture = [
      "import { A } from '../sim/model.ts';",
      "import type { B } from './rows.ts';",
      "export { C } from '../content/enemies.ts';",
      "const d = await import('./late.ts');",
      "import './side-effect.ts';",
      "import { E } from 'some-package';",
      "// import { F } from '../save/schema.ts';",
    ].join('\n');
    expect(importsOf(fixture).sort()).toEqual(
      [
        '../content/enemies.ts',
        '../sim/model.ts',
        './late.ts',
        './rows.ts',
        './side-effect.ts',
        'some-package',
      ].sort(),
    );
  });

  it('a relative specifier resolves to the layer it actually lands in', () => {
    expect(layerOf(resolveRelative('src/render/hud.ts', '../sim/model.ts')!)).toBe('sim');
    expect(layerOf(resolveRelative('src/app/boot.ts', '../save/storage.ts')!)).toBe('save');
    expect(layerOf(resolveRelative('src/sim/step.ts', './rng.ts')!)).toBe('sim');
    expect(layerOf(resolveRelative('src/render/hud.ts', '../brand.ts')!)).toBe('brand');
    expect(resolveRelative('src/app/boot.ts', 'vitest')).toBe(null);
  });

  it('the cycle detector finds a cycle', () => {
    expect(cycleIn<'a' | 'b' | 'c'>({ a: ['b'], b: ['c'], c: ['a'] })).toBe('a -> b -> c -> a');
    expect(cycleIn<'a' | 'b'>({ a: ['b'], b: [] })).toBe(null);
  });
});
