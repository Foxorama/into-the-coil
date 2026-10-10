import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { back, fly, openHangar, pickWare, shown } from './title.ts';
import { seeded } from './seed.ts';
import { HANGAR_KEY, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { FLAME_KINDS } from '../src/content/flames.ts';
import { OWNABLES } from '../src/content/wares.ts';
import { SCREENS } from '../src/state/screens.ts';

/**
 * THE IONS BURN BLUE, IN THE PICTURE — `docs/decisions/0530-the-ions-burn-blue.md`.
 *
 * `tests/flames.test.ts` holds the trade and the ink. **What it cannot see is the flame the run burns**:
 * the exhaust is one set of sprites in the atlas, baked again when the flying ship's flame changes, and
 * nothing in the page names it. So this reads the PIXELS (0027): the ship's tail on the game's canvas, in
 * a run on the thrusters bought and fitted — the whole canvas, since the burn carries the ship across it — against the same flight on the standard flame.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 150_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

/**
 * How many of the canvas's pixels are the ion's royal blue — blue far over both red and
 * green, which the cyan of the player, the frost and the sky never are.
 */
async function royalBlue(page: Page): Promise<number> {
  return page.evaluate(() => {
    const canvas = document.querySelector('#app canvas') as HTMLCanvasElement;
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    const ctx = copy.getContext('2d')!;
    ctx.drawImage(canvas, 0, 0);
    const { data } = ctx.getImageData(0, 0, copy.width, copy.height);
    let count = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i + 2]! > 150 && data[i + 2]! - data[i + 1]! > 90 && data[i + 2]! - data[i]! > 90) count++;
    return count;
  });
}

/** A page on the hangar, with `shards` held. */
async function opened(shards: number): Promise<{ page: Page; close: () => Promise<void> }> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await seeded(context, dist, HANGAR_KEY, serialiseHangar({ ...initialHangar, shards }));
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  await openHangar(page);
  return { page, close: () => context.close() };
}

/** Fly, hold the burn so the flame is at its longest, and read the tail. */
async function flown(page: Page): Promise<number> {
  await fly(page);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(500);
  const count = await royalBlue(page);
  await page.keyboard.up('ArrowRight');
  return count;
}

describe.runIf(chromePath)('0530 — the thrusters bought and fitted burn blue in the run', () => {
  it('bought at Cosmo’s for 400, fitted on Paint & Parts, and the run’s flame is royal blue where the standard’s is not', async () => {
    const standard = await opened(0);
    await back(standard.page, 'hangar');
    const before = await flown(standard.page);
    await standard.close();

    // 0585: the price risen.
    const { page, close } = await opened(OWNABLES.ion.price ?? 0);
    const shop = prefixFor('shop');
    const parts = prefixFor('parts');
    await page.locator(`${shown('hangar')} .${prefixFor('hangar')}tab`, { hasText: SCREENS.shop.heading }).click();
    await page.waitForSelector(shown('shop'), { state: 'attached' });
    // 0542: tried on before it is bought — the thrusters in Cosmo's window burn blue under the ship on its pad.
    const bare = await royalBlue(page);
    await pickWare(page, 'ion');
    await page.waitForTimeout(400);
    const tried = await royalBlue(page);
    expect(tried, `the thrusters in the window do not burn on the pad: ${tried} royal-blue pixels, against ${bare} before`).toBeGreaterThan(Math.max(4 * bare, 40));
    await page.locator(`${shown('shop')} .${shop}choices .${shop}action >> nth=0`).click();
    // 0564: and the sheet's Buy, which is the one that buys.
    await page.locator(`.${shop}ask .${shop}action`, { hasText: SCREENS.shop.actions[0]!.label }).click();
    await page.locator(`${shown('shop')} .${shop}tab`, { hasText: SCREENS.parts.heading }).click();
    await page.waitForSelector(shown('parts'), { state: 'attached' });
    await page.locator(`${shown('parts')} [${SETTING_ATTR}="flame"] .${parts}option >> nth=${FLAME_KINDS.indexOf('ion')}`).dispatchEvent('click');
    const kept = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(kept.flame.firebird, 'the thrusters were not fitted').toBe('ion');
    await back(page, 'parts');
    const after = await flown(page);
    await close();

    // Measured on the development box at this viewport: 59 on the thrusters, twice, and 0 on the standard.
    expect(after, `the run burned ${after} royal-blue pixels on the thrusters and ${before} on the standard flame`).toBeGreaterThan(before + 20);
  });
});
