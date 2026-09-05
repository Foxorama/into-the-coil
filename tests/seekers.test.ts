/**
 * A seeker hunts the nearest body — `docs/decisions/0235-a-seeker-hunts-the-nearest-body.md`.
 *
 * The homing missile is the second `MissileKind`: the same tubes and clock as the straight one, a
 * shot worth less, and a guidance that turns toward the nearest body on the field from the moment it
 * leaves the tube — whatever direction that is. The kind's ladder and face are held by
 * `tests/weapons.test.ts` over every tube; what is held here is the hunt.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame, type World } from '../src/app/frame.ts';
import { MISSILES } from '../src/content/missiles.ts';
import { SHOTS } from '../src/content/shots.ts';
import { weaponFor, type UpgradeKind } from '../src/content/pickups.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { SPRITE_KINDS } from '../src/content/sprites.ts';
import { INK_OF } from '../src/render/bake.ts';
import { reset } from '../src/sim/entity.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

const NEVER = Number.MAX_SAFE_INTEGER;

/** A world with seekers fitted at `tier` rungs, the gun held off, and a tube about to fire. */
function armed(tier: number): { world: World; frame: GameFrame } {
  const built = playableWorld(NO_LEVEL);
  const carried: UpgradeKind[] = [];
  for (let i = 0; i < tier; i++) carried.push('missile');
  built.world.weapon = weaponFor(built.world.shipRow, carried, built.world.shipRow.weapon, 'homing');
  built.world.fireIn = NEVER;
  built.world.missileIn = 1;
  return { world: built.world, frame: new GameFrame(built.world) };
}

/** A tough body that never fires, riding the camera `ahead` of the ship and `aside` across it. */
function target(world: World, ahead: number, aside: number): { health: number; along: number; across: number } {
  const enemy = world.enemies.spawn();
  if (enemy === null) throw new Error('the enemy pool is full');
  reset(enemy, world.ship.along + ahead, world.ship.across + aside, { ...ENEMIES.turret, health: 999 }, world.enemyKinds.turret);
  enemy.fireIn = NEVER;
  enemy.velAlong = world.scrollPerStep;
  return enemy;
}

describe('0235 — a seeker hunts the nearest body', () => {
  it('is worth less than the straight missile and more than the pulse, as an order rather than a number', () => {
    const seeker = SHOTS[MISSILES.homing.shot];
    expect(seeker.damage, 'a seeker is worth as much as a straight missile').toBeLessThan(SHOTS[MISSILES.straight.shot].damage);
    expect(seeker.damage, 'a seeker is worth no more than a pulse').toBeGreaterThan(SHOTS.pulse.damage);
    expect(MISSILES.homing.guidance).toBe('homing');
    expect(MISSILES.homing.seek, 'a homing missile that cannot turn').toBeGreaterThan(0);
  });

  it('THE HUNT: a seeker turns toward a body well off its line and reaches it', () => {
    const { world, frame } = armed(1);
    const body = target(world, 70, 32);
    frame.step();
    expect(world.missiles.size, 'no missile was launched').toBe(1);
    world.missileIn = NEVER;
    const missile = world.missiles.at(0);
    let towards = false;
    let steps = 0;
    while (body.health === 999 && steps < 400 && world.missiles.size > 0) {
      // Its own motion, less the scroll: does it ever point at the body?
      if (missile.velAcross > 0.2) towards = true;
      frame.step();
      steps++;
    }
    expect(towards, 'the seeker never turned toward the body').toBe(true);
    expect(body.health, 'the seeker never reached the body').toBe(999 - world.weapon.missileDamage);
  });

  it('and a body BEHIND the ship is reached too, because the hunt is any direction', () => {
    /*
      Asked for: *"home into the nearest target when fired (any direction)."* A missile leaves the
      tube pointed up the lane; a body a quarter of the view behind the ship is one it has to come
      about for, and the turn rate is what makes that take long enough to watch.
    */
    const { world, frame } = armed(1);
    const body = target(world, -25, 6);
    frame.step();
    world.missileIn = NEVER;
    let steps = 0;
    while (body.health === 999 && steps < 500 && world.missiles.size > 0) {
      frame.step();
      steps++;
    }
    expect(world.missiles.size > 0 || body.health < 999, 'the seeker was lost before it could come about').toBe(true);
    expect(body.health, 'a body behind the ship was never reached').toBe(999 - world.weapon.missileDamage);
    expect(steps, 'a body behind the ship was reached too fast to have been turned toward').toBeGreaterThan(10);
  });

  it('turns without slowing: its own speed is the row’s on every step of the hunt', () => {
    const { world, frame } = armed(1);
    target(world, 60, 40);
    frame.step();
    world.missileIn = NEVER;
    const missile = world.missiles.at(0);
    const row = SHOTS[MISSILES.homing.shot];
    for (let i = 0; i < 40 && world.missiles.size > 0; i++) {
      frame.step();
      const own = Math.hypot(missile.velAlong - world.scrollPerStep, missile.velAcross);
      // The pop adds a little across the first steps; once it has turned, the speed is the row's.
      expect(own, `on step ${i} the seeker's speed drifted to ${own.toFixed(3)}`).toBeLessThanOrEqual(row.speed + 0.6);
      expect(own, `on step ${i} the seeker slowed to ${own.toFixed(3)}`).toBeGreaterThanOrEqual(row.speed);
    }
  });

  it('and two tubes fan before they converge, so a pair is two missiles and not one drawn twice', () => {
    const { world, frame } = armed(2);
    target(world, 80, 0);
    frame.step();
    expect(world.missiles.size).toBe(2);
    world.missileIn = NEVER;
    const a = world.missiles.at(0);
    const b = world.missiles.at(1);
    let widest = 0;
    for (let i = 0; i < 30 && world.missiles.size === 2; i++) {
      frame.step();
      widest = Math.max(widest, Math.abs(a.across - b.across));
    }
    expect(widest, 'the pair flew as one line').toBeGreaterThan(SHOTS.seeker.radius * 2);
  });

  it('THE TWO TUBES: a seeker is told from a missile by its ink as well as its shape', () => {
    /*
      0238, from the second play: *"need more visual distinction between actual missile types."*
      0081's rule is that what the player must tell apart is told apart by more than ink, and the
      two already differed in silhouette; that was not enough at four units. This holds that the
      ink is a channel too, and that the two are not one bitmap.
    */
    const seeker = SHOTS[MISSILES.homing.shot];
    const missile = SHOTS[MISSILES.straight.shot];
    expect(seeker.sprite, 'the two missiles are one bitmap').not.toBe(missile.sprite);
    expect(INK_OF[SPRITE_KINDS[seeker.sprite]!], 'the two missiles are drawn in one ink').not.toBe(INK_OF[SPRITE_KINDS[missile.sprite]!]);
  });
});
