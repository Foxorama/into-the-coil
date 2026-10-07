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
import type { Rng } from '../sim/rng.ts';
/*
  ⚠️ **THE WEAPON NO LONGER IMPORTS THE TEMPO, AND THAT IS THE DECISION** —
  `docs/decisions/0159-the-two-clocks-come-apart.md`. This file used to read `STEPS_PER_BEAT` out of
  `./music.ts` and divide by it, on 0093's reasoning that *the gun depends on the beat and not the
  other way round*. The direction was right and the dependency was the problem: it meant **the tempo
  could not be changed without re-checking every fire rate**, and every fire rate had to be one of the
  eight divisors of 24.

  ⚠️ **Both files are now free of each other.** A cadence is sim steps; a beat is seconds. Whether
  what the guns play should AGREE with what the music plays is a real question and it is asked
  somewhere neither of these two files can answer it — 0159 says where.
*/

import type { ShipRow } from './ships.ts';
import { SHOTS } from './shots.ts';
import { SPECIALS, SPECIAL_KINDS, WARD_KINDS, type SpecialKind } from './specials.ts';
import { SPRITE } from './sprites.ts';
import { WEAPONS, type FlightKind, type WeaponKind } from './weapons.ts';
import { MISSILES, MISSILE_KINDS, type GuidanceKind, type MissileKind, type MissileRow } from './missiles.ts';

/**
 * Every special the bomb pickup offers, in its cycle order — 0441: the gun-side specials, every gun's
 * own, whatever gun the ship that takes it flies. Derived from the specials' table rather than listed,
 * so a gun special added there is a face here.
 */
export const BOMB_KINDS: readonly SpecialKind[] = SPECIAL_KINDS.filter((k) => SPECIALS[k].side === 'gun');

/**
 * Every pickup in the game. Closed.
 *
 * ── IT WAS SIX AND IT IS THREE ──────────────────────────────────────────────────────────────────
 *
 * `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md`. Reported from play: *"power ups are
 * too common still and these are premium game pieces that are the lynchpin of whether this game is
 * actually good or not"*, and *"too many varieties and it's overwhelming and weak."*
 *
 * ⚠️ **`rapid` and `spread` are one `weapon`; `missileRate` and `missileSpread` are one `missile`.**
 * The merge is the ask's own words — *"rapid fire/rapid missiles rapid whatever else we add need to
 * be combined into one power up… picking up a second of the same weapon needs to increase it's tier
 * and rate of fire together"* — and `weaponFor` below is where *together* lives.
 *
 * ⚠️ **FOUR down to ONE and then back to TWO, inside two days.** 0082 merged all four into a single
 * `weapon`, which was the ask read literally; 0083 splits the missile out again, and the reason is
 * forward-looking rather than a correction: *"I want weapons and missiles as separate upgrades
 * because we're going to add different types of weapons and missiles and that's where the cycling
 * will come into it."* A pickup that can be one of several WEAPONS needs a kind that means *the gun*,
 * and one that can be one of several missiles needs a kind that means *the tubes*.
 * `docs/decisions/0083-two-ladders-of-four.md`.
 *
 * ⚠️ **`extraLife` is GONE, and that is a product change rather than a merge** — *"a shield is an
 * extra life anyway and it's far more game impactful and meaningful."* It is: a shield stops the death
 * happening, so it keeps the arsenal that
 * `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md` says a death takes, and an
 * extra life hands back a ship with nothing on it. **The cost is that a run's complement of lives can
 * now only go DOWN** — 0039 refused lives that refill at a level boundary and named findable ones as
 * the replacement, and there are no findable ones. 0082 has why that is survivable today and what
 * makes it not.
 *
 * ⚠️ **`bomb` was a fourth, and `docs/decisions/0372-a-death-keeps-the-ladders.md` took it off the
 * field**: *"remove the bomb power up."* A charge is earned by taking an upgrade the ladder has no
 * room for, which is the only way into the arsenal after the starting two.
 *
 * ⚠️ **AND IT IS BACK, IN THE WEAPON'S PLACE — 0441.** *"Weapon pickups will instead be bomb pickups
 * … the pickup will still cycle, but a player can pick up any type and get a bomb of that type."* A
 * gun is the ship's and has no ladder now, so the pickup that climbed it buys a charge of whichever
 * gun's special it is showing — a bomb, a storm, a whirlpool or a roman candle — whatever gun the ship
 * flies.
 */
export const PICKUP_KINDS = ['bomb', 'missile', 'shield', 'ward'] as const;

/** Derived from the list, so a pickup cannot exist in the union and be missing from the table. */
export type PickupKind = (typeof PICKUP_KINDS)[number];

/**
 * What taking one does.
 *
 * ⚠️ A closed union, and it earns being one where `src/content/enemies.ts`'s weave deliberately did
 * not: these are not the same effect with a different parameter. Each is a different FIELD, cleared
 * by a different event, and no value of one produces another.
 *
 *   **upgrade**  an entry in a list on the run. Kept through a death and a continue — 0372
 *   **shield**   armour on the LIFE. Spent by being hit, and gone with the ship that wore it
 *   **special**  charges in the arsenal. Spent by the player, and the only one they choose to use
 *
 * ⚠️ **A shield is not an upgrade, and that is why it is its own member rather than a row with a
 * flag.** An upgrade is kept until the ship dies and is worth exactly as much on the last frame of a
 * life as on the first; a shield is consumed by the thing it protects against, so a player who has
 * three is in a different position from a player who took three ten seconds ago. Folding it into
 * `upgrade` would put a consumable in the list `weaponFor` resolves and a death empties, which is two
 * wrong answers at once.
 *
 * ⚠️ **`special` is the fourth field a pickup can move and the first one the player SPENDS** — 0082.
 * It is not a shield either: a shield is armour on the life being flown and is gone with the ship,
 * where an arsenal survives to the end of the run minus what 0039 takes. Three effects, three fields,
 * three different events that clear them.
 *
 * ⚠️ **`life` is gone with `extraLife`.** It was the one effect whose target was the RUN rather than
 * the ship, and nothing grants one any more — see `PICKUP_KINDS` above.
 */
