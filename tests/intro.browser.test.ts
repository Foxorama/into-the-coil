/**
 * The intro in a real page — `docs/decisions/0411-the-chase-begins-at-the-port.md` and
 * `docs/decisions/0412-the-port-is-heard.md`.
 *
 * The claims `tests/intro.test.ts` cannot make, because they are about the DOM, the input and the
 * sound around the picture rather than the picture: the page opens on it and draws it, it hands over
 * to the title with nothing pressed, its Skip appears once the game behind it has loaded, a skip goes
 * to the title and no further, and a press that is not a skip turns the sound on without freezing it.
 *
 * ⚠️ **"NO FURTHER" IS THE WHOLE OF THE SKIP'S HALF.** A skip moves focus onto the title's first
 * control, which is a tier. Space activates a focused button on its RELEASE and Enter on its press, so
 * a skip whose key carried through would start a run the player never chose — 0411's first build did.
 */

import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { INTRO_READY_MS } from './intro.ts';
import { afterFrames } from './frames.ts';
import { MENU_CONFIRM_BUTTONS } from '../src/app/menu.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { INTRO_STEPS } from '../src/content/port.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';

vi.setConfig({ testTimeout: 180_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

const TITLE = '.' + prefixFor('title') + 'shown';
const HUD = '.itc-playing-hud-shown';
const SKIP = '.' + prefixFor('intro') + 'skip';
const SKIP_SHOWN = '.' + prefixFor('intro') + 'skip-shown';

/**
 * How long the title may take to come up with nothing pressed, from the canvas appearing.
 *
 * ⚠️ **A BUDGET, SIZED ON 0245's TERMS AND OWNED BY 0411.** The intro is 16.6 s of steps, and a step is
 * a sixtieth of a second only while the loop keeps up. Measured 2026-09-29, from the canvas to the
 * title with nothing pressed: **17.3–17.8 s alone, and 17.6–20.3 s while the whole suite ran** (nine
 * loads). Three times the worst of those. A slower handover is a loop that is not keeping time.
 */
const HANDOVER_MS = 61_000;

/**
 * The longest gap between two frames across a press on the intro — a frozen picture is the defect.
 *
 * ⚠️ **A BUDGET, SIZED ON 0245's TERMS AND OWNED BY 0412.** Measured 2026-09-29, a press 1.5 s in:
 * **33–50 ms alone, and 83–617 ms while the whole suite ran** (twelve presses). Three times the worst.
 * The defect it is for is the whole remaining load run on the press — 5.1 s at 0.3 s in, measured on
 * 0411's first build — so the two cannot be mistaken for each other. (The intro's own first second
 * hitches for 144–423 ms at boot, pressed or not; the press waits past it.)
 */
const FROZEN_MS = 1_900;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

declare global {
  interface Window {
    __itcContexts?: number;
    __itcCues?: number;
  }
}

async function open(): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  /*
    Count every audio context the page builds — the unlock is the only thing that builds one — and
    every CUE that starts: a source whose buffer is short, which the music's loops never are.
  */
  await page.addInitScript(() => {
    const Real = window.AudioContext;
    window.__itcContexts = 0;
    window.__itcCues = 0;
    window.AudioContext = class extends Real {
      constructor(options?: AudioContextOptions) {
        super(options);
        window.__itcContexts = (window.__itcContexts ?? 0) + 1;
      }
    };
    // A pad with nothing pressed, which the pad test below presses — the menu suite's stub, smaller.
    const pad = { pressed: [] as number[] };
    (window as unknown as { __itcPad: typeof pad }).__itcPad = pad;
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: (): (Gamepad | null)[] => [
        {
          id: 'itc-test-pad',
          index: 0,
          connected: true,
          mapping: 'standard',
          axes: [0, 0],
          buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pad.pressed.includes(i), touched: pad.pressed.includes(i), value: pad.pressed.includes(i) ? 1 : 0 })),
          timestamp: 0,
        } as unknown as Gamepad,
      ],
    });
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (this: AudioBufferSourceNode, ...args: Parameters<typeof start>): void {
      if (this.buffer !== null && this.buffer.duration <= 1.5) window.__itcCues = (window.__itcCues ?? 0) + 1;
      start.apply(this, args);
    };
  });
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: 15_000 });
  return page;
}

const shown = (page: Page, selector: string): Promise<boolean> => page.evaluate((s: string) => document.querySelector(s) !== null, selector);
const contexts = (page: Page): Promise<number> => page.evaluate(() => window.__itcContexts ?? -1);

/**
 * Watch the frames from now, and report the longest gap between two — the honest "did the page
 * freeze". ⚠️ **In the page, and started BEFORE the press**: a frame timed after the press returns
 * would start after the freeze had ended, and read a frozen page as a smooth one.
 */
