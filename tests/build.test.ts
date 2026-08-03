import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

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
