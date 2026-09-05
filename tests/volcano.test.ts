/**
 * The volcanoes belch — `docs/decisions/0251-the-volcanoes-belch.md`.
 *
 * The Saurian Belt's real boss, from the brief's afterthought: *"volcanoes in the background that
 * belch big chunks of volcanic rock that rain down and the player has to dodge as well as all the
 * other boss stuff."* What is held here is that a fall is a volley from the sky that runs beside
 * every phase, that the rock is the biggest and slowest hostile bullet and hurts as one, that it
 * comes in over the top edge inside the box the ship can fly in and retires below the lane, and
 * that the picture mentions the edge it came over. The lasers are `tests/quetzal.test.ts`'s.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { BURST } from '../src/content/debris.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SHOTS, SHOT_KINDS, type ShotKind } from '../src/content/shots.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { INK_OF } from '../src/render/bake.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** The quetzal alone, a short way in, with no mid-boss in front of it. */
const QUETZAL_ONLY: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 200,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'quetzal',
  theme: 'saurian',
};

type Driven = ReturnType<typeof playableWorld> & { frame: GameFrame };

/** The quetzal on station at `fraction` of its health, its fan and its lasers held, and an immortal ship. */
function quetzalAt(fraction: number): Driven {
  const played = playableWorld(QUETZAL_ONLY);
  const { world } = played;
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
    frame.step();
  }
  expect(world.bossPool.size, 'the quetzal never arrived').toBe(1);
  world.bossPool.at(0).health = world.bossFullHealth * fraction;
  world.enemyShots.clear();
  world.bolts.clear();
  return { ...played, frame };
}

/** The rocks in the air. */
function rocks(d: Driven): { along: number; across: number; velAlong: number; velAcross: number; lifeFor: number }[] {
  const out = [];
  for (let i = 0; i < d.world.enemyShots.size; i++) {
    const s = d.world.enemyShots.at(i);
    if (s.sprite === SHOTS.rock.sprite) out.push({ along: s.along, across: s.across, velAlong: s.velAlong, velAcross: s.velAcross, lifeFor: s.lifeFor });
  }
  return out;
}

/** One step with the fan held, the ship immortal and out of the way at `across`. */
function stepHeld(d: Driven, across: number = ACROSS_SPAN / 2): void {
  d.world.bossPool.at(0).fireIn = 999;
  d.world.ship.health = d.world.shipRow.health;
  d.world.ship.invulnFor = 0;
  d.world.ship.across = across;
  d.frame.step();
}

const fall = BOSSES.quetzal.fall!;

