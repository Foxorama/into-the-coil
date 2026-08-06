import { describe, expect, it } from 'vitest';

import {
  ACROSS_CULL_MAX,
  ACROSS_CULL_MIN,
  ACROSS_SPAN,
  FLANK_ALONG,
  MAX_ALONG_SPAN,
  MIN_ASPECT,
  cullPlayerShotAlong,
  viewOf,
} from '../src/sim/camera.ts';
import { makeEntity, reset, stepEntities } from '../src/sim/entity.ts';
import { Pool } from '../src/sim/pool.ts';
import type { Entity } from '../src/sim/entity.ts';
import { DEFAULT_ORIGIN, LEVELS, LEVEL_KINDS, type LevelRow } from '../src/content/levels.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { PLAYER_SHOT_LIFE } from '../src/content/pickups.ts';
import { SHOTS } from '../src/content/shots.ts';
import { GameFrame } from '../src/app/frame.ts';
import { playableWorld } from './world.ts';
import { sprite } from './bodies.ts';

/**
 * WHERE A THREAT COMES FROM, AND WHERE A SHOT STOPS.
 *
 * `docs/decisions/0048-a-threat-may-arrive-from-the-side.md`. Three things asked for after playing
 * the two-level build, and one of them is a reported bug.
 *
 * ⚠️ **The shot-range half is the bug**: *"in playtesting I didn't even see the boss monsters on
 * screen because they died before they even entered the visible play area."* Every number in the
 * model was right; the shot simply outlived the view.
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` is the rule that says a quantity the
 * player experiences has to be asserted in the units they experience it in, and the first two tests
 * below are written in world units against the view the game actually ships.
 */

/** The narrowest and widest views the clamp allows — the two ends every rule has to hold at. */
const NARROW = viewOf(1500, 1000);
const WIDE = viewOf(2400, 1000);

describe('a shot stops where the player can no longer see it', () => {
  it('never outlives the view it was fired into, on any device', () => {
    /*
      THE REPORTED BUG, measured. A pulse lives `PLAYER_SHOT_LIFE` steps at its own speed, which
      carries it well past a 16:9 leading edge — so the 70 units beyond it were a strip where things
      died unseen, and a boss spends about four seconds closing through exactly that strip.
    */
    const reach = SHOTS.pulse.speed * PLAYER_SHOT_LIFE;
    expect(reach, 'the lifetime alone no longer over-reaches; this test is measuring nothing').toBeGreaterThan(
      NARROW.alongSpan,
    );

    for (const view of [NARROW, WIDE]) {
      const pool = new Pool<Entity>(4, makeEntity);
      const shot = pool.spawn()!;
      reset(shot, 40, ACROSS_SPAN / 2, SHOTS.pulse);
      shot.velAlong = SHOTS.pulse.speed;
      shot.lifeFor = PLAYER_SHOT_LIFE;
      let camera = 0;
      let furthest = 0;
      for (let step = 0; step < PLAYER_SHOT_LIFE * 2 && pool.size > 0; step++) {
        camera += 0.6;
        stepEntities(pool, camera, cullPlayerShotAlong(camera, view.alongSpan));
        if (pool.size > 0) furthest = pool.at(0).along - camera;
      }
      expect(pool.size, 'a shot outlived its own cull').toBe(0);
      // In world units ahead of the camera, which is what the player is looking at. One step of
      // travel past the edge is unavoidable — the cull runs after the move — and is a pixel or two.
      expect(furthest, `a shot reached ${furthest.toFixed(1)} units on a ${view.alongSpan}-unit view`).toBeLessThan(
        view.alongSpan + SHOTS.pulse.speed,
      );
    }
  });

  it('and the boss is never hit before it can be seen', () => {
    /*
      ⚠️ **The bug as the player met it, driven through the whole frame.** A boss spawns at its
      authored place — 280 units out, past the widest view — and closes on its station over several
      seconds. What the report describes is it dying in that gap.

      Asserted at the NARROWEST view, because that is where the gap is widest and where the report
      came from.
    */
    const bossOnly: LevelRow = { waves: [], pickups: [], bossAt: 300, boss: 'sentinel' };
    const { world } = playableWorld(bossOnly);
    world.view = NARROW;
    const frame = new GameFrame(world);
    const full = world.bossRow.health;
    let firstHit = Number.NaN;
    for (let step = 0; step < 4000; step++) {
      frame.step();
      /*
        ⚠️ **`bossSpawned` and not an empty pool, and the first draft got this wrong in the way that
        matters.** It broke out on `bossPool.size === 0`, which is true on step ZERO — the boss has
        not arrived yet — so the loop exited before the frame had done anything and the assertion
        never ran at all. `npm run prove 0048` reported the probe STILL GREEN, which is the only
        reason it was noticed: the test passed identically with the bug restored.
      */
      if (!world.bossSpawned) continue;
      if (world.bossPool.size === 0) break;
      const boss = world.bossPool.at(0);
      if (boss.health >= full) continue;
      // It has been hit. Its leading edge must be inside the view by now.
      firstHit = boss.along - boss.radius - world.cameraAlong;
      break;
    }
    expect(Number.isNaN(firstHit), 'the boss was never hit at all, so this measured nothing').toBe(false);
    expect(
      firstHit,
      `the boss took its first hit ${firstHit.toFixed(0)} units out, on a ${NARROW.alongSpan}-unit view`,
    ).toBeLessThan(NARROW.alongSpan);
  });
});

