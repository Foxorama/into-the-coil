import { describe, expect, it } from 'vitest';

import { GameFrame, WHEEL_KIND, firstVolleyIn, respawn, wearHull, type World } from '../src/app/frame.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { SHIPS, SHIP_KINDS, shipCarrying } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE } from '../src/content/sprites.ts';
import { TETHER_BOLT_KIND, WEAPONS, WEAPON_KINDS } from '../src/content/weapons.ts';
import { VOLLEY_CYCLE } from '../src/content/cadence.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { reset, type Entity } from '../src/sim/entity.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/**
 * THE CATHERINE WHEEL — `docs/decisions/0538-the-catherine-wheel.md`.
 *
 * *"A spinning fire wheel disc like a catherine wheel firework that shoots out short sparking fire
 * embers and has a fire tether back to the spaceship that you can use to hit things with, the tether
 * stays attached to the disc and the car and you can go back and forth with it."* And: *"fires out every
 * 4 secs and fades away at 3.6 seconds."* Answered while it was planned: it hangs, on a leash.
 *
 * Every number is read off the row, so a wheel tuned to hang further or burn longer moves the guards.
 */

const NEVER = Number.MAX_SAFE_INTEGER;
const GUN = WEAPONS.catherine;
const WHEEL = GUN.wheel!;
const DISC = SHOTS[GUN.shot];
const CINDER = SHOTS[WHEEL.ember];

/** A world flying the Firebird, nothing else in the air, its gun about to throw. */
function armed(): { world: World; frame: GameFrame; cues: string[]; stick: { along: number; across: number } } {
  const built = playableWorld(NO_LEVEL);
  built.world.shipRow = SHIPS[shipCarrying('catherine')];
  built.world.weapon = weaponFor(built.world.shipRow, []);
  wearHull(built.world);
  built.world.fireIn = 1;
  built.world.missileIn = NEVER;
  built.world.ship.across = ACROSS_SPAN / 2;
  built.world.ship.prevAcross = built.world.ship.across;
  return { world: built.world, frame: new GameFrame(built.world), cues: built.cues, stick: built.stick };
}

function step(world: World, frame: GameFrame): void {
  world.ship.invulnFor = 2;
  frame.step();
}

function wheels(world: World): Entity[] {
  const out: Entity[] = [];
  for (let i = 0; i < world.playerShots.size; i++) if (world.playerShots.at(i).kind === WHEEL_KIND) out.push(world.playerShots.at(i));
  return out;
}

function cinders(world: World): Entity[] {
  const out: Entity[] = [];
  for (let i = 0; i < world.playerShots.size; i++) if (world.playerShots.at(i).sprite === CINDER.sprite) out.push(world.playerShots.at(i));
  return out;
}

/** A tough body that never fires and rides the camera `ahead` of the ship and `aside` across it. */
function target(world: World, ahead: number, aside: number): Entity {
  const enemy = world.enemies.spawn()!;
  reset(enemy, world.ship.along + ahead, world.ship.across + aside, { ...ENEMIES.turret, health: 999, radius: 2 }, world.enemyKinds.turret);
  enemy.fireIn = NEVER;
  enemy.velAlong = world.scrollPerStep;
  return enemy;
}

describe('0538 — the guns move', () => {
  it('THE ASK: the Firebird flies the Catherine wheel, the estate the shuriken, the Thunderbolt the arc', () => {
    expect(SHIPS.firebird.weapon).toBe('catherine');
    expect(SHIPS.estate.weapon).toBe('shuriken');
    expect(SHIPS.thunderbolt.weapon).toBe('arc');
    expect(GUN.special).toBe('candle');
  });

  it('and every gun is still exactly one ship’s own, so every win opens one gun', () => {
    expect([...SHIP_KINDS.map((k) => SHIPS[k].weapon)].sort()).toEqual([...WEAPON_KINDS].sort());
  });
});

