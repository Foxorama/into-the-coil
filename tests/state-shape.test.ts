import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { dirname as posixDirname, normalize as posixNormalize } from 'node:path/posix';

/**
 * THE STATE IS SLICES, AND A SLICE DOES NOT KNOW ITS SIBLINGS.
 *
 * See `docs/decisions/0017-the-state-is-slices.md`. The reasoning is there.
 *
 * ── THE ONE FAILURE THIS EXISTS TO PREVENT ───────────────────────────────────────────────────────
 *
 * The predecessor's reducer is a 2,818-line module holding a single `switch` of 127 cases, and it
 * appears in 17.0% of all 822 commits — second only to the shell. Nothing about it was written
 * badly. It grew one perfectly reasonable case at a time, and each case could see every other, so
 * the cheapest place to put anything was always inside it.
 *
 * Slicing is not an aesthetic preference about file size. It is the rule that **a slice cannot
 * import a sibling**, which is what removes the affordance: coordination between two slices has
 * nowhere to happen except the root, where it is one visible line rather than a case in the middle
 * of a hundred and twenty-six others.
 *
 * ── ALREADY GUARDED ELSEWHERE — do not describe twice ────────────────────────────────────────────
 *
 *   the reducer is pure — no DOM, no clock, no randomness   -> layering.test.ts (`state` allows [])
 *   nothing outside src/save/ may touch storage             -> layering.test.ts
 *   a switch over a closed union carries a `never` arm      -> registry.test.ts
 *   a table is keyed by a union, never by `string`          -> registry.test.ts
 *
 * Those stay where they are, per `tests/one-description.test.ts`'s admission rule.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

/** The layer, its slices, and the root that composes them. Declared homes, per 0015 and 0017. */
const STATE_DIR = 'src/state';
const SLICES_DIR = 'src/state/slices';
const ROOT_REDUCER = 'src/state/root.ts';

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(?<!:)\/\/.*$/gm, ' ');
}

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

/** A relative specifier resolved against the importing file, as a repo-relative posix path. */
function resolveFrom(path: string, spec: string): string {
  return posixNormalize(`${posixDirname(path)}/${spec}`).replace(/\\/g, '/');
}

/**
 * Whether `target` is a DIFFERENT slice than the one importing it.
 *
 * ⚠️ One function, called by the assertion and by the proof below. An earlier draft wrote the rule
 * out twice — once in the scan, once in the fixture — which proves a copy and would have gone on
 * passing after the real one broke. That is the failure `one-description.test.ts` exists for,
 * committed inside a file that cites it.
 */
function isSiblingSlice(from: string, target: string): boolean {
  return target.startsWith(`${SLICES_DIR}/`) && !target.startsWith(from.replace(/\.ts$/, ''));
}

/** Every relative module specifier a file imports, resolved against it. */
function relativeImportsOf(path: string, src: string): string[] {
  const clean = stripComments(src);
  const specs = [
    ...[...clean.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!),
    ...[...clean.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!),
    ...[...clean.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm)].map((m) => m[1]!),
  ];
  return [...new Set(specs)].filter((s) => s.startsWith('.')).map((s) => resolveFrom(path, s));
}

/**
 * Shapes that cannot survive a `JSON.parse(JSON.stringify(x))` round trip.
 *
 * ⚠️ Containers only, and `class` is deliberately absent. A seeded generator wrapped in a class is
 * the first thing `src/sim/` will hold and it is not state — banning the keyword would flag it on
 * day one, and a guard that flags a correct file on day one is a guard everyone learns to edit.
 */
