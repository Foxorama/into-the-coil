import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { Browser } from 'playwright-core';
import { createServer, type ViteDevServer } from 'vite';
import { chromePath, launchChromium } from './chromium.ts';

/**
 * THE LIGHT IS CAST — `docs/decisions/0676-the-light-is-cast.md`.
 *
 * ⚠️ **IN PIXELS, OFF THE PAINTER THE TABS STAND IN** — 0027, on `tests/station.browser.test.ts`'s terms: the dock
 * is drawn at one step into a real canvas from the atlases the shell bakes, and the wall is read where the lamp
 * hangs over it and where no lamp does. The patches stand beside the lamp's cone, high on the wall, so what is read
 * is the tile's own light and not the cone that was there before.
 */

vi.setConfig({ testTimeout: 300_000 });

const root = fileURLToPath(new URL('..', import.meta.url));
let browser: Browser | undefined;
let server: ViteDevServer | undefined;

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

/** Each patch's mean luminance, nought to one. */
interface Read {
  under: number;
  between: number;
}

describe.runIf(chromePath)('0676 — the light is cast', () => {
  it('draws the dock’s wall under a lamp brighter than the wall between its lamps', async () => {
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

    const read = await page.evaluate(async (): Promise<Read> => {
      const load = new Function('url', 'return import(url)') as (url: string) => Promise<unknown>;
      const { bakePort, withTheGame } = (await load('/src/render/port-bake.ts')) as typeof import('../src/render/port-bake.ts');
      const { bakeAtlas, viewFor } = (await load('/src/render/bake.ts')) as typeof import('../src/render/bake.ts');
      const { CanvasSurface } = (await load('/src/render/canvas.ts')) as typeof import('../src/render/canvas.ts');
      const { paintStand } = (await load('/src/render/port.ts')) as typeof import('../src/render/port.ts');
      const { screenX, screenY } = (await load('/src/render/surface.ts')) as typeof import('../src/render/surface.ts');
      const { PALETTES } = (await load('/src/content/palette.ts')) as typeof import('../src/content/palette.ts');
      const { DEFAULT_GOLFER, GOLFERS } = (await load('/src/content/golfers.ts')) as typeof import('../src/content/golfers.ts');
      const { SHIPS } = (await load('/src/content/ships.ts')) as typeof import('../src/content/ships.ts');
      const { DOCK } = (await load('/src/content/port.ts')) as typeof import('../src/content/port.ts');
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
      // A patch's mean luminance, its corners in the dock's world units.
      const patch = (a0: number, c0: number, a1: number, c1: number): number => {
        const x0 = Math.round(screenX(view, a0, c0));
        const y0 = Math.round(screenY(view, a0, c0));
        const w = Math.max(1, Math.round(screenX(view, a1, c1) - x0));
        const h = Math.max(1, Math.round(screenY(view, a1, c1) - y0));
        const data = ctx.getImageData(x0, y0, w, h).data;
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) sum += (0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!) / 255;
        return sum / (data.length / 4);
      };
      // High on the wall, on the tile under the first lamp but beside its cone; and on the tile furthest from both lamps.
      const lamp = DOCK.lamps[0]!;
      return { under: patch(lamp - 8, 24, lamp - 5, 29), between: patch(12, 24, 15, 29) };
    });

    /*
      Measured at landing: 0.327 under the lamp and 0.174 between, 1.88 times. The room before this decision read
      0.297 and 0.218 there, 1.36 times, because the lamp's own glow reaches the patch. The bound sits between the
      two, so a wall whose tiles are not lit reads as the room did.
    */
    expect(read.under, `the wall under a lamp (${read.under.toFixed(3)}) is not 1.6 times as bright as between them (${read.between.toFixed(3)})`).toBeGreaterThan(read.between * 1.6);
  });
});
