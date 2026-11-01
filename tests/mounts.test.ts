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
import { caddieMounts, carMounts, drawKind, paintRaygunSide, paintRaygunSideHalo } from '../src/render/bake.ts';
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
  w.weapon = weaponFor(w.shipRow, Array.from({ length: tubes }, () => 'straight' as const));
  w.fireIn = 1;
  w.missileIn = 1;
  return { w, frame: new GameFrame(w) };
}

describe('0448 — each ship fires from its own guns', () => {
  it('THE ROWS ARE THE DRAWING: each car’s muzzle and roof tubes are where its bake draws them', () => {
    // And the Thunderbolt, drawn side-on in the same frame since 0546 — its pods on the rack, its ball on the crown.
    // And the Aqua Duck since 0595 — its pods on its back, its marker under its chin.
    for (const ship of ['firebird', 'estate', 'thunderbolt', 'duck'] as const) {
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
      // Nor does the duck: its marker hangs under its chin and its pods ride its back (0595).
      if (ship === 'thunderbolt' || ship === 'duck') continue;
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
      } else if (w.weapon.flight === 'ram') {
        // The ram fires nothing: its body is the ball, on the ship wherever it is — 0593.
        expect(w.playerShots.size, `${ship}: the ram has no body`).toBe(1);
        const ram = w.playerShots.at(0);
        expect(Math.hypot(ram.along - w.ship.along, ram.across - w.ship.across), `${ship}: the ram is off the ball`).toBeLessThan(NEAR);
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

describe('0493 — the ray gun hangs under the lip, and its muzzle is a ring — 0587, a little saucer', () => {
  /*
    *"On the little caddie the raygun sits above the ship instead of under it, and it's weird that it
    has a small pointed end, but fires a large circular projectile."* Two claims about the picture, held
    in world units off the bake's own trace: the emitter is drawn before the disc's face, so the face
    covers it to the rim; and the muzzle is a dish the size of the smallest ring it fires.
  */
  const unit = 10;
  /** Every filled mark of a kind's bake, as circles in world units about the tile's centre: where, how far out, and its alpha. */
  const circlesOf = (kind: 'caddie'): { x: number; y: number; r: number; alpha: number }[] => {
    const size = SPRITE_EXTENT[kind] * unit;
    const { pen, trace } = tracingPen();
    drawKind(pen, kind, PALETTES[DEFAULT_PALETTE], size, 'approach');
    return trace.passes.map((pass) => {
      const points = pass.subpaths[0] ?? [];
      const x = points.reduce((sum, p) => sum + p[0], 0) / Math.max(1, points.length);
      const y = points.reduce((sum, p) => sum + p[1], 0) / Math.max(1, points.length);
      const r = Math.max(0, ...points.map((p) => Math.hypot(p[0] - x, p[1] - y)));
      return { x: (x - size / 2) / unit, y: (y - size / 2) / unit, r: r / unit, alpha: pass.alpha };
    });
  };

  it('UNDER THE LIP: the emitter is painted before the disc’s face, so the face covers it to the rim', () => {
    const marks = circlesOf('caddie');
    const rim = CADDIE_DISC * R;
    // The face: the biggest mark centred on the saucer. The housing: a SOLID mark centred inside the rim, ahead
    // of the dome, that reaches out past it. 0705: the node's ring of light is painted over the rim so the ring
    // is whole, and it is a light (translucent), not the housing — so only solid marks are read as the housing.
    const face = marks.findIndex((m) => Math.hypot(m.x, m.y) < 0.1 && m.r > rim * 0.9);
    const housings = marks.flatMap((m, i) => (m.alpha >= 0.9 && m.x > rim * 0.5 && m.x < rim && Math.abs(m.y) < 0.05 && m.x + m.r > rim ? [i] : []));
    expect(face, 'no face is painted on the disc').toBeGreaterThanOrEqual(0);
    expect(housings.length, 'no emitter housing reaches out past the rim').toBeGreaterThan(0);
    for (const housing of housings) {
      expect(housing, 'the emitter is painted over the disc, so it sits on top of the saucer').toBeLessThan(face);
    }
  });

  /*
    ⚠️ **A RING IN, A RING OUT STOOD HERE — 0493, re-measured by 0587 and 0588, and gone with 0705.** It held the
    gun's mouth to be an edge-on ring as tall as the first ring the gun throws. The gun is a node now (0705): a
    ball with a ring of light round it, which the player asked for by name, and the rings it throws leave from
    its front with no mouth to be the size of. A guard that cannot be met by the ask is deleted, with this note.
  */
});

describe('0705 — the ray gun is a node with a ring of light, and 0683 hangs it under the rim', () => {
  /*
    0705: *"maybe make it a node with a purple ring glow or something?"* — and *"the viper in play needs to match on
    the pad, same with weapons like the ray gun"*: a ball is the one drawing that is the same from above and from the
    side. 0683: *"the ray gun/weapon for the Lil Caddie should be below the ship, not above it in the graphic, it'd
    be blocking the pilots view currently."* Held off the side view's own trace — the pad's and the intro's picture
    of the saucer, whose rim is the frame's centreline: every mark of the gun, its ring of light included, is below
    it, and the gun's outline is round. (0587's little saucer, wider than tall, stood here until 0705.)
  */
  /*
    Played, on the node hung under the nose: *"the side view is a hard no."* So the node sits ON the rim at the nose
    from the side as it does from above, sunk into the hull: no solid mark of it stands higher than its own radius
    above the rim line, which is under the dome and out of the pilot's line of sight (0683's claim, on a bead).
  */
  it('THE ASK: from the side, the node sits on the rim at the nose, no higher than its own radius, and it is round', () => {
    const size = 400;
    const f = { half: size / 2, r: size * 0.42 };
    const { pen, trace } = tracingPen();
    paintRaygunSide(pen, f, PALETTES[DEFAULT_PALETTE], 0);
    const solid = trace.passes.filter((pass) => pass.alpha >= 0.9).flatMap((pass) => pass.subpaths.flat());
    expect(solid.length, 'the side view draws no gun').toBeGreaterThan(0);
    const ys = solid.map(([, y]) => y);
    const xs = solid.map(([x]) => x);
    const wide = Math.max(...xs) - Math.min(...xs);
    const tall = Math.max(...ys) - Math.min(...ys);
    // On the rim: its centre on the rim line, so it rises its own radius above it and no more.
    expect(Math.min(...ys), 'the node stands higher above the rim than its own radius').toBeGreaterThanOrEqual(f.half - tall / 2 - 0.5);
    expect(Math.max(...ys), 'the node hangs lower under the rim than its own radius').toBeLessThanOrEqual(f.half + tall / 2 + 0.5);
    // Round but for its barrel: the ball and the short rod out of its front are a third wider than tall at most.
    expect(wide / tall, `the gun is not round: ${wide.toFixed(0)} px wide to ${tall.toFixed(0)} px tall`).toBeGreaterThan(0.85);
    expect(wide / tall, `the gun is not round: ${wide.toFixed(0)} px wide to ${tall.toFixed(0)} px tall`).toBeLessThan(1.4);
  });

  it('AND THE SAME NODE FROM ABOVE: the fight’s gun is as round, and its ring of light reaches as far', () => {
    const size = 400;
    const f = { half: size / 2, r: size * 0.42 };
    const extent = (lean: number): { wide: number; tall: number } => {
      const { pen, trace } = tracingPen();
      paintRaygunSide(pen, f, PALETTES[DEFAULT_PALETTE], lean);
      paintRaygunSideHalo(pen, f, PALETTES[DEFAULT_PALETTE], lean);
      const points = trace.passes.flatMap((pass) => pass.subpaths.flat());
      const xs = points.map(([x]) => x);
      const ys = points.map(([, y]) => y);
      return { wide: Math.max(...xs) - Math.min(...xs), tall: Math.max(...ys) - Math.min(...ys) };
    };
    const side = extent(0);
    const above = extent(1);
    expect(above.wide / above.tall, 'from above the gun is not round').toBeGreaterThan(0.85);
    expect(above.wide / above.tall, 'from above the gun is not round').toBeLessThan(1.18);
    expect(Math.abs(above.wide - side.wide), `the gun is ${above.wide.toFixed(0)} px across from above and ${side.wide.toFixed(0)} from the side`).toBeLessThan(2);
  });
});
