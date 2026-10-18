/**
 * A LAUNCHER AND NOT A BOX — `docs/decisions/0629-a-launcher-and-not-a-box.md`.
 *
 * Asked: *"update boring blocky gun + missiles with nice art."* Each car's tubes were boxes the turret's whole
 * height sat on the roof; asked, the player chose one launcher a stage, a sleek pod lying along the roof on a
 * pylon. Held in the drawn silhouette, in CSS pixels at the camera the fight ships (0027): from the missile's
 * nose in its mouth, the launcher runs back at least twice as long as it is tall, and fore and aft of its pylon
 * the sky shows between it and the roof — which no box sat on a roof has.
 */

import { describe, expect, it } from 'vitest';
import { carMounts, drawKind } from '../src/render/bake.ts';
import { SPRITE_EXTENT, type SpriteKind } from '../src/content/sprites.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { viewOf } from '../src/sim/camera.ts';
import { edgeIndex, tracingPen, type Point } from './paths.ts';

const DESKTOP = viewOf(1280, 720);

/** The cars whose tubes stand on a launcher on their roof or back. */
const CARS = ['firebird', 'estate', 'thunderbolt', 'duck'] as const;

/** How fine the walks below step, in CSS pixels. */
const STEP = 0.1;

describe('0629 — each car’s tubes are a launcher, not a box', () => {
  it('runs back from the missile’s nose twice as long as it is tall, with sky under it either side of its pylon', () => {
    for (const car of CARS) {
      for (const stage of [1, 2] as const) {
        const kind = `${car}${stage === 1 ? 'Tube' : 'Tubes'}` as SpriteKind;
        const size = SPRITE_EXTENT[kind] * DESKTOP.scale;
        const { pen, trace } = tracingPen();
        drawKind(pen, kind, PALETTES[DEFAULT_PALETTE], size, 'approach');
        const hull = edgeIndex(trace.passes[0]!);
        const inside = (p: Point): boolean => hull.inside(p);
        // The launcher's middle line, through the missiles' noses in its face (`carMounts`, which the rows hold).
        const noses = carMounts(car).tubes[stage]!;
        const nx = size / 2 + noses[0]![0] * size * 0.42;
        const ny = size / 2 + (noses.reduce((sum, [, y]) => sum + y, 0) / noses.length) * size * 0.42;
        const at = `${kind}`;
        expect(inside([nx, ny]), `${at}: the missile's nose is not in the drawn launcher`).toBe(true);
        // Back along the middle line to its tail.
        let tail = nx;
        while (inside([tail - STEP, ny])) tail -= STEP;
        const long = nx - tail;
        // A sixth of the way in from each end: up to its back, down to its belly, on down through the sky to the roof.
        for (const x of [tail + long / 6, nx - long / 6]) {
          let back = ny;
          while (inside([x, back - STEP])) back -= STEP;
          let belly = ny;
          while (inside([x, belly + STEP])) belly += STEP;
          let roof = belly + STEP;
          while (!inside([x, roof]) && roof < size) roof += STEP;
          const tall = belly - back;
          expect(long, `${at}: the launcher is ${long.toFixed(1)} px long and ${tall.toFixed(1)} px tall — a box, not a pod`).toBeGreaterThanOrEqual(2 * tall);
          expect(roof - belly, `${at}: no sky between the launcher and the roof at ${(x - tail).toFixed(1)} px from its tail — it sits on the roof like a box`).toBeGreaterThan(0.5);
          expect(roof, `${at}: nothing under the launcher at ${(x - tail).toFixed(1)} px from its tail`).toBeLessThan(size);
        }
      }
    }
  });
});
