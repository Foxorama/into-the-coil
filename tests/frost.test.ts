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
 *
 * And since `docs/decisions/0263-the-frost-ship-shatters.md`: that a shard has a life after the
 * muzzle — two bolts about its heading, then a snowflake of six from each, then a melt — driven
 * and counted in the player's units; that the adds come in from the sides and shatter into a
 * snowflake where they die; and that both are drawn.
 *
 * And since `docs/decisions/0371-the-ice-is-staggered.md`: that every fuse is rolled inside its row's
 * range and the stages hold at both ends of it, and that in both frost fights, on every tier, no two
 * shards leave the hull on one step and no two open on one step.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { phaseFor } from '../src/app/boss.ts';
import { BOSSES, BOSS_KINDS, type BossAttack, type BossKind } from '../src/content/bosses.ts';
import { BURST } from '../src/content/debris.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SHARD_VOLLEY, SHOTS, SHOT_INDEX, SHOT_KINDS, type ShotKind } from '../src/content/shots.ts';
import { DIFFICULTY_KINDS, fireGapFor } from '../src/content/difficulty.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { INK_OF } from '../src/render/bake.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { reset } from '../src/sim/entity.ts';
import { PLAYER_ALONG_MARGIN } from '../src/sim/flight.ts';
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
  // Towards the side with room, so the measure is the cold's and not the wall's — the boss sits in a
  // different place in 0364's wider lane, and a push towards the near wall stopped on it.
  const toward = from < ACROSS_SPAN / 2 ? 1 : -1;
  for (let i = 0; i < steps; i++) {
    pushAcross(d, toward);
    // Along is pinned so the distance is the test's and not the boss's drift.
    world.ship.along = boss.along + dAlong;
    frame.step();
  }
  return Math.abs(world.ship.across - from);
}

/**
 * How many frost shots at `stage` have appeared since the last call — 0371. A shot is marked seen on
 * its `entrySlot`, which only an enemy's entry reads and `reset` zeroes, so a recycled slot counts
 * again. Frost only: the Rime Shelf's adds spit, and a spit is at its first stage for ever.
 */
function freshAt(world: Driven['world'], stage: number): number {
  let fresh = 0;
  for (let i = 0; i < world.enemyShots.size; i++) {
    const shot = world.enemyShots.at(i);
    if (shot.kind !== SHOT_INDEX.frost || shot.turnsLeft !== stage || shot.entrySlot !== 0) continue;
    shot.entrySlot = -1;
    fresh++;
  }
  return fresh;
}

