import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openHangar, shown } from './title.ts';
import { seeded } from './seed.ts';
import { samePhase } from './stand.ts';
import { HANGAR_KEY, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { HUES } from '../src/content/livery.ts';
import { SCREENS } from '../src/state/screens.ts';

/**
 * THE LIVERY IS FREE, IN THE PAGE — `docs/decisions/0529-the-livery-is-free.md`.
 *
 * `tests/livery.test.ts` holds the rule and the key. **What it cannot see is the paint reaching the
 * pictures**: the card on Paint & Parts, and the readout's icon of the ship, which is the atlas the run
 * flies re-baked with the same fit — so a ship painted on the card and flown in the factory's colours is
 * a failure this reads.
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

/** A canvas's picture, as its bytes. */
async function picture(page: Page, selector: string): Promise<string> {
  return page.evaluate((sel) => (document.querySelector(sel) as HTMLCanvasElement | null)?.toDataURL() ?? '', selector);
}

describe.runIf(chromePath)('0529 — a ship painted on Paint & Parts is painted everywhere it is drawn', () => {
  it('the Firebird painted blue: the tone opens with the colour, the card and the readout’s ship both repainted', async () => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const page = await seeded(context, dist, HANGAR_KEY, serialiseHangar({ ...initialHangar, won: { ...initialHangar.won, firebird: true } }));
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openHangar(page);
    const icon = 'canvas.itc-playing-hud-ship';
    const factoryIcon = await picture(page, icon);
    await page.locator(`${shown('hangar')} .${prefixFor('hangar')}tab`, { hasText: SCREENS.parts.heading }).click();
    await page.waitForSelector(shown('parts'), { state: 'attached' });

    const tones = page.locator(`${shown('parts')} [${SETTING_ATTR}="tone"] .${PARTS}option`);
    // 0561: a shut tone is marked `aria-disabled` and stays pressable, so it can be tried on.
    const shut = async (): Promise<boolean[]> => tones.evaluateAll((els) => els.map((el) => el.getAttribute('aria-disabled') === 'true'));
    expect(await shut(), 'a tone is open on the factory’s paint').toEqual([true, true, true]);

    // 0540: the ship on its pad in the port behind the tab, which replaced the card's — `tests/stand.ts`.
    const blue = HUES.findIndex((hue) => hue.name === 'Blue');
    const { noise, change } = await samePhase(page, 'parts', () =>
      page.locator(`${shown('parts')} [${SETTING_ATTR}="livery"] .${PARTS}option >> nth=${1 + blue}`).dispatchEvent('click'),
    );
    const kept = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(kept.livery.firebird, 'the paint was not kept').toEqual({ hue: blue, tone: 1 });
    expect(await shut(), 'the tones did not open with the colour').toEqual([false, false, false]);
    expect(change, `the ship on the pad is still in the factory’s paint: ${change.toFixed(4)} of the stand moved, against ${noise.toFixed(4)} standing still`).toBeGreaterThan(Math.max(3 * noise, 0.002));

    await page.locator(`${shown('parts')} .${PARTS}tab`, { hasText: SCREENS.hangar.heading }).click();
    await page.waitForSelector(shown('hangar'), { state: 'attached' });
    expect(await picture(page, icon), 'the readout’s ship — the atlas a run flies — is still in the factory’s paint').not.toBe(factoryIcon);
    await context.close();
  });
});
