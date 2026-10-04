import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { fly } from './title.ts';
import { placeFor } from '../src/app/music.ts';
import { THEMES } from '../src/content/themes.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';

/**
 * LEVEL ONE IS DRAWN IN ITS OWN PLACE'S COLOURS, COUNTED ON THE CANVAS.
 *
 * `docs/decisions/0417-a-place-is-baked-by-its-name.md`. `applyPlace` was memoised on the backdrop
 * COLOUR, and The Approach's `space` is the palette's own — so the title → level one change looked
 * like no change, and level one flew the title's generic weather with The Approach's nebula and glow
 * never baked. Nothing in the model was wrong: every table held the right colours and the bake that
 * would have used them simply never ran. So the question is asked of the picture —
 * [0027](../docs/decisions/0027-measure-the-picture-not-the-model.md).
 *
 * ⚠️ **COUNTED AS PIXELS ON A BLEND OF THE PLACE'S GLOW OVER ITS VOID**, the edge colour of every
 * cloud (0223). The title's generic weather is the palette's `sky` for both its colours, a grey-blue
 * whose blend line over the void leaves the glow's by far more than the tolerance at any strength
 * worth counting, so a level one drawn in it has almost none. Written against the content rather
 * than against a colour here, so a re-coloured Approach moves the test with it.
 *
 * ⚠️ **MEASURED BOTH WAYS ON 2026-09-29, 1280×720, three seconds in**: with the colour memo, 334
 * pixels of glow against 180,385 of the title's sky; keyed on the place, 173,519 against 66,168. The
 * sky count is not zero after the fix because the place's own darker body sits near that line too;
 * the assertion is which of the two the picture is made of — two and a half times one way, five
 * hundred times the other.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 60_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

let browser: Browser | undefined;
afterAll(async () => {
  await browser?.close();
});

const rgb = (hex: string): number[] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/**
 * How many pixels lie on the blend of `edge` over `void_`, and how many on the blend of `other` over
 * it — the first is the place's glow, the second the title's sky, so the two counts are the same
 * question asked of the two answers.
 */
function onBlends(page: Page, void_: number[], edge: number[], other: number[]): Promise<{ edge: number; other: number }> {
  return page.evaluate(
    ({ v, e, o }) => {
      const canvas = document.querySelector('#app canvas');
      if (!(canvas instanceof HTMLCanvasElement)) return { edge: -1, other: -1 };
      const ctx = canvas.getContext('2d');
      if (ctx === null) return { edge: -1, other: -1 };
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      // On the line v + t·(to − v), at a strength of at least a sixth, within a few levels of it.
      const on = (i: number, to: number[]): boolean => {
        const d = [to[0]! - v[0]!, to[1]! - v[1]!, to[2]! - v[2]!];
        const p = [data[i]! - v[0]!, data[i + 1]! - v[1]!, data[i + 2]! - v[2]!];
        const t = (p[0]! * d[0]! + p[1]! * d[1]! + p[2]! * d[2]!) / (d[0]! * d[0]! + d[1]! * d[1]! + d[2]! * d[2]!);
        if (t < 1 / 6 || t > 1.05) return false;
        return Math.abs(p[0]! - t * d[0]!) <= 4 && Math.abs(p[1]! - t * d[1]!) <= 4 && Math.abs(p[2]! - t * d[2]!) <= 4;
      };
      let edge = 0;
      let other = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (on(i, e)) edge++;
        if (on(i, o)) other++;
      }
      return { edge, other };
    },
    { v: void_, e: edge, o: other },
  );
}

describe.runIf(chromePath)('level one is drawn in its own place, not in the title’s weather', () => {
  it('has the place’s glow on the canvas, a few seconds after the title', async () => {
    browser ??= await launchChromium({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(dist);
    await page.waitForSelector('#app canvas', { timeout: CANVAS_MS });
    await pastIntro(page);
    // Fly, which is what `scripts/shot.mjs` presses, and past the intro the first flight plays — 0513.
    await fly(page);
    // A few seconds in, which is `scripts/shot.mjs`'s first shot of the level and where 0417's
    // before-and-after pair was taken: the weather has scrolled on and little else has arrived.
    await page.waitForTimeout(3_000);

    const place = THEMES[placeFor(0)];
    const palette = PALETTES[DEFAULT_PALETTE];
    const counted = await onBlends(page, rgb(place.space[DEFAULT_PALETTE]), rgb(place.glow[DEFAULT_PALETTE]), rgb(palette.sky));
    await context.close();

    expect(counted.edge, 'the canvas could not be read').toBeGreaterThanOrEqual(0);
    expect(
      counted.edge,
      `${counted.edge} pixels of ${place.title}'s glow against ${counted.other} of the title's sky — level one ` +
        `is flying the title's weather, and its own place was never baked (0417)`,
    ).toBeGreaterThan(counted.other);
  });
});
