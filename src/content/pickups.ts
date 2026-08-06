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
import { SHOTS } from './shots.ts';
import { SPRITE } from './sprites.ts';

/** Every pickup in the game. Closed. */
export const PICKUP_KINDS = ['extraLife', 'rapid', 'spread', 'shield', 'missileRate', 'missileSpread'] as const;

/** Derived from the list, so a pickup cannot exist in the union and be missing from the table. */
export type PickupKind = (typeof PICKUP_KINDS)[number];

/**
 * What taking one does.
 *
 * ⚠️ A closed union, and it earns being one where `src/content/enemies.ts`'s weave deliberately did
 * not: these are not the same effect with a different parameter. Each is a different FIELD, cleared
 * by a different event, and no value of one produces another.
 *
 *   **life**     a number on the run. Survives everything, including a death
 *   **upgrade**  an entry in a list on the ship. Lost on a death — 0039
 *   **shield**   armour on the LIFE. Spent by being hit, and gone with the ship that wore it
 *
 * ⚠️ **The third one is not an upgrade, and that is why it is a third member rather than a row with
 * a flag.** An upgrade is kept until the ship dies and is worth exactly as much on the last frame of
 * a life as on the first; a shield is consumed by the thing it protects against, so a player who has
 * three is in a different position from a player who took three ten seconds ago. Folding it into
 * `upgrade` would put a consumable in the list `weaponFor` resolves and a death empties, which is two
 * wrong answers at once.
 */
export type PickupEffect = 'life' | 'upgrade' | 'shield';

export interface PickupRow extends Body {
  /** What the player would call it. Terse, per `docs/game.md`'s voice rule. */
  label: string;
  /**
   * What taking it does, in the fewest words that say it.
   *
   * ⚠️ **Player-facing text, and it lives on the ROW rather than in the chrome that shows it.** The
   * title screen's key is built by walking `PICKUP_KINDS`, so a pickup added to the table appears in
   * the key without anybody remembering to add it — which is the whole point of the table being the
   * hub. A list of explanations in `src/app/chrome.ts` would be a second description of the content.
   *
   * Terse, per `docs/game.md`'s voice rule: *no explanatory commentary, no restating what the screen
   * already shows.* Three words is the target, not the limit anybody is pushing against.
   */
  hint: string;
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
    hint: 'One more try',
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
    hint: 'Shoot faster',
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
    hint: 'Another barrel',
    effect: 'upgrade',
  },
  /**
   * One more hit that never reaches the hull.
   *
   * ⚠️ **It is the answer to the ship being one hit**, and the two landed together for that reason —
   * `docs/decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md`. A
   * one-hit ship with nothing to find would be a difficulty change wearing a mechanic's clothes.
   */
  shield: {
    sprite: SPRITE.pickupShield,
    spriteHit: SPRITE.pickupShield,
    radius: 2.4,
    health: 1,
    damage: 0,
    label: 'Shield',
    hint: 'One hit absorbed',
    effect: 'shield',
  },
  /**
   * The missile half of *shoot faster*.
   *
   * ⚠️ **Its own kind rather than a stronger `rapid`**, because the two weapons have separate
   * cadences and a player who wants more missiles is asking for a different thing from a player who
   * wants more pulses. It is also what makes the pair a pair — see `src/content/sprites.ts` on the
   * two faces of one silhouette.
   */
  missileRate: {
    sprite: SPRITE.pickupMissileRate,
    spriteHit: SPRITE.pickupMissileRate,
    radius: 2.4,
    health: 1,
    damage: 0,
    label: 'Rapid missiles',
    hint: 'Missiles fire faster',
    effect: 'upgrade',
  },
  /** Another launcher. The base ship has one; this is how the other two arrive. */
  missileSpread: {
    sprite: SPRITE.pickupMissileSpread,
    spriteHit: SPRITE.pickupMissileSpread,
    radius: 2.4,
    health: 1,
    damage: 0,
    label: 'Launcher',
    hint: 'Another missile tube',
    effect: 'upgrade',
  },
};

