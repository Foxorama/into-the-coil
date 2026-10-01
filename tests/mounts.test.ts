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
import { SHIPS, type ShipKind } from '../src/content/ships.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { SHIP_BOX } from '../src/content/sprites.ts';
import { reset } from '../src/sim/entity.ts';
import { carMounts } from '../src/render/bake.ts';
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
    for (const ship of ['firebird', 'estate'] as const) {
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
      // On the roof: every turret is above the hood gun, which is above the centreline.
      expect(row.muzzle.across, `${ship}: the hood gun is under the centreline`).toBeLessThan(0);
      for (const tube of row.tubes[2]) expect(tube.across, `${ship}: a tube is lower than the hood`).toBeLessThan(row.muzzle.across);
    }
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
