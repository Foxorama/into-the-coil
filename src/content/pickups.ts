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
import type { SpecialKind } from './specials.ts';
import { SPRITE } from './sprites.ts';
import { WEAPONS, WEAPON_KINDS, type FlightKind, type WeaponKind, type WeaponRow } from './weapons.ts';
import { MISSILES, MISSILE_KINDS, type GuidanceKind, type MissileKind, type MissileRow } from './missiles.ts';

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
 * ⚠️ **`bomb` is the third, and it is what the merge freed room for.** `docs/game.md` has *"more
 * specials, found during the run"*; `src/state/slices/run.ts` has carried a `took` action since 0039
 * with nothing that dispatches it; and
 * `docs/decisions/0053-the-bomb-is-the-first-thing-the-player-spends.md` left *how a player gets more
 * bombs* to level clears alone. One row closes all three.
 */
export const PICKUP_KINDS = ['weapon', 'missile', 'shield', 'bomb'] as const;

/** Derived from the list, so a pickup cannot exist in the union and be missing from the table. */
export type PickupKind = (typeof PICKUP_KINDS)[number];

/**
 * What taking one does.
 *
 * ⚠️ A closed union, and it earns being one where `src/content/enemies.ts`'s weave deliberately did
 * not: these are not the same effect with a different parameter. Each is a different FIELD, cleared
 * by a different event, and no value of one produces another.
 *
 *   **upgrade**  an entry in a list on the ship. Lost on a death — 0039
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
  effect: PickupEffect;
  /**
   * What it looks like, in cycle order — one sprite per thing it can be offering.
   *
   * ── A PICKUP CYCLES BETWEEN KINDS, AND A FACE IS WHICH ONE IT IS SHOWING ────────────────────────
   *
   * `docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md`. Asked for: *"the weapon power
   * ups need to cycle between the weapons with about a 2sec time… so that they can make a choice and
   * collect that weapon upgrade."* The weapon pickup's faces are the guns and the missile pickup's
   * are the tubes, in the order their tables list them; a shield and a bomb have one face each and
   * never turn.
   *
   * ⚠️ **`sprite` is `faces[0]`, held by `tests/weapons.test.ts` rather than derived**, because the
   * `Body` a pickup is spawned from is what `reset` copies and the title screen's key reads — and
   * a first face that differed from the row's own sprite would be a pickup that changed on the step
   * after it appeared.
   *
   * ⚠️ **This is the cycle 0082 removed, one level down** — between kinds of ONE ladder rather than
   * between a gun and a shield, which is the version 0083 said was coming and the argument against
   * 0052 always allowed: a player watching the faces turn is choosing a gun, not gambling a shield.
   */
  faces: readonly number[];
}

/**
 * Sim steps a cycling pickup shows each face for. *"About a 2sec time."*
 *
 * ⚠️ **Steps rather than seconds, because the cycle is a thing the player reads off the field and
 * the field steps at 60Hz** — 0022. Two seconds is long enough to read a glyph at pickup size and
 * decide; a face that turned faster would be a coin the player could not call.
 *
 * ⚠️ **THREE SECONDS, AND IT WAS TWO — the first play-test's own number.** Reported 2026-09-05:
 * *"the rotation needs to be 1sec longer, it takes too long to fly to the pickup and it changes just
 * before you grab it to the wrong weapon all the time."* A face has to outlast the crossing a player
 * makes for it, from wherever they were when they chose; two seconds was the time to read it and not
 * the time to reach it. `docs/decisions/0236-the-guns-answer-the-first-play-test.md`.
 */
export const PICKUP_CYCLE_STEPS = 180;

/**
 * How many full cycles a pickup stays for, at least. *"Long enough that the player can see at least
 * 2 repetitions of each weapon so that they can make a choice."*
 *
 * `src/app/frame.ts` sizes the wait from this and the face count, so a third weapon kind lengthens
 * the wait on its own — the promise is about repetitions and not about seconds.
 */
export const PICKUP_REPEATS = 2;

