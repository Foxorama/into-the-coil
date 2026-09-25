import { describe, expect, it } from 'vitest';

import {
  CARVE_PASSAGES,
  GameFrame,
  RIFT_KIND,
  THROW_GAP_STEPS,
  corridorFor,
  launchSpecial,
  respawn,
  takeShield,
  type World,
} from '../src/app/frame.ts';
import { openBy, phaseFor } from '../src/app/boss.ts';
import { CAPACITY } from '../src/app/mount.ts';
import { BEAM_BOLT_KIND, RAIN_BOLT_KIND } from '../src/content/bosses.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { LEVELS, LEVEL_KINDS, type LevelRow } from '../src/content/levels.ts';
import { PICKUPS } from '../src/content/pickups.ts';
import { fullHealthFor } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPECIALS, SPECIAL_KINDS } from '../src/content/specials.ts';
import { SPRITE, SPRITE_EXTENT } from '../src/content/sprites.ts';
import { ACROSS_SPAN, MAX_ASPECT, viewOf } from '../src/sim/camera.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD, PLAYER_MARGIN } from '../src/sim/flight.ts';
import { faceAt, stoneAt } from '../src/sim/corridor.ts';
import { reset, type Entity } from '../src/sim/entity.ts';
import type { Surface } from '../src/render/surface.ts';
import { initialState, reduce } from '../src/state/root.ts';
import { NO_LEVEL, NO_SECTIONS, playableWorld } from './world.ts';

/**
 * THE VOID — `docs/decisions/0377-the-void.md`.
 *
 * *"Shields — if you cap shields, you get a void missile. Creates a massive void zone that negates
 * everything but your ship and bosses (does 10% max boss health damage) will also negate bullets and
 * chunks of the labyrinth wall, basically everything, lasers fired by enemies will disappear into."*
 * Answered on the plan: the walls are carved *permanently*.
 *
 * Every number is read off the row, so a rift tuned wider or longer moves the guard with it. A rift
 * is one body in the blast pool — the thing negating and the thing drawn — so it is found there.
 */

const NEVER = Number.MAX_SAFE_INTEGER;
const RIFT = SPECIALS.voidMissile.rift!;
const WALLED = LEVEL_KINDS.filter((kind) => LEVELS[kind].corridor !== undefined);

function quiet(level: LevelRow = NO_LEVEL): { world: World; frame: GameFrame } {
  const { world } = playableWorld(level);
  world.fireIn = NEVER;
  world.missileIn = NEVER;
  return { world, frame: new GameFrame(world) };
}

/** Every open rift. */
function rifts(world: World): Entity[] {
  const open: Entity[] = [];
  for (let i = 0; i < world.blasts.size; i++) if (world.blasts.at(i).kind === RIFT_KIND) open.push(world.blasts.at(i));
  return open;
}

function step(world: World, frame: GameFrame): void {
  world.ship.invulnFor = 2;
  frame.step();
}

/**
 * A rift not among `known`, whatever older ones are doing meanwhile. A rift holds its place in the
 * world, so its place is its name — a pool reuses the body, never the place.
 */
function fresh(world: World, known: ReadonlySet<number>): Entity | undefined {
  return rifts(world).find((r) => !known.has(r.along));
}

/** Throw the void and step until its rift is open; the rift. */
function openOne(world: World, frame: GameFrame): Entity {
  const known = new Set(rifts(world).map((r) => r.along));
  launchSpecial(world, 'voidMissile');
  for (let i = 0; i < 200 && fresh(world, known) === undefined; i++) step(world, frame);
  const rift = fresh(world, known);
  expect(rift, 'the void missile never opened a rift').toBeDefined();
  return rift!;
}

/** A body that holds its place in the world and cannot be killed by anything but the rift. */
function body(world: World, along: number, across: number): Entity {
  const enemy = world.enemies.spawn()!;
  reset(enemy, along, across, { ...ENEMIES.turret, health: 999 }, world.enemyKinds.turret);
  enemy.fireIn = NEVER;
  enemy.velAlong = 0;
  return enemy;
}

