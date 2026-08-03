import { describe, it, expect, afterAll } from 'vitest';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { Browser } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';

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

  it.runIf(chromePath)('renders the title and version from brand.ts', async () => {
    // Gated on FINDING a browser, but LOUD about failing to launch one: past that gate, a silent
    // pass would mean the page was never opened.
    browser = await launchChromium({ headless: true });
    const page = await browser.newPage();
    const dist = resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html');
    await page.goto(pathToFileURL(dist).href);

    const { GAME_TITLE, APP_VERSION } = await import('../src/brand.ts');
    const text = await page.textContent('#app');
    expect(text).toContain(GAME_TITLE);
    expect(text).toContain(APP_VERSION);
  }, 60_000);
});
