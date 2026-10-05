import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { afterFrames } from './frames.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openHangar, shown } from './title.ts';
import { MENU_CONFIRM_BUTTONS, MENU_DPAD_BUTTONS, MENU_REPEAT_AFTER, MENU_TAB_BUTTONS } from '../src/app/menu.ts';
import { MAX_STEPS } from '../src/app/loop.ts';
import { GOLFERS, GOLFER_KINDS } from '../src/content/golfers.ts';
import { SCREENS, type Screen } from '../src/state/screens.ts';

/**
 * THE HANGAR HOLDS STILL — `docs/decisions/0548-the-hangar-holds-still.md`.
 *
 * Three asks from one play of the hangar's tabs: the plate stood at another size on each and the strip on
 * its head jumped as they were stepped; a pad got from Cosmo's back to Hangin' Out only by a walk the
 * player had to know; and Cosmo's tried a ware on whichever ship was on the pad with no way to change it
 * there. Each is asked of the real page — the first in pixels, the second with a pad stubbed on
 * `tests/menu.browser.test.ts`'s terms, the third through the band a player presses.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

/** The page-global the stub pad reads. Named so a failure in the console points at this file. */
const PAD_STATE = '__itcStillPad';

/** The hangar's tabs, read off its row. */
const TABS: readonly Screen[] = SCREENS.hangar.tabs;

async function open(width: number, height: number): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.addInitScript((key: string) => {
    const state = { pressed: [] as number[] };
    (window as unknown as Record<string, unknown>)[key] = state;
    const snapshot = (): (Gamepad | null)[] => [
      {
        id: 'itc-still-pad',
        index: 0,
        connected: true,
        mapping: 'standard',
        axes: [0, 0],
        buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: state.pressed.includes(i), touched: state.pressed.includes(i), value: state.pressed.includes(i) ? 1 : 0 })),
        timestamp: 0,
      } as unknown as Gamepad,
    ];
    Object.defineProperty(navigator, 'getGamepads', { value: snapshot, configurable: true });
  }, PAD_STATE);
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  return page;
}

/**
 * One tap of a pad button, pressed and released inside one evaluate — `tests/menu.browser.test.ts` has why:
 * a release sent from here arrived after the repeat had fired on a loaded runner.
 */
const TAP_FRAMES = Math.floor((MENU_REPEAT_AFTER - 1) / MAX_STEPS);
async function tap(page: Page, button: number): Promise<void> {
  await page.evaluate(
    ({ key, button, frames }: { key: string; button: number; frames: number }) =>
      new Promise<void>((done) => {
        const state = (window as unknown as Record<string, { pressed: number[] }>)[key]!;
        state.pressed = [button];
        let left = frames;
        const tick = (): void => {
          left -= 1;
          if (left > 0) {
            requestAnimationFrame(tick);
            return;
          }
          state.pressed = [];
          done();
        };
        requestAnimationFrame(tick);
      }),
    { key: PAD_STATE, button, frames: TAP_FRAMES },
  );
  await afterFrames(page, 8);
}

/** Which hangar tab is shown, and the words of whatever the cursor's ring is on. */
async function where(page: Page): Promise<{ screen: Screen | undefined; ring: string }> {
  const screen = await page.evaluate((tabs) => tabs.find((tab) => document.querySelector('.itc-' + tab + '-shown') !== null), [...TABS]);
  const found = TABS.find((tab) => tab === screen);
  if (found === undefined) return { screen: undefined, ring: '' };
  const ring = await page.evaluate((cls: string) => {
    const el = document.querySelector('.' + cls);
    return el === null ? '' : (el.getAttribute('aria-label') ?? el.textContent ?? '').trim();
  }, prefixFor(found) + 'action-cursor');
  return { screen: found, ring };
}

