import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { launch, shown } from './title.ts';
import { SCREENS } from '../src/state/screens.ts';
import { SCORES_KEY, parseScores } from '../src/save/scores.ts';

/**
 * THE RUN CAN BE PAUSED — `docs/decisions/0511-the-run-can-be-paused.md`, pressed the way a player
 * presses it.
 *
 * ⚠️ **THE AUDIO CLOCK IS WATCHED, NOT TRUSTED.** The pause's whole reason for suspending the context
 * rather than muting it is that the music and the beat-authored volleys run on `currentTime` (0160).
 * Nothing in the DOM says whether the context is suspended, so `AudioContext.prototype.suspend` and
 * `resume` are wrapped before the page's own script runs and every call is logged with the state the
 * context was left in.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

/** A page on the title, with the audio context's suspends and resumes logged into `window.__clock`. */
async function open(): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    const log: string[] = [];
    (window as unknown as { __clock: string[] }).__clock = log;
    const proto = AudioContext.prototype;
    const suspend = proto.suspend;
    const resume = proto.resume;
    proto.suspend = function (this: AudioContext) {
      log.push('suspend');
      return suspend.call(this);
    };
    proto.resume = function (this: AudioContext) {
      log.push('resume');
      return resume.call(this);
    };
  });
  const page = await context.newPage();
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  return page;
}

const clock = (page: Page): Promise<string[]> => page.evaluate(() => [...(window as unknown as { __clock: string[] }).__clock]);
const isShown = (page: Page, selector: string): Promise<boolean> => page.evaluate((s) => document.querySelector(s) !== null, selector);
const press = (page: Page, screen: 'paused' | 'quit', label: string): Promise<void> =>
  page.locator(shown(screen) + ' .' + prefixFor(screen) + 'action', { hasText: label }).first().click();

describe.runIf(chromePath)('0511 — the run can be paused', () => {
  it('THE ASK: Escape pauses and holds the audio clock, and Back resumes through the count-in into the run', async () => {
    const page = await open();
    await launch(page, 'savior');
    await page.waitForSelector('.itc-playing-pause-shown');

    const before = (await clock(page)).length;
    await page.keyboard.press('Escape');
    await page.waitForSelector(shown('paused'));
    expect(await isShown(page, '.itc-playing-pause-shown'), 'the pause button stayed up over the pause').toBe(false);
    expect((await clock(page)).slice(before), 'the pause did not suspend the audio clock').toContain('suspend');

    // A press on the pause is a gesture, and a gesture resumes a suspended context — but not this one.
    const held = (await clock(page)).length;
    await press(page, 'paused', SCREENS.paused.actions[2]!.label);
    await page.waitForSelector(shown('guide'));
    await page.keyboard.press('Escape');
    await page.waitForSelector(shown('paused'));
    expect((await clock(page)).slice(held), 'a press on the pause started the audio clock under a held run').not.toContain('resume');

    // Escape on the pause is Back, and Back is the count-in.
    await page.keyboard.press('Escape');
    await page.waitForSelector(shown('resuming'));
    expect(await isShown(page, '.itc-playing-hud-shown'), 'the readout is not up over the count-in').toBe(true);
    expect((await clock(page)).slice(held), 'the count-in let the audio clock go before the field moved').not.toContain('resume');
    await page.waitForSelector('.itc-playing-pause-shown', { timeout: 10_000 });
    expect((await clock(page)).slice(held), 'the run came back and the audio clock did not').toContain('resume');
    await page.context().close();
  });

  it('the button pauses; Settings from a pause has no music room and comes back to it; P resumes', async () => {
    const page = await open();
    await launch(page, 'savior');
    await page.waitForSelector('.itc-playing-pause-shown');
    await page.click('.itc-playing-pause');
    await page.waitForSelector(shown('paused'));

    await press(page, 'paused', SCREENS.paused.actions[1]!.label);
    await page.waitForSelector(shown('settings'));
    const room = page.locator(shown('settings') + ' .' + prefixFor('settings') + 'action', { hasText: SCREENS.settings.actions[0]!.label });
    expect(await room.isVisible(), 'Settings under a held run offers the music room, which walks a level over its field').toBe(false);
    await page.keyboard.press('Escape');
    await page.waitForSelector(shown('paused'));

    await page.keyboard.press('KeyP');
    await page.waitForSelector(shown('resuming'));
    await page.waitForSelector('.itc-playing-pause-shown', { timeout: 10_000 });
    await page.context().close();
  });

  it('a hidden tab pauses the run', async () => {
    const page = await open();
    await launch(page, 'savior');
    await page.waitForSelector('.itc-playing-pause-shown');
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForSelector(shown('paused'));
    await page.context().close();
  });

  it('Quit asks once, opens on the safe answer, and a quit is kept on the table', async () => {
    const page = await open();
    await launch(page, 'savior');
    await page.waitForSelector('.itc-playing-pause-shown');
    await page.keyboard.press('KeyP');
    await page.waitForSelector(shown('paused'));
    await press(page, 'paused', SCREENS.paused.actions[3]!.label);
    await page.waitForSelector(shown('quit'));
    const focused = await page.evaluate(() => document.activeElement?.textContent ?? '');
    expect(focused, 'the question opened on Quit, so a hasty press throws the run away').toBe(SCREENS.quit.actions[0]!.label);

    await press(page, 'quit', SCREENS.quit.actions[1]!.label);
    await page.waitForSelector(shown('title'));
    const kept = parseScores(await page.evaluate((key) => localStorage.getItem(key), SCORES_KEY));
    expect(kept.length, 'a quit was not kept on the table').toBe(1);
    expect((await clock(page)).at(-1), 'the title was left with the audio clock held').toBe('resume');
    await page.context().close();
  });
});
