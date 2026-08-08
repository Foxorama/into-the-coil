/**
 * What the player flies.
 *
 * ⚠️ **One row, and it is deliberately not a character.** `docs/game.md` names the roster — four
 * *Far Carry* golfers in the prologue, nine caddies in the unlock pool — and says every ship must
 * differ on at least one axis the player can feel. Authoring one of them here, in a PR whose subject
 * is whether the ship can be killed, would be inventing product to satisfy a shape: the roster is a
 * table edit against this file, and it is owed a hand on the controls rather than a guess.
 *
 * What IS real here is the shape: a `Record` over a closed union per
 * `docs/decisions/0016-a-hub-enumerates-kinds.md`, with the base weapon on the row, so a second ship
 * changes no type and no code.
 *
 * ⚠️ **Auto-fire is on the row and has no trigger, anywhere.** `src/content/actions.ts` says it: there
 * is no `fire` action and there must never be one. The base weapon fires itself; the arsenal — which
 * is a list and not a slot — is what the player spends. Nothing in this file is that arsenal yet.
 */

import type { Body } from '../sim/entity.ts';
import type { ShotKind } from './shots.ts';
import { SPRITE } from './sprites.ts';

/** Every flyable ship. Closed, and one entry long until the roster is played rather than designed. */
export type ShipKind = 'proof';

export interface ShipRow extends Body {
  /** Steps between auto-fire shots. */
  fireEvery: number;
  /** The base weapon. */
  shot: ShotKind;
  /**
   * The second auto-weapon, and the steps between its volleys.
   *
   * ⚠️ **On the ROW beside the first, because `docs/game.md` says the ship owns its base weapon** —
   * and a missile is a base weapon rather than an arsenal entry: it fires itself, it needs no input,
   * and `src/content/actions.ts`'s *there is no `fire` action and there must never be one* covers
   * every auto-weapon rather than only the pulse. A second ship that carries a different missile, or
   * none at all, is a table edit.
   */
  missile: ShotKind;
  missileEvery: number;
}

/** Written out rather than derived, so the table below cannot quietly lose a row. */
export const SHIP_KINDS: readonly ShipKind[] = ['proof'];

/**
 * The hulls, in tier order — and their hit twins beside them.
 *
 * ⚠️ **Here rather than on the row, because a tier is not a property of THIS ship** — 0081. Every
 * ship in the roster `docs/game.md` describes will have three of these, and the day a second row is
 * added the alternative is three more fields on it that all say *the same wedge with more of it*.
 *
 * ⚠️ **A pair per tier, because `stepEntities` derives `sprite` from `spriteBase` AND `spriteHit`
 * every step** (`src/sim/entity.ts`). Handing back only the base would leave an upgraded ship
 * flashing as the tier-0 hull on every hit, which is a silhouette changing at the one moment the
 * player is least able to read it.
 */
const HULLS: readonly { base: number; hit: number }[] = [
  { base: SPRITE.ship, hit: SPRITE.shipHit },
  { base: SPRITE.shipMk2, hit: SPRITE.shipMk2Hit },
  { base: SPRITE.shipMk3, hit: SPRITE.shipMk3Hit },
];

/**
 * Which hull a ship carrying `tier` upgrades' worth of kit is drawn as.
 *
 * ⚠️ **Clamped rather than trusted.** `weaponFor` already clamps, so this can only fire if the two
 * ever disagree — and the failure it prevents is an `undefined` reaching `Entity.sprite`, which is a
 * blit of nothing rather than an error anybody would see.
 */
export function hullFor(tier: number): { base: number; hit: number } {
  const rung = tier < 0 ? 0 : tier > HULLS.length - 1 ? HULLS.length - 1 : Math.floor(tier);
  return HULLS[rung] ?? HULLS[0]!;
}

