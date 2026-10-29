import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { back, fly, inView, openHangar, pickWare, shown } from './title.ts';
import { seeded } from './seed.ts';
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
    const page = await seeded(context, dist, HANGAR_KEY, serialiseHangar({ ...initialHangar, shards: 338 }));
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
    /*
      ⚠️ **THE LAID-OUT WIDTH, NOT THE BOUNDING BOX — 0696.** 0596's probe zeroes the submarine's width, and this
      read it red on one CI run and STILL GREEN on the next with nothing changed between them. The dangle on the
      tile swings, and a bounding box is the box of the ROTATED element: a zero-width box 1.2em tall, turned by
      the swing, reads over four pixels wide at some phases of the animation and under at others. `offsetWidth`
      is the width the layout gave it, which the swing does not touch — 0 and its border under the probe, 34 px
      whole, at every phase.
    */
    const pictures = await page.locator(`${shown('shop')} [${SETTING_ATTR}="hanging"] .${SHOP}option-art`).evaluateAll((els) =>
      els.map((el) => [...el.querySelectorAll('*')].some((part) => (part as HTMLElement).offsetWidth > 4)));
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
    expect(await page.locator(`.${SHOP}ask`).innerText(), 'the sheet does not say the balance after').toContain('338 → 50');
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
    // 0585: the price risen, so how far short is read off the price rather than written out.
    const short = String((OWNABLES.family.price ?? 0) - 50);
    expect(await shelfLine(page, 'family')).toBe('Need ' + short + ' more Star Shards');
    expect(await keeperLine(page), 'Cosmo does not say how far off the balance is').toBe(COSMO.shop.short.replace('{short}', short));
    expect(await buy.innerText(), 'the first action does not say how far short the balance is').toContain('Need ' + short + ' more');
    await buy.click();
    expect(await page.locator(`.${SHOP}ask`).count(), 'a sheet asked to buy what the balance cannot cover').toBe(0);
    kept = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(kept.owned.family, 'a ware was bought on credit').toBe(false);
    expect(kept.shards).toBe(50);

    // Back in the hangar, the golf ball hung on the default pilot's ship; the run flies with it.
    await page.locator(`${shown('shop')} .${SHOP}tab`, { hasText: SCREENS.hangar.heading }).click();
    await page.waitForSelector(shown('hangar'), { state: 'attached' });
    // 0579: on the *Cockpit* sub-tab.
    await inView(page, 'hangar', 'dangle');
    await page.locator(`${shown('hangar')} [${SETTING_ATTR}="dangle"] .${prefixFor('hangar')}option >> nth=${1 + DANGLE_KINDS.indexOf('golfball')}`).click();
    expect(await hanging(page), 'the hangar did not hang what was chosen').toBe('golfball');
    await back(page, 'hangar');
    await fly(page);
    expect(await hanging(page), 'the run did not wear what the hangar hung').toBe('golfball');
    await context.close();
  });
});

describe.runIf(chromePath)('0657 — Cosmo’s shelves show what is for sale, and A on one asks to buy', () => {
  it('THE ASK: what is owned is off the shelves until Owned is ticked, and a press on a shelf opens Buy’s sheet', async () => {
    /*
      *"Locked items … should be visible in cosmos and in cosmos owned items should be hidden unless you tick to show
      them"*, and *"A button on game console goes to next item in stores, it should confirm just like it does on main
      menu."* The golf ball is owned; the family dice are not, and the balance covers them.
    */
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const owned = { ...initialHangar.owned, golfball: true };
    const page = await seeded(context, dist, HANGAR_KEY, serialiseHangar({ ...initialHangar, shards: 5000, owned }));
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openHangar(page);
    await page.locator(`${shown('hangar')} .${prefixFor('hangar')}tab`, { hasText: SCREENS.shop.heading }).click();
    await page.waitForSelector(shown('shop'), { state: 'attached' });

    const golfball = page.locator(`${shown('shop')} [${SETTING_ATTR}="hanging"] .${SHOP}option >> nth=${SHELVES.hanging.wares.indexOf('golfball')}`);
    const family = page.locator(`${shown('shop')} [${SETTING_ATTR}="hanging"] .${SHOP}option >> nth=${SHELVES.hanging.wares.indexOf('family')}`);
    const tick = page.locator(`${shown('shop')} .${SHOP}action`, { hasText: 'Owned' });
    await page.locator(`${shown('shop')} [${SETTING_ATTR}="aisle"] .${SHOP}option >> nth=${SHELF_KINDS.indexOf('hanging')}`).click();
    expect(await golfball.isHidden(), 'the golf ball, owned, is on the shelf with the box unticked').toBe(true);
    expect(await family.isHidden(), 'the family dice, for sale, are off the shelf').toBe(false);
    expect(await tick.innerText(), 'the box does not say it is unticked').toContain('☐');
    await tick.click();
    expect(await golfball.isHidden(), 'ticked, the golf ball is still off the shelf').toBe(false);
    expect(await tick.innerText(), 'the box does not say it is ticked').toContain('☑');
    await tick.click();
    expect(await golfball.isHidden(), 'unticked again, the golf ball is still on the shelf').toBe(true);

    // A press on the shelf, as a pad's A or Enter is: Buy's own sheet asks, and nothing is spent until it is answered.
    await pickWare(page, 'family');
    // Down the screen's rows with the keys a player has, to the shelf.
    for (let i = 0; i < 8; i++) {
      if ((await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))) === SHELVES.hanging.label) break;
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(80);
    }
    expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'the keys never reached the shelf').toBe(SHELVES.hanging.label);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    expect(await page.locator(`.${SHOP}ask`).count(), 'a press on the shelf did not ask to buy the ware in the window').toBe(1);
    const kept = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(kept.owned.family, 'a press on the shelf bought without asking').toBe(false);
    await context.close();
  });
});

