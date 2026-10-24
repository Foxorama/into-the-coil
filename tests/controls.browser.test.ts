import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { back, fly, openSettings, shown } from './title.ts';
import { CONTROL_ROWS } from '../src/state/screens.ts';

/**
 * THE CONTROLS, IN THE PAGE — 0664.
 *
 * *"Controls config for keyboard + gamepad in settings. Need to make sure it saves properly."* A key and a pad
 * button bound on the Controls tab, the page loaded again and the binding still there, and a run that throws a
 * trigger on what was bound and not on what was there before. The reducer and the save are
 * `tests/settings-kept.test.ts`; the sources are `tests/controls.test.ts`.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 150_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;
const CONTROL = '.' + prefixFor('controls') + 'action';
const HINT = '.' + prefixFor('controls') + 'action-hint';
/** The gun's stack on the readout, whose words move when a charge is thrown — `tests/hud.browser.test.ts`'s. */
const GUN = '.itc-playing-hud-group[data-side="gun"][aria-label*="charge"]';
const row = (device: 'keys' | 'pad', slot: number): number =>
  CONTROL_ROWS.findIndex((r) => r.device === device && (r.device === 'keys' ? r.action === `special${slot + 1}` : r.slot === slot));

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

/** A page with a pad the test presses, as `tests/intro.browser.test.ts` stubs it. */
async function open(page: Page): Promise<void> {
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
}

async function openControls(page: Page): Promise<void> {
  await openSettings(page);
  await page.keyboard.press('KeyE');
  await page.waitForSelector(shown('controls'), { state: 'attached', timeout: 5_000 });
}

const hintOf = (page: Page, index: number): Promise<string> => page.locator(`${shown('controls')} ${CONTROL} >> nth=${index}`).locator(HINT).innerText();

const press = (page: Page, buttons: number[]): Promise<void> =>
  page.evaluate((b: number[]) => {
    (window as unknown as { __itcPad: { pressed: number[] } }).__itcPad.pressed = b;
  }, buttons);

describe.runIf(chromePath)('0664 — the controls are bound, kept and flown', () => {
  it('THE ASK: a key and a pad button bound on the Controls tab, kept over a reload, and thrown in a run', async () => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    await context.addInitScript(() => {
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
            axes: [0, 0, 0, 0],
            buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pad.pressed.includes(i), touched: pad.pressed.includes(i), value: pad.pressed.includes(i) ? 1 : 0 })),
            timestamp: 0,
          } as unknown as Gamepad,
        ],
      });
    });
    context.setDefaultTimeout(0);
    const page = await context.newPage();
    await open(page);
    await openControls(page);

    // The gun's trigger on K: a press listens, P is refused as the menu's, and K is taken.
    const keys = row('keys', 0);
    expect(await hintOf(page, keys), 'the gun’s key is not Space by default, so this proves nothing').toBe('Space');
    await page.locator(`${shown('controls')} ${CONTROL} >> nth=${keys}`).click();
    expect(await hintOf(page, keys), 'the row is not listening').toContain('Press a key');
    await page.keyboard.press('KeyP');
    expect(await hintOf(page, keys), 'P was taken, which pauses').toContain('menu');
    await page.keyboard.press('KeyK');
    expect(await hintOf(page, keys), 'K was not bound').toBe('K');
    expect(await page.locator(shown('controls')).count(), 'a key the tab was listening to was heard by the menu too').toBe(1);

    // The gun's pad button on RB: a press listens, and the pad's next button is taken.
    const pad = row('pad', 0);
    await page.locator(`${shown('controls')} ${CONTROL} >> nth=${pad}`).click();
    expect(await hintOf(page, pad), 'the pad row is not listening').toContain('Press a pad button');
    await press(page, [5]);
    await expect.poll(() => hintOf(page, pad), { timeout: 5_000 }).toBe('RB');
    await press(page, []);
    // A swap, not a loss: B threw the missile trigger and still does; A, which RB displaced, is on no trigger now.
    expect(await hintOf(page, row('pad', 1))).toBe('B');

    // *"Make sure it saves properly"*: the page loaded again, and both are there.
    await page.reload();
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openControls(page);
    expect(await hintOf(page, keys), 'the key was not kept').toBe('K');
    expect(await hintOf(page, pad), 'the pad button was not kept').toBe('RB');

    // And a run throws the gun's charge on K and on RB, and not on Space.
    await back(page, 'controls');
    await fly(page);
    await page.waitForTimeout(300);
    const before = await page.getAttribute(GUN, 'aria-label');
    expect(before, 'the readout does not say what the gun carries, so this proves nothing').toMatch(/\d+ charges?/);
    await page.keyboard.press('Space');
    await page.waitForTimeout(250);
    expect(await page.getAttribute(GUN, 'aria-label'), 'Space still throws the gun’s charge').toBe(before);
    await page.keyboard.press('KeyK');
    await page.waitForTimeout(250);
    const afterKey = await page.getAttribute(GUN, 'aria-label');
    expect(afterKey, 'K did not throw the gun’s charge').not.toBe(before);
    /*
      ⚠️ **PRESSED UNTIL THE THROW GAP HAS PASSED, A TRY AT A TIME.** The run opens on two candles, and a lit candle
      holds the next throw for as long as its stars fire (`canThrow`), so a press inside that is refused for being
      soon, not for being on the wrong button. Ten tries a second apart is longer than any candle burns.
    */
    let afterPad = afterKey;
    for (let tries = 0; tries < 10 && afterPad === afterKey; tries++) {
      await press(page, [5]);
      await page.waitForTimeout(200);
      await press(page, []);
      await page.waitForTimeout(800);
      afterPad = await page.getAttribute(GUN, 'aria-label');
    }
    expect(afterPad, 'RB did not throw the gun’s charge').not.toBe(afterKey);
    await context.close();
  });
});
