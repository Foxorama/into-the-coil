import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { Browser } from 'playwright-core';
import { createServer, type ViteDevServer } from 'vite';
import { chromePath, launchChromium } from './chromium.ts';

/**
 * THE WALL STOPS REPEATING — `docs/decisions/0677-big-forms.md`.
 *
 * ⚠️ **IN PIXELS, OFF THE PAINTER THE TABS STAND IN**, on `tests/light.browser.test.ts`'s terms. The review's
 * word for the wall was a grid: every tile the same picture at the tile's pitch. Two tiles of the dock's wall that
 * stand in the same light — the same row, both clear of every lamp, nothing in front of them — are read, and the
 * room passes when a pair of them is not the same picture.
 *
 * ⚠️ **A STYLE OF THE PICTURE, HELD AS ONE**: it does not say which tiles differ or how, only that the grid is
 * broken somewhere the eye lands. Two pairs are read, in two rows, so a pick that happens to leave one pair alike
 * does not redden it.
 */

vi.setConfig({ testTimeout: 300_000 });

const root = fileURLToPath(new URL('..', import.meta.url));
let browser: Browser | undefined;
let server: ViteDevServer | undefined;

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

describe.runIf(chromePath)('0677 — big forms, and the deck as a floor', () => {
  it('draws the dock’s wall as tiles that are not all one picture at the tile’s pitch', async () => {
    server = await createServer({
      root,
      configFile: resolve(root, 'vite.config.ts'),
      logLevel: 'error',
      server: { port: 0, strictPort: false, open: false, host: '127.0.0.1' },
    });
    await server.listen();
    const base = server.resolvedUrls?.local?.[0];
    expect(base, 'vite gave no URL to load the painter from').toBeTruthy();
    browser ??= await launchChromium({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    await page.goto(`${base!}rig/sheet.html`);

    const differences = await page.evaluate(async (): Promise<number[]> => {
      const load = new Function('url', 'return import(url)') as (url: string) => Promise<unknown>;
      const { bakePort, withTheGame } = (await load('/src/render/port-bake.ts')) as typeof import('../src/render/port-bake.ts');
      const { bakeAtlas, viewFor } = (await load('/src/render/bake.ts')) as typeof import('../src/render/bake.ts');
      const { CanvasSurface } = (await load('/src/render/canvas.ts')) as typeof import('../src/render/canvas.ts');
      const { paintStand } = (await load('/src/render/port.ts')) as typeof import('../src/render/port.ts');
      const { screenX, screenY } = (await load('/src/render/surface.ts')) as typeof import('../src/render/surface.ts');
      const { PALETTES } = (await load('/src/content/palette.ts')) as typeof import('../src/content/palette.ts');
      const { DEFAULT_GOLFER, GOLFERS } = (await load('/src/content/golfers.ts')) as typeof import('../src/content/golfers.ts');
      const { SHIPS } = (await load('/src/content/ships.ts')) as typeof import('../src/content/ships.ts');
      const { PORT_EXTENT } = (await load('/src/content/port.ts')) as typeof import('../src/content/port.ts');
      const { SKY } = (await load('/src/app/mount.ts')) as typeof import('../src/app/mount.ts');
      const { viewOf } = (await load('/src/sim/camera.ts')) as typeof import('../src/sim/camera.ts');

      const width = 1280;
      const height = 720;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      const view = viewOf(width, height);
      const colours = Object.values(PALETTES)[0]!;
      const pilot = GOLFERS[DEFAULT_GOLFER];
      const atlas = withTheGame(bakePort(colours, view.scale, pilot), bakeAtlas(colours, viewFor(view.alongAxis), view.scale));
      const surface = new CanvasSurface(ctx, atlas);
      surface.setSize(width, height, colours.space, 0);
      paintStand(surface, view, 0, SKY, SHIPS[pilot.ship], null);
      // A wall tile's pixels, inset from its seams so the overlap between tiles is not read.
      const wall = PORT_EXTENT.wall;
      const tile = (along: number, across: number): Uint8ClampedArray => {
        const x = Math.round(screenX(view, along - wall / 2 + 1, across));
        const y = Math.round(screenY(view, along, across - wall / 2 + 1));
        const side = Math.round((wall - 2) * view.scale);
        return ctx.getImageData(x, y, side, side).data;
      };
      // How far apart two tiles' pictures are: the mean difference per channel, nought to one.
      const apart = (a: Uint8ClampedArray, b: Uint8ClampedArray): number => {
        let sum = 0;
        for (let i = 0; i < a.length; i++) sum += Math.abs(a[i]! - b[i]!);
        return sum / a.length / 255;
      };
      // The first two columns of the dock's wall, clear of both lamps (`tileLit` gives them nought), in two rows.
      return [30, 50].map((across) => apart(tile(10, across), tile(30, across)));
    });

    /*
      Measured at landing: the pair in the upper row 0.0002 apart (both bare, the seeded picks left them alike) and
      in the lower 0.0244. The wall before this decision read 0.0002 and 0.0000: one picture at the tile's pitch.
    */
    expect(Math.max(...differences), `every pair of the dock's wall tiles read alike (${differences.map((d) => d.toFixed(4)).join(', ')})`).toBeGreaterThan(0.01);
  });
});