export type PickupEffect = 'upgrade' | 'shield' | 'special';

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
  /**
   * How it is taken and where what it gives goes — 0458, the line How to play writes under the face.
   *
   * ⚠️ **ON THE ROW, AND EVERY ROW AUTHORS ITS OWN**, for `hint`'s reason one field up and on
   * `CLAUDE.md`'s *every instance authors its Y*: the shield's line is about its shell and its spill,
   * the tubes' about a full rack, and a shared sentence in the chrome would say neither.
   */
  how: string;
  effect: PickupEffect;
  /**
   * What it looks like — one sprite per thing it can be offering, in its table's order.
   *
   * ── A PICKUP IS DRAWN ON ONE FACE AND KEEPS IT — 0575 ───────────────────────────────────────────
   *
   * *"Change all the ingame pickups to be a random pickup that doesn't rotate. The pickup spawns with a
   * random powerup … It doesn't rotate and can be picked up as is."* 0233 turned a pickup through
   * these every three seconds so the player could wait for the one they wanted; since 0575 the frame
   * draws one when it spawns (`drawFace`) and the pickup shows it until it is taken or leaves.
   *
   * ⚠️ **`sprite` is `faces[0]`, held by `tests/weapons.test.ts` rather than derived**, because the
   * `Body` a pickup is spawned from is what `reset` copies and the title screen's key reads. The face
   * drawn is put on in the same call as the reset, so no step ever draws the first face by mistake.
   */
  faces: readonly number[];
  /**
   * Whether a pickup's place may be drawn as this kind — 0575. The bomb, the tubes and the shield are
   * the three things a pickup can be — *"a shield/missile or special weapon"* — and the ward is only
   * ever a shield on a tier that wears none, so it is never drawn for itself.
   */
  drawn: boolean;
  /**
   * The special it becomes when it has nowhere to go and its face does not say which — 0377.
   *
   * *"Shields — if you cap shields, you get a void missile."* A capped weapon or tube spills into its
   * FACE's own special (`overflowOf`), so those rows say `null`; the shield has one face and no ladder,
   * so its spill is named here, on its row, and `takeShield` reads it rather than a branch in the shell.
   */
  spills: SpecialKind | null;
  /**
   * What is offered in its place on a tier whose ship can wear none of what it gives — 0447, or `null`
   * for a pickup every tier can take.
   *
   * ⚠️ **It was WITHHELD, and that was 0355's answer before the shield cycled.** A shield on Burn,
   * where the shell is zero, could only ever have been nothing, so nothing was thrown. Since the shield
   * pickup also offers the ward's specials, a Burn ship can take two of its three faces — and the ask
   * says what should go there: *"in Burn difficulty, when a miniboss dies it'll spit out a void bomb
   * pickup in place of the shield."* So the shield's row names the ward pickup, which is its other two
   * faces, and the frame throws that.
   */
  bare: PickupKind | null;
}

/*
  ── `PICKUP_CYCLE_STEPS` AND `PICKUP_REPEATS` WERE HERE, AND 0575 TOOK THEM ──────────────────────

  Three seconds a face (0233, 0236) and two full turns of the faces before a pickup could leave. A
  pickup no longer turns, so it waits the same ten seconds every pickup's floor already was
  (`PICKUP_LINGER_STEPS` in `src/app/frame.ts`).
*/

