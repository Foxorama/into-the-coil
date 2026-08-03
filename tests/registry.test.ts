import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/**
 * THE TABLE IS THE GUARD — and this file holds the five ways it gets defeated.
 *
 * See `docs/decisions/0016-a-hub-enumerates-kinds.md`. The reasoning is there.
 *
 * ── WHAT IS BEING PROTECTED ──────────────────────────────────────────────────────────────────────
 *
 * A content type is a row in a `Record<Kind, Row>` over a closed union, and every subsystem with an
 * opinion about that content declares its own `Record` over the same union. That is the strongest
 * guard available anywhere in this project: it does not DETECT drift, it makes drift **not build**.
 * A new enemy kind fails to compile until the spawner, the painter and the drop table have each
 * said what they think about it, and the compiler produces the list of what is owed.
 *
 * Nothing here needs a test — the type system is the enforcement. What needs a test is the five
 * ordinary-looking moves that quietly switch it off, none of which produces an error and all of
 * which look like tidying:
 *
 *   1. auto-discovery      a directory read instead of an import list — the set stops being closed
 *   2. an open key         `Record<string, …>` — every kind is present, so none is ever missing
 *   3. `any`               the row stops having a shape
 *   4. a silenced compiler `@ts-ignore` on the line that would have failed
 *   5. a switch with no exhaustiveness arm — a new kind falls through to the default, silently
 *
 * ── AND WHAT IS DELIBERATELY NOT HELD HERE ───────────────────────────────────────────────────────
 *
 * A ceiling on `case` counts. It was proposed, measured against the predecessor, and rejected — the
 * measurement is in the decision. Short version: its 127-case reducer and its 38-case back-intent
 * switch sit two places apart in the same ranking, and the audit calls the second one exemplary.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

/**
 * Comments removed. Most rows below scan this rather than the raw file, because the house style
 * explains a rule inside the file the rule applies to — this very paragraph names three of them.
 */
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

const SRC = tsFilesUnder('src');

// ── THE FIVE DEFEATS ─────────────────────────────────────────────────────────────────────────────

type Defeat = 'auto-discovery' | 'open-key' | 'any' | 'silenced-compiler';

interface DefeatRow {
  /** What the move is, in one line. */
  what: string;
  /** `code` scans with comments removed; `raw` scans the file as written. */
  scan: 'code' | 'raw';
  pattern: RegExp;
  /** Lines that MUST match — a typo'd pattern fails here rather than passing forever. */
  samples: string[];
  /** Lines that must NOT match, so the row is precise rather than merely loud. */
  innocent: string[];
  /** What the compile-forcing buys, and therefore what this move gives away. */
  cost: string;
  /** Files that may match anyway, each with a reason. An entry without one is a hole. */
  allowed?: Record<string, string>;
}

