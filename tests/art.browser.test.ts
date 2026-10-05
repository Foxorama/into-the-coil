import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openHangar, shown } from './title.ts';
import { seedOnce } from './seed.ts';
import { samePhase } from './stand.ts';
import { HANGAR_KEY, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { ART } from '../src/content/art.ts';
import { SHIPS } from '../src/content/ships.ts';
import { GOLFERS, GOLFER_KINDS } from '../src/content/golfers.ts';
import { SCREENS } from '../src/state/screens.ts';

/**
 * THE NOSES ARE PAINTED, IN THE PAGE — `docs/decisions/0528-the-noses-are-painted.md`.
 *
 * `tests/art.test.ts` holds the rule and the key. **What it cannot see is the band renamed for the ship on
 * the stand** — the chrome's `setLabels` — and the card redrawn in the look chosen, which is a picture
 * kept per fit and was kept per gun and rim alone when this was first built.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;
const PARTS = prefixFor('parts');

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

/** The art band's three names, as the page shows them. */
async function names(page: Page): Promise<string[]> {
  return page.locator(`${shown('parts')} [${SETTING_ATTR}="art"] .${PARTS}option`).allTextContents();
}

/*
  ⚠️ **THE SHIP ON THE PAD, AND IT WAS THE CARD'S — 0540.** The card's ship went when the port came to stand
  behind the tab; the preview is the ship on its pad, on the game's canvas, read as the stand's colours
  against what the stand moves standing still (`tests/stand.ts` says why not byte for byte).
*/

describe.runIf(chromePath)('0528 — every ship wears its own art', () => {
  it('the band names the ship on the stand’s three, and a look fitted is kept and drawn on the card', async () => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    await seedOnce(context, HANGAR_KEY, serialiseHangar({ ...initialHangar, won: { ...initialHangar.won, firebird: true } }));
    const page = await context.newPage();
    await page.goto(dist);
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openHangar(page);
    await page.locator(`${shown('hangar')} .${prefixFor('hangar')}tab`, { hasText: SCREENS.parts.heading }).click();
    await page.waitForSelector(shown('parts'), { state: 'attached' });

    // The default pilot flies the Firebird, won in: its three, all open.
    expect(await names(page)).toEqual(SHIPS.firebird.arts.map((art) => ART[art].name));
    const { noise, change } = await samePhase(page, 'parts', () =>
      page.locator(`${shown('parts')} [${SETTING_ATTR}="art"] .${PARTS}option >> nth=${SHIPS.firebird.arts.indexOf('flames')}`).dispatchEvent('click'),
    );
    const kept = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(kept.art.firebird, 'the flames were not fitted').toBe('flames');
    expect(change, `the ship on the pad still wears the look it had: ${change.toFixed(4)} of the stand moved, against ${noise.toFixed(4)} standing still`).toBeGreaterThan(Math.max(3 * noise, 0.002));

    // Hook on the stand: the band names the fighter's three, the first open and the rest shut — never won in.
    const hook = GOLFER_KINDS.find((kind) => GOLFERS[kind].ship === 'fighter')!;
    await page.locator(`${shown('parts')} [${SETTING_ATTR}="pilot"] .${PARTS}option >> nth=${GOLFER_KINDS.indexOf(hook)}`).click();
    expect(await names(page)).toEqual(SHIPS.fighter.arts.map((art) => ART[art].name));
    const open = await page.locator(`${shown('parts')} [${SETTING_ATTR}="art"] .${PARTS}option`).evaluateAll((els) => els.map((el) => !(el as HTMLButtonElement).disabled));
    expect(open, 'a look the fighter has not been won in for is open').toEqual([true, false, false]);
    await context.close();
  });
});
