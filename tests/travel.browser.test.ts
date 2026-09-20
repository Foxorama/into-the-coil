import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';

/**
 * THE CROSSING'S BANNER, IN A REAL BROWSER — WHERE IT ACTUALLY LANDS OVER A GAME STILL BEING FLOWN.
 *
 * `docs/decisions/0340-the-coil-is-a-route.md`.
 *
 * ⚠️ **THE SUBJECT IS THE CASCADE, AND 0063 IS WHY THAT IS WORTH A BROWSER.** The player is flying the
 * ship through the burn, so the banner has the level break's two obligations: it must not sit over the
 * middle of the screen, where the ship is, and it must not take the pointer, because a full-bleed box
 * would swallow the thumb that is steering. 0063 shipped the first of those broken — *"the banner's
 * `margin-top` rule was written … where the shared `margin: auto` beat it on source order"* — and it was
 * caught by measuring where the thing landed. Three of that decision's ten probes were computed style
 * that no screenshot could have shown.
 *
 * ⚠️ **THE OVERLAY IS SHOWN BY ITS OWN CLASS RATHER THAN BY CLEARING A LEVEL**, which is
 * `tests/menu.browser.test.ts`'s method for the level break and its reason: reaching this in the
 * shipped page means winning a boss fight, which is minutes of real time per assertion. What the burn
 * DOES is driven in `tests/travel.test.ts` against the real frame, reducer and lifecycle, and looked at
 * on the bench with `scripts/shot-travel.mjs`.
 */

/*
  ⚠️ **A BROWSER TEST CANNOT RUN ON VITEST'S FIVE-SECOND DEFAULT**, and `tests/toolchain.test.ts` holds
  that every file that launches one says so.
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

describe.runIf(chromePath)('the crossing is a caption over a game that is still being flown', () => {
  it('sits clear of the middle, keeps its backing, takes no pointer and has nothing to press', async () => {
    const prefix = prefixFor('travel');
    const page = await open();
    const measured = await page.evaluate((p: string) => {
      const root = document.querySelector(`.${p.slice(0, -1)}`);
      const panel = document.querySelector(`.${p}panel`);
      const chart = document.querySelector(`.${p}crossing-chart`);
      if (!(root instanceof HTMLElement) || !(panel instanceof HTMLElement) || !(chart instanceof HTMLElement)) return null;
      root.classList.add(`${p}shown`);
      // The words a real crossing would push, so the box is the size it is in the game.
      const place = root.querySelector(`.${p}crossing-place`);
      const voyage = root.querySelector(`.${p}crossing-voyage`);
      if (place !== null) place.textContent = 'The Black Heart';
      if (voyage !== null) voyage.textContent = 'The centre. It has been beating the whole way down.';
      const box = root.getBoundingClientRect();
      const plate = panel.getBoundingClientRect();
      const inset = chart.getBoundingClientRect();
      return {
        overlay: getComputedStyle(root).backgroundColor,
        backing: getComputedStyle(panel).backgroundColor,
        rootEvents: getComputedStyle(root).pointerEvents,
        panelEvents: getComputedStyle(panel).pointerEvents,
        buttons: root.querySelectorAll('button').length,
        top: (plate.top - box.top) / box.height,
        bottom: (plate.bottom - box.top) / box.height,
        chartRatio: inset.width / inset.height,
        chartShare: inset.height / box.height,
      };
    }, prefix);

    expect(measured, 'there is no crossing overlay to measure').not.toBeNull();
    const m = measured!;

    expect(m.overlay, 'the crossing is painting over the game it happens in').toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    expect(m.backing, 'the banner has no computed backing — the name is on forty-four bright streaks').not.toMatch(
      /rgba\(0, 0, 0, 0\)|transparent/,
    );
    /*
      ⚠️ **BOTH, BECAUSE `pointer-events` DOES NOT INHERIT THE WAY IT LOOKS LIKE IT SHOULD.** `none` on
      the overlay is inherited by its children only until one of them says otherwise, and the shared
      panel and button rules are written to say otherwise — that is how the level break's button takes
      a press. Here nothing may.
    */
    expect(m.rootEvents, 'the overlay swallows the pointer of a player who is flying').toBe('none');
    expect(m.panelEvents, 'the banner swallows the pointer of a player who is flying').toBe('none');
    expect(m.buttons, 'the crossing has a control on it — *"it felt like a button click was needed"*').toBe(0);
    /*
      ⚠️ **ENTIRELY IN THE TOP THIRD, WHICH IS THE ASSERTION 0063 PAID FOR.** The ship rests on the
      middle of the lane, so a banner that has lost its override to the shared auto margins is a plate
      over the thing the player is steering. A third and not a half: the panel is centred by that rule,
      so a lost override puts its MIDDLE at a half and its top well above — a guard at a half would
      watch the bug happen and pass.
    */
    expect(m.top, 'the banner is off the top of the screen').toBeGreaterThanOrEqual(0);
    expect(m.bottom, 'the banner reaches down into the part of the screen the ship flies in').toBeLessThan(1 / 3);
    // And the chart is the chart: square, and big enough to be read as a route rather than as an icon.
    expect(m.chartRatio, 'the chart is squeezed into an ellipse').toBeCloseTo(1, 2);
    expect(m.chartShare, 'the chart is too small to read as a route').toBeGreaterThan(0.12);
  });
});
