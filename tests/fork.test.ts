/**
 * The corridor forks — `docs/decisions/0600-the-corridor-forks.md`.
 *
 * Asked for: *"have the background move up/down with branching paths so it feels like a labyrinth."*
 * Planned in `reports/the-labyrinth-turns-and-forks-2026-09-21.md` and answered: *"a fork's own thirty
 * a way, every tier."* An island of the same stone stands between two ways, and every rule the walls
 * keep (0349) it keeps — but one, which 0600 names: a body is held in its way rather than destroyed.
 *
 * ⚠️ **ON FIXTURES, BECAUSE THESE ARE RULES OF THE MECHANISM.** The Labyrinth's own islands are held in
 * `tests/corridor.test.ts`, in the player's units, on every tier. Here the corridor stands at the box's
 * edges and forks from before the first step, so an island is beside the ship from the start and the
 * questions are asked of it alone.
 */

import { describe, expect, it } from 'vitest';

import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { FORK_WAY, type LevelRow, type WaveEntry } from '../src/content/levels.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPECIALS } from '../src/content/specials.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { ISLE_ABOVE, ISLE_BELOW, ISLE_CARVE, faceAt, stoneAt } from '../src/sim/corridor.ts';
import { nearestFrom } from '../src/sim/collide.ts';
import { reset, type Entity } from '../src/sim/entity.ts';
import { PLAYER_MARGIN } from '../src/sim/flight.ts';
import { CARVE_PASSAGES, GameFrame, RIFT_KIND, corridorFor, launchSpecial, type World } from '../src/app/frame.ts';
import type { Surface } from '../src/render/surface.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** The box, as the Labyrinth's corridor stands at rest. */
const BOX = { centre: ACROSS_SPAN / 2, width: ACROSS_SPAN - PLAYER_MARGIN * 2, wall: 'roomWall' as const, passages: [] };

/** A level with nothing in it but the box and, unless `fork` is false, an island the whole way. */
function level(fork: boolean, waves: readonly WaveEntry[] = [], forks = [{ at: -240, length: 3000 }]): LevelRow {
  return {
    waves,
    pickups: [],
    landmarks: [],
    bossAt: 3000,
    midBoss: null,
    sections: NO_SECTIONS,
    boss: 'sentinel',
    theme: 'labyrinth',
    corridor: fork ? { ...BOX, forks } : BOX,
  };
}

function forked(fork = true, waves: readonly WaveEntry[] = [], forks?: { at: number; length: number }[]) {
  const built = playableWorld(level(fork, waves, forks));
  return { world: built.world, frame: new GameFrame(built.world), stick: built.stick };
}

/** The island's two faces where `along` is. */
function isle(world: World, along: number): { low: number; high: number } {
  return { low: faceAt(world.corridor!, along, ISLE_BELOW), high: faceAt(world.corridor!, along, ISLE_ABOVE) };
}

/** A body that flies down the lane and nothing else: a charger with no turns left in it. */
function straight(world: World, along: number, across: number): Entity {
  const body = world.enemies.spawn()!;
  // `reset` leaves it no turns, and a loop with none left flies the speed it was given.
  reset(body, along, across, { ...ENEMIES.charger, health: 9999 }, ENEMY_KINDS.indexOf('charger'));
  body.velAlong = -1;
  body.fireIn = 1e9;
  return body;
}

