/**
 * The way in, in a real page — `docs/decisions/0415-the-golfer-is-chosen.md`, with the intro of
 * `docs/decisions/0411-the-chase-begins-at-the-port.md` and `docs/decisions/0412-the-port-is-heard.md`.
 *
 * The claims `tests/intro.test.ts` cannot make, because they are about the DOM, the input and the sound
 * around the picture: the page opens on the name and offers the golfers only once the game behind it
 * has loaded; the pick turns the sound on and plays the intro with the golfer in it; the intro's Skip
 * is up for the whole of it; a skip goes to the title and no further; Escape goes to the menu from
 * anywhere before it; and *Pilot* on the menu changes golfer and comes back.
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
import { CANVAS_MS, INTRO_READY_MS } from './intro.ts';
import { afterFrames } from './frames.ts';
import { MENU_CONFIRM_BUTTONS } from '../src/app/menu.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { INTRO_STEPS } from '../src/content/port.ts';
import { GOLFERS, GOLFER_KINDS } from '../src/content/golfers.ts';
import { MUSIC_LAYERS } from '../src/content/music.ts';
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';

vi.setConfig({ testTimeout: 180_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

const SPLASH = '.' + prefixFor('splash') + 'shown';
const SELECT = '.' + prefixFor('select') + 'shown';
const GOLFER = '.' + prefixFor('select') + 'action';
const TITLE = '.' + prefixFor('title') + 'shown';
const TITLE_ACTION = '.' + prefixFor('title') + 'action';
const HUD = '.itc-playing-hud-shown';
const SKIP = '.' + prefixFor('intro') + 'skip';
const SKIP_SHOWN = '.' + prefixFor('intro') + 'skip-shown';

/**
 * How long the title may take to come up with nothing pressed, from the pick that starts the intro.
 *
 * ⚠️ **A BUDGET, SIZED ON 0245's TERMS, OWNED BY 0411 AND RE-SIZED BY 0414** for the longer intro:
 * 20.1 s of steps, and a step is a sixtieth of a second only while the loop keeps up. Measured
 * 2026-09-29, from the canvas to the title with nothing pressed: **20.6–21.2 s beside a running proof,
 * and 22.8–24.8 s while the whole suite ran** (three loads each). Three times the worst. A slower
 * handover is a loop that is not keeping time. (It was 61 s against 0411's 16.6.)
 */
const HANDOVER_MS = 75_000;

/**
 * The longest gap between two frames across a press — a frozen picture is the defect.
 *
 * ⚠️ **A BUDGET, SIZED ON 0245's TERMS AND OWNED BY 0412.** Measured 2026-09-29, a press 1.5 s into
 * the intro: **33–50 ms alone, and 83–617 ms while the whole suite ran** (twelve presses). Three times
 * the worst. The defect it is for is the whole remaining load run on the press — 5.1 s when 0411's
 * first build did it — so the two cannot be mistaken for each other.
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
    __itcPosts?: number;
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
    // Every message the page sends a worker — a layer asked of the bake pool is one (0413).
    window.__itcPosts = 0;
    const post = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (this: Worker, ...args: unknown[]): void {
      window.__itcPosts = (window.__itcPosts ?? 0) + 1;
      (post as (...a: unknown[]) => void).apply(this, args);
    } as typeof post;
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (this: AudioBufferSourceNode, ...args: Parameters<typeof start>): void {
      if (this.buffer !== null && this.buffer.duration <= 1.5) window.__itcCues = (window.__itcCues ?? 0) + 1;
      start.apply(this, args);
    };
  });
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  return page;
}

const shown = (page: Page, selector: string): Promise<boolean> => page.evaluate((s: string) => document.querySelector(s) !== null, selector);
const contexts = (page: Page): Promise<number> => page.evaluate(() => window.__itcContexts ?? -1);

/** Wait for the golfers, and pick one with a click — the press that turns the sound on. */
async function pick(page: Page, golfer = 0): Promise<void> {
  await page.waitForSelector(SELECT, { timeout: INTRO_READY_MS });
  await page.locator(GOLFER).nth(golfer).click();
}

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