/**
 * Every pickup whose effect is an entry in the ship's upgrade list.
 *
 * ⚠️ **Written out, and then CHECKED against the table rather than trusted.** It was a hand-written
 * union beside a table that already says `effect: 'upgrade'`, which is two descriptions of one fact —
 * and the shell narrowed to it with a ternary on one name, so a third upgrade would have been
 * silently filed as the other one. `tests/pickups.test.ts` holds the two in step.
 */
export const UPGRADE_KINDS = ['rapid', 'spread', 'missileRate', 'missileSpread'] as const;

/** Every pickup whose effect is on the ship rather than on the run. */
export type UpgradeKind = (typeof UPGRADE_KINDS)[number];

/**
 * Whether a pickup is one of the upgrades — a real narrowing, so the shell needs no cast.
 *
 * ⚠️ **This replaces `kind === 'rapid' ? 'rapid' : 'spread'` in `src/app/mount.ts`.** That line was
 * correct for exactly as long as there were two upgrades, and the pickup added beside it is not one.
 */
export function isUpgrade(kind: PickupKind): kind is UpgradeKind {
  return (UPGRADE_KINDS as readonly PickupKind[]).includes(kind);
}

/**
 * The resolved auto-fire: what the ship actually shoots this frame.
 *
 * ⚠️ **TWO WEAPONS, ONE RESOLVED SHAPE.** The pulse and the missile fire on their own cadences from
 * their own hardware, and both are auto — `src/content/actions.ts`'s *there is no `fire` action and
 * there must never be one* is about the arsenal, not about how many things fire themselves. Keeping
 * them in one `Weapon` is what lets `src/app/frame.ts` read a resolved number per step instead of
 * walking the upgrade list twice.
 */
