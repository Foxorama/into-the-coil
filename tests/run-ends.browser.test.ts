import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { EVERY_TIER_FINISHED, choose, credit, fly, flownTo, openHangar, openSettings, shown } from './title.ts';
import { INTRO_KINDS } from '../src/content/intro.ts';
import { SCORES_KEY } from '../src/save/scores.ts';
import { seeded } from './seed.ts';
import { HANGAR_KEY, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { DEFAULT_GOLFER, GOLFERS, GOLFER_KINDS } from '../src/content/golfers.ts';
import { SHIPS } from '../src/content/ships.ts';
import { SCREENS } from '../src/state/screens.ts';

/**
 * A RUN ENDS AT THE TITLE, IN THE PAGE — `docs/decisions/0558-a-run-ends-at-the-title.md`.
 *
 * `tests/run-ends.test.ts` holds the rule in the reducer. **What it cannot see is what the shell did with
 * a run left standing**: a quit kept the lives up, the shell kept reading *a run is flying*, and the
 * world never took the next pilot's ship — so the pad stood a car's turning wheels on a ship that has
 * none. Counted in what the canvas draws: on Paint & Parts' pad the only turned blits are wheels.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

/** Turned blits on the page's own canvas in one second. */
async function turnedPerSecond(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const g = window as unknown as { itcTurned: number };
    g.itcTurned = 0;
    await new Promise((done) => setTimeout(done, 1000));
    return g.itcTurned;
  });
}

