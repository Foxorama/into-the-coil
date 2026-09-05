/**
 * The frost ship chills — `docs/decisions/0253-the-frost-ship-chills.md`.
 *
 * The Rime Shelf's real boss, from the brief: *"the rime shelf will have a enemy ship that fires
 * frost bolts and frost blasts, if you get too close it will slow you down and freeze you. it needs
 * some adds as well."* What is held here is that the frost is its own shot in its own ink, sitting
 * in the one slot the size ladder had left; that a ship inside the hull's cold flies at the row's
 * share of its speed, freezes after the row's steps inside, and is let go on leaving; that the
 * adds are the Rime Shelf's own enemy, called in pairs; and that the picture says *cold* while the
 * model does. What a boss IS is `tests/bosses.test.ts`'s and `tests/level.test.ts`'s.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { phaseFor } from '../src/app/boss.ts';
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { BURST } from '../src/content/debris.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { INK_OF } from '../src/render/bake.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** The frost ship alone, a short way in, with no mid-boss in front of it. */
const FROST_ONLY: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 200,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'hoarfrost',
  theme: 'rime',
};

type Driven = { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame };

/** The frost ship on station at `fraction` of its health, its fan held, and an immortal ship. */
function frostAt(fraction: number): Driven {
  const { world } = playableWorld(FROST_ONLY);
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
    frame.step();
  }
  expect(world.bossPool.size, 'the frost ship never arrived').toBe(1);
  world.bossPool.at(0).health = world.bossFullHealth * fraction;
  world.enemyShots.clear();
  world.enemies.clear();
  return { world, frame };
}

const chill = BOSSES.hoarfrost.chill!;

/** Hold the stick across the lane, whole and unhurt, with the fan held. */
function pushAcross(d: Driven, direction: number): void {
  d.world.input = {
    contribute: (intent) => {
      intent.along = 0;
      intent.across = direction;
    },
    spend: () => {},
    release: () => {},
  };
  d.world.ship.health = d.world.shipRow.health;
  d.world.ship.invulnFor = 0;
  d.world.enemyShots.clear();
  d.world.bossPool.at(0).fireIn = 999;
}

/**
 * Park the ship `dAlong`, `dAcross` from the hull, still, and push it across the lane for `steps`,
 * keeping it at that distance along; how far across it got.
 */
function pushFrom(d: Driven, dAlong: number, dAcross: number, steps: number): number {
  const { world, frame } = d;
  const boss = world.bossPool.at(0);
  world.ship.along = boss.along + dAlong;
  world.ship.across = boss.across + dAcross;
  world.ship.velAlong = world.scrollPerStep;
  world.ship.velAcross = 0;
  const from = world.ship.across;
  for (let i = 0; i < steps; i++) {
    pushAcross(d, 1);
    // Along is pinned so the distance is the test's and not the boss's drift.
    world.ship.along = boss.along + dAlong;
    frame.step();
  }
  return world.ship.across - from;
}

