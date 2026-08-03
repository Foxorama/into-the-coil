import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { APP_VERSION, BUILD_ID, GAME_TITLE } from '../src/brand.ts';

/**
 * Product identity guards.
 *
 * `src/brand.ts` is the one place the name and version are written — but the interesting half is
 * the surfaces that CANNOT read it. `index.html` runs before any module and cannot import, so its
 * `<title>` is a second spelling of the name by necessity. A constant cannot fix that; only a test
 * can. This is that test, and it is why `brand.ts` landing without it was half a job.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

/**
 * Everything the build emitted, as one string.
 *
 * Two files today (the html and one hashed chunk). When `vite-plugin-singlefile` lands in
 * SHELL & IDENTITY this collapses to `dist/index.html` alone — the assertions below do not care
 * which, and should not have to be rewritten when that happens.
 */
function distText(): string {
  const assets = resolve(root, 'dist/assets');
  const files = [resolve(root, 'dist/index.html')];
  if (existsSync(assets)) {
    for (const f of readdirSync(assets)) if (f.endsWith('.js')) files.push(resolve(assets, f));
  }
  return files.map((f) => readFileSync(f, 'utf8')).join('\n');
}

describe('the product name is single-sourced', () => {
  it('brand.ts exposes a clean title and a real version', () => {
    expect(GAME_TITLE.trim()).toBe(GAME_TITLE);
    expect(GAME_TITLE.length).toBeGreaterThan(0);
    // Either a real version from package.json, or the honest dev marker — never a silent blank.
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+(-\w+)?$/);
  });

  it('the shipped version tracks package.json', () => {
    const pkg = JSON.parse(read('package.json')) as { version: string };
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg.version).not.toBe('0.0.0');
    // `define` is on the shared vite config, so vitest substitutes it here too — this is the real
    // injected value, not the fallback.
    expect(APP_VERSION).toBe(pkg.version);
  });

  /**
   * THE load-bearing assertion at this phase.
   *
   * `index.html` cannot import `brand.ts`, so the title is written twice. In the predecessor a
   * rename moved five surfaces and missed the sixth, which kept shipping the old name — and that
   * one was a native resource no constant could ever have reached, exactly like this one.
   */
  it("index.html's <title> agrees with brand.ts", () => {
    const html = read('index.html');
    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1];
    expect(title, 'index.html has no <title>').toBeTruthy();
    expect(title, 'index.html spells the product name differently from src/brand.ts').toBe(GAME_TITLE);
  });
});

describe('the identity reaches the built artifact', () => {
  it('the bundle carries the title and the version, not a placeholder', () => {
    const out = distText();
    expect(out).toContain(GAME_TITLE);
    expect(out, 'the version define shipped unsubstituted').not.toContain('__APP_VERSION__');
    expect(out).toContain(APP_VERSION);
  });

  it('the bundle carries the COMMIT, not just the release', () => {
    // A version answers "which release"; only the commit answers "is this the build you just
    // deployed". Shape first, so a `dev` fallback is still a legible answer rather than a blank.
    expect(BUILD_ID).toMatch(/^([0-9a-f]{7}|dev)$/);
    const sha = execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8' }).trim();
    expect(distText(), `the built bundle must carry the commit it was built from (${sha})`).toContain(sha);
  });

  it('vite.config.ts is where both injections are declared', () => {
    const cfg = read('vite.config.ts');
    expect(cfg).toContain('__APP_VERSION__');
    expect(cfg).toContain('__BUILD_ID__');
  });
});
