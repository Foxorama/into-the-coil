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
import { SHIP_KINDS } from '../src/content/ships.ts';
import { SPECIALS } from '../src/content/specials.ts';

/**
 * THE SPECIAL IS FITTED, IN THE PAGE — `docs/decisions/0524-the-special-is-fitted.md`.
 *
 * `tests/special-slot.test.ts` holds the rule and the run's opening. **What it cannot see is the shell
 * passing the fitting to the run** — the one line in `src/app/mount.ts` between the hangar and
 * `lifecycle.begin`. The readout says each stack aloud — *"2 charges, next Storm"* — and that is what a
 * player is holding, so it is what this reads.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

describe.runIf(chromePath)('0524 — a run opens on the special the hangar fitted', () => {
  it('the Thunderbolt’s storm fitted to the fighter, both won in, and the run holds two storms', async () => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    // The storm rides the lightning gun, the Thunderbolt's since 0545.
    const page = await seeded(context, dist, HANGAR_KEY, serialiseHangar({ ...initialHangar, won: { ...initialHangar.won, fighter: true, thunderbolt: true } }));
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openHangar(page);

    const hook = GOLFER_KINDS.find((kind) => GOLFERS[kind].ship === 'fighter')!;
    const hangar = prefixFor('hangar');
    await page.locator(`${shown('hangar')} [${SETTING_ATTR}="pilot"] .${hangar}option >> nth=${GOLFER_KINDS.indexOf(hook)}`).click();
    await page.locator(`${shown('hangar')} [${SETTING_ATTR}="special"] .${hangar}option >> nth=${SHIP_KINDS.indexOf('thunderbolt')}`).click();
    await back(page, 'hangar');
    await fly(page);

    const said = await page.evaluate(() => [...document.querySelectorAll('.itc-playing-hud [aria-label]')].map((e) => e.getAttribute('aria-label') ?? ''));
    expect(said.join(' | '), 'the run did not open on the special fitted in the hangar').toContain('2 charges, next ' + SPECIALS.storm.label);
    expect(said.join(' | '), 'the run opened on the ship’s own special as well').not.toContain('next ' + SPECIALS.bomb.label);
    await context.close();
  });
});
