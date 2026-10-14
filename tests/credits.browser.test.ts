import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { choose, credit, launch, shown } from './title.ts';
import { seeded } from './seed.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS, TUNED } from '../src/content/difficulty.ts';
import { CREDIT_KINDS } from '../src/content/credits.ts';
import { SCREENS } from '../src/state/screens.ts';
import { SCORES_KEY, parseScores, serialiseScores } from '../src/save/scores.ts';
import { SETTINGS_KEY, serialiseSettings } from '../src/save/settings.ts';
import { initialSettings } from '../src/state/slices/settings.ts';
import { HANGAR_KEY, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { DEFAULT_GOLFER } from '../src/content/golfers.ts';

/**
 * NO QUARTERS GIVEN, PLAYED — `docs/decisions/0517-no-quarters-given.md`, and FREEPLAY EARNED —
 * `docs/decisions/0608-freeplay-is-earned.md`.
 *
 * `tests/credits.test.ts` holds which screen the reducer raises and which tiers a finish opens. What it
 * cannot see is the shell around it: that the game-over screen is the one SHOWN, that its sheet carries
 * the run's account and the run is on the table, that *Main Menu* goes to the title, that the chip is
 * on the title only for a tier finished, that a Freeplay chosen there is still Freeplay after a reload,
 * and that a cleared run already on the table counts as its tier finished.
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

/** The page on a fresh store, or on one whose `key` — the hangar unless named — holds `seed` (0608). */
async function open(seed: string | null = null, key: string = HANGAR_KEY): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  let page: Page;
  if (seed === null) {
    page = await context.newPage();
    await page.goto(dist);
  } else page = await seeded(context, dist, key, seed);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  return page;
}

const QUICKEST = DIFFICULTY_KINDS.reduce((fewest, kind) =>
  DIFFICULTIES[kind].lives < DIFFICULTIES[fewest].lives ? kind : fewest,
);

/** A tier other than the one the title opens on. */
const OTHER = DIFFICULTY_KINDS.find((kind) => kind !== TUNED)!;

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

/** Whether the continues chip is on the title. */
const chipShown = (page: Page): Promise<boolean> => page.locator(`[${SETTING_ATTR}="credits"]`).first().isVisible();

describe.runIf(chromePath)('no quarters given', () => {
  it('ends the run on the game over, with its account and no continue, and Main Menu goes to the title', async () => {
    /*
      0608: on the settings of a player who chose Freeplay under 0517 and has finished no tier — kept, and
      not flown, because Freeplay is earned now. No quarters is what they get, with nothing to choose.
    */
    const page = await open(serialiseSettings({ ...initialSettings, credits: 'free' }), SETTINGS_KEY);
    expect(await chipShown(page), 'Freeplay is offered before any tier has been finished').toBe(false);
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

  it('a Freeplay chosen on a finished tier is still Freeplay after a reload, and is not offered on another', async () => {
    const page = await open(serialiseHangar({ ...initialHangar, finished: { ...initialHangar.finished, [TUNED]: true } }));
    expect(await chipShown(page), 'the chip is not on the title for a tier finished').toBe(true);
    expect(await marked(page), 'the band did not open on no quarters').toBe(CREDIT_KINDS.indexOf('none'));
    await credit(page, 'free');
    expect(await marked(page)).toBe(CREDIT_KINDS.indexOf('free'));
    const doc = JSON.parse((await page.evaluate((key) => localStorage.getItem(key), SETTINGS_KEY)) ?? '{}') as { credits?: string };
    expect(doc.credits, 'the band was not written to the kept settings').toBe('free');

    // 0608: a tier not finished has no chip, and coming back to the finished one finds Freeplay still on.
    await choose(page, 'difficulty', DIFFICULTY_KINDS.indexOf(OTHER));
    expect(await chipShown(page), `Freeplay is offered on ${OTHER}, which has not been finished`).toBe(false);
    await choose(page, 'difficulty', DIFFICULTY_KINDS.indexOf(TUNED));
    expect(await chipShown(page), 'the chip did not come back with the finished tier').toBe(true);

    await page.reload();
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    expect(await marked(page), 'the reload forgot Freeplay').toBe(CREDIT_KINDS.indexOf('free'));
    await page.context().close();
  });

  it('counts a cleared run already on the table as its tier finished, and keeps it in the hangar', async () => {
    const table = serialiseScores([
      { score: 1000, bonus: 0, pilot: DEFAULT_GOLFER, difficulty: TUNED, levels: 7, cleared: true, continues: 0, when: 1 },
      { score: 500, bonus: 0, pilot: DEFAULT_GOLFER, difficulty: OTHER, levels: 3, cleared: false, continues: 0, when: 2 },
    ]);
    const page = await open(table, SCORES_KEY);
    expect(await chipShown(page), 'a cleared run on the table did not open Freeplay on its tier').toBe(true);
    await choose(page, 'difficulty', DIFFICULTY_KINDS.indexOf(OTHER));
    expect(await chipShown(page), 'a run that did not clear opened Freeplay on its tier').toBe(false);
    const kept = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar).finished;
    expect(kept[TUNED], 'the tier the table finished was not written to the hangar').toBe(true);
    expect(kept[OTHER]).toBe(false);
    await page.context().close();
  });
});