export const PICKUPS: Record<PickupKind, PickupRow> = {
  /**
   * A CHARGE OF A GUN'S SPECIAL, AND IT WAS THE WEAPON — 0441.
   *
   * ⚠️ **It is drawn on one of the gun specials and keeps it — 0575**; it cycled them until then, on
   * 0233's clock. Any ship may take any face — *"a player can pick up any type and get a bomb of that
   * type"* — and the charge goes on the gun's trigger, newest first, as every gun special does (0376).
   */
  bomb: {
    sprite: SPRITE.pickupBomb,
    spriteHit: SPRITE.pickupBomb,
    // ⚠️ Half its extent in `src/content/sprites.ts`, and that holds for all three rows below —
    // `docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md` makes the picture the
    // hurtbox, so the three sizes 0082 gave the pickups are three hurtboxes as well as three targets.
    radius: 3,
    // A pickup is not a body that fights. One health and no damage: it is taken, never destroyed,
    // and it is in no collision pairing that could hurt anything.
    health: 1,
    damage: 0,
    label: 'Bomb',
    hint: 'A charge of the face it shows',
    how: 'One charge for your gun trigger',
    effect: 'special',
    // Every gun special, in the specials' own order — 0441. The key lists each face by name.
    faces: BOMB_KINDS.map((k) => SPECIALS[k].face),
    drawn: true,
    spills: null,
    bare: null,
  },
  /**
   * THE MISSILES, AND EVERY REPEAT RAISES TUBES AND RATE TOGETHER.
   *
   * ⚠️ **Its own kind again, and 0082 had merged it into `weapon`.** The reason is what is COMING
   * rather than what is wrong: *"we're going to add different types of weapons and missiles and
   * that's where the cycling will come into it."* Two ladders means a player can be tier 4 on the
   * pulse and tier 2 on the missiles, which is the shape
   * `docs/decisions/0083-two-ladders-of-four.md` authors the levels against.
   *
   * ⚠️ **The base ship has NO tube**, so the first of these is the second weapon arriving at all —
   * `docs/decisions/0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md`, and the ladder
   * below is written so tier 1 is the tube rather than the rate.
   */
  missile: {
    sprite: SPRITE.pickupMissile,
    spriteHit: SPRITE.pickupMissile,
    radius: 2.75,
    health: 1,
    damage: 0,
    label: 'Missiles',
    hint: 'Tubes up a tier',
    how: 'The tubes it shows; at a full rack it is a surge for your missile trigger',
    effect: 'upgrade',
    faces: MISSILE_KINDS.map((k) => MISSILES[k].pickup),
    drawn: true,
    spills: null,
    bare: null,
  },
  /**
   * One more hit that never reaches the hull.
   *
   * ⚠️ **It is the answer to the ship being one hit**, and the two landed together for that reason —
   * `docs/decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md`. A
   * one-hit ship with nothing to find would be a difficulty change wearing a mechanic's clothes.
   *
   * ⚠️ **It is now the ONLY thing standing between the player and a lost life**, because 0082 took
   * the extra life away on the grounds that this is the better version of one. Reported from play:
   * *"shields in particular are so much more stronger than I had anticipated."* That is the reason it
   * survived the cut and the reason a level may only author two.
   *
   * ⚠️ **ITS FACES SINCE 0447: THE SHIELD, THE VOID, THE NOVA.** *"For shields → instead of void bombs
   * at shield cap, the void bomb will be on rotation with the shield on that pickup so a player can
   * choose to pick up a void bomb or a shield."* The nova joined because it pops bullets, which makes it
   * the ward's and not the gun's. The first face is the shield; the rest are `WARD_KINDS` in order, and
   * a ward face is a charge on the third trigger (`effectOf`, `specialOf`). Since 0575 one of the three
   * is drawn and kept rather than turned through.
   */
  shield: {
    sprite: SPRITE.pickupShield,
    spriteHit: SPRITE.pickupShield,
    radius: 2.5,
    health: 1,
    damage: 0,
    label: 'Shield',
    hint: 'One hit absorbed',
    how: 'A plate for your shell, or a ward charge; at a full shell a plate becomes a void',
    effect: 'shield',
    faces: [SPRITE.pickupShield, ...WARD_KINDS.map((k) => SPECIALS[k].face)],
    drawn: true,
    // A shield face taken at a full shell is still a void — a face the player flew for should never be
    // a dead pickup.
    spills: 'voidMissile',
    bare: 'ward',
  },
  /**
   * THE SHIELD PICKUP WITHOUT ITS SHIELD — 0447: what a tier that wears no shell is offered where a
   * shield would be. *"In Burn difficulty, when a miniboss dies it'll spit out a void bomb pickup in
   * place of the shield."* It is the ward's specials, the void and the nova, and is never drawn for
   * itself: it only ever arrives as a shield's `bare`.
   */
  ward: {
    sprite: SPRITE.pickupVoid,
    spriteHit: SPRITE.pickupVoid,
    radius: 2.5,
    health: 1,
    damage: 0,
    label: 'Ward',
    hint: 'A charge of the face it shows',
    how: 'Where a shield would be, on Burn: one charge for your ward trigger',
    effect: 'special',
    faces: WARD_KINDS.map((k) => SPECIALS[k].face),
    drawn: false,
    spills: null,
    bare: null,
  },
};

/**
 * What a pickup's place may be drawn as — 0575: every row that says `drawn`, in the table's order.
 */
export const DRAWN_KINDS: readonly PickupKind[] = PICKUP_KINDS.filter((k) => PICKUPS[k].drawn);

/**
 * What kind a pickup's place is, drawn with even odds over `DRAWN_KINDS` — 0575: *"a random powerup
 * that can be a shield/missile or special weapon."* The kind first and then the face (`drawFace`), so
 * the tubes, which have two faces, are as likely as the gun specials, which have four: the player's
 * answer when asked, because a face-for-face draw would starve a run of tubes.
 */
export function drawKind(rng: Rng): PickupKind {
  return DRAWN_KINDS[rng.int(0, DRAWN_KINDS.length - 1)]!;
}

/** Which of `row`'s faces a pickup is drawn on, with even odds — 0575. */
export function drawFace(row: PickupRow, rng: Rng): number {
  return rng.int(0, row.faces.length - 1);
}

/**
 * What a ship is carrying: the tube ladder and which tube it is fitted with.
 *
 * ⚠️ **The run slice's own shape, named here so content can read it without importing state** —
 * `src/state/slices/run.ts` satisfies it structurally. The gun is not in it since 0441: it is the
 * ship's, and the ship's row says which.
 */
export interface Loadout {
  upgrades: readonly UpgradeKind[];
  missile: MissileKind;
}