describe('anything that leaves the lane is gone, and the ship cannot', () => {
  it('retires a body that drifts off either across edge', () => {
    /*
      ⚠️ **The gap `reports/enemy-silhouettes-2026-08-05.md` named, closed in the change that opens
      it.** Nothing could leave the lane while everything arrived at the leading edge, so a missing
      `across` cull was a hypothetical; a flanker that misses its turn makes it a live path, and a
      pool slot held forever is a wave that silently stops spawning later in the level.
    */
    for (const direction of [-1, 1]) {
      const pool = new Pool<Entity>(4, makeEntity);
      const body = pool.spawn()!;
      reset(body, 100, ACROSS_SPAN / 2, sprite(0));
      body.velAcross = direction * 2;
      for (let step = 0; step < 400 && pool.size > 0; step++) stepEntities(pool, 0);
      expect(pool.size, `a body heading ${direction < 0 ? 'off the minus edge' : 'off the plus edge'} was never retired`).toBe(0);
    }
  });

  it('leaves room outside the lane for something on its way in', () => {
    // A flanker spawns outside the lane, so the cull has to be beyond where it starts — otherwise
    // every flanking wave would be retired on the step it was created and nothing would report it.
    expect(ACROSS_CULL_MIN, 'the cull is inside the lane').toBeLessThan(0);
    expect(ACROSS_CULL_MAX, 'the cull is inside the lane').toBeGreaterThan(ACROSS_SPAN);
  });

  it('cannot reach the ship, which flight clamps well inside it', () => {
    /*
      ⚠️ **The one body whose release would end a run with no explanation.** `src/sim/flight.ts`
      clamps the ship inside both edges, so this is structural rather than a rule anybody has to
      remember — but it is the assertion worth having, because the cull is new and the clamp is not.
    */
    const level: LevelRow = { waves: [], pickups: [], bossAt: Number.POSITIVE_INFINITY, boss: 'sentinel' };
    const { world } = playableWorld(level);
    const frame = new GameFrame(world);
    // Ask for full deflection across the lane, every step, for ten seconds.
    world.input = {
      contribute: (intent): void => {
        intent.along = 0;
        intent.across = 1;
      },
      release: (): void => {},
    };
    for (let step = 0; step < 600; step++) frame.step();
    expect(world.shipPool.size, 'the ship flew out of the lane and was culled').toBe(1);
    expect(world.ship.across).toBeGreaterThan(ACROSS_CULL_MIN);
    expect(world.ship.across).toBeLessThan(ACROSS_CULL_MAX);
  });
});

