/**
 * A blade circles the ship — `docs/decisions/0234-a-blade-circles-the-ship.md`.
 *
 * The shuriken is the third gun and the first shot that is not spent by arriving: it circles the
 * ship in a widening spiral for its own clock's length and lands on everything it crosses, once per
 * impact flash. The kind's ladders, face and hulls are held by `tests/weapons.test.ts` over every
 * gun; what is held here is the flight.
 *
 * ⚠️ **Nothing here asserts on a VALUE**, on `src/content/shots.ts`'s terms — the spiral widens, the
 * blade survives, the second landing waits for the flash to finish.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame, wearHull, type World } from '../src/app/frame.ts';
import { CAPACITY } from '../src/app/mount.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { SHOTS } from '../src/content/shots.ts';
import { UPGRADE_TIERS, weaponFor, type UpgradeKind } from '../src/content/pickups.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { CUES, TWIN_KINDS } from '../src/content/cues.ts';
import { reset } from '../src/sim/entity.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

const NEVER = Number.MAX_SAFE_INTEGER;

/** A world with the shuriken fitted at `tier` rungs, nothing else in the air, the launcher about to throw. */
function armed(tier: number): { world: World; frame: GameFrame; cues: string[] } {
  const built = playableWorld(NO_LEVEL);
  const carried: UpgradeKind[] = [];
  for (let i = 0; i < tier; i++) carried.push('weapon');
  built.world.weapon = weaponFor(built.world.shipRow, carried, 'shuriken');
  wearHull(built.world);
  built.world.fireIn = 1;
  built.world.missileIn = NEVER;
  return { world: built.world, frame: new GameFrame(built.world), cues: built.cues };
}

/** A tough body that never fires and holds its place `ahead` of the ship, `aside` across it. */
function target(world: World, ahead: number, aside: number, radius: number): { health: number; flashFor: number } {
  const enemy = world.enemies.spawn();
  if (enemy === null) throw new Error('the enemy pool is full');
  reset(enemy, world.ship.along + ahead, world.ship.across + aside, { ...ENEMIES.turret, health: 999, radius }, world.enemyKinds.turret);
  enemy.fireIn = NEVER;
  // Riding the camera, so it stays where the ship can circle it — a blade lives two seconds and
  // a body holding its WORLD place is thirty units behind the ship by then.
  enemy.velAlong = world.scrollPerStep;
  return enemy;
}

