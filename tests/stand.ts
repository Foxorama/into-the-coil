/**
 * The ship on the stand, as the player sees it — 0540: the port painted behind the hangar's tabs, read
 * off the game's own canvas inside the stand's box.
 *
 * ⚠️ **A PICTURE THAT IS NEVER STILL, SO NEVER COMPARED BYTE FOR BYTE.** The ship bobs on its beam and its
 * flame idles, so two frames of a stand nobody touched differ, and a guard asking *did the picture
 * change* of two of them would pass over a fit that changed nothing. So the stand is read at the same
 * point of the bob (`samePhase`), and what is counted is the share of its pixels whose colour moved by
 * more than `MARGIN` in any channel — against the same count for the stand standing still, in the same
 * test, so the bar a change has to clear is this page's own noise.
 *
 * ⚠️ **PIXELS, AND IT WAS A HISTOGRAM OF THEM.** A colour histogram of the box was tried first: a new look
 * on the hull moves colours about more than it changes how many of each there are, and it read the
 * Firebird's flames as half again its noise. Pixel by pixel the same change is seven thousandths of the
 * box, and the stand standing still is nil — measured, three runs.
 */

import type { Page } from 'playwright-core';
import { prefixFor } from '../src/app/chrome.ts';
import { BLUE_BOB_RATE } from '../src/render/port.ts';
import { STAND_PAD_AT } from '../src/content/port.ts';
import { STEPS_PER_SECOND, type Screen } from '../src/state/screens.ts';

/** How far a channel must move for a pixel to count as changed — past the edge a sub-pixel bob blurs. */
const MARGIN = 48;

/** One bob of the ship on its beam, in milliseconds: `BLUE_BOB_RATE` radians a step, at the sim's rate. */
const BOB_MS = ((Math.PI * 2) / BLUE_BOB_RATE / STEPS_PER_SECOND) * 1000;

/**
 * Keep the pixels round the ship on the page under `key`, to be compared there — a megabyte is not sent back.
 *
 * ⚠️ **ROUND THE SHIP, AND IT WAS THE WHOLE STAND — 0568.** Since the hangar opened out the stand is most of
 * the screen: a wall, the keeper, and the open bay with its stars drifting past. A look changed on the ship
 * was then two thousandths of the box against a noise of one, the stars' — under CI, every look's guard
 * read *no change*. So what is read is the ship's own part of the stand: a band of its width about the pad
 * (`STAND_PAD_AT`), from above the ship to the deck, where the stars are not.
 */
async function snap(page: Page, screen: Screen, key: string): Promise<void> {
  await page.evaluate(
    ({ prefix, key, pad, half }: { prefix: string; key: string; pad: number; half: number }) => {
      const canvas = document.querySelector<HTMLCanvasElement>('#app canvas')!;
      const box = document.querySelector('.' + prefix + 'stand')!.getBoundingClientRect();
      const k = canvas.width / canvas.getBoundingClientRect().width;
      const left = box.left + box.width * Math.max(0, pad - half);
      const right = box.left + box.width * Math.min(1, pad + half);
      const x = Math.max(0, Math.floor(left * k));
      const y = Math.max(0, Math.floor((box.top + box.height * 0.3) * k));
      const w = Math.min(canvas.width - x, Math.floor((right - left) * k));
      const h = Math.min(canvas.height - y, Math.floor(box.height * 0.7 * k));
      const kept = ((window as unknown as { itcStand?: Record<string, Uint8ClampedArray> }).itcStand ??= {});
      kept[key] = canvas.getContext('2d')!.getImageData(x, y, w, h).data;
    },
    { prefix: prefixFor(screen), key, pad: STAND_PAD_AT, half: SHIP_BAND },
  );
}

/**
 * How little of the band may move a bob apart for the stand to count as still — under half the least any guard asks
 * a change to clear (`tests/pad.browser.test.ts`'s flame, 0.0002).
 */
export const STILL = 0.00008;

/** Half the width of the band read round the ship, as a share of the stand — the ship and a little either side. */
const SHIP_BAND = 0.2;

/** The share of the stand's pixels whose colour moved past `MARGIN` between two snaps. */
async function changed(page: Page, from: string, to: string): Promise<number> {
  return page.evaluate(
    ({ from, to, margin }: { from: string; to: string; margin: number }) => {
      const kept = (window as unknown as { itcStand: Record<string, Uint8ClampedArray> }).itcStand;
      const a = kept[from]!;
      const b = kept[to]!;
      let n = 0;
      for (let i = 0; i < a.length; i += 4) {
        if (Math.max(Math.abs(a[i]! - b[i]!), Math.abs(a[i + 1]! - b[i + 1]!), Math.abs(a[i + 2]! - b[i + 2]!)) > margin) n++;
      }
      return n / (a.length / 4);
    },
    { from, to, margin: MARGIN },
  );
}

