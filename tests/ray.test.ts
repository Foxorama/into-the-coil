/**
 * The ray gun — `docs/decisions/0442-the-ray-gun.md`. *"A ray gun that fires four concentric purple
 * energy rings that explode on impact with a small energy explosion."* What makes it a gun of its own
 * and not a slower pulse is the burst: a ring goes off where it lands and the burst lands on what is
 * beside the body it found. That is held here, driven through the real frame in the ship it is keyed to.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame, wearHull, type World } from '../src/app/frame.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { SHIPS, shipCarrying } from '../src/content/ships.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE, SPRITE_EXTENT } from '../src/content/sprites.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { reset, type Entity } from '../src/sim/entity.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

const NEVER = Number.MAX_SAFE_INTEGER;

/** The ray's own ship, firing on the next step, its missiles held. */
function armed(): { world: World; frame: GameFrame } {
  const built = playableWorld(NO_LEVEL);
  built.world.shipRow = SHIPS[shipCarrying('ray')];
  built.world.weapon = weaponFor(built.world.shipRow, []);
  wearHull(built.world);
  built.world.fireIn = 1;
  built.world.missileIn = NEVER;
  return { world: built.world, frame: new GameFrame(built.world) };
}

/** A tough body that never fires and rides the camera `ahead` of the ship, `aside` across it. */
function body(world: World, ahead: number, aside: number, radius: number): Entity {
  const enemy = world.enemies.spawn();
  if (enemy === null) throw new Error('the enemy pool is full');
  reset(enemy, world.ship.along + ahead, world.ship.across + aside, { ...ENEMIES.turret, health: 999, radius }, world.enemyKinds.turret);
  enemy.fireIn = NEVER;
  enemy.velAlong = world.scrollPerStep;
  return enemy;
}

describe('0442 — the ray gun', () => {
  it('THE ASK: a ring that lands goes off there, and its burst lands on the body beside the one it hit', () => {
    const { world, frame } = armed();
    expect(world.weapon.flight, 'the caddie does not fly the ray').toBe('burst');
    // One body on the ring's line, and one off it: out of the ring's reach, inside the burst's.
    const hit = body(world, 40, 0, 2);
    const beside = body(world, 40, 4, 1);
    const ringReach = SHOTS.ray.radius + beside.radius;
    const burstReach = SHOTS.rayBurst.radius + beside.radius;
    expect(4, 'the body beside is on the ring\'s line, so this measures the ring and not the burst').toBeGreaterThan(ringReach);
    expect(4, 'the body beside is out of the burst\'s reach, so nothing could ever land on it').toBeLessThan(burstReach);
    let landed = -1;
    for (let step = 0; step < 300 && landed < 0; step++) {
      frame.step();
      if (hit.health < 999) landed = step;
    }
    expect(landed, 'no ring ever reached the body on its line').toBeGreaterThanOrEqual(0);
    expect(999 - hit.health, 'the body the ring found took less than the ring and its burst').toBeGreaterThanOrEqual(
      SHOTS.ray.damage + SHOTS.rayBurst.damage,
    );
    expect(999 - beside.health, 'the burst did not land on the body beside the one the ring found').toBe(SHOTS.rayBurst.damage);
  });

  it('and the burst is drawn at exactly its reach, on the blast\'s rule', () => {
    // A burst is a blast, and a blast whose picture is smaller than its reach kills what the player
    // watched it miss — `tests/bombs.test.ts`'s rule for the bomb, held for the ray's two pictures.
    expect(SPRITE_EXTENT.rayBurst).toBe(SHOTS.rayBurst.radius * 2);
    expect(SPRITE_EXTENT.rayFade).toBe(SHOTS.rayBurst.radius * 2);
    expect(WEAPONS.ray.bursts).toBe('rayBurst');
  });

  it('and a ring in flight ripples: its pages turn while it flies', () => {
    const { world, frame } = armed();
    const seen = new Set<number>();
    for (let step = 0; step < 40; step++) {
      frame.step();
      for (let i = 0; i < world.playerShots.size; i++) seen.add(world.playerShots.at(i).sprite);
    }
    const pages = [SPRITE.ray, SPRITE.rayRipple, SPRITE.raySwell];
    expect([...seen].every((s) => pages.includes(s)), 'something other than a ring left the caddie').toBe(true);
    expect(seen.size, 'a ring in flight never turned a page, so the rings do not ripple').toBe(pages.length);
  });
});
