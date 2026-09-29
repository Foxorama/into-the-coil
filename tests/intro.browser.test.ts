/**
 * The intro in a real page — `docs/decisions/0411-the-chase-begins-at-the-port.md`.
 *
 * Three claims `tests/intro.test.ts` cannot make, because they are about the DOM and the input around
 * the picture rather than the picture: the page opens on it and draws it, it hands over to the title
 * with nothing pressed, and a press skips it — to the title and no further.
 *
 * ⚠️ **"NO FURTHER" IS THE WHOLE OF THE SECOND HALF.** A skip moves focus onto the title's first
 * control, which is a tier. Space activates a focused button on its RELEASE and Enter on its press, so
 * a skip whose key carried through would start a run the player never chose. A click is the same
 * question for a pointer: the title comes up under a pointer that went down on the canvas.
 */

import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { INTRO_STEPS } from '../src/content/port.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

const TITLE = '.' + prefixFor('title') + 'shown';
const HUD = '.itc-playing-hud-shown';

/**
 * How long the title may take to come up with nothing pressed, from the canvas appearing.
 *
 * ⚠️ **A BUDGET, SIZED ON 0245's TERMS AND OWNED BY 0411.** The intro is 16.6 s of steps, and a step is
 * a sixtieth of a second only while the loop keeps up. Measured 2026-09-29, from the canvas to the
 * title with nothing pressed: **17.3–17.8 s alone, and 17.6–20.3 s while the whole suite ran** (nine
 * loads). Three times the worst of those. A slower handover is a loop that is not keeping time.
 */
const HANDOVER_MS = 61_000;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

declare global {
  interface Window {
    __itcContexts?: number;
  }
}

async function open(): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  // Count every audio context the page builds — the unlock is the only thing that builds one.
  await page.addInitScript(() => {
    const Real = window.AudioContext;
    window.__itcContexts = 0;
    window.AudioContext = class extends Real {
      constructor(options?: AudioContextOptions) {
        super(options);
        window.__itcContexts = (window.__itcContexts ?? 0) + 1;
      }
    };
  });
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: 15_000 });
  return page;
}

const shown = (page: Page, selector: string): Promise<boolean> => page.evaluate((s: string) => document.querySelector(s) !== null, selector);

/** How many of a grid of sampled pixels differ from the top-left one — the cheapest honest "did it draw". */
function inked(page: Page): Promise<number> {
  return page.evaluate(() => {
    const canvas = document.querySelector('#app canvas');
    if (!(canvas instanceof HTMLCanvasElement)) return -1;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return -1;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const base = [data[0], data[1], data[2]];
    let count = 0;
    for (let y = 0; y < canvas.height; y += 16) {
      for (let x = 0; x < canvas.width; x += 16) {
        const i = (y * canvas.width + x) * 4;
        if (data[i] !== base[0] || data[i + 1] !== base[1] || data[i + 2] !== base[2]) count++;
      }
    }
    return count;
  });
}

describe.runIf(chromePath)('the page opens on the chase, and hands over to the title', () => {
  it('draws the intro with no panel over it, and brings the title up by itself', async () => {
    const page = await open();
    await page.waitForTimeout(2_000);
    expect(await shown(page, TITLE), 'the title is up over the intro').toBe(false);
    expect(await inked(page), 'the intro drew nothing').toBeGreaterThan(100);
    const started = Date.now();
    await page.waitForSelector(TITLE, { timeout: HANDOVER_MS });
    const took = Date.now() - started + 2_000;
    expect(took, 'the title came up long before the intro could have ended').toBeGreaterThan((INTRO_STEPS / STEPS_PER_SECOND) * 1000 * 0.9);
    expect(await shown(page, HUD), 'the intro ended in a run').toBe(false);
    await page.context().close();
  });

  for (const key of ['Space', 'Enter'] as const) {
    it(`skips to the title on ${key}, and ${key} chooses nothing there`, async () => {
      const page = await open();
      await page.waitForTimeout(1_000);
      await page.keyboard.press(key);
      await page.waitForSelector(TITLE, { timeout: 5_000 });
      await page.waitForTimeout(500);
      expect(await shown(page, HUD), `${key} skipped the intro and went on to start a run`).toBe(false);
      expect(await shown(page, TITLE), `${key} left the title as well as the intro`).toBe(true);
      await page.context().close();
    });
  }

  it('builds no sound on a skip, so a skip never pays for the music', async () => {
    /*
      ⚠️ **THE FIRST UNLOCK DRAINS THE PREWARM SYNCHRONOUSLY, AND A SKIP USED TO BE IT.** Measured on the
      first build: a skip 0.3 s into the intro took 5.1 s to bring the title up, the page frozen the
      whole time. The skip does not unlock now; the first press on the title does, as before 0411.
      Counted as contexts built, because the unlock is the only thing that builds one — and then the
      first press on the title is shown to build it, so a page that never built one proves nothing.
    */
    const page = await open();
    await page.waitForTimeout(300);
    await page.keyboard.press('Shift');
    await page.waitForSelector(TITLE, { timeout: 5_000 });
    expect(await page.evaluate(() => window.__itcContexts ?? -1), 'the skip built the sound, and paid for the music with it').toBe(0);
    await page.mouse.click(5, 5);
    await page.waitForFunction(() => (window.__itcContexts ?? 0) > 0, null, { timeout: 30_000 });
    await page.context().close();
  });

  it('skips to the title on a click, and the click lands on nothing the title put under it', async () => {
    const page = await open();
    await page.waitForTimeout(1_000);
    // The middle of the screen, which is where the title's tiers come up.
    await page.mouse.click(640, 360);
    await page.waitForSelector(TITLE, { timeout: 5_000 });
    await page.waitForTimeout(500);
    expect(await shown(page, HUD), 'the click skipped the intro and went on to start a run').toBe(false);
    expect(await shown(page, TITLE), 'the click left the title as well as the intro').toBe(true);
    await page.context().close();
  });
});
