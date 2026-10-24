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
import { carMounts, drawKind, paintMount } from '../src/render/bake.ts';
import { SHIP_BOX, SPRITE_EXTENT, type SpriteKind } from '../src/content/sprites.ts';
import { SHIPS, SHIP_KINDS } from '../src/content/ships.ts';
import { WEAPONS } from '../src/content/weapons.ts';
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

/*
  ── 0630: THE GUNS ARE NOT BLOCKS ──────────────────────────────────────────────────────────────────

  `docs/decisions/0630-the-guns-are-not-blocks.md` — the guns half of the same line. Each gun's new shape held in
  its ship's drawn silhouette at the fight's camera, at points where the block it was and the shape it is disagree:
  the estate's launcher a drum (the block's top corners are sky, its crown is not); the duck's marker with a grip
  under it and its box's front corner taken in; the fighter's pulse with a brake wider than the barrels behind it.
*/
describe('0630 — the guns are not blocks', () => {
  /**
   * A ship's drawn silhouette at the fight's camera, asked whether a point in its frame is on it.
   *
   * ⚠️ **0662: THE HULL, AND A HANGING MOUNT UNDER IT.** The fighter lays its gun down before its hull since, and
   * the hull's outline no longer carries the gun's shape — what the player sees past the nose is the mount's own.
   * So a ship whose row hangs its gun is its first pass after the mount's, or any of the mount's passes.
   */
  function hullOf(kind: SpriteKind): { solid: (x: number, y: number) => boolean } {
    const size = SPRITE_EXTENT[kind] * DESKTOP.scale;
    const { pen, trace } = tracingPen();
    drawKind(pen, kind, PALETTES[DEFAULT_PALETTE], size, 'approach');
    const ship = SHIP_KINDS.find((k) => k === kind);
    const hung = ship !== undefined && SHIPS[ship].hang === 'under' ? tracedMount(ship, size) : [];
    const outlines = [trace.passes[hung.length]!, ...hung].map((pass) => edgeIndex(pass));
    // `x`, `y` in the box's radius, as the ship's frame draws.
    return { solid: (x, y) => outlines.some((outline) => outline.inside([size / 2 + x * size * 0.42, size / 2 + y * size * 0.42])) };
  }
  /** The passes `ship`'s own gun's mount paints in a box `size` across — 0662. */
  function tracedMount(ship: (typeof SHIP_KINDS)[number], size: number): ReturnType<typeof tracingPen>['trace']['passes'] {
    const { pen, trace } = tracingPen();
    paintMount(pen, { half: size / 2, r: size * 0.42 }, PALETTES[DEFAULT_PALETTE], SHIPS[ship].weapon, ship);
    return trace.passes;
  }
  /** A point in the cars' side-on frame (`inBox` about (0, 1), 0.062 a unit) in the box's radius. */
  const side = (x: number, y: number): [number, number] => [x * 0.062, (y - 1) * 0.062];

  it('draws the estate’s launcher as a drum, the duck’s marker with a grip, and the fighter’s pulse with a brake', () => {
    const estate = hullOf('estate');
    expect(estate.solid(...side(14.2, -1.7)), 'the estate has no drum over its star').toBe(true);
    for (const x of [12.75, 15.75]) expect(estate.solid(...side(x, -1.5)), `the estate's launcher is a block — its corner at ${x} is solid`).toBe(false);
    const duck = hullOf('duck');
    expect(duck.solid(...side(13.55, 3.5)), 'the duck’s marker has no grip under it').toBe(true);
    expect(duck.solid(...side(15.95, 2.35)), 'the duck’s marker is a box — its front corner under the barrel is solid').toBe(false);
    const fighter = hullOf('fighter');
    const row = SHIPS.fighter;
    const r = SHIP_BOX * 0.42;
    const mouth = row.hardpoint.along / r + (WEAPONS.pulse.mount.top.along / r) * row.mountScale;
    const flare = 0.125 * row.mountScale;
    for (const y of [-flare, flare]) {
      expect(fighter.solid(mouth - 0.09 * row.mountScale, y), 'the fighter’s pulse has no brake at its mouth').toBe(true);
      // Just behind the brake, over the bare barrels: further back is the gun's pad and the nose, both wider.
      expect(fighter.solid(mouth - 0.22 * row.mountScale, y), 'the fighter’s pulse is as wide behind its brake as at it — a block').toBe(false);
    }
  });
});
