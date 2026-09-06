/**
 * The eagle summons — `docs/decisions/0249-the-eagle-summons.md`.
 *
 * Ember Nebula's real boss, from the brief: *"some hell-spawned demon space eagle thing that throws
 * out whips of fire and summons hordes of flying kites and raptors as adds at various points
 * throughout the fight."* What is held here is the whip — a lash of flames that bows as it flies
 * — and the summons — adds put on the field by a volley — and the kite, the horde's own body. What
 * a boss IS is `tests/bosses.test.ts`'s and `tests/level.test.ts`'s; a phase throwing its own
 * shot is `tests/serpent.test.ts`'s.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { phaseFor } from '../src/app/boss.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE_KINDS } from '../src/content/sprites.ts';
import { INK_OF } from '../src/render/bake.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** The eagle alone, a short way in, with no mid-boss in front of it. */
const EAGLE_ONLY: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 200,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'hellkite',
  theme: 'nebula',
};

/** The eagle on station at `fraction` of its health, its fan held until the test says, and an immortal ship. */
function eagleAt(fraction: number): { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame } {
  const { world } = playableWorld(EAGLE_ONLY);
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
    frame.step();
  }
  expect(world.bossPool.size, 'the eagle never arrived').toBe(1);
  world.bossPool.at(0).health = world.bossFullHealth * fraction;
  world.enemyShots.clear();
  world.enemies.clear();
  return { world, frame };
}

describe('0249 — the eagle summons', () => {
  it('THE FIVE PHASES: darts, a whip, kites, a wider whip, raptors — and it is Ember Nebula’s real boss', () => {
    const row = BOSSES.hellkite;
    const kinds = [1, 0.7, 0.45, 0.3, 0.1].map((f) => (phaseFor(row, row.health * f).attack ?? row.attack).kind);
    // A spray since 0258: the eagle is the one end boss that stalks, and what reacts is where it is.
    expect(kinds).toEqual(['spray', 'whip', 'summon', 'whip', 'summon']);
    expect(LEVELS.descent.boss).toBe('hellkite');
    expect(LEVELS.descent.theme).toBe('nebula');
  });

  it('THE WHIP: one volley is a lash of flames along an arc, the tip faster than the root, in the fire ink', () => {
    /*
      *"Throws out whips of fire."* Driven: every shot of the volley is a flame; laid out by their
      own speed they climb from the root to the tip, and they span an arc rather than a line — the
      first and last leave in different directions across the lane.
    */
    const { world, frame } = eagleAt(0.7);
    world.bossPool.at(0).fireIn = 1;
    frame.step();
    const n = world.enemyShots.size;
    expect(n, 'the whip threw nothing').toBeGreaterThanOrEqual(3);
    let lastSpeed = -1;
    let minAcross = Number.POSITIVE_INFINITY;
    let maxAcross = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < n; i++) {
      const s = world.enemyShots.at(i);
      expect(s.sprite, `shot ${i} of the whip is not a flame`).toBe(SHOTS.flame.sprite);
      const own = Math.hypot(s.velAlong - world.scrollPerStep, s.velAcross);
      expect(own, `flame ${i} is no faster than the one before it — a fan, not a lash`).toBeGreaterThan(lastSpeed);
      lastSpeed = own;
      minAcross = Math.min(minAcross, s.velAcross);
      maxAcross = Math.max(maxAcross, s.velAcross);
    }
    expect(maxAcross - minAcross, 'the whip is a line down the lane rather than an arc across it').toBeGreaterThan(1);
    expect(INK_OF[SPRITE_KINDS[SHOTS.flame.sprite]!], 'a flame wears the enemy’s bullet ink').toBe('fire');
    expect(INK_OF[SPRITE_KINDS[SHOTS.flame.sprite]!], 'a flame wears the player’s own bullet ink').not.toBe('bullet');
  });

  it('THE SUMMONS: a volley at half health puts kites on the field at the leading edge, and one at the end puts raptors', () => {
    /*
      *"Summons hordes of flying kites and raptors as adds at various points throughout the fight."*
      Driven: a volley throws no bullet and the enemy pool gains the phase's count of its kind,
      ahead of the ship and on the screen — where a wave arrives — and the next volley adds more.
    */
    for (const [fraction, enemy] of [
      [0.45, 'kite'],
      [0.1, 'raptor'],
    ] as const) {
      const { world, frame } = eagleAt(fraction);
      const boss = world.bossPool.at(0);
      boss.fireIn = 1;
      frame.step();
      const count = (phaseFor(BOSSES.hellkite, boss.health, world.bossFullHealth).attack as { count: number }).count;
      expect(world.enemies.size, `the summons at ${fraction} put ${world.enemies.size} adds on the field`).toBe(count);
      expect(world.enemyShots.size, 'a summons threw bullets as well').toBe(0);
      for (let i = 0; i < world.enemies.size; i++) {
        const add = world.enemies.at(i);
        expect(add.kind, `an add at ${fraction} is not a ${enemy}`).toBe(world.enemyKinds[enemy]);
        const inView = add.along - world.cameraAlong;
        expect(inView, 'an add arrived behind the ship').toBeGreaterThan(world.ship.along - world.cameraAlong);
        expect(inView, 'an add arrived a whole view beyond the screen').toBeLessThan(world.view.alongSpan * 2);
      }
      // And again on the next volley: a horde is many calls, not one.
      boss.fireIn = 1;
      frame.step();
      expect(world.enemies.size, 'the second volley called nobody').toBe(count * 2);
    }
  });

  it('THE KITE: Ember Nebula’s horde is a small quick flier that bites once, and no level sends it', () => {
    const kite = ENEMIES.kite;
    expect(kite.health).toBe(1);
    expect(kite.fireEvery, 'a kite shoots, and a horde that shoots is a wall').toBe(0);
    expect(kite.radius, 'a kite is no smaller than the raptor it is summoned with').toBeLessThan(ENEMIES.raptor.radius);
    expect(kite.closing, 'a kite is slower than the raptor').toBeGreaterThan(ENEMIES.raptor.closing);
    // Sent by the eagle and by nothing authored: a summons is what it is for.
    for (const level of Object.values(LEVELS)) {
      for (const wave of level.waves) expect(wave.enemy, 'a level authors the kite, which is the eagle’s to call').not.toBe('kite');
    }
  });
});
