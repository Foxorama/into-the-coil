import { describe, expect, it } from 'vitest';
import { SHIPS, SHIP_KINDS, fitted, type ShipKind } from '../src/content/ships.ts';
import { WEAPONS, WEAPON_KINDS, type WeaponKind } from '../src/content/weapons.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { SHIP_BOX } from '../src/content/sprites.ts';
import { PALETTES, DEFAULT_PALETTE } from '../src/content/palette.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { drawPlayerShip, paintMount } from '../src/render/bake.ts';
import { reset } from '../src/sim/entity.ts';
import { GameFrame } from '../src/app/frame.ts';
import { makeLifecycle } from '../src/app/lifecycle.ts';
import { initialState, reduce, type Action } from '../src/state/root.ts';
import { inside, nearestEdge, tracingPen } from './paths.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/**
 * A GUN IS ITS OWN LAYER — `docs/decisions/0525-the-gun-is-a-layer.md`.
 *
 * ⚠️ **What is held is that a borrowed gun is one thing in three places**: where the shot leaves (the
 * fitted row's muzzle), what the bake draws there (the mount), and what the run flies (`run.gun`). A
 * ship flying its OWN gun is drawn exactly as before 0525 — that was proved once against `main`, call for
 * call, and the decision records it; it is not a standing guard, because the next art pass on a ship is
 * meant to change its drawing.
 */

/** A box's radius in world units: a sprite's frame puts it at 0.42 of the extent. */
const R = SHIP_BOX * 0.42;
/** Closer than this, in world units, is the same place. */
const NEAR = 0.05;
/** A sprite's frame for tracing: 200 pixels square. */
const F = { half: 100, r: 84 };

/**
 * Every ship with every gun it does not carry — of the guns that lend, on ships whose own gun lends: 0593's
 * ram is the ball itself, so the ball flies no other gun and no other ship flies it (`lends`).
 */
const BORROWED: readonly (readonly [ShipKind, WeaponKind])[] = SHIP_KINDS.filter((ship) => WEAPONS[SHIPS[ship].weapon].lends).flatMap((ship) =>
  WEAPON_KINDS.filter((gun) => gun !== SHIPS[ship].weapon && WEAPONS[gun].lends).map((gun) => [ship, gun] as const),
);

describe('a fitted ship', () => {
  it('is its own row with its own gun', () => {
    for (const ship of SHIP_KINDS) expect(fitted(SHIPS[ship], SHIPS[ship].weapon)).toBe(SHIPS[ship]);
  });

  it('with another’s, fires it from its hardpoint plus the gun’s own mount, in the ship’s view', () => {
    // Five ships with four guns each they do not carry, since 0545 and 0546 made both five; 0593's sixth lends nothing.
    // 0595's seventh lends its marker and borrows the rest: six ships with five each.
    // 0666's eighth lends its acid and borrows the rest: seven ships with six each.
    expect(BORROWED).toHaveLength(42);
    for (const [ship, gun] of BORROWED) {
      const row = fitted(SHIPS[ship], gun);
      const mount = WEAPONS[gun].mount[SHIPS[ship].view];
      expect(row.weapon).toBe(gun);
      // 0581: at the ship's own scale for a mount, so a slimmer gun's mouth is that much nearer.
      const s = SHIPS[ship].mountScale;
      expect(row.muzzle).toEqual({ along: SHIPS[ship].hardpoint.along + mount.along * s, across: SHIPS[ship].hardpoint.across + mount.across * s });
      // Everything else about the ship is its own: the hull, the tubes, the engines, where its blades spread.
      expect({ ...row, weapon: SHIPS[ship].weapon, muzzle: SHIPS[ship].muzzle }).toEqual(SHIPS[ship]);
    }
  });
});

describe('the mount', () => {
  it('every borrowed gun’s muzzle is inside a mark its mount paints', () => {
    for (const [ship, gun] of BORROWED) {
      const { pen, trace } = tracingPen();
      paintMount(pen, F, PALETTES[DEFAULT_PALETTE], gun, ship);
      const m = fitted(SHIPS[ship], gun).muzzle;
      const at = [F.half + (m.along / R) * F.r, F.half + (m.across / R) * F.r] as const;
      // Inside, or on the edge: a dish's mouth is its front edge, as the caddie's own ray gun's is.
      const onIt = trace.passes.some((pass) => inside(pass, at) || nearestEdge(pass, at) < 1.5);
      expect(onIt, `${ship} with the ${gun}: the shot leaves where nothing is drawn`).toBe(true);
    }
  });

  /*
    0662: the mount is laid on last on a ship that stands its gun on its hull, and FIRST on one whose row hangs it
    under — *"tubes + gun should be under + not over ship."* Rewritten from *laid on last* for every ship: that was
    the rule the ask changed, for the fighter.
  */
  it('a ship flying another’s gun is drawn without its own, and with the mount on the side of the hull its row hangs it', () => {
    const palette = PALETTES[DEFAULT_PALETTE];
    for (const [ship, gun] of BORROWED) {
      const own = tracingPen();
      drawPlayerShip(own.pen, F, palette, ship, 1);
      const borrowed = tracingPen();
      drawPlayerShip(borrowed.pen, F, palette, ship, 1, gun);
      const mount = tracingPen();
      paintMount(mount.pen, F, palette, gun, ship);
      const k = mount.trace.passes.length;
      if (SHIPS[ship].hang === 'under') {
        expect(borrowed.trace.passes.slice(0, k), `${ship} with the ${gun}: the mount is not what is laid on first, under the hull`).toEqual(mount.trace.passes);
        // Its own gun hangs under the hull too, so the hull over either is the same outline — nothing of the gun in it.
        const ownMount = tracingPen();
        paintMount(ownMount.pen, F, palette, SHIPS[ship].weapon, ship);
        expect(borrowed.trace.passes[k], `${ship} with the ${gun}: the hull is not the same outline over every gun`).toEqual(own.trace.passes[ownMount.trace.passes.length]);
        continue;
      }
      // The hull is the first fill: its outline closes over where its own gun stood.
      expect(borrowed.trace.passes[0], `${ship} with the ${gun}: the hull still wears its own gun`).not.toEqual(own.trace.passes[0]);
      expect(borrowed.trace.passes.slice(-k), `${ship} with the ${gun}: the mount is not what is laid on last`).toEqual(mount.trace.passes);
    }
  });

  it('every pairing, at every stage, is drawn inside its sprite’s box', () => {
    for (const [ship, gun] of BORROWED) {
      for (const stage of [0, 1, 2]) {
        const { pen, trace } = tracingPen();
        drawPlayerShip(pen, F, PALETTES[DEFAULT_PALETTE], ship, stage, gun);
        for (const pass of trace.passes) {
          for (const sub of pass.subpaths) {
            for (const [x, y] of sub) {
              expect(x >= 0 && x <= 2 * F.half && y >= 0 && y <= 2 * F.half, `${ship} with the ${gun} at ${stage}: drawn off its box at (${x.toFixed(1)}, ${y.toFixed(1)})`).toBe(true);
            }
          }
        }
      }
    }
  });
});

describe('the frame', () => {
  it('THE GUN: every borrowed gun’s first shot leaves its mount — the arc’s first link too', () => {
    for (const [ship, gun] of BORROWED) {
      const built = playableWorld(NO_LEVEL);
      const w = built.world;
      w.shipRow = fitted(SHIPS[ship], gun);
      w.weapon = weaponFor(w.shipRow, []);
      w.fireIn = 1;
      expect(w.weapon.kind, `${ship} flew its own gun, not the ${gun}`).toBe(gun);
      const enemy = w.enemies.spawn()!;
      reset(enemy, w.ship.along + 20, w.ship.across, { ...ENEMIES.turret, health: 999 }, w.enemyKinds.turret);
      enemy.velAlong = w.scrollPerStep;
      const muzzle = w.shipRow.muzzle;
      new GameFrame(w).step();
      if (w.weapon.flight === 'chain') {
        expect(w.bolts.size, `${ship} with the ${gun}: no link`).toBeGreaterThan(0);
        const link = w.bolts.at(0);
        const dx = link.prevAlong + link.fromAlong - (w.ship.prevAlong + muzzle.along);
        const dy = link.prevAcross + link.fromAcross - (w.ship.prevAcross + muzzle.across);
        expect(Math.hypot(dx, dy), `${ship} with the ${gun}: the lightning left elsewhere than its rod`).toBeLessThan(NEAR * 4);
      } else {
        expect(w.playerShots.size, `${ship} with the ${gun}: the gun did not fire`).toBeGreaterThan(0);
        for (let i = 0; i < w.playerShots.size; i++) {
          const shot = w.playerShots.at(i);
          expect(Math.abs(shot.prevAcross - (w.ship.prevAcross + muzzle.across)), `${ship} with the ${gun}: shot ${i} left off its mount's line`).toBeLessThan(NEAR);
          expect(Math.abs(shot.prevAlong - (w.ship.prevAlong + muzzle.along)), `${ship} with the ${gun}: shot ${i} left ahead of or behind its mount`).toBeLessThan(NEAR);
        }
      }
    }
  });
});

describe('the run', () => {
  it('begins in the world with the fitted ship: its gun, and its muzzle at the mount', () => {
    const built = playableWorld(NO_LEVEL);
    let current = initialState;
    const lifecycle = makeLifecycle(built.world, (action: Action) => {
      current = reduce(current, action);
    }, () => current.run);
    // A gun that is not the estate's own (the shuriken since 0545), or the break below changes nothing.
    lifecycle.begin('savior', 'estate', 'free', undefined, 'arc');
    expect(built.world.shipRow.weapon).toBe('arc');
    expect(built.world.shipRow.muzzle).toEqual(fitted(SHIPS.estate, 'arc').muzzle);
    expect(current.run.gun).toBe('arc');
  });

  it('flies the gun it began with through everything a run does, and its ship’s own when none is named', () => {
    let state = reduce(initialState, { slice: 'run', type: 'begin', difficulty: 'savior', ship: 'fighter', credits: 'free', gun: 'arc' });
    expect(state.run.gun).toBe('arc');
    const actions: readonly Action[] = [
      { slice: 'run', type: 'lifeLost', cause: 'fire' },
      { slice: 'run', type: 'took', special: 'bomb' },
      { slice: 'run', type: 'spent', side: 'gun' },
      { slice: 'run', type: 'upgraded', kind: 'straight' },
      { slice: 'run', type: 'levelCleared' },
      { slice: 'run', type: 'continued' },
    ];
    for (const action of actions) {
      state = reduce(state, action);
      expect(state.run.gun, `${action.type} dropped the fitted gun`).toBe('arc');
    }
    // The estate's own is the shuriken since 0545, and the Thunderbolt's the arc.
    expect(reduce(initialState, { slice: 'run', type: 'begin', difficulty: 'savior', ship: 'estate', credits: 'none' }).run.gun).toBe('shuriken');
    expect(reduce(initialState, { slice: 'run', type: 'begin', difficulty: 'savior', ship: 'thunderbolt', credits: 'none' }).run.gun).toBe('arc');
    expect(reduce(initialState, { slice: 'run', type: 'begin', difficulty: 'savior', ship: 'fighter', credits: 'none' }).run.gun).toBe('pulse');
  });
});