describe.runIf(chromePath)('the page opens on the name, and offers the golfers once it has loaded', () => {
  it('shows the splash first, and the golfers only after it', async () => {
    const page = await open();
    await page.waitForTimeout(300);
    expect(await shown(page, SPLASH), 'the page did not open on the splash').toBe(true);
    expect(await shown(page, SELECT), 'the golfers were offered before the game behind them had loaded').toBe(false);
    await page.waitForSelector(SELECT, { timeout: INTRO_READY_MS });
    expect(await page.locator(GOLFER).count(), 'the golfers are not the table').toBe(GOLFER_KINDS.length);
    // Every card carries its golfer's face, drawn — not an empty box beside a name.
    const faces = await page.evaluate((selector: string) => {
      return [...document.querySelectorAll(selector + ' canvas')].map((c) => {
        const canvas = c as HTMLCanvasElement;
        const data = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
        let inked = 0;
        for (let i = 3; data !== undefined && i < data.length; i += 16) if (data[i]! > 0) inked++;
        return inked;
      });
    }, GOLFER);
    expect(faces.length, 'a golfer has no portrait').toBe(GOLFER_KINDS.length);
    expect(faces.every((inked) => inked > 100), 'a portrait is blank').toBe(true);
    await page.context().close();
  });

  it('keeps a press on the splash, turns the sound on when the game has loaded, and never freezes', async () => {
    /*
      ⚠️ **THE EARLY PRESS IS THE ONE THAT USED TO FREEZE** — 0412 measured 5.1 s with the picture
      stopped when the first unlock drained an unfinished load. So a press here is remembered, and the
      sound arrives with the golfers.
    */
    const page = await open();
    await watchFrames(page);
    await page.mouse.click(640, 360);
    expect(await longestGap(page), 'the press froze the page').toBeLessThan(FROZEN_MS);
    await page.waitForSelector(SELECT, { timeout: INTRO_READY_MS });
    await page.waitForFunction(() => (window.__itcContexts ?? 0) > 0, null, { timeout: 5_000 });
    await page.context().close();
  });

  it('goes to the menu on Escape from the splash, chooses nothing, and builds no sound', async () => {
    const page = await open();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForSelector(TITLE, { timeout: 5_000 });
    await page.waitForTimeout(500);
    expect(await shown(page, HUD), 'Escape went on to start a run').toBe(false);
    expect(await contexts(page), 'Escape built the sound, which it never asked for').toBe(0);
    // And the first press on the title builds it, so a page that never built one proves nothing.
    await page.mouse.click(5, 5);
    await page.waitForFunction(() => (window.__itcContexts ?? 0) > 0, null, { timeout: 30_000 });
    await page.context().close();
  });

  it('goes to the menu on Escape from the golfers too, and builds no sound', async () => {
    const page = await open();
    await page.waitForSelector(SELECT, { timeout: INTRO_READY_MS });
    await page.keyboard.press('Escape');
    await page.waitForSelector(TITLE, { timeout: 5_000 });
    expect(await contexts(page), 'Escape on the golfers built the sound').toBe(0);
    await page.context().close();
  });
});

describe.runIf(chromePath)('the game behind the splash loads on the workers', () => {
  it('sends every base layer of the music to the bake pool, so the page is not the one baking it', async () => {
    /*
      ⚠️ **THE POOL HAS TO REACH THE PREWARM** — 0413. `src/main.ts` hands it over, and `mount` starts
      the prewarm after the first paint; without it every layer is walked on the main thread again,
      which is seconds of dropped frames and a late splash — and every unit test would still pass,
      because none of them has a browser's workers. Counted by the time the golfers are offered, which
      is when 0415 says the load is done.
    */
    const page = await open();
    await page.waitForSelector(SELECT, { timeout: INTRO_READY_MS });
    expect(await page.evaluate(() => window.__itcPosts ?? -1), 'the base layers were not sent to the workers').toBeGreaterThanOrEqual(MUSIC_LAYERS.length);
    await page.context().close();
  });
});