const watchFrames = (page: Page): Promise<void> =>
  page.evaluate(() => {
    const w = window as unknown as { __itcGap: number };
    w.__itcGap = 0;
    let last = performance.now();
    const tick = (now: number): void => {
      w.__itcGap = Math.max(w.__itcGap, now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
const longestGap = async (page: Page): Promise<number> => {
  await page.waitForTimeout(1_000);
  return page.evaluate(() => (window as unknown as { __itcGap: number }).__itcGap);
};

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

  it('skips at once on Escape, chooses nothing, and builds no sound', async () => {
    const page = await open();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForSelector(TITLE, { timeout: 5_000 });
    await page.waitForTimeout(500);
    expect(await shown(page, HUD), 'Escape skipped the intro and went on to start a run').toBe(false);
    expect(await contexts(page), 'Escape built the sound, which it never asked for').toBe(0);
    // And the first press on the title builds it, so a page that never built one proves nothing.
    await page.mouse.click(5, 5);
    await page.waitForFunction(() => (window.__itcContexts ?? 0) > 0, null, { timeout: 30_000 });
    await page.context().close();
  });
});

describe.runIf(chromePath)('the skip waits for the game behind the intro', () => {
  it('is not offered until the game has loaded, and then is', async () => {
    const page = await open();
    await page.waitForTimeout(300);
    expect(await shown(page, SKIP_SHOWN), 'the skip was offered before anything behind the intro had loaded').toBe(false);
    await page.waitForSelector(SKIP_SHOWN, { timeout: INTRO_READY_MS });
    expect(await shown(page, TITLE), 'the intro ended before its skip was offered').toBe(false);
    await page.context().close();
  });

  it('and Escape still asks for no sound once it is offered', async () => {
    // Before the load a press is only remembered, so the Escape above could not show this half.
    const page = await open();
    await page.waitForSelector(SKIP_SHOWN, { timeout: INTRO_READY_MS });
    await page.keyboard.press('Escape');
    await page.waitForSelector(TITLE, { timeout: 5_000 });
    expect(await contexts(page), 'Escape built the sound, which it never asked for').toBe(0);
    await page.context().close();
  });

  it('goes to the title on a click, and the click chooses nothing there', async () => {
    const page = await open();
    await page.waitForSelector(SKIP_SHOWN, { timeout: INTRO_READY_MS });
    await page.click(SKIP);
    await page.waitForSelector(TITLE, { timeout: 5_000 });
    await page.waitForTimeout(500);
    expect(await shown(page, HUD), 'the skip went on to start a run').toBe(false);
    expect(await shown(page, SKIP_SHOWN), 'the skip is still up over the title').toBe(false);
    await page.context().close();
  });

  it("goes to the title on the pad's confirm once it is offered, and chooses nothing there", async () => {
    const page = await open();
    const press = (buttons: number[]): Promise<void> =>
      page.evaluate((b: number[]) => {
        (window as unknown as { __itcPad: { pressed: number[] } }).__itcPad.pressed = b;
      }, buttons);
    await page.waitForSelector(SKIP_SHOWN, { timeout: INTRO_READY_MS });
    await press([MENU_CONFIRM_BUTTONS[0]!]);
    await afterFrames(page, 8);
    await press([]);
    await page.waitForSelector(TITLE, { timeout: 5_000 });
    await afterFrames(page, 30);
    expect(await shown(page, HUD), 'the pad skipped the intro and went on to start a run').toBe(false);
    await page.context().close();
  });

  for (const key of ['Space', 'Enter'] as const) {
    it(`goes to the title on ${key} once it is offered, and ${key} chooses nothing there`, async () => {
      const page = await open();
      await page.waitForSelector(SKIP_SHOWN, { timeout: INTRO_READY_MS });
      await page.keyboard.press(key);
      await page.waitForSelector(TITLE, { timeout: 5_000 });
      await page.waitForTimeout(500);
      expect(await shown(page, HUD), `${key} skipped the intro and went on to start a run`).toBe(false);
      expect(await shown(page, TITLE), `${key} left the title as well as the intro`).toBe(true);
      await page.context().close();
    });
  }
});

describe.runIf(chromePath)('a press on the intro is heard, and never frozen', () => {
  it('turns the sound on without skipping or freezing, and the intro plays its cues', async () => {
    /*
      ⚠️ **THE PRESS COMES BEFORE THE GAME HAS LOADED, WHICH IS THE CASE THAT USED TO FREEZE.** 0411's
      first build unlocked on such a press and drained the prewarm on the spot: 5.1 s with the picture
      stopped. 0412 keeps the request until the load finishes, so the frame after the press arrives on
      time, no sound is built yet, and the sound arrives with the Skip.
    */
    const page = await open();
    // Past the first second, whose boot hitch (144–423 ms, pressed or not) is not the press's to answer
    // for — and still well before the load, which took 6.2 s at the quickest measured.
    await page.waitForTimeout(1_500);
    await watchFrames(page);
    await page.mouse.click(640, 360);
    expect(await longestGap(page), 'the press froze the picture').toBeLessThan(FROZEN_MS);
    expect(await shown(page, TITLE), 'a press that was not a skip skipped').toBe(false);
    await page.waitForSelector(SKIP_SHOWN, { timeout: INTRO_READY_MS });
    await page.waitForFunction(() => (window.__itcContexts ?? 0) > 0, null, { timeout: 5_000 });
    // The beats after the load are heard — the alarm, the steps, the launches — before the title.
    await page.waitForFunction(() => (window.__itcCues ?? 0) > 0, null, { timeout: HANDOVER_MS });
    expect(await shown(page, TITLE), 'the intro was over before any of it was heard').toBe(false);
    await page.context().close();
  });

  it('turns the sound on at once when the game has loaded', async () => {
    const page = await open();
    await page.waitForSelector(SKIP_SHOWN, { timeout: INTRO_READY_MS });
    expect(await contexts(page), 'the sound came on with nobody having pressed anything').toBe(0);
    await watchFrames(page);
    await page.mouse.click(640, 200);
    expect(await longestGap(page), 'the press froze the picture').toBeLessThan(FROZEN_MS);
    expect(await contexts(page), 'a press after the load did not turn the sound on').toBe(1);
    expect(await shown(page, TITLE), 'a press that was not a skip skipped').toBe(false);
    await page.context().close();
  });
});
