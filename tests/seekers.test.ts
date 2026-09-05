/**
 * A seeker hunts the nearest body — `docs/decisions/0235-a-seeker-hunts-the-nearest-body.md`.
 *
 * The homing missile is the second `MissileKind`: the same tubes and clock as the straight one, a
 * shot worth less, and a guidance that turns toward the nearest body on the screen from the moment
 * it leaves the tube — whatever direction that is — for as long as its fuse burns
 * (`docs/decisions/0246-a-seeker-hunts-on-the-screen.md`). The kind's ladder and face are held by
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
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
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
    const ink = INK_OF[SPRITE_KINDS[seeker.sprite]!];
    expect(ink, 'the two missiles are drawn in one ink').not.toBe(INK_OF[SPRITE_KINDS[missile.sprite]!]);
    // ⚠️ And not the ship's ink either — 0241: *"blue homing missiles, blue lightning, blue ship,
    // it all looks the same."* The bolt is stroked in the ship's ink and the hull wears it; a
    // seeker in it was the third blue thing, and it wears its own pickup face's ink instead.
    expect(ink, 'a seeker is drawn in the ship’s own ink, so it is one more blue thing').not.toBe('player');
  });
});

describe('0246 — a seeker hunts on the screen, and burns out', () => {
  /*
    Played: *"they're way too strong, limit them to screen space only and give them a shorter
    lifespan. I had 15-20 on screen at a time and they were killing everything super fast."* 0235
    bounded the hunt by a reach from the missile, which is a circle and not the screen; and a
    seeker that kept turning was spent by nothing.
  */

  /** Whether `missile` has turned across the lane toward `body` at all. */
  function turnedToward(missile: { velAcross: number }, body: { across: number }, from: number): boolean {
    return Math.sign(missile.velAcross) === Math.sign(body.across - from) && Math.abs(missile.velAcross) > 0.2;
  }

  it('THE SCREEN: a body beyond the leading edge is not hunted, and the same body just inside it is', () => {
    /*
      Two runs, one body: a hull's width past the leading edge of the view, forty across from the
      tube, riding the camera so it stays where it is put. Off the screen the seeker flies its pop
      and never turns; on the screen it turns toward the body inside a few steps. The bound is the
      VIEW the player has, so nothing here names a reach.
    */
    for (const inside of [false, true]) {
      const { world, frame } = armed(1);
      const edge = world.cameraAlong + world.view.alongSpan - world.ship.along;
      const body = target(world, inside ? edge - 30 : edge + 30, 40);
      frame.step();
      world.missileIn = NEVER;
      const missile = world.missiles.at(0);
      let turned = false;
      for (let i = 0; i < 40 && world.missiles.size > 0; i++) {
        frame.step();
        if (turnedToward(missile, body, world.ship.across + 40 - 40)) turned = true;
      }
      expect(turned, inside ? 'a body on the screen was not hunted' : 'a body beyond the leading edge was hunted').toBe(inside);
    }
  });

  it('THE FUSE: a seeker burns out inside two seconds when it cannot catch what it hunts, and a puff is drawn where it went', () => {
    /*
      A body far behind and to the side: the seeker comes about and chases, and is spent before it
      arrives — held as *gone within two seconds*, in the player's unit, and never as the fuse. On
      the step it goes a spark is placed at the end of its track (0036: an event the model resolves
      and the picture never mentions gets reported as a different bug).
    */
    const { world, frame } = armed(1);
    const body = target(world, -40, 20);
    frame.step();
    world.missileIn = NEVER;
    const missile = world.missiles.at(0);
    let lastAlong = missile.along;
    let lastAcross = missile.across;
    let steps = 0;
    const debrisBefore = world.debris.size;
    while (world.missiles.size > 0 && steps < 300) {
      lastAlong = missile.along;
      lastAcross = missile.across;
      frame.step();
      steps++;
    }
    expect(body.health, 'the seeker caught a body forty behind and twenty across, which is a long chase').toBe(999);
    expect(world.missiles.size, 'the seeker never went out').toBe(0);
    expect(steps / STEPS_PER_SECOND, `the seeker hunted for ${(steps / STEPS_PER_SECOND).toFixed(2)} s`).toBeLessThan(2);
    // The puff: a piece of debris within a couple of units of where the missile was last seen.
    let puffed = false;
    for (let i = 0; i < world.debris.size; i++) {
      const piece = world.debris.at(i);
      if (Math.hypot(piece.along - lastAlong, piece.across - lastAcross) < 4) puffed = true;
    }
    expect(world.debris.size, 'nothing was drawn when the seeker went out').toBeGreaterThan(debrisBefore);
    expect(puffed, 'the puff is not where the seeker went out').toBe(true);
  });

  it('and the straight missile has no fuse: it lives to the far edge of the widest view', () => {
    const built = playableWorld(NO_LEVEL);
    built.world.weapon = weaponFor(built.world.shipRow, ['missile'], built.world.shipRow.weapon, 'straight');
    built.world.fireIn = NEVER;
    built.world.missileIn = 1;
    const frame = new GameFrame(built.world);
    frame.step();
    const missile = built.world.missiles.at(0);
    let furthest = 0;
    for (let i = 0; i < 300 && built.world.missiles.size > 0; i++) {
      furthest = Math.max(furthest, missile.along - built.world.cameraAlong);
      frame.step();
    }
    expect(furthest, 'a straight missile went out short of the far edge').toBeGreaterThan(built.world.view.alongSpan - SHOTS.missile.speed * 2);
    expect(MISSILES.straight.fuse).toBe(0);
  });
});
