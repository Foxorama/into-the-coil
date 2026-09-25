import { describe, expect, it } from 'vitest';

import { GameFrame, launchSpecial } from '../src/app/frame.ts';
import { openBy, phaseFor } from '../src/app/boss.ts';
import { BOSSES, gunWeightOn } from '../src/content/bosses.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPECIALS } from '../src/content/specials.ts';
import { WEAPONS, type WeaponKind } from '../src/content/weapons.ts';
import type { LevelRow } from '../src/content/levels.ts';
import { reset } from '../src/sim/entity.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';
import { flyFight } from '../scripts/weigh-boss.mjs';

/**
 * WHAT THE PLAYER'S FIRE IS WORTH ON A BOSS — `docs/decisions/0372-a-death-keeps-the-ladders.md`.
 *
 * Two rules, both mechanisms rather than numbers. A thrown bomb lands a share of the boss's FULL
 * health, once however much of the animal it covers; and a gun's hit on a boss is weighed by its own
 * row's `bossWeight`. Neither asserts the share or the weight — those are play numbers, and a guard
 * pinned to one would go red the day a hand moved it correctly.
 */

const NEVER = Number.MAX_SAFE_INTEGER;

/** The serpent alone — the one animal with a body the blast can cover several nodes of. */
const SERPENT_ONLY: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 200,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'jormungandr',
  theme: 'approach',
};

/** The serpent on station, the ship untouchable and every gun it has silenced. */
function serpentOnStation(): { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame } {
  const { world } = playableWorld(SERPENT_ONLY);
  const frame = new GameFrame(world);
  let arrived = -1;
  for (let i = 0; i < 2400 && (arrived < 0 || i < arrived + 120); i++) {
    world.ship.health = world.shipRow.health;
    world.ship.invulnFor = 2;
    world.fireIn = NEVER;
    world.missileIn = NEVER;
    world.playerShots.clear();
    if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
    frame.step();
    if (arrived < 0 && world.bossPool.size > 0 && world.bossEntering < 0) arrived = i;
  }
  expect(world.bossPool.size, 'the serpent never arrived').toBe(1);
  expect(world.bossEntering, 'the serpent is still making its entrance').toBe(-1);
  return { world, frame };
}

/** One step with a thrown blast sat on the serpent's head; what the head lost, and how many nodes it covered. */
function blastOnTheHead(share: number, full?: number): { lost: number; expected: (flat: number) => number; covered: number } {
  const { world, frame } = serpentOnStation();
  if (full !== undefined) world.bossFullHealth = full;
  const head = world.bossPool.at(0);
  head.invulnFor = 0;
  const blast = world.blasts.spawn()!;
  reset(blast, head.along, head.across, SHOTS.blast);
  blast.lifeFor = 12;
  blast.bossShare = share;
  let covered = 0;
  for (let i = 0; i < world.bossBody.size; i++) {
    const node = world.bossBody.at(i);
    if (Math.hypot(node.along - blast.along, node.across - blast.across) < blast.radius + node.radius) covered++;
  }
  const open = openBy(phaseFor(world.bossRow, head.health, world.bossFullHealth));
  const fullHealth = world.bossFullHealth;
  const before = head.health;
  world.ship.invulnFor = 2;
  frame.step();
  return {
    lost: before - world.bossPool.at(0).health,
    expected: (flat) => Math.max(flat, share * fullHealth) * open,
    covered,
  };
}

