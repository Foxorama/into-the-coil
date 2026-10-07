import { describe, it, expect, vi, afterAll } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openHangar, shown } from './title.ts';
import { SCREENS, SCREEN_KINDS } from '../src/state/screens.ts';

/**
 * THE DOCK IS DRESSED — `docs/decisions/0572-the-dock-is-dressed.md`.
 *
 * Played on 0571: the keepers' words a column away from them, the Star Shards in the plate's foot, the dash
 * off to the side, the equipped thing's detail at the plate's bottom, and cards of text whose picture
 * vanished under the fitted fill. Each is asked in what the player sees: where a box is drawn, against the
 * stand, the plate and the band it is about, at the desktop sizes the hangar opens out at (0568).
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 180_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;
const HANGAR = prefixFor('hangar');

/** The tabs that stand, read off the rows — never listed by name. */
const STANDING = SCREEN_KINDS.filter((s) => SCREENS[s].stand !== null);

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

async function opened(width: number, height: number): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  await openHangar(page);
  return page;
}

async function toTab(page: Page, screen: (typeof STANDING)[number]): Promise<void> {
  if ((await page.locator(shown(screen)).count()) > 0) return;
  const tabs = STANDING.map((s) => `${shown(s)} .${prefixFor(s)}tab`).join(', ');
  await page.locator(tabs, { hasText: SCREENS[screen].heading }).first().click();
  await page.waitForSelector(shown(screen));
  await page.waitForTimeout(200);
}

type Box = { x: number; y: number; width: number; height: number };
const box = async (page: Page, selector: string): Promise<Box> => (await page.locator(selector).first().boundingBox())!;
const inside = (a: Box, b: Box): boolean => a.x >= b.x - 0.5 && a.y >= b.y - 0.5 && a.x + a.width <= b.x + b.width + 0.5 && a.y + a.height <= b.y + b.height + 0.5;