/** Shards the hull has thrown since the last call. */
const freshShards = (world: Driven['world']): number => freshAt(world, 0);

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

  it('THE ADDS AND THE BLASTS: at the lower half a volley calls two shards to the field, from the sides, and at the last fifth a volley is the widest spray of frost', () => {
    const d = frostAt(0.4);
    const calling = phaseFor(BOSSES.hoarfrost, d.world.bossPool.at(0).health, d.world.bossFullHealth).attack!;
    expect(calling.kind).toBe('summon');
    if (calling.kind !== 'summon') return;
    expect(calling.enemy, 'the adds are not the Rime Shelf’s own enemy').toBe('shard');
    // From the sides — 0263, on 0262's flank: *"the adds weren't great"* was a pair in a vee down
    // the lane; a pair that comes in from an edge, steering for a lane, is a thing to turn for.
    expect(calling.from, 'the adds come down the lane rather than in from a side').toBe('sides');
    const before = d.world.enemies.size;
    d.world.bossPool.at(0).fireIn = 1;
    d.world.ship.health = d.world.shipRow.health;
    d.frame.step();
    const kind = d.world.enemyKinds.shard;
    let shards = 0;
    for (let i = before; i < d.world.enemies.size; i++) {
      const add = d.world.enemies.at(i);
      if (add.kind !== kind) continue;
      shards++;
      expect(add.across < 0 || add.across > ACROSS_SPAN, 'an add arrived inside the lane rather than from a side').toBe(true);
      expect(add.steerAcross, 'an add from the side is not steering for a lane').toBeGreaterThan(0);
      expect(add.steerAcross).toBeLessThan(ACROSS_SPAN);
    }
    expect(shards, 'the volley called no shards').toBe(calling.count);

    /*
      The blasts are what every shard becomes — 0263 — so the last fifth is not a ring any more: six
      shards that each open into twelve is a screen nobody can read. It is the widest spray of the
      fight, and every shard of it has the row's stages ahead of it.
    */
    const e = frostAt(0.15);
    const throwing = phaseFor(BOSSES.hoarfrost, e.world.bossPool.at(0).health, e.world.bossFullHealth);
    expect((throwing.attack ?? BOSSES.hoarfrost.attack).kind, 'the last fifth is not a spray').toBe('spray');
    for (const phase of BOSSES.hoarfrost.phases) if (phase !== throwing) expect(throwing.spread, 'the last fifth is not the widest spray').toBeGreaterThan(phase.spread);
    e.world.bossPool.at(0).fireIn = 1;
    e.world.ship.health = e.world.shipRow.health;
    e.frame.step();
    // ⚠️ One shard a stagger since 0371, so the volley is counted over its whole length rather than
    // on its first step; `THE STAGGER, DRIVEN` below holds the spacing.
    let thrown = freshShards(e.world);
    for (let s = 0; s < (SHARD_VOLLEY - 1) * fireGapFor(SHOTS.frost.stagger!, e.world.difficulty); s++) {
      e.world.ship.health = e.world.shipRow.health;
      e.world.ship.invulnFor = 0;
      e.frame.step();
      thrown += freshShards(e.world);
    }
    /*
      ⚠️ **UP TO THE SHARD CEILING SINCE 0270, AND THE CEILING IS WHY THIS LINE CHANGED.** It read
      `throwing.shots` flat, which was the whole truth while nothing capped a shattering volley —
      and `docs/decisions/0270-a-shattering-volley-is-counted-in-shards.md` caps one everywhere it
      is thrown, because the hydra's frost head was spending a count shared with four heads that
      throw bullets spent by arriving. The frost ship's own phases are all inside the ceiling, so
      what this asserts about the shipped content is unchanged; what it no longer asserts is that an
      authored count ABOVE the ceiling would be thrown, which is exactly what 0270 refuses.

      ⚠️ **Changed rather than loosened, per 0192**: `min` is the rule now, and a volley that threw
      fewer than the rule says still fails here.
    */
    expect(thrown, 'the spray threw fewer than its shots').toBeGreaterThanOrEqual(Math.min(throwing.shots, SHARD_VOLLEY));
    for (let i = 0; i < e.world.enemyShots.size; i++) {
      expect(e.world.enemyShots.at(i).sprite, 'a blast is not frost').toBe(SHOTS.frost.sprite);
    }
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

describe('0263 — the frost ship shatters', () => {
  const stages = SHOTS.frost.fission;

  /** The ship parked out of the way, whole, with the fan held: the cascade is counted, not dodged. */
  function park(d: Driven): void {
    d.world.ship.health = d.world.shipRow.health;
    d.world.ship.invulnFor = 0;
    d.world.ship.along = d.world.cameraAlong + PLAYER_ALONG_MARGIN;
    d.world.ship.across = 3;
    d.world.ship.velAcross = 0;
    d.world.bossPool.at(0).fireIn = 999;
    // And the rest of a staggered volley held too — 0371 — so one shard is followed through its life
    // alone. The spacing is `THE STAGGER, DRIVEN`'s to hold.
    d.world.bossPool.at(0).sprayLeft = 0;
  }

  /** Which way a shot is flying, in the camera's frame. */
  function headingOf(d: Driven, i: number): number {
    const shot = d.world.enemyShots.at(i);
    return Math.atan2(shot.velAcross, shot.velAlong - d.world.scrollPerStep);
  }

  /** The smaller angle between two headings. */
  function between(a: number, b: number): number {
    let diff = Math.abs(a - b) % (Math.PI * 2);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    return diff;
  }

  /** Debris within `reach` of any of the recorded points. */
  function debrisNear(d: Driven, alongs: number[], acrosses: number[], reach: number): number {
    let near = 0;
    for (let j = 0; j < d.world.debris.size; j++) {
      const piece = d.world.debris.at(j);
      for (let k = 0; k < alongs.length; k++) {
        if (Math.hypot(piece.along - alongs[k]!, piece.across - acrosses[k]!) < reach) {
          near++;
          break;
        }
      }
    }
    return near;
  }

  it('THE FISSION, DRIVEN: a shard flies its fuse and opens into two bolts about its own heading, each flies its fuse and opens into a snowflake of six, and a flake melts — on the screen, in the near half of it, and drawn', () => {
    /*
      *"The frost attacks should explode into directional frost bullets, which explode into
      snowflake patterns."* The row says it in three stages and the frame is driven through all
      three, counting what is alive after each fuse — so a stage that never fires, fires early, or
      re-aims at the ship would each be a wrong count or a wrong heading here.
    */
    expect(stages.map((s) => s.into), 'the frost is not a fan, then a ring, then a melt').toEqual(['fan', 'ring', 'nothing']);
    // The one shot with a life after the muzzle. Every other row is spent by arriving.
    expect(SHOT_KINDS.filter((k) => SHOTS[k].fission.length > 0)).toEqual(['frost']);

    /*
      ⚠️ **AT BOTH ENDS OF EVERY FUSE — 0371.** A fuse is a range now, and a stage that is right at its
      mean can be wrong at either end: the split behind the camera at the longest, the snowflake in the
      far half at the shortest. So the drive is run twice, and each fuse, once it is lit, is checked to
      be inside the row's range and then pinned to that end of it.
    */
    for (const end of ['least', 'most'] as const) lifeOfOneShard(end);
  });

  /** Every shot at `stage` whose fuse was lit this step: inside the row's range, then pinned to `end`. */
  function pinFuses(d: Driven, stage: number, end: 'least' | 'most'): void {
    const fuse = stages[stage]!.after;
    for (let i = 0; i < d.world.enemyShots.size; i++) {
      const shot = d.world.enemyShots.at(i);
      if (shot.turnsLeft !== stage) continue;
      expect(shot.fireIn, `a stage ${stage} fuse was rolled outside the row's range`).toBeGreaterThanOrEqual(fuse.least);
      expect(shot.fireIn).toBeLessThanOrEqual(fuse.most);
      shot.fireIn = fuse[end];
    }
  }

  function lifeOfOneShard(end: 'least' | 'most'): void {
    const d = frostAt(1);
    const { world, frame } = d;
    park(d);
    world.bossPool.at(0).fireIn = 1;
    frame.step();
    const shards = world.enemyShots.size;
    expect(shards, 'the wall threw nothing').toBeGreaterThanOrEqual(1);
    for (let i = 0; i < shards; i++) expect(between(headingOf(d, i), Math.PI), 'a shard from the wall is not flying down the lane').toBeLessThan(1e-6);
    pinFuses(d, 0, end);

    // The first fuse: nothing opens before it burns down. A stage is exactly as long as its fuse,
    // counted from the step the shot came to be — the volley step above is the first of them.
    const fan = stages[0]!;
    if (fan.into !== 'fan') return;
    for (let s = 1; s < fan.after[end]; s++) {
      park(d);
      frame.step();
      expect(world.enemyShots.size, `a shard opened ${fan.after[end] - s} steps early at the ${end} fuse`).toBe(shards);
    }
    const splitAlong: number[] = [];
    const splitAcross: number[] = [];
    for (let i = 0; i < shards; i++) {
      splitAlong.push(world.enemyShots.at(i).along);
      splitAcross.push(world.enemyShots.at(i).across);
    }
    park(d);
    frame.step();
    expect(world.enemyShots.size, 'the shard did not open into the fan').toBe(shards * fan.shots);
    pinFuses(d, 1, end);
    for (let i = 0; i < world.enemyShots.size; i++) {
      const bolt = world.enemyShots.at(i);
      expect(bolt.turnsLeft, 'a bolt is not at the second stage').toBe(1);
      // About the shard's OWN heading — not the ship's — and split, so neither bolt is the shard.
      const off = between(headingOf(d, i), Math.PI);
      expect(off, 'a bolt is not inside the fan').toBeLessThanOrEqual(fan.spread / 2 + 1e-6);
      expect(off, 'a bolt flies exactly where the shard was going, so the fan is one line').toBeGreaterThan(0.1);
      // In the player's units: on the screen, and ahead of the ship's box's near edge.
      expect(bolt.along, `the split is off the far edge of the screen at the ${end} fuse`).toBeLessThan(world.cameraAlong + world.view.alongSpan);
      expect(bolt.along, `the split is behind the camera at the ${end} fuse`).toBeGreaterThan(world.cameraAlong + PLAYER_ALONG_MARGIN);
    }
    expect(debrisNear(d, splitAlong, splitAcross, 5), 'the split was not drawn').toBeGreaterThanOrEqual(BURST.fission);

    // The second fuse, and the snowflake.
    const ring = stages[1]!;
    if (ring.into !== 'ring') return;
    const bolts = world.enemyShots.size;
    for (let s = 1; s < ring.after[end]; s++) {
      park(d);
      frame.step();
      expect(world.enemyShots.size, `a bolt opened ${ring.after[end] - s} steps early at the ${end} fuse`).toBe(bolts);
    }
    park(d);
    frame.step();
    expect(world.enemyShots.size, 'the bolts did not open into snowflakes').toBe(bolts * ring.shots);
    pinFuses(d, 2, end);
    let forward = 0;
    for (let i = 0; i < world.enemyShots.size; i++) {
      const flake = world.enemyShots.at(i);
      expect(flake.turnsLeft, 'a flake is not at the last stage').toBe(2);
      expect(flake.sprite, 'a flake is not frost').toBe(SHOTS.frost.sprite);
      if (flake.velAlong - world.scrollPerStep > 0.1) forward++;
      // In the player's units: the snowflake opens in the near half of the screen, where the ship is.
      expect(flake.along, `the snowflake opened in the far half of the screen at the ${end} fuse`).toBeLessThan(world.cameraAlong + world.view.alongSpan / 2);
      // And the other end, which a fixed fuse never had: at the longest, still where the ship can be.
      expect(flake.along, `the snowflake opened behind the ship's box at the ${end} fuse`).toBeGreaterThan(world.cameraAlong + PLAYER_ALONG_MARGIN);
    }
    // A snowflake is thrown every way, so some of it comes back up the lane at where the ship will be.
    expect(forward, 'no flake flies back up the lane').toBeGreaterThan(0);

    // The melt: a flake ends, and is seen ending.
    const melt = stages[2]!;
    // A flake that leaves the lane is the cull's before it is the melt's, so what is held for the
    // fuse's length is that the snowflake is still there, not that every flake of it is.
    for (let s = 1; s < melt.after[end]; s++) {
      park(d);
      frame.step();
      expect(world.enemyShots.size, `the snowflake melted ${melt.after[end] - s} steps early`).toBeGreaterThan(0);
    }
    const flakes = world.enemyShots.size;
    const meltAlong: number[] = [];
    const meltAcross: number[] = [];
    for (let i = 0; i < flakes; i++) {
      meltAlong.push(world.enemyShots.at(i).along);
      meltAcross.push(world.enemyShots.at(i).across);
    }
    park(d);
    frame.step();
    expect(world.enemyShots.size, 'a flake outlived its melt').toBe(0);
    expect(debrisNear(d, meltAlong, meltAcross, 5), 'the melt was not drawn').toBeGreaterThanOrEqual(BURST.melt * flakes);
  }

  it('THE SHATTER, DRIVEN: the shard add is the one body that shatters, into a snowflake of frost at its last stage — so it melts and never opens again', () => {
    /*
      *"The adds weren't great."* A pair in a vee that shed squares and died. Now a shard comes in
      from the side (THE ADDS AND THE BLASTS holds that) and comes apart where it dies — so killing
      one beside the ship is the wrong place to have killed it, and the Rime Shelf's own body is the
      one body in the game whose death asks something.
    */
    expect(ENEMY_KINDS.filter((k) => ENEMIES[k].shatter !== null), 'another body shatters').toEqual(['shard']);
    expect(ENEMIES.shard.shatter).toEqual({ shot: 'frost', shots: 6 });

    const d = frostAt(1);
    const { world, frame } = d;
    park(d);
    // A shard on the lane with one hit left, holding its fire, and a pulse arriving on it.
    const add = world.enemies.spawn()!;
    reset(add, world.cameraAlong + 80, 50, ENEMIES.shard, world.enemyKinds.shard);
    add.health = 1;
    add.fireIn = 999;
    add.velAlong = world.scrollPerStep;
    const pulse = world.playerShots.spawn()!;
    reset(pulse, add.along - 3, add.across, SHOTS.pulse);
    pulse.velAlong = SHOTS.pulse.speed + world.scrollPerStep;
    const before = world.enemyShots.size;
    frame.step();
    let alive = 0;
    for (let i = 0; i < world.enemies.size; i++) if (world.enemies.at(i) === add) alive++;
    expect(alive, 'the pulse did not kill the shard').toBe(0);
    expect(world.enemyShots.size - before, 'the shard did not shatter into six').toBe(6);
    for (let i = before; i < world.enemyShots.size; i++) {
      const flake = world.enemyShots.at(i);
      expect(flake.sprite, 'a piece of the shatter is not frost').toBe(SHOTS.frost.sprite);
      expect(flake.turnsLeft, 'a piece of the shatter is not at the last stage').toBe(stages.length - 1);
      expect(Math.hypot(flake.along - (world.cameraAlong + 80), flake.across - 50), 'the shatter is not where the shard died').toBeLessThan(4);
    }
    // Six ways evenly: the snowflake, and no two pieces the same way.
    for (let i = before; i < world.enemyShots.size; i++) {
      for (let j = i + 1; j < world.enemyShots.size; j++) {
        expect(between(headingOf(d, i), headingOf(d, j)), 'two pieces of the shatter fly the same way').toBeGreaterThan((Math.PI * 2) / 6 - 1e-6);
      }
    }
    // And it only melts: never six shards that open into seventy-two.
    const melt = stages[stages.length - 1]!;
    for (let s = 1; s <= melt.after.most; s++) {
      park(d);
      frame.step();
      expect(world.enemyShots.size, 'a piece of the shatter opened again').toBeLessThanOrEqual(6);
    }
    expect(world.enemyShots.size, 'the shatter outlived its melt').toBe(0);
  });

  it('and the frost never fills the pool: driven through its widest spray at the capped fan, what is alive at once leaves room for a volley', () => {
    /*
      An invariant rather than a taste: `src/sim/pool.ts` drops a volley that will not fit, so a
      phase that filled the pool with flakes would be a phase whose next volley — and the shatter of
      an add — is silently not thrown. One shard is twelve flakes for a second and a half; the
      phases in `src/content/bosses.ts` are counted in shards for exactly this reason.
    */
    const d = frostAt(0.15);
    const { world, frame } = d;
    // `frostAt` held the fan; let it go.
    world.bossPool.at(0).fireIn = 1;
    let most = 0;
    for (let s = 0; s < STEPS_PER_SECOND * 12; s++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 0;
      world.ship.along = world.cameraAlong + PLAYER_ALONG_MARGIN;
      world.ship.across = 3;
      world.ship.velAcross = 0;
      world.bossPool.at(0).health = world.bossFullHealth * 0.15;
      frame.step();
      most = Math.max(most, world.enemyShots.size);
    }
    // Room for the widest volley's shards, their bolts, and a shattered add, on top of the most.
    expect(most, 'the frost fills the pool').toBeLessThan(world.enemyShots.capacity - 24);
  });
});

describe('0371 — the ice is staggered', () => {
  /** Every boss that throws a staggering shot, from its row, any phase, or any head — derived. */
  const throwsStaggered = (kind: BossKind): boolean => {
    const row = BOSSES[kind];
    const staggers = (shot: ShotKind | null): boolean => shot !== null && SHOTS[shot].stagger !== undefined;
    const fromAttack = (attack: BossAttack | null): boolean => attack?.kind === 'heads' && attack.heads.some((head) => staggers(head.shot));
    return staggers(row.shot) || fromAttack(row.attack) || row.phases.some((phase) => staggers(phase.shot) || fromAttack(phase.attack));
  };
  const STAGGERERS = BOSS_KINDS.filter(throwsStaggered);

  it('both frost fights throw the staggered shard, so the drive below measures both of them', () => {
    // 0005: the drive walks `STAGGERERS`, and over an empty or half list it passes over what was reported.
    expect(STAGGERERS, 'the report named the Rime Shelf’s ship and the hydra').toEqual(['hoarfrost', 'hydra']);
  });

  it('THE STAGGER, DRIVEN: in every phase of both frost fights, on every tier, no two shards leave the hull on one step and no two open on one step — and the fuses are rolled', () => {
    /*
      Reported: *"they get fired at the same time and explode at the same time and fill the screen with
      a bunch of ice shards so heavily clustered you can't really dodge them."* Both halves are held in
      the unit the report is in — the moment — and over the whole of both fights rather than one volley:
      measured before this landed, every shard in both fights opened on a step with another, 111 of
      them on 37 steps in thirty seconds of the Rime Shelf's last phase.

      ⚠️ **AN INVARIANT OF THE ROW, NOT A LIMIT ON THE CONTENT.** It walks the bosses that throw a shot
      whose row STAGGERS; a shattering row that authors no stagger is free to open as one burst, and
      is not asked here.

      A shard opening is counted by its bolts: a fan of `shots` children at the second stage appearing
      on one step is one shard, and more than that is two.
    */
    const fan = SHOTS.frost.fission[0]!;
    if (fan.into !== 'fan') throw new Error('the frost does not open into a fan');
    const rolled = new Set<number>();
    for (const kind of STAGGERERS) {
      let thrown = 0;
      // Shards thrown per phase per tier, for the tier ladder below.
      const perPhase: Record<(typeof DIFFICULTY_KINDS)[number], number>[] = [];
      for (let phase = 0; phase < BOSSES[kind].phases.length; phase++) {
        perPhase.push({ legendary: 0, savior: 0, burn: 0 });
        for (const tier of DIFFICULTY_KINDS) {
          const { world } = playableWorld({ ...FROST_ONLY, boss: kind }, tier);
          const frame = new GameFrame(world);
          for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
            world.ship.health = world.shipRow.health;
            frame.step();
          }
          expect(world.bossPool.size, `${kind} never arrived`).toBe(1);
          const at = Math.max(0.02, BOSSES[kind].phases[phase]!.upTo - 0.01);
          freshAt(world, 0);
          freshAt(world, 1);
          for (let s = 0; s < STEPS_PER_SECOND * 20; s++) {
            world.bossPool.at(0).health = world.bossFullHealth * at;
            world.ship.health = world.shipRow.health;
            world.ship.invulnFor = 0;
            frame.step();
            // A shard's fuse is lit on the step it leaves, so the fresh ones carry their roll untouched.
            for (let i = 0; i < world.enemyShots.size; i++) {
              const shot = world.enemyShots.at(i);
              if (shot.kind === SHOT_INDEX.frost && shot.turnsLeft === 0 && shot.entrySlot === 0) rolled.add(shot.fireIn);
            }
            const left = freshAt(world, 0);
            const opened = freshAt(world, 1) / fan.shots;
            thrown += left;
            perPhase[phase]![tier] += left;
            expect(left, `${kind} phase ${phase + 1} at ${tier}: ${left} shards left the hull on one step`).toBeLessThanOrEqual(1);
            expect(opened, `${kind} phase ${phase + 1} at ${tier}: ${opened} shards opened on one step`).toBeLessThanOrEqual(1);
          }
        }
      }
      expect(thrown, `${kind} threw no shards, so nothing about it was measured`).toBeGreaterThan(0);
      /*
        ⚠️ **AND A HARDER TIER THROWS MORE OF IT, IN EVERY PHASE THAT THROWS ANY.** *"Make it harder on
        burn"* — asked once a flat stagger had made the Rime Shelf's last phase the same fight at Burn
        and at Savior, 60 shards and 59 in thirty seconds, because the stagger and not the cadence was
        what bound it.

        ⚠️ **EVERY PHASE AND NOT THE BUSIEST, AND THE PROBE IS WHY.** The first draft asked only the
        phase with the most shards, and a flat spray went STILL GREEN under it: flattening the spray
        thinned that phase until a wall phase was the busiest, and the wall still differed by tier.
      */
      perPhase.forEach((counts, phase) => {
        if (counts.savior === 0) return;
        expect(counts.burn, `${kind} phase ${phase + 1}: Burn threw ${counts.burn} shards against Savior's ${counts.savior}`).toBeGreaterThan(counts.savior);
        expect(counts.savior, `${kind} phase ${phase + 1}: Savior threw ${counts.savior} shards against Legend's ${counts.legendary}`).toBeGreaterThan(counts.legendary);
      });
    }
    // *"A random length before they explode"*: inside the row's range, and more than one length of it.
    for (const fuse of rolled) {
      expect(fuse).toBeGreaterThanOrEqual(fan.after.least);
      expect(fuse).toBeLessThanOrEqual(fan.after.most);
    }
    expect(rolled.size, 'every shard burned the same fuse').toBeGreaterThan(1);
  });
});
