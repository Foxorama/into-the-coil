/**
 * Rime Shelf is ice — `docs/decisions/0351-rime-shelf-is-ice.md`.
 *
 * Asked for: *"needs to be far far more icy — different whites and blues and aquas and teals etc."*
 * Answered: *"let's go with an off-white balanced colour for rime shelf, I'll see how it plays out"*,
 * with the floor and the foe inks left where they are.
 *
 * ⚠️ **WHAT IS HELD IS THE FLOOR UNDER THE ICE, IN THE PLAYER'S TERMS.** 0347's guard holds every
 * colour a place STATES for its land against every gameplay ink. The ice is painted in many more
 * than the three it states — shadows, crevasses, the lower floes, the bergs' faces — and that guard
 * covers them only if none is brighter than the brightest stated one. That is the claim here, read
 * off everything the two painters put down, gradient stops included.
 */

import { describe, expect, it } from 'vitest';

import { PALETTES, type PaletteName } from '../src/content/palette.ts';
import { THEMES } from '../src/content/themes.ts';
import { GROUND_OF, RANGE_OF, type Pen } from '../src/render/bake.ts';
import { luminance } from './contrast.ts';

/** Every colour a painter used, as the canvas was told it: hex, `rgba(…)`, or a gradient's stops. */
function recordingPen(): { pen: Pen; used: string[] } {
  const used: string[] = [];
  const stops: WeakMap<object, string[]> = new WeakMap();
  const read = (style: unknown): string[] => (typeof style === 'string' ? [style] : (stops.get(style as object) ?? []));
  const pen = {
    fillStyle: '' as unknown,
    strokeStyle: '' as unknown,
    lineWidth: 1,
    lineCap: 'butt',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    beginPath(): void {},
    moveTo(): void {},
    lineTo(): void {},
    closePath(): void {},
    arc(): void {},
    quadraticCurveTo(): void {},
    bezierCurveTo(): void {},
    fill(): void {
      if (pen.globalAlpha > 0) used.push(...read(pen.fillStyle));
    },
    stroke(): void {
      if (pen.globalAlpha > 0) used.push(...read(pen.strokeStyle));
    },
    fillRect(): void {
      if (pen.globalAlpha > 0) used.push(...read(pen.fillStyle));
    },
    createLinearGradient(): object {
      const gradient = {
        addColorStop(_at: number, colour: string): void {
          stops.get(gradient)!.push(colour);
        },
      };
      stops.set(gradient, []);
      return gradient;
    },
  };
  return { pen: pen as unknown as Pen, used };
}

/** A colour as the canvas reads it, with any alpha dropped — alpha over a darker land only darkens. */
function asHex(colour: string): string {
  if (colour.startsWith('#')) return colour;
  const parts = colour.match(/[\d.]+/g)!.slice(0, 3).map((v) => Number(v));
  return `#${parts.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

describe('0351 — Rime Shelf is ice', () => {
  it('THE FLOOR UNDER THE ICE: nothing the shelf or the bergs paint is brighter than the palest ice the place states', () => {
    const theme = THEMES.rime;
    const land = theme.land;
    expect(land, 'Rime Shelf states no colours for its ice, so the floor has nothing to hold').toBeDefined();
    const painters = [GROUND_OF.rime, RANGE_OF.rime];
    expect(painters.every((p) => p !== null), 'Rime Shelf draws no ground or no bergs').toBe(true);
    for (const name of Object.keys(PALETTES) as PaletteName[]) {
      const lights = land![name];
      const ceiling = Math.max(...Object.values(lights).map((c) => luminance(c)));
      let seen = 0;
      for (const paint of painters) {
        const { pen, used } = recordingPen();
        paint!(pen, theme.ground![name], theme.space[name], theme.glow[name], 480, lights);
        seen += used.length;
        for (const colour of used) {
          const lum = luminance(asHex(colour));
          expect(
            lum,
            `Rime Shelf's ${name} ice paints ${colour} at luminance ${lum.toFixed(4)}, over the palest stated ice at ` +
              `${ceiling.toFixed(4)} — a colour the land guard never sees, over the fight`,
          ).toBeLessThanOrEqual(ceiling + 1e-9);
        }
      }
      expect(seen, `nothing was painted on the ${name} palette, so this measured nothing`).toBeGreaterThan(20);
    }
  });
});
