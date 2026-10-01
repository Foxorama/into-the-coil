/**
 * AN ENEMY IS AN ANIMAL, NOT A PROP — `docs/decisions/0410-the-enemies-move.md`.
 *
 * ⚠️ **REPORTED FROM PLAY:** *"none of them feel alive because while their location changes, the
 * individual enemies don't 'move'"*, then *"do the frames for everything"*. Three claims: every row
 * authors a cycle, a body in a real level walks it, and — in the units the player sees — the drawing
 * actually changes shape between frames. The third is the one 0027 asks for: the first two can pass
 * over three identical drawings.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { LEVELS } from '../src/content/levels.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { SPRITE_EXTENT, SPRITE_KINDS, type SpriteKind } from '../src/content/sprites.ts';
import { THEME_KINDS, type ThemeKind } from '../src/content/themes.ts';
import { drawKind } from '../src/render/bake.ts';
import { viewOf } from '../src/sim/camera.ts';
import { animate, type Entity, makeEntity, reset, stepEntities } from '../src/sim/entity.ts';
import { Pool } from '../src/sim/pool.ts';
import { tracingPen, type Point } from './paths.ts';
import { playableWorld } from './world.ts';

/** The screen the reports were made on, so a pixel here is a pixel somebody looked at. */
const DESKTOP = viewOf(1280, 720);

/** Every cycle an enemy may wear: its row's, and each of its glows. */
const cyclesOf = (kind: (typeof ENEMY_KINDS)[number]) => [ENEMIES[kind].cycle, ...(ENEMIES[kind].tints ?? [])];

describe('0410: an enemy is an animal, not a prop', () => {
  it('every enemy authors a cycle of more than one drawing, each lit by its own twin', () => {
    for (const kind of ENEMY_KINDS) {
      for (const cycle of cyclesOf(kind)) {
        expect(new Set(cycle.frames).size, `the ${kind} is one picture carried around`).toBeGreaterThanOrEqual(2);
        expect(cycle.hurt.length, `the ${kind}'s lit frames do not match its frames`).toBe(cycle.frames.length);
        expect(cycle.hold, `the ${kind} holds a frame for no time`).toBeGreaterThan(0);
        cycle.frames.forEach((frame, i) => {
          // The suffix is the convention `rig/sheet.ts` already folds a twin by.
          expect(SPRITE_KINDS[cycle.hurt[i]!], `the ${kind}'s frame ${i} is lit as somebody else`).toBe(`${SPRITE_KINDS[frame]!}Hit`);
        });
      }
    }
  });

  it('THE REPORTED ONE: every enemy in a real level changes its drawing as it flies', () => {
    const { world } = playableWorld(LEVELS.approach);
    const frame = new GameFrame(world);
    const drawn = new Map<Entity, { base: number; sprites: Set<number>; steps: number; hold: number; length: number }>();
    for (let step = 0; step < 2400; step++) {
      world.ship.health = world.shipRow.health;
      frame.step();
      for (let i = 0; i < world.enemies.size; i++) {
        const e = world.enemies.at(i);
        let seen = drawn.get(e);
        if (seen === undefined || seen.base !== e.spriteBase) {
          seen = { base: e.spriteBase, sprites: new Set(), steps: 0, hold: e.frameHold, length: e.frames.length };
          drawn.set(e, seen);
        }
        seen.steps++;
        if (e.flashFor === 0) seen.sprites.add(e.sprite);
      }
    }
    const lived = [...drawn.values()].filter((s) => s.steps > s.hold * Math.max(s.length, 1) + 2);
    expect(lived.length, 'the level sent nothing that lived a whole cycle, so this measured nothing').toBeGreaterThan(5);
    for (const s of lived) {
      expect(s.sprites.size, `a ${SPRITE_KINDS[s.base]!} flew ${s.steps} steps as one picture`).toBeGreaterThanOrEqual(2);
    }
  });

  it('and a hit lights the frame the body is on, not its first drawing', () => {
    /*
      Driven directly, because the level fixture's ship flies without firing and so landed one hit in
      2400 steps. What is asked is only this: on every frame of a cycle, a lit body is that frame's twin.
    */
    const row = ENEMIES.lancer;
    const pool = new Pool<Entity>(1, makeEntity);
    const e = pool.spawn()!;
    reset(e, 40, 50, row);
    animate(e, row.cycle);
    const seen = new Set<number>();
    for (let step = 0; step < row.cycle.hold * row.cycle.frames.length * 2; step++) {
      e.flashFor = 2;
      e.velAlong = 0;
      stepEntities(pool, 0);
      const at = Math.floor(e.framePhase / e.frameHold) % e.frames.length;
      expect(e.sprite, `a lit lancer on frame ${at} is drawn in ${SPRITE_KINDS[e.sprite]!}`).toBe(row.cycle.hurt[at]);
      seen.add(e.sprite);
    }
    expect(seen.size, 'a lit body stayed on one lit drawing, so its cycle stopped when it was hit').toBeGreaterThanOrEqual(2);
  });

  it('in pixels: every enemy’s outline moves at least 2 CSS pixels across its cycle on a 1280×720 screen', () => {
    /*
      ⚠️ **2 PX AND NOT LESS, BECAUSE BELOW IT THE MOTION IS A SHIMMER.** 0106 puts the smallest mark
      that is drawn at all at 2.5 px; a part moving less than that is anti-aliasing changing its mind.
      The furthest any point of the outline gets from the rest outline is what the eye can follow.

      ⚠️ **IN EVERY PLACE SINCE 0446**, which gave each place its own body for the eight shared kinds
      and so its own three poses of each. Measured at The Approach alone, six places' worth of new
      animals could be three drawings of one picture and this would never see them.
    */
    const outline = (kind: SpriteKind, theme: ThemeKind): readonly (readonly Point[])[] => {
      const { pen, trace } = tracingPen();
      drawKind(pen, kind, PALETTES[DEFAULT_PALETTE], SPRITE_EXTENT[kind] * DESKTOP.scale, theme);
      return trace.passes[0]!.subpaths;
    };
    const nearest = (p: Point, shape: readonly (readonly Point[])[]): number => {
      let best = Number.POSITIVE_INFINITY;
      for (const ring of shape) {
        for (let i = 0; i < ring.length; i++) {
          const [ax, ay] = ring[i]!;
          const [bx, by] = ring[(i + 1) % ring.length]!;
          const dx = bx - ax;
          const dy = by - ay;
          const t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / (dx * dx + dy * dy || 1)));
          best = Math.min(best, Math.hypot(p[0] - (ax + t * dx), p[1] - (ay + t * dy)));
        }
      }
      return best;
    };
    const still: string[] = [];
    for (const theme of THEME_KINDS) {
      for (const kind of ENEMY_KINDS) {
        for (const cycle of cyclesOf(kind)) {
          const rest = outline(SPRITE_KINDS[cycle.frames[0]!]!, theme);
          let furthest = 0;
          for (const frame of new Set(cycle.frames)) {
            for (const ring of outline(SPRITE_KINDS[frame]!, theme)) for (const p of ring) furthest = Math.max(furthest, nearest(p, rest));
          }
          if (furthest < 2) still.push(`the ${kind}'s outline at ${theme} moves ${furthest.toFixed(2)} px across its cycle`);
        }
      }
    }
    expect(still, 'a body whose parts move by less than a mark is wide is one picture shimmering').toEqual([]);
  });
});
