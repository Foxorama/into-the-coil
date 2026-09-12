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
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** The fish alone, a short way in, with no mid-boss in front of it. */
const VOLANS_ONLY: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 200,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'volans',
  theme: 'nebula',
};

/** The fish on station at `fraction` of its health, its fan held until the test says, and an immortal ship. */
function volansAt(fraction: number): { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame } {
  const { world } = playableWorld(VOLANS_ONLY);
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
    frame.step();
  }
  expect(world.bossPool.size, 'the fish never arrived').toBe(1);
  world.bossPool.at(0).health = world.bossFullHealth * fraction;
  world.enemyShots.clear();
  world.enemies.clear();
  return { world, frame };
}

describe('0249 — the eagle summons', () => {
  it('THE FIVE PHASES: darts, a whip, kites, a wider whip, raptors — and it is Ember Nebula’s real boss', () => {
    const row = BOSSES.volans;
    const kinds = [1, 0.7, 0.45, 0.3, 0.1].map((f) => (phaseFor(row, row.health * f).attack ?? row.attack).kind);
    // A spray since 0258: the fish is the one end boss that stalks, and what reacts is where it is.
    // A rake since 0262: a fan of quills that sweeps, which a fan that sits was not — *"boring"*.
    expect(kinds).toEqual(['rake', 'whip', 'summon', 'whip', 'summon']);
    expect(LEVELS.descent.boss).toBe('volans');
    expect(LEVELS.descent.theme).toBe('nebula');
  });

  it('0262 — THE QUILL: the fish’s bullet is a feather of its own, raked across the lane, and no fan of it points the same way twice', () => {
    /*
      `docs/decisions/0262-the-eagle-throws-quills.md`. *"The bullets need to be feathered quills;
      the bullet attacks were boring."* The row's shot is the quill — its own silhouette on the
      hostile ladder, in the enemy's ink, between the slab and the ring — and the whole phase's fan
      rakes: two volleys, two centres. Driven, and the picture asked for its bitmap.
    */
    const row = BOSSES.volans;
    expect(row.shot, 'the fish throws something other than quills').toBe('quill');
    expect(SHOTS.quill.sprite, 'the quill shares the lance’s silhouette').not.toBe(SHOTS.lance.sprite);
    expect(INK_OF[SPRITE_KINDS[SHOTS.quill.sprite]!], 'a quill is not in the enemy’s ink').toBe('enemy');
    expect(SHOTS.quill.speed, 'a quill is no slower than a slab').toBeLessThan(SHOTS.flak.speed);
    expect(SHOTS.quill.speed, 'a quill is no quicker than a void ring').toBeGreaterThan(SHOTS.void.speed);
    const { world, frame } = volansAt(1);
    const centres: number[] = [];
    for (let volley = 0; volley < 2; volley++) {
      world.enemyShots.clear();
      world.bossPool.at(0).fireIn = 1;
      frame.step();
      expect(world.enemyShots.size, 'the fish threw one dart, which is the fan that was boring').toBeGreaterThan(1);
      let sum = 0;
      for (let i = 0; i < world.enemyShots.size; i++) {
        const s = world.enemyShots.at(i);
        expect(s.sprite, 'a shot of the opening fan is not a quill').toBe(SHOTS.quill.sprite);
        sum += Math.atan2(s.velAcross, s.velAlong - world.scrollPerStep);
      }
      centres.push(sum / world.enemyShots.size);
    }
    expect(Math.abs(centres[1]! - centres[0]!), 'the fan of quills does not rake — two volleys point the same way').toBeGreaterThan(0.1);
  });

  it('THE WHIP: one volley is a lash of flames along an arc, the tip faster than the root, in the fire ink', () => {
    /*
      *"Throws out whips of fire."* Driven: every shot of the volley is a flame; laid out by their
      own speed they climb from the root to the tip, and they span an arc rather than a line — the
      first and last leave in different directions across the lane.
    */
    const { world, frame } = volansAt(0.7);
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
      const { world, frame } = volansAt(fraction);
      const boss = world.bossPool.at(0);
      boss.fireIn = 1;
      frame.step();
      const count = (phaseFor(BOSSES.volans, boss.health, world.bossFullHealth).attack as { count: number }).count;
      expect(world.enemies.size, `the summons at ${fraction} put ${world.enemies.size} adds on the field`).toBe(count);
      expect(world.enemyShots.size, 'a summons threw bullets as well').toBe(0);
      /*
        ⚠️ **FROM THE SIDES SINCE 0262** — *"they marched in gently from the left side in a single
        file, they didn't swoop or dive bomb."* Every add of a call is outside the lane on the step
        it is called, on ONE side, steering for a lane inside it; the next call comes from the
        other side. Ahead of the ship still, and on the screen.
      */
      const sides = new Set<number>();
      for (let i = 0; i < world.enemies.size; i++) {
        const add = world.enemies.at(i);
        expect(add.kind, `an add at ${fraction} is not a ${enemy}`).toBe(world.enemyKinds[enemy]);
        const inView = add.along - world.cameraAlong;
        expect(inView, 'an add arrived behind the ship').toBeGreaterThan(world.ship.along - world.cameraAlong);
        expect(inView, 'an add arrived a whole view beyond the screen').toBeLessThan(world.view.alongSpan * 2);
        expect(add.across < 0 || add.across > ACROSS_SPAN, `an add at ${fraction} arrived inside the lane rather than from a side`).toBe(true);
        expect(add.steerAcross, 'an add from the side is not steering for a lane').toBeGreaterThan(0);
        expect(add.steerAcross).toBeLessThan(ACROSS_SPAN);
        sides.add(Math.sign(add.across));
      }
      expect(sides.size, 'one call came from both sides at once').toBe(1);
      const firstSide = [...sides][0]!;
      // And again on the next volley, from the other side: a horde is many calls, not one.
      boss.fireIn = 1;
      frame.step();
      expect(world.enemies.size, 'the second volley called nobody').toBe(count * 2);
      const latest = world.enemies.at(world.enemies.size - 1);
      expect(Math.sign(latest.across), 'the second call came from the same side as the first').toBe(-firstSide);
    }
  });

  it('THE KITE: Ember Nebula’s horde is a small quick flier that bites once, and no level sends it', () => {
    const kite = ENEMIES.kite;
    expect(kite.health).toBe(1);
    expect(kite.fireEvery, 'a kite shoots, and a horde that shoots is a wall').toBe(0);
    expect(kite.radius, 'a kite is no smaller than the raptor it is summoned with').toBeLessThan(ENEMIES.raptor.radius);
    expect(kite.closing, 'a kite is slower than the raptor').toBeGreaterThan(ENEMIES.raptor.closing);
    // And it dives — 0262: a hunt harder than any level's pilot, from the side the fish calls it on.
    expect(kite.motion.kind, 'a kite does not dive for the ship').toBe('hunt');
    if (kite.motion.kind === 'hunt') expect(kite.motion.agility, 'a kite dives no harder than the raptor hunts').toBeGreaterThan(ENEMIES.raptor.motion.kind === 'hunt' ? ENEMIES.raptor.motion.agility : 0);
    // Sent by the fish and by nothing authored: a summons is what it is for.
    for (const level of Object.values(LEVELS)) {
      for (const wave of level.waves) expect(wave.enemy, 'a level authors the kite, which is the fish’s to call').not.toBe('kite');
    }
  });
});
