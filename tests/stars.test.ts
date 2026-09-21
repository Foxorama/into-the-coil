/**
 * The star field, held as the picture a desktop player sees.
 *
 * `docs/decisions/0343-the-stars-are-drawn-for-a-desk.md`. Reported: *"I want a starfield optimised
 * for desktop, it looks passable on mobile, but drawn out, big, chunky and just monocoloured on
 * desktop."*
 *
 * ⚠️ **READ OFF THE DRAWING, IN CSS PIXELS OF A 1920×1080 SCREEN.** Every other bound over the sky is a
 * world unit or a share of another layer, and the report is about neither: it is about how wide a
 * disc is on a monitor and how many colours it comes in. `tests/paths.ts` records what the painter
 * actually filled, so these are claims about the bitmap and not about `SKY_STYLE_OF`.
 */

import { describe, expect, it } from 'vitest';

import { PALETTES } from '../src/content/palette.ts';
import { SPRITE_EXTENT } from '../src/content/sprites.ts';
import { THEME_KINDS, THEMES, type ThemeKind } from '../src/content/themes.ts';
import { SKY_STYLE_OF, bakeSize, drawKind, skyCover, skyField, starLight, type SkyKind } from '../src/render/bake.ts';
import { tracingPen } from './paths.ts';

/** `across` is a fixed hundred over the short axis of the screen — 0023 — so this is 1080p. */
const CSS_PER_UNIT = 1080 / 100;
const DOTS: readonly SkyKind[] = ['skyFar', 'skyNear'];
const sizeOf = (kind: SkyKind): number => bakeSize(SPRITE_EXTENT[kind], 10);

/** Every fill the painter made for one layer, as `[colour, width in CSS pixels]`. */
function fillsOf(kind: SkyKind, theme: ThemeKind, palette: keyof typeof PALETTES): [string, number][] {
  const { pen, trace } = tracingPen();
  const size = sizeOf(kind);
  drawKind(pen, kind, PALETTES[palette], size, theme);
  const perUnit = size / SPRITE_EXTENT[kind];
  return trace.passes.map((pass) => {
    const xs = pass.subpaths.flatMap((path) => path.map((p) => p[0]));
    return [pass.colour, ((Math.max(...xs) - Math.min(...xs)) / perUnit) * CSS_PER_UNIT];
  });
}

describe('0343 — the stars are drawn for a desk', () => {
  it('THE REPORTED ONE, IN PIXELS: no star in The Approach has a hard edge wider than a point', () => {
    /*
      ⚠️ **THE HARD FILLS ONLY, AND THAT IS THE CLAIM RATHER THAN A LOOPHOLE.** A bright star keeps its
      whole radius — as light falling to nothing, which has no edge at any scale a bullet has one
      (0112). What was reported as *chunky* is a disc with a boundary, and the far layer drew them
      12.8 pixels across on this screen.
    */
    for (const kind of DOTS) {
      const hard = fillsOf(kind, 'approach', 'vivid').filter(([colour]) => colour !== 'gradient');
      const widest = Math.max(...hard.map(([, width]) => width));
      expect(
        widest,
        `${kind} fills a hard disc ${widest.toFixed(1)} CSS pixels across on a 1920×1080 screen — that is a coin, not a star`,
      ).toBeLessThan(3);
    }
  });

  it('THE OTHER HALF OF THE REPORT: The Approach’s stars come in colours', () => {
    const colours = new Set(
      fillsOf('skyFar', 'approach', 'vivid')
        .map(([colour]) => colour)
        .filter((colour) => colour !== 'gradient'),
    );
    expect(colours.size, `the back layer is drawn in ${colours.size} colour(s) — *"just monocoloured"*`).toBeGreaterThanOrEqual(4);
  });

  it('0024 — and on a palette whose decoration is the void, every star is the sky ink and nothing glows', () => {
    /*
      High contrast is a setting a player chose. A tint is decoration, so that palette gets the field
      in its own `sky` ink with no light round anything — `foeOf`'s own test, applied to the sky.
    */
    for (const kind of DOTS) {
      const colours = new Set(fillsOf(kind, 'approach', 'high-contrast').map(([colour]) => colour));
      expect([...colours], `${kind} on high contrast`).toEqual([PALETTES['high-contrast'].sky]);
    }
  });

  it('THE BUDGET: the light a place’s stars put in the sky stays under what `skyCover` can see', () => {
    /*
      ⚠️ **`skyCover` REPORTS THE BRIGHTEST LEVEL AT LEAST `share` OF A TILE REACHES, AND IT HAS NEVER
      COUNTED A STAR** — they were all darker than anything a player has to find. A tinted star is
      not. While a place's star light covers less of the tile than that share, the contrast guards
      built on `skyCover` are still measuring the sky that is drawn; past it they are not, and the
      number to move is `skyCover`'s own default — it owns this, not the star table.
    */
    const share = 0.005;
    // The default this is read against, so the two cannot drift: a call with it and one without agree.
    expect(skyCover(200, 'approach', share, 8)).toBe(skyCover(200, 'approach', undefined, 8));
    for (const theme of THEME_KINDS) {
      const lit = DOTS.reduce((sum, kind) => sum + starLight(kind, sizeOf(kind), theme), 0);
      expect(
        lit,
        `${THEMES[theme].title}'s stars light ${(lit * 100).toFixed(3)}% of a tile, and skyCover looks at the brightest ${share * 100}%`,
      ).toBeLessThan(share);
    }
  });

  it('THE ONE A DENSE FIELD MAKES VISIBLE: no bare stripe crosses the screen where the tile joins', () => {
    /*
      The tile repeats along the scroll axis, so whatever is empty at its two edges is ONE strip on
      screen, arriving on a schedule. In world units, because the strip is a piece of the lane going
      past; three units is about the gap between two neighbouring stars in this field.
    */
    for (const theme of THEME_KINDS) {
      if (SKY_STYLE_OF[theme].stars === undefined) continue;
      const size = sizeOf('skyFar');
      const perUnit = size / SPRITE_EXTENT.skyFar;
      const xs = skyField('skyFar', size, theme).stars.map((s) => s.x / perUnit);
      const strip = Math.min(...xs) + (SPRITE_EXTENT.skyFar - Math.max(...xs));
      expect(strip, `${theme}'s back layer leaves a bare strip ${strip.toFixed(1)} units wide at every tile join`).toBeLessThan(3);
    }
  });

  it('0282 — a place that authors no stars draws the shared field, untinted', () => {
    for (const theme of THEME_KINDS) {
      if (SKY_STYLE_OF[theme].stars !== undefined) continue;
      for (const kind of DOTS) {
        const tinted = skyField(kind, sizeOf(kind), theme).stars.filter((s) => s.tint !== null || s.halo > 0);
        expect(tinted.length, `${theme}/${kind} states no stars and draws ${tinted.length} tinted marks`).toBe(0);
      }
    }
  });
});
