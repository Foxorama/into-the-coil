import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { inView, openHangar, shown } from './title.ts';
import { seeded } from './seed.ts';
import { samePhase } from './stand.ts';
import { HANGAR_KEY, hangarFrom, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar } from '../src/state/slices/hangar.ts';
import { RACK_KINDS } from '../src/content/racks.ts';

/**
 * THE PAD WEARS ITS TUBES, IN THE PAGE — `docs/decisions/0582-the-pad-wears-its-tubes.md`.
 *
 * `tests/pad-tubes.test.ts` holds the painting. **What it cannot see is the pad baked again** when a rack is
 * fitted on Hangin' Out — the shell's `sameFit`, which said a rack changed nothing about the picture until
 * the fit carried it. Read as the stand's colours against what the stand moves standing still, on 0528's
 * terms (`tests/stand.ts`).
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

describe.runIf(chromePath)('0582 — the tubes fitted are on the ship on the pad', () => {
  it('fits one of each on Hangin’ Out, and the ship on the pad changes as it does', async () => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const owned = { ...initialHangar.owned, straightTube: true, homingTube: true };
    const page = await seeded(context, dist, HANGAR_KEY, serialiseHangar({ ...initialHangar, owned }));
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    await openHangar(page);
    await inView(page, 'hangar', 'rack');
    const { noise, change } = await samePhase(page, 'hangar', () =>
      page.locator(`${shown('hangar')} [${SETTING_ATTR}="rack"] .${prefixFor('hangar')}option >> nth=${RACK_KINDS.indexOf('mixed')}`).dispatchEvent('click'),
    );
    const kept = hangarFrom(await page.evaluate((key) => localStorage.getItem(key), HANGAR_KEY), initialHangar);
    expect(Object.values(kept.rack), 'one of each was not fitted').toContain('mixed');
    expect(change, `the ship on the pad is still bare: ${change.toFixed(4)} of the stand moved, against ${noise.toFixed(4)} standing still`).toBeGreaterThan(Math.max(3 * noise, 0.002));
    await context.close();
  });
});
