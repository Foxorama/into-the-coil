/**
 * The jellyfish opens — `docs/decisions/0255-the-jellyfish-opens.md`.
 *
 * The Black Heart's real boss, from the brief: *"a giant space jellyfish where you can see the
 * black heart pulsating inside it, it'll have long tendrils that you have to dodge that pulse out
 * lightning blasts. lots of moon jelly adds that rain down onto the screen and player and then
 * final phase will be the jellyfish opening up and the black heart spewing forth a rain of void
 * blasts."* What is held here is that the tendrils are beams hanging from the bell, that the moon
 * jellies are bodies that fall from the top edge from three quarters of its health and cross the
 * lane, that the last phase opens — takes more and keeps throwing void — and that the moon jelly is
 * a body no level sends. The beam's own rules are `tests/quetzal.test.ts`'s; the fall's,
 * `tests/volcano.test.ts`'s.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { openBy, phaseFor } from '../src/app/boss.ts';
import { BEAM_BOLT_KIND, BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { INK_OF } from '../src/render/bake.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** The jellyfish alone, a short way in, with no mid-boss in front of it. */
const MEDUSA_ONLY: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 200,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'medusa',
  theme: 'core',
};

type Driven = { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame };

/** The jellyfish on station at `fraction` of its health, its fan held, and an immortal ship out of the way. */
function medusaAt(fraction: number): Driven {
  const { world } = playableWorld(MEDUSA_ONLY);
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
    frame.step();
  }
  expect(world.bossPool.size, 'the jellyfish never arrived').toBe(1);
  world.bossPool.at(0).health = world.bossFullHealth * fraction;
  world.enemyShots.clear();
  world.enemies.clear();
  world.bolts.clear();
  return { world, frame };
}

/** One step with the fan held and the ship immortal, out of the way at `across`. */
function stepHeld(d: Driven, across: number = ACROSS_SPAN / 2): void {
  d.world.bossPool.at(0).fireIn = 999;
  d.world.ship.health = d.world.shipRow.health;
  d.world.ship.invulnFor = 0;
  d.world.ship.across = across;
  d.frame.step();
}

/** The moon jellies on the field. */
function jellies(d: Driven): { along: number; across: number; velAcross: number; steerAcross: number }[] {
  const kind = d.world.enemyKinds.moonJelly;
  const out = [];
  for (let i = 0; i < d.world.enemies.size; i++) {
    const e = d.world.enemies.at(i);
    if (e.kind === kind) out.push({ along: e.along, across: e.across, velAcross: e.velAcross, steerAcross: e.steerAcross });
  }
  return out;
}

const row = BOSSES.medusa;
const fall = row.fall!;

