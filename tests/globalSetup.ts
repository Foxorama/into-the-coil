import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { chromePath } from './chromium.ts';

/**
 * Build `dist/` ONCE, before any test file runs.
 *
 * Tests that assert things about the BUILT artifact are the only guard over everything the unit
 * suite is blind to — and in the predecessor project four of them ran `vite build` in their own
 * `beforeAll`. Vitest runs test files in parallel workers and the build is `emptyOutDir: true`, so
 * each of those builds **deleted `dist/` out from under whichever sibling was mid-read**. The
 * failure is a bare `ENOENT`/`ERR_FILE_NOT_FOUND`, it lands on a different test each time, and it
 * only fires when the timing lines up: CI ran the same commit twice and got one pass, one failure.
 * The files that read `dist` WITHOUT building it were relying on a sibling to build it first, which
 * is the same race seen from the other side.
 *
 * `globalSetup` runs once in the main process before the workers start, which is the only place
 * this can be done safely. Test files read `dist/`; none of them may build it. `tests/build.test.ts`
 * guards that rule.
 *
 * Invoked through `process.execPath` rather than `npx vite build`: it is the node already running
 * this process, so it needs nothing on PATH and behaves the same on every platform.
 */
export default function setup(): void {
  // On CI, a missing browser is a FAILURE, not a skip.
  //
  // The browser tests gate on `runIf(chromePath)` so a developer machine with no browser still
  // passes. On a runner that gate is a liability: it turns "the only test that drives the built
  // artifact never ran" into a green board, which is precisely the bug — fifty tests skipping for
  // months — that the whole Chromium lookup exists to prevent. Asserted HERE rather than as a
  // `runIf(CI)` test so it costs no permanent skip locally: the skip count stays 0 on any machine
  // with a browser, which keeps a jump in it meaningful.
  if (process.env.CI && !chromePath) {
    throw new Error(
      'globalSetup: no Chromium on this CI runner. The browser gate would skip silently and the ' +
        'build tests would report green having driven nothing. Set CHROME_PATH, or install a browser.',
    );
  }

  const root = fileURLToPath(new URL('..', import.meta.url));
  execFileSync(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'build'], {
    cwd: root,
    stdio: 'ignore',
  });
  if (!existsSync(resolve(root, 'dist/index.html'))) {
    throw new Error('globalSetup: `vite build` produced no dist/index.html — the build tests cannot run');
  }
}
