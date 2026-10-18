import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { choose, fly } from './title.ts';
import { seeded } from './seed.ts';
import { HANGAR_KEY, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { GOLFER_KINDS } from '../src/content/golfers.ts';

/**
 * THE BALL'S HEAT IS IN THE READOUT, ON A DESK AND ON A PHONE — `docs/decisions/0638-the-ball-says-its-heat.md`.
 *
 * Played: *"the hamster ball needs to show the shield regen rate somewhere as well as the heat gauge somewhere and
 * all of that also needs to be displayed well in mobile somehow as well."* Measured in what the player sees: the
 * gauge drawn, wide enough to read, and wholly on the glass — at 1280×720, and at a phone's 844×390 with touch,
 * where the readout keeps its ship and its shields and lets the triggers' counts go.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

/** A run flown by `pilot`, on a store where Unity's ten crashes are behind them, at a size, with touch or not. */
async function flying(pilot: (typeof GOLFER_KINDS)[number], width: number, height: number, hasTouch: boolean): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch });
  const page = await seeded(context, dist, HANGAR_KEY, serialiseHangar({ ...initialHangar, crashes: 10 }));
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  await choose(page, 'pilot', GOLFER_KINDS.indexOf(pilot));
  await fly(page);
  await page.waitForTimeout(1500);
  return page;
}

/** The heat gauge's box on the glass, or `null` when it is not drawn. */
const gauge = (page: Page): Promise<{ left: number; top: number; right: number; bottom: number; width: number } | null> =>
  page.evaluate(() => {
    const group = document.querySelector<HTMLElement>('.itc-playing-hud-heat');
    const bar = document.querySelector<HTMLElement>('.itc-playing-hud-gauge');
    if (group === null || bar === null || group.hidden || getComputedStyle(group).display === 'none') return null;
    const box = bar.getBoundingClientRect();
    return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width };
  });

describe.runIf(chromePath)('0638 — the ball says its heat', () => {
  for (const [name, width, height, touch] of [
    ['a desktop', 1280, 720, false],
    ['a phone held sideways', 844, 390, true],
  ] as const) {
    it(`draws the heat gauge whole and readable in the readout, on ${name}`, async () => {
      const page = await flying('unity', width, height, touch);
      const box = await gauge(page);
      expect(box, `on ${name} the ball flies with no heat gauge drawn`).not.toBeNull();
      expect(box!.width, `on ${name} the gauge is ${box!.width.toFixed(1)} px wide, too narrow to read a fill on`).toBeGreaterThanOrEqual(24);
      expect(box!.left, `on ${name} the gauge starts off the glass`).toBeGreaterThanOrEqual(0);
      expect(box!.top, `on ${name} the gauge starts off the glass`).toBeGreaterThanOrEqual(0);
      expect(box!.right, `on ${name} the gauge runs off the glass`).toBeLessThanOrEqual(width);
      expect(box!.bottom, `on ${name} the gauge runs off the glass`).toBeLessThanOrEqual(height);
      await page.context().close();
    });
  }

  it('and a ship that does not heat draws none', async () => {
    const page = await flying(GOLFER_KINDS[0], 1280, 720, false);
    expect(await gauge(page), 'a ship with no ram drew a heat gauge').toBeNull();
    await page.context().close();
  });
});
