import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openHangar, shown } from './title.ts';
import { seedOnce } from './seed.ts';
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

/** The card's ship, as the bytes of its picture — a different look is a different picture. */
async function card(page: Page): Promise<string> {
  return page.evaluate((sel) => (document.querySelector(sel) as HTMLCanvasElement | null)?.toDataURL() ?? '', `${shown('parts')} .${PARTS}pilot-ship > canvas`);
}

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
    const before = await card(page);
    await page.locator(`${shown('parts')} [${SETTING_ATTR}="art"] .${PARTS}option >> nth=${SHIPS.firebird.arts.indexOf('flames')}`).click();
    const kept = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(kept.art.firebird, 'the flames were not fitted').toBe('flames');
    expect(await card(page), 'the card still shows the look it had').not.toBe(before);

    // Hook on the stand: the band names the fighter's three, the first open and the rest shut — never won in.
    const hook = GOLFER_KINDS.find((kind) => GOLFERS[kind].ship === 'fighter')!;
    await page.locator(`${shown('parts')} [${SETTING_ATTR}="pilot"] .${PARTS}option >> nth=${GOLFER_KINDS.indexOf(hook)}`).click();
    expect(await names(page)).toEqual(SHIPS.fighter.arts.map((art) => ART[art].name));
    const open = await page.locator(`${shown('parts')} [${SETTING_ATTR}="art"] .${PARTS}option`).evaluateAll((els) => els.map((el) => !(el as HTMLButtonElement).disabled));
    expect(open, 'a look the fighter has not been won in for is open').toEqual([true, false, false]);
    await context.close();
  });
});