describe('0255 — the jellyfish opens', () => {
  it('THE FIVE PHASES: a ring, the tendrils, a denser ring, the tendrils wider, and an opening that keeps throwing void — with moon jellies falling from three quarters, and no curtain', () => {
    expect(row.uncoil, 'the jellyfish still throws the curtain that stood in for its tendrils').toBeNull();
    const at = (f: number) => phaseFor(row, row.health * f);
    expect((at(1).attack ?? row.attack).kind).toBe('ring');
    for (const f of [0.7, 0.25]) {
      const tendrils = at(f).attack!;
      expect(tendrils.kind, `no tendrils at ${f}`).toBe('beam');
      if (tendrils.kind !== 'beam') return;
      expect(tendrils.from.length, 'fewer than five tendrils').toBeGreaterThanOrEqual(5);
      const halfExtent = SPRITE_EXTENT[SPRITE_KINDS[row.sprite]!] / 2;
      for (const from of tendrils.from) expect(Math.abs(from), 'a tendril hangs from beside the bell').toBeLessThanOrEqual(halfExtent);
      // Five tendrils, not one wearing five names: each from its own root, spread across the bell.
      expect(new Set(tendrils.from).size, 'two tendrils hang from one root').toBe(tendrils.from.length);
      expect(Math.max(...tendrils.from) - Math.min(...tendrils.from), 'the tendrils hang from one place').toBeGreaterThanOrEqual(row.radius);
      // A pulse: on and off inside half a second.
      expect((tendrils.warning + tendrils.hold) / STEPS_PER_SECOND).toBeLessThanOrEqual(0.5);
    }
    const first = at(0.7).attack!;
    const second = at(0.25).attack!;
    if (first.kind === 'beam' && second.kind === 'beam') {
      expect(second.hold, 'the second tendrils are not held longer').toBeGreaterThan(first.hold);
      expect(Math.max(...second.from.map(Math.abs)), 'the second tendrils are not wider').toBeGreaterThan(Math.max(...first.from.map(Math.abs)));
    }
    expect((at(0.45).attack ?? row.attack).kind).toBe('ring');
    // The opening: not a bared window — it takes more AND keeps throwing, and what it throws is void.
    const last = at(0.1);
    expect(last.stance.kind, 'the last phase is not the opening').toBe('open');
    expect(openBy(last), 'the opened bell takes no more than a closed one').toBeGreaterThan(1);
    expect(last.shot, 'the heart does not spew void').toBe('void');
    expect((last.attack ?? row.attack).kind).toBe('ring');
    expect(row.phases.some((p) => p.stance.kind === 'bare'), 'the jellyfish bares itself as well as opening').toBe(false);
    // The rain: bodies, the moon jelly, from three quarters.
    expect(fall.kind).toBe('body');
    if (fall.kind !== 'body') return;
    expect(fall.enemy).toBe('moonJelly');
    expect(fall.from).toBeLessThan(1);
    expect(fall.from).toBeGreaterThanOrEqual(0.5);
    expect(fall.count).toBeGreaterThanOrEqual(2);
    expect(LEVELS.eye.boss).toBe('medusa');
    expect(LEVELS.eye.theme).toBe('core');
  });

  it('THE TENDRILS, DRIVEN: one volley hangs five beams from the bell, each from its own root, and a ship under one is hurt within a second', () => {
    const d = medusaAt(0.7);
    const boss = d.world.bossPool.at(0);
    d.world.ship.across = 5;
    boss.fireIn = 1;
    d.world.ship.health = d.world.shipRow.health;
    d.frame.step();
    const hullAcross = boss.across - boss.velAcross;
    const roots: number[] = [];
    for (let i = 0; i < d.world.bolts.size; i++) {
      const b = d.world.bolts.at(i);
      if (b.kind === BEAM_BOLT_KIND) roots.push(b.across - hullAcross);
    }
    const tendrils = phaseFor(row, boss.health, d.world.bossFullHealth).attack!;
    if (tendrils.kind !== 'beam') return;
    expect(roots.sort((a, b) => a - b).map((r) => Math.round(r * 10) / 10)).toEqual([...tendrils.from].sort((a, b) => a - b));
    // Under the middle tendril, in the box: hurt within a second, which is the pulse and then some.
    const under = hullAcross + tendrils.from[Math.floor(tendrils.from.length / 2)]!;
    let hurtAt = -1;
    for (let step = 1; step <= STEPS_PER_SECOND && hurtAt < 0; step++) {
      d.world.ship.along = d.world.cameraAlong + (PLAYER_ALONG_MARGIN + PLAYER_LEAD) / 2;
      d.world.ship.velAlong = d.world.scrollPerStep;
      d.world.ship.velAcross = 0;
      const before = d.world.shipRow.health;
      stepHeld(d, under);
      if (d.world.ship.health < before || d.world.dyingIn > 0) hurtAt = step;
    }
    expect(hurtAt, 'a ship under a tendril was never touched by it').toBeGreaterThan(0);
  });

  it('THE MOON JELLIES, DRIVEN: from three quarters they fall from the top edge inside the ship’s box, sink across the lane and leave it — and not before', () => {
    if (fall.kind !== 'body') return;
    // Whole: nothing falls, however long.
    const whole = medusaAt(1);
    for (let step = 1; step <= fall.every * 3; step++) stepHeld(whole);
    expect(jellies(whole).length, 'moon jellies fell while the bell was whole').toBe(0);
    // Hurt: they fall.
    const d = medusaAt(0.7);
    let arrived = -1;
    for (let step = 1; step <= fall.every * 3 && arrived < 0; step++) {
      stepHeld(d);
      if (jellies(d).length > 0) arrived = step;
    }
    expect(arrived, 'no moon jelly fell in three belches’ worth of steps').toBeGreaterThan(0);
    const fell = jellies(d);
    expect(fell.length, 'a belch was not the fall’s count').toBe(fall.count);
    for (const j of fell) {
      expect(j.across - j.velAcross, 'a moon jelly appeared inside the lane rather than over its edge').toBeLessThanOrEqual(0);
      const inView = j.along - d.world.cameraAlong;
      expect(inView).toBeGreaterThanOrEqual(PLAYER_ALONG_MARGIN - 1);
      expect(inView).toBeLessThanOrEqual(PLAYER_LEAD + 1);
      expect(j.velAcross, 'a moon jelly is not sinking').toBeGreaterThan(0);
      expect(j.steerAcross, 'a moon jelly is not steering for the bottom edge').toBeGreaterThanOrEqual(ACROSS_SPAN);
    }
    // No more belches: these sink the whole way across and out, in the seconds their speed says.
    d.world.bossFallIn = 100000;
    const crossing = Math.ceil((ACROSS_SPAN + 2 * ENEMIES.moonJelly.radius) / ENEMIES.moonJelly.closing);
    expect(crossing / STEPS_PER_SECOND, 'a moon jelly crosses the lane too quickly to be a rain').toBeGreaterThan(4);
    let deepest = 0;
    let gone = -1;
    for (let step = 1; step <= crossing * 2 && gone < 0; step++) {
      stepHeld(d);
      for (const j of jellies(d)) if (j.across > deepest) deepest = j.across;
      if (jellies(d).length === 0) gone = step;
    }
    expect(deepest, 'the moon jellies never reached the bottom of the lane').toBeGreaterThan(ACROSS_SPAN - 1);
    expect(gone, 'a moon jelly that has left the lane is still on the field').toBeGreaterThan(crossing / 2);
  });

  it('THE MOON JELLY: a body with a bell and no gun, the slowest thing that closes, in the enemy’s ink — and no level sends it', () => {
    const jelly = ENEMIES.moonJelly;
    expect(jelly.fireEvery, 'a moon jelly shoots, and a rain that shoots is a wall').toBe(0);
    expect(jelly.health).toBe(1);
    expect(jelly.closing).toBeGreaterThan(0);
    for (const kind of ENEMY_KINDS) {
      if (ENEMIES[kind].closing > 0) expect(jelly.closing, `the moon jelly closes faster than the ${kind}`).toBeLessThanOrEqual(ENEMIES[kind].closing);
    }
    expect(INK_OF[SPRITE_KINDS[jelly.sprite]!]).toBe('enemy');
    expect(INK_OF[SPRITE_KINDS[jelly.spriteHit]!]).toBe('impact');
    expect(SPRITE_KINDS[jelly.sprite], 'the moon jelly wears another body’s silhouette').toBe('moonJelly');
    for (const level of Object.values(LEVELS)) {
      for (const wave of level.waves) expect(wave.enemy, 'a level authors the moon jelly, which is the jellyfish’s to drop').not.toBe('moonJelly');
    }
    // Nobody else drops it, either.
    for (const kind of BOSS_KINDS) {
      const f = BOSSES[kind].fall;
      if (kind !== 'medusa' && f !== null && f.kind === 'body') expect(f.enemy).not.toBe('moonJelly');
    }
  });

  it('THE OPENING, DRIVEN: at the last fifth the bell takes twice as much and still throws — a volley of void round the hull', () => {
    const d = medusaAt(0.1);
    const boss = d.world.bossPool.at(0);
    const phase = phaseFor(row, boss.health, d.world.bossFullHealth);
    expect(openBy(phase)).toBeGreaterThanOrEqual(2);
    boss.fireIn = 1;
    d.world.ship.health = d.world.shipRow.health;
    d.frame.step();
    expect(d.world.enemyShots.size, 'the opened bell threw nothing, as a bared one would').toBeGreaterThanOrEqual(phase.shots);
    for (let i = 0; i < d.world.enemyShots.size; i++) expect(d.world.enemyShots.at(i).sprite, 'the heart spewed something other than void').toBe(SHOTS.void.sprite);
  });
});
