import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { back, fly, openHangar, pickWare, shown } from './title.ts';
import { seedOnce } from './seed.ts';
import { HANGAR_KEY, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { DANGLE_KINDS, type DangleKind } from '../src/content/dangles.ts';
import { OWNABLES, SHELF_KINDS, SHELVES, WARES, type OwnableKind } from '../src/content/wares.ts';
import { COSMO } from '../src/content/keepers.ts';
import { SCREENS } from '../src/state/screens.ts';

/**
 * COSMO OPENS, IN THE PAGE — `docs/decisions/0523-cosmo-opens.md`.
 *
 * `tests/cosmo.test.ts` holds the trade. **What it cannot see is the picture**: whether the ware in
 * the window hangs from the player's own dash before it is bought, whether Buy goes once it is owned,
 * whether the shelf says how far the balance is from a ware, and whether the run wears what was hung.
 * What hangs is a class on the readout, which is the dash the player sees.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

const SHOP = prefixFor('shop');

/**
 * What hangs from the readout's dash, or `null` — the one whose drawing takes up room on the page.
 *
 * ⚠️ **A BOX, NOT A CLASS.** The readout carries a class naming what hangs, and a stylesheet that never
 * shows the mount would leave that class true over an empty dash. So the thing on the strand must be
 * laid out with a width, which is the picture the player sees.
 */
async function hanging(page: Page): Promise<DangleKind | null> {
  const found = await page.evaluate((kinds) => {
    const hud = document.querySelector('.itc-playing-hud');
    if (hud === null || !hud.classList.contains('itc-playing-hud-shown')) return null;
    return (
      kinds.find((kind) => {
        // In the readout: since 0564 each dangle's tile at Cosmo's carries a copy of its drawing.
        const thing = hud.querySelector('.itc-playing-hud-hang-' + kind + ' .itc-playing-hud-dice-strand > *');
        return thing !== null && thing.getBoundingClientRect().width > 0;
      }) ?? null
    );
  }, [...DANGLE_KINDS]);
  return DANGLE_KINDS.find((kind) => kind === found) ?? null;
}

/**
 * The line of the shelf a ware is on, which says what stands between the player and it — 0542: each shelf
 * is its own band, and its line is the band's own.
 */
const shelfLine = (page: Page, ware: OwnableKind): Promise<string> => {
  const shelf = SHELF_KINDS.find((kind) => SHELVES[kind].wares.includes(ware))!;
  return page.locator(`${shown('shop')} [${SETTING_ATTR}="${shelf}"] ~ .${SHOP}band-hint`).innerText();
};
/** What Cosmo is saying — 0542. */
const keeperLine = (page: Page): Promise<string> => page.locator(`${shown('shop')} .${SHOP}keeper-line`).innerText();

describe.runIf(chromePath)('0523 — Cosmo’s sells a dangle, and the run wears it', () => {
  it('tries the ware on the dash, buys it once, says how far off the next is, and hangs it on the run', async () => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    await seedOnce(context, HANGAR_KEY, serialiseHangar({ ...initialHangar, shards: 300 }));
    const page = await context.newPage();
    await page.goto(dist);
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openHangar(page);
    await page.locator(`${shown('hangar')} .${prefixFor('hangar')}tab`, { hasText: SCREENS.shop.heading }).click();
    await page.waitForSelector(shown('shop'), { state: 'attached' });

    // Every ware in the window hangs from the dash before a shard is spent.
    // 0527: every ware that hangs — a rim on the shelf is not worn on the dash. 0542: picked off its shelf.
    for (const ware of WARES) {
      if (!DANGLE_KINDS.some((d) => d === ware)) continue;
      await pickWare(page, ware);
      expect(await hanging(page), `${ware} in the window was not tried on the dash`).toBe(ware);
    }

    // 0564: one shelf at a time, as the aisle's tabs step them, and every ware on it a picture with a size.
    const drawn = await page.locator(`${shown('shop')} .${SHOP}band`).evaluateAll((els) =>
      els.filter((el) => el.querySelector(`[data-itc-setting]:not([data-itc-setting="aisle"]):not([data-itc-setting="pilot"])`) !== null && el.getBoundingClientRect().height > 0).length);
    expect(drawn, 'more than one shelf is drawn at once on a desktop').toBe(1);
    // A picture is something inside the tile's art box laid out with a width — the thing on the strand.
    const pictures = await page.locator(`${shown('shop')} [${SETTING_ATTR}="hanging"] .${SHOP}option-art`).evaluateAll((els) =>
      els.map((el) => [...el.querySelectorAll('*')].some((part) => part.getBoundingClientRect().width > 4)));
    expect(pictures.every(Boolean) && pictures.length === SHELVES.hanging.wares.length, 'a ware on the shelf has no picture').toBe(true);

    // 0542: the price on the ware's face, and on Buy.
    // 0564: the shop's first action, whatever it says — Buy, how far short, or Fit it now.
    const buy = page.locator(`${shown('shop')} .${SHOP}choices .${SHOP}action >> nth=0`);
    // And the sheet that asks before a purchase, whose own Buy is the one that buys.
    const confirm = page.locator(`.${SHOP}ask .${SHOP}action`, { hasText: SCREENS.shop.actions[0]!.label });
    await pickWare(page, 'golfball');
    const face = page.locator(`${shown('shop')} [${SETTING_ATTR}="hanging"] .${SHOP}option >> nth=${SHELVES.hanging.wares.indexOf('golfball')}`);
    expect(await face.innerText(), 'the golf ball does not say its price on its face').toContain(String(OWNABLES.golfball.price));
    expect(await buy.innerText(), 'Buy does not name the price').toContain(String(OWNABLES.golfball.price));

    // 0564: Buy asks first, and nothing is spent until the sheet's Buy is pressed.
    await buy.click();
    let kept = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(kept.owned.golfball, 'Buy bought without asking').toBe(false);
    expect(await page.locator(`.${SHOP}ask`).innerText(), 'the sheet does not say the balance after').toContain('300 → 50');
    await confirm.click();
    // The golf ball bought: the balance down by its price, Buy gone, and the shelf saying it is theirs.
    kept = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(kept.owned.golfball, 'Buy did not buy').toBe(true);
    expect(kept.shards, 'the price was not taken, or was taken twice').toBe(50);
    expect(await buy.innerText(), 'the ware bought is not offered to be fitted').toContain('Fit it now');
    expect(await shelfLine(page, 'golfball')).toContain('Yours');
    // 0542: Cosmo thanks the player, and the ware's face says it is theirs.
    expect(await keeperLine(page), 'Cosmo did not thank the player for the sale').toBe(COSMO.shop.sold);
    expect(await face.innerText(), 'the golf ball still says its price once it is owned').toContain('Yours');

    // The next is out of reach, and the shelf says by how much; a press of Buy cannot buy it.
    await pickWare(page, 'family');
    expect(await shelfLine(page, 'family')).toBe('Need 200 more Star Shards');
    expect(await keeperLine(page), 'Cosmo does not say how far off the balance is').toBe(COSMO.shop.short.replace('{short}', '200'));
    expect(await buy.innerText(), 'the first action does not say how far short the balance is').toContain('Need 200 more');
    await buy.click();
    expect(await page.locator(`.${SHOP}ask`).count(), 'a sheet asked to buy what the balance cannot cover').toBe(0);
    kept = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(kept.owned.family, 'a ware was bought on credit').toBe(false);
    expect(kept.shards).toBe(50);

    // Back in the hangar, the golf ball hung on the default pilot's ship; the run flies with it.
    await page.locator(`${shown('shop')} .${SHOP}tab`, { hasText: SCREENS.hangar.heading }).click();
    await page.waitForSelector(shown('hangar'), { state: 'attached' });
    await page.locator(`${shown('hangar')} [${SETTING_ATTR}="dangle"] .${prefixFor('hangar')}option >> nth=${1 + DANGLE_KINDS.indexOf('golfball')}`).click();
    expect(await hanging(page), 'the hangar did not hang what was chosen').toBe('golfball');
    await back(page, 'hangar');
    await fly(page);
    expect(await hanging(page), 'the run did not wear what the hangar hung').toBe('golfball');
    await context.close();
  });
});
