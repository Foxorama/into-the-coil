/**
 * The stone bites — `docs/decisions/0349-the-stone-bites.md`.
 *
 * Asked for: *"a wall will kill the ship and block shots, waves need to spawn in the corridors and
 * also explode if they hit a wall."* Answered on the plan
 * (`reports/the-labyrinth-turns-and-forks-2026-09-21.md`): one hit and pushed back out; a wall kill is
 * not the player's; nothing reaches through stone — not a shot, not lightning, not a blast.
 *
 * ⚠️ **ON A CORRIDOR NARROWER THAN THE LABYRINTH'S**, and that is the whole reason for the fixture.
 * 0348's corridor stands exactly on the ship's clamp, so the ship can never touch it; these rules are
 * about the corridor 4b's next step makes, and they are held on one that already leaves room.
 */

import { describe, expect, it } from 'vitest';

import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import type { LevelRow } from '../src/content/levels.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPECIALS } from '../src/content/specials.ts';
import { reset } from '../src/sim/entity.ts';
import { DEFAULT_ASSISTS, tuningFor } from '../src/sim/assist.ts';
import { faceAt, stoneAt } from '../src/sim/corridor.ts';
import { nearestFrom } from '../src/sim/collide.ts';
import { GameFrame, type World } from '../src/app/frame.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** A level with nothing in it but a corridor whose faces stand at 20 and 80. */
const WALLED: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 3000,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'sentinel',
  theme: 'approach',
  corridor: { centre: 50, width: 60, wall: 'roomWall', passages: [] },
};

function walled(): { world: World; frame: GameFrame; stick: { along: number; across: number } } {
  const built = playableWorld(WALLED);
  return { world: built.world, frame: new GameFrame(built.world), stick: built.stick };
}

