/**
 * The way in, in a real page — `docs/decisions/0513-the-pilot-flies.md`, over
 * `docs/decisions/0415-the-golfer-is-chosen.md` and the intro of
 * `docs/decisions/0411-the-chase-begins-at-the-port.md` and `docs/decisions/0412-the-port-is-heard.md`.
 *
 * The claims `tests/intro.test.ts` cannot make, because they are about the DOM, the input and the sound
 * around the picture: the page opens on the name and asks for a press only once the game behind it has
 * loaded; that press turns the sound on and opens the pilot screen; the first flight plays the intro
 * with the pilot in it and the intro ends in the run; its Skip goes into the run and its key goes no
 * further; and on the pilot screen a tap looks and a second tap flies.
 *
 * ⚠️ **"NO FURTHER" IS THE WHOLE OF THE SKIP'S HALF.** The intro skips into the run since 0513, and the
 * key that skipped is a key the run listens for: Space throws a special and Escape pauses (0511). A
 * skip whose key carried through would spend a charge or pause a run the player had just asked for.
 */

import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { CANVAS_MS, INTRO_READY_MS } from './intro.ts';
import { afterFrames } from './frames.ts';
import { MENU_CONFIRM_BUTTONS } from '../src/app/menu.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { INTRO_STEPS, SPLASH_STEPS } from '../src/content/port.ts';
import { DEFAULT_GOLFER, GOLFERS, GOLFER_KINDS, type GolferKind } from '../src/content/golfers.ts';
import { MUSIC_LAYERS } from '../src/content/music.ts';
import { SCREENS, STEPS_PER_SECOND } from '../src/state/screens.ts';

