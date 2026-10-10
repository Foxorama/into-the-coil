import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { back, choose, launch, openHangar, openSettings } from './title.ts';
import { HAND_KINDS } from '../src/content/touch.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';

/**
 * THE GAME HAS A LEFT HAND, IN THE PAGE —
 * `docs/decisions/0590-the-settings-are-tidied-and-the-game-has-a-left-hand.md`.
 *
 * `tests/hand.test.ts` holds that the world cannot learn the hand and that a push is read back through
 * the mirror. What it cannot see is the picture: that the field is shown mirrored on a desktop, that the
 * port is not — its doors are DOM over the canvas and its sign is lettered in it — and that Right puts it
 * back. The mirror is the canvas element's transform, so that is what is read, as the compositor is
 * handed it.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

async function open(): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  return page;
}

/**
 * Whether the canvas is shown mirrored left for right: the horizontal scale of its computed transform is
 * negative. Polled by the callers, because the shell applies it on a screen change and on its tick.
 */
const mirrored = (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const canvas = document.querySelector('#app canvas');
    if (!(canvas instanceof HTMLCanvasElement)) return false;
    const transform = getComputedStyle(canvas).transform;
    return transform !== 'none' && new DOMMatrixReadOnly(transform).a < 0;
  });

describe.runIf(chromePath)('0590 — the left hand', () => {
  it('THE ASK: Left shows the field mirrored on a desktop, and Right puts it back', async () => {
    const page = await open();
    expect(await mirrored(page), 'the game opened mirrored with nothing chosen').toBe(false);
    await openSettings(page);
    await choose(page, 'hand', HAND_KINDS.indexOf('left'));
    await expect.poll(() => mirrored(page), { message: 'Left did not mirror the field behind Settings' }).toBe(true);
    await back(page, 'settings');
    // Through the intro, which stands in the port unmirrored, and into the run, which is flown in the mirror.
    await launch(page, 'savior');
    await expect.poll(() => mirrored(page), { message: 'the run is not flown in the mirror' }).toBe(true);
    await page.context().close();

    const again = await open();
    await openSettings(again);
    await choose(again, 'hand', HAND_KINDS.indexOf('left'));
    await choose(again, 'hand', HAND_KINDS.indexOf('right'));
    await expect.poll(() => mirrored(again), { message: 'Right left the field mirrored' }).toBe(false);
    await again.context().close();
  });

  /*
    ⚠️ **MOVED HERE FROM THE LOOK'S BROWSER TEST, WHICH 0590 DELETED** — it was never about the look.
    `docs/decisions/0024-the-accessibility-floor-is-settings.md` puts *colour never carries meaning alone*
    in the unconditional tier, and which option of a band is live is exactly the state a hue would hide.
    The on-option is filled; the others are hollow.
  */
  it('and the band says which hand is on, in fill rather than in colour alone', async () => {
    const page = await open();
    const left = HAND_KINDS.indexOf('left');
    await openSettings(page);
    await choose(page, 'hand', left);
    const options = `[${SETTING_ATTR}="hand"] .${prefixFor('settings')}option`;
    await expect.poll(() => page.evaluate((sel) => document.querySelectorAll(sel)[1]?.className ?? '', options)).toContain('option-on');
    const marked = await page.evaluate((selector: string) => {
      return [...document.querySelectorAll(selector)].map((el) => ({
        on: el.className.includes('option-on'),
        background: getComputedStyle(el).backgroundColor,
      }));
    }, options);
    expect(marked.length, 'the band has no options at all').toBe(HAND_KINDS.length);
    expect(marked.filter((m) => m.on).length, 'more or less than one option is marked').toBe(1);
    expect(marked[left]!.on, 'the option that was pressed is not the one marked').toBe(true);
    const transparent = /rgba\(0,\s*0,\s*0,\s*0\)|transparent/;
    expect(marked[left]!.background, 'the live option is not filled, so only colour says so').not.toMatch(transparent);
    const off = marked.find((m) => !m.on);
    expect(off?.background, 'an unchosen option is filled too, so the fill says nothing').toMatch(transparent);
    await page.context().close();
  });

  it('and not the port, whose doors and sign are drawn to be read the right way round', async () => {
    const page = await open();
    await openSettings(page);
    await choose(page, 'hand', HAND_KINDS.indexOf('left'));
    await back(page, 'settings');
    await expect.poll(() => mirrored(page)).toBe(true);
    await openHangar(page);
    await expect.poll(() => mirrored(page), { message: 'the hangar stands in a mirrored room' }).toBe(false);
    await back(page, 'hangar');
    await expect.poll(() => mirrored(page), { message: 'leaving the hangar did not mirror the field again' }).toBe(true);
    await page.context().close();
  });
});
