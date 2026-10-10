import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { back, choose, launch, openSettings } from './title.ts';
import { HAND_KINDS } from '../src/content/touch.ts';
import { triggerX } from '../src/app/touch.ts';

/**
 * THE TOUCH SECTION, IN THE PAGE — `docs/decisions/0512-the-touch-is-yours.md`.
 *
 * `tests/touch-section.test.ts` holds the hit test and the gain. What it cannot see is the picture:
 * whether the bands are offered where there is glass and nowhere else, and whether the discs a player
 * aims at are drawn on the side the hit test is reading. Measured off the DOM in CSS pixels against
 * the hit test's own function, so the two are compared rather than each trusted.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

async function open(touch: boolean): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({
    viewport: touch ? { width: 844, height: 390 } : { width: 1280, height: 720 },
    deviceScaleFactor: touch ? 2 : 1,
    hasTouch: touch,
    isMobile: touch,
  });
  const page = await context.newPage();
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  return page;
}

const bandShown = (page: Page, setting: string): Promise<boolean> =>
  page.evaluate((sel) => {
    const box = document.querySelector(sel)?.closest('[role="group"]');
    return box instanceof HTMLElement && box.offsetParent !== null;
  }, `.${prefixFor('settings')}shown [${SETTING_ATTR}="${setting}"]`);

describe.runIf(chromePath)('0512 — the touch section', () => {
  it('is offered on a touch screen and not on a desktop', async () => {
    const desk = await open(false);
    await openSettings(desk);
    expect(await bandShown(desk, 'steer'), 'a desktop with no touchscreen was offered the steering').toBe(false);
    // 0590: the hand is the whole game mirrored now, so a desktop is offered it — and it is the band that is there.
    expect(await bandShown(desk, 'hand'), 'the check cannot see a band that is there').toBe(true);
    await desk.context().close();

    const phone = await open(true);
    await openSettings(phone);
    expect(await bandShown(phone, 'hand'), 'a touch screen was not offered the hand').toBe(true);
    expect(await bandShown(phone, 'steer'), 'a touch screen was not offered the steering').toBe(true);
    await phone.context().close();
  });

  it('THE ASK, IN PIXELS: Left draws every disc where the hit test reads a left thumb', async () => {
    const page = await open(true);
    await openSettings(page);
    await choose(page, 'hand', HAND_KINDS.indexOf('left'));
    await back(page, 'settings');
    await launch(page, 'savior');
    await page.waitForSelector('.itc-playing-trigger-shown');
    const { width, height, centres } = await page.evaluate(() => {
      const canvas = document.querySelector('#app canvas')!.getBoundingClientRect();
      const discs = [...document.querySelectorAll<HTMLElement>('.itc-playing-trigger-button')].filter((d) => d.offsetParent !== null);
      return {
        width: canvas.width,
        height: canvas.height,
        centres: discs.map((d) => {
          const r = d.getBoundingClientRect();
          return r.left - canvas.left + r.width / 2;
        }),
      };
    });
    expect(centres.length, 'no discs were drawn').toBeGreaterThan(0);
    const aim = triggerX(width, height, 'left');
    for (const x of centres) {
      expect(Math.abs(x - aim), `a disc is drawn ${(x - aim).toFixed(1)} px from where a left-handed tap is read`).toBeLessThanOrEqual(1);
    }
    await page.context().close();
  });
});