/**
 * The special a bomb pickup showing `face` is offering, and the tube a missile pickup is offering.
 *
 * ⚠️ **Clamped onto the list rather than trusted**, on `everyAt`'s terms: a face past the end can
 * only arrive if a pickup's entity and its row ever disagree, and the failure it prevents is an
 * `undefined` reaching the reducer as a kind.
 */
export function bombFaceOf(face: number): SpecialKind {
  return BOMB_KINDS[face < 0 ? 0 : face >= BOMB_KINDS.length ? BOMB_KINDS.length - 1 : face]!;
}

export function missileFaceOf(face: number): MissileKind {
  return MISSILE_KINDS[face < 0 ? 0 : face >= MISSILE_KINDS.length ? MISSILE_KINDS.length - 1 : face]!;
}

/**
 * The ward special a ward pickup showing `face` is offering — 0447. The shield pickup's ward faces
 * come after its shield, so it asks with `face - 1`.
 */
export function wardFaceOf(face: number): SpecialKind {
  return WARD_KINDS[face < 0 ? 0 : face >= WARD_KINDS.length ? WARD_KINDS.length - 1 : face]!;
}

/**
 * What a pickup showing `face` is called and what it does — for the title screen's key, which lists
 * every face of a cycling pickup rather than the row once.
 */
export function faceOf(kind: PickupKind, face: number): { label: string; hint: string } {
  if (kind === 'bomb') return SPECIALS[bombFaceOf(face)];
  if (kind === 'missile') return MISSILES[missileFaceOf(face)];
  if (kind === 'ward') return SPECIALS[wardFaceOf(face)];
  // The shield's first face is the shield and the rest are the ward's — 0447.
  if (face > 0) return SPECIALS[wardFaceOf(face - 1)];
  return PICKUPS[kind];
}

/**
 * Every pickup whose effect is an entry in the ship's upgrade list.
 *
 * ⚠️ **Written out, and then CHECKED against the table rather than trusted.** It was a hand-written
 * union beside a table that already says `effect: 'upgrade'`, which is two descriptions of one fact —
 * and the shell narrowed to it with a ternary on one name, so a third upgrade would have been
 * silently filed as the other one. `tests/shields.test.ts` holds the two in step.
 *
 * ⚠️ **ONE MEMBER SINCE 0441, AND IT WAS TWO.** 0083 split the gun's ladder from the tubes'; 0441
 * took the gun's away — *"each ship will start with max weapons, so we're effectively removing the
 * weapon tier"* — and *"missiles have no change"* keeps this one. Still a list of kinds rather than a
 * count, so a second ladder is a member again rather than a migration.
 */
export const UPGRADE_KINDS = ['missile'] as const;

/** Every pickup whose effect is on the ship rather than on the run. */
export type UpgradeKind = (typeof UPGRADE_KINDS)[number];

/**
 * How many pickups it takes to max one ladder.
 *
 * ── THE TIER COUNT IS A CONSTANT, AND IT USED TO BE AN ACCIDENT ─────────────────────────────────
 *
 * Asked for: *"there should be 4 tiers for weapons, 4 tiers for missiles."*
 * `docs/decisions/0083-two-ladders-of-four.md`.
 *
 * ⚠️ **Every number below is derived FROM this rather than tuned until it lands on it.** The old
 * ladder multiplied each cadence by a fraction and stopped at a floor, so *how many tiers is a weapon*
 * was whatever `round(9 × 0.78ⁿ) ≥ 4` happened to produce — three, as it turned out, and nothing said
 * so. Four is now the statement and the cadences are interpolated across it, so the floor is reached
 * **exactly** at the last tier and the count cannot drift when a base or a floor is tuned.
 *
 * ⚠️ **A multiplicative ladder was the right shape for the question it answered** — *"a constant
 * subtraction would reach zero and then negative; a fraction approaches the floor and never crosses
 * it"* — and interpolating to the floor answers it too, without leaving the rung count implicit.
 */
export const UPGRADE_TIERS = 4;

/**
 * Which special an upgrade pickup becomes once its ladder can take no more.
 *
 * ⚠️ **The cap and the thing an upgrade becomes are ONE decision, and this is the half that is
 * content.** `docs/game.md` says *"an upgrade that cannot change the outcome is worse than none"*, and
 * the old answer to that was an unbounded `damage++` — which is exactly the reported defect *"max
 * speed auto-fire is way too strong for the current game… bosses die in less a second."*
 * `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md` takes the other option the report
 * named: a cap, **plus something else for an upgrade to become**.
 *
 * ⚠️ **PER LADDER since 0083, which is what makes *"unlimited bombs"* true.** A fifth weapon pickup
 * becomes a charge even while the missiles are still climbing, and the other way round — so neither
 * ladder's cap can turn the other's pickups into dead ones.
 *
 * ⚠️ **AND THE FACE'S OWN SINCE 0373** — `docs/decisions/0373-a-special-is-the-guns-own.md`: *"it
 * increases your bomb count for that weapon/missile type."* An overflow only happens on a face that
 * matches what is fitted (`effectOf`), so the face's row and the fitted row are the same row.
 */
