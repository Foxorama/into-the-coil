/**
 * The Toxic Mire is a swamp — `docs/decisions/0352-the-mire-is-a-swamp.md`.
 *
 * Asked for: *"Overgrowth ceiling needs to be raised and to be an actual ceiling, the background needs
 * to be swampy trees and murk and the ground needs to be vibrant glowing acid pools spitting bubbles."*
 *
 * ⚠️ **WHAT IS HELD HERE IS THE FLOOR UNDER THE ACID, IN THE PLAYER'S TERMS.** The pools are a lit
 * area low in the lane, where shots are read. 0347's guard holds every colour a place STATES for its
 * land against every gameplay ink; the Mire paints far more than it states, and that guard covers
 * them only if no AREA it paints is brighter than the brightest stated colour. That is the claim.
 *
 * ⚠️ **AREAS, NOT LINES.** The shoreline has been a bright stroke in the place's glow since 0221, and
 * the pools' ripples are thin strokes in it too — lines a bullet crosses in a frame rather than a field
 * it sits on. They are recorded separately and not held here; 0352 says so.
 */

import { describe, expect, it } from 'vitest';

import { PALETTES, type PaletteName } from '../src/content/palette.ts';
import { THEMES } from '../src/content/themes.ts';
import { GROUND_OF, RANGE_OF, type Pen } from '../src/render/bake.ts';
import { luminance } from './contrast.ts';

/** Every colour a painter filled an area with — fills, rects and gradient stops — and every line. */
function recordingPen(): { pen: Pen; areas: string[]; lines: string[] } {
  const areas: string[] = [];
  const lines: string[] = [];
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
      if (pen.globalAlpha > 0) areas.push(...read(pen.fillStyle));
    },
    fillRect(): void {
      if (pen.globalAlpha > 0) areas.push(...read(pen.fillStyle));
    },
    stroke(): void {
      if (pen.globalAlpha > 0) lines.push(...read(pen.strokeStyle));
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
  return { pen: pen as unknown as Pen, areas, lines };
}

/** A colour as the canvas reads it, with any alpha dropped — alpha over a darker land only darkens. */
function asHex(colour: string): string {
  if (colour.startsWith('#')) return colour;
  const parts = colour.match(/[\d.]+/g)!.slice(0, 3).map((v) => Number(v));
  return `#${parts.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

describe('0352 — the Mire is a swamp', () => {
  it('THE FLOOR UNDER THE ACID: no area the swamp paints is brighter than the brightest colour it states', () => {
    const theme = THEMES.mire;
    const land = theme.land;
    expect(land, 'The Toxic Mire states no colours for its land, so the floor has nothing to hold').toBeDefined();
    const painters = [GROUND_OF.mire, RANGE_OF.mire];
    expect(painters.every((p) => p !== null), 'The Toxic Mire draws no ground or no swamp behind it').toBe(true);
    for (const name of Object.keys(PALETTES) as PaletteName[]) {
      const lights = land![name];
      const ceiling = Math.max(...Object.values(lights).map((c) => luminance(c)));
      let seen = 0;
      for (const paint of painters) {
        const { pen, areas } = recordingPen();
        paint!(pen, theme.ground![name], theme.space[name], theme.glow[name], 480, lights);
        seen += areas.length;
        for (const colour of areas) {
          const lum = luminance(asHex(colour));
          expect(
            lum,
            `The Toxic Mire's ${name} land fills an area in ${colour} at luminance ${lum.toFixed(4)}, over its ` +
              `brightest stated colour at ${ceiling.toFixed(4)} — a field the land guard never sees, under the fight`,
          ).toBeLessThanOrEqual(ceiling + 1e-9);
        }
      }
      expect(seen, `nothing was filled on the ${name} palette, so this measured nothing`).toBeGreaterThan(20);
    }
  });
});
