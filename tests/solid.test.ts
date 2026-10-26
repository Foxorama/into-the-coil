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
import { DEBRIS_KIND } from '../src/content/debris.ts';
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
  it('0691 — THE ASK: flown into a body, however tough, the ball breaks it on contact and goes on through', () => {
    /*
      0615's reported one was a body of a thousand the ball came back off. Played: *"hitting non-boss enemies feels
      off, I think it should instantly kill them instead of bouncing off, but have some haptic vibration feedback."*
      The same body of a thousand — more than any spawned body's eleven — dies on the first landing.
    */
    const { world, frame, stick, cues } = flying('ball');
    world.ship.invulnFor = Number.MAX_SAFE_INTEGER;
    const at = world.ship.along + 20;
    bodyAt(world, 1000, at, world.ship.across);
    stick.along = 1;
    let first = -1;
    let killedAt = -1;
    let slowed = false;
    for (let step = 0; step < 2 * STEPS_PER_SECOND && killedAt < 0; step++) {
      world.ramHeat = 0;
      const was = world.ship.along - world.cameraAlong;
      frame.step();
      if (first < 0 && cues.includes('ram')) first = step;
      if (world.enemies.size === 0) killedAt = step;
      if (step > 6 && world.ship.along - world.cameraAlong < was) slowed = true;
    }
    expect(first, 'the ball never reached the body').toBeGreaterThanOrEqual(0);
    expect(killedAt, 'a body of a thousand survived the landing').toBe(first);
    // The smash it is felt as is held in tests/charge.test.ts, with the hands.
    expect(slowed, 'the ball was knocked back off a body it broke').toBe(false);
    for (let step = 0; step < STEPS_PER_SECOND; step++) frame.step();
    expect(world.ship.along, 'the ball did not go on through where the body was').toBeGreaterThan(at);
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

describe('0617 — the War Dance stops, swings and burns', () => {
  it('THE REPORTED ONE: turned hard round at a body behind it, it brakes with flame out of its front, swings, and burns with flame out of its back', () => {
    const { world, frame } = flying('fighter');
    launchSpecial(world, 'warDance');
    frame.step();
    // A body straight behind it, the hardest turn there is, and nothing else in view.
    const speed = Math.hypot(world.danceAlong, world.danceAcross);
    bodyAt(world, 1e6, world.ship.along - (world.danceAlong / speed) * 50, world.ship.across - (world.danceAcross / speed) * 50);
    const px = (u: number): number => u * PX * STEPS_PER_SECOND;
    const speeds: number[] = [];
    const thrust: number[] = [];
    let ahead = 0;
    let behind = 0;
    for (let step = 0; step < 40 && world.danceFor > 0; step++) {
      frame.step();
      speeds.push(world.danceSpeed);
      thrust.push(world.danceThrust);
      if (world.danceThrust === 0) continue;
      // A mote of flame beside the ship, against where the dance is going: ahead of it for a brake, behind for a burn.
      let front = false;
      let back = false;
      for (let i = 0; i < world.debris.size; i++) {
        const mote = world.debris.at(i);
        if (mote.kind !== DEBRIS_KIND.ember) continue;
        const dA = mote.along - world.ship.along;
        const dC = mote.across - world.ship.across;
        if (Math.hypot(dA, dC) > DANCE.reach + 6) continue;
        const into = dA * world.danceAlong + dC * world.danceAcross;
        if (into > 0) front = true;
        if (into < 0) back = true;
      }
      if (world.danceThrust < 0 && front) ahead++;
      if (world.danceThrust > 0 && back) behind++;
    }
    const braked = thrust.indexOf(-1);
    const burned = thrust.indexOf(1, braked);
    expect(braked, 'it never braked into a turn of half a circle').toBeGreaterThanOrEqual(0);
    expect(burned, 'it never burned out of the turn').toBeGreaterThan(braked);
    // In pixels a second on the screen the reports were made on: slowed to a crawl, then thrown.
    const slowest = Math.min(...speeds.slice(braked, burned + 1));
    const fastest = Math.max(...speeds.slice(burned));
    expect(px(slowest), `at its slowest it flew ${px(slowest).toFixed(0)} px a second`).toBeLessThan(px(DANCE.speed) * 0.5);
    expect(px(fastest), `burning out it reached ${px(fastest).toFixed(0)} px a second`).toBeGreaterThan(px(DANCE.speed) * 1.4);
    expect(ahead, `its brake threw no flame out of its front (${ahead})`).toBeGreaterThan(3);
    expect(behind, `its burn threw no flame out of its back (${behind} of ${thrust.filter((t) => t > 0).length} burning steps)`).toBeGreaterThan(3);
  });
});

describe('0617 — the knock off a boss, and 0691 — none off a body', () => {
  /**
   * How far the ball comes back off `target` the first time it lands on it, flown straight at it with the stick
   * held there — in pixels, the player's units (0027).
   */
  function firstKnock(world: World, frame: GameFrame, stick: { along: number; across: number }, target: () => Entity, cues: CueKind[]): number {
    let landed = false;
    let farthest = 0;
    for (let step = 0; step < 3 * STEPS_PER_SECOND; step++) {
      world.ship.health = world.shipRow.health;
      world.ramHeat = 0;
      const t = target();
      const d = Math.hypot(t.along - world.ship.along, t.across - world.ship.across);
      stick.along = (t.along - world.ship.along) / d;
      stick.across = (t.across - world.ship.across) / d;
      const before = cues.length;
      frame.step();
      const gap = gapTo(world, target(), RAM.reach);
      if (!landed) {
        landed = cues.slice(before).includes('ram');
        continue;
      }
      if (gap < farthest) break;
      farthest = gap;
    }
    expect(landed, 'the ball never landed').toBe(true);
    return farthest * PX;
  }

  it('off a boss the ball comes back over twelve pixels with the stick held into it; a body breaks and gives nothing back', () => {
    /*
      0617's reported one measured a body's knock at about half a boss's. 0691: a body breaks on contact, so the
      ball flies on through it — the same body of a million, the stick held, is gone on the first landing and the
      ball is past where it stood inside a second.
    */
    const body = flying('ball');
    body.world.ship.invulnFor = Number.MAX_SAFE_INTEGER;
    const stood = body.world.ship.along + 20;
    bodyAt(body.world, 1e6, stood, body.world.ship.across);
    body.stick.along = 1;
    for (let step = 0; step < STEPS_PER_SECOND; step++) {
      body.world.ramHeat = 0;
      body.frame.step();
    }
    expect(body.world.enemies.size, 'a body of a million survived the ball').toBe(0);
    expect(body.world.ship.along, 'the ball was held off a body it broke').toBeGreaterThan(stood);

    const level: LevelRow = { ...LEVELS.approach, waves: [], pickups: [], landmarks: [], bossAt: 200, midBoss: null, sections: NO_SECTIONS };
    const boss = flying('ball', level);
    for (let i = 0; i < 900 && (boss.world.bossPool.size === 0 || i < 700); i++) {
      boss.world.ship.health = boss.world.shipRow.health;
      if (boss.world.bossPool.size > 0) boss.world.bossPool.at(0).health = boss.world.bossFullHealth;
      boss.frame.step();
    }
    expect(boss.world.bossPool.size, 'the boss never arrived').toBe(1);
    const offBoss = firstKnock(boss.world, boss.frame, boss.stick, () => boss.world.bossPool.at(0), boss.cues);

    expect(offBoss, `off the boss the ball came ${offBoss.toFixed(1)} px back`).toBeGreaterThan(12);
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
    const heading = { along: world.danceAlong, across: world.danceAcross };
    let met = -1;
    // 0617: the speed it came at, which is its own and no longer the row's — it may be burning into the body.
    let came = 0;
    for (let step = 0; step < 30 && met < 0; step++) {
      came = Math.hypot(world.ship.velAlong - world.scrollPerStep, world.ship.velAcross);
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
    // 0617: and off the side it came at — at a burn's speed a dance that is not turned goes out of the far side.
    expect(awayAlong * heading.along + awayAcross * heading.across, 'the dance went through the body').toBeLessThan(0);
    expect(Math.hypot(vAlong, vAcross), `the bumper threw it off at ${Math.hypot(vAlong, vAcross).toFixed(2)}, no faster than the ${came.toFixed(2)} it came at`).toBeGreaterThan(came * 1.2);
    expect(gapTo(world, body, DANCE.reach) * PX, 'the dance is still inside the body').toBeGreaterThan(-2 * PX);
  });

  it('0617 — at its fastest it never goes through a body it cannot break, however its step falls on it', () => {
    for (let offset = 0; offset < DANCE.thrown; offset += 0.5) {
      const { world, frame, body } = dancingAt(1e6, DANCE.thrown * 2 + offset);
      const speed = Math.hypot(world.danceAlong, world.danceAcross);
      const heading = { along: world.danceAlong / speed, across: world.danceAcross / speed };
      world.danceSpeed = DANCE.thrown;
      world.danceAlong = heading.along * DANCE.thrown;
      world.danceAcross = heading.across * DANCE.thrown;
      for (let step = 0; step < 6; step++) {
        // Flown straight at it at the bumper's speed, nothing bending it.
        world.dancePullIn = 10;
        frame.step();
      }
      const past = (world.ship.along - body.along) * heading.along + (world.ship.across - body.across) * heading.across;
      expect(past, `${offset.toFixed(1)} units off the step, the dance went through the body`).toBeLessThan(0);
    }
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
