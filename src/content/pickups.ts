/**
 * What is lying about in a level, and what taking it does.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. Behaviour
 * rides the row: nothing downstream switches on a pickup's name, it reads what the row says.
 *
 * ── TWO EFFECTS, AND THEY ARE NOT THE SAME KIND OF THING ────────────────────────────────────────
 *
 * `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md` splits them and the split is
 * the reason this file is shaped the way it is:
 *
 *   **an upgrade** changes the ship, stacks with the ones before it, and is **lost on a death**
 *   **a life**     changes the RUN, is spent the moment it is taken, and survives everything
 *
 * An extra life is the first thing in the game whose effect is on the run rather than on the ship,
 * and it is why `effect` exists as a field instead of every pickup simply being an upgrade.
 *
 * ⚠️ **`docs/game.md` names more of these than exist here** — shields, homing rockets, bombs,
 * orbiting mines. Those are *specials*, which the player triggers, and they are the arsenal's own
 * work: `src/content/specials.ts` has the union and nothing fires one yet. What is here is the half
 * that needs no trigger, because `docs/game.md` is emphatic that **auto-fire is the base weapon and
 * every upgrade to it** — always on, requiring no input.
 */

import type { Body } from '../sim/entity.ts';
import type { ShipRow } from './ships.ts';
import { SPRITE } from './sprites.ts';

/** Every pickup in the game. Closed. */
export const PICKUP_KINDS = ['extraLife', 'rapid', 'spread'] as const;

/** Derived from the list, so a pickup cannot exist in the union and be missing from the table. */
export type PickupKind = (typeof PICKUP_KINDS)[number];

/**
 * What taking one does.
 *
 * ⚠️ A closed union of exactly two members, and it earns being one where
 * `src/content/enemies.ts`'s weave deliberately did not: these are not the same effect with a
 * different parameter. One is a number on the run and the other is an entry in a list on the ship,
 * they are cleared by different events, and no value of one produces the other.
 */
export type PickupEffect = 'life' | 'upgrade';

export interface PickupRow extends Body {
  /** What the player would call it. Terse, per `docs/game.md`'s voice rule. */
  label: string;
  effect: PickupEffect;
}

export const PICKUPS: Record<PickupKind, PickupRow> = {
  /**
   * ⚠️ **The reason a fixed complement of lives can still be a full run.**
   * `docs/decisions/0039-…` refused lives that refill at a level boundary, because a game over
   * nothing can reach is a screen that is never designed. This is what replaces it, in the level's
   * own vocabulary: the level author decides how forgiving the level is.
   */
  extraLife: {
    sprite: SPRITE.pickupLife,
    spriteHit: SPRITE.pickupLife,
    radius: 2.4,
    // A pickup is not a body that fights. One health and no damage: it is taken, never destroyed,
    // and it is in no collision pairing that could hurt anything.
    health: 1,
    damage: 0,
    label: 'Extra life',
    effect: 'life',
  },
  /** Faster auto-fire. `docs/game.md`'s first-named upgrade, and the one felt soonest. */
  rapid: {
    sprite: SPRITE.pickupRapid,
    spriteHit: SPRITE.pickupRapid,
    radius: 2.4,
    health: 1,
    damage: 0,
    label: 'Rapid fire',
    effect: 'upgrade',
  },
  /**
   * Another barrel, fanned. `docs/game.md`'s *"wider spray"* and *"extra lasers"* are the same
   * upgrade at different counts, which is why this stacks rather than having tiers.
   */
  spread: {
    sprite: SPRITE.pickupSpread,
    spriteHit: SPRITE.pickupSpread,
    radius: 2.4,
    health: 1,
    damage: 0,
    label: 'Spread',
    effect: 'upgrade',
  },
};

/** Every pickup whose effect is on the ship rather than on the run. */
export type UpgradeKind = 'rapid' | 'spread';

/** The resolved auto-fire: what the ship actually shoots this frame. */
export interface Weapon {
  /** Steps between volleys. */
  fireEvery: number;
  /** Barrels, fanned evenly about the nose. */
  shots: number;
  /** Total angular spread of a volley, radians. Ignored when `shots` is 1. */
  spread: number;
}

/**
 * How much faster each `rapid` makes the ship fire, as a fraction of the gap between shots.
 *
 * ⚠️ **Multiplicative and floored, so an upgrade is always worth taking and never a win button.**
 * `docs/game.md`: *"an upgrade that cannot change the outcome is worse than none"* — and the other
 * end of that sentence is that the fifth one must not end the game. A constant subtraction would
 * reach zero and then negative; a fraction approaches the floor and never crosses it.
 */
const RAPID_FACTOR = 0.78;

/**
 * The fastest the base weapon may ever fire, in steps between volleys.
 *
 * ⚠️ Not a balance number — a **legibility** one. `src/app/frame.ts` records that successive shots
 * connect 6 to 7 steps apart and that the impact flash has to finish inside that gap, or two hits
 * produce one picture and the player cannot count them. Firing faster than the flash can resolve
 * makes damage unreadable, which is the bug `docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md`
 * exists to prevent.
 */
const FASTEST_FIRE = 4;

/** Radians between neighbouring barrels. Wide enough to see, narrow enough to still hit one thing. */
const SPREAD_STEP = 0.13;

/**
 * The ship's auto-fire, given what it is carrying.
 *
 * Pure, and a function of the whole list rather than of a running total — so it can be recomputed
 * from a saved run, and so a death clearing the list restores the base weapon with no second
 * description of what the base weapon was.
 */
export function weaponFor(ship: ShipRow, upgrades: readonly UpgradeKind[]): Weapon {
  let fireEvery = ship.fireEvery;
  let shots = 1;
  for (let i = 0; i < upgrades.length; i++) {
    if (upgrades[i] === 'rapid') fireEvery = Math.max(FASTEST_FIRE, Math.round(fireEvery * RAPID_FACTOR));
    else shots++;
  }
  return { fireEvery, shots, spread: SPREAD_STEP * (shots - 1) };
}
