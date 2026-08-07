import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { SCREENS } from '../src/state/screens.ts';

/**
 * THE BUTTON ON THE RUN-OVER SCREEN, PRESSED.
 *
 * `docs/decisions/0068-a-run-over-is-a-continue.md`. `tests/continue.test.ts` holds what a continue
 * does to the run and to the field, against a fixture world. **What it cannot see is the one line
 * that decides which of the three lifecycle transitions the button is wired to** — that lives in
 * `src/app/mount.ts`'s chrome callback, over a real canvas, and the honest way to ask it is to press
 * the button.
 *
 * ⚠️ **The run is ended by flying nothing**, on the precedent `tests/hud.browser.test.ts` already
 * set: the ship holds station, the first waves reach it, and the tier with the fewest lives ends the
 * run in about a dozen seconds. Waited on rather than timed — 0044.
 *
 * ⚠️ **What this CANNOT tell apart is a continue from a restart**, because a restart would restock
 * the same readout and show the same screen, and the field is not in the DOM. That distinction is
 * `tests/continue.test.ts`'s job and it is the reason `src/app/lifecycle.ts` was pulled out of the
 * shell at all.
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
  await page.waitForSelector('#app canvas', { timeout: 15_000 });
  return page;
}

/**
 * The tier that ends a run soonest — the last row, which is the fewest lives.
 *
 * ⚠️ **Chosen by the count rather than by name**, so a table that reorders its tiers picks the right
 * button rather than sitting on a twenty-second run and timing out for a reason nobody could read.
 */
const QUICKEST = DIFFICULTY_KINDS.reduce((fewest, kind) =>
  DIFFICULTIES[kind].lives < DIFFICULTIES[fewest].lives ? kind : fewest,
);

describe.runIf(chromePath)('the run-over screen offers to continue, and the offer works', () => {
  it('says Continue, and puts the player back into the game rather than back to the title', async () => {
    const page = await open();
    const title = '.' + prefixFor('title') + 'action';
    await page.waitForSelector(title, { timeout: 15_000 });
    /*
      ⚠️ **The index is read off `DIFFICULTY_KINDS`, which is the order the buttons were built in**
      (`src/state/screens.ts` walks it) — the same reason `src/app/mount.ts` reads the control's index
      off it rather than matching on a label.
    */
    await page.locator(title).nth(DIFFICULTY_KINDS.indexOf(QUICKEST)).click();

    // The fixture flies nothing, so the waves end the run on their own. Waited on, never timed.
    const over = '.' + prefixFor('gameOver') + 'shown';
    await page.waitForSelector(over, { timeout: 90_000 });

    const label = await page.textContent('.' + prefixFor('gameOver') + 'action');
    expect(label, 'the run-over screen does not offer a continue').toContain(
      SCREENS.gameOver.actions[0]!.label,
    );
    expect(label, 'the button still offers to start again').not.toContain('Again');

    /*
      ⚠️ **Pressed promptly, because the screen expires.** Seven seconds and the run is gone
      (`src/state/screens.ts`) — which is the cost 0068 gives the offer, and here it is a deadline.
    */
    await page.click('.' + prefixFor('gameOver') + 'action');
    await page.waitForTimeout(300);

    const state = await page.evaluate(
      (selectors: string[]) => selectors.map((s) => document.querySelector(s) !== null),
      [over, '.' + prefixFor('title') + 'shown', '.itc-playing-hud-shown'],
    );
    expect(state[0], 'the continue left the run-over screen up').toBe(false);
    expect(state[1], 'the continue threw the run away and went back to the tier choice').toBe(false);
    expect(state[2], 'the continue did not put the player back into the game').toBe(true);

    /*
      ⚠️ **The complement is read off the tier's own row**, so a tier whose life count is played and
      changed changes this with it — 0039 forbids a test that pins a number a hand is still moving.
    */
    const lives = await page.getAttribute('.itc-playing-hud-group[aria-label*="lives"]', 'aria-label');
    expect(lives, 'the continue did not restock the run').toBe(String(DIFFICULTIES[QUICKEST].lives) + ' lives');
    await page.context().close();
  });
});