/*
  ⚠️ **AND THE BOMB PICKUP'S, SINCE 0441, WHICH IS NOT AN OVERFLOW.** A bomb pickup is a special on
  every take: the face is the special. So this answers *what special does a pickup showing `face` give
  when its effect is `special`* — a full tube's overflow, or a bomb face — and was `overflowOf`.
*/
/*
  ⚠️ **AND THE WARD'S, SINCE 0447**: a ward pickup's face, and a shield pickup showing anything but
  its shield, which is the same list one place on.
*/
export function specialOf(kind: PickupKind, face: number): SpecialKind {
  if (kind === 'bomb') return bombFaceOf(face);
  if (kind === 'ward') return wardFaceOf(face);
  if (kind === 'shield') return wardFaceOf(face - 1);
  return MISSILES[missileFaceOf(face)].special;
}

/**
 * How many tiers of `kind` a list of upgrades has bought, clamped at the top.
 *
 * ⚠️ **THE single description of *which rung am I on*, and everything else here reads it.** The
 * cadences, the hardpoints, `grows` and `src/app/mount.ts`'s bomb conversion are all functions of this
 * number, so a list can never be part-way between two answers.
 */
export function tiersOf(upgrades: readonly UpgradeKind[], kind: UpgradeKind): number {
  let taken = 0;
  for (let i = 0; i < upgrades.length; i++) if (upgrades[i] === kind) taken++;
  return taken > UPGRADE_TIERS ? UPGRADE_TIERS : taken;
}

/*
  ── `rung` WAS HERE AND ITS LAST CALLER IS GONE, WHICH IS THE END OF A THREE-DECISION RETREAT ────

  It was `Math.round(base + (cap - base) * (tier / UPGRADE_TIERS))` — a straight line from a base to
  a cap across the four tiers — and it drew the pulse cadence, the missile cadence, the barrels and
  the launchers. `docs/decisions/0093-the-gun-is-on-the-grid.md` took the first three away, because
  the usable subdivisions of a beat are geometric and a line does not land on them; the previous
  version of this comment said the launchers kept it *"because a launcher is genuinely a count."*

  ⚠️ **THAT SENTENCE WAS TRUE AND WAS STILL THE BUG.** A launcher is a count and this interpolated
  it — 0 → 2 over four rungs rounds to 0, 1, 1, 2, 2 — so *"missile tubes don't get a second firing
  till like the 3rd upgrade"* was the shape of the function rather than a number anybody chose.
  Reported from play, 2026-08-10.

  ⚠️ **What the ask wants is a LIST, exactly like the two above it**, and the rungs of an upgrade
  ladder have now failed to be evenly spaced four times running. When the fifth arrives, author the
  entries rather than reaching for a curve to generate them: `docs/decisions/0016-a-hub-enumerates-kinds.md`
  is the same argument one layer up.
*/

/**
 * Steps between volleys, for a ladder of note values read at `tier`.
 *
 * ⚠️ **THE single description of *what cadence is this rung*, and it is asked for two weapons.**
 * `docs/decisions/0093-the-gun-is-on-the-grid.md` makes the 5:1 cross-rhythm a stated ratio rather
 * than a coincidence between two ladders, and that is only true if both are read the same way.
 *
 * ⚠️ **The LADDER is the argument now and it used to be `ship.firePerBeat` written inside.** The
 * missiles read the pulse's list until 2026-08-10 — see `missileEvery` on `ShipRow` for the bug
 * that came out of it — and the fix is two lists rather than two functions, because *a rung is a
 * subdivision of a beat* is the part that must not be written twice.
 *
 * ⚠️ **Clamped on the list rather than trusted.** `tiersOf` already clamps, so a tier past the end can
 * only arrive if the two ever disagree — and the failure it prevents is an `undefined` reaching a
 * division, which is a `NaN` cadence and a gun that never fires again rather than an error anybody
 * would see.
 */
function everyAt(ladder: readonly number[], tier: number): number {
  const rung = tier < 0 ? 0 : tier > ladder.length - 1 ? ladder.length - 1 : tier;
  /*
    ⚠️ **THE TABLE'S OWN NUMBER, WHERE THIS USED TO DIVIDE A MUSIC CONSTANT** —
    `docs/decisions/0159-the-two-clocks-come-apart.md`. It was `STEPS_PER_BEAT / perBeat[rung]`, so
    every cadence in the game was a musical fraction before it was a gameplay quantity and only the
    eight divisors of 24 could be reached. The ladders now say what they mean.
  */
  return ladder[rung]!;
}

/**
 * Steps between the note values the MISSILE cadence is built from, at missile tier `tier`.
 *
 * ⚠️ **Not the missile's cadence — the thing `MISSILE_BEAT_RATIO` multiplies.** The missile fires
 * every five of these, which is what makes it a counter-beat rather than a slower copy of the gun
 * (`docs/decisions/0093-the-gun-is-on-the-grid.md`), and keeping the ratio outside this is what keeps
 * *slower than the pulse* true at every rung by construction rather than by tuning.
 */
export function missileEveryAt(missile: MissileRow, tier: number): number {
  return everyAt(missile.missileEvery, tier);
}

/**
 * How many pulse-gaps there are to a missile. The counter-beat, written down.
 *
 * ⚠️ **Five, and it is the number the play-test heard rather than one anybody picked** —
 * `docs/decisions/0093-the-gun-is-on-the-grid.md`. *"The missile fire provided a great
 * counter-beat"*, said about a build where two unrelated interpolations happened to sit about five
 * apart. Five against a beat divided in three, four or six never lands on the same instant twice
 * inside a bar, which is what a counter-beat IS.
 *
 * ⚠️ **It also keeps `docs/decisions/0051-a-missile-is-the-second-auto-weapon.md`'s *slower than the
 * pulse* true at every rung by construction**, where two separate ladders could each be tuned into
 * violating it.
 */
