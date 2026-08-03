/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

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
  define: { __APP_VERSION__: JSON.stringify(pkgVersion) },
});
