/**
 * Every ship dances — `docs/decisions/0594-every-ship-dances.md`, the second half of item 2 of
 * [`the-secret-pilots-planned`](../reports/the-secret-pilots-planned-2026-10-11.md).
 *
 * Answered while it was planned: *"other ships can pick up the special once the hamster ball is unlocked
 * tho so we'll need animations for all ships for that special"*. Two claims, then: the War Dance is offered
 * to a run only once Unity is open, and every ship that throws it dances in poses of its own.
 *
 * ⚠️ **THE POSES ARE HELD TO BE DRAWN, NOT TO BE THERE.** 0280's miss was a sprite swelled on a sine and
 * called animation. What is asserted here of a pose is that its picture is not its still one, traced — a
 * pose that drew the still ship again under a new name would pass every other line in this file.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame, RAM_KIND, SPLAT_KIND, launchSpecial, wearHull, type World } from '../src/app/frame.ts';
import { BOSSES, gunWeightOn } from '../src/content/bosses.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { reset } from '../src/sim/entity.ts';
import { GOLFERS } from '../src/content/golfers.ts';
import type { LevelRow } from '../src/content/levels.ts';
import { BOMB_KINDS, NONE_SHUT, PICKUP_KINDS, PICKUPS, drawFace, facesShut, weaponFor } from '../src/content/pickups.ts';
import { SHIPS, SHIP_KINDS, fitted, hullFor, type ShipKind } from '../src/content/ships.ts';
import { SPECIALS, SPECIAL_KINDS } from '../src/content/specials.ts';
import { SPRITE_KINDS, UNSEEN } from '../src/content/sprites.ts';
import { PALETTES, DEFAULT_PALETTE } from '../src/content/palette.ts';
import { drawKind } from '../src/render/bake.ts';
import { paintScene } from '../src/render/scene.ts';
import type { Surface } from '../src/render/surface.ts';
import { viewOf } from '../src/sim/camera.ts';
import { makeRng } from '../src/sim/rng.ts';
import { initialHangar, pilotRecord, specialOpen } from '../src/state/slices/hangar.ts';
import { NO_LEVEL, NO_SECTIONS, playableWorld } from './world.ts';
import { tracingPen } from './paths.ts';

/*
  0595: MMXXVI's Water Cannon waits on its pilot as the War Dance waits on Unity, so the record these hold
  the dance against has MMXXVI open — what they ask is the dance's gate, and the cannon's is
  `tests/duck.test.ts`'s.
*/
const LOCKED = { ...pilotRecord(initialHangar), bought: GOLFERS.mmxxvi.opens.bought };
const OPENED = { ...pilotRecord({ ...initialHangar, crashes: GOLFERS.unity.opens.crashes }), bought: GOLFERS.mmxxvi.opens.bought };
const DANCE_FACE = BOMB_KINDS.indexOf('warDance');

/** A world flying `ship`, its own gun fitted. */
function flying(ship: ShipKind, level: LevelRow = NO_LEVEL): { world: World; frame: GameFrame } {
  const built = playableWorld(level);
  built.world.shipRow = fitted(SHIPS[ship], SHIPS[ship].weapon);
  built.world.weapon = weaponFor(built.world.shipRow, []);
  built.world.missileIn = Number.MAX_SAFE_INTEGER;
  wearHull(built.world);
  return { world: built.world, frame: new GameFrame(built.world) };
}

