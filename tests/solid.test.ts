/**
 * The ball is solid, and the War Dance is a pinball — `docs/decisions/0615-the-ball-is-solid.md`.
 *
 * Played: *"There's no physicality when you hit something, you should bounce back off bosses and objects that
 * don't get immediately destroyed or take two or more hits. At the moment you just move right through them and
 * the physics feels off."* And of the War Dance: *"it spends most of its time bouncing through the back half of
 * the screen without doing a lot to enemies and barely touches a boss - it also doesn't have good physics on
 * the bounce."*
 *
 * ⚠️ **IN THE PLAYER'S UNITS WHERE IT IS A CLAIM ABOUT THE PICTURE (0027)**: how far the ball comes back off a
 * body is pixels on the 1280×720 screen the reports were made on, and where the dance spends its time is a
 * share of that screen.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame, launchSpecial, wearHull, type World } from '../src/app/frame.ts';
import type { CueKind } from '../src/content/cues.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { LEVELS, LEVEL_KINDS, type LevelRow } from '../src/content/levels.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { SHIPS, fitted, type ShipKind } from '../src/content/ships.ts';
import { SPECIALS } from '../src/content/specials.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { viewOf } from '../src/sim/camera.ts';
import { reset, type Entity } from '../src/sim/entity.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_LEVEL, NO_SECTIONS, playableWorld } from './world.ts';

const RAM = WEAPONS.ram.ram!;
const DANCE = SPECIALS.warDance.dance!;
/** World units to pixels on the 1280×720 screen the reports were made on. */
const PX = viewOf(1280, 720).scale;

function flying(ship: ShipKind, level: LevelRow = NO_LEVEL) {
  const built = playableWorld(level);
  built.world.shipRow = fitted(SHIPS[ship], SHIPS[ship].weapon);
  built.world.weapon = weaponFor(built.world.shipRow, []);
  built.world.missileIn = Number.MAX_SAFE_INTEGER;
  // The tubes and the gun held, so what lands is the ram alone.
  built.world.fireIn = Number.MAX_SAFE_INTEGER;
  wearHull(built.world);
  const cues: CueKind[] = [];
  built.world.onCue = (kind) => {
    cues.push(kind);
  };
  return { ...built, frame: new GameFrame(built.world), cues };
}

/** A drifter of `health` at `(along, across)`, riding the camera and holding its fire. */
function bodyAt(world: World, health: number, along: number, across: number): Entity {
  const enemy = world.enemies.spawn()!;
  reset(enemy, along, across, ENEMIES.drifter);
  enemy.health = health;
  enemy.fireIn = Number.MAX_SAFE_INTEGER;
  enemy.velAlong = world.scrollPerStep;
  return enemy;
}

/** How far apart the ball's edge and the body's are: negative is the ball inside it. */
const gapTo = (world: World, body: Entity, reach: number): number =>
  Math.hypot(body.along - world.ship.along, body.across - world.ship.across) - body.radius - reach;

