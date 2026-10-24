import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { EVERY_TIER_FINISHED, choose, flownTo, shown } from './title.ts';
import { seeded } from './seed.ts';
import { HANGAR_KEY } from '../src/save/hangar.ts';
import { GOLFER_KINDS } from '../src/content/golfers.ts';

/**
 * VENOMA FLIES STRAIGHT INTO THE RUN — `docs/decisions/0666-venoma-flies-the-viper.md`.
 *
 * The intro is a pilot chasing the Viper out of the port, and she is the Viper's pilot: on the built page, with every
 * tier finished, *Fly* with her chosen shows the run and never the intro's Skip; with anyone else it still plays.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

/** The title, on a store with every tier finished, `pilot` chosen. */
async function titled(pilot: (typeof GOLFER_KINDS)[number]): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await seeded(context, dist, HANGAR_KEY, EVERY_TIER_FINISHED);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  await choose(page, 'pilot', GOLFER_KINDS.indexOf(pilot));
  await page.waitForSelector(shown('title'), { state: 'attached' });
  return page;
}

describe.runIf(chromePath)('0666 — Venoma', () => {
  it('flies her straight into the run, with no intro, once every tier is finished', async () => {
    const page = await titled('venoma');
    expect(await flownTo(page), 'Fly played her the intro, in which someone chases her out of the port').toBe('run');
    await page.context().close();
  });

  it('and plays the intro for every pilot it is told round', async () => {
    const page = await titled(GOLFER_KINDS[0]);
    expect(await flownTo(page), 'the intro stopped playing').toBe('intro');
    await page.context().close();
  });
});
