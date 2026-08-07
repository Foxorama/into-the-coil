import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { STYLES, STYLE_KINDS } from '../src/content/styles.ts';

/**
 * THE STYLE, PRESSED, AND WHAT IT ACTUALLY CHANGES ON SCREEN.
 *
 * `docs/decisions/0070-a-style-is-a-setting-and-the-first-one.md`. `tests/style.test.ts` holds the
 * table, the reducer and the ban. **What it cannot see is whether pressing the button changes the
 * picture** — that is a chain of five things (a click, a dispatch, a slice, `applyStyle`, the
 * painter) and the only honest way to ask about the end of it is to look at the canvas.
 *
 * ⚠️ **The sky is counted in PIXELS, on the title screen, which is a still field.** Retro is the
 * game before the sky, so switching to it must take a measurable amount of ink off the screen —
 * `docs/decisions/0027-measure-the-picture-not-the-model.md`, and the same argument
 * `tests/hud.browser.test.ts` makes for the key's icons being canvases with pixels in them.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 60_000 });

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
  await page.waitForSelector('#app canvas', { timeout: 15_000 });
  return page;
}

/**
 * How much of the canvas is not the void.
 *
 * ⚠️ **Sampled against the DARKEST pixel on the canvas rather than against a colour written here.**
 * The space ink is a palette value and `src/content/palette.ts` may move it; what this needs is
 * *how much is drawn*, and the answer is *everything brighter than the background*.
 */
function inkOn(page: Page): Promise<number> {
  return page.evaluate(() => {
    const canvas = document.querySelector('#app canvas');
    if (!(canvas instanceof HTMLCanvasElement)) return -1;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return -1;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let darkest = 255 * 3;
    for (let i = 0; i < data.length; i += 4) {
      const sum = data[i]! + data[i + 1]! + data[i + 2]!;
      if (sum < darkest) darkest = sum;
    }
    let inked = 0;
    // A margin over the void, so compression and antialiasing at the very edge of a star do not
    // count as drawing. A star is well clear of it; a rounding error is not.
    for (let i = 0; i < data.length; i += 4) {
      if (data[i]! + data[i + 1]! + data[i + 2]! > darkest + 12) inked++;
    }
    return inked;
  });
}

const option = (index: number): string => `.${prefixFor('title')}option >> nth=${index}`;

describe.runIf(chromePath)('a style is a setting, and pressing it changes the picture', () => {
  it('THE REPORTED ONE: retro is the game before the sky, and the sky actually goes', async () => {
    /*
      Asked for as *"the pre-sky game was a really fun retro-sprite style game, can we add that in as
      our first setting?"* — so retro is not a filter over the modern look, it is the earlier one,
      and the measurable half of that is that the starfield stops being drawn.

      The title screen is the right place to count: it is a still field
      (`src/app/mount.ts`'s `seedField`), so the only thing that changes between the two readings is
      the sky.
    */
    const page = await open();
    const modern = STYLE_KINDS.indexOf('modern');
    const retro = STYLE_KINDS.indexOf('retro');
    expect(modern, 'the style table no longer has the two styles this test is about').toBeGreaterThan(-1);
    expect(retro, 'the style table no longer has the two styles this test is about').toBeGreaterThan(-1);

    await page.click(option(modern));
    await page.waitForTimeout(200);
    const withSky = await inkOn(page);
    expect(withSky, 'nothing is drawn at all, so this measures nothing').toBeGreaterThan(1000);

    await page.click(option(retro));
    await page.waitForTimeout(200);
    const withoutSky = await inkOn(page);

    expect(withoutSky, 'choosing retro left the sky on the screen').toBeLessThan(withSky);
    /*
      ⚠️ **A FRACTION and not a pixel count.** What is being asserted is *the starfield is gone*, and
      the starfield is most of what is drawn on a title screen — a threshold in pixels would be a
      number tied to a viewport, a DPI and a star count all at once.
    */
    expect(withoutSky / withSky, 'retro dropped some ink but not a starfield').toBeLessThan(0.5);
  });

  it('and the chooser says which one is on, in fill rather than in colour alone', async () => {
    /*
      `docs/decisions/0024-the-accessibility-floor-is-settings.md` puts *colour never carries meaning
      alone* in the unconditional tier, and which setting is live is exactly the state a hue would
      hide. The on-option is filled; the others are hollow.
    */
    const page = await open();
    const retro = STYLE_KINDS.indexOf('retro');
    await page.click(option(retro));
    await page.waitForTimeout(150);
    const marked = await page.evaluate((selector: string) => {
      return [...document.querySelectorAll(selector)].map((el) => {
        const style = getComputedStyle(el);
        return { on: el.className.includes('option-on'), background: style.backgroundColor };
      });
    }, '.' + prefixFor('title') + 'option');

    expect(marked.length, 'the chooser has no options at all').toBe(STYLE_KINDS.length);
    expect(marked.filter((m) => m.on).length, 'more or less than one option is marked').toBe(1);
    expect(marked[retro]!.on, 'the option that was pressed is not the one marked').toBe(true);
    const transparent = /rgba\(0,\s*0,\s*0,\s*0\)|transparent/;
    expect(marked[retro]!.background, 'the live option is not filled, so only colour says so').not.toMatch(transparent);
    const off = marked.find((m) => !m.on);
    expect(off?.background, 'an unchosen option is filled too, so the fill says nothing').toMatch(transparent);
  });

  it('and the UI half of it lands too, which is what "Retro UI" means', async () => {
    /*
      The ask names the UI, not the background: *"Retro UI / Modern UI"*. A style that changed only
      the sky would be a background toggle with a misleading name, so the chrome's face moves with
      it — and it moves on the READOUT as well as on the title, or the setting is half-applied the
      moment a run starts.
    */
    const page = await open();
    const face = (): Promise<string[]> =>
      page.evaluate(
        (names: string[]) => names.map((n) => document.querySelector(n)?.className ?? ''),
        ['.' + prefixFor('title').slice(0, -1), '.itc-playing-hud'],
      );

    await page.click(option(STYLE_KINDS.indexOf('modern')));
    await page.waitForTimeout(150);
    for (const className of await face()) {
      expect(className, `the modern style left a pixel face on: ${className}`).not.toContain('face-pixel');
    }

    await page.click(option(STYLE_KINDS.indexOf('retro')));
    await page.waitForTimeout(150);
    for (const className of await face()) {
      expect(className, `retro did not reach: ${className}`).toContain('face-pixel');
    }
    expect(STYLES.retro.face, 'the table stopped calling retro a pixel face, so this test is asking the wrong thing').toBe(
      'pixel',
    );
    await page.context().close();
  });
});
