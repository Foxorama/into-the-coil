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

/** The gun band's first option's type, in CSS pixels. */
async function gunType(page: Page): Promise<number> {
  const option = page.locator(`${shown('hangar')} [${SETTING_ATTR}="gun"] .${HANGAR}option`).first();
  return option.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
}

describe.runIf(chromePath)('0562 — the plate grows with the screen, and its foot says what is under the cursor', () => {
  it('sets the plate a third larger at 1920x1080 than at 1280x720', async () => {
    const laptop = await opened(1280, 720);
    const small = await gunType(laptop);
    await laptop.context().close();
    const large = await opened(1920, 1080);
    const big = await gunType(large);
    await large.context().close();
    expect(big, `the gun band is ${big}px at 1920x1080 against ${small}px at 1280x720`).toBeGreaterThanOrEqual(small * 1.3);
  });

  it('names the option tried on, large, on the card, and stands the balance in the plate beside Back', async () => {
    // (The balance is read on its line, so a foot stacked again, balance over Back, fails here too.)
    const page = await opened(1280, 720);
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
    const plate = (await page.locator(`${shown('hangar')} .${HANGAR}plate`).boundingBox())!;
    const sheet = (await page.locator(`${shown('hangar')} .${HANGAR}sheet`).boundingBox())!;
    const back = (await page.locator(`${shown('hangar')} .${HANGAR}action`).first().boundingBox())!;
    expect(sheet.x >= plate.x && sheet.x + sheet.width <= plate.x + plate.width, 'the balance is not on the plate').toBe(true);
    // Beside Back, on its line and to its left.
    const middle = (box: { y: number; height: number }): number => box.y + box.height / 2;
    expect(Math.abs(middle(sheet) - middle(back)) < back.height / 2 && sheet.x + sheet.width <= back.x, 'the balance does not stand beside Back').toBe(true);
    await page.context().close();
  });
});
