import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openHangar, shown } from './title.ts';
import { seedOnce } from './seed.ts';
import { samePhase } from './stand.ts';
import { HANGAR_KEY, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { GOLFERS, GOLFER_KINDS } from '../src/content/golfers.ts';
import { SHIPS, SHIP_KINDS } from '../src/content/ships.ts';
import { FLAME_KINDS } from '../src/content/flames.ts';
import { HUES } from '../src/content/livery.ts';
import { SCREENS } from '../src/state/screens.ts';

/**
 * EVERY LOOK ON THE PAD — `docs/decisions/0541-the-looks-are-on-the-pad.md`.
 *
 * The pad is the preview since 0540, and `scripts/shot-pad.mjs` photographs every look on it. What the
 * pictures found, held here in the page: a flame chosen that never reached the pad, and the saucer's side
 * view, which wore the factory's paint and plain glass whatever was fitted. Each is read off the stand at
 * the same point of the ship's bob (`tests/stand.ts`), against the stand standing still.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 180_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;
const PARTS = prefixFor('parts');
const band = (setting: string): string => `${shown('parts')} [${SETTING_ATTR}="${setting}"] .${PARTS}option`;

/**
 * The least share of the stand a look must move — a flame idling under a ship is a few hundred pixels of
 * a stand a third of a million, measured, and the stand standing still a bob apart moves none.
 */
const FLOOR = 0.0002;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

/** Paint & Parts, with every ship won in and the thrusters bought, so every look is open. */
async function openParts(): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const won = Object.fromEntries(SHIP_KINDS.map((kind) => [kind, true])) as typeof initialHangar.won;
  await seedOnce(context, HANGAR_KEY, serialiseHangar({ ...initialHangar, won, owned: { ...initialHangar.owned, ion: true } }));
  const page = await context.newPage();
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  await openHangar(page);
  await page.locator(`${shown('hangar')} .${prefixFor('hangar')}tab`, { hasText: SCREENS.parts.heading }).click();
  await page.waitForSelector(shown('parts'), { state: 'attached' });
  return page;
}

describe.runIf(chromePath)('0541 — every look reaches the ship on the pad', () => {
  it('burns the flame chosen, on the pad, as it is chosen', async () => {
    const page = await openParts();
    const { noise, change } = await samePhase(page, 'parts', () => page.locator(`${band('flame')} >> nth=${FLAME_KINDS.indexOf('ion')}`).dispatchEvent('click'));
    expect(change, `the pad still burns the flame it had: ${change.toFixed(5)} of the stand moved, against ${noise.toFixed(5)} standing still`).toBeGreaterThan(Math.max(3 * noise, FLOOR));
    await page.context().close();
  });

  it('paints the saucer, and puts its look on its dome, on the pad', async () => {
    const page = await openParts();
    const caddie = GOLFER_KINDS.find((kind) => GOLFERS[kind].ship === 'caddie')!;
    await page.locator(`${band('pilot')} >> nth=${GOLFER_KINDS.indexOf(caddie)}`).click();
    const red = HUES.findIndex((hue) => hue.name === 'Red');
    const paint = await samePhase(page, 'parts', () => page.locator(`${band('livery')} >> nth=${1 + red}`).dispatchEvent('click'));
    expect(paint.change, `the saucer on the pad is still in the factory's paint: ${paint.change.toFixed(5)} against ${paint.noise.toFixed(5)}`).toBeGreaterThan(Math.max(3 * paint.noise, FLOOR));
    const visor = await samePhase(page, 'parts', () => page.locator(`${band('art')} >> nth=${SHIPS.caddie.arts.indexOf('visor')}`).dispatchEvent('click'));
    expect(visor.change, `the saucer's dome is still plain glass: ${visor.change.toFixed(5)} against ${visor.noise.toFixed(5)}`).toBeGreaterThan(Math.max(3 * visor.noise, FLOOR));
    await page.context().close();
  });
});