describe('0615 — the ball is solid', () => {
  it('THE REPORTED ONE: flown into a body it cannot break, the ball comes back off it — and never through it', () => {
    const { world, frame, stick, cues } = flying('ball');
    world.ship.invulnFor = Number.MAX_SAFE_INTEGER;
    const body = bodyAt(world, 1000, world.ship.along + 20, world.ship.across);
    stick.along = 1;
    let deepest = Number.POSITIVE_INFINITY;
    let first = -1;
    let backAt = -1;
    let farthest = 0;
    for (let step = 0; step < 3 * STEPS_PER_SECOND; step++) {
      world.ramHeat = 0;
      frame.step();
      const gap = gapTo(world, body, RAM.reach);
      deepest = Math.min(deepest, gap);
      if (first < 0 && cues.includes('ram')) first = step;
      // The first knock: how far the ball gets back off the body before the held stick wins.
      if (first >= 0 && backAt < 0 && step > first && gap < farthest) backAt = step;
      if (first >= 0 && backAt < 0) farthest = Math.max(farthest, gap);
    }
    expect(first, 'the ball never reached the body').toBeGreaterThanOrEqual(0);
    // Pressed on with the stick, the ball is in the body no deeper than one step of its flight carries it.
    expect(-deepest * PX, `the ball went ${(-deepest * PX).toFixed(1)} px into a body it could not break`).toBeLessThan(2 * PX);
    expect(world.ship.along, 'the ball passed through the body').toBeLessThan(body.along);
    // And is seen to come off it, with the stick still held into it: a ball's width, near enough.
    expect(farthest * PX, `knocked off, the ball came ${(farthest * PX).toFixed(1)} px back`).toBeGreaterThan(12);
    // And comes back, and lands again: a ram still rams.
    expect(cues.filter((c) => c === 'ram').length, 'the ball came off and never landed again').toBeGreaterThanOrEqual(6);
  });

  it('a body the ram breaks it goes on through, slowed by nothing', () => {
    const { world, frame, stick } = flying('ball');
    world.ship.invulnFor = Number.MAX_SAFE_INTEGER;
    const at = world.ship.along + 20;
    bodyAt(world, 1, at, world.ship.across);
    stick.along = 1;
    let slowed = false;
    for (let step = 0; step < 40; step++) {
      const was = world.ship.along - world.cameraAlong;
      frame.step();
      if (step > 6 && world.ship.along - world.cameraAlong < was) slowed = true;
    }
    expect(world.enemies.size, 'the ram did not break a body of one').toBe(0);
    expect(world.ship.along, 'the ball did not go on through where the body was').toBeGreaterThan(at);
    expect(slowed, 'the ball was knocked back off a body it broke').toBe(false);
  });

  it('every boss knocks it back, and the ball is never inside one', () => {
    for (const kind of LEVEL_KINDS) {
      const boss = LEVELS[kind].boss;
      const level: LevelRow = { ...LEVELS[kind], waves: [], pickups: [], landmarks: [], bossAt: 200, midBoss: null, sections: NO_SECTIONS };
      const { world, frame, stick } = flying('ball', level);
      for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
        world.ship.health = world.shipRow.health;
        if (world.bossPool.size > 0) world.bossPool.at(0).health = world.bossFullHealth;
        frame.step();
      }
      expect(world.bossPool.size, `${boss} never arrived`).toBe(1);
      let deepest = Number.POSITIVE_INFINITY;
      for (let step = 0; step < 4 * STEPS_PER_SECOND; step++) {
        world.ship.health = world.shipRow.health;
        world.ramHeat = 0;
        const head = world.bossPool.at(0);
        head.health = world.bossFullHealth;
        const dA = head.along - world.ship.along;
        const dC = head.across - world.ship.across;
        const d = Math.hypot(dA, dC);
        stick.along = dA / d;
        stick.across = dC / d;
        frame.step();
        deepest = Math.min(deepest, gapTo(world, world.bossPool.at(0), RAM.reach));
      }
      expect(-deepest * PX, `the ball went ${(-deepest * PX).toFixed(1)} px into ${boss}`).toBeLessThan(2 * PX);
    }
  });
});

