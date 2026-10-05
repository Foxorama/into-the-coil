/**
 * Each ship fires from its own guns — `docs/decisions/0448-each-ship-fires-from-its-own-guns.md`.
 *
 * Played: *"the firebird and station wagon don't fire weapons from the actual gun on the hood"*, the
 * lightning *"should fire from the gun on the hood of the station wagon"*, and the missiles *"should fire
 * from the tubes on top and then go into the two paths they use now."* Every shot left three units ahead
 * of the centre on the centreline, which on a car seen side-on is the air in front of its door.
 *
 * ⚠️ **TWO HALVES, BECAUSE THE FACT HAS TWO OWNERS.** Where a gun is DRAWN is the bake's
 * (`carMounts` in `src/render/bake.ts`), and where a shot LEAVES is the ship's row
 * (`src/content/ships.ts`), which may not import the bake. So the rows are held to the drawing here, in
 * world units, and the frame is held to the rows — a turret moved in the drawing without its row, or a
 * frame that went back to the centreline, each turns this red.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { CADDIE_DISC, SHIPS, type ShipKind } from '../src/content/ships.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { SHIP_BOX, SPRITE_EXTENT } from '../src/content/sprites.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { reset } from '../src/sim/entity.ts';
import { caddieMounts, carMounts, drawKind } from '../src/render/bake.ts';
import { tracingPen } from './paths.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/** A box's radius in world units: a sprite's frame puts it at 0.42 of the extent. */
const R = SHIP_BOX * 0.42;

/** Closer than this, in world units, is the same place: a fifth of the smallest mark a car wears. */
const NEAR = 0.05;

/** A world flying `ship` with `tubes` launchers fitted, the gun and the tubes both about to fire. */
function flying(ship: ShipKind, tubes: number) {
  const built = playableWorld(NO_LEVEL);
  const w = built.world;
  w.shipRow = SHIPS[ship];
  w.weapon = weaponFor(w.shipRow, Array.from({ length: tubes }, () => 'missile' as const));
  w.fireIn = 1;
  w.missileIn = 1;
  return { w, frame: new GameFrame(w) };
}