const NOT_PLAIN_DATA = /new\s+(?:Map|Set|WeakMap|WeakSet)\b|\bSymbol\s*\(/;

/**
 * Where the ban applies. `content/` is excluded on purpose: a row carries its own behaviour, so a
 * function is expected there — and a row is never persisted, only its key is.
 */
const PLAIN_DATA_TREES = [STATE_DIR, 'src/sim'];

describe('the state is slices', () => {
  it('no slice imports a sibling slice', () => {
    const offences: string[] = [];
    for (const path of tsFilesUnder(SLICES_DIR)) {
      for (const target of relativeImportsOf(path, read(path))) {
        if (isSiblingSlice(path, target)) offences.push(`${path} -> ${target}`);
      }
    }
    expect(
      offences,
      `slices reached for each other:\n  ${offences.join('\n  ')}\n` +
        'A slice owns one part of the state and knows nothing about the rest. When two need to agree, ' +
        'the agreement belongs in the root, where it is one visible line — not inside a slice, where ' +
        'it is invisible from the other side and where the next one goes too.\n' +
        'If the shared thing is a TYPE or a pure helper rather than a slice, move it up to ' +
        `${STATE_DIR}/ and import it from there.`,
    ).toEqual([]);
  });

  it('the root reducer routes and does not decide', () => {
    if (!existsSync(resolve(root, ROOT_REDUCER))) return; // lands with the first slice
    const code = stripComments(read(ROOT_REDUCER));
    const cases = [...code.matchAll(/\bcase\s/g)].length;
    expect(
      cases,
      `${ROOT_REDUCER} has ${cases} case arms. The root composes slices and dispatches to them; the ` +
        'moment it starts deciding things itself it becomes the one file every feature has a reason ' +
        'to touch, which is exactly the 127-case reducer this shape exists to avoid. Put the decision ' +
        'in the slice that owns the state it changes.',
    ).toBe(0);
  });

  it('state is plain data — nothing that a save cannot round-trip', () => {
    const offenders = PLAIN_DATA_TREES.flatMap(tsFilesUnder).filter((p) => NOT_PLAIN_DATA.test(stripComments(read(p))));
    expect(
      offenders,
      `these hold something a JSON round trip destroys: ${offenders.join(', ')}\n` +
        'A Map survives `structuredClone` and does not survive `JSON.stringify` — it comes back as ' +
        '`{}`, silently, with no error anywhere. The state is the thing that gets saved and the thing ' +
        'a seeded test compares for equality, so it stays plain objects, arrays and primitives. A ' +
        'lookup wants a `Record`; a set wants an array or a `Record<Key, true>`.',
    ).toEqual([]);
  });
});

/**
 * ⚠️ THE ASSERTIONS THAT KEEP THE FILE ABOVE FROM BEING DECORATIVE.
 *
 * `src/state/` does not exist yet, so all three scans above run over nothing and pass — decision
 * 0005's failure shape, aimed at the guard. These run the real extractors over samples.
 */
describe('the guards above are known to work, not merely green', () => {
  it('the sibling rule tells a sibling from the slice itself and from a shared module', () => {
    // The real predicate, given the real resolver — not a restatement of either.
    const sibling = (from: string, spec: string): boolean => isSiblingSlice(from, resolveFrom(from, spec));
    expect(sibling('src/state/slices/run.ts', './meta.ts')).toBe(true);
    expect(sibling('src/state/slices/run.ts', '../slices/meta.ts')).toBe(true);
    // Its own helpers are not a sibling.
    expect(sibling('src/state/slices/run.ts', './run/wave.ts')).toBe(false);
    // Shared types one level up are the sanctioned way for two slices to agree on a shape.
    expect(sibling('src/state/slices/run.ts', '../screens.ts')).toBe(false);
    expect(sibling('src/state/slices/run.ts', '../../sim/model.ts')).toBe(false);
  });

  it('the import extractor finds every form, and ignores a quoted one', () => {
    const fixture = [
      "import { meta } from './meta.ts';",
      "export type { M } from '../screens.ts';",
      "const late = await import('./upgrade.ts');",
      "import { X } from 'some-package';",
      "// import { Y } from './commented-out.ts';",
    ].join('\n');
    expect(relativeImportsOf('src/state/slices/run.ts', fixture).sort()).toEqual([
      'src/state/screens.ts',
      'src/state/slices/meta.ts',
      'src/state/slices/upgrade.ts',
    ]);
  });

  it('the plain-data pattern catches what a JSON round trip destroys, and nothing else', () => {
    expect(NOT_PLAIN_DATA.test('const seen = new Map<EnemyId, number>();')).toBe(true);
    expect(NOT_PLAIN_DATA.test('const cleared = new Set(stageIds);')).toBe(true);
    expect(NOT_PLAIN_DATA.test('const tag = Symbol("run");')).toBe(true);
    // A plain lookup is the sanctioned replacement and must not be flagged.
    expect(NOT_PLAIN_DATA.test('const seen: Record<EnemyId, number> = {};')).toBe(false);
    expect(NOT_PLAIN_DATA.test('const cleared: StageId[] = [];')).toBe(false);
    // And the class ban that is deliberately absent, so its absence is a decision rather than a gap.
    expect(NOT_PLAIN_DATA.test('export class Rng { constructor(readonly seed: number) {} }')).toBe(false);
  });

  it('a Map really does not survive the round trip the rule is named after', () => {
    // The reason the ban exists, executed rather than asserted from memory: this is silent. No throw,
    // no warning, an empty object where the state used to be.
    const withMap = { seen: new Map([['acid', 3]]) };
    expect(JSON.parse(JSON.stringify(withMap))).toEqual({ seen: {} });
    const asRecord = { seen: { acid: 3 } };
    expect(JSON.parse(JSON.stringify(asRecord))).toEqual(asRecord);
  });

  it('the root-reducer scan counts case arms and is not fooled by prose', () => {
    const count = (src: string): number => [...stripComments(src).matchAll(/\bcase\s/g)].length;
    expect(count("switch (a.slice) { case 'run': return r(s, a); case 'meta': return m(s, a); }")).toBe(2);
    expect(count('/** never grow a case arm here */ export const reduce = () => 1;')).toBe(0);
    expect(count('export const reduce = (s: State, a: Action): State => SLICES[a.slice].reduce(s, a);')).toBe(0);
  });
});