describe.runIf(chromePath)('0673 — Cosmo’s foot is one line, its sub-tabs whole, and a lone option shows the way there', () => {
  /** A page on the title with a store in which every one of the four golfers' ships is won in. */
  const opened = async (viewport: { width: number; height: number }): Promise<Page> => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const won = { ...initialHangar.won, fighter: true, caddie: true, firebird: true, estate: true };
    const page = await seeded(context, dist, HANGAR_KEY, serialiseHangar({ ...initialHangar, shards: 5000, won }));
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openHangar(page);
    return page;
  };
  const tab = async (page: Page, from: 'hangar' | 'parts' | 'shop', to: 'parts' | 'shop'): Promise<void> => {
    await page.locator(`${shown(from)} .${prefixFor(from)}tab`, { hasText: SCREENS[to].heading }).click();
    await page.waitForSelector(shown(to), { state: 'attached' });
    await page.waitForTimeout(300);
  };

  it('stands Buy across the foot on one line with Back beside it, and the filter at the shelf’s head', async () => {
    for (const viewport of [
      { width: 1280, height: 720 },
      { width: 1920, height: 1080 },
      { width: 667, height: 375 },
    ]) {
      const page = await opened(viewport);
      await tab(page, 'hangar', 'shop');
      const m = await page.evaluate((p: string) => {
        const root = document.querySelector('.' + p + 'shown')!;
        const action = (label: string): HTMLElement | undefined =>
          [...root.querySelectorAll<HTMLElement>('.' + p + 'action')].find((b) => (b.textContent ?? '').includes(label));
        const box = (el: Element | undefined | null): DOMRect | null => (el ? el.getBoundingClientRect() : null);
        const buy = action('Buy');
        const lines = buy === undefined ? 0 : Math.round(buy.getBoundingClientRect().height / parseFloat(getComputedStyle(buy).lineHeight || '20'));
        const aisle = root.querySelector(`[data-itc-setting="aisle"]`);
        const shelf = [...root.querySelectorAll('.' + p + 'band')].find((b) => !b.querySelector('[data-itc-setting="aisle"]') && !b.classList.contains(p + 'band-faces') && b.getClientRects().length > 0);
        // The shelf's own heading, drawn: it said the open sub-tab's name again under it.
        const headings = [...root.querySelectorAll<HTMLElement>('.' + p + 'band-label')].filter((h) => h.checkVisibility()).map((h) => h.textContent ?? '');
        return { buy: box(buy), back: box(action('Back')), owned: box(action('Owned')), aisle: box(aisle), shelf: box(shelf), buyLines: lines, buyText: buy === undefined ? -1 : buy.scrollWidth - buy.clientWidth, headings };
      }, SHOP);
      const at = `${viewport.width}x${viewport.height}`;
      expect(m.buy!.width, `${at}: Buy is not the widest of the foot`).toBeGreaterThan(m.back!.width);
      expect(Math.abs((m.buy!.top + m.buy!.bottom) / 2 - (m.back!.top + m.back!.bottom) / 2), `${at}: Back is not beside Buy`).toBeLessThan(4);
      expect(m.buyText, `${at}: Buy's words run out of it`).toBeLessThanOrEqual(1);
      expect(m.buy!.height, `${at}: Buy is ${m.buy!.height.toFixed(0)} px tall, more than a line of it`).toBeLessThan(m.back!.height + 4);
      expect(m.owned!.top, `${at}: the filter is not under the sub-tabs`).toBeGreaterThanOrEqual(m.aisle!.bottom - 1);
      expect(m.owned!.bottom, `${at}: the filter is not over the shelf`).toBeLessThanOrEqual(m.shelf!.top + 1);
      expect(m.headings, `${at}: the shelf's heading says the open sub-tab's name again`).toEqual([]);
      await page.context().close();
    }
  });

  it('draws every sub-tab whole, never cut short, on every device', async () => {
    for (const viewport of [
      { width: 480, height: 320 },
      { width: 667, height: 375 },
      { width: 1280, height: 720 },
      { width: 2560, height: 1080 },
    ]) {
      const page = await opened(viewport);
      await tab(page, 'hangar', 'shop');
      const cut = await page.evaluate((p: string) => {
        const strip = document.querySelector<HTMLElement>(`.${p}shown [data-itc-setting="aisle"]`)!;
        const edge = strip.getBoundingClientRect();
        return [...strip.querySelectorAll<HTMLElement>('.' + p + 'option')]
          .filter((t) => getComputedStyle(t).visibility !== 'hidden' && t.getClientRects().length > 0)
          .filter((t) => {
            const b = t.getBoundingClientRect();
            return t.scrollWidth > t.clientWidth + 1 || (b.right > edge.left && b.left < edge.right && (b.left < edge.left - 0.5 || b.right > edge.right + 0.5));
          })
          .map((t) => t.textContent);
      }, SHOP);
      expect(cut, `${viewport.width}x${viewport.height}: a sub-tab cut short`).toEqual([]);
      await page.context().close();
    }
  });

  it('shows whole chips on Paint & Parts, a lone flame the way to Cosmo’s, and the art as the ship’s flank', async () => {
    const page = await opened({ width: 1280, height: 720 });
    await tab(page, 'hangar', 'parts');
    const p = prefixFor('parts');
    const cut = await page.evaluate((p: string) => {
      const out: string[] = [];
      for (const track of document.querySelectorAll<HTMLElement>(`.${p}shown .${p}plate .${p}options`)) {
        const edge = track.getBoundingClientRect();
        for (const chip of track.querySelectorAll<HTMLElement>('.' + p + 'option')) {
          if (getComputedStyle(chip).visibility === 'hidden' || chip.getClientRects().length === 0) continue;
          const b = chip.getBoundingClientRect();
          if (b.right > edge.left && b.left < edge.right && (b.left < edge.left - 0.5 || b.right > edge.right + 0.5)) out.push(chip.textContent ?? '');
        }
      }
      return out;
    }, p);
    expect(cut, 'a chip drawn in part on Paint & Parts').toEqual([]);
    // The Firebird's flame: its standard one alone, since this store owns no other.
    const more = page.locator(`${shown('parts')} [data-itc-setting="flame"] .${p}cosmos`);
    expect(await more.isVisible(), 'the lone flame shows no way to Cosmo’s').toBe(true);
    await more.click();
    await page.waitForSelector(shown('shop'), { state: 'attached' });
    const open = await page.locator(`${shown('shop')} [data-itc-setting="aisle"] [aria-pressed="true"]`).innerText();
    expect(open.trim(), 'the way to Cosmo’s opened another shelf than the flames').toBe(SHELVES.flames.label);
    // The art: the Paint group's thumbnails at the flank's size.
    await tab(page, 'shop', 'parts');
    await page.locator(`${shown('parts')} [data-itc-setting="section"] .${p}option`, { hasText: 'Paint' }).click();
    await page.waitForTimeout(300);
    const thumb = await page.locator(`${shown('parts')} [data-itc-setting="art"] .${p}option-thumb`).first().boundingBox();
    expect(thumb, 'the art has no thumbnail').not.toBeNull();
    expect(thumb!.width, `the art's picture is ${thumb!.width.toFixed(0)} px across`).toBeGreaterThanOrEqual(80);
    expect(thumb!.height, `the art's picture is ${thumb!.height.toFixed(0)} px tall`).toBeGreaterThanOrEqual(44);
    await page.context().close();
  });
});
