import { describe, it, expect, vi, afterAll } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { back, fly, openHangar, shown } from './title.ts';
import { SCREENS, SCREEN_KINDS } from '../src/state/screens.ts';
import { DIFFICULTIES, TUNED } from '../src/content/difficulty.ts';
import { DEFAULT_GOLFER, GOLFERS } from '../src/content/golfers.ts';
import { SIDES } from '../src/content/specials.ts';
import { livesFor, ownSpecial, startingArsenal } from '../src/state/slices/run.ts';

/**
 * THE READOUT STANDS DOWN — `docs/decisions/0539-the-readout-stands-down.md`.
 *
 * Asked for: *"the dashboard display should be down in the shop and hanger section not the top left."*
 * Held in what the player sees: on every tab that stands, the readout is in the stand's dash cell, whole
 * on the display, inside its stand and clear of the plate, at every size the layout guard holds; it
 * counts what the run would open with, not ×0; and it is back in the play strip once a run is flown.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 180_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

/** The layout guard's sizes (tests/layout.browser.test.ts). */
const SIZES = [
  [480, 320],
  [667, 375],
  [812, 375],
  [915, 412],
  [1024, 768],
  [1280, 720],
] as const;

/** The tabs that stand, read off the rows — never listed by name. */
const STANDING = SCREEN_KINDS.filter((s) => SCREENS[s].stand !== null);

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

async function open(width: number, height: number): Promise<Page> {
  browser ??= await launchChromium({ headless: true });
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(dist);
  await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
  await pastIntro(page);
  return page;
}

/** Where the readout is, what it says, and how it stands against the stand, the plate and the display. */
async function readout(page: Page, p: string): Promise<{ parent: string; counts: string[]; inStand: boolean; inFrame: boolean; clearOfPlate: boolean; onDisplay: boolean }> {
  return page.evaluate((prefix: string) => {
    const hud = document.querySelector<HTMLElement>('.itc-playing-hud')!;
    const r = hud.getBoundingClientRect();
    const box = (sel: string): DOMRect | null => document.querySelector(sel)?.getBoundingClientRect() ?? null;
    const stand = box('.' + prefix + 'stand');
    const plate = box('.' + prefix + 'plate');
    const counts = [...hud.querySelectorAll<HTMLElement>('.itc-playing-hud-group > span')].filter((s) => s.offsetParent !== null).map((s) => s.textContent ?? '');
    const within = (b: DOMRect | null): boolean => b !== null && r.left >= b.left - 0.5 && r.right <= b.right + 0.5 && r.top >= b.top - 0.5 && r.bottom <= b.bottom + 0.5;
    const meets = (b: DOMRect | null): boolean => b !== null && r.left < b.right - 0.5 && r.right > b.left + 0.5 && r.top < b.bottom - 0.5 && r.bottom > b.top + 0.5;
    // 0571: and inside its own cockpit monitor's frame, which is the cell it is in — the frame the player sees.
    const cell = hud.parentElement?.getBoundingClientRect() ?? null;
    return {
      parent: hud.parentElement?.className ?? '',
      counts,
      inStand: within(stand),
      inFrame: within(cell),
      // On the narrowest the plate takes the width and the stand stands under it (0539), so it may meet it there.
      clearOfPlate: !meets(plate) || innerWidth <= 620,
      onDisplay: r.left >= -0.5 && r.top >= -0.5 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5 && r.width > 0,
    };
  }, p);
}

describe.runIf(chromePath)('0539 — the readout stands down on the hangar’s tabs', () => {
  it('is in each tab’s dash, whole, in its stand and clear of the plate, at every size', async () => {
    expect(STANDING.length, 'no screen stands, so this guard is measuring nothing').toBeGreaterThan(0);
    for (const [width, height] of SIZES) {
      const page = await open(width, height);
      await openHangar(page);
      for (const screen of STANDING) {
        if ((await page.locator(shown(screen)).count()) === 0) {
          await page.locator(`.${prefixFor('hangar')}shown .${prefixFor('hangar')}tab, .${prefixFor('parts')}shown .${prefixFor('parts')}tab, .${prefixFor('shop')}shown .${prefixFor('shop')}tab`, { hasText: SCREENS[screen].heading }).first().click();
          await page.waitForSelector(shown(screen));
        }
        const at = `${screen} at ${width}x${height}`;
        const seen = await readout(page, prefixFor(screen));
        expect(seen.parent, `${at}: the readout is not in the stand's dash`).toBe(prefixFor(screen) + 'dash');
        expect(seen.onDisplay, `${at}: the dash is off the display`).toBe(true);
        expect(seen.inStand, `${at}: the dash runs out of its stand`).toBe(true);
        expect(seen.inFrame, `${at}: the dash runs out of its cockpit monitor`).toBe(true);
        expect(seen.clearOfPlate, `${at}: the dash runs under the plate`).toBe(true);
      }
      await page.context().close();
    }
  });

  it('counts what the run would open with, and is back in the strip once one is flown', async () => {
    const page = await open(1280, 720);
    await openHangar(page);
    const ship = GOLFERS[DEFAULT_GOLFER].ship;
    const arsenal = startingArsenal(ship, TUNED, ownSpecial(ship));
    const want = ['×' + String(livesFor(TUNED)), ...SIDES.map((side) => '×' + String(arsenal[side].length))];
    expect(DIFFICULTIES[TUNED].lives, 'the tier opens with no lives, so a ×0 would pass').toBeGreaterThan(0);
    expect((await readout(page, prefixFor('hangar'))).counts, 'the dash does not count the opening complement').toEqual(want);
    await back(page, 'hangar');
    await page.waitForSelector(shown('title'), { state: 'attached' });
    await fly(page);
    const parent = await page.evaluate(() => document.querySelector('.itc-playing-hud')?.parentElement?.className ?? '');
    expect(parent, 'the readout did not go back into the play strip for the run').toBe('itc-playing-strip');
    await page.context().close();
  });

  /*
    ⚠️ **0540: THE ROOM TO THE TOP OF THE SCREEN, AND THE BAR BACK OVER THE TITLE.** A desktop keeps a bar
    across the top for the play readout (0500), black, and the frame clipped under it; the hangar's tabs have
    no readout up there, so the room is drawn to the top. The first build left the clip a barred frame had
    set, and the stand stood under a black band. Read off the game's canvas: the top rows over the stand.
  */
  it('0540 — draws the port to the top of a desktop’s screen, and the bar comes back for the title', async () => {
    const page = await open(1280, 720);
    const top = (): Promise<number> =>
      page.evaluate(() => {
        const canvas = document.querySelector<HTMLCanvasElement>('#app canvas')!;
        const k = canvas.width / canvas.getBoundingClientRect().width;
        const row = canvas.getContext('2d')!.getImageData(0, Math.floor(3 * k), Math.floor(canvas.width * 0.35), 1).data;
        let lit = 0;
        for (let i = 0; i < row.length; i += 4) if (row[i]! + row[i + 1]! + row[i + 2]! > 30) lit++;
        return lit / (row.length / 4);
      });
    await page.waitForTimeout(300);
    expect(await top(), 'the title has no bar to come back to, so this measures nothing').toBeLessThan(0.05);
    await openHangar(page);
    await page.waitForTimeout(300);
    expect(await top(), 'a black band stands over the room at the top of the hangar').toBeGreaterThan(0.9);
    await back(page, 'hangar');
    await page.waitForSelector(shown('title'), { state: 'attached' });
    await page.waitForTimeout(300);
    expect(await top(), 'the bar did not come back over the title').toBeLessThan(0.05);
    await page.context().close();
  });
});