class Recorder implements Surface {
  blits: number[] = [];
  clear(): void {
    this.blits.length = 0;
  }
  bolt(): void {}
  blit(sprite: number): void {
    this.blits.push(sprite);
  }
}

describe('0377 — the shield’s own', () => {
  it('THE ASK: a shield taken at a full shell is a void missile, and one taken below it is a shield', () => {
    const { world } = quiet();
    const full = fullHealthFor(world.shipRow, world.difficulty);
    world.ship.health = full - 1;
    expect(takeShield(world), 'a shield with room for it spilled').toBeNull();
    expect(world.ship.health, 'a shield with room for it did not go on').toBe(full);
    expect(takeShield(world), 'a shield at a full shell was not a void missile').toBe('voidMissile');
    expect(world.ship.health, 'a spilled shield went on the ship as well').toBe(full);
    expect(PICKUPS.shield.spills).toBe('voidMissile');
  });

  it('and the void goes on the tubes’ stack, the trigger the missiles fire', () => {
    const state = reduce(initialState, { slice: 'run', type: 'took', special: 'voidMissile' });
    const tubes = state.run.arsenal.tubes;
    expect(tubes[tubes.length - 1], 'the void is not the next thing the tubes throw').toBe('voidMissile');
    expect(state.run.arsenal.gun.includes('voidMissile'), 'the void went on the gun').toBe(false);
  });
});