export const MISSILE_BEAT_RATIO = 5;

/**
 * Whether another pickup of `kind` would still change this ship.
 *
 * ⚠️ **THE single description of a ladder's stop condition**, asked in two places that must agree:
 * `src/app/mount.ts` uses it to decide whether the pickup the player just flew into is an upgrade or
 * a bomb, and `tests/shields.test.ts` holds it against `weaponFor` rung by rung. Two copies of *is it
 * full* would be a pickup that vanished into a list without changing anything, which is the rule this
 * whole mechanism exists to keep.
 *
 * ⚠️ **A ladder is full at `UPGRADE_TIERS` and at nothing else**, which is the whole point of the
 * tier count being stated: there is no arithmetic here to disagree with the arithmetic above.
 */
export function upgradeGrows(upgrades: readonly UpgradeKind[], kind: UpgradeKind): boolean {
  return tiersOf(upgrades, kind) < UPGRADE_TIERS;
}

/**
 * What taking `kind` actually does to a ship already carrying `upgrades`.
 *
 * ── AN UPGRADE PICKUP AT ITS CAP IS A BOMB, AND THAT IS A FACT ABOUT THE TABLE ───────────────────
 *
 * `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md`. Reported from play: *"max speed
 * auto-fire is way too strong for the current game - when you get max speed nothing is a challenge,
 * bosses die in less a second and they are supposed to be tough."*
 *
 * ⚠️ **`PICKUPS[kind].effect` is what a pickup does in general and this is what it does to YOU**, and
 * the difference is one upgrade wide. The row cannot answer it — 0016 says behaviour rides the row,
 * and *is this player's weapon full* is not a property of the row — so the row keeps the general
 * answer and this narrows it against the ship.
 *
 * ⚠️ **HERE rather than in `src/app/mount.ts`, and it was there first.** As a branch in the shell it
 * was a content rule living in the one layer no unit test can reach without a DOM, so the rule that
 * pays for deleting the unbounded damage had nothing holding it. `tests/shields.test.ts` drives this
 * directly. The shell keeps what is genuinely its own: which action a given effect dispatches.
 *
 * ⚠️ **Returns an EFFECT rather than an action, so nothing in `src/content/` grows an opinion about
 * the reducer** — and no allocation, which keeps it usable from anywhere.
 *
 * ⚠️ **PER LADDER since 0083, and it takes the upgrade LIST rather than the resolved weapon.** Two
 * ladders cap at different times, so *is this pickup still worth taking* is a question about the kind
 * in the player's hand and not about the ship as a whole — a resolved `Weapon` cannot answer it,
 * because a maxed pulse and an empty missile rack look the same to it from one side.
 */
/*
  ⚠️ **AND THE FACE, SINCE 0233.** A missile pickup offering a tube the ship is not carrying is an
  upgrade whatever the ladder says, because taking it SWITCHES (`src/state/slices/run.ts`). Only a
  pickup offering the tube already fitted can be full. The weapon pickup this said first is the bomb
  pickup since 0441, whose effect is always a special.
*/
export function effectOf(kind: PickupKind, face: number, loadout: Loadout): PickupEffect {
  const effect = PICKUPS[kind].effect;
  // A shield pickup showing a ward face is a charge, not armour — 0447.
  if (effect === 'shield') return face > 0 ? 'special' : 'shield';
  if (effect !== 'upgrade' || !isUpgrade(kind)) return effect;
  if (missileFaceOf(face) !== loadout.missile) return 'upgrade';
  return upgradeGrows(loadout.upgrades, kind) ? 'upgrade' : 'special';
}

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
   * ── IT USED TO CLIMB WITHOUT A CEILING, AND THAT WAS THE REPORTED DEFECT ────────────────────────
   *
   * ⚠️ **A CONSTANT now — the ship's own shot row, whatever it is carrying.** This was where an
   * upgrade went once barrels and fire rate were capped, on `docs/game.md`'s grounds that *"an upgrade
   * that cannot change the outcome is worse than none"*. Nothing bounded it, so the twelfth pickup was
   * worth exactly as much as the fifth and the curve never flattened — reported from play as *"max
   * speed auto-fire is way too strong for the current game - when you get max speed nothing is a
   * challenge, bosses die in less a second and they are supposed to be tough."*
   *
   * ⚠️ **The rule it was serving is kept and paid for elsewhere**, which is why this is a deletion
   * rather than a cap: a weapon pickup with nowhere left to go becomes a **bomb charge**, so it still
   * changes the outcome and it does it in a currency the player spends rather than one that fires
   * itself. `overflowOf` above, and
   * `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md`.
   */
  damage: number;
  /*
    ── `tier` WAS HERE — WHICH OF THREE HULLS, FROM BOTH LADDERS TOGETHER — AND 0441 TOOK IT ────────

    It was `(gun + tubes) / 2`, so the hull climbed with either ladder (0081, 0083). The gun has no
    ladder now, so the hull is a function of the tubes alone, and `launchers` above is already that
    number: `hullFor` in `src/content/ships.ts` reads it. A ship with no tubes is the bare hull, one
    tube puts one on the keel, two put them on the wings.
  */
  /**
   * Which gun and which tube this is — 0233. The frame switches on `flight` and `guidance`, never on
   * either name.
   */
  kind: WeaponKind;
  missile: MissileKind;
  flight: FlightKind;
  guidance: GuidanceKind;
  /** How many targets one bolt lands on. One for a weapon that does not chain. */
  links: number;
  /**
   * How far the first hit reaches, in world units, and what a jump after it keeps of the jump
   * before it — 0302. Zero for a weapon that does not chain. `reach` is also the length a bolt with
   * nothing in front of it is DRAWN at, so the gun states its own range on screen.
   */
  reach: number;
  falloff: number;
  /** How far a coiling shot swings from its axis, and radians its swing advances per step — 0234, 0244. Zero otherwise. */
  coil: number;
  turn: number;
  /** The most a missile turns toward its target per step, in radians — 0235. Zero for one that flies straight. */
  seek: number;
  /** Steps a missile burns for before it goes out — 0246. Zero for one that lives to the edge of the view. */
  fuse: number;
}

