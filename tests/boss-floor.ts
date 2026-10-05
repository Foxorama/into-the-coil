/**
 * The boss floor, flown — 0260's forty seconds and eight volleys a phase, and the serpent's own
 * twenty-eight (0365) — as one check that any ship and gun can be put through.
 *
 * ⚠️ **ONE COPY OF THE FLOOR, BECAUSE 0526 FLIES IT TWICE.** The ship's own gun is held where it always
 * was, in `tests/level.test.ts` and `tests/serpent.test.ts`, whose comments say why every number is the
 * number it is; the twelve borrowed pairings are held in `tests/gun-floor.test.ts`. Both call these, so a
 * floor moved for a report moves for every ship at once.
 */

import { expect } from 'vitest';
import { DISTANCES, LANES, flyFight } from '../scripts/weigh-boss.mjs';
import { BOSSES, type BossKind } from '../src/content/bosses.ts';
import { DIFFICULTIES, fireGapFor } from '../src/content/difficulty.ts';
import type { ShipKind } from '../src/content/ships.ts';
import type { WeaponKind } from '../src/content/weapons.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';

/** 0260's floor: the quickest fight of a real boss, in seconds, at the gun the player can have. */
export const BOSS_FLOOR_SECONDS = 40;
/** The serpent's, which its own report moved — 0365, in `tests/serpent.test.ts`. */
export const SERPENT_FLOOR_SECONDS = 28;
/** 0260's eight volleys a phase, so every attack is seen. */
export const PHASE_VOLLEYS = 8;

const TUNED = DIFFICULTIES.savior;

/** The quickest of `kind`'s fights against `gun` in `ship`, from every held place; `null` past the cap. */
export function quickestFight(kind: BossKind, gun: WeaponKind, ship?: ShipKind): ReturnType<typeof flyFight> | null {
  let quickest: ReturnType<typeof flyFight> | null = null;
  for (const lane of [...LANES, 'boss' as const]) {
    for (const short of DISTANCES) {
      const fight = flyFight(kind, gun, { lane, short, cap: 240, ...(ship === undefined ? {} : { ship }) });
      if (fight.seconds !== null && (quickest === null || fight.seconds < quickest.seconds!)) quickest = fight;
    }
  }
  return quickest;
}

/** 0260 on a boss with no chain: forty seconds, and eight volleys in each phase summed over its stretches. */
export function expectBossFloor(kind: BossKind, gun: WeaponKind, ship?: ShipKind): void {
  const row = BOSSES[kind];
  const flying = ship === undefined ? '' : ` in the ${ship}`;
  const quickest = quickestFight(kind, gun, ship);
  // Past the cap from every place is over the floor, not unmeasured — 0455, in `tests/level.test.ts`.
  if (quickest === null) return;
  expect.soft(quickest.seconds!, `the ${gun}${flying} kills ${kind} in ${quickest.seconds!.toFixed(1)}s on the tuned tier`).toBeGreaterThanOrEqual(BOSS_FLOOR_SECONDS);
  // Each phase's time summed over every time it is entered — 0476.
  const spent = new Map<number, number>();
  quickest.phaseAt.forEach((entered, i) => {
    const ends = quickest.phaseAt[i + 1]?.at ?? quickest.seconds!;
    spent.set(entered.phase, (spent.get(entered.phase) ?? 0) + ends - entered.at);
  });
  for (const [index, seconds] of spent) {
    const phase = row.phases[index]!;
    if (phase.stance.kind === 'bare') continue;
    const volleys = (seconds * STEPS_PER_SECOND) / fireGapFor(phase.fireEvery, TUNED);
    expect.soft(volleys, `against the ${gun}${flying}, ${kind}'s phase ${index + 1} lasts ${seconds.toFixed(1)}s and gets ${volleys.toFixed(1)} volleys away`).toBeGreaterThanOrEqual(PHASE_VOLLEYS);
  }
}

/** The serpent's: twenty-eight seconds, no phase skipped, and eight volleys in each stretch of one. */
export function expectSerpentFloor(gun: WeaponKind, ship: ShipKind): void {
  const row = BOSSES.jormungandr;
  const quickest = quickestFight('jormungandr', gun, ship);
  if (quickest === null) return;
  expect.soft(quickest.seconds!, `the ${gun} kills the serpent in ${quickest.seconds!.toFixed(1)}s in the ${ship} on the tuned tier`).toBeGreaterThanOrEqual(SERPENT_FLOOR_SECONDS);
  expect.soft(
    quickest.phaseAt.map((p) => p.phase),
    `the ${gun}'s quickest fight in the ${ship} skipped a phase, so an attack was never thrown at all`,
  ).toEqual(row.phases.map((_phase, i) => i));
  quickest.phaseAt.forEach((entered, i) => {
    const ends = quickest.phaseAt[i + 1]?.at ?? quickest.seconds!;
    const volleys = ((ends - entered.at) * STEPS_PER_SECOND) / fireGapFor(row.phases[entered.phase]!.fireEvery, TUNED);
    expect.soft(
      volleys,
      `against the ${gun} in the ${ship}, the serpent's phase ${entered.phase + 1} lasts ${(ends - entered.at).toFixed(1)}s and gets ${volleys.toFixed(1)} volleys away`,
    ).toBeGreaterThanOrEqual(PHASE_VOLLEYS);
  });
}
