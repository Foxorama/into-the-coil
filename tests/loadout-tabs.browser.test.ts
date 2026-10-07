import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { SETTING_ATTR, prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openHangar, shown } from './title.ts';
import { SCREENS } from '../src/state/screens.ts';

/**
 * THE LOADOUT HAS TABS, IN THE PAGE — `docs/decisions/0579-the-loadout-has-tabs.md`.
 *
 * `tests/loadout-tabs.test.ts` holds the table. **What it cannot see is the plate**: whether one group is
 * drawn and the other put away, whether every tab is on the plate at a phone's size, and whether a pad or
 * the keys reach the group behind the other tab. Asked in what the player sees — boxes drawn on the glass,
 * and where the cursor's ring is.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 120_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;
const HANGAR = prefixFor('hangar');
const GROUPS = SCREENS.hangar.stand!.groups;

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
  await openHangar(page);
  return page;
}

/** The slot bands drawn on the plate now, by the name they choose — a band put away has no box. */
async function drawn(page: Page): Promise<string[]> {
  return page.locator(`${shown('hangar')} .${HANGAR}group [${SETTING_ATTR}]`).evaluateAll((els, attr) =>
    els.filter((el) => el.getClientRects().length > 0 && el.getBoundingClientRect().height > 0).map((el) => el.getAttribute(attr) ?? ''),
  SETTING_ATTR);
}

describe.runIf(chromePath)('0579 — Hangin’ Out shows one group at a time, behind its tabs', () => {
  it('draws every tab on the plate and only the group whose tab is lit, at a desktop and two phones', async () => {
    for (const [width, height] of [
      [1280, 720],
      [667, 375],
      [480, 320],
    ] as const) {
      const page = await opened(width, height);
      const at = `at ${width}x${height}`;
      const plate = (await page.locator(`${shown('hangar')} .${HANGAR}plate`).boundingBox())!;
      const tabs = page.locator(`${shown('hangar')} [${SETTING_ATTR}="section"] .${HANGAR}option`);
      expect(await tabs.count(), `${at}: not a tab a group`).toBe(GROUPS.length);
      for (const [i, group] of GROUPS.entries()) {
        const box = await tabs.nth(i).boundingBox();
        expect(box !== null && box.width > 0, `${at}: the ${group.label} tab is not drawn`).toBe(true);
        expect(box!.x >= plate.x - 1 && box!.x + box!.width <= plate.x + plate.width + 1, `${at}: the ${group.label} tab runs off the plate`).toBe(true);
        expect((await tabs.nth(i).innerText()).trim(), `${at}: the tab does not say its group`).toBe(group.label);
      }
      for (const [i, group] of GROUPS.entries()) {
        await tabs.nth(i).click();
        expect((await drawn(page)).sort(), `${at}: under ${group.label} the plate draws another group's bands`).toEqual([...group.bands].sort());
        expect(await tabs.nth(i).getAttribute('aria-pressed'), `${at}: the ${group.label} tab is not lit`).toBe('true');
      }
      await page.context().close();
    }
  });

  it('walks the keys from the pilots onto the tabs, across to the Cockpit, and down into it', async () => {
    const page = await opened(1280, 720);
    const ring = (): Promise<string | null> => page.locator(`${shown('hangar')} .${HANGAR}action-cursor [${SETTING_ATTR}]`).first().getAttribute(SETTING_ATTR);
    await page.keyboard.press('ArrowDown');
    expect(await ring(), 'down from the pilots did not land on the tabs').toBe('section');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    const cockpit = GROUPS.find((g) => g.label === 'Cockpit')!;
    expect((await drawn(page)).sort(), 'a step along the tabs did not bring the Cockpit into view').toEqual([...cockpit.bands].sort());
    await page.keyboard.press('ArrowDown');
    expect(await ring(), 'down from the tabs did not land on the Cockpit’s first band').toBe(cockpit.bands[0]);
    await page.context().close();
  });
});
