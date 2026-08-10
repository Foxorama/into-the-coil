/**
 * The authored levels — what arrives, where, and what waits at the end.
 *
 * `docs/game.md`: **no procedural level generation.** Levels are authored; the chart between them is
 * the variety. So this file is long on purpose, and it is the one place in `src/content/` where the
 * rows are a *script* rather than a vocabulary.
 *
 * ── HOW THIS SITS INSIDE 0016, WHICH BANS ENUMERATING INSTANCES ─────────────────────────────────
 *
 * `docs/decisions/0016-a-hub-enumerates-kinds.md` says a hub enumerates KINDS, never instances — and
 * a wave script is nothing but instances. The two are reconciled by which thing is the hub: `LEVELS`
 * is a `Record` over a closed union of levels, and the wave list is **data carried by one row**, the
 * same way an enemy row carries its own numbers. Nothing switches on a wave; nothing discovers one.
 * Adding a level is a row, and adding a wave is a line inside one.
 *
 * ── WHAT `at` MEANS ────────────────────────────────────────────────────────────────────────────
 *
 * ⚠️ **`at` is a PLACE — where the wave sits in the level — and not a time.** The wave is put on the
 * field as soon as that place comes inside the spawn horizon, which is 280 units ahead of the camera
 * and beyond the widest view any device can have
 * (`docs/decisions/0023-the-long-axis-is-the-scroll-axis.md`), and it is placed exactly there rather
 * than at the horizon.
 *
 * ⚠️ **The first version made `at` a trigger and placed everything at the horizon**, which threw the
 * authored position away and meant a level could not have anything in front of the player when a run
 * began. Six seconds into a fresh run, `scripts/shot.mjs` showed a ship, its own bullets, and empty
 * space. Every number in the model was correct;
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` is the rule that says to go and look.
 *
 * The ship flies 40 units ahead of the camera, so a wave at `at` is met at roughly `(at − 40) / 36`
 * seconds — the scroll covers 36 units a second. That is the clock this file is read against.
 *
 * ⚠️ **Lanes are checked, not trusted.** `tests/level.test.ts` walks every wave, applies its own
 * formation's offsets, adds the enemy's radius and — for a weaver — twice its weave amplitude, and
 * fails if any member could leave the lane. A wave with an `origin` enters from outside the lane and
 * is checked against the lane it is HEADING for — see `WaveOrigin` below.
 */

import type { EnemyKind } from './enemies.ts';
import type { FormationKind } from './formations.ts';
import type { BossKind } from './bosses.ts';
import type { PickupKind } from './pickups.ts';

/**
 * Every level, **in the order a run plays them**.
 *
 * ⚠️ **The order IS the list, and there is no separate ordering table.** A `Record` keyed by level
 * plus a hand-kept sequence beside it is two descriptions of one fact, and
 * `src/content/sprites.ts` records what that cost the last time it happened here — an off-by-one
 * between two lists that were each valid on their own, which made every entity in the game draw as
 * something else.
 *
 * ⚠️ **This is not the chart.** `docs/game.md` puts a branching map of destinations between levels;
 * a straight line is what exists until that is built, and
 * `docs/decisions/0042-a-run-is-a-sequence-of-levels.md` says why a line first is the right order.
 */
export const LEVEL_KINDS = ['approach', 'descent', 'coilward', 'shoal', 'batteries', 'gauntlet', 'eye'] as const;

/** Derived from the list, so a level cannot exist in the union and be missing from the table. */
export type LevelKind = (typeof LEVEL_KINDS)[number];

/**
 * Which edge of the world a wave arrives from.
 *
 * ⚠️ **A closed union, and it EARNS being one where the weave deliberately did not.**
 * `src/content/enemies.ts` refuses a motion union on the grounds that a straight line is a weave of
 * amplitude zero — one member with a parameter. These three are not that: `lead` is a place off the
 * leading edge and the other two are places off the `across` edges, and no value of one produces
 * another. That file names the trigger for a union arriving — *something that turns towards the
 * player* — and a flanker straightening out into the lane is it.
 * `docs/decisions/0048-a-threat-may-arrive-from-the-side.md`.
 */
export type WaveOrigin = 'lead' | 'acrossMinus' | 'acrossPlus';

export interface WaveEntry {
  /** Camera distance, in world units from the level's start, at which this wave spawns. */
  at: number;
  enemy: EnemyKind;
  formation: FormationKind;
  /** How many. The formation decides where each of them goes. */
  count: number;
  /**
   * Where the formation is centred across the lane, 0 to 100.
   *
   * ⚠️ For a wave that arrives from an `across` edge this is where it is HEADING, not where it
   * starts — it enters from outside the lane and straightens out here. `tests/level.test.ts` checks
   * it either way, because the target lane is what the wave eventually occupies.
   */
  lane: number;
  /**
   * Which edge it comes from. Absent means `lead`, which is where everything came from until now.
   *
   * ⚠️ **Optional rather than required, and that is a considered exception.** The house answer is a
   * field every row has to answer, and 130 waves each restating *the usual one* would bury the
   * dozen that do something else — which is the opposite of what a script is for. The default is
   * named once, below, and `tests/level.test.ts` reads it from there.
   *
   * ⚠️ **The player's own words for the cap**: *"entry point should be capped at 50% from the right
   * side of the screen — the player has a safe spawn zone from the left."* That is enforced by
   * `FLANK_ALONG` in `src/sim/camera.ts` and not by the author, because *half the screen* is not one
   * distance: a view is 178 to 240 world units wide by aspect (0080 raised the floor).
   */
  origin?: WaveOrigin;
}

/**
 * Where a wave comes from when it does not say.
 *
 * The single description of the default, read by the spawner and by the guard rather than restated
 * in either — `src/app/chrome.ts`'s `prefixFor` is the same pattern for the same reason.
 */
export const DEFAULT_ORIGIN: WaveOrigin = 'lead';

export interface PickupEntry {
  /** World units from the level's start. A place, exactly as a wave's `at` is. */
  at: number;
  kind: PickupKind;
  /** Where across the lane it sits, 0 to 100. */
  lane: number;
}

export interface LevelRow {
  /** In order of `at`, ascending. `tests/level.test.ts` holds that, because the spawner assumes it. */
  waves: readonly WaveEntry[];
  /**
   * What is lying about, in order of `at`.
   *
   * ⚠️ **A separate list rather than a wave of one**, because a pickup is in a different collision
   * pairing from everything else in the game — it is collected, never destroyed, and it must be
   * collectable while the ship is invulnerable. `src/sim/collide.ts` has the argument.
   *
   * ⚠️ **It USED to be the load-bearing half of 0039, and it is now half of it.** A death empties the
   * arsenal, so a player who dies late in a level and cannot rearm has been handed its hardest stretch
   * with its weakest loadout — and the answer was density: an upgrade every twenty seconds, held by
   * `tests/pickups.test.ts`. `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md` cut a level
   * to six pickups, which no arrangement makes twenty seconds, and moved the other half of the answer
   * onto the **death scatter** — half of what was lost, thrown back where it happened.
   *
   * ⚠️ **So this list and `SCATTER_KEPT` in `src/app/frame.ts` are one decision.** The guard over this
   * is a ceiling of fifty-five seconds now: a drift detector rather than a promise, and 0082 says what
   * to move first if dying reads as brutal.
   */
  pickups: readonly PickupEntry[];
  /** Camera distance at which the boss arrives. Everything after it is the fight. */
  bossAt: number;
  boss: BossKind;
}

/*
  ⚠️ **THE PACING, IN SECONDS, BECAUSE WORLD UNITS ARE NOT A CLOCK ANYBODY CAN READ.**

  `SCROLL_PER_STEP` is 0.6 at 60Hz, so the camera covers 36 units a second and the ship meets a wave
  authored at `at` about `(at − 40) / 36` seconds in. That makes the script below **2 minutes 55
  seconds** of stage before the boss, against `docs/game.md`'s *"~3 minutes of stage per level"*.

    0 – 300        0:00 – 0:07   NOTHING. The player finds the controls before anything finds them
    300 – 900      0:07 – 0:24   drifters and the first lancers. Nothing here can be met by surprise
    900 – 2300     0:24 – 1:03   weavers: the first thing whose threat is where it WILL be
    2300 – 3030    1:03 – 1:23   THE RUN-UP: the second weapon lands and nothing here has teeth
    3030 – 3700    1:23 – 1:42   lancers at their own health, and then turrets
    3700 – 5000    1:42 – 2:18   chargers: the first thing faster than a reaction
    5000 – 6200    2:18 – 2:51   all five together, at density
    6350          2:55          the sentinel

  ⚠️ **THE DENSITY IS THE SECOND ATTEMPT AND THE FIRST ONE WAS LOOKED AT, NOT REASONED ABOUT.** The
  script opened at one wave every ~140 units, which reads as a sensible four seconds apart and is
  not: a wave takes about eight seconds to cross the view, so the screen held **two enemies** forty
  seconds into a level. `scripts/shot.mjs` at 1280×720 is what said so. Waves now sit ~95 units apart
  and carry more of them, which is roughly three times the standing population.

  ⚠️ **This shape is still a guess and the whole build exists to test it.** Nothing asserts on a
  single number in it — `tests/level.test.ts` holds the properties that must be true of ANY script
  (ordered, inside the lane, escalating, long enough to be a level) and none of the values that make
  this particular one what it is.
  `docs/decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md`.
*/
/**
 * How far past the pickup that lifts the single-hit clamp level one waits before it sends anything
 * that takes more than one shot. World units.
 *
 * ── WHY A CLAMP IS NOT ENOUGH ON ITS OWN ────────────────────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0086-the-teeth-wait-for-the-gun.md`, and it exists because the clamp lifts on
 * a SPAWN.** `docs/decisions/0084-the-dial-is-the-level-and-the-guns.md` turns the dial when a weapon
 * pickup reaches the field, which is the only version of it that can sawtooth — but *the level has
 * offered you a gun* and *you are flying one* are separated by a crossing of the lane, and level one
 * had a three-health turret ten units behind the pickup. The clamp is what covers the opening; this
 * is what covers the handover.
 *
 * ⚠️ **600 units is 16.7 seconds at `SCROLL_PER_STEP`, and it is chosen against the pickup rather
 * than against the enemy.** A pickup waits 420 steps to be taken
 * (`docs/decisions/0064-a-pickup-waits-to-be-taken.md`) — so a run-up shorter than that could put a
 * multi-hit wave in front of a player who is still legitimately flying towards the thing that would
 * answer it. `tests/dial.test.ts` holds that relationship between the two constants rather than
 * either number.
 *
 * ⚠️ **A FLOOR THE CONTENT SITS ABOVE, not a place a wave is authored at.** Level one's first
 * multi-hit wave is at 3,030 against a pickup at 2,300 — 730 units — and the guard is written as a
 * minimum so that tuning either number is a content change rather than a broken promise.
 *
 * ⚠️ **Level one only, because the clamp is.** Every other level opens past `MULTI_HIT_DIAL` and is
 * meant to: 0084's whole argument for the `levelIndex === 0` term is that a game whose every opening
 * had no teeth in it would be a game with teeth nowhere.
 */
