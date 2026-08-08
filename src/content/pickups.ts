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
import type { SpecialKind } from './specials.ts';
import { SPRITE } from './sprites.ts';

/**
 * Every pickup in the game. Closed.
 *
 * ── IT WAS SIX AND IT IS THREE ──────────────────────────────────────────────────────────────────
 *
 * `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md`. Reported from play: *"power ups are
 * too common still and these are premium game pieces that are the lynchpin of whether this game is
 * actually good or not"*, and *"too many varieties and it's overwhelming and weak."*
 *
 * ⚠️ **`rapid`, `spread`, `missileRate` and `missileSpread` are ONE kind now**, which is the ask's own
 * words: *"rapid fire/rapid missiles rapid whatever else we add need to be combined into one power up
 * — which is the weapon change power up… picking up a second of the same weapon needs to increase
 * it's tier and rate of fire together."* `weaponFor` below is where *together* lives.
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
export const PICKUP_KINDS = ['weapon', 'shield', 'bomb'] as const;

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
}

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
  },
};

/**
 * Every pickup whose effect is an entry in the ship's upgrade list.
 *
 * ⚠️ **Written out, and then CHECKED against the table rather than trusted.** It was a hand-written
 * union beside a table that already says `effect: 'upgrade'`, which is two descriptions of one fact —
 * and the shell narrowed to it with a ternary on one name, so a third upgrade would have been
 * silently filed as the other one. `tests/shields.test.ts` holds the two in step.
 *
 * ⚠️ **ONE MEMBER, and it stays a list rather than becoming a constant.** 0082 merged four kinds into
 * one; `docs/game.md`'s *"we haven't implemented other weapons yet"* is the reason the shape that held
 * four is kept for one. A `UpgradeKind = 'weapon'` type alias would make the second weapon a change to
 * every signature that mentions it.
 */
export const UPGRADE_KINDS = ['weapon'] as const;

/** Every pickup whose effect is on the ship rather than on the run. */
export type UpgradeKind = (typeof UPGRADE_KINDS)[number];

/**
 * Which special a weapon pickup becomes once the weapon can take no more.
 *
 * ⚠️ **The cap and the thing an upgrade becomes are ONE decision, and this is the half that is
 * content.** `docs/game.md` says *"an upgrade that cannot change the outcome is worse than none"*, and
 * the old answer to that was an unbounded `damage++` — which is exactly the reported defect *"max
 * speed auto-fire is way too strong for the current game… bosses die in less a second."*
 * `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md` takes the other option the report
 * named: a cap, **plus something else for an upgrade to become**.
 */
export const WEAPON_OVERFLOW: SpecialKind = 'bomb';

/**
 * Whether another weapon pickup would still change this ship.
 *
 * ⚠️ **THE single description of the ladder's stop condition**, asked in two places that must agree:
 * `weaponFor`'s loop uses it to know an upgrade had nowhere to go, and `src/app/mount.ts` uses it to
 * decide whether the pickup the player just flew into is a weapon or a bomb. Two copies of *is it
 * full* would be a pickup that vanished into a list without changing anything, which is the rule this
 * whole mechanism exists to keep.
 *
 * ⚠️ **Four arguments rather than a `Weapon`, with a one-line wrapper over it.** The loop asks this
 * of numbers it is part-way through computing, and there is no `Weapon` in existence at that moment —
 * an object literal to satisfy the signature would be an allocation inside a resolve that
 * `docs/decisions/0022-frame-rate-is-a-feature.md` would then have to reason about, and a cast would
 * be a lie about a half-built value.
 */
function grows(fireEvery: number, missileEvery: number, shots: number, launchers: number): boolean {
  return (
    Math.round(fireEvery * RAPID_FACTOR) >= FASTEST_FIRE ||
    Math.round(missileEvery * MISSILE_FACTOR) >= MISSILE_FASTEST ||
    shots < MAX_BARRELS ||
    launchers < MAX_LAUNCHERS
  );
}

/** The same question, of a weapon that has already been resolved. */
export function weaponGrows(weapon: Weapon): boolean {
  return grows(weapon.fireEvery, weapon.missileEvery, weapon.shots, weapon.launchers);
}

/**
 * What taking `kind` actually does to a ship already carrying `weapon`.
 *
 * ── A WEAPON PICKUP AT THE CAP IS A BOMB, AND THAT IS A FACT ABOUT THE TABLE ─────────────────────
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
 */