describe('0615 — the War Dance is a pinball', () => {
  /** A dancing fighter heading for a body of `health` laid `ahead` units along its heading. */
  function dancingAt(health: number, ahead = 14) {
    const built = flying('fighter');
    launchSpecial(built.world, 'warDance');
    const { world } = built;
    const speed = Math.hypot(world.danceAlong, world.danceAcross);
    const body = bodyAt(world, health, world.ship.along + (world.danceAlong / speed) * ahead, world.ship.across + (world.danceAcross / speed) * ahead);
    return { ...built, body };
  }

  it('off a body it cannot break: turned away from it, thrown off faster, and heard as a bumper', () => {
    const { world, frame, cues, body } = dancingAt(1000);
    let met = -1;
    for (let step = 0; step < 30 && met < 0; step++) {
      frame.step();
      if (cues.includes('danceBumper')) met = step;
    }
    expect(met, 'the dance never met the body').toBeGreaterThanOrEqual(0);
    frame.step();
    const awayAlong = world.ship.along - body.along;
    const awayAcross = world.ship.across - body.across;
    const vAlong = world.ship.velAlong - world.scrollPerStep;
    const vAcross = world.ship.velAcross;
    expect(vAlong * awayAlong + vAcross * awayAcross, 'the dance went on into the body').toBeGreaterThan(0);
    expect(Math.hypot(vAlong, vAcross), 'the bumper threw it off no faster than it came').toBeGreaterThan(DANCE.speed * 1.2);
    expect(gapTo(world, body, DANCE.reach) * PX, 'the dance is still inside the body').toBeGreaterThan(-2 * PX);
  });

  it('through a body it breaks, on the heading it had', () => {
    const { world, frame, body } = dancingAt(1, 14);
    const along = world.danceAlong;
    const across = world.danceAcross;
    for (let step = 0; step < 12 && world.enemies.size > 0; step++) frame.step();
    expect(world.enemies.size, 'the dance did not break a body of one').toBe(0);
    frame.step();
    // Bent toward the body as it closed on it, and never turned back off it.
    const kept = (world.danceAlong * along + world.danceAcross * across) / (along * along + across * across);
    expect(kept, 'the dance came off a body it broke').toBeGreaterThan(0.9);
    expect(body.health).toBeLessThanOrEqual(0);
  });

  /*
    ⚠️ **MOST OF ITS TIME ON THE BOSS'S HALF ACROSS THE FIGHTS, AND NEVER LESS THAN HALF ON ANY ONE.** A head-on
    landing reflects it straight back down the lane, as a ball off a bumper does, and the gyre stands squarely
    in its path, so its dance comes back off it more than any other's: half its time on the gyre's half. 0609's
    dance spent half its time on every boss's half, flown straight through them, which is the report; the mean
    is what moved, and the floor only says no boss is left behind.
  */
  it('THE REPORTED ONE: against the end bosses it spends most of its time in the boss’s half of the screen', () => {
    const shares: number[] = [];
    for (const kind of LEVEL_KINDS) {
      const boss = LEVELS[kind].boss;
      const level: LevelRow = { ...LEVELS[kind], waves: [], pickups: [], landmarks: [], bossAt: 200, midBoss: null, sections: NO_SECTIONS };
      const { world, frame } = flying('ball', level);
      for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
        world.ship.health = world.shipRow.health;
        if (world.bossPool.size > 0) world.bossPool.at(0).health = world.bossFullHealth;
        frame.step();
      }
      expect(world.bossPool.size, `${boss} never arrived`).toBe(1);
      const half = world.view.alongSpan / 2;
      const bossSide = world.bossPool.at(0).along - world.cameraAlong > half ? 1 : -1;
      let near = 0;
      let steps = 0;
      for (let dance = 0; dance < 5; dance++) {
        launchSpecial(world, 'warDance');
        while (world.danceFor > 0) {
          world.ship.health = world.shipRow.health;
          world.bossPool.at(0).health = world.bossFullHealth;
          frame.step();
          if ((world.ship.along - world.cameraAlong - half) * bossSide > 0) near++;
          steps++;
        }
        for (let i = 0; i < 30; i++) frame.step();
      }
      expect(near / steps, `the dance spent ${((near / steps) * 100).toFixed(0)}% of its time on ${boss}’s half`).toBeGreaterThan(0.45);
      shares.push(near / steps);
    }
    const mean = shares.reduce((a, b) => a + b, 0) / shares.length;
    expect(mean, `across the end bosses the dance spent ${(mean * 100).toFixed(0)}% of its time on the boss’s half`).toBeGreaterThan(0.65);
  });
});
