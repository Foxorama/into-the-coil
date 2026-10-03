/**
 * The light is additive, in pixels — `docs/decisions/0470-the-light-is-additive.md`.
 *
 * ⚠️ **THE ONE ASSERTION IN THE UNITS THE PLAYER SEES — 0027.** `tests/bolt.test.ts` holds that the
 * glow is stroked `lighter` and that a beam is six layers deep; neither says what a pixel ends up as,
 * and the report this answers was about pixels: *"the jellyfish's laser still looks terrible against
 * the background."* So each stack is stroked on a real canvas, over the real colours — the Black
 * Heart's sky, its lit vessel, The Approach's sky — and the pixels are read back. The stacks are the
 * shipped tables from `src/render/canvas.ts`; the only arithmetic here is a loop over them.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { Browser } from 'playwright-core';
import { launchChromium } from './chromium.ts';
import { BEAM_LAYERS, FLASH_LAYERS, type BoltLayer } from '../src/render/canvas.ts';
import { PALETTES } from '../src/content/palette.ts';
import { THEMES } from '../src/content/themes.ts';
import { HEART_ROSE, mix } from '../src/render/bake.ts';
import { GAMEPLAY_FLOOR, contrast, luminance } from './contrast.ts';

/*
  ⚠️ FILE-LEVEL, because vitest's 5s default is not a browser test's timeout — see
  tests/orientation.browser.test.ts. Held for every *.browser.test.ts by tests/toolchain.test.ts.
*/
vi.setConfig({ testTimeout: 60_000 });

let browser: Browser | undefined;

afterAll(async () => {
  await browser?.close();
});

/** Two marks side by side stop being one shape — `tests/palette.test.ts`'s own bar. */
const SEPARATED = 1.6;

/** The stroke's width in CSS pixels. A beam's hurt width is four of these (`src/render/scene.ts`). */
const WIDTH = 8;
const HURT = WIDTH * 4;

interface Sample {
  layers: readonly BoltLayer[];
  glow: string;
  core: string;
  dark: string;
  bg: string;
  /** Pixels off the line to read, across it. */
  offsets: readonly number[];
  /** Every layer laid `source-over` — the picture as it was before 0470, for the comparison. */
  laid: boolean;
}

/** Stroke one stack on a real canvas over `bg`, and read the pixel at each offset as a hex colour. */
async function stroke(sample: Sample): Promise<string[]> {
  browser ??= await launchChromium({ headless: true });
  const page = await browser.newPage();
  const pixels = await page.evaluate(({ layers, glow, core, dark, bg, offsets, laid, width }) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 240;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 400, 240);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(20, 120);
    ctx.lineTo(380, 120);
    for (const layer of layers) {
      ctx.globalCompositeOperation = laid ? 'source-over' : layer.additive ? 'lighter' : 'source-over';
      ctx.globalAlpha = layer.alpha;
      ctx.strokeStyle = layer.ink === 'dark' ? dark : layer.ink === 'core' ? core : glow;
      ctx.lineWidth = width * layer.width;
      ctx.stroke();
    }
    return offsets.map((dy) => {
      const d = ctx.getImageData(200, Math.round(120 + dy), 1, 1).data;
      return '#' + [d[0]!, d[1]!, d[2]!].map((v) => v.toString(16).padStart(2, '0')).join('');
    });
  }, { ...sample, width: WIDTH });
  await page.close();
  return pixels;
}

const core = PALETTES.vivid.impact;
const heart = THEMES.core;
/** The vessels' lit core, as `tests/medusa.test.ts` derives it from the bake. */
const vessel = mix(mix(heart.nebula.vivid, HEART_ROSE, 0.6), '#ffffff', 0.35);

describe('0470 — the light is additive, in pixels', () => {
  it('IN PIXELS: a beam over the Black Heart is white at its heart, falls off through its body, and its rim parts it from an artery', async () => {
    expect(heart.bolt, 'the Black Heart strokes its bolts in the enemy ink').not.toBeNull();
    const base = { layers: BEAM_LAYERS, glow: heart.bolt!, core, dark: heart.space.vivid, laid: false };
    // The heart, a point inside the inner glow, a point in the body alone, and a point in the rim —
    // each a pixel or more clear of a layer's edge, where the antialiasing is.
    const offsets = [0, HURT * 0.2, HURT * 0.44, HURT * 0.57];
    const sky = await stroke({ ...base, bg: heart.space.vivid, offsets });
    const over = await stroke({ ...base, bg: vessel, offsets });
    for (const [where, px] of [
      ['the sky', sky],
      ['a vessel', over],
    ] as const) {
      expect(luminance(px[0]!), `over ${where} the heart of the beam is ${px[0]}, not white light`).toBeGreaterThanOrEqual(0.85);
      expect(luminance(px[1]!), `over ${where} the inner glow is no darker than the heart`).toBeLessThan(luminance(px[0]!) - 0.02);
      expect(luminance(px[2]!), `over ${where} the body is no darker than the inner glow — a band, not a column`).toBeLessThan(luminance(px[1]!) - 0.02);
    }
    expect(contrast(sky[1]!, heart.space.vivid), `the inner glow ${sky[1]} against the sky ${heart.space.vivid}`).toBeGreaterThanOrEqual(GAMEPLAY_FLOOR);
    // The report: a laser over an artery. The rim is darker than the vessel it crosses, and the heart
    // stands off the rim — so the beam carries its own edge wherever it is laid.
    expect(contrast(over[3]!, vessel), `the rim ${over[3]} does not part the beam from the vessel ${vessel}`).toBeGreaterThanOrEqual(SEPARATED);
    expect(luminance(over[3]!), 'the rim over a vessel is brighter than the vessel').toBeLessThan(luminance(vessel));
    expect(contrast(over[0]!, over[3]!), `the heart ${over[0]} against its own rim ${over[3]}`).toBeGreaterThanOrEqual(GAMEPLAY_FLOOR);
  });

  it('IN PIXELS: added beats laid — the beam’s body over an artery is brighter added than it was as paint', async () => {
    const base = { layers: BEAM_LAYERS, glow: heart.bolt!, core, dark: heart.space.vivid, bg: vessel, offsets: [HURT * 0.44] };
    const [added] = await stroke({ ...base, laid: false });
    const [laid] = await stroke({ ...base, laid: true });
    expect(luminance(added!), `the body added is ${added}, laid it is ${laid}`).toBeGreaterThan(luminance(laid!) + 0.05);
  });

  it('IN PIXELS: the arc over The Approach is light the player can see — its glow stands off the sky, and added beats laid', async () => {
    const approach = THEMES.approach;
    const base = { layers: FLASH_LAYERS, glow: PALETTES.vivid.player, core, dark: approach.space.vivid, bg: approach.space.vivid, offsets: [WIDTH * 1.5] };
    const [added] = await stroke({ ...base, laid: false });
    const [laid] = await stroke({ ...base, laid: true });
    expect(contrast(added!, approach.space.vivid), `the glow ${added} against The Approach's sky`).toBeGreaterThanOrEqual(GAMEPLAY_FLOOR);
    expect(luminance(added!), `the glow added is ${added}, laid it is ${laid}`).toBeGreaterThan(luminance(laid!) + 0.05);
  });
});
