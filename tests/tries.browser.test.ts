import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openHangar, shown } from './title.ts';
import { seeded } from './seed.ts';
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
  const page = await seeded(context, dist, HANGAR_KEY, serialiseHangar({ ...initialHangar, won }));
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
    // The hangar opens on the pilots; down is the sub-tabs (0579), and down again the gun.
    await press(page, 'ArrowDown');
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

  it('0657 — a shut gun is off the band: not drawn, never stepped onto, and the way round is what is open', async () => {
    /*
      *"Locked items should be hidden on every equippable screen."* 0561 let the cursor stand on a shut gun to read
      what opens it; the player asked for it gone. The Thunderbolt is not won, so its gun is shut on the Firebird.
    */
    const page = await opened();
    // 0579: past the sub-tabs to the gun.
    await press(page, 'ArrowDown');
    await press(page, 'ArrowDown');
    const options = page.locator(`${guns} .${HANGAR}option`);
    expect(await options.nth(SHIP_KINDS.indexOf('thunderbolt')).isHidden(), 'the Thunderbolt’s gun, shut, is drawn on the band').toBe(true);
    const drawn = await options.evaluateAll((all) => all.filter((o) => !(o as HTMLElement).hidden).length);
    expect(drawn, 'no gun but the fitted one is drawn, so this asks nothing of a step').toBeGreaterThan(1);
    // Round the band once: every step lands on a drawn gun, and as many steps as there are drawn guns come home.
    for (let step = 1; step < drawn; step++) {
      await press(page, 'ArrowRight');
      const tried = page.locator(`${guns} .${HANGAR}option-look`);
      expect(await tried.count(), `step ${String(step)} tried nothing on`).toBe(1);
      expect(await tried.isHidden(), `step ${String(step)} stood on a gun the band does not draw`).toBe(false);
    }
    await press(page, 'ArrowRight');
    expect(await page.locator(`${guns} .${HANGAR}option-look`).count(), 'the drawn guns did not come round to the fitted one').toBe(0);
    expect(await fittedGun(page), 'a step fitted a gun').toBe('firebird');
    await page.context().close();
  });
});
