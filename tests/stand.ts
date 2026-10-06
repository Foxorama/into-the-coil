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
    left; a stand that never settles in six bobs is reported as that noise, and fails the bar loudly.
  */
  await snap(page, screen, 'b');
  for (let tries = 0; tries < 6; tries++) {
    await page.evaluate(() => {
      const kept = (window as unknown as { itcStand: Record<string, Uint8ClampedArray> }).itcStand;
      kept['a'] = kept['b']!;
    });
    await page.clock.runFor(BOB_MS);
    await snap(page, screen, 'b');
    if ((await changed(page, 'a', 'b')) < 0.0005) break;
  }
  await act();
  await page.clock.runFor(BOB_MS);
  await snap(page, screen, 'c');
  await page.clock.runFor(BOB_MS);
  await snap(page, screen, 'd');
  await page.clock.resume();
  return { noise: await changed(page, 'a', 'b'), change: await changed(page, 'b', 'c'), after: await changed(page, 'c', 'd') };
}