/*
  ── `RAPID_FACTOR` AND `MISSILE_FACTOR` WERE HERE, AND `UPGRADE_TIERS` REPLACED BOTH ─────────────

  They were 0.78 and 0.85: the fraction of the gap between shots each upgrade removed, floored so
  that *an upgrade is always worth taking and never a win button* — a constant subtraction reaches
  zero and then negative, where a fraction approaches a floor and never crosses it. That argument was
  right and `rung` keeps it: interpolating to a floor never crosses it either.

  ⚠️ **What the fractions could not do is say how many tiers a weapon has.** *"Four tiers for
  weapons, four tiers for missiles"* (0083) is a statement about the count, and under a fraction the
  count was whatever `round(9 × 0.78ⁿ) ≥ 4` produced — three, as it happened, with nothing anywhere
  saying so and no guard able to notice when a tuned base changed it.

  ⚠️ **The two being DIFFERENT had a job that has also gone.** *"A missile is worth three pulses, so
  the same 0.78 would put three times the damage on the same curve and the pulse would stop mattering
  by the third pickup"* — true when one pickup advanced both weapons at once (0082). They are two
  pickups again, so what balances them is how many of each a level offers: four weapons against two
  missiles, which `src/content/levels.ts` authors and this file does not get an opinion about.
*/

/**
 * The fastest the base weapon may ever fire, in steps between volleys.
 *
 * ⚠️ Not a balance number — a **legibility** one. `src/app/frame.ts` records that successive shots
 * connect 6 to 7 steps apart and that the impact flash has to finish inside that gap, or two hits
 * produce one picture and the player cannot count them. Firing faster than the flash can resolve
 * makes damage unreadable, which is the bug `docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md`
 * exists to prevent.
 */
export const FASTEST_FIRE = 4;

/*
  ── `MISSILE_FASTEST` WAS HERE AND 0093 DELETED IT, ON `PLAYER_SHOT_LIFE`'s OWN ARGUMENT ─────────

  It was 20: the fastest missiles could leave the ship, and the endpoint
  `rung(ship.missileEvery, MISSILE_FASTEST, tubes)` interpolated towards. A pool number —
  `launchers × flight / missileEvery` under the missile pool, with a missile in flight about 130
  steps on the widest view.

  ⚠️ **`docs/decisions/0093-the-gun-is-on-the-grid.md` made the missile's cadence DERIVED**, so it
  stopped being an input to anything: `MISSILE_BEAT_RATIO × fireEveryAt(ship, tubes)` reaches 20 at
  the cap on its own, and the constant sat beside that arithmetic taking part in none of it.

  ⚠️ **AND `npm run prove` IS WHAT SAID SO, in the words this file already uses about
  `PLAYER_SHOT_LIFE`: one guarantee, one mechanism.** 0051's probe dropped it to 4 and the suite
  stayed GREEN — *"a redundant safety net does not make a system safer; it makes the real mechanism
  untestable"*, and this one had gone the whole way to untestable in a single PR while still reading
  as a rule.

  **What holds the missile's pool now is the thing that always did**: `tests/pickups.test.ts` drives
  the strongest possible loadout and fails if the pool ever fills. What holds the CAP is
  `tests/missiles.test.ts`'s *THE FLOORS*, which asserts the two ladders land on their last rung
  together rather than asserting a number against itself.
*/

/**
 * The most launchers a ship may ever carry.
 *
 * ── IT WAS THREE, AND THAT WAS 0056 LEFT HALF-APPLIED ───────────────────────────────────────────
 *
 * ⚠️ **Three was the ask's own number for a ship that started with one.**
 * `docs/decisions/0051-a-missile-is-the-second-auto-weapon.md`: *"the base ship has one, at the
 * middle; the first upgrade adds one on the `across`-minus side and the second on the `across`-plus
 * side"* — three POSITIONS on the hull, of which the player found two.
 *
 * ⚠️ **`docs/decisions/0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md` then took the
 * base launcher away and did not move this.** Its ask was *"default missile tubes should be 0 and
 * increase to 1 then to 2"*, so the run now reaches a rung the ask does not have — reported from play
 * as *"after a player's first death, the player can then have 3 missile tubes instead of being capped
 * at two"*, and a death is where it shows because that is when a player has found three of them.
 * `docs/decisions/0077-a-pickup-arrives-rather-than-stopping.md`.
 *
 * ⚠️ **The two positions are SYMMETRIC, which the old ordering was not.** One tube is the
 * centreline; two are the wings. Keeping *centre, then minus, then plus* and simply stopping at two
 * would leave a fully-upgraded ship firing off-centre, which is a worse picture than the one being
 * fixed — `src/app/frame.ts`'s `fireMissiles` places them.
 */
