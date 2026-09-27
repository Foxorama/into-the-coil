/**
 * A target takes a blade only so often — `docs/decisions/0391-a-target-takes-a-blade-so-often.md`.
 *
 * Asked from play, after the hydra's last increments went fastest: *"does it speed up because it has
 * more hit box and the shurikens hit it more times? if that's the case let's cap the max number of
 * shuriken hits on any one target."* Measured, it did — 80 landings a second on one head, 151 on five —
 * and this holds the ceiling where the player meets it: landings a second on a boss, flown.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame, wearHull } from '../src/app/frame.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { collideInto } from '../src/sim/collide.ts';
import { type Entity, makeEntity, reset } from '../src/sim/entity.ts';
import { Pool } from '../src/sim/pool.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

const NEVER = Number.MAX_SAFE_INTEGER;
const GAP = WEAPONS.shuriken.landGap!;
/** The ceiling, in landings a second. */
const CEILING = STEPS_PER_SECOND / GAP;

const solo = (boss: 'gyre' | 'hydra', place: 'shoal' | 'gauntlet'): LevelRow => ({
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 200,
  midBoss: null,
  sections: NO_SECTIONS,
  boss,
  theme: LEVELS[place].theme,
  corridor: LEVELS[place].corridor?.bank !== undefined ? LEVELS[place].corridor : undefined,
});

/**
 * The shuriken at its last rung on a boss held at `fraction`, the ship held on `lane` and short of the
 * hull, and the blade landings counted a second at a time for ten seconds after three to warm up.
 */
function landingsASecond(level: LevelRow, fraction: number, lane: number): number[] {
  const { world } = playableWorld(level, 'savior');
  const frame = new GameFrame(world);
  world.weapon = weaponFor(world.shipRow, ['weapon', 'weapon', 'weapon', 'weapon'], 'shuriken');
  wearHull(world);
  const seconds: number[] = [];
  let start = -1;
  for (let step = 0; step < 60 * 120; step++) {
    world.ship.health = world.shipRow.health;
    world.ship.invulnFor = NEVER;
    world.missileIn = NEVER;
    const boss = world.bossPool.size > 0 && world.bossEntering < 0 ? world.bossPool.at(0) : null;
    if (boss !== null) {
      if (start < 0) start = step;
      boss.health = world.bossFullHealth * fraction;
      boss.fireIn = 999;
      world.enemyShots.clear();
      world.ship.across = lane;
      world.ship.along = boss.along - boss.radius - 45;
    }
    frame.step();
    if (start < 0 || step - start < 3 * STEPS_PER_SECOND) continue;
    const sec = Math.floor((step - start) / STEPS_PER_SECOND) - 3;
    if (sec >= 10) break;
    // The blade's log: every landing of the gun this step, on a body or the hull (0234, 0227).
    seconds[sec] = (seconds[sec] ?? 0) + world.hits.count;
  }
  return seconds;
}

describe('0391 — a target takes a blade only so often', () => {
  it('THE REPORTED ONE, IN LANDINGS A SECOND: the hydra’s five heads take no more blades than the ceiling', () => {
    /*
      The whole of the report, where the player meets it: flown, the gun's landings on the hydra at its
      last phase, five heads and a hull, counted every second for ten — none over the ceiling, and a
      burst's worth of slack. Before this, the same gun landed 151 a second there, and 80 on one head.
    */
    const heads = landingsASecond(solo('hydra', 'gauntlet'), 0.1, 60);
    expect(Math.max(...heads), 'the flight landed nothing, so this measured nothing').toBeGreaterThan(0);
    for (const [i, n] of heads.entries()) {
      expect(n, `second ${i + 1}: ${n} blades landed on the hydra, whose ceiling is ${CEILING}`).toBeLessThanOrEqual(CEILING + 4);
    }
  });

  it('and on the gyre, a hull a dozen blades can cross at once, the same ceiling holds', () => {
    const gyre = landingsASecond(solo('gyre', 'shoal'), 0.9, 50);
    expect(Math.max(...gyre), 'the flight landed nothing, so this measured nothing').toBeGreaterThan(0);
    for (const [i, n] of gyre.entries()) expect(n, `second ${i + 1}: ${n} blades landed on the gyre`).toBeLessThanOrEqual(CEILING + 4);
  });

  /** Blades — shots with health to spare, which is what `collideInto` treats as one. */
  function blades(n: number): Pool<Entity> {
    const pool = new Pool<Entity>(n, makeEntity);
    for (let i = 0; i < n; i++) reset(pool.spawn()!, 100, 50, { sprite: 0, spriteHit: 0, radius: 1, health: 9, damage: 1 });
    return pool;
  }
  function targets(n: number): Pool<Entity> {
    const pool = new Pool<Entity>(n, makeEntity);
    for (let i = 0; i < n; i++) reset(pool.spawn()!, 100, 50, { sprite: 0, spriteHit: 0, radius: 3, health: 1000, damage: 1 });
    return pool;
  }

  it('each target keeps its own clock, and a blade the clock refuses is neither spent nor landed', () => {
    const shots = blades(12);
    const two = targets(2);
    collideInto(shots, two, 1, 1, 6, null, null, GAP);
    expect(two.at(0).health, 'the first target took nothing').toBeLessThan(1000);
    expect(two.at(1).health, 'one clock was shared by two targets, so the second took nothing').toBeLessThan(1000);
    let fresh = 0;
    for (let i = 0; i < shots.size; i++) if (shots.at(i).health === 9 && shots.at(i).landIn === 0) fresh++;
    expect(fresh, 'every blade was spent or marked landed, so none was held back').toBeGreaterThan(0);
  });

  it('a gate is one clock for every target it is given — a boss’s body shares its hull’s', () => {
    const shots = blades(12);
    const body = targets(3);
    const hull = makeEntity();
    collideInto(shots, body, 1, 1, 6, null, null, GAP, hull);
    const taken = [0, 1, 2].reduce((sum, i) => sum + (1000 - body.at(i).health), 0);
    // One step: the burst's allowance and no more, across all three nodes of the one animal.
    expect(taken, 'three nodes of one animal each took the gun as a target of its own').toBeLessThanOrEqual(4);
  });

  it('a shot that is spent by arriving is never held back — the pulse has no ceiling here', () => {
    const shots = new Pool<Entity>(8, makeEntity);
    for (let i = 0; i < 8; i++) reset(shots.spawn()!, 100, 50, { sprite: 0, spriteHit: 0, radius: 1, health: 1, damage: 1 });
    const one = targets(1);
    collideInto(shots, one, 1, 1, 6, null, null, GAP);
    expect(1000 - one.at(0).health, 'a pulse was held back by the blade ceiling').toBe(8);
  });
});