describe.runIf(chromePath)('0548 — the hangar holds still', () => {
  it('stands the plate at one size on every tab, its strip at one height, at a desktop and a phone', async () => {
    for (const [width, height] of [
      [1280, 720],
      [667, 375],
    ] as const) {
      const page = await open(width, height);
      await openHangar(page);
      const boxes: { tab: Screen; plate: { x: number; y: number; width: number; height: number }; strip: number }[] = [];
      for (const tab of TABS) {
        // Through the strip on the tab that is shown, as a player clicks it.
        const from = (await where(page)).screen!;
        if (from !== tab) {
          await page.locator(`${shown(from)} .${prefixFor(from)}tab`, { hasText: SCREENS[tab].heading }).click();
          await page.waitForSelector(shown(tab), { state: 'attached' });
          await afterFrames(page, 4);
        }
        const plate = (await page.locator(`${shown(tab)} .${prefixFor(tab)}plate`).boundingBox())!;
        const strip = (await page.locator(`${shown(tab)} .${prefixFor(tab)}tabs`).boundingBox())!;
        boxes.push({ tab, plate, strip: strip.y });
      }
      const [first, ...rest] = boxes;
      for (const box of rest) {
        const at = `${box.tab} against ${first!.tab} at ${width}x${height}`;
        expect(Math.abs(box.plate.y - first!.plate.y), `${at}: the plate's top moved`).toBeLessThanOrEqual(1);
        expect(Math.abs(box.plate.height - first!.plate.height), `${at}: the plate is another height`).toBeLessThanOrEqual(1);
        expect(Math.abs(box.plate.width - first!.plate.width), `${at}: the plate is another width`).toBeLessThanOrEqual(1);
        expect(Math.abs(box.strip - first!.strip), `${at}: the tab strip jumped`).toBeLessThanOrEqual(1);
      }
      await page.context().close();
    }
  });

  it('walks a pad from Cosmo’s back to Hangin’ Out on the strip, the ring on the open tab, with the shoulders shown', async () => {
    const page = await open(1280, 720);
    await openHangar(page);
    await afterFrames(page, 4);
    // Across by the shoulders to Cosmo's, which is where the report started.
    for (const _ of TABS.slice(1)) await tap(page, MENU_TAB_BUTTONS.next);
    expect((await where(page)).screen, 'RB did not step the tabs to the last').toBe(TABS[TABS.length - 1]);
    // The shoulders are on the strip, now a pad is in hand.
    const keys = await page.locator(`${shown('shop')} .${prefixFor('shop')}tab-key`).evaluateAll((els) => els.map((el) => (el as HTMLElement).getBoundingClientRect().width > 0));
    expect(keys, 'LB and RB are not both drawn on the strip with a pad in hand').toEqual([true, true]);
    // Up from the first band lands on the tab that is OPEN, not the one standing nearest above it.
    await tap(page, MENU_DPAD_BUTTONS.up);
    expect((await where(page)).ring, 'up into the strip did not land on the open tab').toBe(SCREENS.shop.heading);
    // Along to Hangin' Out and pressed: it opens, and the ring stays on the strip, on it.
    for (const _ of TABS.slice(1)) await tap(page, MENU_DPAD_BUTTONS.left);
    expect((await where(page)).ring, 'left along the strip did not reach the first tab').toBe(SCREENS.hangar.heading);
    await tap(page, MENU_CONFIRM_BUTTONS[0]!);
    expect(await where(page), 'pressing a tab left the strip').toEqual({ screen: 'hangar', ring: SCREENS.hangar.heading });
    // And a shoulder from the strip keeps the ring on it, on the tab it opened.
    await tap(page, MENU_TAB_BUTTONS.next);
    expect(await where(page), 'RB from the strip left it').toEqual({ screen: TABS[1], ring: SCREENS[TABS[1]!].heading });
    await page.context().close();
  });

  it('changes the pilot on Cosmo’s, the one setting the hangar and the title fly', async () => {
    const page = await open(1280, 720);
    await openHangar(page);
    await page.locator(`${shown('hangar')} .${prefixFor('hangar')}tab`, { hasText: SCREENS.shop.heading }).click();
    await page.waitForSelector(shown('shop'), { state: 'attached' });
    const pilots = page.locator(`${shown('shop')} [${SETTING_ATTR}="pilot"] .${prefixFor('shop')}option`);
    expect(await pilots.count(), 'Cosmo’s has no pilot band').toBe(GOLFER_KINDS.length);
    // Whichever is not on, chosen here.
    const on = await pilots.evaluateAll((els) => els.findIndex((el) => el.getAttribute('aria-pressed') === 'true'));
    const next = on === 0 ? 1 : 0;
    await pilots.nth(next).click();
    await afterFrames(page, 4);
    await expect.poll(() => page.locator(`${shown('shop')} .${prefixFor('shop')}pilot-name`).innerText(), { message: 'the line beside the faces does not name the pilot chosen' }).toBe(GOLFERS[GOLFER_KINDS[next]!].name);
    // And it is the hangar's pilot too: one setting on every band that offers it.
    await page.locator(`${shown('shop')} .${prefixFor('shop')}tab`, { hasText: SCREENS.hangar.heading }).click();
    await page.waitForSelector(shown('hangar'), { state: 'attached' });
    const there = page.locator(`${shown('hangar')} [${SETTING_ATTR}="pilot"] .${prefixFor('hangar')}option`).nth(next);
    expect(await there.getAttribute('aria-pressed'), 'the hangar does not have the pilot chosen at Cosmo’s').toBe('true');
    await page.context().close();
  });
});
