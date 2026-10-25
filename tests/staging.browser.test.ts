import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { Browser } from 'playwright-core';
import { createServer, type ViteDevServer } from 'vite';
import { chromePath, launchChromium } from './chromium.ts';

/**
 * THE INTRO'S STAGING — `docs/decisions/0679-the-intros-staging.md`.
 *
 * ⚠️ **IN PIXELS, OFF THE PAINTER THE GAME RUNS, ON A DESKTOP'S SCREEN WITH ITS BAR** — 0027, on 0675's terms
 * (`tests/station.browser.test.ts`). The intro is a pure function of its clock, so it is drawn here at one step,
 * into a real canvas from the atlases the shell bakes, through the view the shell hands it — the play view, with
 * the strip's bar at the top of a desktop — on a surface with no bar, as the shell sets it for the intro.
 *
 * Asked: the strip's band is the room and not an empty black band over it; and the Viper's pad is hers, in her
 * violet, beside the pilot's cyan — each read off its pad's own edge lights, found by the pad's own blit.
 *
 * ⚠️ **ON VITE'S DEV SERVER**, because the painter is not reachable from the shipped page (0003).
 */

vi.setConfig({ testTimeout: 300_000 });

const root = fileURLToPath(new URL('..', import.meta.url));
let browser: Browser | undefined;
let server: ViteDevServer | undefined;

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

/** What was read off the canvas. */
interface Read {
  /** The share of the strip's band that is not the void the room is painted on. */
  band: number;
  /** Each pad's edge lights, their mean colour. */
  viper: [number, number, number];
  pilot: [number, number, number];
  bar: number;
}

