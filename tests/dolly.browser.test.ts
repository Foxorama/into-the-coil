import { describe, it, expect, vi, afterAll } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openHangar, shown } from './title.ts';
import { DOCK, DOLLY_STEPS, HANGAR_SCALE, PORT_EXTENT } from '../src/content/port.ts';
import { DEFAULT_GOLFER, GOLFERS } from '../src/content/golfers.ts';
import { SHIPS } from '../src/content/ships.ts';
import { SCREENS, SCREEN_KINDS, type Screen } from '../src/state/screens.ts';

/**
 * A STAND PER TAB, AND THE DOLLY — `docs/decisions/0678-a-stand-per-tab.md`.
 *
 * `tests/stand.test.ts` holds that the three tabs' cameras are three. **What it cannot see is the picture**: whether
 * the camera on Paint & Parts is close enough that what is fitted there reads, and whether a change of tab moves the
 * room or cuts it. Held in what the player sees, in CSS pixels at a laptop's 1280x720: the default pilot's tyre on
 * each tab, read off a shopfront door as a ruler (the alcove's width, drawn down by `DOCK.shopScale`); and Cosmo's
 * door, stepped a frame at a time through a change of tab, standing between where it was and where it goes.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 180_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

/**
 * The least a tyre on Paint & Parts may be across at 1280x720 — the plan's sixty pixels, which a rim reads at.
 * 0687: forty-four, the camera a step closer than the hangar's (1.4) and no more, on the play that found 0678's
 * close-up stood in the workshop: still half as big again as the hangar's thirty-eight.
 */
const TYRE_PX = 44;

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

/** A world unit in CSS pixels on `screen`'s stand, off a shown shopfront door, read at its own shop's size (0681). */
async function unitOn(page: Page, screen: Screen): Promise<number> {
  const wide = Object.fromEntries(
    SCREEN_KINDS.flatMap((s) => {
      const kind = SCREENS[s].stand?.keeper ?? null;
      return kind === null ? [] : [[SCREENS[s].heading, PORT_EXTENT.alcove * DOCK.shopGrow[kind]]];
    }),
  );
  return page.evaluate(
    ({ prefix, wide }: { prefix: string; wide: Record<string, number> }) => {
      const door = [...document.querySelectorAll<HTMLElement>('.' + prefix + 'shop-door')].find((d) => !d.hidden && wide[d.getAttribute('aria-label') ?? ''] !== undefined);
      return door === undefined ? 0 : door.getBoundingClientRect().width / wide[door.getAttribute('aria-label')!]!;
    },
    { prefix: prefixFor(screen), wide },
  );
}

/**
 * Where Cosmo's door stands across `screen`'s stand, its left edge in CSS pixels from the stand's — from the stand's,
 * because a screen shown slides in, and the page's own left would read that slide as the room moving.
 */
async function cosmoDoor(page: Page, screen: Screen): Promise<number> {
  return page.evaluate(
    ({ prefix, label }: { prefix: string; label: string }) => {
      const door = [...document.querySelectorAll<HTMLElement>('.' + prefix + 'shop-door')].find((d) => d.getAttribute('aria-label') === label)!;
      return door.getBoundingClientRect().left - door.parentElement!.getBoundingClientRect().left;
    },
    { prefix: prefixFor(screen), label: SCREENS.shop.heading },
  );
}

async function toTab(page: Page, from: Screen, to: Screen): Promise<void> {
  await page.locator(`${shown(from)} .${prefixFor(from)}tab`, { hasText: SCREENS[to].heading }).dispatchEvent('click');
  await page.waitForSelector(shown(to), { state: 'attached' });
}