export const PICKUPS: Record<PickupKind, PickupRow> = {
  /**
   * THE WEAPON, AND EVERY REPEAT RAISES TIER AND RATE TOGETHER.
   *
   * ⚠️ **One kind where there were four**, and the ask says why: *"there's just too many power ups for
   * these to be separate things."* What it does is `weaponFor`'s ladder, which is the single
   * description of *together* — the row carries no numbers, exactly as 0016 intends.
   *
   * ⚠️ **`docs/game.md`'s *"we haven't implemented other weapons yet"* is the shape this is built
   * for.** The ask calls it *"the weapon change power up"*, so a second weapon added later is a
   * different ladder under the same silhouette rather than a fifth pickup beside it.
   */
  weapon: {
    sprite: SPRITE.pickupWeapon,
    spriteHit: SPRITE.pickupWeapon,
    // ⚠️ Half its extent in `src/content/sprites.ts`, and that holds for all three rows below —
    // `docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md` makes the picture the
    // hurtbox, so the three sizes 0082 gave the pickups are three hurtboxes as well as three targets.
    radius: 3,
    // A pickup is not a body that fights. One health and no damage: it is taken, never destroyed,
    // and it is in no collision pairing that could hurt anything.
    health: 1,
    damage: 0,
    label: 'Weapon',
    hint: 'Guns up a tier',
    effect: 'upgrade',
    // Every gun, in the guns' own order — 0233. The title screen's key lists each face by name.
    faces: WEAPON_KINDS.map((k) => WEAPONS[k].pickup),
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
    effect: 'upgrade',
    faces: MISSILE_KINDS.map((k) => MISSILES[k].pickup),
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
   */
  shield: {
    sprite: SPRITE.pickupShield,
    spriteHit: SPRITE.pickupShield,
    radius: 2.5,
    health: 1,
    damage: 0,
    label: 'Shield',
    hint: 'One hit absorbed',
    effect: 'shield',
    faces: [SPRITE.pickupShield],
  },
  /**
   * CHARGES FOR THE ARSENAL — the first pickup the player has to decide when to use.
   *
   * ⚠️ **It cashes three things that had been left open in three different places.** `docs/game.md`
   * wants *"more specials, found during the run"*; `src/state/slices/run.ts` has carried a `took`
   * action since 0039 with nothing that dispatches it; and 0053 left *how a player gets more bombs*
   * to level clears alone. `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md`.
   *
   * ⚠️ **How many charges it grants is `src/content/specials.ts`'s answer, not this row's** — `took`
   * reads `SPECIALS[kind].charges`, which is 2. So a bomb pickup is worth a level clear twice over,
   * which is a play-test number and is written down as one in 0082.
   */
  bomb: {
    sprite: SPRITE.pickupBomb,
    spriteHit: SPRITE.pickupBomb,
    radius: 2.2,
    health: 1,
    damage: 0,
    label: 'Bomb',
    // ⚠️ **Not *"two more charges"*, which is what this said first.** How many a pickup grants is
    // `SPECIALS.bomb.charges`, and a hint that spells the number out is a second description of it —
    // the day that row is tuned, the title screen goes on telling the player the old one.
    hint: 'Charges to spend',
    effect: 'special',
    faces: [SPRITE.pickupBomb],
  },
};

/**
 * What a ship is carrying: the two ladders and which kind each one is fitted with.
 *
 * ⚠️ **The run slice's own shape, named here so content can read it without importing state** —
 * `src/state/slices/run.ts` satisfies it structurally, and `weaponFor` and `effectOf` take it rather
 * than four loose arguments that have to be passed in the right order.
 */
export interface Loadout {
  upgrades: readonly UpgradeKind[];
  weapon: WeaponKind;
  missile: MissileKind;
}

/**
 * The gun a weapon pickup showing `face` is offering, and the tube a missile pickup is offering.
 *
 * ⚠️ **Clamped onto the list rather than trusted**, on `everyAt`'s terms: a face past the end can
 * only arrive if a pickup's entity and its row ever disagree, and the failure it prevents is an
 * `undefined` reaching the reducer as a weapon kind.
 */
export function weaponFaceOf(face: number): WeaponKind {
  return WEAPON_KINDS[face < 0 ? 0 : face >= WEAPON_KINDS.length ? WEAPON_KINDS.length - 1 : face]!;
}

export function missileFaceOf(face: number): MissileKind {
  return MISSILE_KINDS[face < 0 ? 0 : face >= MISSILE_KINDS.length ? MISSILE_KINDS.length - 1 : face]!;
}

/**
 * What a pickup showing `face` is called and what it does — for the title screen's key, which lists
 * every face of a cycling pickup rather than the row once.
 */
export function faceOf(kind: PickupKind, face: number): { label: string; hint: string } {
  if (kind === 'weapon') return WEAPONS[weaponFaceOf(face)];
  if (kind === 'missile') return MISSILES[missileFaceOf(face)];
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
 * ⚠️ **TWO MEMBERS, and they are two independent ladders.** A player can be tier 4 on the pulse and
 * tier 2 on the missiles, which is exactly what `docs/decisions/0083-two-ladders-of-four.md` authors
 * level one to produce.
 */
export const UPGRADE_KINDS = ['weapon', 'missile'] as const;

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
 */
export const WEAPON_OVERFLOW: SpecialKind = 'bomb';

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

/** Steps between volleys of `weapon` at tier `tier`. */
export function fireEveryAt(weapon: WeaponRow, tier: number): number {
  return everyAt(weapon.fireEvery, tier);
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
  ⚠️ **AND THE FACE, SINCE 0233.** A weapon pickup offering a gun the ship is not carrying is an
  upgrade whatever the ladder says, because taking it SWITCHES — the ladder it lands on is a fresh
  one (`src/state/slices/run.ts`). Only a pickup offering the gun already fitted can be full.
*/
export function effectOf(kind: PickupKind, face: number, loadout: Loadout): PickupEffect {
  const effect = PICKUPS[kind].effect;
  if (effect !== 'upgrade' || !isUpgrade(kind)) return effect;
  if (kind === 'weapon' && weaponFaceOf(face) !== loadout.weapon) return 'upgrade';
  if (kind === 'missile' && missileFaceOf(face) !== loadout.missile) return 'upgrade';
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
   * itself. `WEAPON_OVERFLOW` above, and
   * `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md`.
   */
  damage: number;
  /**
   * Which hull the ship is drawn as: `0`, `1` or `2`.
   *
   * ── AN UPGRADE HAS TO SHOW, AND FOR A LONG TIME NONE OF THEM DID ────────────────────────────────
   *
   * Reported from play: *"additional autofire and missile upgrades don't change the look of the
   * player's ship."* `docs/game.md` makes it a rule — *"every upgrade changes how the ship looks on
   * screen"* — and the ship had one silhouette from the first pickup to the last.
   * `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md`.
   *
   * ⚠️ **On the resolved WEAPON rather than counted at the call site**, for the reason every other
   * field here is: it is a pure function of the upgrade list, it is recomputed only when that list
   * moves, and `src/app/frame.ts` may not walk a list sixty times a second. It also means a death
   * puts the hull back with no second description of what the base ship looks like — an empty list
   * resolves to tier 0, exactly as it resolves to the base weapon.
   *
   * ⚠️ **A NUMBER rather than a sprite index, because `content/pickups.ts` has no business naming
   * art.** Which bitmap a tier is is `src/content/ships.ts`'s answer, and that is where `hullFor`
   * lives.
   */
  tier: number;
  /**
   * Which gun and which tube this is — 0233. The hull is a function of `kind` and `tier` together
   * (`hullFor` in `src/content/ships.ts`), and the frame switches on `flight` and `guidance`, never
   * on either name.
   */
  kind: WeaponKind;
  missile: MissileKind;
  flight: FlightKind;
  guidance: GuidanceKind;
  /** How many targets one bolt lands on. One for a weapon that does not chain. */
  links: number;
  /** How far one bolt can jump, in world units. Zero for a weapon that does not chain. */
  reach: number;
  /** How far a coiling shot swings from its axis, and radians its swing advances per step — 0234, 0244. Zero otherwise. */
  coil: number;
  turn: number;
  /** The most a missile turns toward its target per step, in radians — 0235. Zero for one that flies straight. */
  seek: number;
}

/**
 * How many upgrades each hull tier is worth.
 *
 * ⚠️ **Two, so the first tier arrives early enough to teach the rule.** A player who has taken one
 * pickup and seen nothing change learns that pickups do not change the ship, and never looks again.
 * At two, the second thing they pick up says otherwise.
 *
 * A starting point on `docs/decisions/0037-the-ship-has-mass.md`'s terms; nothing asserts on it.
 */
const UPGRADES_PER_TIER = 2;

/** The most hull tiers there are — the last one is what everything past it also gets. */
export const MAX_HULL_TIER = 2;

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
export function weaponFor(
  ship: ShipRow,
  upgrades: readonly UpgradeKind[],
  weapon: WeaponKind = ship.weapon,
  missile: MissileKind = ship.missile,
): Weapon {
  /*
    ── TWO LADDERS, EACH A PURE FUNCTION OF ITS OWN TIER — AND IT WAS A LOOP ──────────────────────

    `docs/decisions/0083-two-ladders-of-four.md`. Asked for: *"4 tiers for weapons, 4 tiers for
    missiles… weapon upgrades - upgrade barrels and fire speed; missile upgrades - add missile tubes
    and upgrade missile speed -> max of two tubes and 4 speed rate."*

    ⚠️ **No accumulation, so there is nothing for a longer list to do.** The old shape walked the
    upgrades applying a fraction per entry, which made *how many tiers is a weapon* an emergent
    property of a float and needed a `continue` to defend against a list longer than the shell would
    build. A tier is now a count, `tiersOf` clamps it, and everything below is arithmetic on that —
    so a saved run carrying twenty weapons resolves to exactly the same ship as one carrying four.

    ⚠️ **AND THE LADDERS ARE THE KIND'S, SINCE 0233.** `weapon` and `missile` default to the ship's
    base kinds, so `weaponFor(ship, [])` is still the one description of what an unupgraded ship
    fires; the run slice passes the kinds it has fitted. The same list resolves to a different ship
    under a different kind, which is the whole of what switching guns means.

    ⚠️ **`damage` is a ladder CAPPED at its last rung and that is the max-speed nerf kept.** The
    pulse's weight ladder is ones — see `damage` on the `Weapon` interface for what replaced the rule
    that let it climb without a ceiling. A bolt's climbs, and stops.
  */
  const gunRow = WEAPONS[weapon];
  const tubeRow = MISSILES[missile];
  const gun = tiersOf(upgrades, 'weapon');
  const tubes = tiersOf(upgrades, 'missile');

  /*
    ⚠️ **Barrels run 1 → `MAX_BARRELS` across four tiers, so one of the four buys rate alone.** Four
    is a pool budget rather than a taste — `barrels × PLAYER_SHOT_LIFE / FASTEST_FIRE ≤ pool`, and
    five barrels is exactly 100 against a pool of 100. The ask's *four tiers* and the pool's *four
    barrels* are different fours.

    ⚠️ **THE BARRELS ARE A LIST ON THE KIND AND THEY WERE `rung(1, MAX_BARRELS, gun)`** —
    `docs/decisions/0093-the-gun-is-on-the-grid.md`. Interpolation gave 1, 2, 3, 3, 4, which was fine
    while the rate moved at every tier and is not now. `docs/game.md`'s *every upgrade is worth
    taking* is what the fourth barrel buys.
  */
  const shots = everyAt(gunRow.barrels, gun);
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
    ── EACH CADENCE IS A NOTE VALUE, AND BOTH USED TO BE INTERPOLATED TO A FLOOR ──────────────────

    `docs/decisions/0093-the-gun-is-on-the-grid.md`. The floors are unchanged and both are still
    floor rather than a target: `FASTEST_FIRE` is a legibility number (`src/app/frame.ts` needs the
    impact flash to finish between hits). What changed is that a rung is an authored number rather
    than a point on a line.

    ⚠️ **IT WAS *a fraction of a beat* UNTIL 0159 AND IS NOW SIMPLY A CADENCE** —
    `docs/decisions/0159-the-two-clocks-come-apart.md`.

    ⚠️ **`tests/pickups.test.ts` holds every rung of EVERY ladder to a whole number of steps and to
    never getting slower.** The divisor rule was providing both for free, which is the thing to look
    for whenever a constraint is dropped.
  */
  const fireEvery = fireEveryAt(gunRow, gun);
  /*
    ⚠️ **DERIVED FROM A NOTE VALUE, WHICH MAKES THE 5:1 CROSS-RHYTHM DELIBERATE.** It was an accident
    and the play-test heard it: *"the missile fire provided a great counter-beat."* Written down, it
    cannot drift.
  */
  const missileEvery = MISSILE_BEAT_RATIO * missileEveryAt(tubeRow, tubes);

  const damage = SHOTS[gunRow.shot].damage * everyAt(gunRow.weight, gun);
  const missileDamage = SHOTS[tubeRow.shot].damage;
  return {
    fireEvery,
    shots,
    spread: SPREAD_STEP * (shots - 1),
    damage,
    missileEvery,
    launchers,
    missileDamage,
    kind: weapon,
    missile,
    flight: gunRow.flight,
    guidance: tubeRow.guidance,
    links: everyAt(gunRow.links, gun),
    reach: everyAt(gunRow.reach, gun),
    coil: everyAt(gunRow.coil, gun),
    turn: gunRow.turn,
    seek: tubeRow.seek,
    /*
      ⚠️ **Counted over the two LADDERS rather than over the raw list** — 0081's rule, 0083's
      arithmetic. A player who spends four upgrades on missiles has upgraded exactly as much as one
      who spent them on the pulse, and a hull keyed to barrels alone would tell the first of them
      nothing.

      ⚠️ **`gun + tubes` and it was `upgrades.length`, which is the same number right up until a
      ladder caps.** A run that finds a fifth weapon pickup with the guns full has not upgraded again
      — the shell turns that one into a bomb charge — so counting the list would climb the hull for a
      pickup that changed no part of the ship. The clamp is still here because eight tiers is more
      than there are hulls.
    */
    tier: Math.min(MAX_HULL_TIER, Math.floor((gun + tubes) / UPGRADES_PER_TIER)),
  };
}
