import { describe, expect, it } from 'vitest';

import { GameFrame, launchSpecial, type World } from '../src/app/frame.ts';
import { openBy, phaseFor } from '../src/app/boss.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SPECIALS } from '../src/content/specials.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { reset, type Entity } from '../src/sim/entity.ts';
import { NO_LEVEL, NO_SECTIONS, playableWorld } from './world.ts';

/**
 * THE STORM AND THE WHIRLPOOL — `docs/decisions/0374-the-storm-and-the-whirlpool.md`.
 *
 * Every number is read off the row it is about, so a storm tuned wider or a whirlpool tuned slower
 * moves the guard with it. What is held is the shape: a storm strikes, chains once, and flickers;
 * a whirlpool turns, grows, lands again and again, and is gone only when none of it can be seen.
 */

const NEVER = Number.MAX_SAFE_INTEGER;
const STORM = SPECIALS.storm.storm!;
const WHIRL = SPECIALS.whirlpool.whirl!;

function quiet(level: LevelRow = NO_LEVEL): { world: World; frame: GameFrame } {
  const { world } = playableWorld(level);
  world.fireIn = NEVER;
  world.missileIn = NEVER;
  return { world, frame: new GameFrame(world) };
}

/** A body that holds its place in the camera, never shoots, and cannot be killed by one strike. */
function body(world: World, ahead: number, across: number, radius = ENEMIES.turret.radius): Entity {
  const enemy = world.enemies.spawn()!;
  reset(enemy, world.ship.along + ahead, across, { ...ENEMIES.turret, health: 999, radius }, world.enemyKinds.turret);
  enemy.fireIn = NEVER;
  enemy.velAlong = world.scrollPerStep;
  return enemy;
}

/** Step until the storm's ball has gone off, and one step more so its strikes have landed. */
function untilItGoesOff(world: World, frame: GameFrame): void {
  for (let i = 0; i < 200 && world.bombs.size > 0; i++) {
    world.ship.invulnFor = 2;
    frame.step();
  }
  expect(world.bombs.size, 'the storm never went off').toBe(0);
}

describe('0374 — the arc’s and the shuriken’s own', () => {
  it('THE ASK: the lightning gun overflows to the storm and the shuriken to the whirlpool', () => {
    expect(WEAPONS.arc.special).toBe('storm');
    expect(WEAPONS.shuriken.special).toBe('whirlpool');
  });
});

describe('0374 — the storm: strikes across the screen, and each chains twice', () => {
  it('strikes the nearest bodies, chains once from each, and lands each strike once', () => {
    const { world, frame } = quiet();
    // Clusters of three a little apart, spread across the screen, so every strike has chains to find.
    const bodies = [];
    for (let c = 0; c < STORM.strikes; c++) {
      const along = 50 + (c % 3) * 30;
      const across = 15 + Math.floor(c / 3) * 60;
      for (let k = 0; k < 3; k++) bodies.push(body(world, along + k * 6, across + k * 6));
    }
    launchSpecial(world, 'storm');
    untilItGoesOff(world, frame);
    const struck = bodies.filter((b) => b.health < 999);
    expect(struck.length, 'the storm struck no more than its first strikes, so nothing chained').toBeGreaterThan(STORM.strikes);
    expect(struck.length, 'the storm chained more than twice for a hit').toBeLessThanOrEqual(STORM.strikes * (1 + STORM.chains));
    for (const b of struck) expect(999 - b.health, 'a body was struck more than once by one storm').toBe(STORM.damage);
  });

  it('flickers across the screen for as long as the row says, and then stops', () => {
    const { world, frame } = quiet();
    launchSpecial(world, 'storm');
    untilItGoesOff(world, frame);
    let lit = 0;
    for (let i = 0; i < STORM.flickerSteps + 20; i++) {
      frame.step();
      if (i < STORM.flickerSteps - 1 && world.bolts.size > 0) lit++;
    }
    // Lit most of the time rather than every step: a renewal leaves a step between two generations,
    // which is the flicker. What is held is that it goes on for about as long as the row says.
    expect(lit, 'the flicker went out before the row said').toBeGreaterThanOrEqual(STORM.flickerSteps * 0.75);
    expect(world.bolts.size, 'the flicker outlived the storm').toBe(0);
    expect(world.stormFor).toBe(0);
  });

  it('lands its share on a boss, once', () => {
    const level = LEVELS.approach;
    const arena: LevelRow = { ...NO_LEVEL, bossAt: 200, midBoss: null, sections: NO_SECTIONS, boss: 'volans', theme: level.theme };
    const { world, frame } = quiet(arena);
    let arrived = -1;
    for (let i = 0; i < 4000 && (arrived < 0 || i < arrived + 60); i++) {
      world.ship.invulnFor = 2;
      frame.step();
      if (arrived < 0 && world.bossPool.size > 0 && world.bossEntering < 0) arrived = i;
    }
    expect(world.bossPool.size, 'the boss never arrived').toBe(1);
    const head = world.bossPool.at(0);
    head.fireIn = NEVER;
    world.ship.across = head.across;
    world.ship.along = head.along - head.radius - 70;
    world.ship.prevAlong = world.ship.along;
    const before = head.health;
    const open = openBy(phaseFor(world.bossRow, head.health, world.bossFullHealth));
    launchSpecial(world, 'storm');
    untilItGoesOff(world, frame);
    const expected = Math.max(STORM.damage, STORM.bossShare * world.bossFullHealth) * open;
    expect(before - world.bossPool.at(0).health, 'the storm landed something other than its share, once').toBeCloseTo(expected, 5);
  });
});