describe('0251 — the volcanoes belch', () => {
  it('THE ROCK: the biggest and slowest hostile bullet, hot, hitting for two — and the belt’s boss is the one thing that sends it', () => {
    const hostile = SHOT_KINDS.filter((k) => ['enemy', 'acid', 'void', 'fire'].includes(INK_OF[SPRITE_KINDS[SHOTS[k].sprite]!]));
    const drawn = (k: ShotKind): number => SPRITE_EXTENT[SPRITE_KINDS[SHOTS[k].sprite]!];
    for (const k of hostile.filter((k) => k !== 'rock')) {
      expect(drawn('rock'), `the rock is drawn no bigger than the ${k}`).toBeGreaterThan(drawn(k));
      expect(SHOTS.rock.speed, `the rock falls no slower than the ${k} flies`).toBeLessThan(SHOTS[k].speed);
    }
    expect(INK_OF[SPRITE_KINDS[SHOTS.rock.sprite]!], 'the rock is not drawn hot').toBe('fire');
    expect(SHOTS.rock.damage, 'a rock hits like a bullet').toBeGreaterThanOrEqual(2);
    // In the player's units: a rock is a real piece of the lane, and it takes seconds to cross it.
    expect(drawn('rock') / ACROSS_SPAN).toBeGreaterThan(0.04);
    expect(drawn('rock') / ACROSS_SPAN).toBeLessThan(0.1);
    const crossing = ACROSS_SPAN / SHOTS.rock.speed / STEPS_PER_SECOND;
    expect(crossing, `a rock crosses the lane in ${crossing.toFixed(1)} s`).toBeGreaterThan(1.5);
    expect(crossing, `a rock crosses the lane in ${crossing.toFixed(1)} s`).toBeLessThan(4);
    // The fall is the quetzal's, and it is the rock.
    expect(fall, 'the quetzal has no fall').not.toBeNull();
    expect(fall.shot).toBe('rock');
    expect(fall.count).toBeGreaterThanOrEqual(1);
    expect(BOSS_KINDS.filter((k) => BOSSES[k].fall !== null), 'another boss fell in under the volcanoes').toEqual(['quetzal']);
    expect(LEVELS.coilward.boss).toBe('quetzal');
    expect(LEVELS.coilward.landmarks.length, 'the belt has no volcanoes to belch').toBeGreaterThan(0);
  });

  it('THE BELCH, DRIVEN: rocks come in over the top edge inside the ship’s box, fall straight down the lane, and keep coming in every phase', () => {
    /*
      *"As well as all the other boss stuff"*: the fall is read beside the phase and not from it, so
      the same belch arrives whole, at the wings and at the mouth, with the fan held throughout.
    */
    for (const fraction of [1, 0.6, 0.3]) {
      const d = quetzalAt(fraction);
      const patience = fall.every * 3;
      let arrived = -1;
      for (let step = 1; step <= patience && arrived < 0; step++) {
        stepHeld(d);
        if (rocks(d).length > 0) arrived = step;
      }
      expect(arrived, `no rock fell at ${fraction} of the quetzal’s health in ${patience} steps`).toBeGreaterThan(0);
      const fell = rocks(d);
      expect(fell.length, `a belch at ${fraction} was ${fell.length} rock(s)`).toBe(fall.count);
      for (const r of fell) {
        // Over the top edge: its centre at or above the lane's edge on the step it appears.
        expect(r.across - r.velAcross, 'a rock appeared inside the lane rather than over its edge').toBeLessThanOrEqual(0);
        const inView = r.along - d.world.cameraAlong;
        expect(inView, `a rock fell ${inView.toFixed(1)} into the view, behind the ship’s box`).toBeGreaterThanOrEqual(PLAYER_ALONG_MARGIN - 1);
        expect(inView, `a rock fell ${inView.toFixed(1)} into the view, past the ship’s box`).toBeLessThanOrEqual(PLAYER_LEAD + 1);
        // Straight down the lane, riding the camera: it falls across and holds its along on the screen.
        expect(r.velAcross, 'a rock is not falling').toBeGreaterThan(0);
        expect(r.velAlong, 'a rock drifts along the lane rather than falling straight').toBeCloseTo(d.world.scrollPerStep, 6);
      }
      // And again: a fall is a rain, not a volley.
      let again = false;
      for (let step = 1; step <= patience && !again; step++) {
        const before = rocks(d).length;
        stepHeld(d);
        if (rocks(d).length > before) again = true;
      }
      expect(again, `the belch at ${fraction} came once and never again`).toBe(true);
    }
  });

  it('and the first rock waits the fall’s own gap after the boss arrives, so the arrival is the boss’s', () => {
    const { world } = playableWorld(QUETZAL_ONLY);
    const frame = new GameFrame(world);
    let arrivedAt = -1;
    for (let i = 0; i < 900 && arrivedAt < 0; i++) {
      world.ship.health = world.shipRow.health;
      frame.step();
      if (world.bossPool.size > 0) arrivedAt = i;
    }
    // On the first step, as it happens: the level is 200 units long and the horizon already covers it.
    expect(arrivedAt, 'the quetzal never arrived').toBeGreaterThanOrEqual(0);
    let firstRock = -1;
    for (let step = 0; step < fall.every * 3 && firstRock < 0; step++) {
      world.ship.health = world.shipRow.health;
      world.bossPool.at(0).fireIn = 999;
      let any = false;
      for (let i = 0; i < world.enemyShots.size; i++) if (world.enemyShots.at(i).sprite === SHOTS.rock.sprite) any = true;
      if (any) firstRock = step;
      frame.step();
    }
    expect(firstRock, 'no rock fell after the boss arrived').toBeGreaterThanOrEqual(0);
    expect(firstRock / STEPS_PER_SECOND, 'a rock fell on the step the boss arrived').toBeGreaterThanOrEqual(0.5);
  });

  it('and a rock retires below the lane rather than riding the camera under the screen for ever', () => {
    const d = quetzalAt(1);
    for (let step = 1; step <= fall.every * 3 && rocks(d).length === 0; step++) stepHeld(d);
    expect(rocks(d).length).toBeGreaterThan(0);
    // No more belches: only these rocks, and the pool is asked whether they ever leave it.
    d.world.bossFallIn = 100000;
    const crossing = Math.ceil((ACROSS_SPAN + 2 * SHOTS.rock.radius) / SHOTS.rock.speed);
    for (let step = 1; step <= crossing + 3; step++) stepHeld(d);
    expect(rocks(d).length, 'a rock that had fallen through the lane is still in the pool').toBe(0);
  });

  it('and a rock hurts the ship it lands on, as any shot does', () => {
    const d = quetzalAt(1);
    for (let step = 1; step <= fall.every * 3 && rocks(d).length === 0; step++) stepHeld(d);
    const [rock] = rocks(d);
    expect(rock).toBeDefined();
    d.world.bossFallIn = 100000;
    const before = d.world.ship.health;
    // Where the rock is on the screen: it rides the camera, so this offset is where it will land.
    const offset = rock!.along - d.world.cameraAlong;
    let hurt = false;
    for (let step = 1; step <= 300 && !hurt; step++) {
      // Under it: the ship holds the rock's along on the screen and waits where it will land.
      d.world.ship.along = d.world.cameraAlong + offset;
      d.world.ship.velAlong = d.world.scrollPerStep;
      d.world.ship.across = ACROSS_SPAN / 2;
      d.world.ship.velAcross = 0;
      d.world.ship.invulnFor = 0;
      d.world.ship.health = before;
      d.world.bossPool.at(0).fireIn = 999;
      d.frame.step();
      if (d.world.ship.health < before || d.world.dyingIn > 0) hurt = true;
    }
    expect(hurt, 'a rock fell through the ship and did nothing').toBe(true);
  });

  it('THE PICTURE: every rock comes in on a burst of embers at the edge, and the belch sounds as the enemies’ fire does', () => {
    /*
      0036: the model puts a rock at the top edge and the picture must say so — embers where it came
      over, in the debris the ship already reads as *something happened here*, and the enemies' own
      cue rather than the boss's, because the rock is the sky's and not the hull's.
    */
    const d = quetzalAt(1);
    let belched = false;
    for (let step = 1; step <= fall.every * 3 && !belched; step++) {
      const debrisBefore = d.world.debris.size;
      const cuesBefore = d.cues.length;
      stepHeld(d);
      if (rocks(d).length === 0) continue;
      belched = true;
      expect(d.world.debris.size - debrisBefore, 'the belch threw no embers').toBeGreaterThanOrEqual(BURST.belch * fall.count);
      expect(d.cues.slice(cuesBefore), 'the belch made no sound').toContain('threat');
      // The embers are at the edge, not at the hull.
      let atEdge = 0;
      for (let i = debrisBefore; i < d.world.debris.size; i++) if (d.world.debris.at(i).across <= 2) atEdge++;
      expect(atEdge, 'the embers are not at the edge the rock came over').toBeGreaterThanOrEqual(BURST.belch * fall.count);
    }
    expect(belched, 'no belch to draw').toBe(true);
  });
});
