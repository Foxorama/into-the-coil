import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/**
 * The shipped shell: what the build emits, and what the boot watchdog is promised to be.
 *
 * The behavioural half of the watchdog contract — that it actually catches what it claims to —
 * needs a browser and lives in `tests/watchdog.browser.test.ts`. What is asserted here is the
 * shape the browser cannot see: that the watchdog is present, is first, and shipped with its
 * placeholder filled in.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

/** Every file the build emitted, relative to `dist/`. */
function distFiles(dir = 'dist', prefix = ''): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(resolve(root, dir))) {
    const rel = prefix ? `${prefix}/${entry}` : entry;
    if (statSync(resolve(root, dir, entry)).isDirectory()) out.push(...distFiles(`${dir}/${entry}`, rel));
    else out.push(rel);
  }
  return out;
}

describe('the build emits one self-contained file', () => {
  /**
   * Decision 0003, enforced. The rule is not tidiness: an EXTERNAL module script is a cross-origin
   * request that Chrome blocks under `file://`, so the page renders, the module never evaluates,
   * and the only evidence is a console error. It is also the whole 404 class the predecessor paid
   * for repeatedly — hashed-asset misses, CDN index/asset skew, a service worker serving a stale
   * pair. With no external asset there is nothing to 404 and nothing to block.
   */
  it('dist/ is index.html and nothing else', () => {
    expect(distFiles()).toEqual(['index.html']);
  });

  it('the shipped page references no external script or stylesheet', () => {
    const html = read('dist/index.html');
    const external = [
      ...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi),
      ...html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["']/gi),
    ].map((m) => m[1]);
    expect(external, `the build emitted a page that loads ${external.join(', ')} over the network`).toEqual([]);
  });
});

describe('the boot watchdog is where it has to be', () => {
  /**
   * Position IS the contract. A watchdog after the module script cannot catch that script failing
   * to load, and a watchdog inside a module cannot run at all when the module graph is what broke.
   */
  it('runs before the module script, in the source page', () => {
    const html = read('index.html');
    const watchdog = html.indexOf('__ITC_BOOT__');
    const moduleScript = html.indexOf('<script type="module"');
    expect(watchdog, 'index.html has no boot watchdog').toBeGreaterThan(-1);
    expect(moduleScript).toBeGreaterThan(-1);
    expect(watchdog, 'the watchdog must be registered before the module script it guards').toBeLessThan(
      moduleScript,
    );
  });

  it('is a classic script, so no bundler can transpile or defer it', () => {
    const html = read('index.html');
    const tag = /<script(?![^>]*\btype=)[^>]*>/.exec(html.slice(0, html.indexOf('__ITC_BOOT__')));
    expect(tag, 'the watchdog must be a plain <script> — a module is deferred and cannot guard the boot').toBeTruthy();
  });

  /**
   * The watchdog cannot import `src/brand.ts`, so the version arrives by string substitution — and
   * a string substitution that silently does nothing looks exactly like one that worked.
   */
  it('ships with its version placeholder substituted', () => {
    expect(read('index.html'), 'the source page must carry the placeholder').toContain('%ITC_VERSION%');
    const built = read('dist/index.html');
    const pkg = JSON.parse(read('package.json')) as { version: string };
    expect(built, 'the placeholder shipped unsubstituted').not.toContain('%ITC_VERSION%');
    expect(built).toContain(pkg.version);
  });
});