describe('0377 — the rift negates everything but the ship and the boss', () => {
  it('takes every hostile shot inside it, and leaves one outside', () => {
    const { world, frame } = quiet();
    const rift = openOne(world, frame);
    const inside = world.enemyShots.spawn()!;
    reset(inside, rift.along + RIFT.radius / 2, rift.across, SHOTS.spit);
    inside.velAlong = 0;
    const outside = world.enemyShots.spawn()!;
    reset(outside, rift.along + RIFT.radius + 20, rift.across, SHOTS.spit);
    outside.velAlong = 0;
    frame.step();
    expect(world.enemyShots.size, 'a shot inside the rift survived it, or one outside was taken').toBe(1);
    expect(world.enemyShots.at(0).along, 'the rift took the shot outside it').toBe(outside.along);
  });

  it('kills every body inside it, as a kill that bursts, and leaves one outside', () => {
    const { world, frame } = quiet();
    const rift = openOne(world, frame);
    body(world, rift.along, rift.across + RIFT.radius / 2);
    const safe = body(world, rift.along + RIFT.radius + 30, rift.across);
    world.debris.clear();
    frame.step();
    expect(world.enemies.size, 'the body inside the rift survived it, or one outside was taken').toBe(1);
    expect(world.enemies.at(0), 'the rift took the body outside it').toBe(safe);
    expect(safe.health, 'the body outside the rift was hurt').toBe(999);
    // Through the death log, so it bursts like any kill rather than vanishing — 0036.
    expect(world.debris.size, 'the body the rift took vanished without a burst').toBeGreaterThan(0);
  });

  it('swallows a boss’s lightning that crosses it — a column and a beam — and not one that misses', () => {
    const { world, frame } = quiet();
    const rift = openOne(world, frame);
    const bolt = (along: number, across: number, kind: number, fromAlong: number): Entity => {
      const b = world.bolts.spawn()!;
      reset(b, along, across, { sprite: 0, spriteHit: 0, radius: 2, health: 1, damage: 1 }, kind);
      b.lifeFor = 60;
      b.holdFor = 60;
      b.fromAlong = fromAlong;
      return b;
    };
    bolt(rift.along, 50, RAIN_BOLT_KIND, 0);
    bolt(rift.along - 60, rift.across, BEAM_BOLT_KIND, 120);
    const column = bolt(rift.along + RIFT.radius + 30, 50, RAIN_BOLT_KIND, 0);
    const beam = bolt(rift.along - 60, rift.across + RIFT.radius + 10, BEAM_BOLT_KIND, 120);
    frame.step();
    expect(world.bolts.size, 'lightning crossing the rift survived it, or lightning missing it was taken').toBe(2);
    const left = [world.bolts.at(0), world.bolts.at(1)].map((b) => b.across).sort();
    expect(left, 'the rift took the wrong lightning').toEqual([column.across, beam.across].sort());
  });

  it('leaves the ship and the player’s own fire alone', () => {
    const { world, frame } = quiet();
    const rift = openOne(world, frame);
    const health = world.ship.health;
    world.ship.along = rift.along;
    world.ship.prevAlong = world.ship.along;
    world.ship.across = rift.across;
    world.ship.prevAcross = world.ship.across;
    world.ship.invulnFor = 0;
    for (let i = 0; i < 5; i++) frame.step();
    expect(world.shipPool.size, 'the rift took the ship').toBe(1);
    expect(world.ship.health, 'the rift hurt the ship').toBe(health);
    // One step is enough to see it: a pulse is still in flight a step after it was fired.
    const { world: w2, frame: f2 } = quiet();
    const r2 = openOne(w2, f2);
    const own = w2.playerShots.spawn()!;
    reset(own, r2.along, r2.across, SHOTS.pulse);
    f2.step();
    expect(w2.playerShots.size, 'the rift took the player’s own shot').toBe(1);
  });

  it('closes with the ship that threw it', () => {
    const { world, frame } = quiet();
    openOne(world, frame);
    respawn(world);
    expect(rifts(world).length, 'the rift outlived the ship that threw it').toBe(0);
  });

  it('is drawn at exactly the radius it negates at, and negates for exactly as long as the row says', () => {
    expect(SPRITE_EXTENT.riftZone, 'the rift is drawn at a different size from the one it negates at').toBe(RIFT.radius * 2);
    const { world, frame } = quiet();
    const rift = openOne(world, frame);
    expect(rift.sprite, 'the rift is not drawn as a rift').toBe(SPRITE.riftZone);
    expect(rift.radius, 'the rift negates at a radius other than its row’s').toBe(RIFT.radius);
    let open = 1;
    while (rifts(world).length > 0 && open < RIFT.steps * 2) {
      step(world, frame);
      open++;
    }
    expect(Math.abs(open - RIFT.steps), `the rift was open ${open} steps against its row’s ${RIFT.steps}`).toBeLessThanOrEqual(1);
  });

  it('a salvo thrown as fast as the triggers allow opens every rift it throws, all at once', () => {
    /*
      ⚠️ **A SALVO, because 0372 keeps every charge.** A rift is a body in the blast pool; a pool too
      small for a banked salvo would swallow the last voids of it and open nothing where they landed.
    */
    const { world, frame } = quiet();
    const throws = Math.ceil(RIFT.steps / THROW_GAP_STEPS);
    const seen = new Set<Entity>();
    let most = 0;
    for (let t = 0; t < throws; t++) {
      launchSpecial(world, 'voidMissile');
      for (let i = 0; i < THROW_GAP_STEPS; i++) {
        step(world, frame);
        for (const r of rifts(world)) seen.add(r);
        most = Math.max(most, rifts(world).length);
      }
    }
    for (let i = 0; i < RIFT.steps; i++) {
      step(world, frame);
      for (const r of rifts(world)) seen.add(r);
      most = Math.max(most, rifts(world).length);
    }
    expect(seen.size, `${throws} voids thrown and ${seen.size} rifts opened`).toBe(throws);
    expect(most, 'the salvo never had every rift open at once, so it asked nothing of the pool').toBe(throws);
    expect(most, 'the salvo filled the pool and left no room for the pyre').toBeLessThan(CAPACITY.blasts);
  });
});