describe.runIf(chromePath)('0572 — the dock is dressed', () => {
  it('stands the balance in the stand’s top right corner, large, on every tab', async () => {
    expect(STANDING.length, 'no screen stands, so this guard is measuring nothing').toBeGreaterThan(0);
    for (const [width, height] of [
      [1280, 720],
      [1920, 1080],
    ] as const) {
      const page = await opened(width, height);
      for (const screen of STANDING) {
        await toTab(page, screen);
        const p = prefixFor(screen);
        const stand = await box(page, `${shown(screen)} .${p}stand`);
        const sheet = await box(page, `${shown(screen)} .${p}sheet`);
        const at = `${screen} at ${width}x${height}`;
        expect(inside(sheet, stand), `${at}: the balance is not in the stand`).toBe(true);
        expect(stand.x + stand.width - (sheet.x + sheet.width), `${at}: the balance is not at the stand's right`).toBeLessThan(width * 0.03);
        expect(sheet.y - stand.y, `${at}: the balance is not at the stand's top`).toBeLessThan(height * 0.06);
        const value = await box(page, `${shown(screen)} .${p}sheet-value`);
        expect(value.height, `${at}: the balance's figure is ${value.height}px tall`).toBeGreaterThanOrEqual(24);
      }
      await page.context().close();
    }
  });

  it('hangs each keeper’s words over the keeper, in the stand, left to right as the shops stand', async () => {
    const page = await opened(1920, 1080);
    const tails: number[] = [];
    for (const screen of STANDING) {
      await toTab(page, screen);
      const p = prefixFor(screen);
      const stand = await box(page, `${shown(screen)} .${p}stand`);
      const said = page.locator(`${shown(screen)} .${p}stand > .${p}keeper`);
      expect(await said.isVisible(), `${screen}: the keeper's bubble is not drawn`).toBe(true);
      const bubble = (await said.boundingBox())!;
      expect(inside(bubble, stand), `${screen}: the bubble runs out of the stand`).toBe(true);
      // Where its tail is, across the screen: the left edge plus the tail's place along it.
      const tail = await said.evaluate((el) => el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).getPropertyValue('--itc-say-tail')));
      tails.push(tail);
    }
    // Unity, MMXXVI and Cosmo stand left to right on the mezzanine, so their bubbles' tails do (0571).
    for (let i = 1; i < tails.length; i++) expect(tails[i]! - tails[i - 1]!, `the bubbles' tails do not move with the keepers: ${tails.join(', ')}`).toBeGreaterThan(100);
    await page.context().close();
  });

  /*
    Played on the first build: *"the speech bubbles should decay and disappear"*. Read in what the eye gets —
    the bubble's opacity — a moment after the tab opens, once it has had time to be read, and again after the
    tab is opened again.
  */
  it('lets a keeper’s bubble fade once it has been read, and says it again when the tab is opened', async () => {
    const page = await opened(1280, 720);
    const p = prefixFor('hangar');
    const opacity = (): Promise<number> => page.locator(`${shown('hangar')} .${p}stand > .${p}keeper`).evaluate((el) => Number(getComputedStyle(el).opacity));
    await page.waitForTimeout(1000);
    expect(await opacity(), 'the bubble is not up when the tab opens').toBeGreaterThan(0.5);
    await page.waitForTimeout(7000);
    expect(await opacity(), 'the bubble is still up seven seconds on').toBeLessThan(0.05);
    await toTab(page, 'parts');
    await toTab(page, 'hangar');
    await page.waitForTimeout(800);
    expect(await opacity(), 'the bubble did not come back when its tab was opened again').toBeGreaterThan(0.5);
    await page.context().close();
  });

  /*
    And *"the menu items change size when the descriptions are too long, it makes the menu do the weird up and
    down thing"*: stepped along every gun, the caption under the band stands at one height, so nothing under
    it moves. At 1920x1080, where a caption is two lines.
  */
  it('holds a band’s caption at one height whichever option is under the cursor', async () => {
    const page = await opened(1920, 1080);
    const p = prefixFor('hangar');
    const caption = `${shown('hangar')} .${p}band:has([${SETTING_ATTR}="gun"]) .${p}band-said`;
    await page.keyboard.press('ArrowDown');
    const heights: number[] = [];
    const count = await page.locator(`${shown('hangar')} [${SETTING_ATTR}="gun"] .${p}option`).count();
    // From the band's first option along to its last, the caption read at each.
    for (let i = 0; i < count; i++) await page.keyboard.press('ArrowLeft');
    for (let i = 0; i < count; i++) {
      if (i > 0) await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(120);
      heights.push((await box(page, caption)).height);
    }
    /*
      And every other band's caption beside it: a dash's line is a few words on any letters, where a gun's runs to
      two on CI's wider ones, which made every gun the same two lines there and this guard blind to the rule.
    */
    const all = await page.locator(`${shown('hangar')} .${p}band-said`).evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    heights.push(...all);
    expect(heights.length, 'no guns, so this guard is measuring nothing').toBeGreaterThan(1);
    expect(Math.max(...heights) - Math.min(...heights), `the caption's height moved as the cursor stepped: ${heights.join(', ')}`).toBeLessThan(1);
    await page.context().close();
  });

  /*
    And *"can we click/tap on a shop to select that shop rather than having to go to the menu tab?"* — a press
    on each other shop in the picture opens its tab, at a desktop and a phone held sideways.
  */
  it('opens a shop’s tab when the shop in the picture is pressed', async () => {
    for (const [width, height] of [
      [1280, 720],
      [667, 375],
    ] as const) {
      const page = await opened(width, height);
      for (const [from, to] of [
        ['hangar', 'shop'],
        ['shop', 'parts'],
        ['parts', 'hangar'],
      ] as const) {
        await toTab(page, from);
        const p = prefixFor(from);
        const door = page.locator(`${shown(from)} .${p}stand > .${p}shop-door[aria-label="${SCREENS[to].heading}"]`);
        expect(await door.isVisible(), `${from} at ${width}x${height}: no door on ${to}'s shop`).toBe(true);
        await door.click();
        await page.waitForSelector(shown(to), { timeout: 5000 });
      }
      await page.context().close();
    }
  });

  it('stands the cockpit monitor under the ship, in the stand’s middle, not its corner', async () => {
    const page = await opened(1920, 1080);
    const stand = await box(page, `${shown('hangar')} .${HANGAR}stand`);
    const dash = await box(page, `${shown('hangar')} .${HANGAR}dash`);
    const middle = (dash.x + dash.width / 2 - stand.x) / stand.width;
    expect(middle, `the monitor's middle is ${middle.toFixed(2)} of the way across the stand`).toBeGreaterThan(0.3);
    expect(middle).toBeLessThan(0.75);
    await page.context().close();
  });

  it('says what each band has on under the band, and a step says what was tried on', async () => {
    const page = await opened(1280, 720);
    const caption = (name: string): string => `${shown('hangar')} .${HANGAR}band:has([${SETTING_ATTR}="${name}"]) .${HANGAR}band-said`;
    for (const name of ['gun', 'special'] as const) {
      const band = await box(page, `${shown('hangar')} .${HANGAR}band:has([${SETTING_ATTR}="${name}"])`);
      const options = await box(page, `${shown('hangar')} [${SETTING_ATTR}="${name}"]`);
      const said = await box(page, caption(name));
      expect(said.height, `the ${name} band's caption is not drawn`).toBeGreaterThan(0);
      expect(inside(said, band) && said.y >= options.y + options.height - 1, `the ${name} band's caption is not under its options`).toBe(true);
    }
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    const tried = await page.locator(`${shown('hangar')} [${SETTING_ATTR}="gun"] .${HANGAR}option-look .${HANGAR}option-label`).textContent();
    expect(await page.locator(`${caption('gun')} .${HANGAR}band-said-name`).textContent(), 'the gun band does not say the gun tried on').toBe(tried);
    await page.context().close();
  });

  it('draws a picture on every Hangin’ Out card, and the fitted one is not filled over it', async () => {
    const page = await opened(1280, 720);
    const cards = await page.locator(`${shown('hangar')} .${HANGAR}band:not(.${HANGAR}band-faces) .${HANGAR}option`).evaluateAll((all, p) =>
      all.map((card) => {
        const pic = card.querySelector('.' + p + 'option-pic');
        const r = pic?.getBoundingClientRect();
        const fill = getComputedStyle(card).backgroundColor;
        const alpha = /rgba?\(([^)]+)\)/.exec(fill)?.[1]?.split(',')[3];
        return { name: card.textContent ?? '', pic: r !== undefined && r.width > 0 && r.height > 0, on: card.className.includes(p + 'option-on'), opaque: alpha === undefined ? !fill.includes('/') && fill !== 'rgba(0, 0, 0, 0)' : Number(alpha) >= 0.99 };
      }),
    HANGAR);
    expect(cards.length, 'no cards, so this guard is measuring nothing').toBeGreaterThan(0);
    expect(cards.filter((c) => !c.pic).map((c) => c.name), 'cards with no picture').toEqual([]);
    expect(cards.filter((c) => c.on && c.opaque).map((c) => c.name), 'a fitted card is filled over its picture').toEqual([]);
    await page.context().close();
  });
});
