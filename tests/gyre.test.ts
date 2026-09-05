/**
 * The gyre spins — `docs/decisions/0252-the-gyre-spins.md`.
 *
 * The Labyrinth's real boss, from the brief: *"an upgraded version of the current end boss of
 * saurian belt — the upgrades are that it will spin and that the bullet walls will have the bullets
 * closer together — the spaceship gaps will be the same size, but the bullet gaps will be close so
 * you can't fit through them. it'll spin and create diagonal, vertical and horizontal gaps to fly
 * through."* What is held here is that the curtain takes a different stance each throw — across
 * the lane, slanted corner to corner, along the lane at the top edge, slanted the other way — that
 * each is one line with one hole at the same share of it, that the wall along the lane falls and is
 * a wall, and that nothing comes from behind. What every curtain is — one hole, wide enough,
 * reachable, never following the ship — is `tests/level.test.ts`'s, driven on the first throw.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { curtainSpacing, curtainStance } from '../src/app/boss.ts';
import { BOSSES, BOSS_KINDS, CURTAIN_STANCES } from '../src/content/bosses.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SHIPS } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** The gyre alone, a short way in, with no mid-boss in front of it. */
const GYRE_ONLY: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 200,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'gyre',
  theme: 'labyrinth',
};

type Driven = { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame };

/** The gyre on station and whole, its fan held, and an immortal ship out of the way. */
function gyreOnStation(): Driven {
  const { world } = playableWorld(GYRE_ONLY);
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
    frame.step();
  }
  expect(world.bossPool.size, 'the gyre never arrived').toBe(1);
  world.enemyShots.clear();
  return { world, frame };
}

interface Shot {
  along: number;
  across: number;
  velAlong: number;
  velAcross: number;
}

/**
 * The k-th curtain of a fight, thrown now: the boss's health is put below the k-th notch and the
 * fan is held, so what is in the pool afterwards is that curtain and nothing else. Returns the
 * shots and where the hull and camera were on the step it was thrown.
 */
function curtain(d: Driven, k: number): { shots: Shot[]; hullAlong: number; cameraAlong: number } {
  const uncoil = BOSSES.gyre.uncoil!;
  const { world, frame } = d;
  world.enemyShots.clear();
  const at = uncoil.from - uncoil.every * k - 0.01;
  for (let i = 0; i < 3 && world.enemyShots.size === 0; i++) {
    world.ship.health = world.shipRow.health;
    world.ship.across = ACROSS_SPAN / 2;
    world.bossPool.at(0).health = world.bossFullHealth * at;
    world.bossPool.at(0).fireIn = 999;
    frame.step();
  }
  // Where the hull and the camera were when the curtain left: the camera had already advanced
  // this step when the boss threw, and the hull had not yet moved.
  const cameraAlong = world.cameraAlong;
  const hullAlong = world.bossPool.at(0).along - world.bossPool.at(0).velAlong;
  const shots: Shot[] = [];
  for (let i = 0; i < world.enemyShots.size; i++) {
    const s = world.enemyShots.at(i);
    // Where it was thrown, not where it is: one step of its own travel undone.
    shots.push({ along: s.along - s.velAlong, across: s.across - s.velAcross, velAlong: s.velAlong, velAcross: s.velAcross });
  }
  return { shots, hullAlong, cameraAlong };
}

const gyre = BOSSES.gyre.uncoil!;
const spacing = curtainSpacing(gyre.gap);

