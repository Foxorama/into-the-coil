import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { shown } from './title.ts';
import { seeded } from './seed.ts';
import { GOLFERS, GOLFER_KINDS, HIDDEN_NAME, pilotOpen } from '../src/content/golfers.ts';
import { HANGAR_KEY, serialiseHangar } from '../src/save/hangar.ts';
import { initialHangar, pilotRecord } from '../src/state/slices/hangar.ts';

/**
 * A SHUT PILOT IS UNNAMED, SEEN — `docs/decisions/0684-a-shut-pilot-is-unnamed.md`.
 *
 * `tests/marmot.test.ts` holds the band's sentence. What it cannot see is the card: that under a shut
 * face the title says `?????` and not who, that the tooltip and the reader's label say the same, that the
 * open four say their names — and that a lock met while the page is open brings the name with it, since
 * the chrome writes the name with the lock (`setOpen`), never once at build.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

async function open(seed: string | null = null): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  let page: Page;
  if (seed === null) {
    page = await context.newPage();
    await page.goto(dist);
  } else page = await seeded(context, dist, HANGAR_KEY, seed);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  await page.waitForSelector(shown('title'), { state: 'attached' });
  return page;
}

/** Each face on the title's band: the name under it, its tooltip and its label for the reader. */
async function faces(page: Page): Promise<{ under: string; tip: string; label: string }[]> {
  return page.locator(`${shown('title')} [${SETTING_ATTR}="pilot"] .${prefixFor('title')}option`).evaluateAll((buttons) =>
    buttons.map((button) => ({
      under: button.lastElementChild?.textContent ?? '',
      tip: (button as HTMLButtonElement).title,
      label: button.getAttribute('aria-label') ?? '',
    })),
  );
}

describe.runIf(chromePath)('0684 — a shut pilot is unnamed', () => {
  it('THE ASK: under a shut face the title says ?????, and so do its tooltip and its label; an open one says who', async () => {
    const page = await open();
    const record = pilotRecord(initialHangar);
    const seen = await faces(page);
    expect(seen.length).toBe(GOLFER_KINDS.length);
    GOLFER_KINDS.forEach((kind, i) => {
      const face = seen[i]!;
      if (pilotOpen(kind, record)) {
        expect(face.under, `${kind}'s card does not say who they are`).toBe(GOLFERS[kind].goesBy);
        expect(face.tip, `${kind}'s tooltip does not say who they are`).toBe(GOLFERS[kind].name);
        expect(face.label, `${kind}'s label does not say who they are`).toBe(GOLFERS[kind].name);
      } else {
        expect(face.under, `${kind} is named under a shut face`).toBe(HIDDEN_NAME);
        expect(face.tip, `${kind} is named in a shut face's tooltip`).toBe(HIDDEN_NAME);
        expect(face.label, `${kind} is named in a shut face's label`).toBe(HIDDEN_NAME);
      }
    });
    // Someone is shut on a first visit, or the guard above held nothing.
    expect(GOLFER_KINDS.some((kind) => !pilotOpen(kind, record)), 'every pilot is open on a first visit').toBe(true);
    await page.context().close();
  });

  it('a lock met opens the name with the face: the crashes counted open Unity by name', async () => {
    const page = await open(serialiseHangar({ ...initialHangar, crashes: GOLFERS.unity.opens.crashes }));
    const seen = await faces(page);
    const unity = seen[GOLFER_KINDS.indexOf('unity')]!;
    expect(unity.under, 'Unity is still ????? with their lock met').toBe(GOLFERS.unity.goesBy);
    expect(unity.label).toBe(GOLFERS.unity.name);
    const mmxxvi = seen[GOLFER_KINDS.indexOf('mmxxvi')]!;
    expect(mmxxvi.under, 'MMXXVI is named with their lock not met').toBe(HIDDEN_NAME);
    await page.context().close();
  });
});
