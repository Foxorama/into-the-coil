/**
 * The Mire's floor is a wall — `docs/decisions/0383-the-mire-floor-is-a-wall.md`.
 *
 * Asked for: *"the bottom ground with the acid pools sits slightly too high on the screen, there's a
 * black layer between the bottom of the acid pools and the bottom of the screen. It needs to be lower
 * so that the lower row of acid pools sits just off screen. We also need to make it a hard ground wall
 * like the labyrinth wall that causes hit damage/death to everything but the end boss."* Answered
 * before building: a rolling shore that moves with the world, and flanks from below that rise through
 * unbroken acid.
 *
 * ⚠️ **WHAT IS HELD IS THE PICTURE AND THE RULE, AND THAT THEY ARE ONE THING** — 0027, 0036. Where the
 * pools are against the screen's edge, in lane units; that the shore bites what the Labyrinth's stone
 * bites; that what rises through it is spared and nothing else is; that the painter puts the shore on
 * the model's faces, in pixels, for as long as the level runs; and that the acid is drawn over what is
 * in it and under what flies. Whether it reads as a swamp is the player's.
 */

import { describe, expect, it } from 'vitest';

import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { SHOTS } from '../src/content/shots.ts';
import { POOLS_OF } from '../src/content/pools.ts';
import { FIGHTER_HULL, MIRE_BANK_CAPS, MIRE_BED, SPRITE, SPRITE_EXTENT } from '../src/content/sprites.ts';
import { THEMES } from '../src/content/themes.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { reset } from '../src/sim/entity.ts';
import { faceAt, laneIn } from '../src/sim/corridor.ts';
import { PLAYER_MARGIN } from '../src/sim/flight.ts';
import { DIFFICULTIES } from '../src/content/difficulty.ts';
import { GameFrame, corridorFor, type World } from '../src/app/frame.ts';
import { paintScene } from '../src/render/scene.ts';
import { screenX, screenY, type Surface } from '../src/render/surface.ts';
import { BANK_OF } from '../src/render/bake.ts';
import { playableWorld } from './world.ts';
import { tracingPen } from './paths.ts';

const MIRE = LEVELS.gauntlet;

/** The Mire with nothing in it — its floor, and a ship. */
const EMPTY: LevelRow = { ...MIRE, waves: [], pickups: [] };

function mire(level: LevelRow = EMPTY): { world: World; frame: GameFrame; stick: { along: number; across: number } } {
  const built = playableWorld(level);
  return { world: built.world, frame: new GameFrame(built.world), stick: built.stick };
}

interface Blit {
  sprite: number;
  x: number;
  y: number;
  scale: number;
  turn: number;
}

class Recorder implements Surface {
  blits: Blit[] = [];
  clear(): void {}
  bolt(): void {}
  blit(sprite: number, x: number, y: number, scale: number, turn = 0): void {
    this.blits.push({ sprite, x, y, scale, turn });
  }
}

/** Every pool of the bed as it is DRAWN, in lane units: its highest point, its surface and its floor. */
function drawnPools(): { top: number; surface: number; floor: number }[] {
  const size = 1200;
  const lanes = ACROSS_SPAN / size;
  const out: { top: number; surface: number; floor: number }[] = [];
  for (let part = 0; part < MIRE_BED.length; part++) {
    const { pen, trace } = tracingPen();
    BANK_OF.mire!.bed(pen, size, part, MIRE_BED.length, '#101010', '#80a040', THEMES.mire.land!.vivid);
    for (const pass of trace.passes) {
      // A pool is a filled, closed lens; the ripples are strokes and are not.
      if (pass.alpha < 1) continue;
      for (const path of pass.subpaths) {
        if (path.length < 3) continue;
        const ys = path.map((p) => p[1]);
        out.push({ top: Math.min(...ys) * lanes, surface: path[0]![1] * lanes, floor: Math.max(...ys) * lanes });
      }
    }
  }
  return out;
}