describe('0253 — the frost ship chills', () => {
  it('THE FROST: a shard between the acid and the rock in size and speed, in its own cold ink — and the Rime Shelf’s real boss is the one thing that throws it and the one hull that chills', () => {
    const drawn = SPRITE_EXTENT[SPRITE_KINDS[SHOTS.frost.sprite]!];
    expect(drawn).toBeGreaterThan(SPRITE_EXTENT[SPRITE_KINDS[SHOTS.acid.sprite]!]);
    expect(drawn).toBeLessThan(SPRITE_EXTENT[SPRITE_KINDS[SHOTS.rock.sprite]!]);
    expect(SHOTS.frost.speed).toBeLessThan(SHOTS.acid.speed);
    expect(SHOTS.frost.speed).toBeGreaterThan(SHOTS.rock.speed);
    expect(INK_OF[SPRITE_KINDS[SHOTS.frost.sprite]!], 'the frost is not drawn cold').toBe('frost');
    expect(INK_OF[SPRITE_KINDS[SHOTS.frost.sprite]!]).not.toBe('enemy');
    expect(BOSSES.hoarfrost.shot).toBe('frost');
    expect(BOSS_KINDS.filter((k) => BOSSES[k].chill !== null), 'another hull is cold').toEqual(['hoarfrost']);
    // In the player's units: the cold reaches past the hull by more than a ship, and not half the lane.
    expect(chill.radius - BOSSES.hoarfrost.radius).toBeGreaterThan(8);
    expect(chill.radius).toBeLessThan(ACROSS_SPAN / 2);
    expect(chill.slow).toBeGreaterThan(0.2);
    expect(chill.slow).toBeLessThan(0.8);
    expect(chill.freezeAfter / STEPS_PER_SECOND, 'the freeze comes at once, so the slow is never felt').toBeGreaterThanOrEqual(0.5);
    expect(chill.frozenFor / STEPS_PER_SECOND, 'the freeze outlasts patience').toBeLessThan(1.5);
    expect(LEVELS.batteries.boss).toBe('hoarfrost');
    expect(LEVELS.batteries.theme).toBe('rime');
  });

  it('THE COLD, DRIVEN: a ship inside it flies at the row’s share of its speed, freezes after the row’s steps inside, and is let go on leaving', () => {
    // Outside the cold, and inside it, the same push for the same steps — clear of the hull's touch.
    const steps = 20;
    const near = -(BOSSES.hoarfrost.radius + 6);
    const far = -(chill.radius + 20);
    const free = pushFrom(frostAt(1), far, 0, steps);
    const cold = pushFrom(frostAt(1), near, 0, steps);
    expect(free, 'the ship did not move when pushed').toBeGreaterThan(5);
    const share = cold / free;
    expect(share, `inside the cold the ship covered ${share.toFixed(2)} of what it covers outside, against a row of ${chill.slow}`).toBeGreaterThan(chill.slow - 0.12);
    expect(share).toBeLessThan(chill.slow + 0.12);

    // Stay inside for the row's steps and it freezes: the ship stops answering the stick for the
    // row's own steps, then answers again.
    const d = frostAt(1);
    const { world, frame } = d;
    const boss = world.bossPool.at(0);
    const stayInside = (): void => {
      pushAcross(d, 1);
      world.ship.along = boss.along + near;
      world.ship.across = boss.across;
      world.ship.velAcross = 0;
      frame.step();
    };
    for (let i = 0; i < chill.freezeAfter; i++) stayInside();
    expect(world.frozenFor, 'the ship was not frozen after the row’s steps inside the cold').toBeGreaterThan(0);
    // Frozen: pushed hard across, it goes nowhere for as long as the row says — in seconds.
    let held = 0;
    let moved = 0;
    while (world.frozenFor > 0) {
      pushAcross(d, 1);
      world.ship.along = boss.along + far;
      const before = world.ship.across;
      frame.step();
      held++;
      moved += Math.abs(world.ship.across - before);
    }
    expect(held / STEPS_PER_SECOND).toBeGreaterThanOrEqual(chill.frozenFor / STEPS_PER_SECOND - 0.02);
    expect(moved, `a frozen ship moved ${moved.toFixed(1)} units across the lane`).toBeLessThan(2);
    // Thawed and out of the cold: it answers the stick again.
    const after = pushFrom(d, far, 0, steps);
    expect(after, 'the ship never thawed').toBeGreaterThan(free * 0.8);

    // And leaving the cold before the freeze clears it: back in, the count starts over.
    const e = frostAt(1);
    for (let i = 0; i < chill.freezeAfter - 5; i++) {
      pushAcross(e, 1);
      e.world.ship.along = e.world.bossPool.at(0).along + near;
      e.world.ship.across = e.world.bossPool.at(0).across;
      e.frame.step();
    }
    expect(e.world.chilledFor).toBeGreaterThan(0);
    pushFrom(e, far, 0, 3);
    expect(e.world.chilledFor, 'leaving the cold did not clear it').toBe(0);
    expect(e.world.frozenFor).toBe(0);
  });

  it('THE ADDS AND THE BLASTS: at the lower half a volley calls two shards to the field, and at the last fifth a volley is a ring of frost', () => {
    const d = frostAt(0.4);
    const calling = phaseFor(BOSSES.hoarfrost, d.world.bossPool.at(0).health, d.world.bossFullHealth).attack!;
    expect(calling.kind).toBe('summon');
    if (calling.kind !== 'summon') return;
    expect(calling.enemy, 'the adds are not the Rime Shelf’s own enemy').toBe('shard');
    const before = d.world.enemies.size;
    d.world.bossPool.at(0).fireIn = 1;
    d.world.ship.health = d.world.shipRow.health;
    d.frame.step();
    const kind = d.world.enemyKinds.shard;
    let shards = 0;
    for (let i = before; i < d.world.enemies.size; i++) if (d.world.enemies.at(i).kind === kind) shards++;
    expect(shards, 'the volley called no shards').toBe(calling.count);

    const e = frostAt(0.15);
    const throwing = phaseFor(BOSSES.hoarfrost, e.world.bossPool.at(0).health, e.world.bossFullHealth);
    expect((throwing.attack ?? BOSSES.hoarfrost.attack).kind, 'the last fifth is not the blasts').toBe('ring');
    e.world.bossPool.at(0).fireIn = 1;
    e.world.ship.health = e.world.shipRow.health;
    e.frame.step();
    expect(e.world.enemyShots.size, 'the ring threw fewer than its shots').toBeGreaterThanOrEqual(throwing.shots);
    for (let i = 0; i < e.world.enemyShots.size; i++) expect(e.world.enemyShots.at(i).sprite, 'a blast is not frost').toBe(SHOTS.frost.sprite);
  });

  it('THE PICTURE: a ship in the cold puffs frost every few steps, and the step it freezes bursts', () => {
    /*
      0036: the model slows a ship and the picture must say so for as long as it does — a trickle,
      as a bared boss sheds — and say the freeze once, louder.
    */
    const d = frostAt(1);
    const { world, frame } = d;
    const boss = world.bossPool.at(0);
    const near = -(BOSSES.hoarfrost.radius + 6);
    let puffs = 0;
    let atFreeze = 0;
    for (let i = 0; i < chill.freezeAfter; i++) {
      pushAcross(d, 1);
      world.ship.along = boss.along + near;
      world.ship.across = boss.across;
      world.ship.velAcross = 0;
      const debrisBefore = world.debris.size;
      const frozenBefore = world.frozenFor;
      frame.step();
      let nearShip = 0;
      for (let j = debrisBefore; j < world.debris.size; j++) {
        const piece = world.debris.at(j);
        if (Math.hypot(piece.along - world.ship.along, piece.across - world.ship.across) < 6) nearShip++;
      }
      if (world.frozenFor > 0 && frozenBefore === 0) atFreeze = nearShip;
      else if (nearShip > 0) puffs++;
    }
    expect(puffs, 'a ship in the cold shed no frost').toBeGreaterThanOrEqual(Math.floor(chill.freezeAfter / 6) - 2);
    expect(atFreeze, 'the freeze was not drawn').toBeGreaterThanOrEqual(BURST.freeze);
  });
});