describe('0594 — the War Dance is offered once Unity is open', () => {
  it('waits on Unity, and on nobody else', () => {
    expect(SPECIALS.warDance.opensWith).toBe('unity');
    // 0595: and the Water Cannon on MMXXVI, on the same terms; every other special on nobody.
    expect(SPECIALS.waterCannon.opensWith).toBe('mmxxvi');
    for (const kind of SPECIAL_KINDS) if (kind !== 'warDance' && kind !== 'waterCannon') expect(SPECIALS[kind].opensWith, kind).toBe(null);
    expect(DANCE_FACE, 'the War Dance is no face of the bomb pickup at all').toBeGreaterThanOrEqual(0);
  });

  it('is shut on the bomb pickup before Unity is open, and only it — and open after', () => {
    const before = facesShut('bomb', LOCKED);
    expect(before.map((shut, face) => (shut ? face : -1)).filter((face) => face >= 0)).toEqual([DANCE_FACE]);
    expect(facesShut('bomb', OPENED).some((shut) => shut), 'Unity is open and the dance is still shut').toBe(false);
    // Nothing else waits on a pilot: every other pickup's faces are open to a first-time player.
    for (const kind of PICKUP_KINDS) if (kind !== 'bomb') expect(facesShut(kind, LOCKED).some((shut) => shut), kind).toBe(false);
  });

  it('a draw never lands on a shut face, and lands on every open one', () => {
    const shut = facesShut('bomb', LOCKED);
    const rng = makeRng(594);
    const drawn = new Set<number>();
    for (let i = 0; i < 2000; i++) drawn.add(drawFace(PICKUPS.bomb, rng, shut));
    expect(drawn.has(DANCE_FACE), 'a shut face was drawn').toBe(false);
    expect(drawn.size, 'an open face was never drawn').toBe(PICKUPS.bomb.faces.length - 1);
    const open = new Set<number>();
    for (let i = 0; i < 2000; i++) open.add(drawFace(PICKUPS.bomb, rng, NONE_SHUT));
    expect(open.size).toBe(PICKUPS.bomb.faces.length);
  });

  it('a run puts no bomb pickup on the War Dance while it is shut, through the real frame', () => {
    const level: LevelRow = {
      waves: [],
      pickups: Array.from({ length: 60 }, (_, i) => ({ at: 120 + i * 40, lane: 50 })),
      landmarks: [],
      bossAt: Number.POSITIVE_INFINITY,
      midBoss: null,
      sections: NO_SECTIONS,
      boss: 'sentinel',
      theme: 'approach',
    };
    const facesOf = (shut: boolean): number[] => {
      const { world, frame } = flying('fighter', level);
      if (shut) world.pickupShut = PICKUP_KINDS.map((kind) => facesShut(kind, LOCKED));
      const bomb = world.pickupKinds.bomb;
      const faces: number[] = [];
      const seen = new Set<number>();
      for (let step = 0; step < 4000; step++) {
        frame.step();
        for (let i = 0; i < world.pickups.size; i++) {
          const item = world.pickups.at(i);
          if (item.kind !== bomb || seen.has(item.bobPhase)) continue;
          seen.add(item.bobPhase);
          faces.push(item.face);
        }
      }
      return faces;
    };
    const locked = facesOf(true);
    expect(locked.length, 'no bomb pickup came, so this measured nothing').toBeGreaterThan(5);
    expect(locked, 'a bomb pickup showed the War Dance before Unity was open').not.toContain(DANCE_FACE);
    expect(facesOf(false), 'with nothing shut the War Dance never came either, so the first claim proves nothing').toContain(DANCE_FACE);
  });

  it('in the hangar, a ship may open with it once the ball is won, as with any other ship’s special', () => {
    const won = { ...initialHangar, won: Object.fromEntries(SHIP_KINDS.map((k) => [k, true])) as typeof initialHangar.won };
    for (const ship of SHIP_KINDS) expect(specialOpen(won, ship, 'ball'), ship).toBe(true);
    const ballNot = { ...won, won: { ...won.won, ball: false } };
    for (const ship of SHIP_KINDS) if (ship !== 'ball') expect(specialOpen(ballNot, ship, 'ball'), ship).toBe(false);
  });
});

describe('0594 — every ship dances in poses of its own', () => {
  it('each pose is drawn, and is not the still ship again', () => {
    const palette = PALETTES[DEFAULT_PALETTE];
    const traced = (sprite: number): string => {
      const kind = SPRITE_KINDS[sprite]!;
      const { pen, trace } = tracingPen();
      drawKind(pen, kind, palette, 200, 'approach');
      return JSON.stringify(trace.passes.map((p) => p.subpaths));
    };
    for (const ship of SHIP_KINDS) {
      SHIPS[ship].dance.forEach((cycle, stage) => {
        const still = hullFor(SHIPS[ship], stage).base;
        expect(cycle.frames[0], `${ship} at ${stage}: the dance does not start from the ship as it stands`).toBe(still);
        const poses = [...new Set(cycle.frames.filter((frame) => frame !== still))];
        expect(poses.length, `${ship} at ${stage}: a dance of fewer than two poses`).toBeGreaterThanOrEqual(2);
        const stillPicture = traced(still);
        for (const pose of poses) {
          expect(traced(pose), `${ship} at ${stage}: ${SPRITE_KINDS[pose]} is the still ship drawn again`).not.toBe(stillPicture);
        }
        expect(traced(poses[0]!), `${ship} at ${stage}: its two poses are one picture`).not.toBe(traced(poses[1]!));
      });
    }
  });

  it('a ship that throws the War Dance cycles through its poses, and stands still again after', () => {
    for (const ship of SHIP_KINDS) {
      const { world, frame } = flying(ship);
      launchSpecial(world, 'warDance');
      const cycle = SHIPS[ship].dance[0];
      const shown = new Set<number>();
      for (let i = 0; i < SPECIALS.warDance.dance!.steps - 1; i++) {
        frame.step();
        shown.add(world.ship.sprite);
      }
      for (const pose of cycle.frames) expect(shown.has(pose), `${ship} never showed ${SPRITE_KINDS[pose]}`).toBe(true);
      for (let i = 0; i < 4; i++) frame.step();
      expect(world.danceFor).toBe(0);
      expect(world.ship.frames.length, `${ship} is still cycling after its dance`).toBe(0);
      expect(world.ship.sprite, `${ship} did not stand still again`).toBe(hullFor(SHIPS[ship], 0).base);
    }
  });

  it('dances at the stage its tubes say, and a tube taken mid-dance dances on with it', () => {
    const { world, frame } = flying('fighter');
    launchSpecial(world, 'warDance');
    frame.step();
    world.weapon = weaponFor(world.shipRow, ['straight']);
    wearHull(world);
    expect(world.ship.frames).toBe(SHIPS.fighter.dance[1].frames);
  });

  it('the ram rides every dancing ship unseen, and the ball shows its heat under it as ever', () => {
    for (const ship of SHIP_KINDS) {
      const { world, frame } = flying(ship);
      launchSpecial(world, 'warDance');
      frame.step();
      let ram = null;
      for (let i = 0; i < world.playerShots.size; i++) if (world.playerShots.at(i).kind === RAM_KIND) ram = world.playerShots.at(i);
      expect(ram, `${ship} dances with no ram`).not.toBe(null);
      if (ship === 'ball') expect(ram!.sprite, 'the ball dances with its heat unseen').not.toBe(UNSEEN);
      else expect(ram!.sprite, `the ${ship} dances with the ball's heat drawn under it`).toBe(UNSEEN);
    }
  });

  it('and the painter passes over what has no picture, rather than blitting nothing at a canvas', () => {
    const { world, frame } = flying('fighter');
    launchSpecial(world, 'warDance');
    frame.step();
    const blitted: number[] = [];
    const surface: Surface = {
      clear(): void {},
      bolt(): void {},
      blit(sprite: number): void {
        blitted.push(sprite);
      },
    };
    paintScene(surface, viewOf(1280, 720), [world.playerShots, world.shipPool], world.cameraAlong, 0.5);
    expect(blitted.length, 'nothing was painted, so this measured nothing').toBeGreaterThan(0);
    expect(blitted, 'the unseen ram was blitted').not.toContain(UNSEEN);
  });
});

