/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
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
 * The same values, for the consumers `define` cannot reach.
 *
 * `define` rewrites identifiers in the MODULE graph, and two surfaces are not in it. The boot
 * watchdog is a classic inline script that runs before the graph exists; the service worker is
 * copied out of `public/` verbatim and never sees the bundler at all. Both take placeholders that
 * this stamps at build time. Vite's own `%VITE_*%` mechanism is not used: it is scoped to
 * `VITE_`-prefixed env vars, and these come from package.json and git.
 *
 * ⚠️ A missing placeholder is a BUILD FAILURE, not a no-op. Silently doing nothing is the failure
 * mode of every string-replacement step — the day someone edits the watchdog and the placeholder
 * goes with it, the build keeps passing and the shipped page reports its version as whatever text
 * happened to survive. There is no value to fall back to that would be more honest than stopping.
 */
const ITC_VERSION = '%ITC_VERSION%';
const ITC_BUILD = '%ITC_BUILD%';

/** Which placeholders each stamped surface is REQUIRED to carry. Absence fails the build. */
const stamped = (tokens: Record<string, string>, text: string, where: string): string => {
  let out = text;
  for (const [token, value] of Object.entries(tokens)) {
    if (!out.includes(token)) {
      throw new Error(
        `vite: ${where} has no ${token} placeholder. It cannot import src/brand.ts, so this is the ` +
          'only way it learns which build it belongs to. Restore the placeholder, or remove this ' +
          'plugin along with the surface that needed it.',
      );
    }
    out = out.replaceAll(token, value);
  }
  return out;
};

/**
 * The one page this plugin is a demand about, as Vite's own path for it.
 *
 * ⚠️ **A PATH AND NOT A FILENAME, AND `npm run prove` IS WHY.** The first version compared
 * `resolve(ctx.filename)` against `resolve(config.root, 'index.html')` — which is correct here and
 * went RED in a probe worker, because a probe runs in a disposable copy under `os.tmpdir()`
 * (`docs/decisions/0054-the-proof-runs-beside-the-work-not-on-it.md`) and two absolute Windows paths
 * that name one file need not be the same string. `ctx.path` is a URL, it is `/index.html` in both
 * dev and build, and it has no machine in it.
 */
const SHIPPED_PAGE = '/index.html';

function stampBuildIdentity(): Plugin {
  let outDir = 'dist';
  return {
    name: 'itc-stamp-build-identity',
    configResolved(config) {
      // Resolved against the project root rather than `process.cwd()`: the tests invoke the build
      // through `process.execPath` from `tests/globalSetup.ts`, and a cwd-relative guess is the
      // kind of thing that works locally and writes to the wrong place on a runner.
      outDir = resolve(config.root, config.build.outDir);
    },
    // The watchdog needs the version only. It reports "which release is on screen"; the commit is
    // the module graph's job, and by the time the watchdog speaks the module graph is what failed.
    //
    // ⚠️ THE SHIPPED PAGE ONLY, and the narrowing is the point rather than an exemption. This hook
    // runs for every HTML the dev server touches, so the day a second page existed —
    // `rig/index.html`, docs/decisions/0126-the-dashboard-is-the-instrument.md — the throw above
    // fired on a page that is not a build surface and has no version to report. The demand on
    // index.html is unchanged and is still a hard failure; what moved is which files it is a demand
    // ABOUT. A dev-only page carrying a placeholder to keep a plugin quiet would be the version of
    // this that quietly stops meaning anything.
    transformIndexHtml(html, ctx) {
      if (ctx.path !== SHIPPED_PAGE) return html;
      return stamped({ [ITC_VERSION]: pkgVersion }, html, 'index.html');
    },
    /**
     * `public/` is COPIED, not transformed — no Vite hook sees its contents on the way through, so
     * the worker is rewritten where it lands. `closeBundle` is the first point at which the copy
     * is guaranteed to be on disk.
     *
     * The worker needs the COMMIT as well, and that is the load-bearing half: a byte-identical
     * `sw.js` is never re-installed by the browser, so a cache name stamped with the package
     * version alone would freeze the precached shell at whichever build first shipped that version.
     */
    closeBundle() {
      const sw = resolve(outDir, 'sw.js');
      if (!existsSync(sw)) {
        throw new Error(
          `vite: ${outDir}/sw.js is missing. public/sw.js is the offline shell and is expected to ` +
            'be copied verbatim into the build; if it was deliberately removed, remove this hook too.',
        );
      }
      writeFileSync(
        sw,
        stamped({ [ITC_VERSION]: pkgVersion, [ITC_BUILD]: buildId() }, readFileSync(sw, 'utf8'), 'public/sw.js'),
        'utf8',
      );
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
  plugins: [stampBuildIdentity(), viteSingleFile()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Build dist/ ONCE, in the main process, before any worker starts. A per-file build deletes
    // dist out from under a sibling's read — a race that only fires sometimes. See
    // tests/globalSetup.ts, and tests/build.test.ts which enforces the rule.
    globalSetup: ['tests/globalSetup.ts'],
  },
});
