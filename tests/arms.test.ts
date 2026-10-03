/**
 * Each place has its own arms — `docs/decisions/0473-each-place-has-its-own-arms.md`.
 *
 * Reported: *"enemies on each level need some unique level attacks and sprites as well — thematic for
 * level and boss on that level. we did work on make the sprites different per level, but the attacks
 * are all the same."*
 *
 * ⚠️ **THE FACES' GUARD, ONE LAYER DOWN** — `tests/faces.test.ts` holds that no two places draw a
 * shared kind as one silhouette, because *"the same model with a different colour"* is a claim about
 * an outline. *"The attacks are all the same"* is a claim about what comes out, so this holds that no
 * two places arm a shared kind with one bullet in one pattern.
 */

import { describe, expect, it } from 'vitest';

import { GameFrame, advanceLevel } from '../src/app/frame.ts';
import { ARMED_KINDS, ARMS, ROWS_OF } from '../src/content/arms.ts';
import { ENEMIES, ENEMY_KINDS, type EnemyKind } from '../src/content/enemies.ts';
import { LEVELS, LEVEL_KINDS, type LevelRow } from '../src/content/levels.ts';
import { SHOT_INDEX, SHOT_KINDS } from '../src/content/shots.ts';
import { THEME_KINDS, type ThemeKind } from '../src/content/themes.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** One body of `kind`, alone on a level in `theme`'s place — no corridor, no fight, as `tests/pilots.test.ts` flies one. */
const alone = (kind: EnemyKind, theme: ThemeKind): LevelRow => ({
  waves: [{ at: 200, enemy: kind, formation: 'line', count: 1, lane: 50 }],
  pickups: [],
  landmarks: [],
  bossAt: Number.POSITIVE_INFINITY,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'sentinel',
  theme,
});

describe('0473 — each place has its own arms', () => {
  it('THE REPORTED ONE: no two places arm a shared kind with the same bullet in the same pattern', () => {
    for (const kind of ARMED_KINDS) {
      const seen = new Map<string, string>();
      for (const theme of THEME_KINDS) {
        const row = ROWS_OF[theme][ENEMY_KINDS.indexOf(kind)]!;
        const arms = `${row.shot}/${row.attack.kind}`;
        const twin = seen.get(arms);
        expect(twin, `the ${kind} throws ${arms} at both ${twin} and ${theme}`).toBeUndefined();
        seen.set(arms, theme);
      }
    }
  });

  it('and every place but the Approach is armed from its own table, so the Approach is the only one that throws what every place threw', () => {
    for (const theme of THEME_KINDS) {
      for (const kind of ARMED_KINDS) {
        const row = ROWS_OF[theme][ENEMY_KINDS.indexOf(kind)]!;
        if (theme === 'approach') expect(row, `the Approach's ${kind} is not its own row`).toBe(ENEMIES[kind]);
        else expect(row.shot, `the ${kind} at ${theme} is not on its place's arms`).toBe(ARMS[theme][kind].shot);
      }
    }
  });

  it('THE FRAME SWAPS THEM, DRIVEN: across the level boundary a turret fires its new place’s bullet and not the one it fired before', () => {
    /*
      ⚠️ **THROUGH `advanceLevel`, NOT THE FIXTURE.** `tests/world.ts` sets a level's own rows itself,
      so a world built there would pass whether or not the game swaps them; this one starts at the
      Approach and crosses into each place the way a run does.
    */
    LEVEL_KINDS.forEach((level, index) => {
      const row = LEVELS[level];
      if (row.theme === 'approach') return;
      const { world } = playableWorld(alone('turret', 'approach'));
      const frame = new GameFrame(world);
      advanceLevel(world, alone('turret', row.theme), index);
      world.ship.health = 1e9;
      let fired = -1;
      for (let i = 0; i < 900 && fired < 0; i++) {
        world.fireIn = Number.MAX_SAFE_INTEGER;
        frame.step();
        if (world.enemyShots.size > 0) fired = world.enemyShots.at(0).kind;
      }
      expect(fired, `no turret fired at ${row.theme}, so this measured nothing`).toBeGreaterThanOrEqual(0);
      expect(SHOT_KINDS[fired], `the turret at ${row.theme} fired the wrong bullet`).toBe(ARMS[row.theme as Exclude<typeof row.theme, 'approach'>].turret.shot);
      expect(fired, `the turret at ${row.theme} still fires the Approach's`).not.toBe(SHOT_INDEX[ENEMIES.turret.shot]);
    });
  });

  it('and a stream is one heading, each shot slower than the one before it, so the string opens as it flies', () => {
    const { world } = playableWorld(alone('lancer', 'labyrinth'));
    const lancer = ROWS_OF.labyrinth[ENEMY_KINDS.indexOf('lancer')]!;
    expect(lancer.attack.kind, 'the Labyrinth lancer no longer streams, so this measures nothing').toBe('stream');
    if (lancer.attack.kind !== 'stream') return;
    const frame = new GameFrame(world);
    world.ship.health = 1e9;
    for (let i = 0; i < 900 && world.enemyShots.size === 0; i++) {
      world.fireIn = Number.MAX_SAFE_INTEGER;
      frame.step();
    }
    expect(world.enemyShots.size, 'the lancer did not throw its whole string').toBe(lancer.attack.shots);
    const headings = new Set<string>();
    const speeds: number[] = [];
    for (let s = 0; s < world.enemyShots.size; s++) {
      const shot = world.enemyShots.at(s);
      const along = shot.velAlong - world.scrollPerStep;
      headings.add(Math.atan2(shot.velAcross, along).toFixed(4));
      speeds.push(Math.hypot(along, shot.velAcross));
    }
    expect(headings.size, 'a stream left on more than one heading — that is a fan').toBe(1);
    for (let s = 1; s < speeds.length; s++) {
      expect(speeds[s]!, `shot ${s} of the string is not slower than the one before it`).toBeLessThan(speeds[s - 1]!);
    }
  });
});
