import { describe, it, expect, afterAll, vi } from 'vitest';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { Browser } from 'playwright-core';
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
 * The one browser test at this phase, and the reason the Chromium lookup is here at all.
 *
 * A lookup with no caller cannot be known to work — which is the same shape as the failure it
 * exists to prevent, where fifty browser tests found no browser and reported green by skipping.
 * So this asserts the smallest true thing about the built page: it loads, the module graph
 * evaluates, and the identity from `src/brand.ts` is on screen.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes. If this
 * starts skipping on a machine that has Chrome, the gate has broken, not the app.
 */
describe('the built page boots', () => {
  let browser: Browser | undefined;
  afterAll(async () => {
    await browser?.close();
  });

  /**
   * ⚠️ THIS ASSERTION MOVED SURFACE, AND DID NOT WEAKEN.
   *
   * It used to read `#app`'s text, because the page's whole content was a line of text. The page now
   * mounts a canvas, so there is no text to read — and the claim being made was never about text. It
   * was, and still is: **the module graph evaluated in a real browser, and `brand.ts` reached the
   * rendered page.** The brand now arrives as the canvas's accessible name, so that is where it is
   * read from. `tests/frame.browser.test.ts` asserts the canvas then actually paints.
   *
   * If this is ever tempting to delete, note what it costs: `tests/brand.test.ts` greps `dist/` and
   * would still pass against a bundle that throws on line one.
   */
  it.runIf(chromePath)('renders the title and version from brand.ts', async () => {
    // Gated on FINDING a browser, but LOUD about failing to launch one: past that gate, a silent
    // pass would mean the page was never opened.
    browser = await launchChromium({ headless: true });
    const page = await browser.newPage();
    const dist = resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html');
    await page.goto(pathToFileURL(dist).href);

    const { GAME_TITLE, APP_VERSION } = await import('../src/brand.ts');
    const label = await page.getAttribute('#app canvas', 'aria-label');
    expect(label, 'the game did not mount, or mounted without an accessible name').not.toBe(null);
    expect(label).toContain(GAME_TITLE);
    expect(label).toContain(APP_VERSION);
  }, 60_000);
});