describe('a thrown bomb is worth a share of the fight', () => {
  it('lands its share of the boss’s full health once, however much of the animal it covers', () => {
    /*
      ⚠️ **ONCE, and the fixture has to be able to see twice.** `blastInto` over the head and then
      over the body billed every node inside the blast; at a share of the whole that is a bomb on the
      coil taking a quarter of the fight. So the blast is sat where it covers the head and several
      nodes, and what the head loses is the share and not a multiple of it.
    */
    const hit = blastOnTheHead(SPECIALS.bomb.bossShare);
    expect(hit.covered, 'the blast covers no more than one node, so "once" is not being tested').toBeGreaterThan(1);
    expect(hit.lost, 'the blast landed something other than its share, once').toBeCloseTo(hit.expected(SHOTS.blast.damage), 5);
  });

  it('and never less than the blast’s own damage, so a small boss is not hit softer than it was', () => {
    // A boss so small that its share is under the blast's own six: the larger of the two lands.
    const hit = blastOnTheHead(SPECIALS.bomb.bossShare, 40);
    expect(SPECIALS.bomb.bossShare * 40, 'the share is not under the flat damage, so the floor is not tested').toBeLessThan(
      SHOTS.blast.damage,
    );
    expect(hit.lost, 'a small boss took less than a flat blast').toBeCloseTo(hit.expected(SHOTS.blast.damage), 5);
  });

  it('is armed with the share by the throw, and the pyre is not', () => {
    // The row's share reaches the blast only through `stepBombs`; a special that forgot it would be
    // a flat six on every boss again, with nothing on the screen to say so.
    const { world, frame } = serpentOnStation();
    launchSpecial(world, 'bomb');
    for (let i = 0; i < 120 && world.blasts.size === 0; i++) {
      world.ship.invulnFor = 2;
      frame.step();
    }
    expect(world.blasts.size, 'the bomb never went off').toBeGreaterThan(0);
    expect(world.blasts.at(0).bossShare, 'the thrown blast carries no share').toBe(SPECIALS.bomb.bossShare);
    expect(SPECIALS.bomb.bossShare, 'the bomb has no share, so this proves nothing').toBeGreaterThan(0);
  });
});

describe('a gun on a boss is weighed by its own row', () => {
  /** Seconds to kill volans with `gun` at `weight`, the row patched for the one fight and put back. */
  function fightAt(gun: WeaponKind, weight: number): number {
    const row = WEAPONS[gun] as { bossWeight: number };
    const was = row.bossWeight;
    row.bossWeight = weight;
    try {
      const { seconds } = flyFight('volans', gun, { lane: 'boss', short: 45, cap: 200 });
      if (seconds === null) throw new Error(`${gun} never killed volans`);
      return seconds;
    } finally {
      row.bossWeight = was;
    }
  }

  // The arc strikes the boss by hand and the pulse through the collision pairing: two paths.
  for (const gun of ['arc', 'pulse'] as const) {
    it(`${gun}: doubling the row’s bossWeight shortens the fight`, () => {
      const one = fightAt(gun, 1);
      const two = fightAt(gun, 2);
      expect(two, `${gun}'s bossWeight is not reaching the boss`).toBeLessThan(one * 0.75);
    });
  }

  it('and a boss’s own entry wins over the gun’s row', () => {
    /*
      0282's default shape: the gun's row is the fallback and a boss authors only where it differs.
      The serpent's own arc entry is patched for one fight each way; the gun's row is left alone, so
      a frame that read only the gun would fly the two fights the same.
    */
    const row = BOSSES.jormungandr as { gunWeights?: Partial<Record<WeaponKind, number>> };
    const was = row.gunWeights;
    const fly = (weight: number): number => {
      row.gunWeights = { arc: weight };
      try {
        const { seconds } = flyFight('jormungandr', 'arc', { lane: 'boss', short: 45, cap: 200 });
        if (seconds === null) throw new Error('the arc never killed the serpent');
        return seconds;
      } finally {
        row.gunWeights = was;
      }
    };
    expect(fly(2), 'the serpent’s own weight for the arc is not reaching it').toBeLessThan(fly(1) * 0.75);
    expect(gunWeightOn(BOSSES.volans, 'arc'), 'a boss with no entry does not fall back to the gun').toBe(
      WEAPONS.arc.bossWeight,
    );
  });
});
