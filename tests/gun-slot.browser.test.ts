import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { back, fly, openHangar, shown } from './title.ts';
import { seeded } from './seed.ts';
import { HANGAR_KEY, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { GOLFERS, GOLFER_KINDS } from '../src/content/golfers.ts';
import { SHIPS, SHIP_KINDS } from '../src/content/ships.ts';
import { WEAPONS } from '../src/content/weapons.ts';

/**
 * THE GUN IS FITTED, IN THE PAGE — `docs/decisions/0526-the-gun-is-fitted.md`.
 *
 * `tests/gun-slot.test.ts` holds the rule and the run's gun. **What it cannot see is the shell passing
 * the fitting to the run** — the one line in `src/app/mount.ts` between the hangar and
 * `lifecycle.begin`. The readout says the gun with the lives — *"3 lives, Arc"* — because the ship's
 * icon is hidden from a reader, and that is what this reads, beside the pilot card the hangar shows.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

describe.runIf(chromePath)('0526 — a run flies the gun the hangar fitted', () => {
  it('the estate’s arc fitted to the fighter, both won in: the card says it, and the run flies it', async () => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const page = await seeded(context, dist, HANGAR_KEY, serialiseHangar({ ...initialHangar, won: { ...initialHangar.won, fighter: true, estate: true } }));
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openHangar(page);

    const hook = GOLFER_KINDS.find((kind) => GOLFERS[kind].ship === 'fighter')!;
    const hangar = prefixFor('hangar');
    const arc = WEAPONS[SHIPS.estate.weapon];
    await page.locator(`${shown('hangar')} [${SETTING_ATTR}="pilot"] .${hangar}option >> nth=${GOLFER_KINDS.indexOf(hook)}`).click();
    await page.locator(`${shown('hangar')} [${SETTING_ATTR}="gun"] .${hangar}option >> nth=${SHIP_KINDS.indexOf('estate')}`).click();
    const card = await page.locator(`${shown('hangar')} .${hangar}pilot-gun`).textContent();
    expect(card, 'the hangar’s card does not name the gun fitted').toContain(arc.label);
    await back(page, 'hangar');
    await fly(page);

    const said = await page.evaluate(() => [...document.querySelectorAll('.itc-playing-hud [aria-label]')].map((e) => e.getAttribute('aria-label') ?? ''));
    expect(said.join(' | '), 'the run did not fly the gun fitted in the hangar').toContain('lives, ' + arc.label);
    expect(said.join(' | '), 'the run flew the ship’s own gun').not.toContain('lives, ' + WEAPONS[SHIPS.fighter.weapon].label);
    await context.close();
  });
});