describe('a wave may arrive from the side, and never behind the player', () => {
  /** A level that is one flanking wave and nothing else. */
  function oneFlank(origin: 'acrossMinus' | 'acrossPlus', lane: number): LevelRow {
    return {
      waves: [{ at: 400, enemy: 'charger', formation: 'column', count: 3, lane, origin }],
      pickups: [],
      bossAt: Number.POSITIVE_INFINITY,
      boss: 'sentinel',
    };
  }

  it('enters outside the lane, so nothing appears on top of the player', () => {
    for (const origin of ['acrossMinus', 'acrossPlus'] as const) {
      const { world } = playableWorld(oneFlank(origin, 50));
      const frame = new GameFrame(world);
      while (world.enemies.size === 0) frame.step();
      const first = world.enemies.at(0);
      if (origin === 'acrossMinus') expect(first.across, 'it appeared inside the lane').toBeLessThan(0);
      else expect(first.across, 'it appeared inside the lane').toBeGreaterThan(ACROSS_SPAN);
    }
  });

  it('appears no further back than halfway across the widest view there is', () => {
    /*
      ⚠️ **The player's own cap, and the reason it is a fixed distance rather than a fraction.**
      Asked for: *"entry point should be capped at 50% from the right side of the screen — the player
      has a safe spawn zone from the left."* A view is 150 to 240 world units wide by aspect
      (`docs/decisions/0023-the-long-axis-is-the-scroll-axis.md`), so *half the screen* is not one
      distance. Asserted here at BOTH ends of the clamp, in the fraction of the screen the player
      would measure it as.
    */
    const { world } = playableWorld(oneFlank('acrossMinus', 50));
    const frame = new GameFrame(world);
    while (world.enemies.size === 0) frame.step();
    const ahead = world.enemies.at(0).along - world.cameraAlong;

    for (const view of [NARROW, WIDE]) {
      const fraction = ahead / view.alongSpan;
      expect(
        fraction,
        `it entered ${(fraction * 100).toFixed(0)}% of the way across a ${view.alongSpan}-unit view, ` +
          'which is behind the halfway line the player asked to be safe',
      ).toBeGreaterThanOrEqual(0.5);
    }
    // And the same statement in world units, against the constant that has to carry it.
    expect(FLANK_ALONG).toBeGreaterThanOrEqual((ACROSS_SPAN * MIN_ASPECT) / 2);
    expect(FLANK_ALONG).toBe(MAX_ALONG_SPAN / 2);
  });

  it('turns down-lane and stops exactly where the wave was authored', () => {
    /*
      ⚠️ **The first motion in the game that is not a function of `along`**, which is the trigger
      `src/content/enemies.ts` named for a motion union earning its place. The stop is asserted
      EXACTLY rather than within a band: a body crossing at speed steps over any tolerance you pick,
      so *have I passed it* is the only test that holds at every speed.
    */
    for (const [origin, lane] of [['acrossMinus', 35] as const, ['acrossPlus', 70] as const]) {
      const { world } = playableWorld(oneFlank(origin, lane));
      const frame = new GameFrame(world);
      while (world.enemies.size === 0) frame.step();
      let settled = false;
      for (let step = 0; step < 600 && world.enemies.size > 0; step++) {
        frame.step();
        if (world.enemies.size === 0) break;
        const e = world.enemies.at(0);
        if (e.velAcross === 0) {
          expect(e.across, `a flanker straightened out at ${e.across} rather than at its lane`).toBe(lane);
          settled = true;
          break;
        }
      }
      expect(settled, `a flanker from ${origin} never reached lane ${lane}`).toBe(true);
    }
  });

  it('and every authored flanking wave really does reach its lane before it is culled', () => {
    /*
      The property over the real script rather than over a fixture: a flanker that never arrives is a
      wave the player watches slide past the edge of the screen, and it would look like a level with
      a hole in it rather than like a bug.
    */
    for (const kind of LEVEL_KINDS) {
      const flanking = LEVELS[kind].waves.filter((w) => (w.origin ?? DEFAULT_ORIGIN) !== 'lead');
      expect(flanking.length, `${kind} has nothing arriving from the side`).toBeGreaterThan(0);
      for (const wave of flanking) {
        const row = ENEMIES[wave.enemy];
        expect(
          row.weaveAmplitude,
          `${kind} sends a weaving ${wave.enemy} in from the side, and a weave overwrites the turn`,
        ).toBe(0);
      }
    }
  });
});

describe('a pickup wanders', () => {
  it('moves across the lane instead of running on a rail', () => {
    // Asked for: *"power ups and buffs should also have a drifting, moving flight rather than a
    // static straight line."*
    const level: LevelRow = {
      waves: [],
      pickups: [{ at: 200, kind: 'rapid', lane: 50 }],
      bossAt: Number.POSITIVE_INFINITY,
      boss: 'sentinel',
    };
    const { world } = playableWorld(level);
    const frame = new GameFrame(world);
    while (world.pickups.size === 0) frame.step();
    const started = world.pickups.at(0).across;
    for (let step = 0; step < 180; step++) frame.step();
    expect(world.pickups.size, 'the pickup left the field').toBe(1);
    expect(Math.abs(world.pickups.at(0).across - started), 'the pickup held a straight line').toBeGreaterThan(1);
  });

  it('but stays inside the lane, so it is never unreachable', () => {
    /*
      ⚠️ **A pickup that drifted out of the lane would be one the player is asked to fly into a wall
      for**, and the `across` cull would then quietly delete it — turning the twenty-second rearm
      ceiling `docs/decisions/0041-a-pickup-is-the-answer-to-what-a-death-costs.md` guards into a
      promise the level cannot keep.
    */
    const level: LevelRow = {
      waves: [],
      pickups: [
        { at: 200, kind: 'rapid', lane: 6 },
        { at: 260, kind: 'spread', lane: 94 },
      ],
      bossAt: Number.POSITIVE_INFINITY,
      boss: 'sentinel',
    };
    const { world } = playableWorld(level);
    const frame = new GameFrame(world);
    for (let step = 0; step < 900; step++) {
      frame.step();
      for (let i = 0; i < world.pickups.size; i++) {
        const item = world.pickups.at(i);
        expect(item.across, 'a pickup drifted out of the dodge lane').toBeGreaterThanOrEqual(0);
        expect(item.across, 'a pickup drifted out of the dodge lane').toBeLessThanOrEqual(ACROSS_SPAN);
      }
    }
  });
});
