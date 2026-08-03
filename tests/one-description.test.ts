import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/**
 * ONE DECISION, ONE HOME — the register.
 *
 * The most expensive recurring bug in the predecessor was a single fact described in two places, and
 * it was expensive in a specific way: the copies drift, both look correct in isolation, and the
 * failure appears somewhere neither of them is.
 *
 * **Held back until now, deliberately.** The scaffold plan seeds this file with the Chromium row and
 * then refuses to create it, because at that point the lookup had exactly one caller — and a row
 * banning re-derivation of a fact nobody re-derives is the same over-abstraction it exists to
 * prevent, wearing a guard's clothes. `scripts/icon.mjs` became the second caller, so the condition
 * the plan named has been met and the file exists now.
 *
 * ── THE GUARDS THAT ACTUALLY WORK, strongest first ───────────────────────────────────────────────
 *
 *   1. COMPILE-FORCED. A `Record<Key, …>` over a closed union does not *detect* drift, it makes
 *      drift not build. Always prefer it. Only covers facts shaped "one answer per known member".
 *   2. ONE SEAM + A SOURCE SCAN banning the alternative. This file. A behavioural test proves the
 *      code works today; a source scan proves a second description cannot be INTRODUCED tomorrow.
 *   3. A test that reads both copies. Weakest, and sometimes the only option — a service worker and
 *      a pre-boot script genuinely cannot share a constant.
 *
 * ── THE ADMISSION RULE ───────────────────────────────────────────────────────────────────────────
 *
 * A row earns its place only once a fact has TWO OR MORE callers. The trigger for a row is the same
 * as the trigger for the seam: a second asker appeared.
 *
 * When a row produces a false positive, the fix is to make the pattern PRECISE, or to add a named
 * exception WITH A REASON — never to relax it into uselessness. A guard everyone has learned to edit
 * around is worse than no guard.
 *
 * ── ALREADY GUARDED ELSEWHERE — do not duplicate ─────────────────────────────────────────────────
 *
 *   the product name, in index.html and the manifest   → brand.test.ts
 *   the app id, spelled once                           → brand.test.ts
 *   the SW cache prefix                                → shell.test.ts (`spells its cache prefix exactly once`)
 *   the theme colour, page vs manifest                 → shell.test.ts
 *   the Node version, across four workflows            → toolchain.test.ts
 *   icon sizes, manifest vs the actual PNG             → shell.test.ts
 *   storage keys vs PRIVACY.md                         → not yet — there is no `itc_*` key
 *
 * Those stay where they are. Moving a working guard can only be verified by breaking it on purpose,
 * and doing that to six at once is how a register ends up weaker than the scattering it replaced.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

type Tree = 'src' | 'tests' | 'scripts';

/** Every source file under a tree, as `[path, source]`. */
function sourceFiles(dir: Tree, exts: string[]): [string, string][] {
  const out: [string, string][] = [];
  const walk = (d: string): void => {
    for (const entry of readdirSync(resolve(root, d), { withFileTypes: true })) {
      const p = `${d}/${entry.name}`;
      if (entry.isDirectory()) walk(p);
      else if (exts.some((e) => entry.name.endsWith(e))) out.push([p, read(p)]);
    }
  };
  walk(dir);
  return out;
}

// `scripts/` is scanned precisely BECAUSE it is dev tooling rather than shipped code: it is the tree
// nobody is watching, so a fact re-derived there rots for months. In the predecessor the rule was
// written, obeyed in `tests/`, and `scripts/` went on rotting — which is the whole reason the
// Chromium row scans both.
const TREES: Record<Tree, [string, string][]> = {
  src: sourceFiles('src', ['.ts']),
  tests: sourceFiles('tests', ['.ts']),
  scripts: sourceFiles('scripts', ['.ts', '.mjs']),
};

/** This file, excluded from its own scans — it names every banned shape in its own patterns. */
const REGISTER_PATH = 'tests/one-description.test.ts';

/**
 * A fact with exactly one home.
 *
 *  - `fact`    — what is being decided, in the domain's terms.
 *  - `home`    — the file that owns it, and the exported name that answers it.
 *  - `pattern` — the shape of a SECOND description. Anything matching outside the home re-derives it.
 *  - `allowed` — files that may match anyway, each with a reason. An entry without a reason is not
 *                an exception, it is a hole.
 *  - `cost`    — what was paid, or would be. Rows are not free; this is the justification.
 */
interface OneDescription {
  fact: string;
  home: string;
  answers: string;
  /** Which tree(s) a second description would appear in. A row scanning the wrong one passes vacuously. */
  scan: Tree | Tree[];
  pattern: RegExp;
  allowed?: Record<string, string>;
  cost: string;
}

