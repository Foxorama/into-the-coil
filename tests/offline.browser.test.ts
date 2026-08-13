import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extname, resolve, sep } from 'node:path';
import type { Browser, BrowserContext, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';

/*
  ⚠️ FILE-LEVEL, because vitest's 5s default is not a browser test's timeout — see
  tests/orientation.browser.test.ts, where this was first hit, and the class fix that followed it.
  A browser test pays for a launch, a navigation and real frames; the FIRST one in a file pays for
  the launch on top of its own work. Locally that fits and on a cold CI runner it does not.

  Held for every *.browser.test.ts by tests/toolchain.test.ts, because fixing this one file at a
  time is exactly what happened the first time.
*/
vi.setConfig({ testTimeout: 60_000 });
import { GAME_TITLE } from '../src/brand.ts';

/**
 * The service worker, driven as shipped — over HTTP, because it cannot be driven any other way.
 *
 * Decision 0003 named this gap when it landed: single-file output fixed `file://` for the PAGE, and
 * could not fix it for a WORKER, which needs a secure context to register at all. `file://` is not
 * one. So `dist/` is served over `127.0.0.1` — which Chrome does treat as trustworthy — and the
 * worker installs, activates and intercepts exactly as it will in production.
 *
 * Everything here runs against `dist/`, never a re-typed copy. A worker re-written in a test file
 * passes forever while the real one ships something else, and this is the code that runs when the
 * player has no network and no way to tell anyone what happened.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = resolve(root, 'dist');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  // A worker served with the wrong MIME type is REJECTED by the browser, silently as far as the
  // page is concerned. Getting this wrong would look exactly like a worker that failed to install.
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

/**
 * `dist/` over HTTP, with production's cache headers and a switch that makes the origin vanish.
 *
 * "Offline" is a dropped connection rather than a stopped server: the port stays stable across
 * tests, and a destroyed socket is what a device with no network actually presents to `fetch` —
 * a rejected promise, which is the branch `public/sw.js` falls back from.
 */
let offline = false;
/** What `/sw.js` currently serves. Swapped mid-test to force the browser to see a new worker. */
let swBody: string | null = null;

function serveDist(): Server {
  return createServer((req, res) => {
    if (offline) {
      req.socket.destroy();
      return;
    }
    const path = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
    const rel = path === '/' ? 'index.html' : path.replace(/^\/+/, '');
    const file = resolve(dist, rel);
    // Never serve outside dist/, even from a throwaway test server.
    if (!file.startsWith(dist + sep) || !existsSync(file)) {
      res.writeHead(404).end('not found');
      return;
    }
    const body = rel === 'sw.js' && swBody !== null ? swBody : readFileSync(file);
    // Mirror `public/_headers`: the shell is revalidated, never served blind from the HTTP cache.
    // It also keeps the control case below honest — without it, Chrome could answer an offline
    // navigation out of its own cache and the worker would get credit for it.
    res.writeHead(200, {
      'Content-Type': MIME[extname(rel)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(body);
  });
}

interface BootState {
  booted: boolean;
  error: { kind: string; detail: string } | null;
}

describe.runIf(chromePath)('the app plays offline once it has been visited', () => {
  let server: Server;
  let origin: string;
  let browser: Browser;

  beforeAll(async () => {
    server = serveDist();
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
    // Past the "is there a browser" gate, failing to launch is LOUD — a silent pass here would mean
    // the worker was never installed by anything.
    browser = await launchChromium({ headless: true });
  }, 60_000);

  afterAll(async () => {
    offline = false;
    swBody = null;
    await browser?.close();
    server?.closeAllConnections();
    await new Promise<void>((done) => server?.close(() => done()));
  });

  /** A fresh, isolated profile: its own cache, its own workers, nothing inherited from a sibling. */
  async function visit(opts: Parameters<Browser['newContext']>[0] = {}): Promise<[BrowserContext, Page]> {
    const context = await browser.newContext(opts);
    return [context, await context.newPage()];
  }

  /**
   * How long any ONE call into the page may take before it is called a hang.
   *
   * ⚠️ **Generous against what the work costs and strict against for ever, which is the only pair of
   * bounds that matter here.** The whole test runs in about seven seconds locally, so a single
   * `caches.keys()` taking ten is already pathological — and the number is not tuning, it is the
   * difference between a diagnostic and vitest's bare *Test timed out in 60000ms*.
   */
  const POLL_MS = 10_000;

  /** Waits until a worker is not merely registered but actually in control of this page. */
  async function waitForController(page: Page): Promise<void> {
    await page.waitForFunction('navigator.serviceWorker.controller !== null', null, { timeout: 20_000 });
  }

  /**
   * The same await, with a bound on it.
   *
   * ── A DEADLINE CHECKED BETWEEN UNBOUNDED AWAITS IS NOT A DEADLINE ──────────────────────────────
   *
   * ⚠️ **`docs/decisions/0139-a-deadline-between-unbounded-awaits.md`.** `page.evaluate` has **no
   * timeout of its own** — it is not covered by Playwright's default, unlike `waitForFunction` and
   * the locator actions — so every `await` below could hang for ever and the twenty-second budget
   * beside it would never be reached to be checked. What that produced in CI was the whole suite
   * dying on vitest's 60-second timeout with no diagnostic at all, on a test that takes **7 seconds**
   * locally: an 8× margin cannot be exhausted by slowness, only by something not returning.
   *
   * ⚠️ **AND A SERVICE WORKER IS EXACTLY THE THING THAT CAN NOT RETURN.** `activate` can hold the
   * page's task queue while it sweeps caches, and `update()` fetches the worker over the network —
   * so the two places this file waits are the two places a hang is plausible.
   */
  function within<T>(what: string, ms: number, work: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    const bell = new Promise<never>((_, fail) => {
      timer = setTimeout(() => fail(new Error(`${what} did not answer within ${ms}ms — it hung rather than failed`)), ms);
    });
    return Promise.race([work, bell]).finally(() => clearTimeout(timer)) as Promise<T>;
  }

  /**
   * Polls Cache Storage from HERE, rather than passing an async predicate to `waitForFunction`.
   *
   * ⚠️ `page.waitForFunction` does not await a promise its predicate returns — and a `Promise` is
   * truthy, so `caches.keys().then(…)` as a predicate succeeds on the first poll regardless of what
   * it would eventually have resolved to. That reads as a passing wait followed by an inexplicable
   * assertion failure, which is precisely how it presented.
   *
   * Returns the last keys seen either way, so a timeout produces the real diagnostic instead of a
   * bare "timed out".
   *
   * ⚠️ **EACH POLL IS BOUNDED AS WELL AS THE LOOP** — 0139. The whole budget is what it always was;
   * what changed is that a single poll can no longer eat all of it and then some.
   */
  async function cacheKeysUntil(page: Page, done: (keys: string[]) => boolean, ms = 20_000): Promise<string[]> {
    const deadline = Date.now() + ms;
    for (;;) {
      const keys = (await within('caches.keys()', POLL_MS, page.evaluate('caches.keys()'))) as string[];
      if (done(keys) || Date.now() > deadline) return keys;
      await page.waitForTimeout(100);
    }
  }

  it('registers a worker that takes control of the page', async () => {
    const [context, page] = await visit();
    try {
      await page.goto(origin);
      await page.waitForFunction('window.__ITC_BOOT__ && window.__ITC_BOOT__.booted', null, { timeout: 15_000 });
      await waitForController(page);
      const keys = (await page.evaluate('caches.keys()')) as string[];
      expect(keys.filter((k) => k.startsWith('into-the-coil-'))).toHaveLength(1);
    } finally {
      await context.close();
    }
  }, 60_000);

  /**
   * THE assertion the worker exists for. The origin is gone and the page still starts.
   */
  it('boots with the origin unreachable', async () => {
    const [context, page] = await visit();
    try {
      await page.goto(origin);
      await waitForController(page);
      // The precache runs inside `install`, so an active worker has already finished it.

      offline = true;
      await page.reload();
      await page.waitForFunction('window.__ITC_BOOT__ && window.__ITC_BOOT__.booted', null, { timeout: 15_000 });

      const state = (await page.evaluate('window.__ITC_BOOT__')) as BootState;
      expect(state.error, 'the offline page reported a boot failure').toBeNull();
      // The page mounts a canvas rather than text, so the brand arrives as its accessible name —
      // see the note in `tests/boot.browser.test.ts`. The claim is unchanged: the module graph
      // evaluated and `brand.ts` reached the rendered page, with the origin unreachable.
      expect(await page.getAttribute('#app canvas', 'aria-label')).toContain(GAME_TITLE);
    } finally {
      offline = false;
      await context.close();
    }
  }, 60_000);

  /**
   * THE CONTROL, and without it the test above proves nothing.
   *
   * An offline navigation that succeeds is only evidence about the worker if the same navigation
   * fails without one. A fresh context has its own empty HTTP cache and — with workers blocked —
   * no other way to answer, so this is the same URL under the same conditions with the one variable
   * removed. Decision 0005: a guard that has only ever been green is not known to work.
   */
  it('and would NOT boot offline without it', async () => {
    const [context, page] = await visit({ serviceWorkers: 'block' });
    try {
      offline = true;
      await expect(page.goto(origin), 'the page loaded offline with no worker — the test above is proving nothing').rejects.toThrow();
    } finally {
      offline = false;
      await context.close();
    }
  }, 60_000);

  /**
   * The sweep in `activate`, watched doing both halves of its job on a shared origin.
   *
   * This is what the predecessor got wrong in the other direction: its page deleted every cache on
   * the origin that was not its own. On itch.io — where every HTML game is served from
   * `html-classic.itch.zone` — that is one game deleting another game's offline copy on every boot.
   * See docs/decisions/0009-the-page-does-not-sweep-foreign-caches.md.
   */
  it('retires its own stale cache and leaves a stranger’s alone', async () => {
    const [context, page] = await visit();
    try {
      await page.goto(origin);
      await waitForController(page);

      await page.evaluate(`Promise.all([
        caches.open('into-the-coil-0.0.1+stale'),
        caches.open('some-other-game-v3'),
      ])`);

      /*
        Stand a NEXT RELEASE up in front of the browser. A worker is only re-installed when its
        bytes change — which is the entire reason the cache name carries the commit and not just the
        package version — so the stamped tail is what moves here. The PREFIX deliberately does not:
        changing that would make the new worker sweep a different namespace and the test would pass
        while proving nothing about retiring its own.
      */
      swBody = readFileSync(resolve(dist, 'sw.js'), 'utf8').replace(/PREFIX \+ '[^']*'/, "PREFIX + 'next'");
      /*
        ⚠️ **BOUNDED, BECAUSE `update()` GOES TO THE NETWORK** — 0139. It re-fetches the worker from
        the origin this suite is itself serving, and an unbounded await on a fetch is the other place
        this test could stop rather than fail.
      */
      await within(
        'serviceWorker.update()',
        POLL_MS,
        page.evaluate('navigator.serviceWorker.getRegistration().then((r) => r.update())'),
      );

      /*
        Wait for the SWEEP, not for the new cache. The new cache appears during `install`, which
        runs before `activate` — waiting on it lands mid-update and reads the old worker's state,
        which is what made the first version of this test fail against a worker that was working
        correctly. The sweep's own post-condition is the only signal that `activate` has finished:
        exactly one cache under our prefix, and it is the new one.
      */
      const keys = await cacheKeysUntil(page, (ks) => {
        const ours = ks.filter((k) => k.startsWith('into-the-coil-'));
        return ours.length === 1 && ours[0] === 'into-the-coil-next';
      });
      expect(keys, 'the worker kept a stale cache of its own').not.toContain('into-the-coil-0.0.1+stale');
      // THE assertion this test exists for. On itch.io every HTML game shares one origin, so a
      // sweep that deletes what it did not create is one game deleting another game's offline copy.
      expect(keys, 'the worker deleted a cache belonging to another app on this origin').toContain('some-other-game-v3');
    } finally {
      swBody = null;
      await context.close();
    }
  }, 60_000);
});
