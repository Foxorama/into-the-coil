import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
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

/**
 * The boot watchdog's error-capture contract, driven in a real browser.
 *
 * The watchdog is tested AS SHIPPED: the script below is lifted out of `dist/index.html`, not
 * re-typed here. A copy of the watchdog in the test file would pass forever while the real page
 * shipped something else — which is the exact failure shape decision 0005 is about, in the exact
 * place it costs the most, since this code only ever runs when everything else has already
 * failed.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

const root = fileURLToPath(new URL('..', import.meta.url));

/** The watchdog, as the build emitted it: the one classic `<script>` that defines the latch. */
function shippedWatchdog(): string {
  const html = readFileSync(resolve(root, 'dist/index.html'), 'utf8');
  for (const m of html.matchAll(/<script(?![^>]*\btype=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (m[1]?.includes('__ITC_BOOT__')) return m[1];
  }
  throw new Error('dist/index.html has no classic <script> defining __ITC_BOOT__ — the watchdog is not shipping');
}

const fixtures = mkdtempSync(join(tmpdir(), 'itc-watchdog-'));

interface Fixture {
  url: string;
  limitMs: number;
}

/**
 * A page that is the shipped watchdog plus whatever is being asked to fail in front of it.
 *
 * `limitMs` drives the watchdog's boot limit down from the shipped 8s so the timeout path is
 * testable in the time a test is allowed to take.
 *
 * ⚠️ IT CANNOT GO MUCH LOWER THAN THIS, and 100ms — what it used to be — was too low. The watchdog
 * latches the FIRST failure, so every fixture expecting a specific error is racing its own boot
 * limit: a `<script type="module">` is deferred until the document has parsed, and on a loaded CI
 * runner that took longer than 100ms. The timeout then latched first and `stays silent when
 * something failed but the app booted anyway` reported `timeout` where it expected `resource` —
 * intermittently, and only on CI. The limit is returned alongside the URL so the settle below cannot
 * drift out of agreement with it.
 */
function fixture(name: string, contents: string, limitMs = 800): Fixture {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <script>window.__ITC_BOOT_LIMIT_MS__ = ${limitMs};</script>
    <script>${shippedWatchdog()}</script>
  </head>
  <body>
    <div id="app"></div>
${contents}
  </body>
</html>
`;
  const path = join(fixtures, `${name}.html`);
  writeFileSync(path, html, 'utf8');
  return { url: pathToFileURL(path).href, limitMs };
}

interface BootState {
  marker: string;
  version: string;
  booted: boolean;
  error: { kind: string; detail: string } | null;
}

describe.runIf(chromePath)('the boot watchdog catches what it claims to', () => {
  let browser: Browser | undefined;
  let page: Page | undefined;

  beforeAll(async () => {
    // Past the "is there a browser" gate, failing to launch is LOUD: a silent pass here would
    // mean the watchdog was never opened by anything.
    browser = await launchChromium({ headless: true });
  }, 60_000);

  afterAll(async () => {
    await browser?.close();
  });

  /**
   * Opens the fixture and waits for the watchdog to reach a verdict, then reports its state.
   *
   * `until` defaults to "something happened". A test whose subject is the interaction between two
   * signals must say so — sampling on the first of them arriving reads a half-finished state.
   */
  async function boot(f: Fixture, until = 'window.__ITC_BOOT__ && (window.__ITC_BOOT__.error || window.__ITC_BOOT__.booted)'): Promise<BootState> {
    page = await browser!.newPage();
    await page.goto(f.url);
    await page.waitForFunction(until, null, { timeout: 10_000 }).catch(() => undefined);
    // Settle PAST the boot limit, so the grace period has certainly run and the panel — or its
    // deliberate absence — is final. Derived from the fixture rather than a constant, because the
    // two silently disagreeing is what made this file flaky.
    await page.waitForTimeout(f.limitMs + 300);
    return (await page.evaluate('window.__ITC_BOOT__')) as BootState;
  }

  const panelText = async (): Promise<string | null> => page!.textContent('#app');

  it('catches a module that throws at import time', async () => {
    const state = await boot(
      fixture('throws', `<script type="module">throw new Error('boom from the module graph')</script>`),
    );
    expect(state.error?.kind).toBe('throw');
    expect(state.error?.detail).toContain('boom from the module graph');
    expect(await panelText()).toContain(state.marker);
  });

  /**
   * The assertion that pays for the whole file.
   *
   * A failed script/link/img load fires `error` on the ELEMENT and does not bubble, so only a
   * capture-phase listener sees it. Drop that one argument and every other test here still
   * passes — while the watchdog goes blind to the 404 that white-screened the predecessor.
   */
  it('catches a resource that never loads', async () => {
    const state = await boot(fixture('missing', `<script src="./does-not-exist.js"></script>`));
    expect(state.error?.kind).toBe('resource');
    expect(state.error?.detail).toContain('does-not-exist.js');
  });

  it('catches an unhandled rejection', async () => {
    const state = await boot(
      fixture('rejects', `<script type="module">Promise.reject(new Error('nobody caught this'))</script>`),
    );
    expect(state.error?.kind).toBe('rejection');
    expect(state.error?.detail).toContain('nobody caught this');
  });

  /**
   * The blank page with no event behind it — a module blocked by CORS, or a bundle the engine
   * refuses to parse. Nothing has failed that anything can observe; what is observable is that
   * nothing has succeeded.
   */
  it('reports a page that never boots at all, with no error to go on', async () => {
    const state = await boot(fixture('silent', '<!-- no module script at all -->'));
    expect(state.error?.kind).toBe('timeout');
    expect(state.booted).toBe(false);
    expect(await panelText()).toContain(state.marker);
  });

  it('latches the FIRST failure — the cause, not the cascade it set off', async () => {
    const state = await boot(
      fixture(
        'cascade',
        `<script src="./first-failure.js"></script>
     <script type="module">throw new Error('the consequence')</script>`,
      ),
    );
    expect(state.error?.kind).toBe('resource');
    expect(state.error?.detail).toContain('first-failure.js');
  });

  /**
   * RECORDING a failure is not DECLARING one. A decorative asset can 404 and the app still starts
   * perfectly well; painting a full-page diagnostic over a working game would make the watchdog
   * the worst thing on the page.
   */
  it('stays silent when something failed but the app booted anyway', async () => {
    const state = await boot(
      fixture(
        'survivable',
        `<script src="./decorative.js"></script>
     <script type="module">window.__ITC_BOOT__.ok()</script>`,
      ),
      // BOTH signals, explicitly. This test is about what happens when a failure and a successful
      // boot coexist, so waiting for "either" samples whichever won and asserts against the other.
      'window.__ITC_BOOT__ && window.__ITC_BOOT__.error && window.__ITC_BOOT__.booted',
    );
    expect(state.error?.kind, 'the failure is still recorded').toBe('resource');
    expect(state.booted).toBe(true);
    expect(await panelText(), 'the app booted — the watchdog must not paint over it').not.toContain(state.marker);
  });

  it('the real built page boots clean, and says so', async () => {
    page = await browser!.newPage();
    await page.goto(pathToFileURL(resolve(root, 'dist/index.html')).href);
    await page.waitForFunction('window.__ITC_BOOT__ && window.__ITC_BOOT__.booted', null, { timeout: 10_000 });
    const state = (await page.evaluate('window.__ITC_BOOT__')) as BootState;
    expect(state.error, 'the shipped page reported a boot failure').toBeNull();
    // The version the watchdog would quote in a bug report is the one that was built, not a
    // placeholder that survived the substitution.
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as { version: string };
    expect(state.version).toBe(pkg.version);
  }, 30_000);
});