const REGISTER: OneDescription[] = [
  {
    fact: 'Where Chromium is on this machine, and how it is launched',
    home: 'scripts/chromium.mjs',
    answers: 'findChromium',
    // BOTH trees, and that is the point of the row rather than an afterthought: in the predecessor
    // this was fixed in `tests/` and left rotting in `scripts/` for months afterwards.
    scan: ['tests', 'scripts'],
    // Scoped to DERIVING a path — reading the override, or hand-building a Playwright cache layout.
    // Deliberately NOT a ban on the words themselves: the browser tests pass the seam's answer to
    // `chromium.launch({ executablePath })`, which is calling the seam, not duplicating it, and
    // `tests/globalSetup.ts` names CHROME_PATH in a diagnostic message while deriving nothing.
    // Banning either would flag correct files and teach everyone to edit the guard.
    pattern: /process\.env\.CHROME_PATH|chrome-linux|ms-playwright|pw-browsers|chromium-\d/i,
    allowed: {
      'tests/chromium.ts': 'the TypeScript re-export of the home — a single forwarding line that resolves no paths',
    },
    cost:
      'In the predecessor nine test files each carried their own copy and they drifted into two different ' +
      'answers, so 50 browser tests reported SKIPPED everywhere — CI included — for months, and the board ' +
      'stayed green the entire time. The same lookup was then pasted into dozens of eyes-on rigs under ' +
      'scripts/, every copy Linux-only, and those failed SOFT: they printed "no chromium" and exited 0, so ' +
      'on Windows every preview the project relied on rendered nothing while reporting success.',
  },
];

describe('one decision, one home', () => {
  for (const row of REGISTER) {
    describe(row.fact, () => {
      it(`is answered by ${row.answers} in ${row.home}`, () => {
        expect(read(row.home), `${row.home} no longer defines ${row.answers} — did it move? Update the register.`).toContain(
          row.answers,
        );
      });

      const trees = [row.scan].flat();
      it(`is not described a second time anywhere in ${trees.join('/, ')}/`, () => {
        const offenders = trees
          .flatMap((t) => TREES[t])
          .filter(([path, src]) => {
            if (path === row.home) return false;
            if (path === REGISTER_PATH) return false;
            if (Object.keys(row.allowed ?? {}).some((a) => path.startsWith(a))) return false;
            return row.pattern.test(src);
          })
          .map(([path]) => path);

        expect(
          offenders,
          `these re-derive a decision that lives in ${row.home} (${row.answers}) — call it instead.\n` +
            `WHY THIS ROW EXISTS: ${row.cost}\n` +
            "If a match is legitimate, add it to that row's `allowed` WITH A REASON — never widen the pattern.",
        ).toEqual([]);
      });
    });
  }

  it('every row carries a home, an answer, and the cost that justifies it', () => {
    // A row with no stated cost is a rule nobody can weigh later. This is not a style guide.
    for (const row of REGISTER) {
      expect(row.fact.length, `a row needs a fact: ${row.answers}`).toBeGreaterThan(10);
      expect(row.cost.length, `${row.answers} has no stated cost`).toBeGreaterThan(40);
      expect(['src/', 'tests/', 'scripts/'].some((t) => row.home.startsWith(t))).toBe(true);
    }
  });

  it('every exception names a reason, because an unexplained exception is a hole', () => {
    for (const row of REGISTER) {
      for (const [path, reason] of Object.entries(row.allowed ?? {})) {
        expect(reason.length, `${row.answers} exempts ${path} without saying why`).toBeGreaterThan(10);
      }
    }
  });

  /**
   * ⚠️ THE ASSERTION THAT KEEPS THIS FILE FROM BEING DECORATIVE.
   *
   * A source scan that matches nothing passes forever, and looks identical to one that works — which
   * is decision 0005's failure shape aimed straight at the guard rather than the code. Each pattern
   * is proved against a sample of the second description it exists to catch, so a typo'd regex fails
   * HERE and now, rather than in six months when somebody re-derives the fact and nothing complains.
   */
  it('every pattern actually matches the thing it claims to ban', () => {
    const samples: Record<string, string> = {
      // The literal shape that was copy-pasted across the predecessor's rigs: a hand-built cache path.
      findChromium: "const bin = join(process.env.CHROME_PATH ?? base, 'chrome-linux', 'chrome');",
    };
    for (const row of REGISTER) {
      const sample = samples[row.answers];
      expect(sample, `no sample re-derivation for ${row.answers} — the pattern is unproven`).toBeTruthy();
      expect(row.pattern.test(sample!), `${row.answers}'s pattern does not match its own sample`).toBe(true);
    }
  });
});