describe('0374 — the whirlpool: turns, grows, lands again and again, and ends off the screen', () => {
  it('opens with every blade, turns and grows, and loses none of them while it lasts', () => {
    const { world, frame } = quiet();
    launchSpecial(world, 'whirlpool');
    expect(world.whirl.size, 'the whirlpool did not open with every blade').toBe(WHIRL.arms * WHIRL.blades);
    const centreAlong = (): number => world.cameraAlong + world.whirlOffset;
    const spread = (): number => {
      let far = 0;
      for (let i = 0; i < world.whirl.size; i++) {
        const b = world.whirl.at(i);
        far = Math.max(far, Math.hypot(b.along - centreAlong(), b.across - world.whirlAcross));
      }
      return far;
    };
    const first = spread();
    const angle0 = Math.atan2(world.whirl.at(0).across - world.whirlAcross, world.whirl.at(0).along - centreAlong());
    for (let i = 0; i < 30; i++) {
      world.ship.invulnFor = 2;
      frame.step();
      expect(world.whirl.size, 'a blade was lost while the whirlpool was still turning').toBe(WHIRL.arms * WHIRL.blades);
    }
    expect(spread(), 'the whirlpool did not grow').toBeGreaterThan(first + 29 * WHIRL.grow);
    const angle1 = Math.atan2(world.whirl.at(0).across - world.whirlAcross, world.whirl.at(0).along - centreAlong());
    expect(Math.abs(angle1 - angle0), 'the whirlpool did not turn').toBeGreaterThan(0.5);
  });

  it('lands on the same body again and again as it turns over it', () => {
    // A body a boss's size — the claim is *"it can hit bosses multiple times as it whirlpools around."*
    const { world, frame } = quiet();
    const target = body(world, WHIRL.ahead + WHIRL.start + 20, world.ship.across, 14);
    launchSpecial(world, 'whirlpool');
    for (let i = 0; i < 180; i++) {
      world.ship.invulnFor = 2;
      frame.step();
    }
    expect((999 - target.health) / WHIRL.damage, 'the whirlpool landed on one body only once').toBeGreaterThan(2);
  });

  it('and is gone once none of it can be on the screen, and not before', () => {
    const { world, frame } = quiet();
    launchSpecial(world, 'whirlpool');
    let onScreen = 0;
    let steps = 0;
    for (; steps < 2000 && world.whirl.size > 0; steps++) {
      world.ship.invulnFor = 2;
      frame.step();
      let seen = false;
      for (let i = 0; i < world.whirl.size; i++) {
        const b = world.whirl.at(i);
        const inView = b.along - world.cameraAlong;
        if (inView > 0 && inView < world.view.alongSpan && b.across > 0 && b.across < 100) seen = true;
      }
      if (seen) onScreen = steps;
    }
    expect(world.whirl.size, 'the whirlpool never closed').toBe(0);
    expect(onScreen, 'the whirlpool was never on the screen, so its end proves nothing').toBeGreaterThan(0);
    // It closes after the last step a blade was seen, never while one still was.
    expect(steps, 'the whirlpool closed while part of it was still on the screen').toBeGreaterThan(onScreen);
  });
});
