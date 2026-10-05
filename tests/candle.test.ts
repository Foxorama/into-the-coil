import { describe, expect, it } from 'vitest';

import { FIREWORK_KIND, GameFrame, RIFT_KIND, THROW_GAP_STEPS, canThrow, launchSpecial, respawn, type World } from '../src/app/frame.ts';
import { CAPACITY } from '../src/app/mount.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPECIALS, SPECIAL_KINDS } from '../src/content/specials.ts';
import { BOMB_KINDS } from '../src/content/pickups.ts';
import { ACROSS_SPAN, MIN_ASPECT, viewOf } from '../src/sim/camera.ts';
import { reset, type Entity } from '../src/sim/entity.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/**
 * THE ROMAN CANDLE — `docs/decisions/0537-the-candle-is-lit.md`.
 *
 * *"The special for the new weapon will be a roman candle of fireworks blasting out and filling a good
 * chunk of the screen with fireworks."* Every number is read off the row, so a candle tuned to more
 * stars or a wider fan moves the guards with it.
 */

const NEVER = Number.MAX_SAFE_INTEGER;
const CANDLE = SPECIALS.candle.candle!;
const STAR = SHOTS[CANDLE.star];
const BURST = SHOTS[CANDLE.burst];
const CANDLE_INDEX = SPECIAL_KINDS.indexOf('candle');

function quiet(): { world: World; frame: GameFrame; cues: string[] } {
  const { world, cues } = playableWorld(NO_LEVEL);
  world.fireIn = NEVER;
  world.missileIn = NEVER;
  // In the middle of the lane, so no star of the fan reaches its side before its fuse is out.
  world.ship.across = ACROSS_SPAN / 2;
  world.ship.prevAcross = world.ship.across;
  return { world, frame: new GameFrame(world), cues };
}

function step(world: World, frame: GameFrame): void {
  world.ship.invulnFor = 2;
  frame.step();
}

function stars(world: World): Entity[] {
  const out: Entity[] = [];
  for (let i = 0; i < world.bombs.size; i++) if (world.bombs.at(i).kind === CANDLE_INDEX) out.push(world.bombs.at(i));
  return out;
}

function fireworks(world: World): Entity[] {
  const out: Entity[] = [];
  for (let i = 0; i < world.blasts.size; i++) if (world.blasts.at(i).kind === FIREWORK_KIND) out.push(world.blasts.at(i));
  return out;
}

/** Light the candle and step until every star has burst and every firework has gone; what was seen. */
function burn(
  world: World,
  frame: GameFrame,
): { launched: Entity[]; burst: { along: number; across: number; offset: number; face: number }[]; mostStars: number; mostFireworks: number; mostBlasts: number } {
  const launched: Entity[] = [];
  const burst: { along: number; across: number; offset: number; face: number }[] = [];
  const seenStars = new Set<number>();
  const seenFireworks = new Set<string>();
  let mostStars = 0;
  let mostFireworks = 0;
  let mostBlasts = 0;
  launchSpecial(world, 'candle');
  for (let i = 0; i < 600 && (world.candleKind !== null || stars(world).length > 0 || fireworks(world).length > 0 || i < 2); i++) {
    for (const s of stars(world)) {
      const id = Math.round(s.velAcross * 1e6);
      if (!seenStars.has(id)) {
        seenStars.add(id);
        launched.push({ ...s });
      }
    }
    for (const f of fireworks(world)) {
      const id = `${f.along.toFixed(3)}:${f.across.toFixed(3)}`;
      if (!seenFireworks.has(id)) {
        seenFireworks.add(id);
        burst.push({ along: f.along, across: f.across, offset: f.along - world.cameraAlong, face: f.face });
      }
    }
    mostStars = Math.max(mostStars, stars(world).length);
    mostFireworks = Math.max(mostFireworks, fireworks(world).length);
    mostBlasts = Math.max(mostBlasts, world.blasts.size);
    step(world, frame);
  }
  return { launched, burst, mostStars, mostFireworks, mostBlasts };
}

