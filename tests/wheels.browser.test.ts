import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openHangar, shown } from './title.ts';
import { seedOnce } from './seed.ts';
import { HANGAR_KEY, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { RIM_KINDS } from '../src/content/rims.ts';
import { WARES } from '../src/content/wares.ts';
import { SCREENS } from '../src/state/screens.ts';

/**
 * THE WHEELS TURN, IN THE PAGE — `docs/decisions/0527-the-wheels-turn.md`.
 *
 * `tests/wheels.test.ts` holds the rule, the key and the turning in the frame. **What it cannot see is
 * the trip a player makes**: the spinners bought at Cosmo's, the third tab, fitted on Paint & Parts,
 * and the card there showing them turning over the car's own tyres.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

describe.runIf(chromePath)('0527 — the spinners are bought, fitted, and turn', () => {
  it('bought at Cosmo’s for 1000, fitted to the Firebird on Paint & Parts, turning on its card', async () => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    await seedOnce(context, HANGAR_KEY, serialiseHangar({ ...initialHangar, shards: 1000 }));
    const page = await context.newPage();
    await page.goto(dist);
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openHangar(page);

    const shop = prefixFor('shop');
    const parts = prefixFor('parts');
    await page.locator(`${shown('hangar')} .${prefixFor('hangar')}tab`, { hasText: SCREENS.shop.heading }).click();
    await page.waitForSelector(shown('shop'), { state: 'attached' });
    await page.locator(`${shown('shop')} [${SETTING_ATTR}="ware"] .${shop}option >> nth=${WARES.indexOf('spinner')}`).click();
    await page.locator(`${shown('shop')} .${shop}action`, { hasText: SCREENS.shop.actions[0]!.label }).click();
    const kept = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(kept.owned.spinner, 'Buy did not buy the spinners').toBe(true);
    expect(kept.shards).toBe(0);

    // The default pilot flies the Firebird; its wheels band offers the spinners now, and takes them.
    await page.locator(`${shown('shop')} .${shop}tab`, { hasText: SCREENS.parts.heading }).click();
    await page.waitForSelector(shown('parts'), { state: 'attached' });
    expect(await page.locator(`${shown('parts')} .${parts}pilot-wheel`).count(), 'turning wheels before any were fitted').toBe(0);
    await page.locator(`${shown('parts')} [${SETTING_ATTR}="rim"] .${parts}option >> nth=${RIM_KINDS.indexOf('spinner')}`).click();
    const fitted = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(fitted.rim.firebird, 'the spinners were not fitted').toBe('spinner');

    // Two wheels on the card, each turning — the stylesheet's animation running on both.
    const wheels = page.locator(`${shown('parts')} .${parts}pilot-wheel`);
    expect(await wheels.count(), 'the card does not show the spinners turning').toBe(2);
    const turning = await wheels.evaluateAll((els) => els.map((el) => getComputedStyle(el).animationName));
    expect(turning, 'a wheel on the card is not turning').toEqual(['itc-wheel-turn', 'itc-wheel-turn']);
    await context.close();
  });
});