describe.runIf(chromePath)('0679 — the intro’s staging', () => {
  it('draws the room up into the strip’s band, and lights her pad violet and the pilot’s cyan', async () => {
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
      const load = new Function('url', 'return import(url)') as (url: string) => Promise<unknown>;
      const { bakePort, withTheGame } = (await load('/src/render/port-bake.ts')) as typeof import('../src/render/port-bake.ts');
      const { bakeAtlas, viewFor } = (await load('/src/render/bake.ts')) as typeof import('../src/render/bake.ts');
      const { CanvasSurface } = (await load('/src/render/canvas.ts')) as typeof import('../src/render/canvas.ts');
      const { introSharpness, paintPort } = (await load('/src/render/port.ts')) as typeof import('../src/render/port.ts');
      const { PALETTES } = (await load('/src/content/palette.ts')) as typeof import('../src/content/palette.ts');
      const { DEFAULT_GOLFER, GOLFERS } = (await load('/src/content/golfers.ts')) as typeof import('../src/content/golfers.ts');
      const { SHIPS } = (await load('/src/content/ships.ts')) as typeof import('../src/content/ships.ts');
      const { PORT_SPRITE, STAGE } = (await load('/src/content/port.ts')) as typeof import('../src/content/port.ts');
      const { SKY } = (await load('/src/app/mount.ts')) as typeof import('../src/app/mount.ts');
      const { hudBar } = (await load('/src/app/chrome.ts')) as typeof import('../src/app/chrome.ts');
      const { viewOf } = (await load('/src/sim/camera.ts')) as typeof import('../src/sim/camera.ts');
      const { STEPS_PER_SECOND } = (await load('/src/state/screens.ts')) as typeof import('../src/state/screens.ts');

      const width = 1280;
      const height = 720;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      // The play view a desktop has, with the strip's bar over it (`barFor` in src/app/mount.ts).
      const bar = hudBar(height, 16);
      const view = viewOf(width, height, bar);
      if (view.barAcross <= 0) return 'the view has no bar, so this measures nothing';
      const colours = Object.values(PALETTES)[0]!;
      const pilot = GOLFERS[DEFAULT_GOLFER];
      const atlas = withTheGame(bakePort(colours, introSharpness(view), pilot), bakeAtlas(colours, viewFor(view.alongAxis), view.scale));
      const surface = new CanvasSurface(ctx, atlas);
      surface.setSize(width, height, colours.space, 0);
      const pads: Record<'viper' | 'pilot', { x: number; y: number; scale: number } | undefined> = { viper: undefined, pilot: undefined };
      const recording = {
        clear: () => surface.clear(),
        blit: (sprite: number, x: number, y: number, scale: number, turn = 0, alpha = 1) => {
          if (sprite === PORT_SPRITE.padViper) pads.viper = { x, y, scale };
          if (sprite === PORT_SPRITE.pad) pads.pilot = { x, y, scale };
          surface.blit(sprite, x, y, scale, turn, alpha);
        },
        bolt: (...args: Parameters<typeof surface.bolt>) => surface.bolt(...args),
      };
      // 1.2 s: the room up out of the fade, the Viper lit on her pad.
      recording.clear();
      paintPort(recording, view, 1.2 * STEPS_PER_SECOND, SKY, SHIPS[pilot.ship]);
      // The void the room is painted on, in its three channels.
      const space = [1, 3, 5].map((i) => Number.parseInt(colours.space.slice(i, i + 2), 16));
      // Over the room, short of the bay: past it is the open sky, nearly the void's own colour by design.
      const bayX = pads.viper === undefined ? 0 : pads.viper.x + (STAGE.bay - STAGE.viperPad - 4) * pads.viper.scale;
      const top = ctx.getImageData(0, 0, Math.max(1, Math.floor(Math.min(width, bayX))), Math.floor(view.barAcross)).data;
      let room = 0;
      for (let i = 0; i < top.length; i += 4) {
        if (Math.max(Math.abs(top[i]! - space[0]!), Math.abs(top[i + 1]! - space[1]!), Math.abs(top[i + 2]! - space[2]!)) > 6) room++;
      }
      // A pad's strip of edge lights, along its top, in the pad's own units about its centre (`paintPad`).
      const strip = (at: { x: number; y: number; scale: number } | undefined): [number, number, number] => {
        if (at === undefined) return [0, 0, 0];
        const x0 = Math.round(at.x - 10 * at.scale);
        const y0 = Math.round(at.y - 1.8 * at.scale);
        const data = ctx.getImageData(x0, y0, Math.round(20 * at.scale), Math.max(1, Math.round(0.45 * at.scale))).data;
        const sum = [0, 0, 0];
        for (let i = 0; i < data.length; i += 4) for (let c = 0; c < 3; c++) sum[c]! += data[i + c]!;
        const n = data.length / 4;
        return [sum[0]! / n, sum[1]! / n, sum[2]! / n];
      };
      if (pads.viper === undefined || pads.pilot === undefined) return 'a pad is not drawn 1.2 s into the intro';
      return { band: room / (top.length / 4), viper: strip(pads.viper), pilot: strip(pads.pilot), bar: view.barAcross };
    });

    expect(typeof read, typeof read === 'string' ? read : '').toBe('object');
    const { band, viper, pilot, bar } = read as Read;
    const rgb = (c: [number, number, number]): string => c.map((n) => n.toFixed(0)).join(', ');
    /*
      Measured at landing: all of the strip's 74.9 px band over the room drawn (1.000); her lights 160, 112, 201
      and the pilot's 101, 168, 201.
    */
    expect(band, `the strip's band (${bar.toFixed(1)} px) is the void, not the room: ${band.toFixed(2)} of it drawn`).toBeGreaterThan(0.9);
    // Violet: red and blue both well over green. Cyan: green and blue both well over red.
    expect(Math.min(viper[0], viper[2]) - viper[1], `her pad's lights are not violet: ${rgb(viper)}`).toBeGreaterThan(30);
    expect(Math.min(pilot[1], pilot[2]) - pilot[0], `the pilot's pad's lights are not cyan: ${rgb(pilot)}`).toBeGreaterThan(30);
  });
});
