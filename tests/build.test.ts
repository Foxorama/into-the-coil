import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { stampBuildIdentity } from '../vite.config';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

describe('the build happens once, in globalSetup', () => {
  it('globalSetup produced a dist/', () => {
    // If this fails, every assertion about the built artifact below is meaningless rather than
    // failing — so it is asserted directly rather than left as a precondition.
    expect(existsSync(resolve(root, 'dist/index.html'))).toBe(true);
  });

  /**
   * The rule `tests/globalSetup.ts` exists to enforce, enforced.
   *
   * A test file that builds `dist/` itself deletes it out from under a sibling worker mid-read —
   * a race that fires on a different test each time and passes on the retry, which is the most
   * expensive kind of failure to chase. The rule is invisible in the code (nothing stops you) so
   * it needs a guard, and the guard has to live where the temptation is.
   */
  it('no test file runs its own build', () => {
    const offenders = readdirSync(resolve(root, 'tests'))
      .filter((f) => f.endsWith('.ts') && f !== 'globalSetup.ts')
      .filter((f) => /vite\s+build|vite\/bin\/vite\.js|\bvite\.build\b|\bbuild\(\)/.test(read(`tests/${f}`)));
    expect(
      offenders,
      `these build dist/ themselves — move it to globalSetup: ${offenders.join(', ')}`,
    ).toEqual([]);
  });
});

/**
 * A FAILED BUILD REPORTS ITS OWN ERROR, AND NOT A SENTENCE ABOUT A HEALTHY FILE.
 *
 * See `docs/decisions/0409-a-failed-build-says-what-failed.md`. The identity-stamping hook runs
 * at `closeBundle`, which fires whether or not a bundle was written — so when the bundler REFUSED
 * the source, nothing reached `dist/`, the hook threw about `sw.js`, and that was the only error
 * printed. Two shapes, both wrong and both confident:
 *
 *   dist emptied first    → *"dist/sw.js is missing"* — it is missing because the build failed
 *   a previous dist left  → *"public/sw.js has no %ITC_VERSION% placeholder"* — it has one; the
 *                            stale copy on disk is the already-stamped output of the last build
 *
 * ⚠️ **The placeholder guard itself is unchanged and is not the thing being weakened here.** What
 * is asserted is that it only has an opinion when there is a bundle to have an opinion about. The
 * two directions are both below, because an early return that fires always is the same defect
 * pointing the other way: the stamp silently stops happening and the shipped worker keeps its
 * placeholders.
 */
describe('a build that failed says what failed', () => {
  /** The plugin's hooks, called directly. Vite's `Plugin` types them as object-or-function. */
  type Hooks = {
    configResolved: (config: { root: string; build: { outDir: string } }) => void;
    buildEnd: (error?: Error) => void;
    closeBundle: () => void;
  };
  const staged = (outDir: string): Hooks => {
    const plugin = stampBuildIdentity() as unknown as Hooks;
    plugin.configResolved({ root, build: { outDir } });
    return plugin;
  };

  it('says nothing about sw.js when the bundler already refused the source', () => {
    // THE case: a probe's `damage++` against a `const`. `dist/` is empty or stale, and the reader
    // needs the bundler's message rather than a complaint about a tracked file that is fine.
    const plugin = staged('no-such-directory');
    plugin.buildEnd(new Error('Build failed with 1 error: Unexpected re-assignment of const variable'));
    expect(() => plugin.closeBundle()).not.toThrow();
  });

  it('still fails a build whose bundle IS written and whose sw.js is not', () => {
    // The other direction, and the reason the early return is conditional rather than deleted: the
    // placeholder guard exists because a silent no-op ships a worker stamped with nothing.
    const plugin = staged('no-such-directory');
    plugin.buildEnd(undefined);
    expect(() => plugin.closeBundle()).toThrow(/sw\.js is missing/);
  });
});