export const MAX_LAUNCHERS = 2;

/** Radians between neighbouring barrels. Wide enough to see, narrow enough to still hit one thing. */
export const SPREAD_STEP = 0.13;

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
export const MAX_BARRELS = 4;

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
 * `(MAX_ALONG_SPAN − SHIP_START_ALONG) / pulse speed` — 96 steps, rounded up, since
 * `docs/decisions/0364-the-view-zooms-out.md` took the widest view from 240 units to 288. It was 80.
 */
export const PLAYER_SHOT_LIFE = 96;

/**
 * The ship's auto-fire, given what it is carrying.
 *
 * Pure, and a function of the whole list rather than of a running total — so it can be recomputed
 * from a saved run, and so a death clearing the list restores the base weapon with no second
 * description of what the base weapon was.
 */
export function weaponFor(ship: ShipRow, upgrades: readonly UpgradeKind[], missile: MissileKind = ship.missile): Weapon {
  /*
    ── THE GUN IS THE SHIP'S AND THE TUBES ARE A LADDER — 0441 ─────────────────────────────────────

    `docs/decisions/0083-two-ladders-of-four.md` made two ladders, each a pure function of its own
    tier; `docs/decisions/0441-a-pilot-flies-their-own-ship.md` took the gun's away. The gun is read
    straight off the ship's row, as the cap of its old ladder (`src/content/weapons.ts`), and the
    tubes still climb: `missile` defaults to the ship's tube, and the run slice passes the one fitted.

    ⚠️ **No accumulation, so there is nothing for a longer list to do.** A tier is a count, `tiersOf`
    clamps it, and everything below is arithmetic on that — so a list carrying twenty missiles
    resolves to exactly the same ship as one carrying four.

    ⚠️ **`damage` never climbs**: it is the shot row's times the gun's weight, which is 0082's
    max-speed nerf kept — see `damage` on the `Weapon` interface.
  */
  const gunRow = WEAPONS[ship.weapon];
  const tubeRow = MISSILES[missile];
  const tubes = tiersOf(upgrades, 'missile');

  /*
    ⚠️ **`MAX_BARRELS` is a pool budget rather than a taste** — `barrels × PLAYER_SHOT_LIFE /
    FASTEST_FIRE ≤ pool`, and five barrels is exactly 100 against a pool of 100. Clamped here, so a row
    that asked for more is a row that gets the budget.
  */
  const shots = gunRow.barrels > MAX_BARRELS ? MAX_BARRELS : gunRow.barrels;
  /*
    ── ONE TUBE, THEN TWO, AND IT WAS `rung(0, MAX_LAUNCHERS, tubes)` ─────────────────────────────

    ⚠️ **Reported from play, 2026-08-10: *"missile tubes don't get a second firing till like the 3rd
    upgrade."*** Exactly right, and it was arithmetic rather than a tuned number: `rung` spreads a
    count evenly across `UPGRADE_TIERS`, so 0 → 2 over four rungs rounds to 0, **1, 1, 2**, 2 and the
    second tube waited for the third pickup.

    ⚠️ **A count, capped — not interpolated.** *"Max of two tubes"*
    (`docs/decisions/0083-two-ladders-of-four.md`) is a ceiling on a place on the hull, and the ask
    reads the rungs off directly: one tube, then two, then the cap holds while the rate climbs. The
    list is the missile kind's own since 0233, and the cap still stands over whatever it says.
  */
  const tubesAt = everyAt(tubeRow.launchers, tubes);
  const launchers = tubesAt > MAX_LAUNCHERS ? MAX_LAUNCHERS : tubesAt;

  /*
    ⚠️ **A CADENCE IS AN AUTHORED NUMBER OF STEPS**, floored by `FASTEST_FIRE`, which is a legibility
    number rather than a balance one (`src/app/frame.ts` needs the impact flash to finish between
    hits) — `docs/decisions/0093-the-gun-is-on-the-grid.md`, `0159-the-two-clocks-come-apart.md`.
    `tests/pickups.test.ts` holds every gun to a whole number of steps at or over the floor.
  */
  const fireEvery = gunRow.fireEvery;
  /*
    ⚠️ **DERIVED FROM A NOTE VALUE, WHICH MAKES THE 5:1 CROSS-RHYTHM DELIBERATE.** It was an accident
    and the play-test heard it: *"the missile fire provided a great counter-beat."* Written down, it
    cannot drift.
  */
  const missileEvery = MISSILE_BEAT_RATIO * missileEveryAt(tubeRow, tubes);

  const damage = SHOTS[gunRow.shot].damage * gunRow.weight;
  const missileDamage = SHOTS[tubeRow.shot].damage;
  return {
    fireEvery,
    shots,
    spread: SPREAD_STEP * (shots - 1),
    damage,
    missileEvery,
    launchers,
    missileDamage,
    kind: ship.weapon,
    missile,
    flight: gunRow.flight,
    guidance: tubeRow.guidance,
    links: gunRow.links,
    reach: gunRow.reach,
    falloff: gunRow.falloff,
    coil: gunRow.coil,
    turn: gunRow.turn,
    seek: tubeRow.seek,
    fuse: tubeRow.fuse,
  };
}
