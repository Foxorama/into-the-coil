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
  /**
   * Sim steps between this ship's pulse volleys, at each weapon tier. One entry per rung, so its
   * length is `UPGRADE_TIERS + 1`.
   *
   * ── IT WAS `firePerBeat` AND A BEAT DECIDED WHAT A GUN COULD DO ────────────────────────────────
   *
   * ⚠️ **`docs/decisions/0159-the-two-clocks-come-apart.md`.** This held volleys PER BEAT and
   * `weaponFor` divided `STEPS_PER_BEAT` by it, so a cadence had to divide 24 — **eight legal fire
   * rates for every weapon this game will ever have**, and the eight were chosen by a music
   * constant. The values here are what that division already produced; what is gone is the rule.
   *
   * ⚠️ **A LIST RATHER THAN A CURVE, AND THAT PART SURVIVES ON ITS OWN MERITS.** It replaced
   * `rung(ship.fireEvery, FASTEST_FIRE, tier)` — a straight line from a base to a floor — because
   * the rungs of a gun are not evenly spaced and a designer wants to say each one. `rung` is kept
   * for the launchers, where the quantity really is a count.
   *
   * ⚠️ **AND IT IS ON THE ROW BECAUSE A SHIP IS WHERE A WEAPON'S CHARACTER LIVES.** The play-test
   * asked for the alternative to be kept: *"keep the chunky slower fire rate on record, we could use
   * that for a different ship later."* **This field is what makes spending it a table edit** rather
   * than a rewrite of `weaponFor`.
   */
  fireEvery: readonly number[];
  /**
   * Sim steps between missile volleys, at each MISSILE tier. Same length as `fireEvery`.
   *
   * ── THE MISSILES USED TO READ THE PULSE'S LADDER, AND THAT IS WHY THE SECOND TUBE WAS LATE ──────
   *
   * ⚠️ **Reported from play, 2026-08-10: *"missile tubes don't get a second firing till like the 3rd
   * upgrade — upgrades for missiles should be 1 tube, 2 tubes, faster fire rate."*** Both halves of
   * that were one cause. `weaponFor` asked `fireEveryAt(ship, tubes)` — the PULSE's list, indexed by
   * the missile tier — so the two ladders had to share their rungs, and the only way to make every
   * missile tier buy something was to stagger the tubes against the rate: `rung(0, 2, tier)` gives
   * 0, **1, 1, 2**, 2, which puts the second tube on the third pickup exactly as reported.
   *
   * ⚠️ **With a list of its own the two stop having to take turns.** The tubes can climb 0, 1, 2, 2,
   * 2 and the rate can hold, hold, then step twice — which is the ask read literally, and every rung
   * still changes something (`docs/game.md`).
   *
   * ⚠️ **THE 5:1 COUNTER-BEAT IS STILL `MISSILE_BEAT_RATIO × ` this** rather than a second tuned
   * number, which is the one relationship in the two ladders that 0159 leaves exactly as it was:
   * it is a ratio between two of the ship's own cadences and never was a musical claim.
   */
  missileEvery: readonly number[];
  /** How many barrels fire at once, at each weapon tier. Same length as `fireEvery`. */
  barrels: readonly number[];
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
   *
   * ⚠️ **`missileEvery` is GONE and the missile's cadence is derived** —
   * `docs/decisions/0093-the-gun-is-on-the-grid.md`. It is `MISSILE_BEAT_RATIO` times whatever the
   * pulse fires at on the same rung, which is the 5:1 cross-rhythm the play-test heard and nobody
   * had chosen. Written as its own number it was free to drift off that ratio, and across the old
   * five tiers it already had — 5.00, 4.88, 4.71, 5.20, 5.00.
   */
  missile: ShotKind;
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
    /*
      ── THE LADDER, IN SIM STEPS ─────────────────────────────────────────────────────────────────

      ⚠️ **`docs/decisions/0159-the-two-clocks-come-apart.md`. These are the numbers the gun has been
      firing at all along**, written down directly instead of arrived at by dividing a music
      constant. It was `firePerBeat: [3, 3, 4, 4, 6]` and `STEPS_PER_BEAT / perBeat`, which is these
      five numbers exactly — **nothing about the gun changes here.**

      ⚠️ **WHAT CHANGES IS WHAT MAY BE AUTHORED NEXT.** The old form could only express cadences that
      divide 24: eight legal rates for every weapon this game will ever have, picked from the
      divisors of a number chosen for the music. Said 2026-08-17: *"the sim-step and gun ladder rules
      make no sense anyway when the plan has always been to add additional weapons in so we'd be
      struggling all over the place if we don't change our approach to that now."* A rung of 7 steps
      is now a thing a hand may simply write.

      ⚠️ **THE RATE STEPS TWICE AND THE BARRELS STEP FOUR TIMES, AND THAT IS NOW A CHOICE RATHER THAN
      A CONSTRAINT.** Under 0093 there were only three usable subdivisions in the span the ladder
      occupies, so two of the four upgrades COULD NOT buy rate and the barrels had to carry them.
      Nothing forces that any more — `docs/game.md` still says every rung must change something, and
      the rate is now free to be one of the things that does.

      ⚠️ **AND THE ALTERNATIVE IS STILL RECORDED RATHER THAN BUILT**, asked for during 0093: *"keep
      the chunky slower fire rate on record, we could use that for a different ship later."* In these
      units it is `fireEvery: [12, 8, 8, 6, 6]` with `barrels: [2, 3, 4, 5, 6]` — a gun that opens
      slow and wide and never reaches the fastest rung. It is a second SHIP rather than a retune of
      this one.
    */
    fireEvery: [8, 8, 6, 6, 4],
    /*
      ── THE MISSILES: TUBE, TUBE, THEN RATE ──────────────────────────────────────────────────────

      ⚠️ **Reported from play: *"upgrades for missiles should be 1 tube, 2 tubes, faster fire rate."***
      The first two rungs hold the base cadence and buy a launcher each; the last two hold the tubes
      at the cap and buy the rate. Every rung still changes something, which is `docs/game.md`'s rule
      and is what the old staggered arrangement was paying for.

      ⚠️ **The floor and the ceiling are BOTH unchanged**, which is what makes this a re-ordering
      rather than a buff. Tier 0 is still eight steps to a pulse volley and tier 4 is still four, so
      `MISSILE_BEAT_RATIO` still reaches 20 steps at the cap and the missile pool's worst case — two
      launchers at the fastest cadence — is the number it always was.

      ⚠️ **What DOES move is the middle, and it moves in the player's favour on purpose**: two tubes
      arrive one pickup earlier and the first rate step arrives one later. That is the trade the ask
      names, and it is a trade rather than a gift.

      ⚠️ **IN SIM STEPS SINCE 0159, and this is the same ladder** — it was `[3, 3, 3, 4, 6]` divided
      into 24, which is these five numbers.
    */
    missileEvery: [8, 8, 8, 6, 4],
    barrels: [1, 2, 3, 4, 4],
    shot: 'pulse',
    missile: 'missile',
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