describe.runIf(chromePath)('a pick plays the intro, heard, with the golfer in it', () => {
  it('turns the sound on with the pick, never freezes, plays the cues, and hands over by itself', async () => {
    const page = await open();
    await page.waitForSelector(SELECT, { timeout: INTRO_READY_MS });
    expect(await contexts(page), 'the sound came on before anybody picked').toBe(0);
    await watchFrames(page);
    await pick(page);
    const started = Date.now();
    expect(await longestGap(page), 'the pick froze the page').toBeLessThan(FROZEN_MS);
    expect(await contexts(page), 'the pick did not turn the sound on').toBe(1);
    expect(await shown(page, SKIP_SHOWN), 'the intro opened without its skip, though the game had loaded').toBe(true);
    await page.waitForFunction(() => (window.__itcCues ?? 0) > 0, null, { timeout: HANDOVER_MS });
    expect(await shown(page, TITLE), 'the intro was over before any of it was heard').toBe(false);
    await page.waitForSelector(TITLE, { timeout: HANDOVER_MS });
    expect(Date.now() - started, 'the title came up long before the intro could have ended').toBeGreaterThan((INTRO_STEPS / STEPS_PER_SECOND) * 1000 * 0.9);
    expect(await shown(page, HUD), 'the intro ended in a run').toBe(false);
    await page.context().close();
  });

  it('runs the golfer who was picked out of the bar', async () => {
    /*
      ⚠️ **THE PICTURE, NOT THE STATE** — 0027. The pilot's cap is the golfer's own colour and appears
      nowhere else in the port, so it is counted on the canvas while they run for the ship: the picked
      golfer's cap, and at that same moment none of the other's.

      ⚠️ **AND THE MOMENT IS THE PICTURE'S, NOT THE CLOCK'S** — 0044. This slept to the middle of the
      run as the beats would place it at sixty steps a second, which is a 2.2 s window about 9.8 s
      after the pick; under the whole suite the loop falls behind real time and the count landed on an
      empty deck — *"Feather was picked and her cap is not in the intro: expected 0"*, passing alone
      three times in three. So it waits for EITHER cap to be drawn — the picked golfer's, or the one
      that should not be there — with the handover's budget as the bound, and reads both on that same
      frame. Measured 2026-09-30 over two whole intros, alone: Feather's teal and Bo's violet each 0 px
      for the whole intro unless that golfer was picked, and 106 and 126 px at most while they ran.
    */
    const capsWhenRunning = async (golfer: 'feather' | 'bo', other: 'feather' | 'bo'): Promise<{ mine: number; theirs: number }> => {
      const page = await open();
      await pick(page, GOLFER_KINDS.indexOf(golfer));
      const seen = page.waitForFunction(
        ([mine, theirs]: [string, string]) => {
          const canvas = document.querySelector('#app canvas');
          if (!(canvas instanceof HTMLCanvasElement)) return null;
          const data = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
          if (data === undefined) return null;
          const count = (hex: string): number => {
            const want = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
            let n = 0;
            for (let i = 0; i < data.length; i += 4) {
              if (Math.abs(data[i]! - want[0]!) <= 6 && Math.abs(data[i + 1]! - want[1]!) <= 6 && Math.abs(data[i + 2]! - want[2]!) <= 6) n++;
            }
            return n;
          };
          const drawn = { mine: count(mine), theirs: count(theirs) };
          return drawn.mine > 10 || drawn.theirs > 10 ? drawn : null;
        },
        [GOLFERS[golfer].cap, GOLFERS[other].cap] as [string, string],
        { timeout: HANDOVER_MS, polling: 100 },
      );
      // A page that never draws either cap is a wait that runs out, and says so in the claim's words.
      const drawn = await seen.then(
        async (handle) => (await handle.jsonValue()) as { mine: number; theirs: number },
        () => ({ mine: 0, theirs: 0 }),
      );
      await page.context().close();
      return drawn;
    };
    const feather = await capsWhenRunning('feather', 'bo');
    expect(feather.mine, 'Feather was picked and her cap is not in the intro').toBeGreaterThan(10);
    expect(feather.theirs, 'Feather was picked and Bo ran out of the bar beside her').toBe(0);
    const bo = await capsWhenRunning('bo', 'feather');
    expect(bo.mine, 'Bo was picked and their cap is not in the intro').toBeGreaterThan(10);
    expect(bo.theirs, 'Bo was picked and Feather ran out of the bar').toBe(0);
  });
});

