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
import { RACK_KINDS } from '../src/content/racks.ts';
import { MISSILES } from '../src/content/missiles.ts';

/**
 * THE TUBES ARE SOLD, IN THE PAGE — `docs/decisions/0578-the-tubes-are-sold.md`.
 *
 * `tests/tube-shop.test.ts` holds the trade, the rack and the run's opening. **What it cannot see is the
 * shell handing the rack to the run** — the line in `src/app/mount.ts` between the hangar and
 * `lifecycle.begin`. The lives counter says the ship's gun and its tubes aloud, and that is what is read.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

describe.runIf(chromePath)('0578 — a run opens on the tubes the hangar fitted', () => {
  it('one of each fitted to the fighter on Hangin’ Out, and the run carries a missile tube and a seeker tube', async () => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const owned = { ...initialHangar.owned, straightTube: true, homingTube: true };
    const page = await seeded(context, dist, HANGAR_KEY, serialiseHangar({ ...initialHangar, owned }));
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openHangar(page);

    // 0579: the tubes are fitted on Hangin' Out, under *Loadout* beside the gun and the special.
    const hook = GOLFER_KINDS.find((kind) => GOLFERS[kind].ship === 'fighter')!;
    const hangar = prefixFor('hangar');
    await page.locator(`${shown('hangar')} [${SETTING_ATTR}="pilot"] .${hangar}option >> nth=${GOLFER_KINDS.indexOf(hook)}`).click();
    await page.locator(`${shown('hangar')} [${SETTING_ATTR}="rack"] .${hangar}option >> nth=${RACK_KINDS.indexOf('mixed')}`).click();
    await back(page, 'hangar');
    await fly(page);

    const lives = (await page.getAttribute('.itc-playing-hud-group[aria-label*="lives"]', 'aria-label')) ?? '';
    expect(lives, 'the run did not open on the tubes fitted in the hangar').toContain(MISSILES.straight.label + ' and ' + MISSILES.homing.label);
    await context.close();
  });

  it('and a ship with no rack fitted opens with no tubes at all', async () => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const page = await seeded(context, dist, HANGAR_KEY, serialiseHangar(initialHangar));
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await fly(page);
    const lives = (await page.getAttribute('.itc-playing-hud-group[aria-label*="lives"]', 'aria-label')) ?? '';
    expect(lives, 'the readout says nothing, so this proves nothing').toContain('lives');
    expect(lives, 'a bare ship opened on a tube').not.toContain(MISSILES.straight.label);
    expect(lives, 'a bare ship opened on a tube').not.toContain(MISSILES.homing.label);
    await context.close();
  });
});
