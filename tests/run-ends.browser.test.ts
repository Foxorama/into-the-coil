import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { choose, fly, openHangar, shown } from './title.ts';
import { seedOnce } from './seed.ts';
import { HANGAR_KEY, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { DEFAULT_GOLFER, GOLFERS, GOLFER_KINDS } from '../src/content/golfers.ts';
import { SHIPS } from '../src/content/ships.ts';
import { SCREENS } from '../src/state/screens.ts';

/**
 * A RUN ENDS AT THE TITLE, IN THE PAGE — `docs/decisions/0558-a-run-ends-at-the-title.md`.
 *
 * `tests/run-ends.test.ts` holds the rule in the reducer. **What it cannot see is what the shell did with
 * a run left standing**: a quit kept the lives up, the shell kept reading *a run is flying*, and the
 * world never took the next pilot's ship — so the pad stood a car's turning wheels on a ship that has
 * none. Counted in what the canvas draws: on Paint & Parts' pad the only turned blits are wheels.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

/** Turned blits on the page's own canvas in one second. */
async function turnedPerSecond(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const g = window as unknown as { itcTurned: number };
    g.itcTurned = 0;
    await new Promise((done) => setTimeout(done, 1000));
    return g.itcTurned;
  });
}

describe.runIf(chromePath)('0558 — a run quit is over', () => {
  it('a pilot chosen after a quit stands on the pad in their own ship, not under the last run’s wheels', async () => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    await seedOnce(context, HANGAR_KEY, serialiseHangar({ ...initialHangar, owned: { ...initialHangar.owned, spinner: true }, rim: { ...initialHangar.rim, firebird: 'spinner' } }));
    await context.addInitScript(() => {
      const g = window as unknown as { itcTurned: number };
      g.itcTurned = 0;
      const rotate = CanvasRenderingContext2D.prototype.rotate;
      CanvasRenderingContext2D.prototype.rotate = function (angle: number) {
        if (this.canvas.isConnected) g.itcTurned++;
        return rotate.call(this, angle);
      };
    });
    const page = await context.newPage();
    await page.goto(dist);
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);

    // The default pilot flies the Firebird, on the spinners; a run begun and quit.
    expect(GOLFERS[DEFAULT_GOLFER].ship, 'the run this flies is not on the spinners seeded').toBe('firebird');
    await fly(page);
    await page.waitForTimeout(2000);
    await page.keyboard.press('Escape');
    await page.waitForSelector(shown('paused'), { state: 'attached' });
    await page.locator(`${shown('paused')} .${prefixFor('paused')}action`, { hasText: 'Quit' }).click();
    await page.waitForSelector(shown('quit'), { state: 'attached' });
    await page.locator(`${shown('quit')} .${prefixFor('quit')}action`, { hasText: 'Quit' }).click();
    await page.waitForSelector(shown('title'), { state: 'attached' });

    // A pilot whose ship has no wheels, chosen on the title, stood on Paint & Parts' pad.
    const wheelless = GOLFER_KINDS.findIndex((kind) => kind !== 'marmot' && SHIPS[GOLFERS[kind].ship].wheels === null);
    expect(wheelless, 'no pilot flies a ship without wheels, so this measures nothing').toBeGreaterThanOrEqual(0);
    await choose(page, 'pilot', wheelless);
    await openHangar(page);
    await page.locator(`${shown('hangar')} .${prefixFor('hangar')}tab`, { hasText: SCREENS.parts.heading }).click();
    await page.waitForSelector(shown('parts'), { state: 'attached' });
    await page.waitForTimeout(800);
    const turned = await turnedPerSecond(page);
    expect(turned, `${GOLFERS[GOLFER_KINDS[wheelless]!].ship} has no wheels, and the pad turned ${turned} pictures a second over it — the last run's spinners`).toBe(0);
    await context.close();
  });
});
