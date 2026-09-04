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
import { SPRITE } from './sprites.ts';
import type { WeaponKind } from './weapons.ts';
import type { MissileKind } from './missiles.ts';

/** Every flyable ship. Closed, and one entry long until the roster is played rather than designed. */
export type ShipKind = 'proof';

export interface ShipRow extends Body {
  /**
   * The gun this ship opens a run with, and goes back to on a death.
   *
   * ── THE LADDERS WERE HERE, AND 0233 MOVED THEM ONTO THE KIND ────────────────────────────────────
   *
   * `fireEvery`, `barrels` and `missileEvery` lived on this row from 0093 to 0233, on the argument
   * *a ship is where a weapon's character lives* — kept so that the chunky alternative the play-test
   * asked to have on record could be a second ship. **A weapon is a kind now**
   * (`src/content/weapons.ts`), and the character is the kind's: the chunky gun is a second row
   * there, and a ship names which row it starts on. Nothing about the numbers moved; what moved is
   * whose they are. `docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md`.
   *
   * ⚠️ **The BASE, not the fitted one.** Which gun the ship is carrying right now is the run's
   * (`src/state/slices/run.ts`), because it changes when a pickup of another kind is taken and is
   * lost on a death — exactly as the upgrade list is. This is what an empty run resolves to.
   */
  weapon: WeaponKind;
  /**
   * The second auto-weapon this ship opens with.
   *
   * ⚠️ **On the ROW beside the first, because `docs/game.md` says the ship owns its base weapon** —
   * and a missile is a base weapon rather than an arsenal entry: it fires itself, it needs no input,
   * and `src/content/actions.ts`'s *there is no `fire` action and there must never be one* covers
   * every auto-weapon rather than only the pulse. A second ship that carries a different missile is a
   * table edit; its ladders are `src/content/missiles.ts`'s, on the same terms as the gun's.
   */
  missile: MissileKind;
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
/**
 * ⚠️ **A LADDER PER WEAPON KIND SINCE 0233, AND THE TIERS ARE THE SAME THREE.** Asked for: *"each
 * new weapon needs thematically change the style of the ship so you have a visual indicator of the
 * weapon equipped."* The tier says how much kit the ship carries and the kind says what the kit IS,
 * and both have to show — so the table is two-dimensional and every cell is its own bake, because
 * a blit is one bitmap per entity (`src/render/surface.ts`). `tests/weapons.test.ts` holds every
 * kind to three tiers, three twins, and widening boxes, on 0229's terms.
 */
const HULLS: Record<WeaponKind, readonly { base: number; hit: number }[]> = {
  pulse: [
    { base: SPRITE.ship, hit: SPRITE.shipHit },
    { base: SPRITE.shipMk2, hit: SPRITE.shipMk2Hit },
    { base: SPRITE.shipMk3, hit: SPRITE.shipMk3Hit },
  ],
  arc: [
    { base: SPRITE.shipArc, hit: SPRITE.shipArcHit },
    { base: SPRITE.shipArcMk2, hit: SPRITE.shipArcMk2Hit },
    { base: SPRITE.shipArcMk3, hit: SPRITE.shipArcMk3Hit },
  ],
};

/**
 * Which hull a ship carrying `weapon` and `tier` upgrades' worth of kit is drawn as.
 *
 * ⚠️ **Clamped rather than trusted.** `weaponFor` already clamps, so this can only fire if the two
 * ever disagree — and the failure it prevents is an `undefined` reaching `Entity.sprite`, which is a
 * blit of nothing rather than an error anybody would see.
 */
export function hullFor(weapon: WeaponKind, tier: number): { base: number; hit: number } {
  const ladder = HULLS[weapon];
  const rung = tier < 0 ? 0 : tier > ladder.length - 1 ? ladder.length - 1 : Math.floor(tier);
  return ladder[rung] ?? ladder[0]!;
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
    /*
      ── THE LADDERS WERE HERE — 0233 MOVED THEM ONTO THE KINDS ──────────────────────────────────

      `fireEvery: [8, 8, 6, 6, 4]`, `barrels: [1, 2, 3, 4, 4]` and `missileEvery: [8, 8, 8, 6, 4]`
      are `WEAPONS.pulse`'s and `MISSILES.straight`'s now (`src/content/weapons.ts`,
      `src/content/missiles.ts`), unchanged. What this row says is which kind the ship opens on.

      ⚠️ **AND THE CHUNKY ALTERNATIVE IS STILL RECORDED RATHER THAN BUILT**, asked for during 0093:
      *"keep the chunky slower fire rate on record, we could use that for a different ship later."*
      It is `fireEvery: [12, 8, 8, 6, 6]` with `barrels: [2, 3, 4, 5, 6]` — a gun that opens slow
      and wide and never reaches the fastest rung — and since 0233 it is a second WEAPON KIND that a
      second ship would open on, rather than a retune of this one.
    */
    weapon: 'pulse',
    missile: 'straight',
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
