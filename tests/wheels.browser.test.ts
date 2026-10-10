import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openHangar, shown } from './title.ts';
import { seeded } from './seed.ts';
import { samePhase } from './stand.ts';
import { HANGAR_KEY, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { RIM_KINDS } from '../src/content/rims.ts';
import { SHELF_KINDS, SHELVES } from '../src/content/wares.ts';
import { SCREENS } from '../src/state/screens.ts';

/**
 * THE WHEELS TURN, IN THE PAGE — `docs/decisions/0527-the-wheels-turn.md`.
 *
 * `tests/wheels.test.ts` holds the rule, the key and the turning in the frame. **What it cannot see is
 * the trip a player makes**: the spinners bought at Cosmo's, the third tab, fitted on Paint & Parts,
 * and the card there showing them turning over the car's own tyres.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

describe.runIf(chromePath)('0527 — the spinners are bought, fitted, and turn', () => {
  it('bought at Cosmo’s for 1000 and 0585’s fifteen per cent, fitted to the Firebird on Paint & Parts, turning on its pad', async () => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const page = await seeded(context, dist, HANGAR_KEY, serialiseHangar({ ...initialHangar, shards: 1150 }));
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openHangar(page);

    const shop = prefixFor('shop');
    const parts = prefixFor('parts');
    await page.locator(`${shown('hangar')} .${prefixFor('hangar')}tab`, { hasText: SCREENS.shop.heading }).click();
    await page.waitForSelector(shown('shop'), { state: 'attached' });
    /*
      0542: TRIED ON BEFORE IT IS BOUGHT. The spinners in Cosmo's window are on the car on its pad, and
      turning, before a shard is spent — the aisle to the wheels, then the spinners off that shelf.
    */
    const option = (band: string, nth: number) => page.locator(`${shown('shop')} [${SETTING_ATTR}="${band}"] .${shop}option >> nth=${nth}`);
    const tried = await samePhase(page, 'shop', async () => {
      await option('aisle', SHELF_KINDS.indexOf('wheels')).dispatchEvent('click');
      await option('wheels', SHELVES.wheels.wares.indexOf('spinner')).dispatchEvent('click');
    });
    expect(tried.change, `the car on Cosmo's pad does not try the spinners on: ${tried.change.toFixed(4)} of the stand moved, against ${tried.noise.toFixed(4)} standing still`).toBeGreaterThan(Math.max(3 * tried.noise, 0.002));
    expect(tried.after, `the spinners tried on do not turn: ${tried.after.toFixed(4)} a bob apart, against ${tried.noise.toFixed(4)}`).toBeGreaterThan(Math.max(3 * tried.noise, 0.001));
    expect(hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar).rim.firebird, 'trying the spinners on fitted them').not.toBe('spinner');
    await page.locator(`${shown('shop')} .${shop}choices .${shop}action >> nth=0`).click();
    // 0564: and the sheet's Buy, which is the one that buys.
    await page.locator(`.${shop}ask .${shop}action`, { hasText: SCREENS.shop.actions[0]!.label }).click();
    const kept = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(kept.owned.spinner, 'Buy did not buy the spinners').toBe(true);
    expect(kept.shards).toBe(0);

    // The default pilot flies the Firebird; its wheels band offers the spinners now, and takes them.
    await page.locator(`${shown('shop')} .${shop}tab`, { hasText: SCREENS.parts.heading }).click();
    await page.waitForSelector(shown('parts'), { state: 'attached' });
    /*
      ⚠️ **ON THE PAD, AND IT WAS THE CARD — 0540.** The card's ship and the two wheels the stylesheet turned
      on it went when the port came to stand behind the tab: the spinners are drawn turning over the car on
      its pad, which `tests/stand.test.ts` holds blit by blit. What the page says is that they arrived there
      — the pad's picture moved, past what the stand moves standing still (`tests/stand.ts`).
    */
    const { noise, change, after } = await samePhase(page, 'parts', () =>
      page.locator(`${shown('parts')} [${SETTING_ATTR}="rim"] .${parts}option >> nth=${RIM_KINDS.indexOf('spinner')}`).dispatchEvent('click'),
    );
    const fitted = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(fitted.rim.firebird, 'the spinners were not fitted').toBe('spinner');
    expect(change, `the car on the pad does not wear the spinners: ${change.toFixed(4)} of the stand moved, against ${noise.toFixed(4)} standing still`).toBeGreaterThan(Math.max(3 * noise, 0.002));
    // And they turn: read a whole bob apart, the stand is no longer still once they are on.
    expect(after, `the spinners on the pad do not turn: ${after.toFixed(4)} of the stand moved a bob apart, against ${noise.toFixed(4)} before`).toBeGreaterThan(Math.max(3 * noise, 0.001));
    await context.close();
  });
});