export const SHIPS: Record<ShipKind, ShipRow> = {
  /**
   * The proof scene's ship.
   *
   * ⚠️ **`health` is 1, and it was 5.** Asked for after playing the two-level build: *"one hit
   * destroys the ship."* Five hits meant a player could fly through a wave, take four of them, and
   * arrive at the boss with no idea which of the four had been avoidable — the number was a buffer
   * against learning rather than a resource to spend.
   *
   * ⚠️ **It is still the number of HITS the entity survives, and shields are counted in the same
   * field.** A ship carrying two shields has `health` 3: two absorbed hits, then the hull. That is
   * one description of *what is left between this ship and the end of the life*, which is what makes
   * the collision, the readout and the orbiting shell agree without any of them being told twice —
   * `docs/decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md`.
   */
  proof: {
    sprite: SPRITE.ship,
    spriteHit: SPRITE.shipHit,
    radius: 2,
    health: 1,
    damage: 0,
    fireEvery: 9,
    shot: 'pulse',
    /*
      ⚠️ **Five times the gap between pulses, and it is what makes the two weapons different.** A
      missile worth three pulses fired at the pulse's own rate would simply BE the weapon, and the
      pulse would be decoration; the ask says *slower*, and the number a hand settles is how much.
      Nothing asserts on it — `tests/pickups.test.ts` holds the pool arithmetic it feeds, which must
      hold at any value.
    */
    missile: 'missile',
    missileEvery: 45,
  },
};

/**
 * The most shields a ship may carry at once.
 *
 * Asked for in the same list as the one-hit hull: *"shields — a pickup, capped at 3."*
 *
 * ⚠️ **A cap rather than an upgrade curve, and the reason is the readout.** The HUD draws one pip
 * per shield and the ship wears one orbiting mark per shield, so an uncapped count is a picture that
 * eventually cannot be read at a glance — which is the whole job of both. Three is what a player can
 * count without counting.
 *
 * ⚠️ **A module constant rather than a column on the ship row**, on the same terms
 * `src/content/ships.ts` keeps one row: a second ship that carried four shields would be a
 * difference the player can feel, and authoring it before there is a second ship is inventing a
 * roster to satisfy a shape. Moving it to the row later changes no caller.
 */
export const MAX_SHIELDS = 3;

/**
 * How many shields a ship at this health is carrying — the health above its hull, floored at zero.
 *
 * ⚠️ **THE single description of *shields are health above the hull*, and it is a function because
 * three callers need it.** The readout draws a pip per shield, the shell spawns an orbiting mark per
 * shield, and the pickup refuses a fourth; `health - 1` written out three times is the shape of
 * second description `src/content/sprites.ts` records the cost of, and it would also silently bake in
 * *the hull is worth exactly one* at every one of those sites.
 */
export function shieldsOf(ship: ShipRow, health: number): number {
  return Math.max(0, health - ship.health);
}

/** The most health a ship may reach: its hull, plus a full shell. */
export function fullHealthFor(ship: ShipRow): number {
  return ship.health + MAX_SHIELDS;
}

/**
 * One mark of the shell, as a body.
 *
 * ⚠️ **`radius` is zero and `damage` is zero, and both are stated rather than left to `Body`.** A
 * mark is in no collision pairing at all — `src/app/frame.ts` says why the shell is a picture rather
 * than a hurtbox — and `src/content/debris.ts` writes its own zeros out for the same reason: the
 * belt as well as the braces, because a body that is inert by ACCIDENT stops being inert the first
 * time somebody adds a pairing.
 */
export const SHIELD_MARK: Body = {
  sprite: SPRITE.shieldOrb,
  spriteHit: SPRITE.shieldOrb,
  radius: 0,
  health: 1,
  damage: 0,
};

/**
 * Steps of invulnerability after a hit lands — 0.75s at 60Hz.
 *
 * ⚠️ **Not a comfort setting and not on the assist ladder.** Without it `health` is a count of STEPS
 * rather than of hits: an overlapping volley bills the player sixty times a second and five health is
 * gone in a twelfth of a second, which reads as dying at full health.
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` keeps the ladder closed; this is part
 * of the one game, at the same value for everybody.
 */
export const INVULN_STEPS = 45;
