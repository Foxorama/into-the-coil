import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { choose, credit, launch, shown } from './title.ts';
import { seeded } from './seed.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS, TUNED, type DifficultyKind } from '../src/content/difficulty.ts';
import { CREDIT_KINDS, freeplayWhy } from '../src/content/credits.ts';
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
 * on the title on every tier with Freeplay shut on one not finished and a note saying what finishes it
 * (0648), that a Freeplay chosen on a finished tier is still Freeplay after a reload, and that a cleared
 * run already on the table counts as its tier finished.
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

/** Whether the chip's Freeplay is shut — 0648: padlocked for the eye and the reader, and still there to step onto. */
const freeplayShut = (page: Page): Promise<boolean> =>
  page.locator(`[${SETTING_ATTR}="credits"] .${prefixFor('title')}option >> nth=${CREDIT_KINDS.indexOf('free')}`).evaluate(
    (button, shut) => button.classList.contains(shut) && button.getAttribute('aria-disabled') === 'true',
    prefixFor('title') + 'option-shut',
  );

/** What the line under the tier band says — 0648: the chip borrows it while it stands on the shut Freeplay. */
const lineSaid = (page: Page): Promise<string> =>
  page.locator(`${shown('title')} [${SETTING_ATTR}="difficulty"] ~ .${prefixFor('title')}band-hint`).evaluate((line) => line.textContent ?? '');

/** What the tier band says of its own tier. */
const tierSaid = (tier: DifficultyKind): string => SCREENS.title.choices.find((c) => c.name === 'difficulty')!.options[DIFFICULTY_KINDS.indexOf(tier)]!.hint;

describe.runIf(chromePath)('no quarters given', () => {
  it('ends the run on the game over, with its account and no continue, and Main Menu goes to the title', async () => {
    /*
      0608: on the settings of a player who chose Freeplay under 0517 and has finished no tier — kept, and
      not flown, because Freeplay is earned now. No quarters is what they get. 0648: the chip is on the
      title and says Freeplay, padlocked, and the run is one credit all the same.
    */
    const page = await open(serialiseSettings({ ...initialSettings, credits: 'free' }), SETTINGS_KEY);
    expect(await chipShown(page), 'the chip is not on the title before any tier has been finished').toBe(true);
    expect(await marked(page), 'the kept Freeplay is not what the chip shows').toBe(CREDIT_KINDS.indexOf('free'));
    expect(await freeplayShut(page), 'Freeplay is open before any tier has been finished').toBe(true);
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

  it('a Freeplay chosen on a finished tier is still Freeplay after a reload, and is shut on another', async () => {
    const page = await open(serialiseHangar({ ...initialHangar, finished: { ...initialHangar.finished, [TUNED]: true } }));
    expect(await chipShown(page), 'the chip is not on the title for a tier finished').toBe(true);
    expect(await marked(page), 'the band did not open on no quarters').toBe(CREDIT_KINDS.indexOf('none'));
    expect(await freeplayShut(page), 'Freeplay is shut on a tier finished').toBe(false);
    await credit(page, 'free');
    expect(await marked(page)).toBe(CREDIT_KINDS.indexOf('free'));
    expect(await lineSaid(page), 'the tier line changed on a tier finished').toBe(tierSaid(TUNED));
    const doc = JSON.parse((await page.evaluate((key) => localStorage.getItem(key), SETTINGS_KEY)) ?? '{}') as { credits?: string };
    expect(doc.credits, 'the band was not written to the kept settings').toBe('free');

    /*
      0608: Freeplay is not offered on a tier not finished — 0648: the chip stays, Freeplay on it is shut and
      padlocked, and the note says what finishes the tier. Coming back to the finished one finds it open and on.
    */
    await choose(page, 'difficulty', DIFFICULTY_KINDS.indexOf(OTHER));
    expect(await chipShown(page), `the chip left the title on ${OTHER}, which has not been finished`).toBe(true);
    expect(await freeplayShut(page), `Freeplay is open on ${OTHER}, which has not been finished`).toBe(true);
    expect(await lineSaid(page), 'the tier line does not say what finishes the tier').toBe(freeplayWhy(OTHER));
    await choose(page, 'difficulty', DIFFICULTY_KINDS.indexOf(TUNED));
    expect(await chipShown(page), 'the chip did not come back with the finished tier').toBe(true);
    expect(await freeplayShut(page), 'Freeplay stayed shut on the finished tier').toBe(false);
    expect(await lineSaid(page), 'the tier line did not get its own hint back').toBe(tierSaid(TUNED));

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
    expect(await freeplayShut(page), 'a cleared run on the table did not open Freeplay on its tier').toBe(false);
    await choose(page, 'difficulty', DIFFICULTY_KINDS.indexOf(OTHER));
    expect(await freeplayShut(page), 'a run that did not clear opened Freeplay on its tier').toBe(true);
    /*
      0648: pressed onto the shut Freeplay, the chip steps there — it is shown, padlocked — and says why. The
      press is the player's own: *"if you click on it, it should show a message explaining the unlock condition."*
    */
    await choose(page, 'credits', CREDIT_KINDS.indexOf('free'));
    expect(await marked(page), 'the chip did not step onto the shut Freeplay').toBe(CREDIT_KINDS.indexOf('free'));
    expect(await lineSaid(page), 'the press onto Freeplay said nothing').toBe(freeplayWhy(OTHER));
    await choose(page, 'credits', CREDIT_KINDS.indexOf('none'));
    expect(await lineSaid(page), 'the sentence stayed after the chip stepped off Freeplay').toBe(tierSaid(OTHER));
    /*
      And the cursor's press lands there too — a step onto a shut option, which a band's step passes over
      (0521): the walk opens on Fly, down is the quiet row, left is the chip (0538), Enter steps it.
    */
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Enter');
    expect(await marked(page), 'the cursor’s press stepped past the shut Freeplay').toBe(CREDIT_KINDS.indexOf('free'));
    expect(await lineSaid(page), 'the cursor’s press onto Freeplay said nothing').toBe(freeplayWhy(OTHER));
    const kept = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar).finished;
    expect(kept[TUNED], 'the tier the table finished was not written to the hangar').toBe(true);
    expect(kept[OTHER]).toBe(false);
    await page.context().close();
  });
});