describe('0252 — the gyre spins', () => {
  it('THE SPIN: the gyre’s curtain turns an eighth a throw through the four stances, no other wall turns, and its bullets stand too close to slip between', () => {
    expect(gyre.spin, 'the gyre does not spin').toBe(true);
    for (const kind of BOSS_KINDS) {
      const u = BOSSES[kind].uncoil;
      if (u === null || kind === 'gyre') continue;
      expect(u.spin, `${kind}'s wall turns, and the spin is the gyre's upgrade`).toBe(false);
      expect(curtainStance(u.spin, 3), `${kind}'s fourth wall is not across the lane`).toBe('across');
    }
    // Across, slanted, along, slanted the other way, across again — and round again after that.
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((k) => curtainStance(true, k))).toEqual([...CURTAIN_STANCES, ...CURTAIN_STANCES]);
    expect(CURTAIN_STANCES[0], 'the first curtain of a fight is not across the lane').toBe('across');
    // *"The bullet gaps will be close so you can't fit through them"*: the room between two
    // neighbouring bullets is under the ship's own width, at the standard hurtbox.
    const room = spacing - 2 * SHOTS[BOSSES.gyre.shot].radius;
    expect(room, `a ship ${2 * SHIPS.proof.radius} wide fits between bullets ${room.toFixed(2)} apart`).toBeLessThan(2 * SHIPS.proof.radius);
    // *"The spaceship gaps will be the same size"*: no other wall's hole is wider than this one.
    for (const kind of BOSS_KINDS) {
      const u = BOSSES[kind].uncoil;
      if (u !== null) expect(gyre.hole, `${kind}'s hole is wider than the gyre's`).toBeGreaterThanOrEqual(u.hole);
    }
    expect(LEVELS.shoal.boss).toBe('gyre');
    expect(LEVELS.shoal.theme).toBe('labyrinth');
  });

  it('THE FOUR WALLS, DRIVEN: across the lane, slanted, along the lane from the top edge, slanted back — each one line with one hole at the same share of it, and none from behind', () => {
    for (let k = 0; k < 4; k++) {
      const d = gyreOnStation();
      const { shots, hullAlong, cameraAlong } = curtain(d, k);
      const stance = curtainStance(gyre.spin, k);
      expect(shots.length, `curtain ${k} (${stance}) was not thrown`).toBeGreaterThan(10);
      const scroll = d.world.scrollPerStep;
      // Never from behind: nothing travels up the lane in the camera's frame.
      for (const s of shots) expect(s.velAlong - scroll, `curtain ${k} comes from behind`).toBeLessThanOrEqual(1e-9);
      // Which way it stands, in the player's units: a lane's width across, a lane's width along.
      const alongSpan = Math.max(...shots.map((s) => s.along)) - Math.min(...shots.map((s) => s.along));
      const acrossSpan = Math.max(...shots.map((s) => s.across)) - Math.min(...shots.map((s) => s.across));
      switch (stance) {
        case 'across':
          expect(alongSpan, 'the wall across the lane leans').toBeLessThan(0.01);
          expect(acrossSpan, 'the wall across the lane does not span it').toBeGreaterThan(ACROSS_SPAN - spacing - 0.01);
          for (const s of shots) expect(s.velAcross, 'the wall across the lane drifts across it').toBe(0);
          break;
        case 'slant':
        case 'backslant': {
          expect(acrossSpan, `the ${stance} does not span the lane`).toBeGreaterThan(ACROSS_SPAN - spacing - 0.01);
          expect(alongSpan, `the ${stance} does not lean a lane's width along it`).toBeGreaterThan(ACROSS_SPAN - spacing - 0.01);
          // Corner to corner: along rises with across for the slant, falls for the backslant, from the hull.
          const sign = stance === 'slant' ? 1 : -1;
          for (const s of shots) {
            const expected = hullAlong + sign * (s.across - (stance === 'slant' ? 0 : ACROSS_SPAN));
            expect(s.along, `a shot of the ${stance} is off its line`).toBeCloseTo(expected, 3);
            expect(s.velAcross, `the ${stance} drifts across the lane`).toBe(0);
          }
          break;
        }
        case 'along':
          expect(alongSpan, 'the wall along the lane does not run from the camera’s edge to the hull').toBeGreaterThan(hullAlong - cameraAlong - spacing - 0.01);
          expect(acrossSpan, 'the wall along the lane leans').toBeLessThan(0.01);
          for (const s of shots) {
            expect(s.across, 'the wall along the lane starts inside it').toBeLessThanOrEqual(0);
            expect(s.velAcross, 'the wall along the lane does not fall').toBeGreaterThan(0);
            expect(s.velAlong, 'the wall along the lane slides along it').toBeCloseTo(scroll, 6);
          }
          break;
        default: {
          const never: never = stance;
          throw new Error(never);
        }
      }
      // One line: measured from its foot — the hull on the near edge, or the far edge for the
      // backslant, or the camera's edge for the wall along the lane — every neighbour is `spacing`
      // apart, but one: the hole, of the authored width, at the authored share of the line's length.
      const footAlong = stance === 'along' ? cameraAlong : hullAlong;
      const footAcross = stance === 'backslant' ? ACROSS_SPAN : stance === 'along' ? shots[0]!.across : 0;
      const length = stance === 'across' ? ACROSS_SPAN : stance === 'along' ? hullAlong - cameraAlong : ACROSS_SPAN * Math.SQRT2;
      const s = shots.map((x) => Math.hypot(x.along - footAlong, x.across - footAcross)).sort((a, b) => a - b);
      expect(s[0], `curtain ${k} (${stance}) does not start at its foot`).toBeLessThan(0.01);
      expect(s[s.length - 1], `curtain ${k} (${stance}) stops short of its length`).toBeGreaterThan(length - spacing - 0.01);
      let holes = 0;
      let centre = 0;
      let width = 0;
      for (let i = 1; i < s.length; i++) {
        const gap = s[i]! - s[i - 1]!;
        if (gap <= spacing + 0.001) continue;
        holes++;
        centre = (s[i]! + s[i - 1]!) / 2;
        width = gap;
      }
      expect(holes, `curtain ${k} (${stance}) has ${holes} holes in it`).toBe(1);
      expect(width, `curtain ${k}'s hole is ${width.toFixed(1)} wide against the ${gyre.hole} authored`).toBeGreaterThanOrEqual(gyre.hole - spacing);
      const share = gyre.at / ACROSS_SPAN;
      const expected = share * length;
      expect(Math.abs(centre - expected), `curtain ${k}'s hole sits ${centre.toFixed(1)} along it and the row's share puts it at ${expected.toFixed(1)}`).toBeLessThan(spacing * 1.5);
    }
  });

  it('and the wall along the lane is a wall: a ship holding its hole’s along is passed over, one a hole’s width away is hit — within the seconds it takes to fall', () => {
    /*
      *"Vertical gaps to fly through."* Driven twice: the third curtain lies along the lane and
      falls across it; a ship holding the hole's along on the screen is not touched as it passes,
      and one holding a hole's width further along is, before the wall has crossed the lane.
    */
    const run = (offsetFromHole: number): number => {
      const d = gyreOnStation();
      const { shots } = curtain(d, 2);
      const { world, frame } = d;
      const along = shots.map((s) => s.along).sort((a, b) => a - b);
      let holeAlong = -1;
      for (let i = 1; i < along.length; i++) {
        if (along[i]! - along[i - 1]! > spacing + 0.001) holeAlong = (along[i]! + along[i - 1]!) / 2;
      }
      expect(holeAlong, 'the wall along the lane has no hole').toBeGreaterThan(0);
      const offset = holeAlong - world.cameraAlong + offsetFromHole;
      for (let step = 1; step <= 300; step++) {
        world.ship.along = world.cameraAlong + offset;
        world.ship.velAlong = world.scrollPerStep;
        world.ship.across = ACROSS_SPAN / 2;
        world.ship.velAcross = 0;
        world.ship.invulnFor = 0;
        world.ship.health = world.shipRow.health;
        world.bossPool.at(0).fireIn = 999;
        world.bossPool.at(0).health = world.bossFullHealth * 0.25;
        const before = world.ship.health;
        frame.step();
        if (world.ship.health < before || world.dyingIn > 0) return step;
      }
      return -1;
    };
    expect(run(0), 'a ship holding the hole’s along was hit by the wall along the lane').toBe(-1);
    const hitAt = run(gyre.hole);
    expect(hitAt, 'a ship beside the hole was not hit by the wall along the lane, so it is not a wall').toBeGreaterThan(0);
    const crossing = (ACROSS_SPAN / 2) / SHOTS[BOSSES.gyre.shot].speed / STEPS_PER_SECOND;
    expect(hitAt / STEPS_PER_SECOND, `the wall reached mid-lane ${(hitAt / STEPS_PER_SECOND).toFixed(1)} s after it was thrown`).toBeLessThan(crossing + 1);
  });
});