describe('0448 — each ship fires from its own guns', () => {
  it('THE ROWS ARE THE DRAWING: each car’s muzzle and roof tubes are where its bake draws them', () => {
    // And the Thunderbolt, drawn side-on in the same frame since 0539 — its pods on the rack, its ball on the crown.
    for (const ship of ['firebird', 'estate', 'thunderbolt'] as const) {
      const drawn = carMounts(ship);
      const row = SHIPS[ship];
      expect(row.muzzle.along, `${ship}: the row's gun is not the hood gun drawn`).toBeCloseTo(drawn.muzzle[0] * R, 1);
      expect(row.muzzle.across, `${ship}: the row's gun is not the hood gun drawn`).toBeCloseTo(drawn.muzzle[1] * R, 1);
      for (const stage of [1, 2] as const) {
        const tubes = row.tubes[stage];
        expect(tubes.length, `${ship}: ${stage} tubes fitted, and the drawing has ${drawn.tubes[stage]!.length}`).toBe(drawn.tubes[stage]!.length);
        tubes.forEach((tube, i) => {
          const [x, y] = drawn.tubes[stage]![i]!;
          expect(Math.hypot(tube.along - x * R, tube.across - y * R), `${ship}: tube ${i} of ${stage} is off its drawn turret`).toBeLessThan(NEAR);
        });
      }
      // On the roof: every turret is above the hood gun, which is above the centreline. A chopper has
      // no roof — its pods ride the rack over the rear fender, under its rider — so this is the cars'.
      if (ship === 'thunderbolt') continue;
      expect(row.muzzle.across, `${ship}: the hood gun is under the centreline`).toBeLessThan(0);
      for (const tube of row.tubes[2]) expect(tube.across, `${ship}: a tube is lower than the hood`).toBeLessThan(row.muzzle.across);
    }
  });

  it('0461 — AND THE SAUCER’S: its gun is the ray gun’s emitter, and its tubes the warheads in the pods off its sides', () => {
    /*
      *"can we have the missile turrets sticking out from the sides instead of weirdly placed on it?"* The
      pods are drawn off the disc's sides on pylons (`caddieMounts`), so the row is held to them on the
      cars' terms; and they ARE off its sides — further out than the disc reaches, either side of it.
    */
    const drawn = caddieMounts();
    const row = SHIPS.caddie;
    expect(row.muzzle.along, 'caddie: the row’s gun is not the emitter drawn').toBeCloseTo(drawn.muzzle[0] * R, 1);
    expect(row.muzzle.across, 'caddie: the row’s gun is not the emitter drawn').toBeCloseTo(drawn.muzzle[1] * R, 1);
    for (const stage of [1, 2] as const) {
      const tubes = row.tubes[stage];
      expect(tubes.length, `caddie: ${stage} tubes fitted, and the drawing has ${drawn.tubes[stage]!.length}`).toBe(drawn.tubes[stage]!.length);
      tubes.forEach((tube, i) => {
        const [x, y] = drawn.tubes[stage]![i]!;
        expect(Math.hypot(tube.along - x * R, tube.across - y * R), `caddie: tube ${i} of ${stage} is off its drawn pod`).toBeLessThan(NEAR);
        expect(Math.abs(tube.across), `caddie: tube ${i} of ${stage} is on the disc rather than off its side`).toBeGreaterThan(CADDIE_DISC * R);
      });
    }
    expect(row.tubes[2][0]!.across * row.tubes[2][1]!.across, 'caddie: both pods hang off one side').toBeLessThan(0);
  });

  it('THE GUN: every ship’s first shot leaves its own muzzle — the arc’s first link too', () => {
    for (const ship of Object.keys(SHIPS) as ShipKind[]) {
      const { w, frame } = flying(ship, 0);
      // Something in the arc's reach, so its first link is a strike and starts where the gun is.
      const enemy = w.enemies.spawn()!;
      reset(enemy, w.ship.along + 20, w.ship.across, { ...ENEMIES.turret, health: 999 }, w.enemyKinds.turret);
      enemy.velAlong = w.scrollPerStep;
      const muzzle = w.shipRow.muzzle;
      frame.step();
      if (w.weapon.flight === 'chain') {
        expect(w.bolts.size, `${ship}: the arc drew no link`).toBeGreaterThan(0);
        const link = w.bolts.at(0);
        const fromAlong = link.prevAlong + link.fromAlong;
        const fromAcross = link.prevAcross + link.fromAcross;
        expect(Math.hypot(fromAlong - (w.ship.prevAlong + muzzle.along), fromAcross - (w.ship.prevAcross + muzzle.across)), `${ship}: the lightning left elsewhere than its rod`).toBeLessThan(NEAR * 4);
      } else {
        expect(w.playerShots.size, `${ship}: the gun did not fire`).toBeGreaterThan(0);
        for (let i = 0; i < w.playerShots.size; i++) {
          const shot = w.playerShots.at(i);
          expect(Math.abs(shot.prevAcross - (w.ship.prevAcross + muzzle.across)), `${ship}: shot ${i} left off its gun's line`).toBeLessThan(NEAR);
          expect(Math.abs(shot.prevAlong - (w.ship.prevAlong + muzzle.along)), `${ship}: shot ${i} left ahead of or behind its gun`).toBeLessThan(NEAR);
        }
      }
    }
  });

  it('THE TUBES: a missile leaves its own tube, and a pair still opens to the top and the bottom path', () => {
    for (const ship of Object.keys(SHIPS) as ShipKind[]) {
      const { w, frame } = flying(ship, 2);
      expect(w.weapon.launchers, `${ship}: two missiles fitted is not two tubes`).toBe(2);
      frame.step();
      expect(w.missiles.size, `${ship}: the tubes did not fire`).toBe(2);
      const tubes = w.shipRow.tubes[2];
      for (let i = 0; i < 2; i++) {
        const m = w.missiles.at(i);
        expect(Math.hypot(m.prevAlong - (w.ship.prevAlong + tubes[i]!.along), m.prevAcross - (w.ship.prevAcross + tubes[i]!.across)), `${ship}: missile ${i} left elsewhere than its tube`).toBeLessThan(NEAR);
      }
      // And out to the two paths: the first above the ship, the second below, however far each had to go.
      w.missileIn = 1e9;
      for (let s = 0; s < 40; s++) frame.step();
      expect(w.missiles.at(0).across, `${ship}: the first missile did not open to the top path`).toBeLessThan(w.ship.across - 3);
      expect(w.missiles.at(1).across, `${ship}: the second missile did not open to the bottom path`).toBeGreaterThan(w.ship.across + 3);
    }
  });
});