describe.runIf(chromePath)('0678 — each tab stands somewhere, and the stand dollies between them', () => {
  it('stands Paint & Parts close enough that a tyre is sixty pixels across at 1280x720', async () => {
    const page = await open(1280, 720);
    await openHangar(page);
    const ship = SHIPS[GOLFERS[DEFAULT_GOLFER].ship];
    expect(ship.wheels, 'the default pilot flies no car, so there is no tyre to read').not.toBeNull();
    // The tyre's diameter in world units on the pad, where the stand draws the ship a size up (`DOCK.shipGrow`).
    const tyre = 2 * ship.wheels!.radius * HANGAR_SCALE * ship.intro.hangar * DOCK.shipGrow;
    const seen: string[] = [];
    let parts = 0;
    for (const [from, to] of [
      ['hangar', 'hangar'],
      ['hangar', 'parts'],
      ['parts', 'shop'],
    ] as const) {
      if (from !== to) await toTab(page, from, to);
      // Past the dolly, with the real clock's frames to spare.
      await page.waitForTimeout(600);
      const px = tyre * (await unitOn(page, to));
      seen.push(`${to} ${px.toFixed(0)} px`);
      if (to === 'parts') parts = px;
    }
    expect(parts, `a tyre on Paint & Parts is ${parts.toFixed(1)} px across, under ${TYRE_PX} (${seen.join(', ')})`).toBeGreaterThanOrEqual(TYRE_PX);    await page.context().close();
  });

  it('0687 — THE ASK: the cockpit monitor is the same size on Paint & Parts as on Hangin’ Out, whatever the camera', async () => {
    /*
      *"the desktop zoom in for paint and parts … completely changes the cockpit sizing display on the workbench."*
      0678's close-up drew the monitor at the wall's width in its own camera, twice the hangar's. Read in pixels on
      the built page: the monitor's width on the two tabs, within two pixels of each other.
    */
    const page = await open(1280, 720);
    await openHangar(page);
    await page.waitForTimeout(600);
    const monitor = (screen: Screen): Promise<number> =>
      page.evaluate((p) => document.querySelector(`.${p}shown .${p}dash`)!.getBoundingClientRect().width, prefixFor(screen));
    const onHangar = await monitor('hangar');
    await toTab(page, 'hangar', 'parts');
    await page.waitForTimeout(600);
    const onParts = await monitor('parts');
    expect(onHangar, 'the hangar draws no monitor to measure').toBeGreaterThan(40);
    expect(Math.abs(onParts - onHangar), `the monitor is ${onParts.toFixed(0)} px wide on Paint & Parts and ${onHangar.toFixed(0)} on Hangin’ Out`).toBeLessThanOrEqual(2);
    await page.context().close();
  });

  it('moves the room from one tab’s camera to the next over the dolly’s steps, and does not cut', async () => {
    const page = await open(1280, 720);
    await openHangar(page);
    await page.waitForTimeout(600);
    // A frame at a time, by the page's own clock, paused: a step the load would skip is not skipped.
    await page.clock.install();
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    await page.clock.runFor(100);
    const was = await cosmoDoor(page, 'hangar');
    await toTab(page, 'hangar', 'parts');
    const path: number[] = [];
    for (let frame = 0; frame < DOLLY_STEPS + 12; frame++) {
      path.push(await cosmoDoor(page, 'parts'));
      await page.clock.runFor(17);
    }
    const goes = path[path.length - 1]!;
    const between = path.filter((x) => Math.abs(x - was) > 1 && Math.abs(x - goes) > 1 && (x - was) * (goes - x) > 0);
    const said = `the door went ${was.toFixed(0)} → ${path.map((x) => x.toFixed(0)).join(', ')}`;
    expect(Math.abs(goes - was), `the two tabs' cameras put Cosmo's door in one place, so this measures nothing — ${said}`).toBeGreaterThan(20);
    // Half the dolly's steps or more stand between: one is a cut a frame late, and a frame dropped is not the dolly gone.
    expect(between.length, `the room cut from one tab's camera to the next — ${said}`).toBeGreaterThanOrEqual(DOLLY_STEPS / 2);    await page.context().close();
  });
});