describe('0377 — the rift carves the Labyrinth’s stone, for good', () => {
  it('some level is walled, or this describe holds nothing', () => {
    expect(WALLED.length).toBeGreaterThan(0);
  });

  it('opens the near wall it covers, leaves the far wall and the stone past it, and never closes it', () => {
    const level = LEVELS[WALLED[0]!];
    const { world, frame } = quiet(level);
    world.ship.across = PLAYER_MARGIN + 4;
    world.ship.prevAcross = world.ship.across;
    const rift = openOne(world, frame);
    const carved = world.corridor!;
    const pristine = corridorFor(level, world.levelOrigin, world.difficulty)!;
    const at = rift.along;
    const near = faceAt(carved, at, -1) - 2;
    expect(stoneAt(pristine, at, near, 0), 'the fixture has no stone where the rift opened').toBe(-1);
    expect(stoneAt(carved, at, near, 0), 'the stone the rift covered is still there').toBe(0);
    expect(stoneAt(carved, at, faceAt(carved, at, 1) + 2, 0), 'the rift carved a wall it does not reach').toBe(1);
    const past = at + RIFT.radius + carved.extent * 2;
    expect(stoneAt(carved, past, faceAt(carved, past, -1) - 2, 0), 'the rift carved stone past its edge').toBe(-1);
    for (let i = 0; i < RIFT.steps + 30; i++) step(world, frame);
    expect(rifts(world).length, 'the rift never closed').toBe(0);
    expect(stoneAt(carved, at, near, 0), 'the carve closed with the rift').toBe(0);
  });

  it('and the painter leaves undrawn exactly the stone the model opened — 0036', () => {
    /*
      ⚠️ **A carve the model knows and the picture does not would be a wall the ship flies through**,
      which is the bug 0036 names. Drawn once with the carve and once with it put back, on the same
      step: the carved picture has fewer stones, and the difference is the carve.
    */
    const level = LEVELS[WALLED[0]!];
    const { world, frame } = quiet(level);
    world.ship.across = PLAYER_MARGIN + 4;
    world.ship.prevAcross = world.ship.across;
    openOne(world, frame);
    const recorder = new Recorder();
    world.surface = recorder;
    // Every blit, on one step drawn twice: the carve is the only thing that differs between them.
    const count = (): number => {
      frame.draw(1);
      return recorder.blits.length;
    };
    const withCarve = count();
    const passages = world.corridor!.passages;
    const saved = Array.from(passages);
    for (let i = passages.length - 3 * CARVE_PASSAGES; i < passages.length; i += 3) {
      passages[i] = 0;
      passages[i + 1] = -1;
    }
    const without = count();
    passages.set(saved);
    expect(without, 'the carve changed nothing the painter draws').toBeGreaterThan(withCarve);
  });

  it('a long salvo, thrown from both ends of the box, closes no carved stone still on the screen', () => {
    /*
      ⚠️ **The slots were a guess twice.** Eight was *four rifts a level*, a level's pickups — and
      since 0372 a player banks every charge and can empty a salvo at one wall. Twenty-four held a salvo
      from a ship holding still, but only because carves twelve units apart overlap and cover for an
      evicted one. A pilot throwing from the top of the box and then the bottom scatters them, and the
      carve that ends furthest back can still be on the screen. So this pilot throws from both ends,
      and every stretch of stone a rift opened is checked, not only the middle of each.
    */
    const level = LEVELS[WALLED[0]!];
    const { world, frame } = quiet(level);
    // On the widest screen any device can have, where a void thrown from the top of the box flies
    // furthest before it goes off, and so its carve is on the screen longest — 0023's clamp.
    world.view = viewOf(ACROSS_SPAN * MAX_ASPECT * 10, ACROSS_SPAN * 10);
    const pristine = corridorFor(level, world.levelOrigin, world.difficulty)!;
    const opened: { along: number; across: number }[] = [];
    const known = new Set<number>();
    const record = (): void => {
      const rift = fresh(world, known);
      if (rift === undefined) return;
      known.add(rift.along);
      for (let along = rift.along - RIFT.radius; along <= rift.along + RIFT.radius; along += 2) {
        const near = faceAt(world.corridor!, along, -1) - 1;
        if (stoneAt(pristine, along, near, 0) === -1 && stoneAt(world.corridor!, along, near, 0) === 0) opened.push({ along, across: near });
      }
    };
    // One throw per `THROW_GAP_STEPS`, the fastest the triggers allow, hugging the near wall.
    for (let throws = 0; throws < 40; throws++) {
      world.ship.across = PLAYER_MARGIN + 4;
      world.ship.prevAcross = world.ship.across;
      world.ship.along = world.cameraAlong + (throws % 2 === 0 ? PLAYER_ALONG_MARGIN : PLAYER_LEAD);
      world.ship.prevAlong = world.ship.along;
      launchSpecial(world, 'voidMissile');
      for (let i = 0; i < THROW_GAP_STEPS; i++) {
        step(world, frame);
        record();
      }
    }
    const onScreen = opened.filter((o) => o.along > world.cameraAlong);
    expect(onScreen.length, 'no carved stone is still on the screen, so this holds nothing').toBeGreaterThan(0);
    const closed = onScreen.filter((o) => stoneAt(world.corridor!, o.along, o.across, 0) !== 0);
    expect(
      closed.map((o) => Math.round(o.along)),
      `carved stone grew back on the screen, ${world.cameraAlong.toFixed(0)} to ${(world.cameraAlong + world.view.alongSpan).toFixed(0)}`,
    ).toEqual([]);
  });
});