/**
 * What `act` does to the stand, against what the stand does by itself — 0540.
 *
 * ⚠️ **AT THE SAME POINT OF THE BOB, BY THE PAGE'S OWN CLOCK.** With the page's clock taken over
 * (Playwright's), the stand is read one whole bob apart: twice before `act`, which is the noise; either
 * side of it, which is the change; and twice after it, which is what moves on the stand once it is done —
 * nothing for a paint, and the spinners turning for a rim that turns. The clock is given back after.
 *
 * ⚠️ **`act` presses by dispatching**: a pointer's click waits on frames the taken clock does not give.
 */
export async function samePhase(page: Page, screen: Screen, act: () => Promise<void>): Promise<{ noise: number; change: number; after: number }> {
  /*
    A tab shown a moment ago may not have drawn its camera yet, and a frame owed to the real clock is not
    given by the taken one: measured, a stand reached from Cosmo's read as moving half its box standing
    still. So the page draws on its own for a moment first, and the taken clock settles before the first read.
  */
  await page.waitForTimeout(400);
  /*
    ⚠️ **INSTALLED IS NOT TAKEN: THE CLOCK IS PAUSED.** Playwright's installed clock goes on at the wall's
    pace — measured, 31 frames in half a second of nobody calling `runFor` — so every read was a bob apart
    *plus however long the page took to be read*, which is nothing alone and a visible bob under CI's load:
    1.5 % of the stand "moving" standing still, and two probes reading the pad one way filtered and the
    other way whole. Paused, the same half second is no frames, and a bob apart is a bob apart.
  */
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.clock.runFor(1000);
  /*
    ⚠️ **AND IT WAITS FOR THE STAND TO BE STILL, A BOB APART, BEFORE IT ACTS.** Alone, two reads a bob
    apart were the same picture every time; under the whole batch of browser suites, once, the stand read
    as moving 2.7 % of its box between them — a page the load had left mid-way through something when its
    clock was taken. So the reads go on, a bob apart, until two agree, and `noise` is what the last pair
    left; a stand that never settles in twelve bobs is reported as that noise, and fails the bar loudly.

    ⚠️ **AND *STILL* IS UNDER HALF THE SMALLEST BAR A CHANGE IS HELD TO, AND IT WAS TWICE IT** — the review of
    the secret pilots (0598). *Still* was 0.0005 of the band, and `tests/pad.browser.test.ts` holds a flame to a
    floor of 0.0002: a stand still settling under `npm run prove`'s load passed as still, and its drift across the
    next bob read as the look arriving. Its probes went green under their breaks on two PRs in a row, and red
    every time alone — measured, the break leaves the stand at exactly 0 when nothing is loading it.
  */
  /*
    ⚠️ **AND A BOB OF THE PAGE'S CLOCK IS NOT ALWAYS A BOB OF THE GAME'S** — the review of the secret pilots
    (0598). The taken clock fires a frame every 16 ms and the game steps every 16⅔ from a carried remainder
    (`src/app/loop.ts`), so `BOB_MS` of the page's clock is 104 or 105 of the game's steps depending on where
    the carry stood — and the stand's lights, on the bob's clock (0586), are a frame of their chase off when it
    is 104. Measured: the saucer's rim bulbs, 80 to 110 pixels of the band, moving between two reads of a stand
    nobody touched; under `npm run prove`'s load it landed between the reads either side of a press, and three
    of 0541's probes read a look arriving that their breaks had taken away. So every read is taken three times,
    a frame apart, and a later read is compared with whichever of the three it is nearest: a step slipped reads
    as nothing, and a change is a change from all three.
  */
  await readAround(page, screen, 'b');
  for (let tries = 0; tries < 12; tries++) {
    await page.evaluate(() => {
      const kept = (window as unknown as { itcStand: Record<string, Uint8ClampedArray> }).itcStand;
      for (const end of ['-', '', '+']) kept['a' + end] = kept['b' + end]!;
    });
    await page.clock.runFor(BOB_MS - 2 * FRAME_MS);
    await readAround(page, screen, 'b');
    if ((await nearest(page, 'a', 'b')) < STILL) break;
  }
  await act();
  await page.clock.runFor(BOB_MS - 2 * FRAME_MS);
  await readAround(page, screen, 'c');
  await page.clock.runFor(BOB_MS - 2 * FRAME_MS);
  await readAround(page, screen, 'd');
  await page.clock.resume();
  return { noise: await nearest(page, 'a', 'b'), change: await nearest(page, 'b', 'c'), after: await nearest(page, 'c', 'd') };
}

/** One frame of the page's taken clock — what Playwright advances a frame by. */
const FRAME_MS = 16;

/** Read the stand under `key` three times, a frame apart: `key-`, `key` and `key+`, the middle one the read. */
async function readAround(page: Page, screen: Screen, key: string): Promise<void> {
  await snap(page, screen, key + '-');
  await page.clock.runFor(FRAME_MS);
  await snap(page, screen, key);
  await page.clock.runFor(FRAME_MS);
  await snap(page, screen, key + '+');
}

/** How much of the stand moved from `from` to `to`, against whichever of `from`'s three reads `to` is nearest. */
async function nearest(page: Page, from: string, to: string): Promise<number> {
  return Math.min(await changed(page, from + '-', to), await changed(page, from, to), await changed(page, from + '+', to));
}