vi.setConfig({ testTimeout: 180_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

const SPLASH = '.' + prefixFor('splash') + 'shown';
/** The splash's prompt, once it is up — 0513. */
const PROMPT = SPLASH + ' .' + prefixFor('splash') + 'action:not([hidden])';
const TITLE = '.' + prefixFor('title') + 'shown';
const FLY = TITLE + ' .' + prefixFor('title') + 'action';
const FACE = `${TITLE} [${SETTING_ATTR}="pilot"] .${prefixFor('title')}option`;
const HUD = '.itc-playing-hud-shown';
const PAUSED = '.' + prefixFor('paused') + 'shown';
const SKIP = '.' + prefixFor('intro') + 'skip';
const SKIP_SHOWN = '.' + prefixFor('intro') + 'skip-shown';

/**
 * How long the run may take to come up with nothing pressed, from the flight that starts the intro.
 *
 * ⚠️ **A BUDGET, SIZED ON 0245's TERMS, OWNED BY 0411 AND RE-SIZED BY 0414** for the longer intro:
 * 20.1 s of steps, and a step is a sixtieth of a second only while the loop keeps up. Measured
 * 2026-09-29, from the canvas to the title with nothing pressed: **20.6–21.2 s beside a running proof,
 * and 22.8–24.8 s while the whole suite ran** (three loads each). Three times the worst. A slower
 * handover is a loop that is not keeping time. Since 0513 it is the run the intro hands over to, on the
 * same clock.
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
  // Each screen as it is first shown, in order, by the page's own clock — the splash test reads it.
  await page.addInitScript(
    (selectors: Record<string, string>) => {
      const first: { screen: string; at: number }[] = [];
      (window as unknown as { __itcFirstShown: typeof first }).__itcFirstShown = first;
      new MutationObserver(() => {
        for (const [screen, selector] of Object.entries(selectors)) {
          if (first.some((f) => f.screen === screen)) continue;
          if (document.querySelector(selector) !== null) first.push({ screen, at: performance.now() });
        }
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    },
    { splash: SPLASH, prompt: PROMPT, title: TITLE },
  );
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
    // A pad with nothing pressed, which the pad tests below press — the menu suite's stub, smaller.
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
const pad = (page: Page, buttons: number[]): Promise<void> =>
  page.evaluate((b: number[]) => {
    (window as unknown as { __itcPad: { pressed: number[] } }).__itcPad.pressed = b;
  }, buttons);

/** Wait for the splash to ask, and press it with a click — the press that turns the sound on. */
async function begin(page: Page): Promise<void> {
  await page.waitForSelector(PROMPT, { timeout: INTRO_READY_MS });
  await page.mouse.click(640, 360);
  await page.waitForSelector(TITLE, { timeout: 5_000 });
  await afterFrames(page, 4);
}

/** On the pilot screen, choose `golfer` with a pointer and press Fly — the first flight of the visit. */
async function flyAs(page: Page, golfer: GolferKind = GOLFER_KINDS[0]!): Promise<void> {
  await page.locator(FACE).nth(GOLFER_KINDS.indexOf(golfer)).click();
  await page.locator(FLY, { hasText: SCREENS.title.actions[0]!.label }).first().click();
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

describe.runIf(chromePath)('the page opens on the name, and asks for a press once it has loaded', () => {
  it('THE ASK: shows the splash, puts up Press to begin only after it, and waits there for a press', async () => {
    /*
      ⚠️ **THE ORDER THE PAGE SHOWED THINGS IN, RECORDED BY THE PAGE** — 0440's lesson: an observer
      installed before the page's own script writes down each as it is first shown, and the test reads
      the order and the time between them, never a wall-clock wait standing in for *what came first*.
    */
    const page = await open();
    await page.waitForSelector(PROMPT, { timeout: INTRO_READY_MS });
    const order = await page.evaluate(() => (window as unknown as { __itcFirstShown: { screen: string; at: number }[] }).__itcFirstShown);
    expect(order[0]?.screen, 'the page did not open on the splash').toBe('splash');
    const splashAt = order.find((o) => o.screen === 'splash')!.at;
    const promptAt = order.find((o) => o.screen === 'prompt')?.at;
    expect(promptAt, 'the prompt was never recorded as shown').toBeDefined();
    // In seconds the player sees: the name is up for at least the steps it is owed, so it is read.
    expect((promptAt! - splashAt) / 1000, 'the press was asked for before the name had been on the screen its time').toBeGreaterThanOrEqual(
      (SPLASH_STEPS / STEPS_PER_SECOND) * 0.95,
    );
    // And it waits: nothing pressed, nothing moves on.
    await afterFrames(page, 90);
    expect(await shown(page, TITLE), 'the splash went on by itself, without the press that turns the sound on').toBe(false);
    expect(await contexts(page), 'the sound came on before anybody pressed').toBe(0);
    await page.mouse.click(640, 360);
    await page.waitForSelector(TITLE, { timeout: 5_000 });
    expect(await contexts(page), 'the press on the splash did not turn the sound on').toBe(1);
    // Every card on the pilot screen carries its golfer's face, drawn — not an empty box beside a name.
    const faces = await page.evaluate((selector: string) => {
      return [...document.querySelectorAll(selector + ' canvas')].map((c) => {
        const canvas = c as HTMLCanvasElement;
        const data = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
        let inked = 0;
        for (let i = 3; data !== undefined && i < data.length; i += 16) if (data[i]! > 0) inked++;
        return inked;
      });
    }, FACE);
    expect(faces.length, 'a golfer has no card').toBe(GOLFER_KINDS.length);
    expect(faces.every((inked) => inked > 100), 'a portrait is blank').toBe(true);
    await page.context().close();
  });

  it('keeps a press made while it loads, goes on when it may, and never freezes', async () => {
    /*
      ⚠️ **THE EARLY PRESS IS THE ONE THAT USED TO FREEZE** — 0412 measured 5.1 s with the picture
      stopped when the first unlock drained an unfinished load. So a press here is remembered, and the
      sound and the pilot screen arrive together without a second press.
    */
    const page = await open();
    await watchFrames(page);
    await page.mouse.click(640, 360);
    expect(await longestGap(page), 'the press froze the page').toBeLessThan(FROZEN_MS);
    await page.waitForSelector(TITLE, { timeout: INTRO_READY_MS });
    await page.waitForFunction(() => (window.__itcContexts ?? 0) > 0, null, { timeout: 5_000 });
    await page.context().close();
  });

  it("does not go on for a pad's press, which cannot turn the sound on", async () => {
    // A pad's button is polled and grants no activation (0412), so the page could not be heard after it.
    const page = await open();
    await page.waitForSelector(PROMPT, { timeout: INTRO_READY_MS });
    await afterFrames(page, 8);
    await pad(page, [MENU_CONFIRM_BUTTONS[0]!]);
    await afterFrames(page, 8);
    await pad(page, []);
    await afterFrames(page, 30);
    expect(await shown(page, TITLE), "the splash went on for a pad's press, into a page that cannot make a sound").toBe(false);
    await page.context().close();
  });

  it('goes to the pilot screen on Escape, and builds no sound', async () => {
    const page = await open();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForSelector(TITLE, { timeout: INTRO_READY_MS });
    await page.waitForTimeout(500);
    expect(await shown(page, HUD), 'Escape went on to start a run').toBe(false);
    expect(await contexts(page), 'Escape built the sound, which it never asked for').toBe(0);
    // And the first press on the pilot screen builds it, so a page that never built one proves nothing.
    await page.mouse.click(5, 5);
    await page.waitForFunction(() => (window.__itcContexts ?? 0) > 0, null, { timeout: 30_000 });
    await page.context().close();
  });
});

describe.runIf(chromePath)('the game behind the splash loads on the workers', () => {
  it('sends every base layer of the music to the bake pool, so the page is not the one baking it', async () => {
    /*
      ⚠️ **THE POOL HAS TO REACH THE PREWARM** — 0413. Counted by the time the splash asks for its
      press, which is when 0415 says the load is done.
    */
    const page = await open();
    await page.waitForSelector(PROMPT, { timeout: INTRO_READY_MS });
    expect(await page.evaluate(() => window.__itcPosts ?? -1), 'the base layers were not sent to the workers').toBeGreaterThanOrEqual(MUSIC_LAYERS.length);
    await page.context().close();
  });
});

describe.runIf(chromePath)('the first flight plays the intro, heard, with the pilot in it, into the run', () => {
  it('THE ASK: plays the intro on the first Fly, plays its cues, and hands over to the run by itself', async () => {
    const page = await open();
    await begin(page);
    await watchFrames(page);
    await flyAs(page);
    const started = Date.now();
    expect(await longestGap(page), 'the flight froze the page').toBeLessThan(FROZEN_MS);
    expect(await shown(page, SKIP_SHOWN), 'the intro opened without its skip, though the game had loaded').toBe(true);
    await page.waitForFunction(() => (window.__itcCues ?? 0) > 0, null, { timeout: HANDOVER_MS });
    expect(await shown(page, HUD), 'the intro was over before any of it was heard').toBe(false);
    await page.waitForSelector(HUD, { timeout: HANDOVER_MS });
    expect(Date.now() - started, 'the run came up long before the intro could have ended').toBeGreaterThan((INTRO_STEPS / STEPS_PER_SECOND) * 1000 * 0.9);
    expect(await shown(page, TITLE), 'the intro ended on the title, with the flight it was for not flown').toBe(false);
    await page.context().close();
  });

  it('runs the pilot who was chosen out of the bar', async () => {
    /*
      ⚠️ **THE PICTURE, NOT THE STATE** — 0027. The pilot's cap is the golfer's own colour and appears
      nowhere else in the port, so it is counted on the canvas while they run for the ship: the chosen
      golfer's cap, and at that same moment none of the other's.

      ⚠️ **AND THE MOMENT IS THE PICTURE'S, NOT THE CLOCK'S** — 0044. It waits for EITHER cap to be
      drawn — the chosen golfer's, or the one that should not be there — with the handover's budget as
      the bound, and reads both on that same frame. Measured 2026-09-30 over two whole intros, alone:
      Feather's teal and Bo's violet each 0 px for the whole intro unless that golfer was picked, and
      106 and 126 px at most while they ran.
    */
    const capsWhenRunning = async (golfer: 'feather' | 'bo', other: 'feather' | 'bo'): Promise<{ mine: number; theirs: number }> => {
      const page = await open();
      await begin(page);
      await flyAs(page, golfer);
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
    expect(feather.mine, 'Feather was chosen and her cap is not in the intro').toBeGreaterThan(10);
    expect(feather.theirs, 'Feather was chosen and Bo ran out of the bar beside her').toBe(0);
    const bo = await capsWhenRunning('bo', 'feather');
    expect(bo.mine, 'Bo was chosen and their cap is not in the intro').toBeGreaterThan(10);
    expect(bo.theirs, 'Bo was chosen and Feather ran out of the bar').toBe(0);
  });
});

describe.runIf(chromePath)('the skip goes into the run, and its key no further', () => {
  /** On the pilot screen past the splash, with the first flight's intro up. */
  const intro = async (): Promise<Page> => {
    const page = await open();
    await begin(page);
    await flyAs(page);
    await page.waitForSelector(SKIP_SHOWN, { timeout: 5_000 });
    return page;
  };

  it('goes on a click', async () => {
    const page = await intro();
    await page.click(SKIP);
    await page.waitForSelector(HUD, { timeout: 5_000 });
    expect(await shown(page, SKIP_SHOWN), 'the skip is still up over the run').toBe(false);
    await page.context().close();
  });

  it("goes on the pad's confirm", async () => {
    const page = await intro();
    await afterFrames(page, 8);
    await pad(page, [MENU_CONFIRM_BUTTONS[0]!]);
    await afterFrames(page, 8);
    await pad(page, []);
    await page.waitForSelector(HUD, { timeout: 5_000 });
    await page.context().close();
  });

  it('goes on Escape, and the Escape does not pause the run it skipped into', async () => {
    const page = await intro();
    await page.keyboard.press('Escape');
    await page.waitForSelector(HUD, { timeout: 5_000 });
    await afterFrames(page, 10);
    expect(await shown(page, PAUSED), 'the Escape that skipped the intro paused the run as well').toBe(false);
    await page.context().close();
  });

  /** The readout's charges a few frames into the run, after the intro was left by `leave`. */
  const chargesAfter = async (leave: (page: Page) => Promise<void>): Promise<{ charges: string; paused: boolean }> => {
    const page = await intro();
    await leave(page);
    await page.waitForSelector(HUD, { timeout: 5_000 });
    await afterFrames(page, 20);
    const charges = await page.evaluate(() => [...document.querySelectorAll('.itc-playing-hud-stack')].map((g) => g.textContent ?? '').join('|'));
    const paused = await shown(page, PAUSED);
    await page.context().close();
    return { charges, paused };
  };

  for (const key of ['Space', 'Enter'] as const) {
    it(`goes on ${key}, and ${key} throws nothing in the run`, async () => {
      // A run skipped into by a click is the kit as issued; one a key threw a special in has one fewer.
      const clicked = await chargesAfter((page) => page.click(SKIP));
      const keyed = await chargesAfter((page) => page.keyboard.press(key));
      expect(clicked.charges.length, 'the readout says nothing to compare').toBeGreaterThan(0);
      expect(keyed.charges, `${key} skipped the intro and spent a charge in the run as well`).toBe(clicked.charges);
      expect(keyed.paused, `${key} paused the run`).toBe(false);
    });
  }
});

describe.runIf(chromePath)('the pilot screen: a tap looks, a second tap flies', () => {
  it('THE ASK: a first tap on another card says who they are, and a second on the same one flies them', async () => {
    const page = await open();
    await begin(page);
    const card = (): Promise<string | null> => page.textContent(TITLE + ' .' + prefixFor('title') + 'pilot-name');
    expect(await card(), 'the panel does not say who is highlighted').toBe(GOLFERS[DEFAULT_GOLFER].name);
    const larry = page.locator(FACE).nth(GOLFER_KINDS.indexOf('larry'));
    await larry.click();
    await afterFrames(page, 4);
    expect(await shown(page, TITLE), 'a first tap on a pilot flew them').toBe(true);
    expect(await card(), 'the panel did not take the pilot who was tapped').toBe(GOLFERS.larry.name);
    const bio = await page.textContent(TITLE + ' .' + prefixFor('title') + 'pilot-bio');
    expect(bio, 'the panel does not say who Larry is').toBe(GOLFERS.larry.bio);
    await larry.click();
    await page.waitForSelector(SKIP_SHOWN, { timeout: 5_000 });
    expect(await shown(page, TITLE), 'a second tap on the highlighted pilot did not fly them').toBe(false);
    await page.context().close();
  });

  it('and the first tap on the pilot already highlighted at boot is a look, not a launch', async () => {
    // A thumb's first landing is not a decision (0358): the boot's highlighted card is armed by a tap.
    const page = await open();
    await begin(page);
    const bo = page.locator(FACE).nth(GOLFER_KINDS.indexOf(DEFAULT_GOLFER));
    await bo.click();
    await afterFrames(page, 10);
    expect(await shown(page, TITLE), "a first tap on the boot's highlighted pilot flew them").toBe(true);
    await bo.click();
    await page.waitForSelector(SKIP_SHOWN, { timeout: 5_000 });
    await page.context().close();
  });
});
