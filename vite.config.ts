/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The shipped version, single-sourced from package.json and injected as `__APP_VERSION__`, which
// `src/brand.ts` reads once the module bundle evaluates. Read via fs rather than
// `import pkg from './package.json'` so this config stays a plain ESM module with no
// import-assertion syntax to trip over.
//
// The SECOND injection path is `ITC_VERSION` below: the boot watchdog in index.html runs before
// any module and cannot import, so `define` can never reach it.
const pkgVersion = (
  JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }
).version;

/**
 * The same version, for the one consumer `define` cannot reach.
 *
 * `define` rewrites identifiers in the MODULE graph. The boot watchdog is a classic inline script
 * that runs before that graph exists, so it takes a placeholder that this substitutes in the HTML
 * itself. Vite's own `%VITE_*%` mechanism is not used: it is scoped to `VITE_`-prefixed env vars,
 * and this version comes from package.json.
 *
 * ⚠️ Missing placeholder is a BUILD FAILURE, not a no-op. A silent substitution is the failure
 * mode of every string-replacement step — the day someone edits the watchdog and the placeholder
 * goes with it, the build keeps passing and the shipped page reports its version as whatever text
 * happened to survive. There is no version to fall back to that would be more honest than
 * stopping.
 */
const ITC_VERSION = '%ITC_VERSION%';
function substituteWatchdogVersion(): Plugin {
  return {
    name: 'itc-watchdog-version',
    transformIndexHtml(html) {
      if (!html.includes(ITC_VERSION)) {
        throw new Error(
          `vite: index.html has no ${ITC_VERSION} placeholder. The boot watchdog cannot import ` +
            'src/brand.ts, so this is the only way it learns which version it is reporting on. ' +
            'Restore the placeholder, or remove this plugin along with the watchdog.',
        );
      }
      return html.replaceAll(ITC_VERSION, pkgVersion);
    },
  };
}

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
  plugins: [substituteWatchdogVersion(), viteSingleFile()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Build dist/ ONCE, in the main process, before any worker starts. A per-file build deletes
    // dist out from under a sibling's read — a race that only fires sometimes. See
    // tests/globalSetup.ts, and tests/build.test.ts which enforces the rule.
    globalSetup: ['tests/globalSetup.ts'],
  },
});