describe('0234 — a blade circles the ship', () => {
  it('THE SPIRAL: a thrown blade circles the ship at a widening distance, and its own clock spends it', () => {
    const { world, frame } = armed(1);
    frame.step();
    expect(world.playerShots.size, 'nothing was thrown').toBe(1);
    // One blade, watched alone: the launcher is held off after the first throw.
    world.fireIn = NEVER;
    const blade = world.playerShots.at(0);
    const life = world.weapon.orbit;
    let lastDistance = 0;
    let lastAngle = Number.NEGATIVE_INFINITY;
    let turned = 0;
    let steps = 0;
    while (world.playerShots.size > 0 && steps < life * 2) {
      const dAlong = blade.along - world.ship.along;
      const dAcross = blade.across - world.ship.across;
      const distance = Math.hypot(dAlong, dAcross);
      const angle = Math.atan2(dAcross, dAlong);
      if (steps > 0) {
        expect(distance, `the spiral stopped widening on step ${steps}`).toBeGreaterThan(lastDistance);
        // Unwrapped, so a wrap past π is a turn and not a reversal.
        let turn = angle - lastAngle;
        if (turn < -Math.PI) turn += Math.PI * 2;
        if (turn > Math.PI) turn -= Math.PI * 2;
        expect(turn, `the blade went backwards round the ship on step ${steps}`).toBeGreaterThan(0);
        turned += turn;
      }
      lastDistance = distance;
      lastAngle = angle;
      frame.step();
      steps++;
    }
    // The step that threw it already spent one of its clock, so what is watched is the rest.
    expect(steps, 'the blade did not live for its own clock’s length').toBe(life - 1);
    expect(turned, 'the blade never went round the ship once').toBeGreaterThan(Math.PI * 2);
    expect(lastDistance, 'the blade ended inside the pulse’s own hurtbox of the ship').toBeGreaterThan(SHOTS.shuriken.speed * life * 0.5);
  });

  it('THE SWEEP: a blade lands on a body it crosses without being spent, and lands again only once the flash has cleared', () => {
    /*
      Asked for: *"hits everything that it comes into contact with on that arc."* A big body on
      the spiral: the blade crosses it, lands, keeps going, and crosses it again on the next turn.
      What must not happen is twenty landings for twenty steps of overlap — one per impact flash is
      the rule `src/sim/collide.ts` states, and it is the same rule the pulse's rate is held to
      (0035: a hit finishes flashing before the next one lands).
    */
    const { world, frame } = armed(2);
    // Off the ship's own line, so the ship never flies into it; on the spiral, so the blade does.
    const body = target(world, 10, 10, 6);
    frame.step();
    expect(world.playerShots.size).toBe(1);
    world.fireIn = NEVER;
    const life = world.weapon.orbit;
    const landings: number[] = [];
    let health = body.health;
    for (let step = 1; step <= life && world.playerShots.size > 0; step++) {
      frame.step();
      if (body.health < health) {
        landings.push(step);
        health = body.health;
        expect(world.playerShots.size, `the blade was spent by landing on step ${step}`).toBe(1);
      }
    }
    expect(landings.length, 'the blade crossed the body and never landed').toBeGreaterThanOrEqual(2);
    for (let i = 1; i < landings.length; i++) {
      expect(landings[i]! - landings[i - 1]!, `landings ${i - 1} and ${i} came on consecutive flashes`).toBeGreaterThan(1);
    }
    expect(landings.length, 'the blade landed on every step it overlapped, which is a saw and not a blade').toBeLessThan(life / 2);
  });

  it('and a blade is blunt after its edge’s worth of arrivals, so a wall of bodies is not free', () => {
    const { world, frame } = armed(0);
    // More bodies than the blade has edge, all on its first turn.
    for (let i = 0; i < SHOTS.shuriken.health + 3; i++) target(world, 6 + i * 0.5, (i % 2 === 0 ? 1 : -1) * (4 + i * 0.3), 1);
    frame.step();
    world.fireIn = NEVER;
    const life = world.weapon.orbit;
    let spentAt = -1;
    for (let step = 1; step <= life; step++) {
      frame.step();
      if (world.playerShots.size === 0) {
        spentAt = step;
        break;
      }
    }
    expect(spentAt, 'the blade outlived its edge against a wall of bodies').toBeGreaterThan(0);
    expect(spentAt, 'the blade was spent before it could have landed its edge’s worth').toBeLessThan(life);
  });

  it('THE SPIN: a blade shows its two turns in turn, so a bitmap that cannot rotate still spins', () => {
    const { world, frame } = armed(1);
    frame.step();
    world.fireIn = NEVER;
    const blade = world.playerShots.at(0);
    const seen = new Set<number>();
    let changes = 0;
    let last = blade.sprite;
    for (let i = 0; i < world.weapon.orbit - 1 && world.playerShots.size > 0; i++) {
      frame.step();
      seen.add(blade.sprite);
      if (blade.sprite !== last) changes++;
      last = blade.sprite;
    }
    expect([...seen].sort(), 'the blade is not drawn as both of its turns').toEqual([SHOTS.shuriken.sprite, SHOTS.shuriken.spriteHit].sort());
    expect(changes, 'the blade turned once and stopped').toBeGreaterThan(4);
  });

  it('THE CUES: a throw sounds as its own cue, and a bite sounds as a hit', () => {
    expect(CUES.throw.twin).toBe('blade-appears');
    expect(TWIN_KINDS).toContain(CUES.throw.twin);
    const { world, frame, cues } = armed(2);
    target(world, 10, 10, 6);
    frame.step();
    expect(cues, 'the throw made no sound').toContain('throw');
    expect(cues, 'a hit sounded before anything was hit').not.toContain('hit');
    for (let i = 0; i < world.weapon.orbit && !cues.includes('hit'); i++) frame.step();
    expect(cues, 'a blade bit a body and nothing sounded').toContain('hit');
  });

  it('and at the cap the pulse’s pool never fills with blades, however long the fight', () => {
    const { world, frame } = armed(UPGRADE_TIERS);
    world.fireIn = world.weapon.fireEvery;
    let peak = 0;
    // Long enough for more blades to have been thrown than the pool holds, if none of them ever
    // left — fifteen seconds is sixty throws at the cap against a pool of eighty-eight, and would
    // have passed a spiral that never ended.
    for (let i = 0; i < 1500; i++) {
      frame.step();
      if (world.playerShots.size > peak) peak = world.playerShots.size;
    }
    expect(peak, 'no blade was ever thrown, so this measured nothing').toBeGreaterThan(0);
    expect(peak, `the cap keeps ${peak} blades in the air against a pool of ${CAPACITY.playerShots}`).toBeLessThan(CAPACITY.playerShots);
    expect(WEAPONS.shuriken.flight).toBe('orbit');
  });
});