const DEFEATS: Record<Defeat, DefeatRow> = {
  'auto-discovery': {
    what: 'building a registry by reading a directory instead of writing an import list',
    scan: 'code',
    pattern: /import\.meta\.glob|require\.context|readdirSync|readdir\(|import\.meta\.dirname/,
    samples: ["const rows = import.meta.glob('./enemies/*.ts', { eager: true });", 'readdirSync(dir)'],
    innocent: ["import { ACID } from './enemies/acid.ts';", 'const all = Object.values(ENEMIES);'],
    cost:
      'An explicit list of imports is greppable, has a defined order, and is one file a reader can ' +
      'hold in their head. Auto-discovery replaces all three with import-order side effects and a ' +
      'set that changes when someone adds a file — which is precisely when nobody is thinking about ' +
      'the registry. It also silently defeats the single-file build, because a bundler cannot ' +
      'tree-shake a set it cannot see.',
  },
  'open-key': {
    what: 'keying a table by `string` rather than by the closed union of kinds',
    scan: 'code',
    pattern: /Record<\s*string\s*,|\{\s*\[\s*\w+\s*:\s*string\s*\]\s*:/,
    samples: ['const ENEMIES: Record<string, EnemyDef> = {', 'interface Rows { [key: string]: Row }'],
    innocent: ['const ENEMIES: Record<EnemyKind, EnemyDef> = {', 'Record<Screen, ScreenDef>'],
    cost:
      'The whole guard, given away in one word. `Record<Kind, Row>` is exhaustive: a new kind fails ' +
      'to build until every table has a row for it. `Record<string, Row>` is satisfied by an empty ' +
      'object — every kind is already "present", so none can ever be reported missing, and the ' +
      'failure moves to runtime as an undefined lookup on the one enemy nobody added.',
  },
  any: {
    what: 'a row, a key or a parameter typed `any`',
    scan: 'code',
    pattern: /:\s*any\b|\bas\s+any\b|<\s*any\s*[,>]|\bany\[\]/,
    samples: ['function tick(e: any) {', 'const row = table[k] as any;', 'const rows: Array<any> = [];'],
    innocent: ["throw new Error('any of these will do');", 'const many = 3;', 'type AnyEnemy = Acid | Bolt;'],
    cost:
      'A table whose rows are `any` is a plain object with extra ceremony. Nothing is forced, ' +
      'nothing is checked, and the compile-time list of what a new kind owes you is empty.',
  },
  'silenced-compiler': {
    what: 'switching the compiler off on the line that was about to be useful',
    // RAW: these are comments, so the stripper would hide exactly what is being looked for.
    scan: 'raw',
    pattern: /@ts-ignore|@ts-nocheck|eslint-disable/,
    samples: ['// @ts-ignore', '/* @ts-nocheck */'],
    innocent: ['// the compiler will not let this through, and it is right', 'const ok = 1;'],
    cost:
      'Every guard in this project is downstream of the compiler agreeing to complain. A suppression ' +
      'is not a smaller version of fixing it — it is the guard, deleted, at the one line that had ' +
      'something to say. `@ts-expect-error` is not banned: it fails when the error goes away, so it ' +
      'cannot rot.',
  },
};

// ── EXHAUSTIVE SWITCHES ──────────────────────────────────────────────────────────────────────────

/**
 * Files whose switches may lack an exhaustiveness arm, each with a reason. Empty, and expected to
 * stay nearly so: a switch over something that is not a closed union — a key code, a numeric
 * opcode — is the legitimate case, and it will want naming when it arrives.
 */
const SWITCH_EXCEPTIONS: Record<string, string> = {};

/** The balanced-brace body of the switch whose keyword starts at `at`, or `null`. */
function switchBodyAt(src: string, at: number): string | null {
  const open = src.indexOf('{', at);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(open, i + 1);
  }
  return null;
}

/** Every switch in a source, as `{ line, exhaustive }`. Nested switches are found too. */
function switchesIn(src: string): { line: number; exhaustive: boolean }[] {
  const code = stripComments(src);
  const out: { line: number; exhaustive: boolean }[] = [];
  for (const m of code.matchAll(/\bswitch\s*\(/g)) {
    const body = switchBodyAt(code, m.index);
    if (body === null) continue;
    out.push({
      line: code.slice(0, m.index).split('\n').length,
      // The shape the predecessor uses and the only one that forces a decision: the default arm
      // assigns the scrutinee to `never`, so adding a union member fails to compile right here.
      exhaustive: /\bnever\b/.test(body),
    });
  }
  return out;
}

// ── THE ASSERTIONS ───────────────────────────────────────────────────────────────────────────────

describe('the table is the guard', () => {
  for (const name of Object.keys(DEFEATS) as Defeat[]) {
    const row = DEFEATS[name];
    it(`nothing in src/ defeats it by ${name}`, () => {
      const offenders = SRC.filter((p) => row.allowed?.[p] === undefined).filter((p) =>
        row.pattern.test(row.scan === 'raw' ? read(p) : stripComments(read(p))),
      );
      expect(
        offenders,
        `${row.what} — in: ${offenders.join(', ')}\n` +
          `WHAT IT COSTS: ${row.cost}\n` +
          "If a match is legitimate, add the file to that row's `allowed` WITH A REASON — never widen " +
          'the pattern, because a guard everyone has learned to edit around is worse than no guard.',
      ).toEqual([]);
    });
  }

  it('every switch in src/ ends in an exhaustiveness arm', () => {
    const offenders = SRC.filter((p) => SWITCH_EXCEPTIONS[p] === undefined).flatMap((p) =>
      switchesIn(read(p))
        .filter((s) => !s.exhaustive)
        .map((s) => `${p}:${s.line}`),
    );
    expect(
      offenders,
      `these switches accept a new kind silently: ${offenders.join(', ')}\n` +
        'End the default arm by assigning the scrutinee to `never`. Then adding a member to the union ' +
        'fails to compile HERE, with the compiler naming the case that was forgotten — which is the ' +
        'same guarantee a `Record` gives, in the one place a `Record` cannot reach: a decision that ' +
        'has to read state as well as the kind.\n' +
        'A switch over something that is genuinely not a closed union goes in SWITCH_EXCEPTIONS with ' +
        'a reason.',
    ).toEqual([]);
  });

  it('every row says what it costs, and every exception says why', () => {
    for (const name of Object.keys(DEFEATS) as Defeat[]) {
      const row = DEFEATS[name];
      expect(row.what.length, `${name} does not say what the move is`).toBeGreaterThan(20);
      expect(row.cost.length, `${name} does not say what it gives away`).toBeGreaterThan(60);
      for (const [path, why] of Object.entries(row.allowed ?? {})) {
        expect(why.length, `${name} exempts ${path} without saying why`).toBeGreaterThan(10);
      }
    }
    for (const [path, why] of Object.entries(SWITCH_EXCEPTIONS)) {
      expect(why.length, `${path} is exempt from exhaustiveness without saying why`).toBeGreaterThan(10);
    }
  });
});

/**
 * ⚠️ THE ASSERTIONS THAT KEEP THE FILE ABOVE FROM BEING DECORATIVE.
 *
 * There is no `src/content/` yet. Every scan above therefore runs over two files and passes, which
 * is what a broken pattern also does — decision 0005's failure shape, aimed at the guard rather than
 * the code. These run the real patterns over samples of what they exist to catch, and over lines
 * they must leave alone.
 */
describe('the guards above are known to work, not merely green', () => {
  it('every pattern matches the move it bans', () => {
    for (const name of Object.keys(DEFEATS) as Defeat[]) {
      const row = DEFEATS[name];
      expect(row.samples.length, `${name} has no sample — the pattern is unproven`).toBeGreaterThan(0);
      for (const sample of row.samples) {
        expect(row.pattern.test(sample), `${name}'s pattern misses: ${sample}`).toBe(true);
      }
    }
  });

  it('no pattern fires on a line it must leave alone', () => {
    for (const name of Object.keys(DEFEATS) as Defeat[]) {
      const row = DEFEATS[name];
      for (const innocent of row.innocent) {
        expect(row.pattern.test(innocent), `${name}'s pattern flags a legitimate line: ${innocent}`).toBe(false);
      }
    }
  });

  it('the raw/code split is the right way round for each row', () => {
    // `@ts-ignore` IS a comment. Scanned as `code` this row would be looking for the one thing the
    // stripper has just removed, and would pass forever.
    expect(DEFEATS['silenced-compiler'].scan).toBe('raw');
    expect(stripComments('// @ts-ignore\nconst a = 1;')).not.toMatch(/@ts-ignore/);
    // And the reverse: the rows that scan `code` must not be fooled by a rule quoted in prose.
    expect(stripComments('/** never write Record<string, Row> */').match(/Record<\s*string/)).toBe(null);
  });

  it('the switch parser finds a switch, its body, and whether it decides', () => {
    const exhaustive = [
      'function label(k: Kind): string {',
      '  switch (k) {',
      "    case 'acid': return 'Acid';",
      "    case 'bolt': return 'Bolt';",
      '    default: {',
      '      const missed: never = k;',
      '      return missed;',
      '    }',
      '  }',
      '}',
    ].join('\n');
    const open = [
      'switch (k) {',
      "  case 'acid': return 'Acid';",
      "  default: return '?';",
      '}',
    ].join('\n');
    expect(switchesIn(exhaustive)).toEqual([{ line: 2, exhaustive: true }]);
    expect(switchesIn(open)).toEqual([{ line: 1, exhaustive: false }]);
    // A nested switch is its own switch, and the outer one's braces must not swallow it.
    expect(switchesIn(`switch (a) { case 1: { switch (b) { case 2: break; } } }`)).toHaveLength(2);
    // The word `never` in a comment does not make a switch exhaustive.
    expect(switchesIn("switch (k) { /* never mind */ case 'a': break; }")[0]?.exhaustive).toBe(false);
  });
});
