import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openSettings, shown } from './title.ts';
import { SCREENS } from '../src/state/screens.ts';
import { PICKUPS, PICKUP_KINDS, faceOf } from '../src/content/pickups.ts';
import { SIDES, SPECIALS, SPECIAL_KINDS } from '../src/content/specials.ts';

/**
 * THE KEY OPENS, IN THE PAGE — `docs/decisions/0580-the-key-opens.md`.
 *
 * `tests/key-opens.test.ts` holds what a sheet says. **What it cannot see is the press**: whether every face
 * on How to play is something a pointer and the keys can press, whether the sheet it opens is the one for
 * that face and stands whole on the glass, and whether it goes again and gives the cursor back.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;
const GUIDE = prefixFor('guide');
/** Every face, in the key's order — a pickup's faces in its row's order. */
const FACES = PICKUP_KINDS.flatMap((kind) => PICKUPS[kind].faces.map((_, face) => faceOf(kind, face).label));

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
  await openSettings(page);
  await page.locator(`${shown('settings')} .${prefixFor('settings')}tab`, { hasText: SCREENS.guide.heading }).click();
  await page.waitForSelector(shown('guide'), { state: 'attached' });
  return page;
}

describe.runIf(chromePath)('0580 — every face on How to play opens what it is', () => {
  it('opens each face’s own sheet, whole on the glass, and puts it away, at a desktop and a phone', async () => {
    for (const [width, height] of [
      [1280, 720],
      [480, 320],
    ] as const) {
      const page = await opened(width, height);
      const at = `at ${width}x${height}`;
      const faces = page.locator(`${shown('guide')} .${GUIDE}key-face`);
      expect(await faces.count(), `${at}: not a button a face`).toBe(FACES.length);
      for (const [i, name] of FACES.entries()) {
        await faces.nth(i).click();
        const sheet = page.locator(`.${GUIDE}ask`);
        expect(await page.locator(`.${GUIDE}ask-title`).innerText(), `${at}: face ${i} opened another face's sheet`).toBe(name);
        const card = (await page.locator(`.${GUIDE}ask-card`).boundingBox())!;
        expect(card.y >= 0 && card.y + card.height <= height && card.x >= 0 && card.x + card.width <= width, `${at}: ${name}'s sheet runs off the screen`).toBe(true);
        // Put away by Escape, as by Back and B.
        await page.keyboard.press('Escape');
        expect(await sheet.count(), `${at}: Escape left ${name}'s sheet up`).toBe(0);
        expect(await page.locator(shown('guide')).count(), `${at}: Escape left How to play with the sheet`).toBe(1);
      }
      await page.context().close();
    }
  });

  it('walks the keys onto the faces, opens one, names the key that throws it, and gives the cursor back', async () => {
    const page = await opened(1280, 720);
    const ring = `.${GUIDE}action-cursor`;
    // Down from the tabs, onto one of the first pickup's faces — the one standing nearest under the tab.
    await page.keyboard.press('ArrowDown');
    const label = (await page.locator(`${ring}.${GUIDE}key-face`).getAttribute('aria-label')) ?? '';
    const name = label.split(' — ')[0]!;
    const first = PICKUPS[PICKUP_KINDS[0]!].faces.map((_, face) => faceOf(PICKUP_KINDS[0]!, face).label);
    expect(first, 'down from the tabs did not land on the first pickup’s faces').toContain(name);
    await page.keyboard.press('Enter');
    expect(await page.locator(`.${GUIDE}ask-title`).innerText(), 'Enter opened another face’s sheet').toBe(name);
    // A gun special, thrown on the keyboard by the key How to play's controls give its trigger.
    const terms = await page.locator(`.${GUIDE}ask-term`).allInnerTexts();
    const values = await page.locator(`.${GUIDE}ask-value`).allInnerTexts();
    expect(terms, 'the sheet does not say what throws it').toContain('Throw it');
    const special = SPECIAL_KINDS.find((k) => SPECIALS[k].label === name)!;
    // The controls' cells run a row a thing the hand does — fly, then each trigger — three devices a row.
    const keyboard = await page.locator(`.${GUIDE}controls-how`).allInnerTexts();
    expect(values[terms.indexOf('Throw it')], 'the sheet names another key than the controls do').toBe(keyboard[3 * (1 + SIDES.indexOf(SPECIALS[special].side))]);
    // And the one button on it, pressed, puts it away with the cursor back on the face.
    expect(await page.locator(`${ring}`).innerText(), 'the cursor is not on the sheet’s button').toBe('Got it');
    await page.keyboard.press('Enter');
    expect(await page.locator(`.${GUIDE}ask`).count(), 'its button left the sheet up').toBe(0);
    expect(await page.locator(`${ring}.${GUIDE}key-face`).getAttribute('aria-label'), 'the cursor did not come back to the face').toBe(label);
    await page.context().close();
  });
});
