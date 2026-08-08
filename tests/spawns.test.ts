import { describe, expect, it } from 'vitest';

import {
  ACROSS_CULL_MAX,
  ACROSS_CULL_MIN,
  ACROSS_SPAN,
  FLANK_ALONG,
  MAX_ALONG_SPAN,
  MIN_ASPECT,
  ROAM_MAX,
  ROAM_MIN,
  cullPlayerShotAlong,
  viewOf,
} from '../src/sim/camera.ts';
import { makeEntity, reset, stepEntities } from '../src/sim/entity.ts';
import { Pool } from '../src/sim/pool.ts';
import type { Entity } from '../src/sim/entity.ts';
import { DEFAULT_ORIGIN, LEVELS, LEVEL_KINDS, type LevelRow } from '../src/content/levels.ts';
// The enemy table's own guards moved to `tests/pilots.test.ts` with 0073, which is where the motion
// union and everything that reacts to the player is held.
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
    /*
      ── THE REACH IS MEASURED DIRECTLY, AND IT DID NOT HAVE TO BE UNTIL 0080 ────────────────────

      ⚠️ **`docs/decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md` raised the narrowest
      view from 150 units to 177.8, and this guard's margin was 19.** Measured with the bug restored,
      the boss's first hit moved from 168.7 to 175.0 against a bound of 177.8 — so it passed either
      way, by three units, and `npm run prove` reported the probe **WRONG TEST** rather than red.

      ⚠️ **The first hit was always a CONSEQUENCE of the rule rather than the rule**, and it is a
      consequence with a confound in it: the fixture's ship is killed by the boss it is shooting at,
      so how far out a shot reaches depends on when the ship happened to be alive and where it had
      got to. Flying it forward does not fix that — it dies sooner.

      So the rule itself is measured — **the furthest ahead of the camera any live player shot ever
      gets** — and the first hit is kept below as the thing the player actually reported. The reach is
      in the units the report used: world units ahead of the camera, against the width of the screen.
    */
    const frame = new GameFrame(world);
    const full = world.bossRow.health;
    let firstHit = Number.NaN;
    let furthestShot = 0;
    for (let step = 0; step < 4000; step++) {
      frame.step();
      for (let i = 0; i < world.playerShots.size; i++) {
        furthestShot = Math.max(furthestShot, world.playerShots.at(i).along - world.cameraAlong);
      }
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
    /*
      ⚠️ **THE RULE, and it is what the probe now reddens.** *You can shoot what you can see*: no shot
      the player fired is ever further ahead of the camera than the screen is wide. One step of travel
      of slack, because the cull runs after the move.
    */
    expect(furthestShot, 'the ship never fired, so this measured nothing').toBeGreaterThan(0);
    expect(
      furthestShot,
      `a shot reached ${furthestShot.toFixed(0)} units ahead of the camera on a ${NARROW.alongSpan.toFixed(0)}-unit ` +
        'view — which is the strip the report describes things dying in, unseen',
    ).toBeLessThan(NARROW.alongSpan + SHOTS.pulse.speed);
    // And the consequence the player actually reported, kept: the boss is not damaged out of sight.
    expect(Number.isNaN(firstHit), 'the boss was never hit at all, so this measured nothing').toBe(false);
    expect(
      firstHit,
      `the boss took its first hit ${firstHit.toFixed(0)} units out, on a ${NARROW.alongSpan.toFixed(0)}-unit view`,
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
      spend: (): void => {},
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
    }
  });

  it('a WEAVING row can arrive from the side now, which it could not before', () => {
    /*
      ⚠️ **THIS TEST REPLACES A CONSTRAINT ON THE LEVEL AUTHOR.** It used to read *"no flanking wave
      may use a weaving enemy"*, because the weave ran first in `steerEnemies` and overwrote the turn
      before it could finish — so the guard forbade the combination rather than the code supporting
      it. `docs/decisions/0059-the-lane-is-the-players-box.md` reordered the two, and a rule about
      what may be authored is worth less than a rule the code keeps.
    */
    const level: LevelRow = {
      waves: [{ at: 400, enemy: 'weaver', formation: 'column', count: 3, lane: 50, origin: 'acrossMinus' }],
      pickups: [],
      bossAt: Number.POSITIVE_INFINITY,
      boss: 'sentinel',
    };
    const { world } = playableWorld(level);
    const frame = new GameFrame(world);
    while (world.enemies.size === 0) frame.step();
    expect(world.enemies.at(0).across, 'it did not enter from outside the lane').toBeLessThan(0);

    let arrived = false;
    for (let step = 0; step < 900 && world.enemies.size > 0; step++) {
      frame.step();
      if (world.enemies.size > 0 && world.enemies.at(0).steerAcross === 0) {
        arrived = true;
        break;
      }
    }
    expect(arrived, 'a weaving flanker never straightened out — the weave ate the turn again').toBe(true);
  });
});

/**
 * THE LANE IS THE PLAYER'S BOX AND IT IS NOT THE ENEMIES'.
 *
 * `docs/decisions/0059-the-lane-is-the-players-box.md`. Reported from play: *"once on screen the
 * enemies are in a very narrow tunnel and it makes the feel very restrictive and not like you're in a
 * large area. They should fly off the `across` edges and back on."*
 *
 * ⚠️ **The subject is what a body does AFTER it has arrived**, which is the half 0048 left alone.
 */
