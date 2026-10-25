import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { Browser } from 'playwright-core';
import { createServer, type ViteDevServer } from 'vite';
import { chromePath, launchChromium } from './chromium.ts';

/**
 * THE STATION OUTSIDE IS A SHIP, LIT FROM ITS BAY — `docs/decisions/0675-the-station-is-a-ship.md`.
 *
 * ⚠️ **IN PIXELS, OFF THE PAINTER THE GAME RUNS, AT THE CHASE SHOT'S THIRTEENTH SECOND** — 0027. The intro is
 * a pure function of its clock (`src/render/port.ts`), so it is drawn here at one step into a real canvas from
 * the atlases the shell bakes, and the station is found by its own blit rather than by a guess at where it
 * lands. What is asked is what the review saw missing: a hull that stands off the sky as a shape, and a bay
 * mouth that is the brightest thing on it.
 *
 * ⚠️ **ON VITE'S DEV SERVER, AS `tests/place-drawn.browser.test.ts` IS**, because the painter is not
 * reachable from the shipped page (0003).
 */

// A browser, a dev server, the game's atlas and the port's.
vi.setConfig({ testTimeout: 300_000 });

const root = fileURLToPath(new URL('..', import.meta.url));
let browser: Browser | undefined;
let server: ViteDevServer | undefined;

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

/** What was read off the canvas: each patch's mean luminance, nought to one. */
interface Read {
  mouth: number;
  hull: number;
  sky: number;
}

describe.runIf(chromePath)('0675 — the station outside is a ship, lit from its bay', () => {
  it('stands its hull off the sky, and its bay mouth brighter than the hull beside it, 13 s into the intro', async () => {
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

    const read = await page.evaluate(async (): Promise<Read | string> => {
      // Built from a string because vitest rewrites an `import()` written here into its own loader — place-drawn's terms.
      const load = new Function('url', 'return import(url)') as (url: string) => Promise<unknown>;
      const { bakePort, withTheGame } = (await load('/src/render/port-bake.ts')) as typeof import('../src/render/port-bake.ts');
      const { bakeAtlas, viewFor } = (await load('/src/render/bake.ts')) as typeof import('../src/render/bake.ts');
      const { CanvasSurface } = (await load('/src/render/canvas.ts')) as typeof import('../src/render/canvas.ts');
      const { paintPort } = (await load('/src/render/port.ts')) as typeof import('../src/render/port.ts');
      const { PALETTES } = (await load('/src/content/palette.ts')) as typeof import('../src/content/palette.ts');
      const { DEFAULT_GOLFER, GOLFERS } = (await load('/src/content/golfers.ts')) as typeof import('../src/content/golfers.ts');
      const { SHIPS } = (await load('/src/content/ships.ts')) as typeof import('../src/content/ships.ts');
      const { PORT_SPRITE } = (await load('/src/content/port.ts')) as typeof import('../src/content/port.ts');
      const { SKY } = (await load('/src/app/mount.ts')) as typeof import('../src/app/mount.ts');
      const { viewOf } = (await load('/src/sim/camera.ts')) as typeof import('../src/sim/camera.ts');
      const { STEPS_PER_SECOND } = (await load('/src/state/screens.ts')) as typeof import('../src/state/screens.ts');

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
      surface.setSize(width, height, colours.space, view.barAcross);
      // The canvas the game draws on, and every blit written down so the station is found by its own.
      const station: { x: number; y: number; scale: number }[] = [];
      const recording = {
        clear: () => surface.clear(),
        blit: (sprite: number, x: number, y: number, scale: number, turn = 0, alpha = 1) => {
          if (sprite === PORT_SPRITE.station) station.push({ x, y, scale });
          surface.blit(sprite, x, y, scale, turn, alpha);
        },
        bolt: (...args: Parameters<typeof surface.bolt>) => surface.bolt(...args),
      };
      recording.clear();
      paintPort(recording, view, 13 * STEPS_PER_SECOND, SKY, SHIPS[pilot.ship]);
      const at = station[0];
      if (at === undefined) return 'the station is not drawn 13 s into the intro';
      // A patch's mean luminance, its corners in the station's own units about its centre (`paintStation`).
      const patch = (u0: number, v0: number, u1: number, v1: number): number => {
        const x0 = Math.round(at.x + u0 * at.scale);
        const y0 = Math.round(at.y + v0 * at.scale);
        const w = Math.max(1, Math.round((u1 - u0) * at.scale));
        const h = Math.max(1, Math.round((v1 - v0) * at.scale));
        const data = ctx.getImageData(x0, y0, w, h).data;
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) sum += (0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!) / 255;
        return sum / (data.length / 4);
      };
      return {
        // Inside the mouth, behind its field.
        mouth: patch(39, -6, 44, 10),
        // The hull aft of the ring, between two strips of windows.
        hull: patch(-8, 18.2, -2, 20.6),
        // The sky over the back, clear of the bridge and its masts.
        sky: patch(-6, -62, 0, -52),
      };
    });

    expect(typeof read, typeof read === 'string' ? read : '').toBe('object');
    const { mouth, hull, sky } = read as Read;
    /*
      Measured at landing: the mouth 0.796, the hull 0.171, the sky 0.052 — the mouth 4.7 times the hull, and the
      hull 0.12 off the sky. A flattened mouth is the hull's own ink, and a hull the sky's colour is no shape.
    */
    expect(mouth, `the bay mouth (${mouth.toFixed(2)}) is not three times as bright as the hull beside it (${hull.toFixed(2)})`).toBeGreaterThan(3 * hull);
    expect(Math.abs(hull - sky), `the hull (${hull.toFixed(2)}) does not stand off the sky above it (${sky.toFixed(2)})`).toBeGreaterThan(0.05);
  });
});
