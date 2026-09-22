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
import { THEMES, THEME_KINDS, type ThemeKind } from '../src/content/themes.ts';
import { POOLS_OF } from '../src/content/pools.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE, SPRITE_EXTENT } from '../src/content/sprites.ts';
import { viewOf } from '../src/sim/camera.ts';
import { paintScene } from '../src/render/scene.ts';
import { screenX, screenY, type Surface } from '../src/render/surface.ts';
import { skyFor } from '../src/app/mount.ts';
import { GROUND_OF, RANGE_OF, type Pen } from '../src/render/bake.ts';
import { luminance } from './contrast.ts';
import { tracingPen } from './paths.ts';

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

describe('0353 — the acid bubbles', () => {
  const VIEW = viewOf(1920, 1080);
  const BUBBLES: readonly number[] = [SPRITE.bubble, SPRITE.bubblePop];

  class Recorder implements Surface {
    blits: { sprite: number; x: number; y: number; scale: number }[] = [];
    clear(): void {}
    bolt(): void {}
    blit(sprite: number, x: number, y: number, scale: number): void {
      this.blits.push({ sprite, x, y, scale });
    }
  }

  /** Every bubble drawn over the place's sky with the camera at `camera` and the sim at `time`, in world units. */
  function bubblesAt(place: ThemeKind, camera: number, time: number): { along: number; across: number }[] {
    const surface = new Recorder();
    paintScene(surface, VIEW, [], camera, 0, skyFor(place), null, [], 0, null, 0, time);
    const x0 = screenX(VIEW, 0, 0);
    const y0 = screenY(VIEW, 0, 0);
    return surface.blits
      .filter((b) => BUBBLES.includes(b.sprite))
      .map((b) => ({ along: (b.x - x0) / VIEW.scale, across: (b.y - y0) / VIEW.scale }));
  }

  it('THE ASK, IN LANE UNITS: every bubble rises from one of the pools the ground was baked with', () => {
    /*
      The pools are in the ground's bitmap and the bubbles are blitted over it every frame, so the two
      agree only if both read `POOLS_OF` and the painter puts a bubble where the tile it rides is. Held
      at many camera positions and moments: each bubble lies over some pool's span along, and between
      that pool's surface and its rise above it.
    */
    const pools = POOLS_OF.mire!;
    const ground = skyFor('mire').find((layer) => layer.pools !== undefined);
    expect(ground, 'the Mire\'s sky carries no pools, so nothing bubbles').toBeDefined();
    const span = ground!.extent;
    let seen = 0;
    const strays: string[] = [];
    for (let camera = 0; camera < 1200; camera += 37) {
      for (const time of [0, 41, 97, 150]) {
        const offset = (((camera * ground!.depth) % span) + span) % span;
        for (const bubble of bubblesAt('mire', camera, time)) {
          seen++;
          const inTile = ((((bubble.along + offset) % span) + span) % span) / span;
          const home = pools.spots.some((spot) => {
            const surface = VIEW.acrossSpan / 2 + (spot.top - 0.5) * span;
            return (
              inTile >= spot.at - 1e-6 &&
              inTile <= spot.at + spot.wide + 1e-6 &&
              bubble.across <= surface + 1e-6 &&
              bubble.across >= surface - pools.bubbles.rise - 1e-6
            );
          });
          if (!home) strays.push(`camera ${camera}, step ${time}: a bubble at along ${bubble.along.toFixed(1)}, across ${bubble.across.toFixed(1)}`);
        }
      }
    }
    expect(seen, 'no bubble was ever drawn, so this measured nothing').toBeGreaterThan(100);
    expect(strays.slice(0, 5).join('\n'), `${strays.length} bubbles drawn off every pool`).toBe('');
  });

  it('and the ground is baked with those same pools — the other half of the agreement', () => {
    /*
      The guard above holds the bubbles to `POOLS_OF`; this holds the baked pools to it, so the two are
      one set of pools and not two that happen to be written alike. Each spot's lens starts at its own
      left edge and surface, in the tile's pixels.
    */
    const size = 480;
    const { pen, trace } = tracingPen();
    GROUND_OF.mire!(pen, '#101010', '#405060', '#80a040', size, THEMES.mire.land!.vivid);
    const starts = trace.passes.map((pass) => pass.subpaths[0]?.[0]).filter((p) => p !== undefined);
    for (const spot of POOLS_OF.mire!.spots) {
      const found = starts.some((p) => Math.abs(p![0] - spot.at * size) < 0.01 && Math.abs(p![1] - spot.top * size) < 0.01);
      expect(found, `no pool is baked at the spot ${spot.at} / ${spot.top} the bubbles rise from`).toBe(true);
    }
  });

  it('the camera stops and the pools do not: a bubble rides the sim\'s clock', () => {
    const early = bubblesAt('mire', 400, 10);
    const later = bubblesAt('mire', 400, 60);
    expect(early.length, 'nothing was bubbling at 400').toBeGreaterThan(0);
    expect(JSON.stringify(later), 'the same camera fifty steps later drew the same bubbles — they are frozen').not.toBe(JSON.stringify(early));
  });

  it('a bubble and its pop are both under the smallest shot, because a round mark a bullet\'s size is a bullet', () => {
    const smallestThreat = Math.min(...Object.values(SHOTS).map((row) => row.radius)) * 2;
    for (const kind of ['bubble', 'bubblePop'] as const) {
      expect(SPRITE_EXTENT[kind], `${kind} is ${SPRITE_EXTENT[kind]} units against the smallest shot at ${smallestThreat}`).toBeLessThan(smallestThreat);
    }
  });

  it('and only a place that states pools bubbles', () => {
    for (const place of THEME_KINDS) {
      if (POOLS_OF[place] !== null) continue;
      expect(bubblesAt(place, 400, 60).length, `${place} states no pools and draws bubbles`).toBe(0);
    }
  });
});