describe('0383 — the Mire’s floor is a wall', () => {
  it('THE ASK, IN LANE UNITS: the lower row of pools is just off the screen, and no dark band is left under the upper row', () => {
    /*
      *"A black layer between the bottom of the acid pools and the bottom of the screen"* is a band of
      ground under the pools the screen still shows; *"the lower row… just off screen"* is how far down
      it goes. So, read off the baked bed: every pool either lies wholly past lane 120 — the lower row —
      or shows its surface and reaches past the edge, so that nothing but acid is under it on the screen.

      ⚠️ **AND THE ROW IS *JUST* OFF, WHICH IS ITS HIGHEST POOL AND NOT EVERY POOL.** The rows were
      authored at uneven heights and still are; what the ask moves is the row, so the highest pool in it
      is within a quarter of a ship of the edge. A floor sunk further would be a different ask.
    */
    const pools = drawnPools();
    expect(pools.length, 'the bed drew no pools, so this measured nothing').toBeGreaterThanOrEqual(POOLS_OF.mire!.spots.length);
    const lower = pools.filter((p) => p.top >= ACROSS_SPAN);
    const upper = pools.filter((p) => p.top < ACROSS_SPAN);
    expect(lower.length, 'no pool is off the screen, so there is no lower row below it').toBeGreaterThan(0);
    expect(upper.length, 'no pool is on the screen at all').toBeGreaterThan(0);
    const highest = Math.min(...lower.map((p) => p.top));
    expect(highest, `the lower row is drawn from lane ${highest.toFixed(1)} — not just off the screen but sunk below it`).toBeLessThan(ACROSS_SPAN + FIGHTER_HULL / 4);
    for (const p of upper) {
      expect(p.surface, `an upper-row pool's surface is at lane ${p.surface.toFixed(1)}, off the screen`).toBeLessThan(ACROSS_SPAN);
      expect(p.floor, `an upper-row pool ends at lane ${p.floor.toFixed(1)}, leaving ground under it on the screen — the black layer`).toBeGreaterThanOrEqual(ACROSS_SPAN);
    }
  });

  it('and the shore stands over every pool, with bank between, and never rises steeper than a cap is baked for', () => {
    const bank = MIRE.corridor!.bank!;
    const steepest = (bank.caps.length - 1) / 2;
    const highestPool = Math.min(...drawnPools().map((p) => p.top));
    for (let k = 0; k < bank.shore.length; k++) {
      const here = bank.shore[k]!;
      const next = bank.shore[(k + 1) % bank.shore.length]!;
      expect(Math.abs(next - here), `the shore rises ${next - here} across tile ${k}, and the caps go to ${steepest}`).toBeLessThanOrEqual(steepest);
      expect(Number.isInteger(here), `knot ${k} is not a whole lane`).toBe(true);
      // A lane of bank at least, so the shore's lit edge is never drawn in a pool.
      expect(here, `the shore at knot ${k} stands at lane ${here}, in the pools that start at ${highestPool.toFixed(1)}`).toBeLessThanOrEqual(highestPool - 1);
    }
    expect(bank.caps, 'the Mire lays caps the baker does not paint').toEqual(MIRE_BANK_CAPS);
  });

  it('THE SHIP, IN LANE UNITS: flying into the shore costs one hit and leaves the ship above it', () => {
    const { world, frame, stick } = mire();
    world.ship.health = 3;
    world.ship.invulnFor = 0;
    stick.across = 1;
    let firstHit = -1;
    let afterFirst = 0;
    let deepest = -Infinity;
    let face = 0;
    for (let step = 0; step < 150; step++) {
      const before = world.ship.health;
      frame.step();
      face = faceAt(world.corridor!, world.ship.along, 1);
      deepest = Math.max(deepest, world.ship.across + world.ship.radius * world.tuning.hurtbox - face);
      if (world.ship.health < before) {
        if (firstHit < 0) {
          firstHit = step;
          expect(before - world.ship.health, 'the first touch of the shore cost other than one hit').toBe(1);
        } else if (step - firstHit < 45) afterFirst += before - world.ship.health;
      }
    }
    expect(firstHit, 'two and a half seconds diving at the shore never touched it — is it below the box?').toBeGreaterThanOrEqual(0);
    expect(afterFirst, 'pressing on through the blink cost more').toBe(0);
    expect(deepest, `the ship's hull went ${deepest.toFixed(2)} lane units into the bank`).toBeLessThanOrEqual(1e-9);
  });

  it('A BODY THAT MEETS THE SHORE BURSTS, AND IT IS NOT THE PLAYER’S KILL', () => {
    const { world, frame } = mire();
    const body = world.enemies.spawn()!;
    reset(body, world.ship.along + 60, 80, { ...ENEMIES.charger, health: 999 }, ENEMY_KINDS.indexOf('charger'));
    body.velAcross = 1;
    body.fireIn = 1e9;
    let logged = 0;
    for (let step = 0; step < 60; step++) {
      frame.step();
      logged += world.deaths.count;
    }
    expect(world.enemies.size, 'a body flew into the acid and survived it').toBe(0);
    expect(world.corridor!.kills, 'the shore did not count it').toBe(1);
    expect(logged, 'a floor kill reached the kill log, so it scores and drops like a shot one').toBe(0);
  });

  it('A DRIFTER TURNS AT THE SHORE BEFORE IT IS SEEN, AS WELL AS AFTER', () => {
    /*
      0382 turns a roam that has not yet been seen at the lane's edges, a hull short of them — and the
      shore stands up to fourteen lanes inside the bottom one. Flying the real Mire, every body the shore
      took on every tier (six to twelve) was a drifter or a warden roaming down into it ahead of the
      screen, burst before anyone saw it. One is put there, heading down: it must turn, and never be in
      the bank.
    */
    const { world, frame } = mire();
    const drifter = world.enemies.spawn()!;
    const ahead = world.cameraAlong + world.view.alongSpan + 60;
    reset(drifter, ahead, faceAt(world.corridor!, ahead, 1) - 6, { ...ENEMIES.drifter, health: 999 }, ENEMY_KINDS.indexOf('drifter'));
    drifter.spin = 1;
    drifter.velAcross = ENEMIES.drifter.motion.kind === 'drift' ? ENEMIES.drifter.motion.roam : 0.3;
    drifter.fireIn = 1e9;
    let unseen = 0;
    for (let step = 0; step < 90; step++) {
      frame.step();
      if (world.enemies.size === 0) break;
      const e = world.enemies.at(0);
      if (e.along - e.radius > world.cameraAlong + world.view.alongSpan) unseen++;
    }
    // The claim before the check that it measured anything: a burst ends the loop early, and would
    // otherwise be reported as a drifter seen too soon.
    expect(world.enemies.size, 'a drifter roaming unseen ran into the shore and burst').toBe(1);
    expect(world.corridor!.kills, 'the shore took a drifter nobody could see').toBe(0);
    expect(unseen, 'the drifter was seen at once, so this measured the seen roam and not the unseen one').toBeGreaterThan(30);
  });

  it('THE LEVEL AS IT WAS AUTHORED: the shore bends what flies low over it, and nothing above its reach', () => {
    /*
      A wave is read into a corridor against its rest (0350's `laneIn`). The Labyrinth's rest is the
      whole box; a floor's is only the part of the lane it bends. Held as the whole box, the Mire's shore
      moved every wave in the lower half up a few lanes, and its mid-boss fight measured 25.5 s against
      the 22 its level asks for — the level no longer the one that was authored. So: every lane from the
      top of the box to 90 is put down where it was written, wherever the shore stands; and a lane low
      over the shore is bent, never into it.
    */
    const corridor = corridorFor(MIRE, 0, DIFFICULTIES.savior)!;
    const radius = 4;
    let bent = 0;
    for (let along = 0; along < 480; along += 3) {
      for (let lane = PLAYER_MARGIN + radius; lane <= 90; lane += 1) {
        expect(laneIn(corridor, along, lane, radius), `a wave authored at lane ${lane} was moved at along ${along}`).toBe(lane);
      }
      const low = laneIn(corridor, along, ACROSS_SPAN - PLAYER_MARGIN - radius, radius);
      expect(low + radius, `a wave authored at the box's floor was put down in the shore at along ${along}`).toBeLessThanOrEqual(faceAt(corridor, along, 1) + 1e-9);
      if (low < ACROSS_SPAN - PLAYER_MARGIN - radius - 0.5) bent++;
    }
    expect(bent, 'the shore never bent a wave flying low over it, so it is not holding the floor up at all').toBeGreaterThan(0);
  });

  it('and a shot ends at the shore', () => {
    const { world, frame } = mire();
    const shot = world.enemyShots.spawn()!;
    reset(shot, world.ship.along + 40, 90, SHOTS[ENEMIES.turret.shot]);
    shot.velAlong = 0;
    shot.velAcross = 1;
    let past = 0;
    for (let step = 0; step < 40; step++) {
      frame.step();
      for (let i = 0; i < world.enemyShots.size; i++) {
        const s = world.enemyShots.at(i);
        if (s.across > faceAt(world.corridor!, s.along, 1) + 1) past++;
      }
    }
    expect(past, 'a shot was seen more than a unit into the bank').toBe(0);
    expect(world.enemyShots.size, 'the shot flew on through the acid').toBe(0);
  });

  it('THE PLAYER’S ANSWER: a flank from below rises through unbroken acid — every member arrives, and no opening is cut', () => {
    /*
      *"Rise through unbroken acid."* A wave from the bottom edge crosses the whole bank on its way in.
      Every member must come out of it alive — the stone spares what is rising — and the wall must be
      whole where it came: an opening would be a stretch of shore the ship could dive into for free.
    */
    const level: LevelRow = { ...EMPTY, waves: [{ at: 320, enemy: 'charger', formation: 'line', count: 5, lane: 60, origin: 'acrossPlus' }] };
    const { world, frame } = mire(level);
    let most = 0;
    for (let step = 0; step < 60 * 12; step++) {
      world.ship.health = world.shipRow.health;
      frame.step();
      most = Math.max(most, world.enemies.size);
    }
    expect(most, 'the flank never came in, so this measured nothing').toBe(5);
    expect(world.corridor!.kills, 'the acid took members of a flank rising through it').toBe(0);
    const passages = world.corridor!.passages;
    let cut = 0;
    for (let i = 0; i + 2 < passages.length; i += 3) if (passages[i + 1]! > passages[i]! && passages[i + 2] === 1) cut++;
    expect(cut, 'an opening was cut in the shore for the flank — acid the ship could dive into').toBe(0);
  });

  it('THE PAINTER PUTS THE SHORE WHERE THE MODEL SAYS, IN PIXELS, for as long as the level runs', () => {
    /*
      Every cap's face, at both ends of its tile, where `faceAt` says the shore is — across the opening,
      through the fight and far past it, because the fight has no room and the camera does not stop.
      And every column of the view has a cap over it: the floor never ends on the screen.
    */
    const { world } = mire();
    const view = world.view;
    const corridor = world.corridor!;
    const caps = corridor.caps;
    const steepest = (caps.length - 1) / 2;
    const half = (SPRITE_EXTENT.mireBank * view.scale) / 2;
    for (const camera of [0, 777, MIRE.bossAt, MIRE.bossAt + 5000, MIRE.bossAt + 60_000]) {
      const surface = new Recorder();
      paintScene(surface, view, [], camera, 0, [], null, [], 0, null, 0, 0, corridor, POOLS_OF.mire);
      const capBlits = surface.blits.filter((b) => caps.includes(b.sprite));
      expect(capBlits.length, `nothing was painted at camera ${camera}`).toBeGreaterThan(0);
      for (const b of capBlits) {
        expect(b.turn, 'a cap was turned over: the Mire has no near wall').toBe(0);
        const rise = caps.indexOf(b.sprite) - steepest;
        for (const edge of [-1, 1]) {
          const x = b.x + edge * half;
          const drawn = b.y + (edge * rise * view.scale) / 2;
          const along = camera + (x - screenX(view, 0, 0)) / view.scale;
          const model = screenY(view, 0, faceAt(corridor, along, 1));
          expect(Math.abs(drawn - model), `camera ${camera}: a cap's face is ${(drawn - model).toFixed(2)}px off the shore at along ${along.toFixed(1)}`).toBeLessThan(0.01);
        }
      }
      // Covered: the caps' tiles, laid side by side, reach both edges of the view.
      const lefts = capBlits.map((b) => b.x - half).sort((a, c) => a - c);
      expect(lefts[0]!, `camera ${camera}: the floor starts on the screen`).toBeLessThanOrEqual(screenX(view, 0, 0) + 0.01);
      expect(lefts[lefts.length - 1]! + half * 2, `camera ${camera}: the floor ends on the screen`).toBeGreaterThanOrEqual(screenX(view, view.alongSpan, 0) - 0.01);
      for (let i = 1; i < lefts.length; i++) expect(lefts[i]! - lefts[i - 1]!, `camera ${camera}: a gap in the floor`).toBeLessThan(half * 2 + 0.01);
    }
  });

  it('THE ACID IS OVER WHAT IS IN IT AND UNDER WHAT FLIES: drawn after the bodies, before the shots and the ship', () => {
    /*
      A flanker rising out of the acid is under its surface, and so will be the end boss's lower body;
      and this repository's one absolute about draw order is that nothing is lost behind scenery. So
      the frame's own draw is recorded: every body before the first stroke of the bank, and every shot
      and the ship after the last of it.
    */
    const { world, frame } = mire();
    frame.step();
    const body = world.enemies.spawn()!;
    reset(body, world.ship.along + 60, 60, { ...ENEMIES.charger, health: 999 }, ENEMY_KINDS.indexOf('charger'));
    const shot = world.enemyShots.spawn()!;
    reset(shot, world.ship.along + 40, 60, SHOTS[ENEMIES.turret.shot]);
    const surface = new Recorder();
    (world as { surface: Surface }).surface = surface;
    frame.draw(0);
    const order = surface.blits.map((b) => b.sprite);
    const bank = new Set<number>([...world.corridor!.caps, ...world.corridor!.beds, SPRITE.mireBank]);
    const firstBank = order.findIndex((s) => bank.has(s));
    let lastBank = -1;
    order.forEach((s, i) => {
      if (bank.has(s)) lastBank = i;
    });
    expect(firstBank, 'the bank was not drawn').toBeGreaterThanOrEqual(0);
    expect(order.indexOf(body.sprite), 'a body was drawn over the acid it is in').toBeLessThan(firstBank);
    expect(order.lastIndexOf(shot.sprite), 'a shot was drawn under the acid').toBeGreaterThan(lastBank);
    expect(order.lastIndexOf(world.ship.sprite), 'the ship was drawn under the acid').toBeGreaterThan(lastBank);
  });
});
