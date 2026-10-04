/**
 * Damage sheds — `docs/decisions/0480-damage-sheds.md`.
 *
 * Reported three times in one play, of three bosses: *"no damage shows on the boss."* The flash says a
 * hit landed and the bar says how much is left; nothing between them said *this animal is hurt*. Each
 * real boss now sheds a fragment of what it is made of from where the ship's fire lands, each time a
 * hit arms the flash.
 *
 * ⚠️ **DRIVEN, IN THE PLAYER'S UNIT — FRAGMENTS A SECOND.** A shot is parked on the boss's hull every
 * step, which lands as often as any gun can, and its health is held so the fight goes on.
 */
import { describe, expect, it } from 'vitest';

import { GameFrame, SHED_GAP } from '../src/app/frame.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { SPRITE, SPRITE_KINDS } from '../src/content/sprites.ts';
import { reset } from '../src/sim/entity.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { bodyOf } from './bodies.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** Fragments a second at most: the flash's own cycle, 0334's gap. */
const MOST_A_SECOND = STEPS_PER_SECOND / SHED_GAP;

describe('0480 — damage sheds', () => {
  for (const level of LEVEL_KINDS) {
    const kind = LEVELS[level].boss;
    it(`${kind}: a hit sheds its own fragment, from where it landed, and never more than five a second`, () => {
      const row = BOSSES[kind];
      expect(row.shed, `${kind} sheds nothing`).not.toBeNull();
      const { world } = playableWorld({ waves: [], pickups: [], landmarks: [], bossAt: 200, midBoss: null, sections: NO_SECTIONS, boss: kind, theme: LEVELS[level].theme });
      const frame = new GameFrame(world);
      for (let i = 0; i < 4000 && !(world.bossPool.size > 0 && world.bossEntering < 0); i++) {
        world.ship.health = world.shipRow.health;
        world.ship.invulnFor = 2;
        world.fireIn = Number.MAX_SAFE_INTEGER;
        world.missileIn = Number.MAX_SAFE_INTEGER;
        frame.step();
      }
      expect(world.bossPool.size, `${kind} never came on to be fought`).toBe(1);
      const seconds = 5;
      let shed = 0;
      let worn = 0;
      let wide = 0;
      let mouthward = 0;
      for (let i = 0; i < seconds * STEPS_PER_SECOND; i++) {
        const hull = world.bossPool.at(0);
        hull.health = world.bossFullHealth;
        world.ship.health = world.shipRow.health;
        world.ship.invulnFor = 2;
        world.fireIn = Number.MAX_SAFE_INTEGER;
        world.missileIn = Number.MAX_SAFE_INTEGER;
        world.enemyShots.clear();
        world.playerShots.clear();
        /*
          ⚠️ **ON EVERY BODY OF THE ANIMAL, NOT ONLY THE HULL** — a serpent's nodes, a jellyfish's
          tentacles. One shot on the hull is held to the hull's own flash gap whatever the shed does, so
          the ceiling could not be seen to bite: a probe that took the shed's rest away came back STILL
          GREEN. Lit everywhere at once, as a fan of fire lights it, the animal sheds as often as the rest
          allows.
        */
        const park = (along: number, across: number): void => {
          const shot = world.playerShots.spawn();
          if (shot !== null) reset(shot, along, across, bodyOf(SPRITE.bullet, 0.9, 1, 1));
        };
        park(hull.along, hull.across);
        for (let k = 0; k < world.bossBody.size; k++) park(world.bossBody.at(k).along, world.bossBody.at(k).across);
        frame.step();
        if (world.bossShedIn !== SHED_GAP) continue;
        shed++;
        // The newest fragment wears the row's own, and leaves from the animal rather than from nowhere.
        for (let k = 0; k < world.debris.size; k++) {
          const piece = world.debris.at(k);
          if (piece.sprite !== row.shed?.sprite) continue;
          worn++;
          const off = Math.hypot(piece.along - world.bossPool.at(0).along, piece.across - world.bossPool.at(0).across);
          if (off > 120) wide++;
          break;
        }
        /*
          ⚠️ **A FLANK'S FRAGMENT NEVER LEAVES THE SHIP'S HALF OF THE ANIMAL, NOR FLIES AT THE SHIP — 0514.**
          The fish's face is the mouth its adds come out of (0373), and an ember thrown from it at the
          player was taken for an add. Read off the newest fragment, against the line from the hull to
          the ship: where it starts, and which way it goes.
        */
        if (row.shed?.from === 'flank') {
          for (let k = world.debris.size - 1; k >= 0; k--) {
            const piece = world.debris.at(k);
            if (piece.sprite !== row.shed.sprite) continue;
            const lord = world.bossPool.at(0);
            const toAlong = world.ship.along - lord.along;
            const toAcross = world.ship.across - lord.across;
            const reach = Math.hypot(toAlong, toAcross);
            const starts = ((piece.along - lord.along) * toAlong + (piece.across - lord.across) * toAcross) / reach;
            const flies = (piece.velAlong * toAlong + piece.velAcross * toAcross) / reach;
            if (starts > 0.5 || flies > 0.01) mouthward++;
            break;
          }
        }
      }
      expect(shed, `${kind} shed nothing under a hit every step`).toBeGreaterThan(0);
      expect(worn, `${kind} shed ${shed} times and none of them was its ${SPRITE_KINDS[row.shed?.sprite ?? 0]}`).toBe(shed);
      expect(wide, `${kind}'s fragments started a long way from it`).toBe(0);
      expect(mouthward, `${kind} sheds off its flank, and ${mouthward} of ${shed} left the face turned to the ship or flew at it`).toBe(0);
      expect(shed / seconds, `${kind} shed ${(shed / seconds).toFixed(1)} a second`).toBeLessThanOrEqual(MOST_A_SECOND);
    });
  }

  it('and every lord sheds its own: no two bosses shed the same fragment', () => {
    // 0282's terms: a mechanism whose output is the same for every instance is the tell.
    const sheds = LEVEL_KINDS.map((level) => BOSSES[LEVELS[level].boss].shed?.sprite);
    expect(new Set(sheds).size, 'two lords shed the same thing').toBe(sheds.length);
  });
});