describe('0377 — a thrown special goes off on the screen, wherever it was thrown from', () => {
  it('every thrown kind, thrown from the top of the box, goes off at the edge rather than vanishing', () => {
    /*
      ⚠️ **Found by the void, and true of the bomb since 0053.** The thrown pool rides the player's
      shot cull, and a special thrown from the top of the box reaches the leading edge before its fuse
      runs out — it was released there, and the charge went off nowhere. A player on a wide screen
      throwing from the front of their box lost every one.
    */
    for (const kind of SPECIAL_KINDS) {
      if (SPECIALS[kind].shot === null) continue;
      const { world, frame } = quiet();
      world.ship.along = world.cameraAlong + PLAYER_LEAD;
      world.ship.prevAlong = world.ship.along;
      launchSpecial(world, kind);
      let wentOff = false;
      let onScreen = true;
      for (let i = 0; i < 200 && !wentOff; i++) {
        step(world, frame);
        const edge = world.cameraAlong + world.view.alongSpan;
        for (let k = 0; k < world.blasts.size; k++) {
          wentOff = true;
          onScreen = onScreen && world.blasts.at(k).along <= edge;
        }
        if (world.stormFor > 0) wentOff = true;
      }
      expect(wentOff, `a ${kind} thrown from the top of the box never went off`).toBe(true);
      expect(onScreen, `a ${kind} went off past the edge of the screen`).toBe(true);
    }
  });
});

describe('0377 — the rift lands its share on a boss, once', () => {
  it('a tenth of its full health, as it opens, and nothing more while it is open', () => {
    const level = LEVELS.approach;
    const arena: LevelRow = { ...NO_LEVEL, bossAt: 200, midBoss: null, sections: NO_SECTIONS, boss: 'volans', theme: level.theme };
    const { world, frame } = quiet(arena);
    let arrived = -1;
    for (let i = 0; i < 4000 && (arrived < 0 || i < arrived + 60); i++) {
      step(world, frame);
      if (arrived < 0 && world.bossPool.size > 0 && world.bossEntering < 0) arrived = i;
    }
    expect(world.bossPool.size, 'the boss never arrived').toBe(1);
    const head = world.bossPool.at(0);
    head.fireIn = NEVER;
    world.ship.across = head.across;
    world.ship.along = head.along - SPECIALS.voidMissile.reach;
    world.ship.prevAlong = world.ship.along;
    const before = head.health;
    const open = openBy(phaseFor(world.bossRow, head.health, world.bossFullHealth));
    openOne(world, frame);
    const expected = RIFT.bossShare * world.bossFullHealth * open;
    expect(before - world.bossPool.at(0).health, 'the rift landed something other than its share').toBeCloseTo(expected, 5);
    while (rifts(world).length > 0) step(world, frame);
    expect(before - world.bossPool.at(0).health, 'the rift landed on the boss again while it was open').toBeCloseTo(expected, 5);
  });
});
