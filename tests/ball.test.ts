/**
 * The Hamster Ball rolls — `docs/decisions/0593-the-hamster-ball-rolls.md`, item 2 of
 * [`the-secret-pilots-planned`](../reports/the-secret-pilots-planned-2026-10-11.md).
 *
 * The page: *"Least Weasel Pilot — Hamster ball — flies into things to kill them — how to die? / challenge —
 * Unlock – 10 non-bullet deaths — "overheat" → need to let shields recharge. Hamster ball break + recharge."*
 * Answered while it was planned: *"No weapon change for hamster ball"*, and *"hints for unlocks is good"*.
 *
 * ⚠️ **THROUGH THE REAL STEP, NEVER BY WRITING INTO THE GAUGE.** What is under test is the ram landing
 * through the pairings that exist, the heat its landings raise, and what the ship is hurt by while the ball
 * is whole and while it is broken — a fixture that set `ramHeat` by hand could see none of it.
 *
 * ⚠️ **IN THE PLAYER'S UNITS WHERE THERE ARE ANY** — 0027: seconds broken, and which picture the ship and its
 * heat are drawn as on a given step.
 */

import { describe, expect, it } from 'vitest';

import { GameFrame, RAM_KIND, canThrow, launchSpecial, wearHull, type World } from '../src/app/frame.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { GOLFERS } from '../src/content/golfers.ts';
import type { LevelRow } from '../src/content/levels.ts';
import { PICKUPS } from '../src/content/pickups.ts';
import { BALL_RADIUS, SHIPS, SHIP_KINDS, fitted } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPECIALS } from '../src/content/specials.ts';
import { SPRITE } from '../src/content/sprites.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { reset } from '../src/sim/entity.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { PLAYER_MARGIN } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND, lockHint, gunWhy } from '../src/state/screens.ts';
import { gunOpen, initialHangar, pilotRecord, specialOpen } from '../src/state/slices/hangar.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

const RAM = WEAPONS.ram.ram!;
const DANCE = SPECIALS.warDance.dance!;

/** A world flying the Hamster Ball, its gun held off nothing — there is nothing to hold off. */
function inTheBall(level: LevelRow = NO_LEVEL): { world: World; frame: GameFrame; stick: { along: number; across: number } } {
  const built = playableWorld(level);
  built.world.shipRow = fitted(SHIPS.ball, 'ram');
  built.world.weapon = weaponFor(built.world.shipRow, []);
  built.world.missileIn = Number.MAX_SAFE_INTEGER;
  wearHull(built.world);
  return { world: built.world, frame: new GameFrame(built.world), stick: built.stick };
}

/** A body planted on the ship, riding the camera and holding its fire — `health` of it. */
function bodyOn(world: World, health: number): void {
  const enemy = world.enemies.spawn()!;
  reset(enemy, world.ship.along, world.ship.across, ENEMIES.drifter);
  enemy.health = health;
  enemy.fireIn = Number.MAX_SAFE_INTEGER;
  enemy.velAlong = world.scrollPerStep;
}

/** The ram's body, if the ship is ramming. */
function ramBody(world: World) {
  for (let i = 0; i < world.playerShots.size; i++) if (world.playerShots.at(i).kind === RAM_KIND) return world.playerShots.at(i);
  return null;
}

describe('0593 — the ask: Unity in a hamster ball, flying into things', () => {
  it('Unity flies the ball, and the ball flies the ram and nothing else', () => {
    expect(GOLFERS.unity.ship).toBe('ball');
    expect(GOLFERS.unity.figure).toBe('weasel');
    expect(SHIPS.ball.weapon).toBe('ram');
    expect(WEAPONS.ram.flight).toBe('ram');
    expect(WEAPONS.ram.special).toBe('warDance');
  });

  it('opens after ten lives lost to something flown into, and the band counts them down', () => {
    expect(GOLFERS.unity.opens).toEqual({ after: [], crashes: 10, bought: 0 });
    expect(lockHint(GOLFERS.unity.opens, pilotRecord(initialHangar), 'Unity')).toBe('Crash into something 10 more times to fly Unity');
    expect(lockHint(GOLFERS.unity.opens, pilotRecord({ ...initialHangar, crashes: 9 }), 'Unity')).toBe('Crash into something 1 more time to fly Unity');
    expect(lockHint(GOLFERS.unity.opens, pilotRecord({ ...initialHangar, crashes: 10 }), 'Unity')).toBe(null);
  });

  it('the ram reaches to the drawn ball, and the dance as far', () => {
    expect(RAM.reach).toBe(BALL_RADIUS);
    expect(SHOTS.ram.radius).toBe(BALL_RADIUS);
    expect(DANCE.reach).toBe(BALL_RADIUS);
  });
});