describe('0349 — the stone bites', () => {
  it('THE SHIP, IN LANE UNITS: flying into a wall costs exactly one hit and leaves the ship outside the stone', () => {
    /*
      Shielded, so the hit is survived and can be counted; out of its spawn window, so the first
      touch is the one that costs. Held against the wall for the whole blink that follows: the one
      hit, and nothing more until the window closes — pressing on is not a second wall.
    */
    const { world, frame, stick } = walled();
    world.ship.health = 3;
    world.ship.invulnFor = 0;
    const face = faceAt(world.corridor!, world.ship.along, -1);
    stick.across = -1;
    let deepest = Infinity;
    let firstHit = -1;
    let afterFirst = 0;
    for (let step = 0; step < 120; step++) {
      const before = world.ship.health;
      frame.step();
      deepest = Math.min(deepest, world.ship.across - world.ship.radius * world.tuning.hurtbox);
      if (world.ship.health < before) {
        if (firstHit < 0) {
          firstHit = step;
          expect(before - world.ship.health, 'the first touch of stone cost other than one hit').toBe(1);
        } else if (step - firstHit < 45) afterFirst += before - world.ship.health;
      }
    }
    expect(firstHit, 'two seconds flying at a wall never touched it').toBeGreaterThanOrEqual(0);
    expect(afterFirst, 'pressing on through the blink cost more').toBe(0);
    expect(deepest, `the ship's hull went ${(face - deepest).toFixed(2)} lane units into the stone`).toBeGreaterThanOrEqual(face - 1e-9);
  });

  it('and at the `solid` assist the wall pushes and costs nothing — 0024', () => {
    /*
      ⚠️ **COUNTED EVERY STEP, NOT READ AT THE END.** The first version compared health before and
      after, and its probe stayed green: an unshielded ship killed by the wall respawns at full health,
      so a hit is invisible to a before-and-after. Shielded, out of its spawn window, every loss counted.
    */
    const { world, frame, stick } = walled();
    world.tuning = tuningFor({ ...DEFAULT_ASSISTS, terrain: 'solid' });
    world.ship.health = 3;
    world.ship.invulnFor = 0;
    stick.across = -1;
    let lost = 0;
    let touched = false;
    for (let step = 0; step < 120; step++) {
      const before = world.ship.health;
      frame.step();
      lost += Math.max(0, before - world.ship.health);
      if (world.ship.across - world.ship.radius * world.tuning.hurtbox - faceAt(world.corridor!, world.ship.along, -1) < 0.01) touched = true;
    }
    expect(touched, 'the ship never reached the wall, so this measured nothing').toBe(true);
    expect(lost, 'a solid wall cost a hit').toBe(0);
    expect(stoneAt(world.corridor, world.ship.along, world.ship.across, world.ship.radius * world.tuning.hurtbox)).toBe(0);
  });

  it('A SHOT ENDS AT THE FACE: nothing that flies is ever past it', () => {
    const { world, frame } = walled();
    const shot = world.enemyShots.spawn()!;
    reset(shot, world.ship.along + 40, 30, SHOTS[ENEMIES.turret.shot]);
    shot.velAlong = 0;
    shot.velAcross = -1;
    const face = faceAt(world.corridor!, shot.along, -1);
    let past = 0;
    for (let step = 0; step < 40; step++) {
      frame.step();
      for (let i = 0; i < world.enemyShots.size; i++) if (world.enemyShots.at(i).across < face - 1) past++;
    }
    expect(past, 'a shot was seen more than a unit past the face').toBe(0);
    expect(world.enemyShots.size, 'the shot flew on rather than ending at the stone').toBe(0);
  });

  it('A BODY THAT MEETS THE STONE IS DESTROYED, AND IT IS NOT THE PLAYER’S KILL', () => {
    const { world, frame } = walled();
    // A charger loops along the lane and never steers across — so one pushed across cannot help it.
    const body = world.enemies.spawn()!;
    // ⚠️ The kind as well as the row: `reset` defaults it to the drifter, which turns at walls (0348).
    reset(body, world.ship.along + 60, 30, { ...ENEMIES.charger, health: 999 }, ENEMY_KINDS.indexOf('charger'));
    body.velAcross = -1;
    body.fireIn = 1e9;
    let logged = 0;
    for (let step = 0; step < 40; step++) {
      frame.step();
      logged += world.deaths.count;
    }
    expect(world.enemies.size, 'a body flew into stone and survived it').toBe(0);
    expect(logged, 'a wall kill reached the kill log, so it scores and drops like a shot one').toBe(0);
  });

  it('a body that steers slides along the face rather than into it', () => {
    const { world, frame, stick } = walled();
    // The subject is the hunter: a ship that died against the wall would respawn and take it elsewhere.
    world.tuning = tuningFor({ ...DEFAULT_ASSISTS, terrain: 'solid' });
    stick.across = -1;
    const hunter = world.enemies.spawn()!;
    // Near the wall already, so leaning after a ship pressed against it would put its hull in stone.
    // Too tough to shoot down in a second, since the ship's own fire runs straight down its line.
    reset(hunter, world.ship.along + 60, 25, { ...ENEMIES.raptor, health: 9999 }, ENEMY_KINDS.indexOf('raptor'));
    hunter.fireIn = 1e9;
    // The ship goes to the wall and the hunter leans after it — a second, before the two can meet.
    let inStone = 0;
    let closest = Infinity;
    for (let step = 0; step < 60; step++) {
      frame.step();
      if (world.enemies.size === 0) break;
      const e = world.enemies.at(0);
      if (stoneAt(world.corridor, e.along, e.across, e.radius) !== 0) inStone++;
      closest = Math.min(closest, e.across - e.radius - faceAt(world.corridor!, e.along, -1));
    }
    expect(world.enemies.size, 'a hunter chasing the ship along a wall flew into it').toBe(1);
    expect(inStone, 'the hunter was in stone').toBe(0);
    expect(closest, 'the hunter never followed the ship to the wall, so this measured nothing').toBeLessThan(1);
  });

  it('NOTHING REACHES THROUGH STONE: a blast spares what a wall stands between', () => {
    /*
      *Stone stops blasts* — the player's answer, against the plan. A bump of stone is raised across the
      line between a blast and a body well inside its radius; the body must come out untouched, and
      with the bump lowered again the same blast must hurt it — or the guard is measuring nothing.
    */
    /*
      ⚠️ **THE BUMP IS ONE KNOT, WELL CLEAR OF BOTH ENDS — AND THE FIRST ONE WAS NOT.** Faces are read
      in straight lines between knots, so a raised knot slopes up from the one before and down to the
      one after. The first draft put the target on that slope: the stone destroyed it before the blast
      could, its health never moved, and the guard read *spared* whether or not the blast could see —
      `npm run prove` said STILL GREEN. The bump is now knot K+2, the blast stands on K and the body on
      K+4, both on open knots, and the blast is made wide enough to reach across.
    */
    const hurt = (bump: boolean): number => {
      const { world, frame } = walled();
      const corridor = world.corridor!;
      const k = Math.round((world.ship.along + 40 - corridor.from) / corridor.extent);
      const at = corridor.from + k * corridor.extent;
      if (bump) corridor.faces[(k + 2) * 2] = 60;
      const target = world.enemies.spawn()!;
      reset(target, at + corridor.extent * 4, 30, { ...ENEMIES.turret, health: 999 });
      target.fireIn = 1e9;
      const blast = world.blasts.spawn()!;
      reset(blast, at, 30, SHOTS[SPECIALS.bomb.becomes!]);
      blast.radius = 60;
      blast.lifeFor = 30;
      frame.step();
      expect(world.enemies.size, 'the body was destroyed by the stone, so the blast was never asked').toBe(1);
      return 999 - target.health;
    };
    expect(hurt(false), 'the blast did not reach the body in open air, so this measures nothing').toBeGreaterThan(0);
    expect(hurt(true), 'the blast reached through the stone').toBe(0);
  });

  it('and lightning does not jump through it', () => {
    // The same geometry as the blast's: link on knot K, body on K+4, one raised knot between them.
    const { world } = walled();
    const corridor = world.corridor!;
    const k = Math.round((world.ship.along + 40 - corridor.from) / corridor.extent);
    const at = corridor.from + k * corridor.extent;
    const target = world.enemies.spawn()!;
    reset(target, at + corridor.extent * 4, 30, ENEMIES.turret);
    const find = (): number => nearestFrom(world.enemies, at, 30, 80, false, 1e9, world.corridor);
    expect(find(), 'the link cannot see a body in open air').toBe(0);
    corridor.faces[(k + 2) * 2] = 60;
    expect(find(), 'a link found a body on the far side of stone').toBe(-1);
  });
});
