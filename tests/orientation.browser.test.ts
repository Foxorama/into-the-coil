/**
 * THE ORIENTATION GATE, in a real browser, off the file the build ships.
 *
 * See `docs/decisions/0031-landscape-is-the-shipped-orientation.md`. One art view exists — side
 * profile — so portrait would draw ships and bosses moving the wrong way. The predecessor shipped
 * exactly that in its end-boss fight and it looked bad to the point of being unplayable, which is a
 * PICTURE failure that no model assertion anywhere can see.
 *
 * ⚠️ **The manifest is not what this tests.** `orientation: landscape` binds an installed PWA and
 * does nothing in a mobile browser tab or inside the itch iframe — where most players arrive. That
 * value is a hint held by `tests/shell.test.ts`; the gate is the guarantee, and it is held here.
 *
 * ⚠️ **The simulation must STOP, not merely be covered.** An overlay above a running game loses the
 * run to something the player cannot see. So the load-bearing assertion is not "a prompt appeared" —
 * it is that the world does not advance while the prompt is up.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

const LANDSCAPE = { width: 1280, height: 720 };
const PORTRAIT = { width: 720, height: 1280 };

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

async function open(viewport: { width: number; height: number }): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(dist);
  // `attached`, not the default `visible`: in portrait the gate deliberately hides the canvas, so
  // waiting for it to be visible would time out on exactly the state under test.
  await page.waitForSelector('#app canvas', { state: 'attached', timeout: 15_000 });
  return page;
}

/** Is the rotate prompt actually laid out and painted, rather than merely present in the DOM? */
async function gateShown(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const gate = document.querySelector('[data-itc-rotate]');
    if (!(gate instanceof HTMLElement)) return false;
    const box = gate.getBoundingClientRect();
    return getComputedStyle(gate).display !== 'none' && box.width > 0 && box.height > 0;
  });
}

/** Is the canvas visible to a player, rather than merely attached? */
async function canvasShown(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const canvas = document.querySelector('#app canvas');
    return canvas instanceof HTMLElement && getComputedStyle(canvas).visibility !== 'hidden';
  });
}

/**
 * How many of the sampled pixels are not the background — the cheapest honest "is it drawing".
 *
 * Sampled rather than exhaustive: a full `getImageData` of a 1280×720 backing store is megabytes
 * across the CDP bridge for a question a grid answers.
 */
async function inkedPixels(page: Page): Promise<number> {
  return page.evaluate(() => {
    const canvas = document.querySelector('#app canvas');
    if (!(canvas instanceof HTMLCanvasElement)) return -1;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return -1;
    const { width, height } = canvas;
    if (width === 0 || height === 0) return 0;
    const data = ctx.getImageData(0, 0, width, height).data;
    let inked = 0;
    for (let y = 0; y < height; y += 8) {
      for (let x = 0; x < width; x += 8) {
        const i = (y * width + x) * 4;
        // The background is one flat colour; anything that differs from the top-left is drawn.
        if (data[i] !== data[0] || data[i + 1] !== data[1] || data[i + 2] !== data[2]) inked++;
      }
    }
    return inked;
  });
}

describe.runIf(chromePath)('the orientation gate', () => {
  it('plays in landscape, with no prompt in the way', async () => {
    const page = await open(LANDSCAPE);
    expect(await gateShown(page)).toBe(false);
    expect(await canvasShown(page)).toBe(true);
    expect(await inkedPixels(page)).toBeGreaterThan(0);
    await page.context().close();
  });

  it('refuses to play in portrait, and says why', async () => {
    const page = await open(PORTRAIT);
    expect(await gateShown(page)).toBe(true);
    expect(await canvasShown(page)).toBe(false);
    await page.context().close();
  });

  it('THE ONE THAT MATTERS: the world does not advance behind the prompt', async () => {
    // An overlay over a running game is the cheap version of this feature and it is wrong: a player
    // who rotates mid-run loses the run to something they cannot see.
    const page = await open(PORTRAIT);
    const before = await page.evaluate(() => performance.now());
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => performance.now());
    // Real time passed, so a running loop would have had ~24 frames to draw in.
    expect(after - before).toBeGreaterThan(200);
    // Nothing was drawn into the canvas at all — it was never even sized for this view.
    expect(await inkedPixels(page)).toBe(0);
    await page.context().close();
  });

  it('the prompt is text, so it does not rely on reading a pictogram', async () => {
    // 0024's floor, applied to the one screen whose entire job is explaining why nothing is running.
    const page = await open(PORTRAIT);
    const text = await page.textContent('[data-itc-rotate]');
    expect((text ?? '').trim().length).toBeGreaterThan(8);
    await page.context().close();
  });

  it('announces itself, because it appears in response to something the player just did', async () => {
    const page = await open(PORTRAIT);
    expect(await page.getAttribute('[data-itc-rotate]', 'role')).toBe('alert');
    await page.context().close();
  });

  it('gates on a rotation INTO portrait, mid-run — the way a player actually meets this', async () => {
    // A fresh load in portrait and a rotation mid-run take DIFFERENT code paths: the first is the
    // initial call, the second is the resize handler. Testing only the first would leave the case
    // the player produces — playing, then turning the device — reachable and unguarded.
    const page = await open(LANDSCAPE);
    await page.waitForTimeout(120);
    expect(await gateShown(page)).toBe(false);
    await page.setViewportSize(PORTRAIT);
    await page.waitForFunction(
      () => {
        const gate = document.querySelector('[data-itc-rotate]');
        return gate instanceof HTMLElement && getComputedStyle(gate).display !== 'none';
      },
      { timeout: 5_000 },
    );
    expect(await canvasShown(page)).toBe(false);
    await page.context().close();
  }, 30_000);

  it('resumes on rotation back, and draws again', async () => {
    // The seam between the two states, driven the way a player drives it. 0023's invariance is why
    // coming back costs no re-measure of difficulty: the spans never changed.
    const page = await open(PORTRAIT);
    expect(await gateShown(page)).toBe(true);
    await page.setViewportSize(LANDSCAPE);
    await page.waitForFunction(
      () => {
        const gate = document.querySelector('[data-itc-rotate]');
        return gate instanceof HTMLElement && getComputedStyle(gate).display === 'none';
      },
      { timeout: 5_000 },
    );
    expect(await canvasShown(page)).toBe(true);
    await page.waitForTimeout(120);
    expect(await inkedPixels(page)).toBeGreaterThan(0);
    await page.context().close();
  });
});