describe('0538 — the Catherine wheel', () => {
  it('throws one wheel on the first beat of a life, and then one every ten beats on the run’s grid', () => {
    expect(GUN.fireEvery).toBe(10 * VOLLEY_CYCLE);
    expect(WHEEL.life).toBe(9 * VOLLEY_CYCLE);
    expect(firstVolleyIn(0, GUN.fireEvery), 'a new life waits longer than a beat for its gun').toBeLessThanOrEqual(VOLLEY_CYCLE);
    const { world, frame } = armed();
    const thrownAt: number[] = [];
    for (let i = 0; i < GUN.fireEvery * 3 + 10; i++) {
      step(world, frame);
      const now = wheels(world);
      expect(now.length, 'two wheels in the air at once').toBeLessThanOrEqual(1);
      // A wheel one step old: every throw is seen the same step after it, so the gaps are exact.
      if (now.length === 1 && now[0]!.lifeFor === WHEEL.life - 1) thrownAt.push(world.steps);
    }
    // The first is the life's own, on the next beat; the rest are on the ten-beat grid every gun's is (0094).
    expect(thrownAt.length).toBeGreaterThanOrEqual(3);
    expect(thrownAt[1]! - thrownAt[0]!).toBeLessThanOrEqual(GUN.fireEvery);
    expect(thrownAt[2]! - thrownAt[1]!).toBe(GUN.fireEvery);
    expect(thrownAt[1]! % GUN.fireEvery, 'the second wheel is off the grid').toBe(0);
  });

  it('flies out and hangs where it was thrown to, in the camera’s frame, spinning', () => {
    const { world, frame } = armed();
    step(world, frame);
    const disc = wheels(world)[0]!;
    const muzzle = world.ship.along + world.shipRow.muzzle.along;
    let fastest = 0;
    for (let i = 0; i < 90; i++) {
      const before = disc.along;
      step(world, frame);
      fastest = Math.max(fastest, disc.along - before - world.scrollPerStep);
    }
    expect(fastest, 'it left faster than its row lets it').toBeLessThanOrEqual(DISC.speed + 1e-9);
    // Hanging: a held ship and a wheel that has stopped moving in the camera, about `hang` ahead.
    const inView = disc.along - world.cameraAlong;
    step(world, frame);
    expect(Math.abs(disc.along - world.cameraAlong - inView), 'it is still moving after it should hang').toBeLessThan(0.2);
    expect(disc.along - (muzzle + 90 * world.scrollPerStep)).toBeGreaterThan(WHEEL.hang * 0.9);
    const turn = disc.turn;
    step(world, frame);
    expect(disc.turn, 'it does not spin').not.toBe(turn);
  });

  it('THE ASK, IN THE PLAYER’S UNITS: going back and forth sweeps the tether across what is between', () => {
    /*
      *"You can go back and forth with it."* A body standing off to one side of the line from the ship to
      the hanging wheel is untouched while the ship holds still, and struck once the ship flies across so
      the tether sweeps through it — the wheel is the fixed end and the ship the moving one.
    */
    const { world, frame, stick } = armed();
    for (let i = 0; i < 60; i++) step(world, frame);
    const disc = wheels(world)[0]!;
    const body = target(world, (disc.along - world.ship.along) / 2, -24);
    for (let i = 0; i < 20; i++) step(world, frame);
    expect(body.health, 'the tether reached a body well off its line').toBe(999);
    stick.across = -1;
    for (let i = 0; i < 90 && body.health === 999; i++) step(world, frame);
    expect(body.health, 'the tether swept over the body and landed nothing').toBeLessThan(999);
  });

  it('is on a leash: a ship that flies away tows it, and the tether is never longer than the leash', () => {
    const { world, frame, stick } = armed();
    for (let i = 0; i < 40; i++) step(world, frame);
    stick.along = -1;
    stick.across = 1;
    let longest = 0;
    for (let i = 0; i < 150 && wheels(world).length > 0; i++) {
      step(world, frame);
      const disc = wheels(world)[0];
      if (disc === undefined) break;
      const dA = disc.along - (world.ship.along + world.shipRow.muzzle.along);
      const dC = disc.across - (world.ship.across + world.shipRow.muzzle.across);
      longest = Math.max(longest, Math.hypot(dA, dC));
    }
    expect(longest, 'the tether ran past its leash').toBeLessThanOrEqual(WHEEL.leash + DISC.speed * 2);
  });

  it('burns down over its last beat and is gone before the next is thrown', () => {
    const { world, frame } = armed();
    step(world, frame);
    let faded = false;
    for (let i = 0; i < WHEEL.life + 2; i++) {
      step(world, frame);
      const disc = wheels(world)[0];
      if (disc !== undefined && disc.lifeFor <= WHEEL.fade) faded ||= disc.sprite === SPRITE.catherineFade;
    }
    expect(faded, 'it never burned down').toBe(true);
    expect(wheels(world).length, 'it outlived its life').toBe(0);
  });

  it('throws short embers off its rim that are spent by arriving', () => {
    const { world, frame } = armed();
    let most = 0;
    for (let i = 0; i < 60; i++) {
      step(world, frame);
      most = Math.max(most, cinders(world).length);
      for (const c of cinders(world)) expect(c.lifeFor, 'an ember lives longer than its row says').toBeLessThanOrEqual(WHEEL.emberLife);
    }
    expect(most, 'it threw no embers').toBeGreaterThan(0);
    expect(CINDER.health, 'an ember survives an arrival').toBe(1);
  });

  it('draws its tether every step it burns, as wide as it lands, from the muzzle to the wheel', () => {
    const { world, frame } = armed();
    for (let i = 0; i < 30; i++) step(world, frame);
    let links = 0;
    for (let i = 0; i < world.bolts.size; i++) {
      const b = world.bolts.at(i);
      if (b.kind !== TETHER_BOLT_KIND) continue;
      links++;
      expect(b.radius).toBe(WHEEL.tether);
      const disc = wheels(world)[0]!;
      expect(b.along).toBeCloseTo(disc.along, 6);
      expect(b.along + b.fromAlong).toBeCloseTo(world.ship.along + world.shipRow.muzzle.along, 6);
    }
    expect(links, 'the tether is not one link').toBe(1);
  });

  it('lands only so often on a body held across it, on the blades’ bucket', () => {
    const { world, frame } = armed();
    for (let i = 0; i < 60; i++) step(world, frame);
    const disc = wheels(world)[0]!;
    const body = target(world, (disc.along - world.ship.along) / 2, (disc.across - world.ship.across) / 2);
    const start = body.health;
    const seconds = 2;
    for (let i = 0; i < 60 * seconds; i++) step(world, frame);
    const most = (60 / GUN.landGap!) * seconds * Math.max(WHEEL.tetherDamage, DISC.damage) + 4 * Math.max(WHEEL.tetherDamage, DISC.damage);
    expect(start - body.health, 'it landed more than the bucket allows').toBeLessThanOrEqual(most);
    expect(start - body.health, 'it landed nothing').toBeGreaterThan(0);
  });

  it('goes with the ship that threw it', () => {
    const { world, frame } = armed();
    for (let i = 0; i < 20; i++) step(world, frame);
    respawn(world);
    expect(wheels(world).length).toBe(0);
  });
});