describe('0593 — the ram lands on what the ball flies into', () => {
  it('a body the ball flies into is rammed to death, and the ship is not hurt by it', () => {
    const { world, frame } = inTheBall();
    world.ship.invulnFor = 0;
    const health = world.ship.health;
    bodyOn(world, 1);
    let killed = false;
    for (let i = 0; i < 30 && !killed; i++) {
      frame.step();
      killed = world.enemies.size === 0;
    }
    expect(killed, 'the ball sat on a body for half a second and it did not die').toBe(true);
    expect(world.ship.health, 'the body the ball rammed hurt the ship').toBe(health);
    // And one that will not die, pressed on it with no window a hit gives, for as long as the ball is whole:
    // the one above dies on its first landing, before it could have landed on the ship at all.
    bodyOn(world, 100000);
    for (let i = 0; i < 30 && world.ramBrokenFor === 0; i++) {
      world.ship.invulnFor = 0;
      frame.step();
      expect(world.ship.health, `a body hurt the whole ball ${i + 1} steps in`).toBe(health);
    }
  });

  it('every landing heats the ball, and a full gauge breaks it', () => {
    const { world, frame } = inTheBall();
    bodyOn(world, 100000);
    let broken = -1;
    for (let i = 0; i < 20 * STEPS_PER_SECOND && broken < 0; i++) {
      frame.step();
      if (world.ramBrokenFor > 0) broken = i;
    }
    expect(broken, 'pressed into a body that would not die, the ball never broke').toBeGreaterThan(0);
    // At the ram's own clock: one landing every `landGap` steps (four owed at once), each `heat` of the gauge.
    expect(broken / STEPS_PER_SECOND, 'broke sooner than its landings could have heated it').toBeGreaterThan(((1 / RAM.heat - 4) * (WEAPONS.ram.landGap ?? 0)) / STEPS_PER_SECOND);
  });

  it('broken, the ball is drawn without the ball, rams nothing, and a body hurts it', () => {
    const { world, frame } = inTheBall();
    bodyOn(world, 100000);
    for (let i = 0; i < 20 * STEPS_PER_SECOND && world.ramBrokenFor === 0; i++) frame.step();
    expect(world.ramBrokenFor).toBeGreaterThan(0);
    // The picture says so (0036): the bare hull, and no heat under it.
    expect(world.ship.spriteBase).toBe(SPRITE.ballBare);
    frame.step();
    expect(ramBody(world), 'a broken ball still rams').toBe(null);
    // It blinks through the window a hit gives, so the body it broke inside does not land at once.
    expect(world.ship.invulnFor, 'the ball broke inside a body with no window to get out').toBeGreaterThan(0);
    expect(world.ship.health, 'the body the ball broke in landed on the step it broke').toBeGreaterThan(0);
    // And then what it flies into lands on it: the body it was pressed into is still there.
    world.ship.invulnFor = 0;
    world.ship.health = 3;
    frame.step();
    expect(world.ship.health, 'a broken ball was not hurt by the body it sat in').toBeLessThan(3);
  });

  it('comes back whole and cool after its recharge — seconds broken, as the row says', () => {
    const { world, frame } = inTheBall();
    bodyOn(world, 100000);
    for (let i = 0; i < 20 * STEPS_PER_SECOND && world.ramBrokenFor === 0; i++) frame.step();
    world.enemies.clear();
    let broken = 0;
    while (world.ramBrokenFor > 0 && broken < 60 * STEPS_PER_SECOND) {
      // Kept alive through it, so the clock is the ball's and not a death's.
      world.ship.health = 3;
      frame.step();
      broken++;
    }
    expect(broken / STEPS_PER_SECOND).toBeCloseTo(RAM.recharge / STEPS_PER_SECOND, 1);
    expect(world.ramHeat).toBe(0);
    expect(world.ship.spriteBase).toBe(SPRITE.ball);
  });

  it('the heat cools once the ball has touched nothing for a while', () => {
    const { world, frame } = inTheBall();
    bodyOn(world, 100000);
    for (let i = 0; i < 30 && world.ramHeat < 0.3; i++) frame.step();
    world.enemies.clear();
    const hot = world.ramHeat;
    expect(hot).toBeGreaterThan(0);
    for (let i = 0; i < RAM.cool; i++) frame.step();
    expect(world.ramHeat, 'it cooled before its row says it starts to').toBe(hot);
    for (let i = 0; i < 2 * STEPS_PER_SECOND; i++) frame.step();
    expect(world.ramHeat, 'two seconds touching nothing and it did not cool').toBeLessThan(hot);
  });

  it('the heat is drawn: the ram under the ball wears the gauge’s stage', () => {
    const { world, frame } = inTheBall();
    frame.step();
    expect(ramBody(world)?.sprite).toBe(SPRITE.ramHeat0);
    bodyOn(world, 100000);
    for (let i = 0; i < 20 * STEPS_PER_SECOND && world.ramHeat < 0.8; i++) frame.step();
    frame.step();
    expect(ramBody(world)?.sprite, `at ${world.ramHeat.toFixed(2)} of the gauge the heat under the ball is not drawn`).toBe(SPRITE.ramHeat3);
  });

  it('fire still lands on a whole ball: it is only bodies the ball shrugs off', () => {
    const { world, frame } = inTheBall();
    world.ship.invulnFor = 0;
    const health = world.ship.health;
    const shot = world.enemyShots.spawn()!;
    reset(shot, world.ship.along + 6, world.ship.across, SHOTS.spit);
    shot.velAlong = -SHOTS.spit.speed + world.scrollPerStep;
    for (let i = 0; i < 12; i++) frame.step();
    expect(world.ship.health, 'an enemy shot passed through a whole ball').toBeLessThan(health);
  });
});

