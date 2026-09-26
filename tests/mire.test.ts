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
import { THEMES, type ThemeKind } from '../src/content/themes.ts';
import { POOLS_OF } from '../src/content/pools.ts';
import { SHOTS } from '../src/content/shots.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { DIFFICULTIES } from '../src/content/difficulty.ts';
import { MIRE_ACID_CAPS, MIRE_BANK_CAPS, MIRE_BED, SPRITE, SPRITE_EXTENT } from '../src/content/sprites.ts';
import { viewOf } from '../src/sim/camera.ts';
import type { Corridor } from '../src/sim/corridor.ts';
import { paintScene } from '../src/render/scene.ts';
import { screenX, screenY, type Surface } from '../src/render/surface.ts';
import { skyFor } from '../src/app/mount.ts';
import { corridorFor } from '../src/app/frame.ts';
import { BANK_OF, GROUND_OF, RANGE_OF, type GroundArt, type Pen } from '../src/render/bake.ts';
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
    const painters: (GroundArt | null)[] = [GROUND_OF.mire, RANGE_OF.mire];
    expect(painters.every((p) => p !== null), 'The Toxic Mire draws no ground or no swamp behind it').toBe(true);
    /*
      ⚠️ **AND THE BANK — 0383**, which is where the pools went when the ground became a wall: its caps
      at every rise, its mud and its bed. The floor under the acid is the same floor wherever it is
      baked, and a guard that watched only the tile the pools left would be watching the canopy.
    */
    const bank = BANK_OF.mire;
    expect(bank, 'The Toxic Mire bakes no bank').not.toBeNull();
    const steepest = (MIRE_BANK_CAPS.length - 1) / 2;
    const banked: GroundArt[] = [
      (pen, ground, _sky, glow, size, lights) => bank!.fill(pen, size, ground, glow, lights),
      ...MIRE_BANK_CAPS.map((_, i): GroundArt => (pen, ground, _sky, glow, size, lights) => bank!.cap(pen, size, i - steepest, ground, glow, lights)),
      ...MIRE_BED.map((_, i): GroundArt => (pen, ground, _sky, glow, size, lights) => bank!.bed(pen, size, i, MIRE_BED.length, ground, glow, lights)),
      // And the acid the hydra stands in — 0384: the bank's caps with acid under the shore.
      ...MIRE_ACID_CAPS.map((_, i): GroundArt => (pen, ground, _sky, glow, size, lights) => bank!.pool(pen, size, i - steepest, ground, glow, lights)),
    ];
    for (const name of Object.keys(PALETTES) as PaletteName[]) {
      const lights = land![name];
      const ceiling = Math.max(...Object.values(lights).map((c) => luminance(c)));
      let seen = 0;
      for (const paint of [...painters, ...banked]) {
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

  /**
   * The corridor a level in `place` is flown down, or `null` — the floor the pools lie in since 0383.
   * Laid at nought, as a run's first level is.
   */
  function floorOf(place: ThemeKind): Corridor | null {
    const kind = LEVEL_KINDS.find((k) => LEVELS[k].theme === place);
    return kind === undefined ? null : corridorFor(LEVELS[kind], 0, DIFFICULTIES.savior);
  }

  /** Every bubble the place's scene draws with the camera at `camera` and the sim at `time`, in world units. */
  function bubblesAt(place: ThemeKind, camera: number, time: number): { along: number; across: number }[] {
    const surface = new Recorder();
    paintScene(surface, VIEW, [], camera, 0, skyFor(place), null, [], 0, null, 0, time, floorOf(place), POOLS_OF[place]);
    const x0 = screenX(VIEW, 0, 0);
    const y0 = screenY(VIEW, 0, 0);
    return surface.blits
      .filter((b) => BUBBLES.includes(b.sprite))
      .map((b) => ({ along: (b.x - x0) / VIEW.scale, across: (b.y - y0) / VIEW.scale }));
  }

  it('THE ASK, IN LANE UNITS: every bubble rises from one of the pools the bed was baked with', () => {
    /*
      The pools are in the bed's bitmaps and the bubbles are blitted over them every frame, so the two
      agree only if both read `POOLS_OF` and the painter puts a bubble where the bed it rides is. Held
      at many camera positions and moments: each bubble lies over some pool's span along, and between
      that pool's surface and its rise above it.

      ⚠️ **ON THE WORLD'S GRID SINCE 0383**, from the corridor's own start: the pools were in the ground
      tile at 0.45 of the camera, and the ground they lie in bites now, so it moves with the world.
    */
    const pools = POOLS_OF.mire!;
    const floor = floorOf('mire');
    expect(floor?.beds.length ?? 0, 'the Mire lies in no bed, so nothing bubbles').toBeGreaterThan(0);
    const span = floor!.bedExtent * floor!.beds.length;
    let seen = 0;
    const strays: string[] = [];
    for (let camera = 0; camera < 1200; camera += 37) {
      for (const time of [0, 41, 97, 150]) {
        const offset = (((camera - floor!.from) % span) + span) % span;
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

  it('and the bed is baked with those same pools — the other half of the agreement', () => {
    /*
      The guard above holds the bubbles to `POOLS_OF`; this holds the baked pools to it, so the two are
      one set of pools and not two that happen to be written alike. Each spot's lens starts at its own
      left edge and surface, in the pixels of whichever half of the bed it begins in — the ground tile's
      own fractions, scaled into a tile the lane's width (0383).
    */
    const size = 480;
    const parts = MIRE_BED.length;
    const starts: { part: number; x: number; y: number }[] = [];
    for (let part = 0; part < parts; part++) {
      const { pen, trace } = tracingPen();
      BANK_OF.mire!.bed(pen, size, part, parts, '#101010', '#80a040', THEMES.mire.land!.vivid);
      for (const pass of trace.passes) {
        const p = pass.subpaths[0]?.[0];
        if (p !== undefined) starts.push({ part, x: p[0], y: p[1] });
      }
    }
    for (const spot of POOLS_OF.mire!.spots) {
      const x = spot.at * size * parts;
      const part = Math.floor(x / size);
      const y = spot.top * size * 2 - size / 2;
      const found = starts.some((p) => p.part === part && Math.abs(p.x - (x - part * size)) < 0.01 && Math.abs(p.y - y) < 0.01);
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

  /*
    ── *AND ONLY A PLACE THAT STATES POOLS BUBBLES* STOOD HERE, AND 0383 DELETED IT ───────────────────

    It held that the Mire's pools were not handed to every planet's ground layer. No sky layer holds
    pools since 0383: they lie in the bed under the Mire's bank, and a bubble is painted only with a
    floor that has a bed, which no other place lays. Nothing a change could do would redden it, so it
    went with its probe rather than staying green over nothing — 0192.
  */
});
