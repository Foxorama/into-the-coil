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
  /**
   * ⚠️ THE BUILD'S OWN ERROR IS CAPTURED RATHER THAN DISCARDED, AND THAT IS THE POINT OF THE `try`.
   *
   * This was `stdio: 'ignore'`, which is quiet on success and silent on failure — so a tree that did
   * not compile threw `Command failed: …vite.js build` and nothing else, naming no file and no line.
   * `npm run prove` applies breaks that sometimes do not compile, and the one that did cost a
   * debugging cycle to place: `docs/decisions/0409-a-failed-build-says-what-failed.md`.
   *
   * `'pipe'` is just as quiet on the happy path — the output goes to the error object rather than to
   * the console — so the diagnostic costs nothing on every other run.
   */
  try {
    execFileSync(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'build'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      /**
       * ⚠️ NODE_ENV IS EXPLICIT, AND THIS IS NOT DEFENSIVE TIDINESS.
       *
       * Vitest sets `NODE_ENV=test` in its own process, `execFileSync` inherits the environment, and
       * Vite honours an already-set `NODE_ENV` rather than forcing `production` — so this build
       * produced `import.meta.env.PROD === false`, and every `PROD`-guarded branch was eliminated
       * from the bundle. The service-worker registration in `src/main.ts` is one, and it vanished.
       *
       * That is the worst shape a test rig can have: the suite goes green against an artifact that
       * is NOT the artifact that ships, and it is silent about the difference. Found by the offline
       * test, which could not explain why no worker ever took control; `tests/shell.test.ts` now
       * asserts the registration survives into `dist/`, so the next occurrence fails loudly instead.
       */
      env: { ...process.env, NODE_ENV: 'production' },
    });
  } catch (e) {
    const spawned = e as { stdout?: Buffer | string | null; stderr?: Buffer | string | null };
    throw new Error(
      'globalSetup: the build failed, so NOT ONE TEST IN THIS RUN COULD START. This is not a test ' +
        'failure and it is not a guard that stopped firing.\n' +
        'If a probe is applied, LOOK AT THE PROBE: a break that does not compile fails here, and ' +
        'nothing runs, and `npm run prove` reports that as NO SUCH GUARD.\n' +
        `${String(spawned.stdout ?? '')}${String(spawned.stderr ?? '')}`,
    );
  }
  if (!existsSync(resolve(root, 'dist/index.html'))) {
    throw new Error('globalSetup: `vite build` produced no dist/index.html — the build tests cannot run');
  }
}
