import { describe, it, expect, afterAll, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { Browser } from 'playwright-core';
import { createServer, type ViteDevServer } from 'vite';
import { chromePath, launchChromium } from './chromium.ts';

/**
 * A PLACE CHANGE RE-BAKES ONLY WHAT IT CHANGES, AND WHAT IT KEEPS IS WHAT A BAKE WOULD HAVE DRAWN.
 *
 * `docs/decisions/0605-a-place-rebakes-only-what-it-changes.md`.
 *
 * ⚠️ **THE SUBJECT IS THE ATLAS THE PLAYER FLIES THROUGH, NOT THE LIST.** `PLACE_DRAWN` is what
 * decides which slots are lent from the atlas on screen, and the claim worth holding is the outcome:
 * an atlas built for the next place by lending from the last one is, slot for slot and pixel for
 * pixel, the atlas a fresh bake of the next place draws. A kind that starts reading the place and is
 * not on the list fails here by name; so does a slot a writer paints after the bake and the carry-over
 * forgot to re-bake, which is why the place being left has its own sky painted in before it lends.
 *
 * ⚠️ **AT EVERY BOUNDARY THE ROUTE HAS, IN BOTH PALETTES**, because the set measured to differ was not
 * the same in the two (248 kinds against 63) and a lend is only ever from one place to the next.
 *
 * ⚠️ **ON VITE'S DEV SERVER, AS `scripts/weigh-picture.mjs` IS**, because the bake is not reachable
 * from the shipped page — it is a module inside a single inlined script (0003) — and a copy of the
 * painter in this file would be the second description this exists to keep honest.
 */

// A browser launch, a dev server and twenty-six atlases: far past vitest's default.
vi.setConfig({ testTimeout: 300_000 });

const root = fileURLToPath(new URL('..', import.meta.url));
let browser: Browser | undefined;
let server: ViteDevServer | undefined;

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

describe.runIf(chromePath)('a place change re-bakes only what it changes — 0605', () => {
  it('and the atlas it lends into is the atlas a fresh bake of the next place draws', async () => {
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
    const page = await browser.newPage();
    await page.goto(`${base!}rig/sheet.html`);

    const found = await page.evaluate(async () => {
      /*
        Loaded by URL off the dev server, and typed as the modules they are: the types are erased
        before this function is sent to the page, so nothing but the URLs crosses. The loader is built
        from a string because vitest rewrites an `import()` written in this file into its own SSR
        loader, which does not exist in the page.
      */
      const load = new Function('url', 'return import(url)') as (url: string) => Promise<unknown>;
      const bake = (await load('/src/render/bake.ts')) as typeof import('../src/render/bake.ts');
      const { PALETTES } = (await load('/src/content/palette.ts')) as typeof import('../src/content/palette.ts');
      const { SPRITE_KINDS } = (await load('/src/content/sprites.ts')) as typeof import('../src/content/sprites.ts');
      const { LEVELS, LEVEL_KINDS } = (await load('/src/content/levels.ts')) as typeof import('../src/content/levels.ts');
      const { THEMES } = (await load('/src/content/themes.ts')) as typeof import('../src/content/themes.ts');
      const { SHIP_KINDS, ownFit } = (await load('/src/content/ships.ts')) as typeof import('../src/content/ships.ts');
      const { FLAME_KINDS } = (await load('/src/content/flames.ts')) as typeof import('../src/content/flames.ts');
      // Every byte of every pixel, and the size: two bitmaps that hash alike here are the same picture.
      const hash = (bitmap: CanvasImageSource): string => {
        const c = bitmap as HTMLCanvasElement;
        const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
        let h = 0;
        for (let i = 0; i < data.length; i++) h = (Math.imul(h, 31) + data[i]!) | 0;
        return `${c.width}x${c.height}:${h}`;
      };
      const drain = <T,>(steps: Generator<void, T, void>): T => {
        for (;;) {
          const step = steps.next();
          if (step.done === true) return step.value;
        }
      };
      const ppu = 4;
      const wrong: string[] = [];
      let lent = 0;
      let compared = 0;
      for (const name of Object.keys(PALETTES) as (keyof typeof PALETTES)[]) {
        const palette = PALETTES[name];
        const places = LEVEL_KINDS.map((kind) => LEVELS[kind].theme);
        for (let leg = 1; leg < places.length; leg += 1) {
          const from = places[leg - 1]!;
          const to = places[leg]!;
          if (from === to) continue;
          const leaving = bake.bakeAtlas(palette, 'side', ppu, from);
          /*
            The place being left as it is on screen: every writer that paints into an atlas after its
            bake has painted into this one — the place's gas, landmark, land and banks, a ship fitted
            with another ship's kit, and a flame that is not the standard one. A slot any of them
            touched and the carry-over lent would come out as the last place, or the last fit, left it.
          */
          const theme = THEMES[from];
          bake.bakeNebula(leaving, theme.nebula[name], theme.glow[name], theme.space[name], ppu, from);
          bake.bakeLandmark(leaving, theme.nebula[name], theme.glow[name], theme.space[name], ppu, from);
          const land = theme.ground;
          if (land !== null) bake.bakeGround(leaving, land[name], theme.space[name], theme.nebula[name], ppu, from, theme.land?.[name]);
          // Another ship's kit, ridden by this ship's own pilot: since 0612 a fit says who rides, and no pilot flies another's ship.
          for (const ship of SHIP_KINDS) bake.bakeShipFit(leaving, palette, ship, { ...ownFit(SHIP_KINDS[(SHIP_KINDS.indexOf(ship) + 1) % SHIP_KINDS.length]!), rider: ownFit(ship).rider });
          bake.bakeFlame(leaving, palette, FLAME_KINDS[1]!);
          const lending = drain(bake.bakeAtlasStepwise(palette, 'side', ppu, to, leaving));
          const fresh = bake.bakeAtlas(palette, 'side', ppu, to);
          for (let i = 0; i < SPRITE_KINDS.length; i += 1) {
            if (lending.bitmaps[i] === leaving.bitmaps[i]) lent += 1;
            compared += 1;
            if (hash(lending.bitmaps[i]!) !== hash(fresh.bitmaps[i]!)) wrong.push(`${SPRITE_KINDS[i]!} (${from} → ${to}, ${name})`);
          }
        }
      }
      return { wrong, lent, compared };
    });

    // A lend that never happens passes every comparison vacuously, and saves nothing.
    expect(found.lent, 'nothing was lent across a place change — the carry-over is not happening').toBeGreaterThan(found.compared / 2);
    expect(
      found.wrong,
      'these were carried into a place that draws them differently — add each kind to PLACE_DRAWN in ' +
        'src/render/bake.ts (or, if it is written after the bake, to keptAcrossPlaces), never make its ' +
        'drawing the same everywhere',
    ).toEqual([]);
  });
});