export const MULTI_HIT_RUNUP = 600;

const APPROACH: readonly WaveEntry[] = [
  /*
    ⚠️ **NOTHING BEFORE 300, AND THE FIRST DRAFT OPENED AT 60.** Play reported it: *"the initial row
    of enemies is too close to the player — the first screen should have no enemies so that the player
    can orient themselves and test out the ship speed and controls."*

    300 is past `MAX_ALONG_SPAN`, so the opening screen is empty on the WIDEST device as well as the
    narrowest — a 16:9 player gets about four seconds of quiet and a 21:9 player about two. That
    difference is inherent to seeing further and is not something a level can author away.
  */
  // ── Teaching. One kind at a time, in shapes that read at a glance.
  { at: 300, enemy: 'drifter', formation: 'line', count: 5, lane: 45 },
  { at: 420, enemy: 'lancer', formation: 'column', count: 4, lane: 50 },
  { at: 510, enemy: 'drifter', formation: 'vee', count: 6, lane: 55 },
  { at: 600, enemy: 'lancer', formation: 'line', count: 4, lane: 30 },
  { at: 690, enemy: 'drifter', formation: 'line', count: 5, lane: 65 },
  { at: 780, enemy: 'lancer', formation: 'vee', count: 5, lane: 45 },
  { at: 870, enemy: 'drifter', formation: 'vee', count: 6, lane: 50 },

  // ── Weavers. Introduced alone, then mixed into shapes that were safe without them. ──────────────
  { at: 960, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 1050, enemy: 'drifter', formation: 'line', count: 5, lane: 65 },
  { at: 1140, enemy: 'weaver', formation: 'column', count: 5, lane: 55 },
  { at: 1230, enemy: 'lancer', formation: 'vee', count: 5, lane: 50 },
  { at: 1320, enemy: 'weaver', formation: 'line', count: 5, lane: 40 },
  { at: 1410, enemy: 'drifter', formation: 'line', count: 6, lane: 35 },
  { at: 1500, enemy: 'weaver', formation: 'vee', count: 5, lane: 60 },
  { at: 1590, enemy: 'lancer', formation: 'column', count: 5, lane: 40 },
  { at: 1680, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },
  { at: 1770, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 1860, enemy: 'lancer', formation: 'line', count: 5, lane: 65 },
  { at: 1950, enemy: 'drifter', formation: 'vee', count: 6, lane: 40 },
  { at: 2040, enemy: 'weaver', formation: 'column', count: 5, lane: 30 },
  { at: 2130, enemy: 'lancer', formation: 'vee', count: 5, lane: 55 },
  { at: 2220, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },

  /*
    ── THE RUN-UP: THE STRETCH THE SECOND WEAPON GETS TO ITSELF ─────────────────────────────────────

    `docs/decisions/0086-the-teeth-wait-for-the-gun.md`, and `MULTI_HIT_RUNUP` above is the promise
    these eight lines keep. Reported from play: *"we need to remove the enemies that take multiple
    shots to kill from the 1st level, they can't start appearing till after the second weapon
    pickup… they're too difficult to kill with the default fire mode."*

    ⚠️ **A three-health turret stood at 2,310 and the second weapon pickup is at 2,300** — ten world
    units, **a third of a second**. `docs/decisions/0084-the-dial-is-the-level-and-the-guns.md` lifts
    the single-hit clamp the instant that pickup SPAWNS, so the turret it was protecting the player
    from arrived alongside the pickup rather than after it: the player met it with the gun the clamp
    existed because they did not have.

    ⚠️ **Nothing here has more than one hit in it, and that is authored rather than clamped.** Past
    2,300 the clamp is off and every health in the table is real, so this band is a band of
    ONE-HEALTH KINDS — drifters and weavers. The clamp and this stretch answer the same complaint at
    two different times and neither covers the other's.

    ⚠️ **It is denser than the band it replaces, deliberately** — 43 bodies where there were 38. A
    respite made of fewer enemies is a respite the player spends waiting; this is the same eight slots
    carrying more of them, so what the new gun buys is something they watch it do.
  */
  { at: 2310, enemy: 'weaver', formation: 'column', count: 5, lane: 30 },
  { at: 2400, enemy: 'drifter', formation: 'line', count: 5, lane: 60 },
  { at: 2490, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 2580, enemy: 'drifter', formation: 'vee', count: 6, lane: 50 },
  { at: 2670, enemy: 'weaver', formation: 'line', count: 5, lane: 55 },
  { at: 2760, enemy: 'drifter', formation: 'line', count: 6, lane: 35 },
  { at: 2850, enemy: 'drifter', formation: 'vee', count: 6, lane: 65 },
  { at: 2940, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },

  // ── Teeth. The lancer first, at the two health the run-up was hiding, and then the turret at three
  //    — so the level introduces *takes more than one shot* and *takes three* as two separate events.
  { at: 3030, enemy: 'lancer', formation: 'column', count: 5, lane: 40 },
  { at: 3120, enemy: 'drifter', formation: 'vee', count: 6, lane: 45 },
  { at: 3210, enemy: 'turret', formation: 'line', count: 5, lane: 50 },
  { at: 3300, enemy: 'weaver', formation: 'column', count: 5, lane: 30 },
  { at: 3390, enemy: 'lancer', formation: 'line', count: 5, lane: 60 },
  { at: 3480, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },
  { at: 3570, enemy: 'turret', formation: 'column', count: 4, lane: 40 },
  { at: 3660, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },

  // ── Chargers. Faster than a reaction, so they have to be seen coming. ───────────────────────────
  { at: 3750, enemy: 'charger', formation: 'line', count: 5, lane: 50 },
  { at: 3840, enemy: 'drifter', formation: 'line', count: 6, lane: 35 },
  { at: 3930, enemy: 'charger', formation: 'column', count: 5, lane: 65, origin: 'acrossMinus' },
  { at: 4020, enemy: 'lancer', formation: 'vee', count: 5, lane: 45 },
  { at: 4110, enemy: 'charger', formation: 'column', count: 4, lane: 55, origin: 'acrossPlus' },
  { at: 4200, enemy: 'turret', formation: 'line', count: 4, lane: 40 },
  { at: 4290, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 4380, enemy: 'charger', formation: 'line', count: 5, lane: 50 },
  { at: 4470, enemy: 'lancer', formation: 'column', count: 5, lane: 60 },
  { at: 4560, enemy: 'drifter', formation: 'vee', count: 6, lane: 40 },
  { at: 4650, enemy: 'charger', formation: 'column', count: 5, lane: 30, origin: 'acrossMinus' },
  { at: 4740, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },
  { at: 4830, enemy: 'turret', formation: 'column', count: 5, lane: 65 },
  { at: 4920, enemy: 'charger', formation: 'line', count: 5, lane: 55 },

  // ── Everything, at density. The stretch that decides whether three lives was the right number. ──
  { at: 5010, enemy: 'lancer', formation: 'vee', count: 6, lane: 50 },
  { at: 5100, enemy: 'turret', formation: 'column', count: 5, lane: 25 },
  { at: 5180, enemy: 'charger', formation: 'line', count: 5, lane: 60 },
  { at: 5260, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 5340, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },
  { at: 5420, enemy: 'charger', formation: 'column', count: 5, lane: 70, origin: 'acrossPlus' },
  { at: 5500, enemy: 'lancer', formation: 'line', count: 5, lane: 35 },
  { at: 5580, enemy: 'turret', formation: 'line', count: 5, lane: 45 },
  { at: 5660, enemy: 'weaver', formation: 'vee', count: 5, lane: 55 },
  { at: 5740, enemy: 'charger', formation: 'vee', count: 6, lane: 50 },
  { at: 5820, enemy: 'drifter', formation: 'vee', count: 6, lane: 35 },
  { at: 5900, enemy: 'lancer', formation: 'column', count: 5, lane: 65 },
  { at: 5980, enemy: 'turret', formation: 'column', count: 5, lane: 40 },
  { at: 6060, enemy: 'charger', formation: 'column', count: 6, lane: 50, origin: 'acrossMinus' },
  { at: 6140, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
];

/*
  ── NINE PICKUPS, AND THERE WERE TWENTY-FOUR, AND FOR ONE DAY THERE WERE SIX ─────────────────────

  `docs/decisions/0083-two-ladders-of-four.md`, amending
  `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md`. Reported from play: *"power ups are
  too common still and these are premium game pieces that are the lynchpin of whether this game is
  actually good or not"*, and *"these are a key driver of the players feeling of power growth and
  they're currently a steady stream of non-earned upgrades that make the game trivial."*

  ⚠️ **THE SHAPE IS THE SAME IN ALL SEVEN LEVELS, and that is deliberate rather than lazy**: four
  weapons, two missiles, two shields, one bomb. A level that quietly gave itself a fifth weapon would
  be authoring a difficulty curve in the one file that must not.

  ⚠️ **THE COUNT IS DERIVED FROM A TARGET RATHER THAN CHOSEN.** *"The player should be able to cap
  weapons before the first boss and have tier 2 on missiles and then have 2 shields per level plus a
  bomb. So we need 9 upgrades per level to start with."* `UPGRADE_TIERS` is 4, so capping the guns is
  four weapon pickups and tier 2 on the missiles is two — and 4 + 2 + 2 + 1 is the nine.

  ⚠️ **SO THE PICKUP BUDGET AND `UPGRADE_TIERS` ARE ONE DECISION.** Raising the tier count without
  raising the weapon count leaves a player who can never cap; lowering it leaves pickups that convert
  straight to bombs. `tests/pickups.test.ts` holds the arithmetic rather than the two numbers.

  ⚠️ **FOUR WEAPONS IS ALSO THE DIFFICULTY DIAL'S OWN NUMBER**, which is worth knowing before chunk 6
  moves it: *"Level 1 -> dial starts at 1, increases to 2 when the player gets their first weapon power
  up, increases again when they get their next, until they get to the boss which should be difficulty 4
  or so."* Four notches from 1 overshoots 4 by one and three undershot it; the dial is keyed to *a
  weapon power up*, and there are now four of those in level one. Worth settling when the dial lands
  rather than guessing here.

  ⚠️ **What differs level to level is WHERE, not how many.**

  ── WHAT PAYS FOR THE STRETCHES THIS LEAVES ──────────────────────────────────────────────────────

  ⚠️ **`docs/game.md`'s twenty-second rule is AMENDED and this is where the bill lands.**
  `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md` empties the arsenal on a death,
  and the old answer to *how long is a player who just died without a weapon* was *never more than
  twenty seconds* — an upgrade every 600 units. At three a level it is about fifty, and no arrangement
  of three pickups over 6,350 units makes it twenty.

  What replaces it is `src/app/frame.ts`'s `SCATTER_KEPT`: a death now throws **half of what it took
  back onto the field where it happened**, so the answer to *what am I flying with* is *half of what
  you had, immediately* rather than *a fresh one, soon*. The two numbers are one decision. Raising
  either without the other is how this level stops being playable after a death, and
  `tests/pickups.test.ts` holds the fifty-second ceiling so the drift is visible.

  ⚠️ Lanes are deliberately off-centre and alternating. A pickup on the centreline is one the player
  drifts into without deciding anything, and `docs/game.md` wants every upgrade to be worth taking —
  which starts with taking it being a choice about position. At six a level that matters more than it
  did at twenty-four: each of these is a crossing the player commits to.
*/
const APPROACH_PICKUPS: readonly PickupEntry[] = [
  /*
    ⚠️ **THE FIRST THING THE LEVEL OFFERS IS A SHIELD, and it is in the empty opening stretch.** The
    hull is one hit (0050), so a player who has not yet found the controls is one contact from a life
    — and `docs/decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md` gave them that stretch
    precisely so the first thing that happens to them is not a death. It sits off-centre like every
    other pickup: reaching it is still a decision, made against an empty screen.

    ⚠️ **It used to be a PAIR — a shield or an extra life, whichever face the camera was showing.**
    0082 dropped both the cycle and the extra life, so what the level authors is now what the player
    gets. The line 0050 wrote about this pickup is back to being literally true.
  */
  { at: 260, kind: 'shield', lane: 40 },
  /*
    ⚠️ **THE FIRST WEAPON, and it is late on purpose.** A player flies the base ship for twenty-four
    seconds and a full wave of drifters before anything changes, so the change is something they
    notice rather than something that happens to them.
  */
  { at: 900, kind: 'weapon', lane: 25 },
  /*
    ⚠️ **THE FIRST MISSILE PICKUP IS THE SECOND WEAPON ARRIVING AT ALL.** The base ship has no tube
    (`docs/decisions/0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md`) and the ladder
    puts the first tube on tier 1, so this is not an upgrade to a thing the player has — it is a new
    thing. It comes after the first weapon because one new weapon at a time is how either gets noticed.
  */
  { at: 1700, kind: 'missile', lane: 62 },
  { at: 2300, kind: 'weapon', lane: 34 },
  { at: 3100, kind: 'weapon', lane: 68 },
  { at: 3800, kind: 'missile', lane: 30 },
  /*
    ⚠️ **THE FOURTH WEAPON CAPS THE GUNS, AND IT DOES IT 1,750 UNITS — FORTY-EIGHT SECONDS — BEFORE
    THE BOSS.** That is the ask: *"I want the player to be able to cap weapons before the 1st boss and
    then also have a couple of additional shields/bombs."* It is the only placement in this list with a
    stated target behind it, and `tests/pickups.test.ts` holds it as arithmetic against `UPGRADE_TIERS`
    rather than against the number four typed here.
  */
  { at: 4600, kind: 'weapon', lane: 50 },
  /*
    ⚠️ **THE LAST TWO ARE DELIBERATELY AFTER THE CAP, and that is the *"and then also"* half of the
    ask.** Once the guns are full a weapon pickup would convert straight to a bomb charge (0082) — a
    fine rule, and a poor thing to build a level's last minute out of, because the player would be
    flying for pickups whose face does not say what they give. So the level stops offering guns and
    offers the two things that still land where they say: a charge, and the shell to take into the
    fight.

    ⚠️ **THE BOMB IS THE ONLY PICKUP THE PLAYER HAS TO DECIDE WHEN TO USE.** 0053 gave a run two
    charges and one more per level cleared; this is the first thing in the game that grants any
    mid-level, and it grants two.
  */
  { at: 5300, kind: 'bomb', lane: 38 },
  // ⚠️ The last one is before the boss rather than during it. A fight that hands out shields while
  // it is being fought is a fight whose difficulty is a supply line — 0040 keeps a boss to its own
  // clock, and this is the shell the player takes INTO it.
  { at: 5900, kind: 'shield', lane: 62 },
];

/*
  ⚠️ **LEVEL TWO IS NOT LEVEL ONE WITH BIGGER NUMBERS.** What changes is the SHAPE of the pressure:
  it opens where level one ended, wardens arrive early and never stop, and the stretches of one enemy
  kind are gone — nearly every wave here is authored against the one before it rather than as its own
  idea.

    0 – 300        0:00 – 0:07   empty, exactly as level one opens
    300 – 900      0:07 – 0:24   straight into mixed waves; no teaching stretch
    900 – 2200     0:24 – 1:00   wardens, which weave AND shoot
    2200 – 3600    1:00 – 1:39   chargers at density, through turret fire
    3600 – 5000    1:39 – 2:17   everything, with wardens holding the lane
    5000 – 6300    2:17 – 2:53   the hardest stretch in the game so far
    6400          2:57          the harrow

  ⚠️ **It used to say *"fewer upgrades than level one, and that is the difficulty"* and both halves of
  that are gone.** `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md` fixes every level at
  three weapons, so a level cannot be made harder by being stingier; and 0041's twenty-second ceiling
  is amended, because three a level cannot meet it. What makes level two harder than level one is the
  script below and the placement of the six — see `DESCENT_PICKUPS`.
*/
const DESCENT: readonly WaveEntry[] = [
  { at: 300, enemy: 'lancer', formation: 'vee', count: 5, lane: 50 },
  { at: 385, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 400, enemy: 'turret', formation: 'column', count: 3, lane: 30 },
  { at: 485, enemy: 'lancer', formation: 'line', count: 5, lane: 65 },
  { at: 570, enemy: 'charger', formation: 'vee', count: 5, lane: 50 },
  { at: 655, enemy: 'drifter', formation: 'vee', count: 6, lane: 40 },
  { at: 740, enemy: 'weaver', formation: 'column', count: 5, lane: 60 },
  { at: 825, enemy: 'lancer', formation: 'column', count: 5, lane: 35 },

  // ── Wardens. Four health, weaving, and shooting — the first thing that is two problems at once. ─
  { at: 910, enemy: 'warden', formation: 'line', count: 3, lane: 50 },
  { at: 995, enemy: 'charger', formation: 'column', count: 5, lane: 30, origin: 'acrossMinus' },
  { at: 1080, enemy: 'drifter', formation: 'line', count: 6, lane: 55 },
  { at: 1165, enemy: 'warden', formation: 'column', count: 3, lane: 40 },
  { at: 1250, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },
  { at: 1335, enemy: 'lancer', formation: 'vee', count: 5, lane: 62 },
  { at: 1420, enemy: 'warden', formation: 'line', count: 3, lane: 45 },
  // ⚠️ Filler, and it is filling something the density guard measured rather than something anybody
  // felt: two three-wide waves in a row is a six-enemy trough, and wardens are four health each so
  // making THEM more numerous would have changed the level's difficulty to fix its pacing.
  { at: 1462, enemy: 'drifter', formation: 'line', count: 5, lane: 62 },
  { at: 1505, enemy: 'turret', formation: 'line', count: 3, lane: 55 },
  { at: 1590, enemy: 'charger', formation: 'column', count: 5, lane: 25, origin: 'acrossPlus' },
  { at: 1675, enemy: 'drifter', formation: 'vee', count: 6, lane: 50 },
  { at: 1760, enemy: 'warden', formation: 'vee', count: 3, lane: 50 },
  { at: 1845, enemy: 'weaver', formation: 'line', count: 5, lane: 40 },
  { at: 1930, enemy: 'lancer', formation: 'line', count: 5, lane: 68 },
  { at: 2015, enemy: 'charger', formation: 'line', count: 5, lane: 45 },
  { at: 2100, enemy: 'turret', formation: 'column', count: 3, lane: 35 },

  // ── Chargers at density, through standing fire. The stretch that punishes standing still. ───────
  { at: 2185, enemy: 'charger', formation: 'vee', count: 5, lane: 55 },
  { at: 2270, enemy: 'warden', formation: 'line', count: 3, lane: 45 },
  { at: 2355, enemy: 'lancer', formation: 'line', count: 6, lane: 50 },
  { at: 2440, enemy: 'charger', formation: 'column', count: 5, lane: 35, origin: 'acrossMinus' },
  { at: 2525, enemy: 'turret', formation: 'line', count: 3, lane: 60 },
  { at: 2610, enemy: 'weaver', formation: 'column', count: 5, lane: 30 },
  { at: 2695, enemy: 'charger', formation: 'column', count: 5, lane: 70, origin: 'acrossPlus' },
  { at: 2780, enemy: 'lancer', formation: 'vee', count: 5, lane: 50 },
  { at: 2865, enemy: 'warden', formation: 'column', count: 3, lane: 55 },
  { at: 2950, enemy: 'charger', formation: 'line', count: 6, lane: 42 },
  { at: 3035, enemy: 'charger', formation: 'vee', count: 5, lane: 60 },
  { at: 3120, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 3205, enemy: 'turret', formation: 'column', count: 3, lane: 28 },
  { at: 3290, enemy: 'lancer', formation: 'line', count: 5, lane: 65 },
  { at: 3375, enemy: 'warden', formation: 'line', count: 3, lane: 45 },
  { at: 3460, enemy: 'charger', formation: 'column', count: 5, lane: 50, origin: 'acrossMinus' },

  // ── Everything, with wardens holding the lane the player wants. ─────────────────────────────────
  { at: 3545, enemy: 'charger', formation: 'vee', count: 6, lane: 55 },
  { at: 3630, enemy: 'warden', formation: 'vee', count: 3, lane: 50 },
  { at: 3715, enemy: 'weaver', formation: 'line', count: 5, lane: 40 },
  { at: 3800, enemy: 'charger', formation: 'column', count: 5, lane: 65 },
  { at: 3885, enemy: 'turret', formation: 'line', count: 3, lane: 45 },
  { at: 3970, enemy: 'lancer', formation: 'column', count: 5, lane: 32 },
  { at: 4055, enemy: 'warden', formation: 'line', count: 3, lane: 58 },
  { at: 4140, enemy: 'charger', formation: 'vee', count: 5, lane: 45 },
  { at: 4225, enemy: 'lancer', formation: 'line', count: 6, lane: 50 },
  { at: 4310, enemy: 'weaver', formation: 'vee', count: 5, lane: 55 },
  { at: 4395, enemy: 'turret', formation: 'column', count: 3, lane: 70 },
  { at: 4480, enemy: 'lancer', formation: 'vee', count: 5, lane: 38 },
  { at: 4565, enemy: 'warden', formation: 'column', count: 3, lane: 50 },
  { at: 4650, enemy: 'charger', formation: 'column', count: 5, lane: 60, origin: 'acrossPlus' },
  { at: 4735, enemy: 'charger', formation: 'vee', count: 6, lane: 45 },
  { at: 4820, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 4905, enemy: 'lancer', formation: 'line', count: 5, lane: 30 },

  // ── The hardest stretch in the game so far. ─────────────────────────────────────────────────────
  { at: 4990, enemy: 'warden', formation: 'line', count: 4, lane: 50 },
  { at: 5070, enemy: 'charger', formation: 'vee', count: 5, lane: 55 },
  { at: 5150, enemy: 'turret', formation: 'line', count: 3, lane: 40 },
  { at: 5230, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 5310, enemy: 'charger', formation: 'column', count: 5, lane: 65, origin: 'acrossMinus' },
  { at: 5390, enemy: 'lancer', formation: 'vee', count: 5, lane: 50 },
  { at: 5470, enemy: 'warden', formation: 'column', count: 4, lane: 35 },
  { at: 5550, enemy: 'drifter', formation: 'line', count: 6, lane: 55 },
  { at: 5630, enemy: 'charger', formation: 'column', count: 5, lane: 25 },
  { at: 5710, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },
  { at: 5790, enemy: 'turret', formation: 'column', count: 3, lane: 68 },
  { at: 5870, enemy: 'warden', formation: 'vee', count: 3, lane: 45 },
  { at: 5950, enemy: 'lancer', formation: 'line', count: 5, lane: 60 },
  { at: 6030, enemy: 'charger', formation: 'column', count: 5, lane: 40, origin: 'acrossPlus' },
  { at: 6110, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },
  { at: 6190, enemy: 'warden', formation: 'line', count: 4, lane: 50 },
];

/**
 * Level two's pickups: the same six, and the middle stretch is longer.
 *
 * ⚠️ **The old comment here said *"fewer upgrades than level one, and that is the difficulty"* and
 * that is no longer available as a lever** — 0082 fixes the budget at three weapons everywhere, so a
 * level cannot be made harder by being stingier. What is left is placement, and level two's second
 * weapon sits 1,700 units after its first against level one's 1,700 with a later start, so a death in
 * the middle third costs more here.
 */
const DESCENT_PICKUPS: readonly PickupEntry[] = [
  // The opening shield, on the same terms as level one's — and level two opens on the same empty
  // stretch for the same reason, so it is the same answer to the same question.
  { at: 260, kind: 'shield', lane: 62 },
  { at: 950, kind: 'weapon', lane: 28 },
  { at: 1750, kind: 'missile', lane: 66 },
  { at: 2400, kind: 'weapon', lane: 40 },
  { at: 3200, kind: 'weapon', lane: 30 },
  { at: 3900, kind: 'missile', lane: 58 },
  { at: 4700, kind: 'weapon', lane: 44 },
  { at: 5400, kind: 'bomb', lane: 52 },
  { at: 5950, kind: 'shield', lane: 32 },
];


/*
  LEVEL THREE — THE SIDES STOP BEING SAFE.

  ⚠️ **One idea per level, and this one's is `origin`.** Levels one and two are about what arrives;
  this is about WHERE FROM. Roughly a third of its waves enter across the lane rather than down it —
  `docs/decisions/0048-a-threat-may-arrive-from-the-side.md` landed that machinery and level two uses
  it twice. A player who has learned to hold a lane and watch the leading edge is being told that the
  edge is three edges.

  The escalation is level one's ladder run faster — two kinds, weavers, turrets, chargers, everything
  — and what changes across it is the flank cadence, from every fourth wave to every second.
*/
const COILWARD: readonly WaveEntry[] = [
  { at: 300, enemy: 'drifter', formation: 'line', count: 5, lane: 47 },
  { at: 392, enemy: 'lancer', formation: 'line', count: 5, lane: 58 },
  { at: 484, enemy: 'drifter', formation: 'line', count: 5, lane: 42 },
  { at: 576, enemy: 'lancer', formation: 'line', count: 5, lane: 53, origin: 'acrossMinus' },
  { at: 668, enemy: 'drifter', formation: 'line', count: 5, lane: 44 },
  { at: 760, enemy: 'lancer', formation: 'line', count: 5, lane: 60 },
  { at: 852, enemy: 'drifter', formation: 'line', count: 5, lane: 50 },
  { at: 944, enemy: 'lancer', formation: 'line', count: 5, lane: 40, origin: 'acrossPlus' },
  { at: 1036, enemy: 'weaver', formation: 'column', count: 5, lane: 50 },
  { at: 1128, enemy: 'lancer', formation: 'column', count: 5, lane: 41 },
  { at: 1220, enemy: 'lancer', formation: 'column', count: 5, lane: 60, origin: 'acrossMinus' },
  { at: 1312, enemy: 'weaver', formation: 'column', count: 5, lane: 45 },
  { at: 1404, enemy: 'charger', formation: 'column', count: 5, lane: 55 },
  { at: 1496, enemy: 'lancer', formation: 'column', count: 5, lane: 42, origin: 'acrossPlus' },
  { at: 1588, enemy: 'weaver', formation: 'column', count: 5, lane: 56 },
  { at: 1680, enemy: 'charger', formation: 'column', count: 5, lane: 49 },
  { at: 1772, enemy: 'lancer', formation: 'column', count: 5, lane: 50, origin: 'acrossMinus' },
  { at: 1864, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 1956, enemy: 'lancer', formation: 'column', count: 5, lane: 60 },
  { at: 2048, enemy: 'lancer', formation: 'column', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 2140, enemy: 'weaver', formation: 'column', count: 5, lane: 55 },
  { at: 2232, enemy: 'warden', formation: 'column', count: 5, lane: 42 },
  { at: 2324, enemy: 'turret', formation: 'vee', count: 4, lane: 47 },
  { at: 2416, enemy: 'weaver', formation: 'vee', count: 4, lane: 56 },
  { at: 2508, enemy: 'lancer', formation: 'vee', count: 4, lane: 42, origin: 'acrossMinus' },
  { at: 2600, enemy: 'turret', formation: 'vee', count: 4, lane: 53 },
  { at: 2692, enemy: 'weaver', formation: 'vee', count: 4, lane: 44 },
  { at: 2784, enemy: 'lancer', formation: 'vee', count: 4, lane: 60, origin: 'acrossPlus' },
  { at: 2876, enemy: 'turret', formation: 'vee', count: 4, lane: 50 },
  { at: 2968, enemy: 'weaver', formation: 'vee', count: 4, lane: 44 },
  { at: 3060, enemy: 'lancer', formation: 'vee', count: 4, lane: 47, origin: 'acrossMinus' },
  { at: 3152, enemy: 'turret', formation: 'vee', count: 4, lane: 58 },
  { at: 3244, enemy: 'weaver', formation: 'vee', count: 4, lane: 44 },
  { at: 3336, enemy: 'lancer', formation: 'vee', count: 4, lane: 53, origin: 'acrossPlus' },
  { at: 3428, enemy: 'turret', formation: 'vee', count: 4, lane: 44 },
  { at: 3520, enemy: 'weaver', formation: 'vee', count: 4, lane: 56 },
  { at: 3612, enemy: 'charger', formation: 'line', count: 5, lane: 50 },
  { at: 3704, enemy: 'charger', formation: 'line', count: 5, lane: 41, origin: 'acrossMinus' },
  { at: 3796, enemy: 'weaver', formation: 'line', count: 5, lane: 56 },
  { at: 3888, enemy: 'charger', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 3980, enemy: 'lancer', formation: 'line', count: 5, lane: 55 },
  { at: 4072, enemy: 'weaver', formation: 'line', count: 5, lane: 44, origin: 'acrossMinus' },
  { at: 4164, enemy: 'charger', formation: 'line', count: 5, lane: 59 },
  { at: 4256, enemy: 'charger', formation: 'line', count: 5, lane: 49, origin: 'acrossPlus' },
  { at: 4348, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 4440, enemy: 'charger', formation: 'line', count: 5, lane: 41, origin: 'acrossMinus' },
  { at: 4532, enemy: 'charger', formation: 'line', count: 5, lane: 60 },
  { at: 4624, enemy: 'weaver', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 4716, enemy: 'charger', formation: 'line', count: 5, lane: 55 },
  { at: 4808, enemy: 'lancer', formation: 'line', count: 5, lane: 42, origin: 'acrossMinus' },
  { at: 4900, enemy: 'charger', formation: 'column', count: 5, lane: 47 },
  { at: 4992, enemy: 'turret', formation: 'column', count: 5, lane: 58, origin: 'acrossMinus' },
  { at: 5084, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 5176, enemy: 'lancer', formation: 'column', count: 5, lane: 53, origin: 'acrossPlus' },
  { at: 5268, enemy: 'charger', formation: 'column', count: 5, lane: 44 },
  { at: 5360, enemy: 'turret', formation: 'column', count: 5, lane: 60, origin: 'acrossMinus' },
  { at: 5452, enemy: 'weaver', formation: 'column', count: 5, lane: 50 },
  { at: 5544, enemy: 'lancer', formation: 'column', count: 5, lane: 40, origin: 'acrossPlus' },
  { at: 5636, enemy: 'charger', formation: 'column', count: 5, lane: 47 },
  { at: 5728, enemy: 'turret', formation: 'column', count: 5, lane: 58, origin: 'acrossMinus' },
  { at: 5820, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 5912, enemy: 'lancer', formation: 'column', count: 5, lane: 53, origin: 'acrossPlus' },
  { at: 6004, enemy: 'charger', formation: 'column', count: 5, lane: 44 },
  { at: 6096, enemy: 'turret', formation: 'column', count: 5, lane: 60, origin: 'acrossMinus' },
];

/**
 * ⚠️ **Level three's lanes swing wider than level one's, which is its own idea reaching the pickups.**
 * The level is about `origin` — threats arriving across the lane rather than down it — so a player
 * crossing for a pickup here is crossing the axis the level attacks from. The pickups do not change;
 * what changes is what it costs to reach them.
 */
const COILWARD_PICKUPS: readonly PickupEntry[] = [
  { at: 300, kind: 'shield', lane: 44 },
  { at: 920, kind: 'weapon', lane: 56 },
  { at: 1720, kind: 'missile', lane: 34 },
  { at: 2350, kind: 'weapon', lane: 60 },
  { at: 3150, kind: 'weapon', lane: 38 },
  { at: 3850, kind: 'missile', lane: 56 },
  { at: 4650, kind: 'weapon', lane: 48 },
  { at: 5350, kind: 'bomb', lane: 46 },
  { at: 5900, kind: 'shield', lane: 38 },
];

/*
  LEVEL FOUR — FASTER THAN YOU.

  ⚠️ **Its idea is the CHARGER**, which levels one and two hold back until their last third. Here it
  opens the level and never leaves, so the standing population is the fastest thing in
  `src/content/enemies.ts` alongside the one whose threat is where it WILL be. Flanks are rarer than
  level three's on purpose: two ideas at once is neither.
*/
const SHOAL: readonly WaveEntry[] = [
  { at: 300, enemy: 'charger', formation: 'line', count: 5, lane: 50 },
  { at: 390, enemy: 'drifter', formation: 'line', count: 5, lane: 41 },
  { at: 480, enemy: 'charger', formation: 'line', count: 5, lane: 60 },
  { at: 570, enemy: 'drifter', formation: 'line', count: 5, lane: 45 },
  { at: 660, enemy: 'charger', formation: 'line', count: 5, lane: 55 },
  { at: 750, enemy: 'drifter', formation: 'line', count: 5, lane: 42 },
  { at: 840, enemy: 'charger', formation: 'line', count: 5, lane: 59 },
  { at: 930, enemy: 'drifter', formation: 'line', count: 5, lane: 49 },
  { at: 1020, enemy: 'charger', formation: 'column', count: 5, lane: 47 },
  { at: 1110, enemy: 'weaver', formation: 'column', count: 5, lane: 56 },
  { at: 1200, enemy: 'charger', formation: 'column', count: 5, lane: 42 },
  { at: 1290, enemy: 'weaver', formation: 'column', count: 5, lane: 53 },
  { at: 1380, enemy: 'charger', formation: 'column', count: 5, lane: 44, origin: 'acrossMinus' },
  { at: 1470, enemy: 'weaver', formation: 'column', count: 5, lane: 56 },
  { at: 1560, enemy: 'charger', formation: 'column', count: 5, lane: 50 },
  { at: 1650, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 1740, enemy: 'charger', formation: 'column', count: 5, lane: 47 },
  { at: 1830, enemy: 'weaver', formation: 'column', count: 5, lane: 56, origin: 'acrossPlus' },
  { at: 1920, enemy: 'charger', formation: 'column', count: 5, lane: 42 },
  { at: 2010, enemy: 'weaver', formation: 'column', count: 5, lane: 53 },
  { at: 2100, enemy: 'charger', formation: 'column', count: 5, lane: 44 },
  { at: 2190, enemy: 'weaver', formation: 'column', count: 5, lane: 56 },
  { at: 2280, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },
  { at: 2370, enemy: 'charger', formation: 'vee', count: 6, lane: 41 },
  { at: 2460, enemy: 'lancer', formation: 'vee', count: 6, lane: 60 },
  { at: 2550, enemy: 'weaver', formation: 'vee', count: 5, lane: 45, origin: 'acrossMinus' },
  { at: 2640, enemy: 'charger', formation: 'vee', count: 6, lane: 55 },
  { at: 2730, enemy: 'lancer', formation: 'vee', count: 6, lane: 42 },
  { at: 2820, enemy: 'weaver', formation: 'vee', count: 5, lane: 56 },
  { at: 2910, enemy: 'charger', formation: 'vee', count: 6, lane: 49, origin: 'acrossPlus' },
  { at: 3000, enemy: 'lancer', formation: 'vee', count: 6, lane: 50 },
  { at: 3090, enemy: 'weaver', formation: 'vee', count: 5, lane: 44 },
  { at: 3180, enemy: 'charger', formation: 'vee', count: 6, lane: 60 },
  { at: 3270, enemy: 'lancer', formation: 'vee', count: 6, lane: 45, origin: 'acrossMinus' },
  { at: 3360, enemy: 'weaver', formation: 'vee', count: 5, lane: 55 },
  { at: 3450, enemy: 'charger', formation: 'vee', count: 6, lane: 42 },
  { at: 3540, enemy: 'charger', formation: 'line', count: 5, lane: 47 },
  { at: 3630, enemy: 'weaver', formation: 'line', count: 5, lane: 56 },
  { at: 3720, enemy: 'turret', formation: 'line', count: 5, lane: 42, origin: 'acrossMinus' },
  { at: 3810, enemy: 'charger', formation: 'line', count: 5, lane: 53 },
  { at: 3900, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 3990, enemy: 'turret', formation: 'line', count: 5, lane: 60, origin: 'acrossPlus' },
  { at: 4080, enemy: 'charger', formation: 'line', count: 5, lane: 50 },
  { at: 4170, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 4260, enemy: 'turret', formation: 'line', count: 5, lane: 47, origin: 'acrossMinus' },
  { at: 4350, enemy: 'charger', formation: 'line', count: 5, lane: 58 },
  { at: 4440, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 4530, enemy: 'turret', formation: 'line', count: 5, lane: 53, origin: 'acrossPlus' },
  { at: 4620, enemy: 'charger', formation: 'line', count: 5, lane: 44 },
  { at: 4710, enemy: 'weaver', formation: 'line', count: 5, lane: 56 },
  { at: 4800, enemy: 'charger', formation: 'column', count: 6, lane: 50 },
  { at: 4890, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 4980, enemy: 'drifter', formation: 'column', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 5070, enemy: 'charger', formation: 'column', count: 6, lane: 45 },
  { at: 5160, enemy: 'charger', formation: 'column', count: 6, lane: 55 },
  { at: 5250, enemy: 'weaver', formation: 'column', count: 5, lane: 44, origin: 'acrossPlus' },
  { at: 5340, enemy: 'drifter', formation: 'column', count: 6, lane: 59 },
  { at: 5430, enemy: 'charger', formation: 'column', count: 6, lane: 49 },
  { at: 5520, enemy: 'charger', formation: 'column', count: 6, lane: 50, origin: 'acrossMinus' },
  { at: 5610, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 5700, enemy: 'drifter', formation: 'column', count: 6, lane: 60 },
  { at: 5790, enemy: 'charger', formation: 'column', count: 6, lane: 45, origin: 'acrossPlus' },
  { at: 5880, enemy: 'charger', formation: 'column', count: 6, lane: 55 },
  { at: 5970, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 6060, enemy: 'drifter', formation: 'column', count: 6, lane: 59, origin: 'acrossMinus' },
];

/**
 * ⚠️ **Level four is the charger's level, so a pickup here is a thing to be grabbed between passes.**
 * Nothing about the list says so — that is the waves' job — but it is why the bomb sits at 3,650,
 * inside the stretch where chargers arrive in vees: 0053's blast lands on everything in a third of the
 * lane at once, and a formation that comes back twice is the one thing in the game that is worth
 * spending a charge on rather than outflying.
 */
const SHOAL_PICKUPS: readonly PickupEntry[] = [
  { at: 290, kind: 'shield', lane: 52 },
  { at: 900, kind: 'weapon', lane: 36 },
  { at: 1700, kind: 'missile', lane: 62 },
  { at: 2320, kind: 'weapon', lane: 44 },
  { at: 3120, kind: 'weapon', lane: 58 },
  { at: 3820, kind: 'missile', lane: 40 },
  { at: 4620, kind: 'weapon', lane: 30 },
  { at: 5320, kind: 'bomb', lane: 50 },
  { at: 5860, kind: 'shield', lane: 66 },
];

/*
  LEVEL FIVE — THINGS THAT MUST BE KILLED.

  ⚠️ **Its idea is the opposite of level four's**: nothing here can be outrun. Turrets and wardens are
  the two kinds that hold station and shoot, so the lane fills with bodies that stay until they are
  dealt with, and every wave the player leaves alive is still there when the next arrives.
  `docs/game.md`'s *hazards must be dealt with, not only dodged* is the shape this reaches for with
  the vocabulary that exists.
*/
const BATTERIES: readonly WaveEntry[] = [
  { at: 300, enemy: 'turret', formation: 'line', count: 4, lane: 47 },
  { at: 390, enemy: 'drifter', formation: 'line', count: 4, lane: 58 },
  { at: 480, enemy: 'turret', formation: 'line', count: 4, lane: 42 },
  { at: 570, enemy: 'drifter', formation: 'line', count: 4, lane: 53 },
  { at: 660, enemy: 'turret', formation: 'line', count: 4, lane: 44 },
  { at: 750, enemy: 'drifter', formation: 'line', count: 4, lane: 60 },
  { at: 840, enemy: 'turret', formation: 'line', count: 4, lane: 50 },
  { at: 930, enemy: 'drifter', formation: 'line', count: 4, lane: 40 },
  { at: 1020, enemy: 'turret', formation: 'column', count: 4, lane: 50 },
  { at: 1110, enemy: 'warden', formation: 'column', count: 4, lane: 41 },
  { at: 1200, enemy: 'turret', formation: 'column', count: 4, lane: 60 },
  { at: 1290, enemy: 'warden', formation: 'column', count: 4, lane: 45 },
  { at: 1380, enemy: 'turret', formation: 'column', count: 4, lane: 55 },
  { at: 1470, enemy: 'warden', formation: 'column', count: 4, lane: 42, origin: 'acrossMinus' },
  { at: 1560, enemy: 'turret', formation: 'column', count: 4, lane: 59 },
  { at: 1650, enemy: 'warden', formation: 'column', count: 4, lane: 49 },
  { at: 1740, enemy: 'turret', formation: 'column', count: 4, lane: 50 },
  { at: 1830, enemy: 'warden', formation: 'column', count: 4, lane: 41 },
  { at: 1920, enemy: 'turret', formation: 'column', count: 4, lane: 60 },
  { at: 2010, enemy: 'warden', formation: 'column', count: 4, lane: 45, origin: 'acrossPlus' },
  { at: 2100, enemy: 'turret', formation: 'column', count: 4, lane: 55 },
  { at: 2190, enemy: 'warden', formation: 'column', count: 4, lane: 42 },
  { at: 2280, enemy: 'warden', formation: 'vee', count: 4, lane: 47 },
  { at: 2370, enemy: 'turret', formation: 'vee', count: 4, lane: 58 },
  { at: 2460, enemy: 'lancer', formation: 'vee', count: 4, lane: 42 },
  { at: 2550, enemy: 'warden', formation: 'vee', count: 4, lane: 53 },
  { at: 2640, enemy: 'turret', formation: 'vee', count: 4, lane: 44, origin: 'acrossMinus' },
  { at: 2730, enemy: 'lancer', formation: 'vee', count: 4, lane: 60 },
  { at: 2820, enemy: 'warden', formation: 'vee', count: 4, lane: 50 },
  { at: 2910, enemy: 'turret', formation: 'vee', count: 4, lane: 40 },
  { at: 3000, enemy: 'lancer', formation: 'vee', count: 4, lane: 47 },
  { at: 3090, enemy: 'warden', formation: 'vee', count: 4, lane: 58, origin: 'acrossPlus' },
  { at: 3180, enemy: 'turret', formation: 'vee', count: 4, lane: 42 },
  { at: 3270, enemy: 'lancer', formation: 'vee', count: 4, lane: 53 },
  { at: 3360, enemy: 'warden', formation: 'vee', count: 4, lane: 44 },
  { at: 3450, enemy: 'turret', formation: 'vee', count: 4, lane: 60 },
  { at: 3540, enemy: 'turret', formation: 'line', count: 5, lane: 50 },
  { at: 3630, enemy: 'warden', formation: 'line', count: 5, lane: 41 },
  { at: 3720, enemy: 'weaver', formation: 'line', count: 5, lane: 56 },
  { at: 3810, enemy: 'turret', formation: 'line', count: 5, lane: 45, origin: 'acrossMinus' },
  { at: 3900, enemy: 'warden', formation: 'line', count: 5, lane: 55 },
  { at: 3990, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 4080, enemy: 'turret', formation: 'line', count: 5, lane: 59 },
  { at: 4170, enemy: 'warden', formation: 'line', count: 5, lane: 49, origin: 'acrossPlus' },
  { at: 4260, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 4350, enemy: 'turret', formation: 'line', count: 5, lane: 41 },
  { at: 4440, enemy: 'warden', formation: 'line', count: 5, lane: 60 },
  { at: 4530, enemy: 'weaver', formation: 'line', count: 5, lane: 45, origin: 'acrossMinus' },
  { at: 4620, enemy: 'turret', formation: 'line', count: 5, lane: 55 },
  { at: 4710, enemy: 'warden', formation: 'line', count: 5, lane: 42 },
  { at: 4800, enemy: 'warden', formation: 'column', count: 5, lane: 47 },
  { at: 4890, enemy: 'turret', formation: 'column', count: 5, lane: 58 },
  { at: 4980, enemy: 'charger', formation: 'column', count: 5, lane: 42, origin: 'acrossMinus' },
  { at: 5070, enemy: 'weaver', formation: 'column', count: 5, lane: 53 },
  { at: 5160, enemy: 'warden', formation: 'column', count: 5, lane: 44 },
  { at: 5250, enemy: 'turret', formation: 'column', count: 5, lane: 60, origin: 'acrossPlus' },
  { at: 5340, enemy: 'charger', formation: 'column', count: 5, lane: 50 },
  { at: 5430, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 5520, enemy: 'warden', formation: 'column', count: 5, lane: 47, origin: 'acrossMinus' },
  { at: 5610, enemy: 'turret', formation: 'column', count: 5, lane: 58 },
  { at: 5700, enemy: 'charger', formation: 'column', count: 5, lane: 42 },
  { at: 5790, enemy: 'weaver', formation: 'column', count: 5, lane: 53, origin: 'acrossPlus' },
  { at: 5880, enemy: 'warden', formation: 'column', count: 5, lane: 44 },
  { at: 5970, enemy: 'turret', formation: 'column', count: 5, lane: 60 },
  { at: 6060, enemy: 'charger', formation: 'column', count: 5, lane: 50, origin: 'acrossMinus' },
];

/**
 * ⚠️ **Level five is the one where nothing can be outrun**, so the bomb is placed against the level's
 * own idea rather than against the clock: turrets and wardens hold station and accumulate, and a
 * charge is the only thing in the game that clears a lane the player has let fill up.
 */
const BATTERIES_PICKUPS: readonly PickupEntry[] = [
  { at: 290, kind: 'shield', lane: 36 },
  { at: 900, kind: 'weapon', lane: 60 },
  { at: 1700, kind: 'missile', lane: 42 },
  { at: 2320, kind: 'weapon', lane: 54 },
  { at: 3120, kind: 'weapon', lane: 30 },
  { at: 3820, kind: 'missile', lane: 50 },
  { at: 4620, kind: 'weapon', lane: 62 },
  { at: 5320, kind: 'bomb', lane: 40 },
  { at: 5860, kind: 'shield', lane: 44 },
];

/*
  LEVEL SIX — NO GAPS.

  ⚠️ **The first level whose idea is DENSITY rather than a kind.** Waves sit 85 units apart against
  levels one and two's 90 to 95, every wave past the opening mixes kinds, and the flank cadence
  reaches every second wave. It is the level `docs/state-of-play.md`'s open density question —
  *"increasing enemy waves"* — is meant to be answered against, because it is the only one deliberately
  authored past the others.
*/
const GAUNTLET: readonly WaveEntry[] = [
  { at: 300, enemy: 'lancer', formation: 'line', count: 5, lane: 50 },
  { at: 385, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 470, enemy: 'drifter', formation: 'line', count: 5, lane: 60 },
  { at: 555, enemy: 'lancer', formation: 'line', count: 5, lane: 45, origin: 'acrossMinus' },
  { at: 640, enemy: 'weaver', formation: 'line', count: 5, lane: 55 },
  { at: 725, enemy: 'drifter', formation: 'line', count: 5, lane: 42 },
  { at: 810, enemy: 'lancer', formation: 'line', count: 5, lane: 59 },
  { at: 895, enemy: 'weaver', formation: 'line', count: 5, lane: 49, origin: 'acrossPlus' },
  { at: 980, enemy: 'drifter', formation: 'line', count: 5, lane: 50 },
  { at: 1065, enemy: 'turret', formation: 'line', count: 5, lane: 47 },
  { at: 1150, enemy: 'charger', formation: 'line', count: 5, lane: 58 },
  { at: 1235, enemy: 'weaver', formation: 'line', count: 5, lane: 44, origin: 'acrossMinus' },
  { at: 1320, enemy: 'turret', formation: 'line', count: 5, lane: 53 },
  { at: 1405, enemy: 'charger', formation: 'line', count: 5, lane: 44 },
  { at: 1490, enemy: 'weaver', formation: 'line', count: 5, lane: 56, origin: 'acrossPlus' },
  { at: 1575, enemy: 'turret', formation: 'line', count: 5, lane: 50 },
  { at: 1660, enemy: 'charger', formation: 'line', count: 5, lane: 40 },
  { at: 1745, enemy: 'weaver', formation: 'line', count: 5, lane: 47, origin: 'acrossMinus' },
  { at: 1830, enemy: 'turret', formation: 'line', count: 5, lane: 58 },
  { at: 1915, enemy: 'charger', formation: 'line', count: 5, lane: 42 },
  { at: 2000, enemy: 'weaver', formation: 'line', count: 5, lane: 53, origin: 'acrossPlus' },
  { at: 2085, enemy: 'turret', formation: 'line', count: 5, lane: 44 },
  { at: 2170, enemy: 'charger', formation: 'line', count: 5, lane: 60 },
  { at: 2255, enemy: 'weaver', formation: 'line', count: 5, lane: 50, origin: 'acrossMinus' },
  { at: 2340, enemy: 'warden', formation: 'line', count: 5, lane: 50 },
  { at: 2425, enemy: 'charger', formation: 'line', count: 5, lane: 41 },
  { at: 2510, enemy: 'lancer', formation: 'line', count: 5, lane: 60, origin: 'acrossMinus' },
  { at: 2595, enemy: 'warden', formation: 'line', count: 5, lane: 45 },
  { at: 2680, enemy: 'charger', formation: 'line', count: 5, lane: 55 },
  { at: 2765, enemy: 'lancer', formation: 'line', count: 5, lane: 42, origin: 'acrossPlus' },
  { at: 2850, enemy: 'warden', formation: 'line', count: 5, lane: 59 },
  { at: 2935, enemy: 'charger', formation: 'line', count: 5, lane: 49 },
  { at: 3020, enemy: 'lancer', formation: 'line', count: 5, lane: 50, origin: 'acrossMinus' },
  { at: 3105, enemy: 'warden', formation: 'line', count: 5, lane: 41 },
  { at: 3190, enemy: 'charger', formation: 'line', count: 5, lane: 60 },
  { at: 3275, enemy: 'lancer', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 3360, enemy: 'warden', formation: 'line', count: 5, lane: 55 },
  { at: 3445, enemy: 'charger', formation: 'line', count: 5, lane: 42 },
  { at: 3530, enemy: 'lancer', formation: 'line', count: 5, lane: 59, origin: 'acrossMinus' },
  { at: 3615, enemy: 'charger', formation: 'line', count: 6, lane: 47 },
  { at: 3700, enemy: 'turret', formation: 'line', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 3785, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 3870, enemy: 'warden', formation: 'line', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 3955, enemy: 'charger', formation: 'line', count: 6, lane: 44 },
  { at: 4040, enemy: 'turret', formation: 'line', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 4125, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 4210, enemy: 'warden', formation: 'line', count: 6, lane: 40, origin: 'acrossPlus' },
  { at: 4295, enemy: 'charger', formation: 'line', count: 6, lane: 47 },
  { at: 4380, enemy: 'turret', formation: 'line', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 4465, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 4550, enemy: 'warden', formation: 'line', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 4635, enemy: 'charger', formation: 'line', count: 6, lane: 44 },
  { at: 4720, enemy: 'turret', formation: 'line', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 4805, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 4890, enemy: 'charger', formation: 'line', count: 6, lane: 50 },
  { at: 4975, enemy: 'weaver', formation: 'line', count: 5, lane: 44, origin: 'acrossMinus' },
  { at: 5060, enemy: 'warden', formation: 'line', count: 6, lane: 60 },
  { at: 5145, enemy: 'turret', formation: 'line', count: 6, lane: 45, origin: 'acrossPlus' },
  { at: 5230, enemy: 'lancer', formation: 'line', count: 6, lane: 55 },
  { at: 5315, enemy: 'charger', formation: 'line', count: 6, lane: 42, origin: 'acrossMinus' },
  { at: 5400, enemy: 'weaver', formation: 'line', count: 5, lane: 56 },
  { at: 5485, enemy: 'warden', formation: 'line', count: 6, lane: 49, origin: 'acrossPlus' },
  { at: 5570, enemy: 'turret', formation: 'line', count: 6, lane: 50 },
  { at: 5655, enemy: 'lancer', formation: 'line', count: 6, lane: 41, origin: 'acrossMinus' },
  { at: 5740, enemy: 'charger', formation: 'line', count: 6, lane: 60 },
  { at: 5825, enemy: 'weaver', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 5910, enemy: 'warden', formation: 'line', count: 6, lane: 55 },
  { at: 5995, enemy: 'turret', formation: 'line', count: 6, lane: 42, origin: 'acrossMinus' },
  { at: 6080, enemy: 'lancer', formation: 'line', count: 6, lane: 59 },
  { at: 6165, enemy: 'charger', formation: 'line', count: 6, lane: 49, origin: 'acrossPlus' },
];

/**
 * ⚠️ **Level six's idea is density, which is exactly what makes reaching one of these expensive.** Six
 * pickups over a script with no gaps in it is the level that will say soonest whether 0082's budget is
 * too mean — if any level leaves the player unable to reach what it offers, it is this one, and the
 * play-test after this chunk is where that shows.
 */
const GAUNTLET_PICKUPS: readonly PickupEntry[] = [
  { at: 280, kind: 'shield', lane: 58 },
  { at: 880, kind: 'weapon', lane: 42 },
  { at: 1680, kind: 'missile', lane: 66 },
  { at: 2300, kind: 'weapon', lane: 34 },
  { at: 3100, kind: 'weapon', lane: 60 },
  { at: 3800, kind: 'missile', lane: 38 },
  { at: 4600, kind: 'weapon', lane: 54 },
  { at: 5350, kind: 'bomb', lane: 44 },
  { at: 5950, kind: 'shield', lane: 46 },
];

/*
  LEVEL SEVEN — ALL OF IT.

  ⚠️ **The last authored level, and its idea is that it has none of its own.** Every kind, the
  tightest spacing in the game at 82 units, the largest counts, and a flank every second wave.
  `docs/game.md` describes a run as eight levels deep; seven exist, and the eighth is where the final
  boss goes when there is one to put in it.
*/
const EYE: readonly WaveEntry[] = [
  { at: 300, enemy: 'weaver', formation: 'line', count: 5, lane: 47 },
  { at: 382, enemy: 'charger', formation: 'line', count: 5, lane: 58 },
  { at: 464, enemy: 'turret', formation: 'line', count: 5, lane: 42, origin: 'acrossMinus' },
  { at: 546, enemy: 'weaver', formation: 'line', count: 5, lane: 53 },
  { at: 628, enemy: 'charger', formation: 'line', count: 5, lane: 44 },
  { at: 710, enemy: 'turret', formation: 'line', count: 5, lane: 60, origin: 'acrossPlus' },
  { at: 792, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 874, enemy: 'charger', formation: 'line', count: 5, lane: 40 },
  { at: 956, enemy: 'turret', formation: 'line', count: 5, lane: 47, origin: 'acrossMinus' },
  { at: 1038, enemy: 'warden', formation: 'line', count: 6, lane: 50 },
  { at: 1120, enemy: 'charger', formation: 'line', count: 6, lane: 41 },
  { at: 1202, enemy: 'weaver', formation: 'line', count: 5, lane: 56, origin: 'acrossMinus' },
  { at: 1284, enemy: 'warden', formation: 'line', count: 6, lane: 45 },
  { at: 1366, enemy: 'charger', formation: 'line', count: 6, lane: 55 },
  { at: 1448, enemy: 'weaver', formation: 'line', count: 5, lane: 44, origin: 'acrossPlus' },
  { at: 1530, enemy: 'warden', formation: 'line', count: 6, lane: 59 },
  { at: 1612, enemy: 'charger', formation: 'line', count: 6, lane: 49 },
  { at: 1694, enemy: 'weaver', formation: 'line', count: 5, lane: 50, origin: 'acrossMinus' },
  { at: 1776, enemy: 'warden', formation: 'line', count: 6, lane: 41 },
  { at: 1858, enemy: 'charger', formation: 'line', count: 6, lane: 60 },
  { at: 1940, enemy: 'weaver', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 2022, enemy: 'warden', formation: 'line', count: 6, lane: 55 },
  { at: 2104, enemy: 'charger', formation: 'line', count: 6, lane: 42 },
  { at: 2186, enemy: 'weaver', formation: 'line', count: 5, lane: 56, origin: 'acrossMinus' },
  { at: 2268, enemy: 'warden', formation: 'line', count: 6, lane: 49 },
  { at: 2350, enemy: 'charger', formation: 'vee', count: 6, lane: 47 },
  { at: 2432, enemy: 'turret', formation: 'vee', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 2514, enemy: 'warden', formation: 'vee', count: 6, lane: 42 },
  { at: 2596, enemy: 'charger', formation: 'vee', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 2678, enemy: 'turret', formation: 'vee', count: 6, lane: 44 },
  { at: 2760, enemy: 'warden', formation: 'vee', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 2842, enemy: 'charger', formation: 'vee', count: 6, lane: 50 },
  { at: 2924, enemy: 'turret', formation: 'vee', count: 6, lane: 40, origin: 'acrossPlus' },
  { at: 3006, enemy: 'warden', formation: 'vee', count: 6, lane: 47 },
  { at: 3088, enemy: 'charger', formation: 'vee', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 3170, enemy: 'turret', formation: 'vee', count: 6, lane: 42 },
  { at: 3252, enemy: 'warden', formation: 'vee', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 3334, enemy: 'charger', formation: 'vee', count: 6, lane: 44 },
  { at: 3416, enemy: 'turret', formation: 'vee', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 3498, enemy: 'warden', formation: 'vee', count: 6, lane: 50 },
  { at: 3580, enemy: 'charger', formation: 'vee', count: 6, lane: 40, origin: 'acrossPlus' },
  { at: 3662, enemy: 'weaver', formation: 'column', count: 5, lane: 50 },
  { at: 3744, enemy: 'charger', formation: 'column', count: 6, lane: 41, origin: 'acrossMinus' },
  { at: 3826, enemy: 'warden', formation: 'column', count: 6, lane: 60 },
  { at: 3908, enemy: 'turret', formation: 'column', count: 6, lane: 45, origin: 'acrossPlus' },
  { at: 3990, enemy: 'weaver', formation: 'column', count: 5, lane: 55 },
  { at: 4072, enemy: 'charger', formation: 'column', count: 6, lane: 42, origin: 'acrossMinus' },
  { at: 4154, enemy: 'warden', formation: 'column', count: 6, lane: 59 },
  { at: 4236, enemy: 'turret', formation: 'column', count: 6, lane: 49, origin: 'acrossPlus' },
  { at: 4318, enemy: 'weaver', formation: 'column', count: 5, lane: 50 },
  { at: 4400, enemy: 'charger', formation: 'column', count: 6, lane: 41, origin: 'acrossMinus' },
  { at: 4482, enemy: 'warden', formation: 'column', count: 6, lane: 60 },
  { at: 4564, enemy: 'turret', formation: 'column', count: 6, lane: 45, origin: 'acrossPlus' },
  { at: 4646, enemy: 'weaver', formation: 'column', count: 5, lane: 55 },
  { at: 4728, enemy: 'charger', formation: 'column', count: 6, lane: 42, origin: 'acrossMinus' },
  { at: 4810, enemy: 'warden', formation: 'column', count: 6, lane: 59 },
  { at: 4892, enemy: 'turret', formation: 'column', count: 6, lane: 49, origin: 'acrossPlus' },
  { at: 4974, enemy: 'charger', formation: 'line', count: 6, lane: 47 },
  { at: 5056, enemy: 'warden', formation: 'line', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 5138, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 5220, enemy: 'turret', formation: 'line', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 5302, enemy: 'lancer', formation: 'line', count: 6, lane: 44 },
  { at: 5384, enemy: 'charger', formation: 'line', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 5466, enemy: 'warden', formation: 'line', count: 6, lane: 50 },
  { at: 5548, enemy: 'weaver', formation: 'line', count: 5, lane: 44, origin: 'acrossPlus' },
  { at: 5630, enemy: 'turret', formation: 'line', count: 6, lane: 47 },
  { at: 5712, enemy: 'lancer', formation: 'line', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 5794, enemy: 'charger', formation: 'line', count: 6, lane: 42 },
  { at: 5876, enemy: 'warden', formation: 'line', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 5958, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 6040, enemy: 'turret', formation: 'line', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 6122, enemy: 'lancer', formation: 'line', count: 6, lane: 50 },
  { at: 6204, enemy: 'charger', formation: 'line', count: 6, lane: 40, origin: 'acrossPlus' },
  { at: 6286, enemy: 'warden', formation: 'line', count: 6, lane: 47 },
];

/**
 * ⚠️ **The last authored level, and its pickups are the same six as the first one's.** That is the
 * point rather than an oversight: 0082's budget is a property of *a level*, and a run that reached
 * here is carrying whatever survived six levels' worth of deaths. What makes level seven harder than
 * level one is the script above it, not what it withholds.
 */
const EYE_PICKUPS: readonly PickupEntry[] = [
  { at: 280, kind: 'shield', lane: 48 },
  { at: 880, kind: 'weapon', lane: 64 },
  { at: 1680, kind: 'missile', lane: 32 },
  { at: 2300, kind: 'weapon', lane: 56 },
  { at: 3100, kind: 'weapon', lane: 40 },
  { at: 3800, kind: 'missile', lane: 62 },
  // ⚠️ 4800 rather than the 4600 the other levels use, and it is the boss being furthest away here:
  // level seven's is at 6540, so a cap at 4600 would leave a 54-second run to it with nothing to
  // rearm from — four seconds inside `tests/pickups.test.ts`'s ceiling, which is not headroom.
  { at: 4800, kind: 'weapon', lane: 34 },
  { at: 5500, kind: 'bomb', lane: 52 },
  { at: 6050, kind: 'shield', lane: 60 },
];

export const LEVELS: Record<LevelKind, LevelRow> = {
  /**
   * The first level.
   *
   * ⚠️ **The name claims no biome.** `docs/game.md` themes levels on the fourteen *Far Carry* biomes
   * and names none of them, and going to the predecessor to pick one is browsing it for inspiration —
   * which `CLAUDE.md` refuses. Theming is owed with the level roster and is a one-line table edit.
   */
  approach: {
    waves: APPROACH,
    pickups: APPROACH_PICKUPS,
    /*
      ⚠️ **250 units of quiet before the boss, which is about seven seconds.** It is not padding: the
      last wave is the densest in the level, and arriving at a 26-unit hull still clearing the
      previous fight would make the first phase unreadable — and the first phase is where the player
      learns where the hull ends. `src/content/bosses.ts` says that is what it is for.
    */
    bossAt: 6350,
    boss: 'sentinel',
  },
  /**
   * The second level.
   *
   * ⚠️ **Named for the descent toward the centre of the galaxy and for no biome**, on the same terms
   * as `approach`: `docs/game.md` themes levels on the fourteen *Far Carry* biomes and names none of
   * them here, and going to the predecessor to pick one is browsing it for inspiration, which
   * `CLAUDE.md` refuses.
   */
  descent: {
    waves: DESCENT,
    pickups: DESCENT_PICKUPS,
    bossAt: 6400,
    boss: 'harrow',
  },
  /**
   * Level three. Its idea is written above its script.
   *
   * ⚠️ **The name claims no biome**, on the same terms as the two above: `docs/game.md` themes levels
   * on the fourteen *Far Carry* biomes and names none of them, and going to the predecessor to pick
   * one is browsing it for inspiration, which `CLAUDE.md` refuses.
   */
  coilward: {
    waves: COILWARD,
    pickups: COILWARD_PICKUPS,
    bossAt: 6350,
    boss: 'lattice',
  },
  /**
   * Level four. Its idea is written above its script.
   *
   * ⚠️ **The name claims no biome**, on the same terms as the two above: `docs/game.md` themes levels
   * on the fourteen *Far Carry* biomes and names none of them, and going to the predecessor to pick
   * one is browsing it for inspiration, which `CLAUDE.md` refuses.
   */
  shoal: {
    waves: SHOAL,
    pickups: SHOAL_PICKUPS,
    bossAt: 6320,
    boss: 'shoalMother',
  },
  /**
   * Level five. Its idea is written above its script.
   *
   * ⚠️ **The name claims no biome**, on the same terms as the two above: `docs/game.md` themes levels
   * on the fourteen *Far Carry* biomes and names none of them, and going to the predecessor to pick
   * one is browsing it for inspiration, which `CLAUDE.md` refuses.
   */
  batteries: {
    waves: BATTERIES,
    pickups: BATTERIES_PICKUPS,
    bossAt: 6320,
    boss: 'redoubt',
  },
  /**
   * Level six. Its idea is written above its script.
   *
   * ⚠️ **The name claims no biome**, on the same terms as the two above: `docs/game.md` themes levels
   * on the fourteen *Far Carry* biomes and names none of them, and going to the predecessor to pick
   * one is browsing it for inspiration, which `CLAUDE.md` refuses.
   */
  gauntlet: {
    waves: GAUNTLET,
    pickups: GAUNTLET_PICKUPS,
    bossAt: 6420,
    boss: 'chorus',
  },
  /**
   * Level seven. Its idea is written above its script.
   *
   * ⚠️ **The name claims no biome**, on the same terms as the two above: `docs/game.md` themes levels
   * on the fourteen *Far Carry* biomes and names none of them, and going to the predecessor to pick
   * one is browsing it for inspiration, which `CLAUDE.md` refuses.
   */
  eye: {
    waves: EYE,
    pickups: EYE_PICKUPS,
    bossAt: 6540,
    boss: 'axis',
  },
};