describe('0537 — the roman candle', () => {
  it('is a gun special, so the bomb pickup offers it to every ship', () => {
    expect(SPECIALS.candle.side).toBe('gun');
    expect(BOMB_KINDS).toContain('candle');
  });

  it('fires every star, the first on the press and the rest a grid slot apart', () => {
    const { world, frame } = quiet();
    launchSpecial(world, 'candle');
    expect(stars(world).length, 'the press threw no star').toBe(1);
    const leftAt: number[] = [world.steps];
    let known = 1;
    for (let i = 0; i < CANDLE.stars * CANDLE.every * 2 && world.candleKind !== null; i++) {
      step(world, frame);
      if (world.candleFired > known) {
        known = world.candleFired;
        leftAt.push(world.steps);
      }
    }
    expect(world.candleFired).toBe(CANDLE.stars);
    // After the first, every star leaves on the beat's grid and one slot after the last.
    for (let k = 2; k < leftAt.length; k++) expect(leftAt[k]! - leftAt[k - 1]!, `star ${k} left off the grid`).toBe(CANDLE.every);
    expect(leftAt[1]! - leftAt[0]!).toBeLessThanOrEqual(CANDLE.every);
  });

  it('sweeps the fan from one side of the nose to the other, each star tail-first behind it', () => {
    const { world, frame } = quiet();
    const { launched } = burn(world, frame);
    expect(launched.length).toBe(CANDLE.stars);
    const across = launched.map((s) => s.velAcross);
    expect(across[0]!, 'the first star does not leave on one side').toBeLessThan(0);
    expect(across[across.length - 1]!, 'the last star does not leave on the other').toBeGreaterThan(0);
    for (let k = 1; k < across.length; k++) expect(across[k]!, 'the fan does not sweep in one direction').toBeGreaterThan(across[k - 1]!);
    // Turned along its flight in the camera's frame, which is the one its tail is seen trailing in.
    for (const s of launched) expect(s.turn, 'a star is not turned along its flight').toBeCloseTo(Math.atan2(s.velAcross, s.velAlong - world.scrollPerStep), 6);
    for (const s of launched) expect(Math.hypot(s.velAcross, s.velAlong - world.scrollPerStep)).toBeCloseTo(STAR.speed, 6);
  });

  it('every star bursts, in turn through the three colours, inside the view', () => {
    const { world, frame } = quiet();
    const { burst } = burn(world, frame);
    expect(burst.length, 'a star went off as nothing').toBe(CANDLE.stars);
    const faces = new Set(burst.map((b) => b.face));
    expect(faces.size, 'the fireworks are not in three colours').toBe(3);
    for (const b of burst) {
      expect(b.across).toBeGreaterThanOrEqual(0);
      expect(b.across).toBeLessThanOrEqual(ACROSS_SPAN);
      expect(b.offset).toBeLessThanOrEqual(world.view.alongSpan);
    }
  });

  it('THE ASK, IN THE PLAYER’S UNITS: the fireworks cover a good chunk of the screen ahead of the ship', () => {
    /*
      *"Filling a good chunk of the screen."* Read as at least a quarter of the screen ahead of the ship,
      on the narrowest view any device has — the fireworks counted where they stood, against the lane's
      width and the view's length ahead of the ship, on a grid one unit square.
    */
    const { world, frame } = quiet();
    const narrow = viewOf(MIN_ASPECT * 1000, 1000);
    const shipOffset = world.ship.along - world.cameraAlong;
    const { burst } = burn(world, frame);
    let ahead = 0;
    let covered = 0;
    for (let a = Math.ceil(shipOffset); a < narrow.alongSpan; a++) {
      for (let c = 0; c < ACROSS_SPAN; c++) {
        ahead++;
        if (burst.some((b) => Math.hypot(b.offset - a, b.across - c) <= BURST.radius)) covered++;
      }
    }
    expect(covered / ahead, `the candle lights ${((covered / ahead) * 100).toFixed(0)}% of the screen ahead`).toBeGreaterThanOrEqual(0.25);
  });

  it('a firework lands its damage on what is inside it', () => {
    const { world, frame } = quiet();
    // Where the first star will burst: straight along its flight for its reach.
    const angle = -CANDLE.fan;
    const reach = CANDLE.reaches[0]!;
    const body = world.enemies.spawn()!;
    reset(body, world.ship.along + reach * Math.cos(angle) + 6, world.ship.across + reach * Math.sin(angle), { ...ENEMIES.turret, health: 999 }, world.enemyKinds.turret);
    body.fireIn = NEVER;
    body.velAlong = world.scrollPerStep;
    launchSpecial(world, 'candle');
    for (let i = 0; i < 60 && body.health === 999; i++) step(world, frame);
    expect(body.health, 'the firework landed nothing on the body inside it').toBeLessThan(999);
  });

  it('holds the throw gap for as long as it fires, so nothing else is thrown under it', () => {
    const { world, frame } = quiet();
    launchSpecial(world, 'candle');
    expect(canThrow(world, 'candle'), 'a second candle may be lit under the first').toBe(false);
    for (let i = 0; i < 200 && world.candleKind !== null; i++) {
      expect(canThrow(world, 'bomb'), 'a bomb may be thrown while the candle fires').toBe(false);
      step(world, frame);
    }
    for (let i = 0; i < THROW_GAP_STEPS; i++) step(world, frame);
    expect(canThrow(world, 'bomb'), 'the gap never opened again after the candle').toBe(true);
  });

  it('goes out with the ship that held it', () => {
    const { world, frame } = quiet();
    launchSpecial(world, 'candle');
    step(world, frame);
    respawn(world);
    expect(world.candleKind).toBeNull();
    expect(stars(world).length).toBe(0);
    for (let i = 0; i < 200; i++) step(world, frame);
    expect(fireworks(world).length, 'a candle kept firing for a ship that was gone').toBe(0);
  });

  it('a star fanned off the edge of the lane goes off at the edge, not past it and not nowhere', () => {
    // From either edge, so the stars that leave outward are the first of the fan and then the last.
    for (const edge of [2, ACROSS_SPAN - 2]) {
      const { world, frame } = quiet();
      world.ship.across = edge;
      world.ship.prevAcross = edge;
      const { burst } = burn(world, frame);
      expect(burst.length, 'a star left the lane with its fuse unspent').toBe(CANDLE.stars);
      for (const b of burst) {
        expect(b.across, 'a star went off past the edge of the lane').toBeGreaterThanOrEqual(0);
        expect(b.across, 'a star went off past the edge of the lane').toBeLessThanOrEqual(ACROSS_SPAN);
      }
    }
  });

  it('fits the pools: three stars aloft at most, four fireworks open, and room beside a void salvo', () => {
    const { world, frame } = quiet();
    const { mostStars, mostFireworks } = burn(world, frame);
    expect(mostStars, 'more stars aloft than leave a bomb its slot').toBeLessThanOrEqual(CAPACITY.bombs - 1);
    expect(mostFireworks).toBeLessThanOrEqual(4);
    // The salvo `tests/void.test.ts` throws, then the candle the moment the gap opens.
    const salvo = quiet();
    const rift = SPECIALS.voidMissile.rift!;
    const throws = Math.ceil(rift.steps / THROW_GAP_STEPS);
    for (let t = 0; t < throws; t++) {
      launchSpecial(salvo.world, 'voidMissile');
      for (let i = 0; i < THROW_GAP_STEPS; i++) step(salvo.world, salvo.frame);
    }
    let rifts = 0;
    for (let i = 0; i < salvo.world.blasts.size; i++) if (salvo.world.blasts.at(i).kind === RIFT_KIND) rifts++;
    const { burst, mostBlasts } = burn(salvo.world, salvo.frame);
    expect(burst.length, `a firework found the blast pool full beside the ${rifts} rifts open when the candle was lit`).toBe(CANDLE.stars);
    // Nine was the pool before 0537: the salvo and the candle together have to ask more than it held,
    // or this case asks nothing of the four it added — and still leave the pyre its slot.
    expect(mostBlasts, 'the salvo and the candle never needed more than the old pool').toBeGreaterThan(9);
    expect(mostBlasts, 'the salvo and the candle left no room for the pyre').toBeLessThan(CAPACITY.blasts);
  });
});