describe('0600 — the corridor forks', () => {
  it('THE WAYS, IN LANE UNITS: an island stands between two ways of the player’s thirty', () => {
    const { world } = forked();
    const { low, high } = isle(world, world.ship.along + 60);
    expect(low - faceAt(world.corridor!, world.ship.along + 60, -1), 'the way below the island').toBe(FORK_WAY);
    expect(faceAt(world.corridor!, world.ship.along + 60, 1) - high, 'the way above it').toBe(FORK_WAY);
    expect(high - low, 'the island is less than a tile of stone').toBeGreaterThanOrEqual(world.corridor!.extent);
  });

  it('THE SHIP: flying into an island costs exactly one hit and leaves the ship in the way it came from', () => {
    // 0349's own question, asked of the island's low face from the way below it.
    const { world, frame, stick } = forked();
    world.ship.across = 20;
    world.ship.health = 3;
    world.ship.invulnFor = 0;
    stick.across = 1;
    let firstHit = -1;
    let afterFirst = 0;
    let highest = -Infinity;
    for (let step = 0; step < 120; step++) {
      const before = world.ship.health;
      frame.step();
      highest = Math.max(highest, world.ship.across + world.ship.radius * world.tuning.hurtbox - isle(world, world.ship.along).low);
      if (world.ship.health < before) {
        if (firstHit < 0) {
          firstHit = step;
          expect(before - world.ship.health, 'the first touch of the island cost other than one hit').toBe(1);
        } else if (step - firstHit < 45) afterFirst += before - world.ship.health;
      }
    }
    expect(firstHit, 'two seconds flying at the island never touched it').toBeGreaterThanOrEqual(0);
    expect(afterFirst, 'pressing on through the blink cost more').toBe(0);
    expect(highest, `the ship's hull went ${highest.toFixed(2)} lane units into the island`).toBeLessThanOrEqual(1e-9);
    expect(world.ship.across, 'the ship was put out on the island’s far side').toBeLessThan(ACROSS_SPAN / 2);
  });

  it('A SHOT ENDS AT THE ISLAND: nothing fired from one way reaches the other', () => {
    const { world, frame } = forked();
    const shot = world.enemyShots.spawn()!;
    reset(shot, world.ship.along + 40, 100, SHOTS[ENEMIES.turret.shot]);
    shot.velAlong = 0;
    shot.velAcross = -1;
    const { high } = isle(world, shot.along);
    let past = 0;
    for (let step = 0; step < 60; step++) {
      frame.step();
      for (let i = 0; i < world.enemyShots.size; i++) if (world.enemyShots.at(i).across < high - 1) past++;
    }
    expect(past, 'a shot was seen more than a unit into the island').toBe(0);
    expect(world.enemyShots.size, 'the shot flew on rather than ending at the island').toBe(0);
  });

  it('AN ISLAND IS COVER: a blast and a link in one way do not reach the other', () => {
    /*
      *Nothing reaches through stone* — the player's answer — and the plan's consequence of it: *the
      far branch of a fork is safe from a bomb.* The same blast, the same body, with and without the
      island between them; without it the blast must hurt, or this measures nothing.
    */
    const hurt = (fork: boolean): number => {
      const { world, frame } = forked(fork);
      const at = world.ship.along + 80;
      const target = world.enemies.spawn()!;
      reset(target, at, 100, { ...ENEMIES.turret, health: 999 }, ENEMY_KINDS.indexOf('turret'));
      target.fireIn = 1e9;
      const blast = world.blasts.spawn()!;
      reset(blast, at, 20, SHOTS[SPECIALS.bomb.becomes!]);
      blast.radius = 100;
      blast.lifeFor = 30;
      frame.step();
      expect(world.enemies.size, 'the body did not survive to be asked').toBe(1);
      return 999 - target.health;
    };
    expect(hurt(false), 'the blast did not reach across the open box, so this measures nothing').toBeGreaterThan(0);
    expect(hurt(true), 'the blast reached through the island').toBe(0);
    const link = (fork: boolean): number => {
      const { world } = forked(fork);
      const at = world.ship.along + 80;
      const target = world.enemies.spawn()!;
      reset(target, at, 100, ENEMIES.turret, ENEMY_KINDS.indexOf('turret'));
      return nearestFrom(world.enemies, at, 20, 120, false, 1e9, world.corridor);
    };
    expect(link(false), 'a link cannot see a body across the open box').toBe(0);
    expect(link(true), 'a link found a body in the other way').toBe(-1);
  });

  it('A BODY IS HELD IN ITS WAY: one steered into the island slides along it, and the stone does not take it', () => {
    /*
      ⚠️ **THE ONE RULE THE ISLAND DOES NOT SHARE WITH THE WALLS** — 0349 destroys a body that meets a wall;
      an island puts it back beside itself. A charger never steers across, so one pushed at the island
      cannot help it: at a wall it is destroyed, and here it must still be there, outside the stone, in
      the way it started in.
    */
    const { world, frame } = forked();
    const body = world.enemies.spawn()!;
    reset(body, world.ship.along + 80, 24, { ...ENEMIES.charger, health: 9999 }, ENEMY_KINDS.indexOf('charger'));
    body.velAcross = 1;
    body.fireIn = 1e9;
    let inStone = 0;
    let nearest = Infinity;
    for (let step = 0; step < 60; step++) {
      frame.step();
      if (world.enemies.size === 0) break;
      const e = world.enemies.at(0);
      if (stoneAt(world.corridor, e.along, e.across, e.radius) !== 0) inStone++;
      nearest = Math.min(nearest, isle(world, e.along).low - (e.across + e.radius));
    }
    expect(world.enemies.size, 'a body pushed at the island was destroyed by it').toBe(1);
    expect(world.corridor!.kills, 'the island took a body').toBe(0);
    expect(inStone, 'the body was in stone').toBe(0);
    expect(nearest, 'the body never reached the island, so this measured nothing').toBeLessThan(0.5);
  });

  it('A DRIFTER TURNS AT THE ISLAND, as it does at a wall', () => {
    // Held by turning, not by sliding: a drifter pressed against the face is the hold doing the turn's job.
    const { world, frame } = forked();
    const drifter = world.enemies.spawn()!;
    reset(drifter, world.ship.along + 80, 28, { ...ENEMIES.drifter, health: 999 }, ENEMY_KINDS.indexOf('drifter'));
    drifter.velAcross = 0.3;
    drifter.fireIn = 1e9;
    let turned = -1;
    for (let step = 0; step < 90 && turned < 0; step++) {
      frame.step();
      if (world.enemies.size > 0 && world.enemies.at(0).velAcross < 0) turned = step;
    }
    expect(turned, 'a drifter heading for the island never turned back from it').toBeGreaterThanOrEqual(0);
  });

  it('A POINT PARTS WHAT FLIES AT IT: bodies down the middle of the lane come out in the two ways, whole', () => {
    /*
      The ride's question, asked of an island: three bodies flying straight down the lane's middle, onto
      the island's point. Each must be carried to the side of the middle it was on, never be in the
      stone, and come out of the fork in a way.
    */
    const { world, frame } = forked(true, [], [{ at: 300, length: 240 }]);
    const corridor = world.corridor!;
    const far = corridor.from + 540;
    // Put down once the place beyond the point is on the screen, where content is never culled.
    for (let step = 0; step < 60 * 20 && world.cameraAlong + world.view.alongSpan < far + 40; step++) frame.step();
    const bodies = [56, 60, 64].map((across) => straight(world, far + 20, across));
    let inStone = 0;
    let beside = 0;
    for (let step = 0; step < 60 * 12; step++) {
      world.ship.health = world.shipRow.health;
      frame.step();
      for (const e of bodies) {
        if (stoneAt(corridor, e.along, e.across, e.radius) !== 0) inStone++;
        const { low, high } = isle(world, e.along);
        if (high - low >= corridor.extent) beside++;
      }
      if (bodies.every((e) => e.along < corridor.from + 290)) break;
    }
    expect(corridor.kills, 'the island’s point took a body').toBe(0);
    expect(inStone, 'a body was in the island').toBe(0);
    expect(beside, 'no body was ever beside the island, so this measured nothing').toBeGreaterThan(60);
    expect(bodies.map((e) => Math.sign(e.across - ACROSS_SPAN / 2)), 'a body came out in the other way from the side it flew in on').toEqual([-1, 1, 1]);
  });

  it('A WAVE PARTS ROUND THE ISLAND: a line across the middle is put down in both ways, in order, no two on top of each other', () => {
    /*
      *"Absent meaning the branch nearest its lane"* — read per member. A line across the middle is put
      down with each member in the way on its own side, in the order it was authored; a column off the
      middle all in the one way. Squeezed into a way, a formation must still be one body per place:
      0197's *"some enemies spawn all on top of each other so it looks like one enemy"* is the failure.
    */
    const waves: WaveEntry[] = [
      { at: 200, enemy: 'sower', formation: 'line', count: 5, lane: 50 },
      { at: 260, enemy: 'drifter', formation: 'column', count: 5, lane: 30 },
      { at: 320, enemy: 'charger', formation: 'line', count: 5, lane: 62 },
    ];
    const { world, frame } = forked(true, waves);
    const put: string[] = [];
    let checked = 0;
    for (let step = 0; step < 60 * 20 && world.nextWave < waves.length; step++) {
      world.ship.health = world.shipRow.health;
      const before = world.nextWave;
      const already = new Set<Entity>();
      for (let i = 0; i < world.enemies.size; i++) already.add(world.enemies.at(i));
      frame.step();
      if (world.nextWave === before) continue;
      const wave = waves[before]!;
      const members: Entity[] = [];
      for (let i = 0; i < world.enemies.size; i++) if (!already.has(world.enemies.at(i))) members.push(world.enemies.at(i));
      checked += members.length;
      for (const e of members) {
        const { low, high } = isle(world, e.along);
        if (stoneAt(world.corridor, e.along, e.across, e.radius) !== 0) put.push(`${wave.at}: a member put down in stone at ${e.across.toFixed(1)}`);
        if (e.across > low && e.across < high) put.push(`${wave.at}: a member put down inside the island at ${e.across.toFixed(1)}`);
      }
      const sides = members.map((e) => Math.sign(e.across - ACROSS_SPAN / 2));
      if (wave.formation === 'column' && new Set(sides).size !== 1) put.push(`${wave.at}: a column off the middle was split between the ways`);
      if (wave.lane === 50 && new Set(sides).size !== 2) put.push(`${wave.at}: a line across the middle was put down in one way`);
      // One body per place: each pair apart by more than the hull, wherever the squeeze has put them.
      for (let a = 0; a < members.length; a++) {
        for (let b = a + 1; b < members.length; b++) {
          const ea = members[a]!;
          const eb = members[b]!;
          if (Math.hypot(ea.along - eb.along, ea.across - eb.across) < ea.radius) put.push(`${wave.at}: members ${a} and ${b} put down on top of each other`);
        }
      }
    }
    expect(checked, 'no wave was put down, so this measured nothing').toBeGreaterThanOrEqual(15);
    expect(put.join('\n'), 'a wave was put down wrong beside the island').toBe('');
  });

  it('A FLANKER COMES INTO THE WAY BESIDE ITS OWN WALL, wherever its lane says', () => {
    // Aimed by its lane at the far way, it would cross the island to reach it.
    const waves: WaveEntry[] = [{ at: 200, enemy: 'charger', formation: 'line', count: 3, lane: 80, origin: 'acrossMinus' }];
    const { world, frame } = forked(true, waves);
    for (let step = 0; step < 60 * 10 && world.nextWave < waves.length; step++) {
      world.ship.health = world.shipRow.health;
      frame.step();
    }
    expect(world.enemies.size, 'the flank was never put down').toBeGreaterThan(0);
    for (let i = 0; i < world.enemies.size; i++) {
      const e = world.enemies.at(i);
      expect(e.steerAcross, `a flanker from below steers for ${e.steerAcross.toFixed(1)}, across the island`).toBeLessThan(isle(world, e.along).low);
    }
  });

  it('A WEAVE SWINGS ACROSS ITS WAY, NOT THE CORRIDOR: put down in the middle of a way, it never reaches either side of it', () => {
    /*
      A weaver authored across the box, put down in the middle of the way below the island and flown
      the screen's length. Squeezed to its way, its swing is the row's in the way's proportion and comes
      nowhere near either face. Squeezed to the corridor — the box, beside an island — it swings its
      whole sixteen: into the wall, which destroys it, and into the island, which holds it.

      ⚠️ **HELD BY WHAT IT TOUCHES, NOT BY HOW FAR IT SWINGS.** The first version bounded the swing, and
      the over-wide one stayed inside the bound: the hold flattened it against the island and the wall
      took it at the bottom, before the swing could be measured past either.
    */
    const { world, frame } = forked();
    const row = ENEMIES.weaver;
    expect(row.motion.kind, 'the weaver no longer weaves; point this at one that does').toBe('weave');
    const body = world.enemies.spawn()!;
    const middle = (faceAt(world.corridor!, world.ship.along + 200, -1) + isle(world, world.ship.along + 200).low) / 2;
    reset(body, world.ship.along + 200, middle, { ...row, health: 9999 }, ENEMY_KINDS.indexOf('weaver'));
    body.velAlong = -row.closing * world.difficulty.closing;
    body.fireIn = 1e9;
    let low = Infinity;
    let high = -Infinity;
    let nearest = Infinity;
    for (let step = 0; step < 60 * 6 && world.enemies.size > 0; step++) {
      world.ship.health = world.shipRow.health;
      frame.step();
      if (body.along < world.cameraAlong + 20) break;
      low = Math.min(low, body.across);
      high = Math.max(high, body.across);
      const wall = body.across - body.radius - faceAt(world.corridor!, body.along, -1);
      const island = isle(world, body.along).low - (body.across + body.radius);
      nearest = Math.min(nearest, wall, island);
    }
    expect(world.corridor!.kills, 'the weave swung into the wall').toBe(0);
    expect(high - low, 'the weave never swung, so this measured nothing').toBeGreaterThan(1);
    expect(nearest, `the weave came ${nearest.toFixed(2)} from a side of its way`).toBeGreaterThan(1);
  });

  it('A RIFT CARVES AN ISLAND AS IT CARVES A WALL, and the painter leaves undrawn what it carved — 0377, 0036', () => {
    /*
      *The walls are carved permanently* — 0377's answer — and an island is the same stone. Thrown from
      the way below it, close to its face, the rift must open the island where it covers it; and the
      picture must open with the model, or the ship flies through stone it can see.
    */
    const { world, frame } = forked();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    world.missileIn = Number.MAX_SAFE_INTEGER;
    world.ship.across = 30;
    world.ship.prevAcross = world.ship.across;
    launchSpecial(world, 'voidMissile');
    let rift: Entity | undefined;
    for (let i = 0; i < 200 && rift === undefined; i++) {
      world.ship.invulnFor = 2;
      frame.step();
      for (let b = 0; b < world.blasts.size; b++) if (world.blasts.at(b).kind === RIFT_KIND) rift = world.blasts.at(b);
    }
    expect(rift, 'the void missile never opened a rift').toBeDefined();
    const carved = world.corridor!;
    const pristine = corridorFor(level(true), world.levelOrigin, world.difficulty)!;
    const at = rift!.along;
    const inside = isle(world, at).low + 2;
    expect(stoneAt(pristine, at, inside, 0), 'the fixture has no island where the rift opened').toBe(ISLE_BELOW);
    expect(stoneAt(carved, at, inside, 0), 'the island the rift covered is still there').toBe(0);
    // And drawn: the same step painted with the carve and with it put back.
    const blits: number[] = [];
    const recorder: Surface = { clear: () => (blits.length = 0), bolt: () => {}, blit: (sprite: number) => void blits.push(sprite) };
    world.surface = recorder;
    frame.draw(1);
    const withCarve = blits.length;
    const passages = carved.passages;
    const saved = Array.from(passages);
    // Only the island's carves put back — the rift reaches the near wall too, and that is 0377's.
    let islandCarves = 0;
    for (let i = passages.length - 3 * CARVE_PASSAGES; i < passages.length; i += 3) {
      if (passages[i + 2] !== ISLE_CARVE) continue;
      passages[i] = 0;
      passages[i + 1] = -1;
      islandCarves++;
    }
    frame.draw(1);
    passages.set(saved);
    expect(islandCarves, 'no carve was recorded against the island').toBeGreaterThan(0);
    expect(blits.length, 'the carved island is still drawn').toBeGreaterThan(withCarve);
  });
});