describe.runIf(chromePath)('0558 — a run quit is over', () => {
  it('a pilot chosen after a quit stands on the pad in their own ship, not under the last run’s wheels', async () => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    await context.addInitScript(() => {
      const g = window as unknown as { itcTurned: number };
      g.itcTurned = 0;
      const rotate = CanvasRenderingContext2D.prototype.rotate;
      CanvasRenderingContext2D.prototype.rotate = function (angle: number) {
        if (this.canvas.isConnected) g.itcTurned++;
        return rotate.call(this, angle);
      };
    });
    const page = await seeded(
      context,
      dist,
      HANGAR_KEY,
      serialiseHangar({ ...initialHangar, owned: { ...initialHangar.owned, spinner: true }, rim: { ...initialHangar.rim, firebird: 'spinner' } }),
    );
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);

    // The default pilot flies the Firebird, on the spinners; a run begun and quit.
    expect(GOLFERS[DEFAULT_GOLFER].ship, 'the run this flies is not on the spinners seeded').toBe('firebird');
    await fly(page);
    await page.waitForTimeout(2000);
    await page.keyboard.press('Escape');
    await page.waitForSelector(shown('paused'), { state: 'attached' });
    await page.locator(`${shown('paused')} .${prefixFor('paused')}action`, { hasText: 'Quit' }).click();
    await page.waitForSelector(shown('quit'), { state: 'attached' });
    await page.locator(`${shown('quit')} .${prefixFor('quit')}action`, { hasText: 'Quit' }).click();
    await page.waitForSelector(shown('title'), { state: 'attached' });

    // A pilot whose ship has no wheels, chosen on the title, stood on Paint & Parts' pad.
    const wheelless = GOLFER_KINDS.findIndex((kind) => kind !== 'marmot' && SHIPS[GOLFERS[kind].ship].wheels === null);
    expect(wheelless, 'no pilot flies a ship without wheels, so this measures nothing').toBeGreaterThanOrEqual(0);
    await choose(page, 'pilot', wheelless);
    await openHangar(page);
    await page.locator(`${shown('hangar')} .${prefixFor('hangar')}tab`, { hasText: SCREENS.parts.heading }).click();
    await page.waitForSelector(shown('parts'), { state: 'attached' });
    await page.waitForTimeout(800);
    const turned = await turnedPerSecond(page);
    expect(turned, `${GOLFERS[GOLFER_KINDS[wheelless]!].ship} has no wheels, and the pad turned ${turned} pictures a second over it — the last run's spinners`).toBe(0);
    await context.close();
  });

  it('0635 — and the next flight plays the intro, as the first flight after a page load does', async () => {
    /*
      ⚠️ **REPORTED FROM PLAY**: *"new run w/out cache clear doesn't play the intro cinematic"* and *"end of
      run after all deaths should essentially be a cache clear for the next run."* The intro was the first
      flight of a VISIT (0513), held by a flag the page kept, so it came back only on a reload — which a
      cache clear is. Held in what the player sees: the intro's skip is up after the second Fly.
    */
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(dist);
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await fly(page);
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
    await page.waitForSelector(shown('paused'), { state: 'attached' });
    await page.locator(`${shown('paused')} .${prefixFor('paused')}action`, { hasText: 'Quit' }).click();
    await page.waitForSelector(shown('quit'), { state: 'attached' });
    await page.locator(`${shown('quit')} .${prefixFor('quit')}action`, { hasText: 'Quit' }).click();
    await page.waitForSelector(shown('title'), { state: 'attached' });
    await page.locator(`${shown('title')} .${prefixFor('title')}action`, { hasText: SCREENS.title.actions[0]!.label }).first().click();
    const where = await page.waitForFunction(
      ([skip, hud]: [string, string]) =>
        document.querySelector(skip) !== null ? 'intro' : document.querySelector(hud) !== null ? 'run' : null,
      [`.${prefixFor('intro')}skip-shown`, '.itc-playing-hud-shown'] as [string, string],
      { timeout: 30_000 },
    );
    expect(await where.jsonValue(), 'the second flight of the visit went straight into the run, with no intro').toBe('intro');
    await context.close();
  });

  it('0674 — on First flight the visit’s first flight plays the intro and the next goes straight in, as Fly says', async () => {
    /*
      0635 owed *"whether an intro every run is welcome or wants a setting"*, and the answer was a setting. Set on the
      band under Travel, kept over a reload, and seen where it acts: the intro's skip, then the run's readout.
    */
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(dist);
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openSettings(page);
    await choose(page, 'intro', INTRO_KINDS.indexOf('first'));
    await page.locator(`${shown('settings')} .${prefixFor('settings')}action`, { hasText: 'Back' }).click();
    await page.waitForSelector(shown('title'), { state: 'attached' });
    const said = (): Promise<string> =>
      page.locator(`${shown('title')} .${prefixFor('title')}action`, { hasText: SCREENS.title.actions[0]!.label }).first().locator(`.${prefixFor('title')}action-hint`).innerText().catch(() => '');
    expect((await said()).trim(), 'Fly says it goes straight in before the visit has flown').toBe('');
    expect(await flownTo(page), 'the visit’s first flight went straight in on First flight').toBe('intro');
    await page.keyboard.press('Escape');
    await page.waitForSelector('.itc-playing-hud-shown', { timeout: 30_000 });
    await page.keyboard.press('Escape');
    await page.waitForSelector(shown('paused'), { state: 'attached' });
    await page.locator(`${shown('paused')} .${prefixFor('paused')}action`, { hasText: 'Quit' }).click();
    await page.waitForSelector(shown('quit'), { state: 'attached' });
    await page.locator(`${shown('quit')} .${prefixFor('quit')}action`, { hasText: 'Quit' }).click();
    await page.waitForSelector(shown('title'), { state: 'attached' });
    expect((await said()).trim(), 'Fly does not say the next flight goes straight in').toBe('Straight in');
    expect(await flownTo(page), 'the second flight of the visit played the intro on First flight').toBe('run');
    // Kept: a reload is a new visit, and its first flight plays the intro again.
    await page.reload();
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    expect(await flownTo(page), 'a new visit’s first flight went straight in').toBe('intro');
    await context.close();
  });

  it('a continue left to run out goes on the table, written before the title ends the run', async () => {
    /*
      ⚠️ **MOVED BY THIS DECISION, AND IT HAD NO GUARD.** A run over whose offer runs out onto the title
      goes on the score table — 0438. It was written as the title arrived, off the run; since 0559 the
      title empties the run, so it is written as the title is asked for, before the reducer moves. Held
      here in what the player keeps: a row in the saved table.
    */
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    // 0608: on a store in which every tier is finished, so the run-over screen's Freeplay is offered.
    const page = await seeded(context, dist, HANGAR_KEY, EVERY_TIER_FINISHED);
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await credit(page, 'free');
    await fly(page);
    // Nobody at the stick: the run runs out, and the offer is left to.
    await page.waitForSelector(shown('gameOver'), { state: 'attached', timeout: 90_000 });
    await page.waitForSelector(shown('title'), { state: 'attached', timeout: 30_000 });
    const table = await page.evaluate((key) => localStorage.getItem(key), SCORES_KEY);
    const rows = table === null ? [] : (JSON.parse(table) as { entries?: unknown[] } | unknown[]);
    const count = Array.isArray(rows) ? rows.length : (rows.entries?.length ?? 0);
    expect(count, `the run left to run out is not on the table: ${String(table)}`).toBe(1);
    await context.close();
  });
});
