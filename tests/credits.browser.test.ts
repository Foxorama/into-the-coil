import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { credit, launch, shown } from './title.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { CREDIT_KINDS } from '../src/content/credits.ts';
import { SCREENS } from '../src/state/screens.ts';
import { SCORES_KEY, parseScores } from '../src/save/scores.ts';
import { SETTINGS_KEY } from '../src/save/settings.ts';

/**
 * NO QUARTERS GIVEN, PLAYED — `docs/decisions/0517-no-quarters-given.md`.
 *
 * `tests/credits.test.ts` holds which screen the reducer raises. What it cannot see is the shell
 * around it: that the game-over screen is the one SHOWN, that its sheet carries the run's account and
 * the run is on the table, that *Main Menu* goes to the title, and that a Freeplay chosen on the band
 * is still Freeplay after a reload.
 *
 * ⚠️ **The run is ended by flying nothing**, on `tests/continue.browser.test.ts`'s precedent, at the
 * tier with the fewest lives. Waited on rather than timed — 0044.
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

const QUICKEST = DIFFICULTY_KINDS.reduce((fewest, kind) =>
  DIFFICULTIES[kind].lives < DIFFICULTIES[fewest].lives ? kind : fewest,
);

/** Which segment of the continues band is marked on. */
async function marked(page: Page): Promise<number> {
  return page.evaluate(
    ({ attr, option }: { attr: string; option: string }) => {
      const options = [...document.querySelectorAll(`[${attr}="credits"] .${option}`)];
      return options.findIndex((o) => o.getAttribute('aria-pressed') === 'true');
    },
    { attr: SETTING_ATTR, option: prefixFor('title') + 'option' },
  );
}

describe.runIf(chromePath)('no quarters given', () => {
  it('ends the run on the game over, with its account and no continue, and Main Menu goes to the title', async () => {
    const page = await open();
    // Nothing chosen: no quarters is the default.
    await launch(page, QUICKEST);

    await page.waitForSelector(shown('ended'), { timeout: 90_000 });
    expect(await page.$(shown('gameOver')), 'the run-over screen came up on no quarters').toBeNull();

    const actions = await page.locator(shown('ended') + ' .' + prefixFor('ended') + 'action').allTextContents();
    expect(actions.join(' '), 'the game over offers a continue').not.toContain(SCREENS.gameOver.actions[0]!.label);
    expect(actions.join(' ')).toContain(SCREENS.ended.actions[0]!.label);

    const labels = await page.locator('.' + prefixFor('ended') + 'sheet-label').allTextContents();
    for (const line of ['Reached', 'Kills', 'Hits taken', 'Final score', 'High score']) {
      expect(labels, `the game over's account has no ${line}`).toContain(line);
    }

    // On the table as it arrives — there is no offer to wait for.
    const kept = parseScores(await page.evaluate((key) => localStorage.getItem(key), SCORES_KEY));
    expect(kept.length, 'the run that ended is not on the table').toBe(1);
    expect(kept[0]!.continues).toBe(0);

    await page.click('.' + prefixFor('ended') + 'action');
    await page.waitForSelector(shown('title'), { timeout: 15_000 });
    expect(await page.$(shown('ended')), 'the game over stayed up').toBeNull();
    await page.context().close();
  });

  it('a Freeplay chosen on the band is still Freeplay after a reload', async () => {
    const page = await open();
    expect(await marked(page), 'the band did not open on no quarters').toBe(CREDIT_KINDS.indexOf('none'));
    await credit(page, 'free');
    expect(await marked(page)).toBe(CREDIT_KINDS.indexOf('free'));
    const doc = JSON.parse((await page.evaluate((key) => localStorage.getItem(key), SETTINGS_KEY)) ?? '{}') as { credits?: string };
    expect(doc.credits, 'the band was not written to the kept settings').toBe('free');

    await page.reload();
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    expect(await marked(page), 'the reload forgot Freeplay').toBe(CREDIT_KINDS.indexOf('free'));
    await page.context().close();
  });
});
