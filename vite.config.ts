/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The shipped version, single-sourced from package.json and injected as `__APP_VERSION__`, which
// `src/brand.ts` reads once the module bundle evaluates. Read via fs rather than
// `import pkg from './package.json'` so this config stays a plain ESM module with no
// import-assertion syntax to trip over.
//
// A SECOND injection path is coming and is deliberately not here yet: the boot watchdog in
// index.html runs before any module and cannot import, so it needs a `%ITC_VERSION%` placeholder
// substituted by `transformIndexHtml`. That lands with the watchdog itself, in SHELL & IDENTITY —
// a substitution with nothing to substitute would be untested code arriving before its consumer.
const pkgVersion = (
  JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }
).version;

/**
 * WHICH BUILD IS THIS, not which release.
 *
 * `APP_VERSION` cannot answer "is this the build I just deployed" — it only moves when package.json
 * does. The commit always moves. CI hands it over in an env var; a local build asks git; anything
 * else is honestly labelled `dev` rather than guessing.
 */
function buildId(): string {
  const fromEnv = process.env.GITHUB_SHA ?? process.env.CF_PAGES_COMMIT_SHA;
  if (fromEnv) return fromEnv.slice(0, 7);
  try {
    return execSync('git rev-parse --short=7 HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'dev';
  }
}

// Relative, so the built page does not care which path it is served from. Overridable for hosts
// that need an absolute base.
const base = process.env.VITE_BASE ?? './';

export default defineConfig({
  base,
  build: {
    // Down-level modern syntax (??, ?., object spread, …) so the bundle PARSES on older
    // module-capable engines — some mobile WebViews support ES modules but not 2020-era syntax,
    // and a parse failure is a blank page with no error anywhere.
    target: 'es2017',
  },
  define: { __APP_VERSION__: JSON.stringify(pkgVersion), __BUILD_ID__: JSON.stringify(buildId()) },
  // Inline the whole bundle into one self-contained index.html.
  //
  // Not a tidiness preference — it is what makes the built page loadable at all off a bare file
  // path. An EXTERNAL module script is a cross-origin request, and Chrome blocks it under
  // `file://`: the page renders, the module never runs, and you get a blank div with the error
  // only in the console. That is precisely the failure the browser test found the moment it was
  // written, and it is the same shape as the predecessor's Pages white-screens (404 / CDN
  // index-asset skew / service-worker interception). With no external asset there is nothing to
  // block and nothing to 404.
  plugins: [viteSingleFile()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Build dist/ ONCE, in the main process, before any worker starts. A per-file build deletes
    // dist out from under a sibling's read — a race that only fires sometimes. See
    // tests/globalSetup.ts, and tests/build.test.ts which enforces the rule.
    globalSetup: ['tests/globalSetup.ts'],
  },
});
