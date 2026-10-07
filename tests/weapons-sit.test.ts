import { describe, expect, it } from 'vitest';
import { GameFrame, wearHull } from '../src/app/frame.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { MISSILES, MISSILE_KINDS, type MissileKind } from '../src/content/missiles.ts';
import { SHIPS, SHIP_KINDS, fitted } from '../src/content/ships.ts';
import { FIGHTER_HULL, SPRITE } from '../src/content/sprites.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/**
 * THE WEAPONS SIT RIGHT — `docs/decisions/0581-the-weapons-sit-right.md`.
 *
 * *"The default fighter weapon obscures the cool wingtips and looks worse — other equipped weapons on the
 * fighter show on top of the nose and it hides the nose art."* Answered: guns on the nose, slimmer and ahead
 * of its art; tubes under the wings; each tube in its kind's ink. Held in world units off the rows the bake
 * and the frame both read, and in the frame's own pool.
 */

/** The fighter's hull's radius in world units: 7 of a 9.4 box, whose frame is 0.42 of it. */
const HULL_R = FIGHTER_HULL * 0.42;
/** How far forward every look on the fighter's nose reaches, in its hull's radius — the shark's jaw. */
const ART_REACH = 0.95;

describe('the fighter', () => {
  it('THE ASK: carries every gun on its nose, slimmer than a car does, its mouth ahead of the nose', () => {
    const row = SHIPS.fighter;
    expect(row.mountScale, 'the fighter carries its guns at a car’s size').toBeLessThan(SHIPS.estate.mountScale);
    // The pad is past the art's reach less half its own width at the fighter's scale — ahead of the art, not on it.
    expect(row.hardpoint.along / HULL_R, 'the gun stands back over the nose’s art').toBeGreaterThan(ART_REACH - 0.05);
    for (const gun of Object.keys(WEAPONS) as (keyof typeof WEAPONS)[]) {
      const mouth = fitted(row, gun).muzzle;
      expect(mouth.along / HULL_R, `the ${gun}'s mouth is not ahead of the nose`).toBeGreaterThan(1);
      expect(mouth.across, `the ${gun} is off the centreline`).toBe(0);
    }
  });

  it('flies its own pulse from the mount on its nose, and its wingtips are its own', () => {
    const row = SHIPS.fighter;
    const own = WEAPONS[row.weapon].mount.top;
    expect(row.muzzle).toEqual({ along: row.hardpoint.along + own.along * row.mountScale, across: 0 });
    // 0.78 of the hull's radius is the wing's tip in its outline; the pods reached 1.13.
    expect(row.wingtip / HULL_R, 'something still stands past the wingtips').toBeLessThanOrEqual(0.79);
  });

  it('hangs its tubes under its wings — out at mid-span, and behind the nose', () => {
    for (const stage of [1, 2] as const) {
      for (const place of SHIPS.fighter.tubes[stage]) {
        const out = Math.abs(place.across) / HULL_R;
        expect(out, 'a tube is not under a wing').toBeGreaterThan(0.48);
        expect(out, 'a tube is past the wingtip').toBeLessThan(0.78);
        expect(place.along, 'a tube is on the nose').toBeLessThan(0);
      }
    }
  });
});

describe('a loaded tube', () => {
  /** The world with `ship` flying `tubes`, stepped once so the frame lays them. */
  const flying = (ship: (typeof SHIP_KINDS)[number], tubes: readonly MissileKind[]) => {
    const { world } = playableWorld(NO_LEVEL);
    world.shipRow = SHIPS[ship];
    world.weapon = weaponFor(world.shipRow, tubes);
    wearHull(world);
    new GameFrame(world).step();
    return world;
  };

  it('THE ASK: is laid at each of its ship’s places in its own kind’s picture, so a mixed rack is one of each', () => {
    for (const ship of SHIP_KINDS) {
      const row = SHIPS[ship];
      for (const [a, b] of [
        ['straight', 'homing'],
        ['homing', 'straight'],
      ] as const) {
        const world = flying(ship, [a, b]);
        expect(world.loaded.size, `${ship} with a mixed rack lays ${world.loaded.size} tubes`).toBe(2);
        [a, b].forEach((kind, i) => {
          const tube = world.loaded.at(i);
          expect(tube.sprite, `${ship}'s tube ${i} is not the ${kind}'s picture`).toBe(MISSILES[kind].loaded[row.tubeLook].base);
          const place = row.tubes[2][i]!;
          expect(tube.along - world.ship.along, `${ship}'s tube ${i} does not end where its missile leaves`).toBeCloseTo(place.along - row.tubeLength / 2, 6);
          expect(tube.across - world.ship.across, `${ship}'s tube ${i} is off its place`).toBeCloseTo(place.across, 6);
        });
      }
    }
  });

  it('is in the missile pickup’s ink or the seeker pickup’s, never the same picture for both', () => {
    const [straight, homing] = MISSILE_KINDS.map((kind) => MISSILES[kind].loaded);
    for (const look of ['dart', 'nose'] as const) expect(straight![look].base, `${look}: one picture for both kinds`).not.toBe(homing![look].base);
    expect(MISSILES.straight.loaded.dart.base).toBe(SPRITE.tubeMissile);
    expect(MISSILES.homing.loaded.dart.base).toBe(SPRITE.tubeSeeker);
  });

  it('lays nothing on a bare ship, and one on a ship with one tube', () => {
    expect(flying('fighter', []).loaded.size).toBe(0);
    expect(flying('estate', ['homing']).loaded.size).toBe(1);
  });
});