describe('a threat uses the whole area, and the player does not', () => {
  /** One wave of `enemy`, on a lane, arriving at the leading edge. */
  function oneWave(enemy: 'drifter' | 'turret' | 'lancer' | 'charger' | 'weaver', lane: number): LevelRow {
    return {
      waves: [{ at: 400, enemy, formation: 'column', count: 1, lane }],
      pickups: [],
      bossAt: Number.POSITIVE_INFINITY,
      boss: 'sentinel',
    };
  }

  it('takes something that holds station clear off the edge of the screen, and brings it back', () => {
    /*
      ⚠️ **A DRIFTER, because it is the case a weave cannot reach.** `closing: 0` means it never
      moves along, and a weave is `A·k·cos(k·along)·velAlong` — identically zero. The two rows that
      sit stillest in the game were structurally unable to move sideways, which is the middle of what
      *narrow tunnel* was describing.

      ⚠️ **Asserted in the units the player experiences**, per
      `docs/decisions/0027-measure-the-picture-not-the-model.md`: `across` is fully visible on every
      device, so *left the lane* IS *left the screen*, and the assertion is that it went off and came
      back rather than that a velocity had a sign.
    */
    const { world } = playableWorld(oneWave('drifter', 30));
    const frame = new GameFrame(world);
    while (world.enemies.size === 0) frame.step();

    let leftTheScreen = false;
    let cameBack = false;
    // Long enough to cross the band and return at the drifter's rate, with room to spare.
    for (let step = 0; step < 2400; step++) {
      frame.step();
      if (world.enemies.size === 0) break;
      const e = world.enemies.at(0);
      if (e.across + e.radius < 0 || e.across - e.radius > ACROSS_SPAN) leftTheScreen = true;
      else if (leftTheScreen) cameBack = true;
    }
    expect(leftTheScreen, 'the enemy never left the screen — this is the tunnel').toBe(true);
    expect(cameBack, 'the enemy left and never came back, which is a hole rather than a roam').toBe(true);
  });

  it('never leaves the roam band, so nothing that wandered off is culled', () => {
    // The other half: leaving the screen is the point, leaving the GAME is the bug 0048's `across`
    // cull exists for. The band is strictly inside the cull, and this is what proves it in motion.
    for (const enemy of ['drifter', 'turret', 'lancer'] as const) {
      const { world } = playableWorld(oneWave(enemy, 45));
      const frame = new GameFrame(world);
      while (world.enemies.size === 0) frame.step();
      let steps = 0;
      for (; steps < 2400 && world.enemies.size > 0; steps++) {
        frame.step();
        if (world.enemies.size === 0) break;
        const e = world.enemies.at(0);
        expect(e.across, `a ${enemy} reached ${e.across.toFixed(1)}, outside the roam band`).toBeGreaterThanOrEqual(
          ROAM_MIN - 1,
        );
        expect(e.across, `a ${enemy} reached ${e.across.toFixed(1)}, outside the roam band`).toBeLessThanOrEqual(
          ROAM_MAX + 1,
        );
      }
      expect(steps, `a ${enemy} was retired while it was still roaming`).toBeGreaterThan(0);
    }
  });

  it('the ship cannot follow it out there, which is what makes the area feel bigger', () => {
    /*
      ⚠️ **The asymmetry is the feature.** `src/sim/flight.ts` clamps the player inside the lane, so
      the roam band is somewhere threats go and the player cannot — and that is what makes the space
      read as larger than the box being flown in. Driven rather than asserted about the constant,
      because the clamp is what the player meets.
    */
    const { world } = playableWorld(oneWave('drifter', 50));
    const frame = new GameFrame(world);
    world.input = {
      contribute: (intent) => {
        intent.across = -1;
      },
      spend: () => {},
      release: () => {},
    };
    for (let i = 0; i < 600; i++) frame.step();
    expect(world.ship.across, 'the ship reached the roam band').toBeGreaterThan(ROAM_MIN);
    expect(world.ship.across, 'the ship left the dodge lane').toBeGreaterThanOrEqual(0);
  });

  /*
    ⚠️ **THE GUARD THAT USED TO BE HERE IS DELETED, AND THE REASON IS WORTH MORE THAN IT WAS.** It
    asserted that *no row both weaves and roams, because two mechanisms would fight over one
    velocity* — true, load-bearing, and only ever expressible because a row carried `weaveAmplitude`
    and `roam` side by side and could set both.

    `docs/decisions/0073-an-enemy-is-a-pilot.md` made `motion` a discriminated union, so a row now
    carries the parameters of exactly one motion and **cannot** describe two. The affordance is gone
    rather than policed, which `docs/scaffold-plan.md`'s instruction ladder puts at the top and calls
    the only tier that reliably works — the same move
    `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` made when it deleted
    a sprite-ordering test rather than keep it green.

    An assertion that cannot fail is noise a future reader has to work out the purpose of, and a
    probe standing over one is the appearance of proof
    (`docs/decisions/0019-a-probe-must-be-seen-to-apply.md`). What replaced it is the compiler.
  */

  it('and something that has wandered off the screen does not shoot from there', () => {
    /*
      ⚠️ **An event the model resolves and the picture never mentions**, which
      `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` records being
      reported three separate times as a collision fault that did not exist. A shot arriving from a
      body that is not on screen is a hit with no cause, and the roam is what makes it reachable.
    */
    const { world } = playableWorld(oneWave('turret', 45));
    const frame = new GameFrame(world);
    while (world.enemies.size === 0) frame.step();
    for (let step = 0; step < 2400 && world.enemies.size > 0; step++) {
      const before = world.enemyShots.size;
      frame.step();
      if (world.enemies.size === 0) break;
      const e = world.enemies.at(0);
      const offScreen = e.across + e.radius < 0 || e.across - e.radius > ACROSS_SPAN;
      if (offScreen) {
        expect(world.enemyShots.size, 'something off the screen fired at the player').toBeLessThanOrEqual(before);
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