describe.runIf(chromePath)('the skip goes to the title and no further', () => {
  it('goes on a click', async () => {
    const page = await open();
    await pick(page);
    await page.click(SKIP);
    await page.waitForSelector(TITLE, { timeout: 5_000 });
    await page.waitForTimeout(500);
    expect(await shown(page, HUD), 'the skip went on to start a run').toBe(false);
    expect(await shown(page, SKIP_SHOWN), 'the skip is still up over the title').toBe(false);
    await page.context().close();
  });

  it("goes on the pad's confirm", async () => {
    const page = await open();
    const press = (buttons: number[]): Promise<void> =>
      page.evaluate((b: number[]) => {
        (window as unknown as { __itcPad: { pressed: number[] } }).__itcPad.pressed = b;
      }, buttons);
    await pick(page);
    await afterFrames(page, 8);
    await press([MENU_CONFIRM_BUTTONS[0]!]);
    await afterFrames(page, 8);
    await press([]);
    await page.waitForSelector(TITLE, { timeout: 5_000 });
    await afterFrames(page, 30);
    expect(await shown(page, HUD), 'the pad skipped the intro and went on to start a run').toBe(false);
    await page.context().close();
  });

  it('goes on Escape', async () => {
    const page = await open();
    await pick(page);
    await page.keyboard.press('Escape');
    await page.waitForSelector(TITLE, { timeout: 5_000 });
    expect(await shown(page, HUD), 'Escape skipped the intro and went on to start a run').toBe(false);
    await page.context().close();
  });

  for (const key of ['Space', 'Enter'] as const) {
    it(`goes on ${key}, and ${key} chooses nothing there`, async () => {
      const page = await open();
      await pick(page);
      await page.keyboard.press(key);
      await page.waitForSelector(TITLE, { timeout: 5_000 });
      await page.waitForTimeout(500);
      expect(await shown(page, HUD), `${key} skipped the intro and went on to start a run`).toBe(false);
      expect(await shown(page, TITLE), `${key} left the title as well as the intro`).toBe(true);
      await page.context().close();
    });
  }
});

describe.runIf(chromePath)('Pilot on the menu changes golfer without going back through the intro', () => {
  it('opens the golfers, and a pick comes straight back to the menu and says who is flying', async () => {
    const page = await open();
    await page.keyboard.press('Escape');
    await page.waitForSelector(TITLE, { timeout: 5_000 });
    const pilot = page.locator(TITLE_ACTION).nth(DIFFICULTY_KINDS.length + 1);
    expect(await pilot.textContent(), 'the menu does not say who is flying').toContain(GOLFERS.bo.name);
    await pilot.click();
    await page.waitForSelector(SELECT, { timeout: 5_000 });
    const larry = GOLFER_KINDS.indexOf('larry');
    await page.locator(GOLFER).nth(larry).click();
    await page.waitForSelector(TITLE, { timeout: 5_000 });
    expect(await shown(page, SKIP_SHOWN), 'a pick from the menu played the intro').toBe(false);
    expect(await pilot.textContent(), 'the menu did not take the new golfer').toContain(GOLFERS.larry.name);
    await page.context().close();
  });
});