export interface Weapon {
  /** Steps between volleys. */
  fireEvery: number;
  /** Barrels, fanned evenly about the nose. */
  shots: number;
  /** Total angular spread of a volley, radians. Ignored when `shots` is 1. */
  spread: number;
  /** Steps between missile volleys. */
  missileEvery: number;
  /** Launchers, fired together. One is the ship's own; the rest are found. */
  launchers: number;
  /** What one missile takes off what it hits — its row's damage, plus whatever had nowhere else to go. */
  missileDamage: number;
  /**
   * What one shot takes off what it hits.
   *
   * ⚠️ **Where an upgrade goes once it can no longer go anywhere else.** Barrels are capped and the
   * fire rate has a floor, so without this the sixth spread and the eleventh rapid would change
   * nothing — and `docs/game.md` says an upgrade that cannot change the outcome is worse than none.
   */
  damage: number;
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
 * How much faster each `missileRate` makes the missiles, as a fraction of the gap between volleys.
 *
 * ⚠️ **Gentler than the pulse's, and that is the weapon being different rather than a rounder
 * number.** A missile is worth three pulses, so the same 0.78 would put three times the damage on
 * the same curve and the pulse would stop mattering by the third pickup.
 */
const MISSILE_FACTOR = 0.85;

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

/**
 * The fastest missiles may ever leave the ship, in steps between volleys.
 *
 * ⚠️ **A POOL number as much as a balance one**, and the arithmetic is the same one `MAX_BARRELS`
 * answers: `launchers × flight / missileEvery` has to stay under the missile pool, and a missile is
 * in flight for about 130 steps on the widest view. Three launchers at 20 steps is 20 slots against
 * a pool of 24. `tests/pickups.test.ts` drives the strongest possible loadout and fails if the pool
 * ever fills, so these numbers are checked against each other rather than trusted to stay in step.
 */
const MISSILE_FASTEST = 20;

/**
 * The most launchers a ship may ever carry.
 *
 * ⚠️ **THREE, AND IT IS THE ASK'S OWN NUMBER**: *"the base ship has one, at the middle; the first
 * upgrade adds one on the `across`-minus side and the second on the `across`-plus side."* There is
 * no fourth position on the ship for one to be drawn from, which is the same argument
 * `src/content/ships.ts` makes for capping the shell at three: a picture nobody can read at a glance
 * has stopped being a readout.
 */
const MAX_LAUNCHERS = 3;

/** Radians between neighbouring barrels. Wide enough to see, narrow enough to still hit one thing. */
const SPREAD_STEP = 0.13;

/**
 * The most barrels the ship may ever fire at once.
 *
 * ⚠️ **A BUDGET, and it was found by playing rather than by reasoning.** Without it the volley is
 * `shots` bullets every `fireEvery` steps with no ceiling, and at five spreads and five rapids that
 * is twelve barrels every four steps — which overruns the player-shot pool and stays overrun. The
 * pool then refuses the later barrels of every volley, so the first two streams fire continuously and
 * the rest stutter. Measured at **284 of 900 steps spent at the cap**, and reported from play as
 * *"two streams of bullets are continuous and the other streams slow down and it's a bit weird."*
 *
 * ⚠️ **FOUR, and five was measured and rejected.** The arithmetic that has to close is
 * `barrels × PLAYER_SHOT_LIFE / FASTEST_FIRE ≤ pool`, and at five barrels that is exactly 100
 * against a pool of 100 — no headroom at all, so the fan still clips on the step a volley overlaps
 * the one before it. Four gives 80 against 100.
 *
 * The pool cannot simply grow: `docs/decisions/0022-frame-rate-is-a-feature.md` budgets a 500-entity
 * worst-case scene and the pools already total exactly that.
 *
 * `tests/pickups.test.ts` drives the strongest possible weapon and fails if the pool ever fills, so
 * these four numbers are checked against each other rather than trusted to stay in step.
 */
const MAX_BARRELS = 4;

/**
 * The most steps a player shot can be in flight, on the widest device there is.
 *
 * ── THIS USED TO BE A LIFETIME ON THE SHOT, AND `npm run prove` IS WHY IT IS NOT ────────────────
 *
 * ⚠️ **It was a real mechanism and it stopped being one.** A shot used to retire itself after 80
 * steps, because otherwise it ran to the leading cull — 80 units beyond the furthest edge of the
 * furthest screen — and held the pool slot the next volley needed
 * (`docs/decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md`).
 *
 * `docs/decisions/0048-a-threat-may-arrive-from-the-side.md` then culled player shots at the edge of
 * the view the player is actually looking at, which is **at most 240 units ahead of the camera** —
 * strictly tighter than the 251 the lifetime allowed, on every device the clamp permits. So the
 * lifetime could no longer fire, and its probe went STILL GREEN: the guard over it had become
 * unfalsifiable while reading as thorough.
 *
 * ⚠️ **The rule is `src/app/mount.ts`'s, learned there over the orientation gate: one guarantee, one
 * mechanism.** A redundant safety net does not make a system safer — it makes the real mechanism
 * untestable, and an untested mechanism is the one that gets refactored away. So the lifetime is
 * gone and this is the number that remains: what the pool arithmetic is checked against.
 *
 * `(MAX_ALONG_SPAN − SHIP_START_ALONG) / pulse speed` — 77 steps, rounded up.
 */
export const PLAYER_SHOT_LIFE = 80;

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
  let damage = SHOTS[ship.shot].damage;
  let missileEvery = ship.missileEvery;
  let launchers = 1;
  let missileDamage = SHOTS[ship.missile].damage;
  for (let i = 0; i < upgrades.length; i++) {
    /*
      ⚠️ **Each upgrade spends itself on the first thing it still can.** A rapid that would push past
      the fire floor, or a spread past the barrel cap, becomes WEIGHT instead — which is what keeps
      *every upgrade is worth taking* true at the eleventh one as well as at the first, without
      letting either count run away.
    */
    const upgrade = upgrades[i];
    if (upgrade === 'rapid') {
      const faster = Math.round(fireEvery * RAPID_FACTOR);
      if (faster < FASTEST_FIRE) damage++;
      else fireEvery = faster;
    } else if (upgrade === 'missileRate') {
      const faster = Math.round(missileEvery * MISSILE_FACTOR);
      if (faster < MISSILE_FASTEST) missileDamage++;
      else missileEvery = faster;
    } else if (upgrade === 'missileSpread') {
      if (launchers >= MAX_LAUNCHERS) missileDamage++;
      else launchers++;
    } else if (shots >= MAX_BARRELS) damage++;
    else shots++;
  }
  return {
    fireEvery,
    shots,
    spread: SPREAD_STEP * (shots - 1),
    damage,
    missileEvery,
    launchers,
    missileDamage,
  };
}
