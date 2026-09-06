/**
 * One pilot a level — `docs/decisions/0258-one-pilot-a-level.md`.
 *
 * Reported from the alpha play: *"there's too many things that target the player and you can't
 * learn the pattern from → let's change it so one unique enemy per level targets/reacts to the
 * player and others should be on a pattern… minibosses need to be on their own pattern path and not
 * actively matching the player or aiming at the player."*
 *
 * ⚠️ **What REACTS is defined once, here, over the table** — a motion that reads the ship, or a gun
 * that does — and held per place over what each level actually sends. 0073's guard that *not
 * everything reacts* stays in `tests/pilots.test.ts`; this is the other bound, and the pairing.
 */

import { describe, expect, it } from 'vitest';

import { ENEMIES, ENEMY_KINDS, SIGNATURE_OF, type EnemyKind } from '../src/content/enemies.ts';
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { PLAYER_ALONG_MARGIN } from '../src/sim/flight.ts';
import { GameFrame, SHIP_START_ALONG } from '../src/app/frame.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** Whether a kind reacts to where the player is: by how it flies, or by where it points. */
function reacts(kind: EnemyKind): boolean {
  const row = ENEMIES[kind];
  const motion = row.motion.kind === 'hunt' || row.motion.kind === 'circle';
  const gun = row.fireEvery > 0 && row.attack.kind === 'aimed';
  return motion || gun;
}

describe('0258 — one pilot a level', () => {
  it('THE REPORTED ONE: in every level, the only kind that reacts to the player is the place’s own signature', () => {
    for (const kind of LEVEL_KINDS) {
      const level = LEVELS[kind];
      const sent = new Set(level.waves.map((wave) => wave.enemy));
      const reactive = [...sent].filter(reacts);
      expect(
        reactive,
        `${kind} sends ${reactive.join(', ')} which react to the player, and its one pilot is the ${SIGNATURE_OF[level.theme]}`,
      ).toEqual([SIGNATURE_OF[level.theme]]);
    }
  });

  it('and every signature reacts, so every level has exactly one', () => {
    /*
      ⚠️ **The counterweight**: the guard above is satisfied by a level where nothing reacts at all,
      which is 0073's *"a one-button autopilot stick"* — the report this whole line of decisions
      began with. One a level is one, not none.
    */
    for (const kind of LEVEL_KINDS) {
      const signature = SIGNATURE_OF[LEVELS[kind].theme];
      expect(reacts(signature), `${kind}'s own ${signature} does not react to the player, so the level has no pilot`).toBe(true);
    }
    // And the shared kinds are shared: sent by more than one level, so they are the ones on a pattern.
    const shared = ENEMY_KINDS.filter((k) => LEVEL_KINDS.filter((l) => LEVELS[l].waves.some((w) => w.enemy === k)).length > 1);
    expect(shared.length, 'no kind is sent by two levels, so this holds nothing').toBeGreaterThan(0);
    for (const kind of shared) expect(reacts(kind), `${kind} is sent by more than one level and reacts to the player`).toBe(false);
  });

  it('THE MID-BOSSES: every one flies a pattern', () => {
    /*
      *"Minibosses need to be on their own pattern path and not actively matching the player or
      aiming at the player, it makes it very hard to dodge."* A stalk is the one arm of the boss
      vocabulary that reads the ship now — the `aimed` fan is deleted from the union, so no boss CAN
      aim and the type holds that half — and a mid-boss does not fly it.
    */
    for (const kind of LEVEL_KINDS) {
      const mid = LEVELS[kind].midBoss;
      expect(mid, `${kind} has no mid-boss`).not.toBeNull();
      expect(BOSSES[mid!.kind].move.kind, `${kind}'s mid-boss, the ${mid!.kind}, stalks the player`).not.toBe('stalk');
    }
  });

  it('and among the end bosses exactly one stalks', () => {
    /*
      *"We need less enemies (and bosses) reacting to the player."* Less is not none: the eagle
      hunts, because an eagle does, and a fight where nothing on the field knows the player is there
      is weather. Held as a ceiling of one and a floor of one.
    */
    const stalkers = BOSS_KINDS.filter((k) => BOSSES[k].move.kind === 'stalk');
    expect(stalkers.length, `${stalkers.join(', ')} stalk the player, and the ask is fewer`).toBeLessThanOrEqual(1);
    expect(stalkers.length, 'no boss reacts to the player at all').toBe(1);
  });

  it('THE LOOP: a charger turns at the back of the player’s box, wherever the ship is', () => {
    /*
      0073 had a looper turn each time it overshot the ship; it turns at the box's ends now, so the
      pass is a pattern. Driven twice with the ship parked at two different distances, and the turn
      is held to be at the same place both times, inside two hulls of the back of the box — in the
      player's own units, ahead of the camera.
    */
    const turnAt = (shipAlong: number): number => {
      const { world } = playableWorld({
        waves: [{ at: 300, enemy: 'charger', formation: 'line', count: 1, lane: 50 }],
        pickups: [],
        landmarks: [],
        bossAt: Number.POSITIVE_INFINITY,
        midBoss: null,
        sections: NO_SECTIONS,
        boss: 'sentinel',
        theme: 'approach',
      });
      const frame = new GameFrame(world);
      world.ship.health = 9999;
      for (let i = 0; i < STEPS_PER_SECOND * 60 && world.enemies.size === 0; i++) frame.step();
      const charger = world.enemies.at(0);
      charger.health = 9999;
      charger.damage = 0;
      let turned = Number.NaN;
      for (let i = 0; i < STEPS_PER_SECOND * 30 && world.enemies.size > 0 && Number.isNaN(turned); i++) {
        world.ship.along = world.cameraAlong + shipAlong;
        world.ship.prevAlong = world.ship.along;
        world.ship.across = 50;
        const closing = charger.velAlong - world.scrollPerStep < 0;
        frame.step();
        if (world.enemies.size === 0) break;
        if (closing && charger.velAlong - world.scrollPerStep > 0) turned = charger.along - world.cameraAlong;
      }
      expect(Number.isNaN(turned), `the charger never turned with the ship at ${shipAlong}`).toBe(false);
      return turned;
    };
    const near = turnAt(SHIP_START_ALONG);
    const far = turnAt(SHIP_START_ALONG + 60);
    expect(Math.abs(near - far), `the charger turned at ${near.toFixed(1)} with the ship near and ${far.toFixed(1)} with it far — it is turning on the ship`).toBeLessThan(2);
    expect(near - PLAYER_ALONG_MARGIN, `the charger turned ${(near - PLAYER_ALONG_MARGIN).toFixed(1)} units ahead of the back of the box`).toBeLessThan(12);
    expect(near, 'the charger turned behind the back of the box').toBeGreaterThan(PLAYER_ALONG_MARGIN);
  });
});
