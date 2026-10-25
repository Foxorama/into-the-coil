import { describe, it, expect, vi, afterAll } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { chromePath, launchChromium } from './chromium.ts';
import { prefixFor } from '../src/app/chrome.ts';
import { CANVAS_MS, pastIntro } from './intro.ts';
import { openHangar } from './title.ts';
import { DOCK, PORT_EXTENT, PORT_INK } from '../src/content/port.ts';
import { SCREENS } from '../src/state/screens.ts';

/**
 * THE MONITOR HANGS ON A WALL — `docs/decisions/0628-the-monitor-hangs-on-a-wall.md`.
 *
 * Asked for: *"need a wall section for the cockpit to hang from + some tool/work benches beneath it."* Held in
 * what the player sees, read off the game's own canvas round the cockpit monitor on Hangin' Out, at the desktop
 * sizes: the wall's header beam over the monitor, its hazard nosing seen across both ends of the monitor's width
 * — so the monitor hangs from the wall and is no wider than it — and the benches' timber seen between the
 * monitor's foot and the deck.
 *
 * ⚠️ **READ THE SKIPPED COUNT.** `runIf` means a machine with no browser still passes.
 */

vi.setConfig({ testTimeout: 180_000 });

const dist = pathToFileURL(resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/index.html')).href;

/**
 * The desktops: the two the layout guard holds that hang the monitor, a 1080p one, the common laptops, a 1080p
 * screen scaled to 125% (1536x864 CSS pixels), and a short window — the smallest stand that still hangs it.
 */
const SIZES = [
  [1024, 768],
  [1280, 720],
  [1366, 768],
  [1536, 864],
  [1920, 1080],
  [1280, 600],
] as const;

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

/** An ink as its three channels. */
function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Around the monitor on the canvas: in a strip `above` world units deep over its top, how many of its columns in
 * each fifth of its width hold the hazard's ink; and in the strip from its foot down to the deck, the share of its
 * columns holding the benches' timber. A world unit in pixels is read off a shop door, the alcove's width.
 */
async function around(page: Page, p: string, above: number): Promise<{ fifths: number[]; timber: number; tall: number }> {
  return page.evaluate(
    ({ prefix, above, alcove, hang, deck, hazard, woods }) => {
      const dash = document.querySelector<HTMLElement>('.' + prefix + 'dash')!.getBoundingClientRect();
      // 0681: Cosmo's door, read at Cosmo's shop's size — each shop has its own.
      const door = [...document.querySelectorAll<HTMLElement>('.' + prefix + 'shop-door')].find((d) => !d.hidden && d.getAttribute('aria-label') === alcove.label)!.getBoundingClientRect();
      const unit = door.width / alcove.wide;
      const canvas = document.querySelector<HTMLCanvasElement>('#app canvas')!;
      const k = canvas.width / canvas.getBoundingClientRect().width;
      const ctx = canvas.getContext('2d')!;
      const near = (d: Uint8ClampedArray, i: number, ink: number[], within: number): boolean =>
        Math.abs(d[i]! - ink[0]!) + Math.abs(d[i + 1]! - ink[1]!) + Math.abs(d[i + 2]! - ink[2]!) <= within;
      const columns = (top: number, bottom: number, inks: number[][], within: number): boolean[] => {
        const x = Math.round(dash.left * k);
        const y = Math.round(top * k);
        const w = Math.round(dash.width * k);
        const h = Math.max(1, Math.round((bottom - top) * k));
        const d = ctx.getImageData(x, y, w, h).data;
        const hit: boolean[] = [];
        for (let c = 0; c < w; c++) {
          let found = false;
          for (let r = 0; r < h && !found; r++) found = inks.some((ink) => near(d, (r * w + c) * 4, ink, within));
          hit.push(found);
        }
        return hit;
      };
      const over = columns(dash.top - above * unit, dash.top - 1, [hazard], 60);
      const fifths = [0, 1, 2, 3, 4].map((f) => over.slice(Math.floor((f * over.length) / 5), Math.floor(((f + 1) * over.length) / 5)).filter(Boolean).length);
      // The deck's top edge is `deck - hang` units under the line the monitor hangs from.
      const floor = dash.top + (deck - hang) * unit;
      const under = columns(dash.bottom + 1, floor, woods, 45);
      return { fifths, timber: under.filter(Boolean).length / under.length, tall: dash.height / unit };
    },
    {
      prefix: p,
      above,
      alcove: { label: SCREENS.shop.heading, wide: PORT_EXTENT.alcove * DOCK.shopGrow.cosmo },
      hang: DOCK.workshop.hang,
      deck: 100,
      hazard: rgb(PORT_INK.hazard),
      woods: [rgb(PORT_INK.wood), rgb(PORT_INK.woodLight)],
    },
  );
}

describe.runIf(chromePath)('0628 — the cockpit monitor hangs on the workshop wall, over its benches', () => {
  it('hangs under the wall’s header and no wider than it, with the benches seen beneath it, at every desktop size', async () => {
    const p = prefixFor('hangar');
    for (const [width, height] of SIZES) {
      const page = await open(width, height);
      await openHangar(page);
      await page.waitForTimeout(400);
      const at = `${width}x${height}`;
      // The header's nosing is two units over the line the monitor hangs from; the catwalk's is five.
      const seen = await around(page, p, (DOCK.workshop.hang - DOCK.workshop.top) + 0.3);
      seen.fifths.forEach((n, i) => {
        if (i === 0 || i === 4) expect(n, `${at}: no header over the ${i === 0 ? 'left' : 'right'} end of the monitor — it is not hung from the wall, or is wider than it`).toBeGreaterThan(0);
      });
      expect(seen.timber, `${at}: the benches are not seen under the monitor — ${(seen.timber * 100).toFixed(0)}% of its width shows timber`).toBeGreaterThan(0.3);
      /*
        Played: *"don't have the cockpit overlay the tools on the tool bench."* The monitor's foot, its dangle's room
        and all, over the top of the tallest thing on the benches — in world units, off the door's ruler.
      */
      const room = DOCK.workshop.toolsTop - DOCK.workshop.hang;
      expect(seen.tall, `${at}: the monitor is ${seen.tall.toFixed(1)} units tall and hangs over the bench's tools, which stand ${room.toFixed(1)} under its top`).toBeLessThan(room);
      await page.context().close();
    }
  });
});