describe('0493 — the ray gun hangs under the lip, and its muzzle is a ring', () => {
  /*
    *"On the little caddie the raygun sits above the ship instead of under it, and it's weird that it
    has a small pointed end, but fires a large circular projectile."* Two claims about the picture, held
    in world units off the bake's own trace: the emitter is drawn before the disc's face, so the face
    covers it to the rim; and the muzzle is a dish the size of the smallest ring it fires.
  */
  const unit = 10;
  /** Every filled mark of a kind's bake, as circles in world units about the tile's centre: where, and how far out. */
  const circlesOf = (kind: 'caddie'): { x: number; y: number; r: number }[] => {
    const size = SPRITE_EXTENT[kind] * unit;
    const { pen, trace } = tracingPen();
    drawKind(pen, kind, PALETTES[DEFAULT_PALETTE], size, 'approach');
    return trace.passes.map((pass) => {
      const points = pass.subpaths[0] ?? [];
      const x = points.reduce((sum, p) => sum + p[0], 0) / Math.max(1, points.length);
      const y = points.reduce((sum, p) => sum + p[1], 0) / Math.max(1, points.length);
      const r = Math.max(0, ...points.map((p) => Math.hypot(p[0] - x, p[1] - y)));
      return { x: (x - size / 2) / unit, y: (y - size / 2) / unit, r: r / unit };
    });
  };

  it('UNDER THE LIP: the emitter is painted before the disc’s face, so the face covers it to the rim', () => {
    const marks = circlesOf('caddie');
    const rim = CADDIE_DISC * R;
    // The face: the biggest mark centred on the saucer. The housing: a mark centred inside the rim, ahead
    // of the dome, that reaches out past it.
    const face = marks.findIndex((m) => Math.hypot(m.x, m.y) < 0.1 && m.r > rim * 0.9);
    const housings = marks.flatMap((m, i) => (m.x > rim * 0.5 && m.x < rim && Math.abs(m.y) < 0.05 && m.x + m.r > rim ? [i] : []));
    expect(face, 'no face is painted on the disc').toBeGreaterThanOrEqual(0);
    expect(housings.length, 'no emitter housing reaches out past the rim').toBeGreaterThan(0);
    for (const housing of housings) {
      expect(housing, 'the emitter is painted over the disc, so it sits on top of the saucer').toBeLessThan(face);
    }
  });

  it('A RING IN, A RING OUT: the muzzle is a dish the size of the smallest ring the gun fires', () => {
    // The ray's smallest ring: its innermost band, a mark of two circles about the shot's centre,
    // measured down its middle.
    const size = SPRITE_EXTENT.ray * unit;
    const { pen, trace } = tracingPen();
    drawKind(pen, 'ray', PALETTES[DEFAULT_PALETTE], size, 'approach');
    const ringRadii = trace.passes
      .filter((pass) => pass.subpaths.length === 2)
      .map((pass) => {
        const radius = (sub: readonly (readonly [number, number])[]): number =>
          Math.max(...sub.map((p) => Math.hypot(p[0] - size / 2, p[1] - size / 2))) / unit;
        return (radius(pass.subpaths[0]!) + radius(pass.subpaths[1]!)) / 2;
      });
    expect(ringRadii.length, 'the ray is drawn with no rings').toBeGreaterThan(0);
    const smallest = Math.min(...ringRadii);
    // The dish: the biggest mark centred out past the rim on the gun's line, whose front is the muzzle.
    const muzzle = SHIPS.caddie.muzzle.along;
    const dish = circlesOf('caddie')
      .filter((m) => m.x > CADDIE_DISC * R && Math.abs(m.y) < 0.05 && Math.abs(m.x + m.r - muzzle) < 0.15)
      .sort((a, b) => b.r - a.r)[0];
    expect(dish, 'no dish is drawn at the muzzle').toBeDefined();
    expect(dish!.r / smallest, `the muzzle is ${dish!.r.toFixed(2)} units across its mouth and the smallest ring ${smallest.toFixed(2)}`).toBeGreaterThan(0.85);
    expect(dish!.r / smallest, `the muzzle is ${dish!.r.toFixed(2)} units across its mouth and the smallest ring ${smallest.toFixed(2)}`).toBeLessThan(1.15);
  });
});
