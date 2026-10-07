import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openHangar, shown } from './title.ts';

/**
 * THE PLATE GROWS, AND HAS A FOOT — `docs/decisions/0562-the-plate-grows.md`.
 *
 * Two things the review found by looking: at 1920x1080 the plate was the 1280x720 plate with half of it
 * empty, and what an option is was said in a small line that moved with the cursor, with the balance a
 * screen away from Buy. Both are asked in what the player sees — pixels of type, the words on the card,
 * and where the balance is drawn.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;
const HANGAR = prefixFor('hangar');

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

async function opened(width: number, height: number): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  await openHangar(page);
  return page;
}


describe.runIf(chromePath)('0562 and 0568 — the plate is one size, and its foot says what is under the cursor', () => {
  /*
    ⚠️ **TURNED ROUND BY 0568.** 0562 held the plate a third larger at 1920x1080; played, *"the menu's take
    up like 80% of the screen space … everything is way too big and zoomed in"*. The plate is one width now,
    and the bigger screen shows more of the hangar: asked in pixels, the plate is no wider at 1920x1080 than
    at 1280x720, and takes under a quarter of the bigger screen.
  */
  it('holds the plate to one width, and gives the bigger screen to the hangar', async () => {
    const plateOf = async (page: Page): Promise<number> => (await page.locator(`${shown('hangar')} .${HANGAR}plate`).boundingBox())!.width;
    const laptop = await opened(1280, 720);
    const small = await plateOf(laptop);
    await laptop.context().close();
    const large = await opened(1920, 1080);
    const big = await plateOf(large);
    await large.context().close();
    expect(big, `the plate is ${big}px at 1920x1080 against ${small}px at 1280x720`).toBeLessThanOrEqual(small + 1);
    expect(big / 1920, 'the plate takes a quarter of a 1920 screen or more').toBeLessThan(0.25);
  });

  /*
    ⚠️ **TURNED ROUND BY 0572.** The card stands on a phone's foot only: on a desktop each band says its own
    under itself (`tests/dressed.browser.test.ts`), and the balance is in the stand's top right corner, not
    beside Back. So the card is asked where the player sees it, a phone held sideways.
  */
  it('names the option tried on, on a phone’s card, and follows the cursor down', async () => {
    const page = await opened(667, 375);
    // 0579: down past the sub-tabs, which stand between the pilots and the Loadout's first band.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    const tried = await page.locator(`${shown('hangar')} [${SETTING_ATTR}="gun"] .${HANGAR}option-look`).textContent();
    expect(await page.locator(`${shown('hangar')} .${HANGAR}focus-name`).textContent(), 'the card does not name the gun tried on').toBe(tried);
    // And it follows the cursor down to the next band.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    const special = await page.locator(`${shown('hangar')} [${SETTING_ATTR}="special"] .${HANGAR}option-look`).textContent();
    expect(await page.locator(`${shown('hangar')} .${HANGAR}focus-name`).textContent(), 'the card stayed on the gun when the cursor went down').toBe(special);
    expect(await page.locator(`${shown('hangar')} .${HANGAR}focus-name`).isVisible(), 'the phone’s card is not drawn').toBe(true);
    await page.context().close();
  });
});