/*
  ── THE DANCE LANDS ON ITS OWN TERMS, AND THE GUN ON THE GUN'S — the review of 0595 ─────────────────────────

  The ram rides the gun's pool, and it was landed in the gun's pass: while any ship danced, every shot in the pool
  took the dance's log and its gap, and the dance took the gun's weight on a boss.
*/
describe('0594 — a dance leaves the ship’s own gun as it was, and weighs the same on a boss whatever the gun', () => {
  it('a dancing duck’s paintballs still splat where they land', () => {
    const { world, frame } = flying('duck');
    // A wall of bodies across the lane ahead, so wherever the dance takes the ship its balls meet one.
    for (let across = 4; across < world.view.acrossSpan - 4; across += 6) {
      const enemy = world.enemies.spawn()!;
      reset(enemy, world.ship.along + 45, across, ENEMIES.drifter);
      enemy.health = 1e6;
      enemy.fireIn = Number.MAX_SAFE_INTEGER;
      enemy.velAlong = world.scrollPerStep;
    }
    launchSpecial(world, 'warDance');
    let splats = 0;
    for (let step = 0; step < SPECIALS.warDance.dance!.steps - 10; step++) {
      frame.step();
      for (let i = 0; i < world.blasts.size; i++) if (world.blasts.at(i).kind === SPLAT_KIND) splats++;
    }
    expect(world.danceFor, 'the ship stopped dancing before the string had landed').toBeGreaterThan(0);
    expect(splats, 'a paintball landed while the ship danced and did not splat').toBeGreaterThan(0);
  });

  it('on a boss, the War Dance lands as much from every ship but the ball, whatever its gun weighs there', () => {
    const took: Record<string, number> = {};
    for (const ship of SHIP_KINDS) {
      if (ship === 'ball') continue;
      const { world, frame } = flying(ship);
      world.fireIn = Number.MAX_SAFE_INTEGER;
      const boss = world.bossPool.spawn()!;
      reset(boss, world.ship.along, world.ship.across, BOSSES.sentinel);
      boss.health = 1e6;
      world.bossFullHealth = 1e6;
      boss.fireIn = Number.MAX_SAFE_INTEGER;
      launchSpecial(world, 'warDance');
      frame.step();
      took[ship] = 1e6 - boss.health;
    }
    const weights = Object.keys(took).map((ship) => gunWeightOn(playableWorld(NO_LEVEL).world.bossRow, SHIPS[ship as ShipKind].weapon));
    expect(new Set(weights).size, 'every gun here weighs the same on this boss, so this asks nothing').toBeGreaterThan(1);
    const first = Object.values(took)[0]!;
    expect(first, 'the dance did not land on the boss it was thrown into').toBeGreaterThan(0);
    for (const [ship, hp] of Object.entries(took)) expect(hp, `${ship}'s dance landed ${hp} where the first landed ${first}`).toBeCloseTo(first, 9);
  });
});