describe('0593 — the ram is the ball, and goes on no other ship', () => {
  const everyWin = { ...initialHangar, won: Object.fromEntries(SHIP_KINDS.map((k) => [k, true])) as typeof initialHangar.won };

  it('no ship may fly the ram, and the ball may fly no other gun, however much is won', () => {
    for (const ship of SHIP_KINDS) {
      if (ship === 'ball') continue;
      expect(gunOpen(everyWin, ship, 'ball'), `the ${ship} may fly the ram`).toBe(false);
      expect(gunOpen(everyWin, 'ball', ship), `the ball may fly the ${ship}'s gun`).toBe(false);
    }
    expect(gunOpen(everyWin, 'ball', 'ball')).toBe(true);
    expect(gunWhy('ball', true, false)).toBe('The Hamster Ball flies nothing but its ram');
  });

  it('and no other ship may open with the War Dance until every ship can dance', () => {
    expect(SPECIALS.warDance.shared).toBe(false);
    for (const ship of SHIP_KINDS) if (ship !== 'ball') expect(specialOpen(everyWin, ship, 'ball'), ship).toBe(false);
    expect(PICKUPS.bomb.faces, 'the War Dance is a face on the bomb pickup before every ship can dance').not.toContain(SPRITE.pickupDance);
  });
});

describe('0593 — the War Dance', () => {
  it('the ship bounces round its box on its own, and stays in it', () => {
    const { world, frame } = inTheBall();
    launchSpecial(world, 'warDance');
    expect(world.danceFor).toBe(DANCE.steps);
    let turned = 0;
    let was = world.danceAcross;
    for (let i = 0; i < DANCE.steps - 1; i++) {
      frame.step();
      if (Math.sign(world.danceAcross) !== Math.sign(was)) turned++;
      was = world.danceAcross;
      expect(world.ship.across).toBeGreaterThanOrEqual(PLAYER_MARGIN - 1e-6);
      expect(world.ship.across).toBeLessThanOrEqual(ACROSS_SPAN - PLAYER_MARGIN + 1e-6);
    }
    expect(turned, 'three seconds of dance never met an edge of the box').toBeGreaterThan(0);
    frame.step();
    expect(world.danceFor, 'the dance outlived its row').toBe(0);
  });

  it('nothing hurts a dancing ship, and it heats nothing as it rams', () => {
    const { world, frame } = inTheBall();
    launchSpecial(world, 'warDance');
    world.ship.invulnFor = 0;
    const health = world.ship.health;
    for (let i = 0; i < 60; i++) {
      // Something on the ship every step it dances: a body to ram and a shot to be hit by.
      if (world.enemies.size === 0) bodyOn(world, 100000);
      else reset(world.enemies.at(0), world.ship.along, world.ship.across, ENEMIES.drifter);
      world.enemies.at(0).health = 100000;
      world.enemies.at(0).fireIn = Number.MAX_SAFE_INTEGER;
      const shot = world.enemyShots.spawn();
      if (shot !== null) reset(shot, world.ship.along, world.ship.across, SHOTS.spit);
      frame.step();
    }
    expect(world.ship.health, 'a dancing ship was hurt').toBe(health);
    expect(world.ramHeat, 'the dance heated the ball').toBe(0);
  });

  it('a press while it dances is refused, so it costs nothing', () => {
    const { world } = inTheBall();
    expect(canThrow(world, 'warDance')).toBe(true);
    launchSpecial(world, 'warDance');
    expect(canThrow(world, 'warDance')).toBe(false);
  });
});
