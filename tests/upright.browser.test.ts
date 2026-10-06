import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openHangar, shown } from './title.ts';
import { SCREENS } from '../src/state/screens.ts';

/**
 * THE HANGAR HELD UPRIGHT — `docs/decisions/0566-the-phone-pass.md`.
 *
 * Asked: is portrait allowed in the hangar family? *"yes"*. 0031's gate stays for everything that flies,
 * and stands down for the screens that stand in the port. Asked in what the player sees: on a phone turned
 * upright in the hangar, no prompt, the room drawn, the ship on its pad above the plate, and Back is on the
 * screen; and the title behind it is gated again.
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

const gated = (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const gate = document.querySelector('[data-itc-rotate]');
    return gate !== null && getComputedStyle(gate).display !== 'none';
  });

describe.runIf(chromePath)('0566 — the hangar may be held upright, and nothing that flies may', () => {
  it('draws the hangar in portrait with no prompt, the room over the plate, and gates the title again on Back', async () => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true });
    const page = await context.newPage();
    await page.goto(dist);
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openHangar(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);

    expect(await gated(page), 'the rotate prompt stands over the hangar held upright').toBe(false);
    const canvas = (await page.locator('#app > canvas').first().boundingBox())!;
    expect(canvas.height, 'the room is not drawn upright').toBeGreaterThan(600);
    const plate = (await page.locator(`${shown('hangar')} .${HANGAR}plate`).boundingBox())!;
    const stand = (await page.locator(`${shown('hangar')} .${HANGAR}stand`).boundingBox())!;
    expect(stand.y + stand.height <= plate.y + 1, 'the stand is not over the plate').toBe(true);
    const back = (await page.locator(`${shown('hangar')} .${HANGAR}action`, { hasText: SCREENS.hangar.actions[0]!.label }).boundingBox())!;
    expect(back.y + back.height <= 844 && back.x + back.width <= 390, 'Back is off the upright screen').toBe(true);

    // Back, to a title that is not drawn upright: it is gated again, so it is not waited for as shown.
    await page.locator(`${shown('hangar')} .${HANGAR}action`, { hasText: SCREENS.hangar.actions[0]!.label }).click();
    await page.waitForTimeout(500);
    expect(await gated(page), 'the title is drawn upright, where it flies').toBe(true);
    await context.close();
  });
});
