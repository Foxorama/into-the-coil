/**
 * The first frame the page draws, in a real browser, off the file the build ships.
 *
 * Everything upstream of this is unit-tested and none of it proves the game appears: the clock is
 * checked without a display, the painter against a counting surface, the projection against numbers.
 * A canvas that is never sized, a context that is never fetched, an atlas baked at the wrong
 * resolution — each leaves every one of those assertions green and the page black.
 *
 * ⚠️ Loaded over `file://` on purpose. It is the harshest way to open the page, it is what
 * `docs/decisions/0003-single-file-build.md` exists for, and an itch download is exactly this.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';

/*
  ⚠️ FILE-LEVEL, because vitest's 5s default is not a browser test's timeout — see
  tests/orientation.browser.test.ts, where this was first hit, and the class fix that followed it.
  A browser test pays for a launch, a navigation and real frames; the FIRST one in a file pays for
  the launch on top of its own work. Locally that fits and on a cold CI runner it does not.

  Held for every *.browser.test.ts by tests/toolchain.test.ts, because fixing this one file at a
  time is exactly what happened the first time.
*/
vi.setConfig({ testTimeout: 60_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

async function open(
  viewport: { width: number; height: number },
  deviceScaleFactor: number,
): Promise<{ page: Page; errors: string[] }> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport, deviceScaleFactor });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: 15_000 });
  return { page, errors };
}

/**
 * Press Start.
 *
 * ⚠️ **The game no longer runs on load** — `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md`
 * opens it on a title screen with the simulation stopped, so every test below whose subject is a
 * MOVING game has to start one first. The pair of tests around `waits on the title screen` is what
 * keeps that from being an assumption.
 *
 * The selector is built from `prefixFor` rather than typed out, so a class rename cannot leave this
 * silently clicking nothing — `tests/chrome.test.ts` holds the same single description.
 */
async function start(page: Page): Promise<void> {
  await page.click('.' + prefixFor('title') + 'action');
  await page.waitForTimeout(120);
}

/** Two canvases, a moment apart, as strings. Equal means the picture did not move. */
async function twoFrames(page: Page, apartMs: number): Promise<[string, string]> {
  const snapshot = (): Promise<string> =>
    page.evaluate(() => {
      const canvas = document.querySelector('#app canvas');
      return canvas instanceof HTMLCanvasElement ? canvas.toDataURL().slice(0, 20_000) : '';
    });
  const before = await snapshot();
  await page.waitForTimeout(apartMs);
  return [before, await snapshot()];
}

/** How many of the sampled pixels are not the background. The cheapest honest "did it draw". */
async function inkFraction(page: Page): Promise<number> {
  return page.evaluate(() => {
    const canvas = document.querySelector('#app canvas');
    if (!(canvas instanceof HTMLCanvasElement)) return -1;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return -1;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // The background is a flat fill, so "not the first pixel" is exactly "something was drawn here".
    const [r0, g0, b0] = [data[0], data[1], data[2]];
    let ink = 0;
    let seen = 0;
    for (let i = 0; i < data.length; i += 4 * 97) {
      seen++;
      if (data[i] !== r0 || data[i + 1] !== g0 || data[i + 2] !== b0) ink++;
    }
    return seen === 0 ? -1 : ink / seen;
  });
}

