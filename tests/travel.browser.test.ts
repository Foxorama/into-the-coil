import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';

/**
 * THE CROSSING, IN A REAL BROWSER — WHERE ITS PANEL ACTUALLY LANDS.
 *
 * `docs/decisions/0340-the-coil-is-a-route.md`.
 *
 * ⚠️ **THE SUBJECT IS THE CASCADE, AND 0063 IS WHY THAT IS WORTH A BROWSER.** The crossing's panel
 * overrides the shared `margin: auto` that centres every other one, because the middle of this screen
 * is where the chart's innermost stop — The Black Heart — is drawn. 0063 shipped precisely that bug
 * the other way round: *"the banner's `margin-top` rule was written beside the other level-break
 * rules, near the top of the stylesheet, where the shared `margin: auto` beat it on source order"*,
 * and the banner went on sitting over the middle of the playfield, which is where the ship is. Caught
 * by measuring where the button actually landed.
 *
 * ⚠️ **AND THE BACKING IS THE OTHER HALF, FOR THE SAME REASON ONE SCREEN OVER.** `tests/menu.test.ts`
 * holds that a rule with a background exists in `STYLE`; a rule can exist and be beaten. What a
 * player is looking at is the computed value, and three of 0063's ten probes were computed style that
 * no screenshot could have shown.
 *
 * ⚠️ **THE OVERLAY IS SHOWN BY ITS OWN CLASS RATHER THAN BY CLEARING A LEVEL**, which is
 * `tests/menu.browser.test.ts`'s method for the level break and its reason: reaching this screen in
 * the shipped page means winning a boss fight, which is minutes of real time per assertion. What the
 * crossing DOES — that it is raised by `onward`, ends by itself and hands the run back — is driven
 * end to end in `tests/travel.test.ts` against the real reducer and the real lifecycle, and looked at
 * on the bench with `scripts/shot-travel.mjs`.
 */

/*
  ⚠️ **A BROWSER TEST CANNOT RUN ON VITEST'S FIVE-SECOND DEFAULT**, and `tests/toolchain.test.ts` holds
  that every file that launches one says so. Launching Chromium and loading the built page is most of
  that on its own before a single assertion is made; this file makes one measurement and needs no more
  than the smallest budget its neighbours use.
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
  await page.waitForSelector('canvas');
  return page;
}

describe.runIf(chromePath)('the crossing puts its words under the chart, not over its middle', () => {
  it('sits in the bottom half, keeps its backing, and its control still takes a press', async () => {
    const prefix = prefixFor('travel');
    const page = await open();
    const measured = await page.evaluate((p: string) => {
      const root = document.querySelector(`.${p.slice(0, -1)}`);
      const panel = document.querySelector(`.${p}panel`);
      const action = document.querySelector(`.${p}action`);
      const place = document.querySelector(`.${p}crossing-place`);
      if (!(root instanceof HTMLElement) || !(panel instanceof HTMLElement)) return null;
      if (!(action instanceof HTMLElement) || !(place instanceof HTMLElement)) return null;
      root.classList.add(`${p}shown`);
      const box = root.getBoundingClientRect();
      const words = place.getBoundingClientRect();
      return {
        /* The overlay itself must not paint the space colour over the chart — the row says `dims: false`. */
        overlay: getComputedStyle(root).backgroundColor,
        /* …and the panel must, or the place's name is written across its own route. */
        backing: getComputedStyle(panel).backgroundColor,
        buttonEvents: getComputedStyle(action).pointerEvents,
        /* Where the NAME starts, as a fraction of the overlay. The chart's centre is 0.5. */
        wordsTop: (words.top - box.top) / box.height,
        /* And where the button's bottom edge is, so a panel pushed off the screen is caught too. */
        buttonBottom: (action.getBoundingClientRect().bottom - box.top) / box.height,
      };
    }, prefix);

    expect(measured, 'there is no crossing overlay to measure').not.toBeNull();
    const m = measured!;

    /*
      ⚠️ **TRANSPARENT, AND THE BUILDER IS WHAT SETS IT.** `src/app/chrome.ts` writes the space colour
      inline on any screen whose row says `dims`, so an overlay with a colour here is the row having
      been changed without the picture underneath being reconsidered.
    */
    expect(m.overlay, 'the crossing is painting over its own chart').toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    expect(m.backing, 'the crossing panel has no computed backing — the name is on the route').not.toMatch(
      /rgba\(0, 0, 0, 0\)|transparent/,
    );
    expect(m.buttonEvents, 'Onward cannot be pressed').not.toBe('none');

    /*
      ⚠️ **BELOW THE MIDDLE, WHICH IS THE ASSERTION 0063 PAID FOR.** The chart's innermost stop is at
      the exact centre of the screen, so a panel that has lost its override is a panel over The Black
      Heart. Half is the line; the rule aims lower than that and the margin is deliberate slack, so
      this catches the cascade going wrong rather than the padding being retuned.
    */
    expect(m.wordsTop, 'the place name is over the middle of the chart — the shared auto margin won').
      toBeGreaterThan(0.5);
    // And it is still ON the screen: an overriding margin that pushed the panel off the bottom would
    // pass the line above and lose the button, which is the same fix failing in the other direction.
    expect(m.buttonBottom, 'the crossing pushed its own control off the bottom of the screen').toBeLessThan(1);
  });
});