export function effectOf(kind: PickupKind, weapon: Weapon): PickupEffect {
  const effect = PICKUPS[kind].effect;
  return effect === 'upgrade' && !weaponGrows(weapon) ? 'special' : effect;
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
const MAX_LAUNCHERS = 2;

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
  /*
    ⚠️ **`const`, and it was `let` — that one keyword IS the max-speed nerf.** Both damage numbers
    used to climb without a ceiling once every hardpoint and both cadences were capped. See `damage`
    on the `Weapon` interface for what replaced the rule that put them there.
  */
  const damage = SHOTS[ship.shot].damage;
  let missileEvery = ship.missileEvery;
  /*
    ⚠️ **ZERO, and this is the amendment to
    `docs/decisions/0051-a-missile-is-the-second-auto-weapon.md`.** 0051 gave the base ship one tube
    at the centreline, so every run began with both weapons and the first launcher pickup was the
    *second* one. Reported from play: *"missile secondary weapon keeps a missile tube on the player
    ship, default missile tubes should be 0 and increase to 1 then to 2."*

    ⚠️ **It makes the missile an EARNED weapon rather than a second default**, which is a real change
    to what a run opens as — see `docs/decisions/0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md`.
    Everything 0051 says about launchers being POSITIONS still holds; there is now a rung below its
    first one. It also means a death, which empties the upgrade list, takes the missiles with it.
  */
  let launchers = 0;
  const missileDamage = SHOTS[ship.missile].damage;
  for (let i = 0; i < upgrades.length; i++) {
    /*
      ── ONE PICKUP MOVES A RATE AND A HARDPOINT, WHICH IS THE ASK'S *TOGETHER* ────────────────────

      ⚠️ **Every rung advances BOTH weapons' cadence and one hardpoint**, rather than each pickup
      picking a lane. *"Picking up a second of the same weapon needs to increase it's tier and rate of
      fire together."* Four kinds each nudging one number is what that sentence is written against.

      ⚠️ **An upgrade past every cap is not applied here at all.** It never reaches this list: the
      shell asks `weaponGrows` first and dispatches a bomb charge instead
      (`src/app/mount.ts`), so `weaponFor` stays a pure resolve of a list every entry of which did
      something. The `continue` is the belt to that braces — a saved run, or a test, may hand this
      function a longer list than the shell would ever have built.
    */
    if (!grows(fireEvery, missileEvery, shots, launchers)) continue;

    // Both cadences, each stopped at its own floor rather than at a shared one — a missile is worth
    // three pulses, so the same factor on both would let the pulse stop mattering by the third rung.
    const faster = Math.round(fireEvery * RAPID_FACTOR);
    if (faster >= FASTEST_FIRE) fireEvery = faster;
    const fasterMissiles = Math.round(missileEvery * MISSILE_FACTOR);
    if (fasterMissiles >= MISSILE_FASTEST) missileEvery = fasterMissiles;

    /*
      ⚠️ **The hardpoint goes to whichever side is proportionally further from its own cap**, so the
      two fill together rather than one filling first. Written as a cross-multiplication to keep it in
      integers: `launchers / MAX_LAUNCHERS ≤ (shots − 1) / MAX_BARRELS`.

      ⚠️ **A ship starts at zero launchers, so the FIRST rung is the missile weapon arriving** —
      `docs/decisions/0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md` said the missile
      is found rather than carried, and merging the kinds must not quietly hand it back at rung three.
      The order the ladder produces is launcher, barrel, barrel, launcher, barrel — five rungs to a
      full ship.

      ⚠️ **`MAX_LAUNCHERS` APPEARS TWICE — here and in `grows` — AND NEITHER IS REDUNDANT.** `npm run
      prove` removed this one and the suite stayed green, which looks like a bound nothing is testing
      and is not: `grows` uses it to decide whether the LOOP should still run, and this uses it to
      decide which hardpoint a rung buys. At the current constants `grows` happens to stop the loop
      first, so breaking either occurrence alone is invisible.

      That is worth knowing rather than fixing. The cap is one number with two jobs, which is what
      `MAX_BARRELS` is on the line below as well; what it means is that the PROBE for the launcher cap
      has to break the constant rather than one of its uses — `scripts/probes/0051-missiles.mjs`, and
      that is the shape of the defect that actually shipped (0077: the ceiling was three).
    */
    if (launchers < MAX_LAUNCHERS && launchers * MAX_BARRELS <= (shots - 1) * MAX_LAUNCHERS) launchers++;
    else if (shots < MAX_BARRELS) shots++;
  }
  return {
    fireEvery,
    shots,
    spread: SPREAD_STEP * (shots - 1),
    damage,
    missileEvery,
    launchers,
    missileDamage,
    /*
      ⚠️ **Counted over the whole list rather than over barrels** — 0081. A player who spends four
      upgrades on missiles has upgraded exactly as much as one who spent them on the pulse, and a
      hull keyed to barrels alone would tell the first of them nothing. Clamped, because the list is
      unbounded and the hulls are not.
    */
    tier: Math.min(MAX_HULL_TIER, Math.floor(upgrades.length / UPGRADES_PER_TIER)),
  };
}