describe.runIf(chromePath)('the page draws', () => {
  it('paints something, and keeps painting', async () => {
    const { page, errors } = await open({ width: 1280, height: 720 }, 1);
    // Two seconds of real frames. The scene spawns on a countdown, so an empty first frame is
    // normal and a permanently empty canvas is not.
    await page.waitForTimeout(2000);
    const ink = await inkFraction(page);
    expect(ink, 'the canvas is one flat colour — the loop is not drawing').toBeGreaterThan(0.001);
    expect(errors, `the page logged errors while running:\n${errors.join('\n')}`).toEqual([]);
    await page.context().close();
  }, 90_000);

  it('moves — the frame after is not the frame before', async () => {
    // A single painted frame proves the painter ran once. This is what proves the LOOP is running,
    // which is the failure a static screenshot cannot tell apart.
    const { page } = await open({ width: 1280, height: 720 }, 1);
    await start(page);
    await page.waitForTimeout(1200);
    const [before, after] = await twoFrames(page, 600);
    expect(before.length, 'nothing was captured').toBeGreaterThan(100);
    expect(after, 'the canvas is frozen — the rAF loop stopped or never started').not.toBe(before);
    await page.context().close();
  }, 90_000);

  /**
   * ⚠️ **The other half, and the reason the one above needed a `start`.**
   *
   * `docs/decisions/0039-…` says the simulation steps on `playing` and on nothing else, because a run
   * that began before the player's hands were on the keys has already spent some of their three
   * lives. That is a claim about the PICTURE — the thing 0027 says to measure — so it is asserted the
   * same way the motion above is, on real pixels a real browser drew.
   *
   * The pair matters more than either half: identical frames alone would also be produced by a loop
   * that never started, and the test above is what rules that out.
   */
  it('waits on the title screen — nothing moves until Start is pressed', async () => {
    const { page, errors } = await open({ width: 1280, height: 720 }, 1);
    await page.waitForTimeout(1200);
    const [before, after] = await twoFrames(page, 600);
    expect(before.length, 'nothing was captured').toBeGreaterThan(100);
    expect(after, 'the world is advancing behind the title screen').toBe(before);
    // And the field IS drawn behind it, so "frozen" is not "blank" — a black page would pass the
    // assertion above for entirely the wrong reason.
    expect(await inkFraction(page), 'the title screen is over an empty canvas').toBeGreaterThan(0.001);

    await start(page);
    await page.waitForTimeout(400);
    const [running, later] = await twoFrames(page, 600);
    expect(later, 'pressing Start did not start the simulation').not.toBe(running);
    expect(errors, errors.join('\n')).toEqual([]);
    await page.context().close();
  }, 90_000);

  it('caps the backing store at 2x however high the device pixel ratio goes', async () => {
    // 0022's largest single lever on the target device. At DPR 3 a 1080p phone renders ~2.6M pixels
    // a frame; capped it renders ~1.15M, for a difference invisible on baked bitmaps.
    const { page } = await open({ width: 800, height: 600 }, 4);
    const size = await page.evaluate(() => {
      const canvas = document.querySelector('#app canvas');
      if (!(canvas instanceof HTMLCanvasElement)) return null;
      return { backing: canvas.width, css: canvas.getBoundingClientRect().width, dpr: window.devicePixelRatio };
    });
    expect(size, 'no canvas to measure').not.toBe(null);
    expect(size!.dpr, 'the browser did not honour the device scale factor — this test proves nothing').toBe(4);
    expect(size!.backing / size!.css, 'the DPR cap is not being applied').toBeCloseTo(2, 1);
    await page.context().close();
  }, 90_000);

  /**
   * ⚠️ **These two used to assert that portrait paints too, and they were right until
   * `docs/decisions/0031-landscape-is-the-shipped-orientation.md`.** One art view exists, so portrait
   * now gates instead of drawing — and both tests went red on this change, which is the correct
   * behaviour of a guard that encoded the old contract rather than a problem with it.
   *
   * The portrait half moved to `tests/orientation.browser.test.ts`, where it asserts the opposite and
   * stronger thing: that nothing draws and the world does not advance. What stays here is the claim
   * this file exists for — the page fills its viewport and paints — across the range of LANDSCAPE
   * shapes 0023's clamp is drawn against.
   */
  it('fills the viewport and paints across the whole landscape clamp', async () => {
    for (const viewport of [
      { width: 1280, height: 720 }, // 16:9, mid-clamp
      { width: 1440, height: 960 }, // 3:2, the bottom of the clamp
      { width: 2560, height: 1080 }, // 21:9, the top of it
    ]) {
      const { page, errors } = await open(viewport, 1);
      await page.waitForTimeout(1500);
      const box = await page.evaluate(() => {
        const canvas = document.querySelector('#app canvas');
        if (!(canvas instanceof HTMLCanvasElement)) return null;
        const r = canvas.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      });
      expect(box, `no canvas at ${viewport.width}x${viewport.height}`).not.toBe(null);
      expect(box!.w).toBe(viewport.width);
      expect(box!.h).toBe(viewport.height);
      expect(
        await inkFraction(page),
        `nothing painted at ${viewport.width}x${viewport.height}`,
      ).toBeGreaterThan(0.001);
      expect(errors, errors.join('\n')).toEqual([]);
      await page.context().close();
    }
  }, 120_000);

  it('survives a resize mid-run without erroring or going blank', async () => {
    // 0023's claim driven rather than argued: the view re-measures, the atlas re-bakes if its
    // resolution moved, and the loop does not stop. Between two LANDSCAPE shapes since 0031 — a
    // window dragged from 16:9 to ultrawide is the case a desktop player actually produces, and it
    // crosses the top of the clamp, so the gutter appears mid-run.
    const { page, errors } = await open({ width: 1280, height: 720 }, 1);
    await start(page);
    await page.waitForTimeout(1000);
    await page.setViewportSize({ width: 2560, height: 800 });
    await page.waitForTimeout(1200);
    expect(await inkFraction(page), 'the canvas went blank after resizing').toBeGreaterThan(0.001);
    const box = await page.evaluate(() => {
      const canvas = document.querySelector('#app canvas');
      return canvas instanceof HTMLCanvasElement ? Math.round(canvas.getBoundingClientRect().width) : -1;
    });
    expect(box, 'the canvas did not re-fit to the new viewport').toBe(2560);
    expect(errors, `resizing logged errors:\n${errors.join('\n')}`).toEqual([]);
    await page.context().close();
  }, 90_000);

  /*
    ⚠️ FOUND BY PLAYING, NOT BY READING. On a phone, a long press on the playfield opened the iOS
    callout and a second finger zoomed the page — on a build with no touch handling at all, because
    nothing had ever told the engine that this element is a game.

    Asserted on COMPUTED style rather than on the string `mount.ts` assigned, because the inline
    value only proves the line ran — the computed value proves the browser accepted it.

    ⚠️ **`-webkit-touch-callout` is NOT here, and its absence is the interesting part.** Chromium
    does not implement the property at all — it refuses it on `setProperty`, so it is unreadable
    both computed AND inline, and the first two versions of this test failed on exactly that. It is
    a Safari/iOS property, and iOS is the only place the bug it fixes occurs, which is also the only
    place this suite cannot run.

    So it gets the other half of a two-halves guard, per
    docs/decisions/0025-the-frame-budget-is-counted-not-timed.md: a SOURCE SCAN, in
    `tests/touch.test.ts`. Neither half can see what the other does — this one cannot see a property
    the engine drops, and that one cannot see a value the engine rejected. Written down rather than
    quietly dropped, because an assertion nobody can run is worth less than a stated gap.

    See docs/decisions/0032-touch-is-relative-drag-and-not-a-stick.md.
  */
  it('tells the browser the canvas is a game, so a thumb does not pan, zoom or select it', async () => {
    const { page, errors } = await open({ width: 1280, height: 720 }, 1);
    const style = await page.evaluate(() => {
      const canvas = document.querySelector('#app canvas');
      if (!(canvas instanceof HTMLCanvasElement)) return null;
      const computed = getComputedStyle(canvas);
      return {
        touchAction: computed.touchAction,
        userSelect: computed.userSelect || computed.webkitUserSelect,
        overscroll: computed.overscrollBehaviorY || computed.overscrollBehavior,
      };
    });
    expect(style, 'no canvas to read a style from').not.toBeNull();
    expect(style?.touchAction, 'a pinch or a drag on the playfield still pans the page').toBe('none');
    expect(style?.userSelect, 'a long press still selects').toBe('none');
    expect(style?.overscroll, 'a downward drag can still pull-to-refresh').toBe('none');
    expect(errors, errors.join('\n')).toEqual([]);
    await page.context().close();
  }, 90_000);

  /*
    ⚠️ The counterpart, and the one that keeps the fix from being an accessibility regression.
    Suppressing zoom page-wide is an anti-pattern, and 0024 makes that this project's problem
    specifically. The playfield refuses gestures; the page around it must not.
  */
  it('leaves the DOCUMENT zoomable, because killing pinch page-wide is an accessibility failure', async () => {
    const { page } = await open({ width: 1280, height: 720 }, 1);
    const doc = await page.evaluate(() => ({
      body: getComputedStyle(document.body).touchAction,
      root: getComputedStyle(document.documentElement).touchAction,
      viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '',
    }));
    expect(doc.body, 'the whole page refuses gestures, not just the playfield').not.toBe('none');
    expect(doc.root, 'the whole page refuses gestures, not just the playfield').not.toBe('none');
    expect(doc.viewport, 'the viewport tag disables zoom for everyone').not.toMatch(/user-scalable\s*=\s*no/);
    expect(doc.viewport, 'the viewport tag pins the scale, which disables zoom by another name').not.toMatch(
      /maximum-scale\s*=\s*1/,
    );
    await page.context().close();
  }, 90_000);
});
