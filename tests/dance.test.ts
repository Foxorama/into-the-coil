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
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { SPRITE_KINDS, UNSEEN } from '../src/content/sprites.ts';
import { PALETTES, DEFAULT_PALETTE } from '../src/content/palette.ts';
import { drawKind } from '../src/render/bake.ts';
import { paintScene } from '../src/render/scene.ts';
import type { Surface } from '../src/render/surface.ts';
import { ACROSS_SPAN, viewOf } from '../src/sim/camera.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_MARGIN, leadFor } from '../src/sim/flight.ts';
import { makeRng } from '../src/sim/rng.ts';
import { CUES, type CueKind } from '../src/content/cues.ts';
import { cueSeconds } from '../src/app/sound.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { initialHangar, pilotRecord, specialOpen } from '../src/state/slices/hangar.ts';
import { NO_LEVEL, NO_SECTIONS, playableWorld } from './world.ts';
import { tracingPen } from './paths.ts';

/*
  0595: MMXXVI's Water Cannon waits on its pilot as the War Dance waits on Unity, so the record these hold
  the dance against has MMXXVI open — what they ask is the dance's gate, and the cannon's is
  `tests/duck.test.ts`'s. 0666: and Venoma's Red Lightning on her, so every tier is finished as well; its gate is
  `tests/venoma.test.ts`'s.
*/
const EVERY_TIER = Object.fromEntries(DIFFICULTY_KINDS.map((tier) => [tier, true])) as typeof initialHangar.finished;
const LOCKED = { ...pilotRecord({ ...initialHangar, finished: EVERY_TIER }), bought: GOLFERS.mmxxvi.opens.bought };
const OPENED = { ...pilotRecord({ ...initialHangar, crashes: GOLFERS.unity.opens.crashes, finished: EVERY_TIER }), bought: GOLFERS.mmxxvi.opens.bought };
const DANCE_FACE = BOMB_KINDS.indexOf('warDance');
const DANCE = SPECIALS.warDance.dance!;

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
    // 0666: and Red Lightning on Venoma.
    expect(SPECIALS.redLightning.opensWith).toBe('venoma');
    for (const kind of SPECIAL_KINDS) if (kind !== 'warDance' && kind !== 'waterCannon' && kind !== 'redLightning') expect(SPECIALS[kind].opensWith, kind).toBe(null);
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
      // 0666: a hundred and twenty, and it was sixty: an eleventh face on the bomb pickup moved the seeded draws, and
      // the thirteen sixty gave never showed the dance with nothing shut — a sample too small for the claim it backs.
      pickups: Array.from({ length: 120 }, (_, i) => ({ at: 120 + i * 40, lane: 50 })),
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
      for (let step = 0; step < 8000; step++) {
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
  ── THE DANCE LOOKS AND SOUNDS LIKE ONE — `docs/decisions/0609-the-ball-takes-its-knocks.md` ─────────────────

  *"The special also needs to look way cooler and bounce around the screen more, needs a flaring aura, noise and
  impact sounds when it hits the walls."* Asked of every ship, since the special is every ship's (0594).
*/
describe('0609 — the War Dance bounces round the whole box, flares, hums, and is heard at every wall', () => {
  /** A ship's whole dance, stepped, with every cue it struck and on which step. */
  function danced(ship: ShipKind) {
    const { world, frame } = flying(ship);
    const cues: { kind: CueKind; across: number; step: number }[] = [];
    let step = 0;
    world.onCue = (kind, across) => {
      cues.push({ kind, across: across ?? Number.NaN, step });
    };
    launchSpecial(world, 'warDance');
    const across: number[] = [];
    const along: number[] = [];
    const headings = new Set<string>();
    const flares: number[] = [];
    const sparked: boolean[] = [];
    for (step = 1; step < DANCE.steps; step++) {
      const bounces = world.danceBounces;
      const debris = world.debris.size;
      frame.step();
      if (world.danceBounces > bounces) sparked.push(world.debris.size > debris);
      across.push(world.ship.across);
      along.push(world.ship.along - world.cameraAlong);
      headings.add(Math.atan2(Math.abs(world.danceAlong), Math.abs(world.danceAcross)).toFixed(3));
      let flare = -1;
      for (let i = 0; i < world.aura.size; i++) if (DANCE.flare.includes(world.aura.at(i).sprite)) flare = world.aura.at(i).sprite;
      flares.push(flare);
    }
    for (let i = 0; i < 4; i++) frame.step();
    let after = 0;
    for (let i = 0; i < world.aura.size; i++) if (DANCE.flare.includes(world.aura.at(i).sprite)) after++;
    return { world, cues, across, along, headings, flares, sparked, after };
  }

  it('meets a wall about every half second, off it at the angle it met it, and crosses the whole box', () => {
    const { world, across, along, headings } = danced('fighter');
    const seconds = DANCE.steps / STEPS_PER_SECOND;
    expect(world.danceBounces / seconds, `${world.danceBounces} walls in ${seconds} s`).toBeGreaterThanOrEqual(1.5);
    /*
      0615, where 0609 asked for three headings or more: a wall reflects it, so in a box with nothing in it the
      dance leaves every wall as steep as it met it — one heading, its signs the walls'. What turns it is a body
      (`0615 — the War Dance is a pinball`, below).
    */
    expect([...headings], 'a wall turned the dance off the angle it met it at').toEqual([DANCE.heading.toFixed(3)]);
    // As shares of the box the player flies in — the player's units (0027).
    const lane = ACROSS_SPAN - 2 * PLAYER_MARGIN;
    const box = leadFor(world.view.alongSpan) - PLAYER_ALONG_MARGIN;
    expect((Math.max(...across) - Math.min(...across)) / lane, 'it danced across less than four fifths of the lane').toBeGreaterThan(0.8);
    expect((Math.max(...along) - Math.min(...along)) / box, 'it danced along less than two thirds of its box').toBeGreaterThan(0.66);
  });

  it('every wall it meets is heard where it met it, and throws sparks there — on every ship', () => {
    for (const ship of SHIP_KINDS) {
      const { world, cues, sparked } = danced(ship);
      const bounces = cues.filter((cue) => cue.kind === 'danceBounce');
      expect(world.danceBounces, `the ${ship} met no wall`).toBeGreaterThan(0);
      expect(bounces.length, `the ${ship} met ${world.danceBounces} walls and was heard at ${bounces.length}`).toBe(world.danceBounces);
      expect(sparked.every((s) => s), `the ${ship} met a wall that threw no sparks`).toBe(true);
      for (const cue of bounces) expect(Number.isFinite(cue.across), `the ${ship}'s bounce was heard nowhere`).toBe(true);
    }
  });

  it('every dancing ship wears the flare for the whole dance, turning through its frames, and none after', () => {
    for (const ship of SHIP_KINDS) {
      const { flares, after } = danced(ship);
      expect(flares.every((f) => f >= 0), `the ${ship} danced a step without its flare`).toBe(true);
      expect(new Set(flares).size, `the ${ship}'s flare never turned`).toBe(DANCE.flare.length);
      expect(after, `the ${ship}'s flare outlived its dance`).toBe(0);
    }
  });

  it('the flare turns no faster than three times a second — 0024’s cap', () => {
    expect((DANCE.flare.length * DANCE.flareHold) / STEPS_PER_SECOND, 'a whole turn of the flare is quicker than a third of a second').toBeGreaterThanOrEqual(1 / 3);
  });

  it('it hums from the throw to the end of the dance, each strike running into the next, and not after', () => {
    const { cues } = danced('ball');
    const hums = cues.filter((cue) => cue.kind === 'danceHum').map((cue) => cue.step);
    expect(hums[0], 'the dance did not hum from its first step').toBe(1);
    // Every hundredth of a second of the dance inside a hum it struck.
    const length = cueSeconds(CUES.danceHum);
    for (let t = hums[0]! / STEPS_PER_SECOND; t < DANCE.steps / STEPS_PER_SECOND; t += 0.01) {
      expect(
        hums.some((at) => t >= at / STEPS_PER_SECOND && t <= at / STEPS_PER_SECOND + length),
        `the dance was silent ${t.toFixed(2)} s in`,
      ).toBe(true);
    }
    expect(Math.max(...hums), 'it hummed after the dance had ended').toBeLessThan(DANCE.steps);
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
