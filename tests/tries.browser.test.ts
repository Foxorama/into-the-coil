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
import { SHIP_KINDS } from '../src/content/ships.ts';

/**
 * THE CURSOR TRIES ON — `docs/decisions/0561-the-cursor-tries-on.md`.
 *
 * Asked: *"seeing how it immediately looks is good, but it shouldn't auto-equip when scrolling menus."*
 * So the cursor stepping a slot puts the option on the ship and fits nothing; a press fits it; leaving
 * the band puts the fitted one back; and a shut option is somewhere the cursor can stand, saying what
 * opens it. Each is asked of the real page through the keys a player presses, and what is fitted is
 * read from the key the game writes — the one thing a try must never touch.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;
const HANGAR = prefixFor('hangar');
const guns = `${shown('hangar')} [${SETTING_ATTR}="gun"]`;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

/** The hangar on the default pilot's Firebird, with every ship but the Thunderbolt won in. */
async function opened(): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const won = Object.fromEntries(SHIP_KINDS.map((kind) => [kind, kind !== 'thunderbolt'])) as typeof initialHangar.won;
  await seedOnce(context, HANGAR_KEY, serialiseHangar({ ...initialHangar, won }));
  const page = await context.newPage();
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  await openHangar(page);
  return page;
}

/** The Firebird's gun as the game has written it — what is fitted, never what is tried on. */
async function fittedGun(page: Page): Promise<string> {
  return hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar).gun.firebird;
}

/** Press a key and let the page answer it. */
async function press(page: Page, key: string, times = 1): Promise<void> {
  for (let i = 0; i < times; i++) {
    await page.keyboard.press(key);
    await page.waitForTimeout(120);
  }
}

describe.runIf(chromePath)('0561 — the cursor tries on, and only a press fits', () => {
  it('steps the gun band without fitting, fits on a press, and puts the fitted one back when the band is left', async () => {
    const page = await opened();
    // The hangar opens on the pilots; down is the gun.
    await press(page, 'ArrowDown');
    expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'down from the pilots did not reach the gun band').toBe('Gun');
    const before = await fittedGun(page);
    expect(before, 'the seed did not leave the Firebird on its own gun').toBe('firebird');

    // A step tries the next gun on: it is ringed, the band says how to fit it, and nothing is written.
    await press(page, 'ArrowRight');
    expect(await page.locator(`${guns} .${HANGAR}option-look`).count(), 'a step did not try a gun on').toBe(1);
    expect(await fittedGun(page), 'a step along the band fitted the gun').toBe(before);
    expect(await page.locator(`${guns} ~ .${HANGAR}band-hint`).textContent(), 'the band did not say how to fit the one tried on').toContain('fits it');

    // Leaving the band puts the fitted one back, and still nothing is written.
    await press(page, 'ArrowDown');
    expect(await page.locator(`${guns} .${HANGAR}option-look`).count(), 'leaving the band kept the try on').toBe(0);
    expect(await fittedGun(page), 'leaving the band fitted the gun').toBe(before);

    // Back up, a step, and a press: that one is fitted.
    await press(page, 'ArrowUp');
    await press(page, 'ArrowRight');
    await press(page, 'Enter');
    expect(await fittedGun(page), 'a press did not fit the gun tried on').toBe('estate');
    await page.context().close();
  });

  it('stands on a shut gun, says what opens it, and refuses a press on it', async () => {
    const page = await opened();
    await press(page, 'ArrowDown');
    // Past every open gun to the Thunderbolt's, which is shut: the cursor stands on it.
    await press(page, 'ArrowRight', SHIP_KINDS.length);
    const tried = page.locator(`${guns} .${HANGAR}option-look`);
    expect(await tried.count(), 'the cursor could not stand on a shut gun').toBe(1);
    expect(await tried.getAttribute('aria-disabled'), 'the gun tried on is not the shut one').toBe('true');
    expect(await page.locator(`${guns} ~ .${HANGAR}band-hint`).textContent(), 'the shut gun did not say what opens it').toContain('Thunderbolt');
    await press(page, 'Enter');
    expect(await fittedGun(page), 'a press fitted a shut gun').toBe('firebird');
    await page.context().close();
  });
});
