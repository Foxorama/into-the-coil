import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openHangar, shown } from './title.ts';
import { seedOnce } from './seed.ts';
import { HANGAR_KEY, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { SHIP_KINDS } from '../src/content/ships.ts';
import { HUES } from '../src/content/livery.ts';
import { SCREENS } from '../src/state/screens.ts';

/**
 * PAINT & PARTS IN PICTURES — `docs/decisions/0565-paint-in-swatches.md`.
 *
 * The review: *"Colour and tone are swatches, not words"* — *Factory* was one word across the plate — and
 * the tone row was two dim arrows round nothing on the factory's paint. Asked in what the player sees: each
 * paint is drawn in a colour of its own, the tone is not drawn until there is a colour to tone, and the
 * wheels carry a picture of the ship wearing them.
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

async function openParts(): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const won = Object.fromEntries(SHIP_KINDS.map((kind) => [kind, true])) as typeof initialHangar.won;
  await seedOnce(context, HANGAR_KEY, serialiseHangar({ ...initialHangar, won }));
  const page = await context.newPage();
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  await openHangar(page);
  await page.locator(`${shown('hangar')} .${prefixFor('hangar')}tab`, { hasText: SCREENS.parts.heading }).click();
  await page.waitForSelector(shown('parts'), { state: 'attached' });
  return page;
}

const band = (name: string): string => `${shown('parts')} [${SETTING_ATTR}="${name}"]`;

describe.runIf(chromePath)('0565 — Paint & Parts is drawn in pictures', () => {
  it('draws every paint in a colour of its own, hides the tone on the factory’s paint, and pictures the wheels', async () => {
    const page = await openParts();
    // Every hue's swatch is drawn, each in a different colour: thirteen backgrounds, all distinct.
    const paints = await page.locator(`${band('livery')} .${PARTS}option`).evaluateAll((els) =>
      els.map((el) => {
        const style = getComputedStyle(el);
        return { width: el.getBoundingClientRect().width, paint: style.backgroundImage !== 'none' ? style.backgroundImage : style.backgroundColor };
      }),
    );
    expect(paints.length, 'the colour band does not offer the factory and every hue').toBe(1 + HUES.length);
    expect(paints.every((p) => p.width > 0), 'a paint is not drawn').toBe(true);
    expect(new Set(paints.map((p) => p.paint)).size, 'two paints are drawn in the same colour').toBe(paints.length);
    // On the factory's paint there is no tone to choose, and none is drawn.
    expect(await page.locator(band('tone')).evaluate((el) => el.closest('[role="group"]')!.getBoundingClientRect().height), 'the tone is drawn on the factory’s paint').toBe(0);
    // A hue fitted, and the tone is there to choose.
    await page.locator(`${band('livery')} .${PARTS}option >> nth=3`).click();
    expect(await page.locator(band('tone')).evaluate((el) => el.closest('[role="group"]')!.getBoundingClientRect().height), 'a painted ship’s tone is not drawn').toBeGreaterThan(0);
    // The Firebird's wheels each with a picture beside the name.
    const pictured = await page.locator(`${band('rim')} .${PARTS}option`).evaluateAll((els) => els.map((el) => el.querySelector('canvas')?.getBoundingClientRect().width ?? 0));
    expect(pictured.every((w) => w > 0), 'a wheel has no picture of the ship wearing it').toBe(true);
    await page.context().close();
  });
});
