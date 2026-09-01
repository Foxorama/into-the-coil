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
import type { ThemeKind } from './themes.ts';
import type { LevelSections } from './music.ts';

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

/**
 * One of a place's landmarks, and where along the level it goes past.
 *
 * `docs/decisions/0203-the-rule-was-never-about-size.md`. Every sky layer before this was a TILED
 * FIELD — `extent` is a repeat period, so a field has no position and cannot be anywhere in
 * particular. *"When the massive pipe organ kicks in music wise we see the pillars of god going
 * past"* is a statement about a position, so it needs one.
 *
 * ⚠️ **`at` IS THE SAME AXIS `waves`, `bossAt` AND `sections` USE**, which is the whole reason the ask
 * is reachable without touching the music. Ember Nebula's organ opens at `push`; level two's `push`
 * is at 1299; so the Pillars are an entry at 1299 and *"the pillars arrive with the organ"* is
 * **authored, not synchronised**. `docs/decisions/0160-the-music-free-runs.md` took the sim out of
 * the music entirely, and a runtime hook from the sky to the audio clock would put it back.
 * `tests/sky.test.ts` asserts the two numbers are equal.
 */
export interface LandmarkEntry {
  /** World units from the level's start, exactly as a wave's `at` is. */
  at: number;
  /** Where across the lane its centre sits, 0 to 100. */
  lane: number;
  /**
   * How far it moves per unit of camera travel — below every field's, so it is furthest away.
   *
   * ⚠️ **0203 KEPT 0112's *slower* CLAUSE AND STRUCK ONLY *no edge*.** A landmark that moved at a
   * field's rate would be a large object going past at the speed of the things that can kill you,
   * which is 0069's actual concern stated properly.
   */
  depth: number;
}

export interface LevelRow {
  /** In order of `at`, ascending. `tests/level.test.ts` holds that, because the spawner assumes it. */
  waves: readonly WaveEntry[];
  /**
   * The place's landmarks, in order of `at`. Empty for a place whose landmark is not authored yet —
   * 0203 lands them one at a time, because *"none of those elements are transposable"* and a shared
   * placeholder shape is exactly 0196's failure spelled differently.
   */
  landmarks: readonly LandmarkEntry[];
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
  /**
   * What the music DOES over this level, as a script — in order of `at`, ascending, opening at `0`.
   *
   * ⚠️ **`docs/decisions/0158-a-level-says-where-its-sections-open.md`.** Reported: *"can we
   * rearrange the four sections? or have them different per level as well? some levels kick right
   * into a surge etc, if we have the exact same timing for each for each it's also going to be a
   * limiter."* Until 0158 this was three constants in `src/content/music.ts` measured back from
   * whichever boss a level had, so all seven levels had the same shape by construction.
   *
   * ⚠️ **A LIST BESIDE `waves` AND `pickups` RATHER THAN A LADDER**, which is what makes order and
   * count free: nothing requires the four names, requires them once, or requires them in order. A
   * level may open at `surge` and drop away.
   *
   * ⚠️ **LEVEL-LOCAL, like `waves`, `pickups` and `bossAt`** —
   * `docs/decisions/0100-a-level-places-its-pickups-too.md`, which is the decision written because
   * every authored pickup in levels two to seven was placed in the wrong space and culled on the
   * step it spawned. The origin is added by the caller, never here.
   *
   * ⚠️ **AND `bossAt` ENDS THE LAST SECTION, so a script never names the fight.** `boss` and
   * `bossPeak` are keyed to the boss's HEALTH and not to a distance
   * (`docs/decisions/0113-there-is-one-composition-and-seven-levels.md`), so they are not things a
   * script may open — `SectionName` excludes them at the type level.
   */
  sections: LevelSections;
  boss: BossKind;
  /**
   * Where this level IS — its backdrop and how it mixes the music.
   *
   * ⚠️ **`docs/decisions/0107-a-level-is-a-place.md`, and it closes `docs/game.md`'s *"no level is
   * themed yet"*.** Reported from play: *"the same music and boss music repeats level after level
   * after level… I think we're close to the part where we need to introduce the biomes and level
   * themes now to start differentiating levels."*
   *
   * ⚠️ **A KIND rather than the colours and gains themselves**, per
   * `docs/decisions/0016-a-hub-enumerates-kinds.md`: what a place looks and sounds like is
   * `src/content/themes.ts`'s answer, and a level script is a list of waves. Two levels sharing a
   * theme is a thing a run may want and this shape allows it.
   */
  theme: ThemeKind;
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
  { at: 377, enemy: 'lancer', formation: 'column', count: 4, lane: 50 },
  { at: 435, enemy: 'drifter', formation: 'vee', count: 6, lane: 55 },
  { at: 494, enemy: 'lancer', formation: 'line', count: 4, lane: 30 },
  { at: 551, enemy: 'drifter', formation: 'line', count: 5, lane: 65 },
  { at: 609, enemy: 'lancer', formation: 'vee', count: 5, lane: 45 },
  { at: 667, enemy: 'drifter', formation: 'vee', count: 6, lane: 50 },

  // ── Weavers. Introduced alone, then mixed into shapes that were safe without them. ──────────────
  { at: 725, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 754, enemy: 'drifter', formation: 'line', count: 5, lane: 38 },
  { at: 783, enemy: 'drifter', formation: 'line', count: 5, lane: 65 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 812, enemy: 'weaver', formation: 'vee', count: 4, lane: 62 },
  { at: 841, enemy: 'weaver', formation: 'column', count: 5, lane: 55 },
  { at: 899, enemy: 'lancer', formation: 'vee', count: 5, lane: 50 },
  { at: 956, enemy: 'weaver', formation: 'line', count: 5, lane: 40 },
  { at: 1015, enemy: 'drifter', formation: 'line', count: 6, lane: 35 },
  { at: 1073, enemy: 'weaver', formation: 'vee', count: 5, lane: 60 },
  { at: 1130, enemy: 'lancer', formation: 'column', count: 5, lane: 40 },
  { at: 1189, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },
  { at: 1246, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 1305, enemy: 'lancer', formation: 'line', count: 5, lane: 65 },
  { at: 1362, enemy: 'drifter', formation: 'vee', count: 6, lane: 40 },
  { at: 1420, enemy: 'weaver', formation: 'column', count: 5, lane: 30 },
  { at: 1479, enemy: 'lancer', formation: 'vee', count: 5, lane: 55 },
  { at: 1536, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },

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
  { at: 1594, enemy: 'weaver', formation: 'column', count: 5, lane: 30 },
  { at: 1652, enemy: 'drifter', formation: 'line', count: 5, lane: 60 },
  { at: 1710, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 1768, enemy: 'drifter', formation: 'vee', count: 6, lane: 50 },
  { at: 1826, enemy: 'weaver', formation: 'line', count: 5, lane: 55 },
  { at: 1884, enemy: 'drifter', formation: 'line', count: 6, lane: 35 },
  { at: 1941, enemy: 'drifter', formation: 'vee', count: 6, lane: 65 },
  { at: 2000, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },

  // ── Teeth. The lancer first, at the two health the run-up was hiding, and then the turret at three
  //    — so the level introduces *takes more than one shot* and *takes three* as two separate events.
  { at: 2073, enemy: 'drifter', formation: 'column', count: 5, lane: 40 },
  { at: 2115, enemy: 'drifter', formation: 'vee', count: 6, lane: 45 },
  { at: 2174, enemy: 'drifter', formation: 'line', count: 5, lane: 50 },
  { at: 2231, enemy: 'turret', formation: 'column', count: 5, lane: 30 },
  { at: 2290, enemy: 'lancer', formation: 'line', count: 5, lane: 60 },
  { at: 2347, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },
  { at: 2405, enemy: 'turret', formation: 'column', count: 4, lane: 40 },
  { at: 2464, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },

  // ── Chargers. Faster than a reaction, so they have to be seen coming. ───────────────────────────
  { at: 2521, enemy: 'charger', formation: 'line', count: 5, lane: 50 },
  { at: 2579, enemy: 'drifter', formation: 'line', count: 6, lane: 35 },
  { at: 2637, enemy: 'charger', formation: 'column', count: 5, lane: 65, origin: 'acrossMinus' },
  { at: 2695, enemy: 'lancer', formation: 'vee', count: 5, lane: 45 },
  { at: 2753, enemy: 'charger', formation: 'column', count: 4, lane: 55, origin: 'acrossPlus' },
  { at: 2811, enemy: 'turret', formation: 'line', count: 4, lane: 40 },
  { at: 2869, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 2926, enemy: 'charger', formation: 'line', count: 5, lane: 50 },
  { at: 2985, enemy: 'lancer', formation: 'column', count: 5, lane: 60 },
  { at: 3043, enemy: 'drifter', formation: 'vee', count: 6, lane: 40 },
  { at: 3101, enemy: 'charger', formation: 'column', count: 5, lane: 30, origin: 'acrossMinus' },
  { at: 3159, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },
  { at: 3216, enemy: 'turret', formation: 'column', count: 5, lane: 65 },
  { at: 3275, enemy: 'charger', formation: 'line', count: 5, lane: 55 },

  // ── Everything, at density. The stretch that decides whether three lives was the right number. ──
  { at: 3332, enemy: 'lancer', formation: 'vee', count: 6, lane: 50 },
  { at: 3390, enemy: 'turret', formation: 'column', count: 5, lane: 25 },
  { at: 3442, enemy: 'charger', formation: 'line', count: 5, lane: 60 },
  { at: 3494, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 3545, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },
  { at: 3596, enemy: 'charger', formation: 'column', count: 5, lane: 70, origin: 'acrossPlus' },
  { at: 3648, enemy: 'lancer', formation: 'line', count: 5, lane: 35 },
  { at: 3700, enemy: 'turret', formation: 'line', count: 5, lane: 45 },
  { at: 3751, enemy: 'weaver', formation: 'vee', count: 5, lane: 55 },
  { at: 3802, enemy: 'charger', formation: 'vee', count: 6, lane: 50 },
  { at: 3854, enemy: 'drifter', formation: 'vee', count: 6, lane: 35 },
  { at: 3905, enemy: 'lancer', formation: 'column', count: 5, lane: 65 },
  { at: 3957, enemy: 'turret', formation: 'column', count: 5, lane: 40 },
  { at: 4009, enemy: 'charger', formation: 'column', count: 6, lane: 50, origin: 'acrossMinus' },
  { at: 4060, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
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
    ⚠️ **THE FIRST THING THE LEVEL OFFERS IS A WEAPON, AND IT WAS A SHIELD.** Asked for after playing
    the compressed levels: *"this might need the first pickup changed to a weapon increase instead of
    a shield"* — offered by the player as the price of the density below, and it is the right price.
    A level that puts 23% more bodies in front of the ship and still opens with armour is asking the
    player to survive the change rather than answer it.

    ⚠️ **IT IS A SWAP AND NOT AN ADDITION.** The shield takes the weapon's old place, so
    `docs/decisions/0083-two-ladders-of-four.md`'s budget — four weapons, two missiles, one bomb, two
    shields — is untouched, and `tests/pickups.test.ts` holds it.

    ⚠️ **What it costs is stated rather than discovered: the dial climbs one pickup sooner.**
    `weaponsOffered` increments where a weapon is PLACED
    (`docs/decisions/0084-the-dial-is-the-level-and-the-guns.md`), so difficulty now starts rising in
    the opening stretch. 0086's run-up still holds the multi-hit kinds back until the second weapon.

    ⚠️ **The stretch it sits in is still empty.**
    `docs/decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md` gave the player that quiet
    so the first thing that happens to them is not a death, and the compression below deliberately
    did not touch it. Reaching this is still a decision, made against an empty screen — what changed
    is what they get for making it.

    ⚠️ **The shield used to be a PAIR — a shield or an extra life, whichever face the camera showed.**
    0082 dropped both the cycle and the extra life, so what the level authors is what the player gets.
  */
  { at: 267, kind: 'weapon', lane: 40 },
  /*
    ⚠️ **THE FIRST WEAPON, and it is late on purpose.** A player flies the base ship for twenty-four
    seconds and a full wave of drifters before anything changes, so the change is something they
    notice rather than something that happens to them.
  */
  { at: 686, kind: 'shield', lane: 25 },
  /*
    ⚠️ **THE FIRST MISSILE PICKUP IS THE SECOND WEAPON ARRIVING AT ALL.** The base ship has no tube
    (`docs/decisions/0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md`) and the ladder
    puts the first tube on tier 1, so this is not an upgrade to a thing the player has — it is a new
    thing. It comes after the first weapon because one new weapon at a time is how either gets noticed.
  */
  { at: 1201, kind: 'missile', lane: 62 },
  { at: 1588, kind: 'weapon', lane: 34 },
  { at: 2103, kind: 'weapon', lane: 68 },
  { at: 2554, kind: 'missile', lane: 30 },
  /*
    ⚠️ **THE FOURTH WEAPON CAPS THE GUNS, AND IT DOES IT 1,750 UNITS — FORTY-EIGHT SECONDS — BEFORE
    THE BOSS.** That is the ask: *"I want the player to be able to cap weapons before the 1st boss and
    then also have a couple of additional shields/bombs."* It is the only placement in this list with a
    stated target behind it, and `tests/pickups.test.ts` holds it as arithmetic against `UPGRADE_TIERS`
    rather than against the number four typed here.
  */
  { at: 3069, kind: 'weapon', lane: 50 },
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
  { at: 3519, kind: 'bomb', lane: 38 },
  // ⚠️ The last one is before the boss rather than during it. A fight that hands out shields while
  // it is being fought is a fight whose difficulty is a supply line — 0040 keeps a boss to its own
  // clock, and this is the shell the player takes INTO it.
  { at: 3905, kind: 'shield', lane: 62 },
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
  { at: 355, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 365, enemy: 'spinner', formation: 'column', count: 3, lane: 30 },
  { at: 420, enemy: 'lancer', formation: 'line', count: 5, lane: 65 },
  { at: 474, enemy: 'charger', formation: 'vee', count: 5, lane: 50 },
  { at: 530, enemy: 'drifter', formation: 'vee', count: 6, lane: 40 },
  { at: 584, enemy: 'weaver', formation: 'column', count: 5, lane: 60 },
  { at: 640, enemy: 'lancer', formation: 'column', count: 5, lane: 35 },

  // ── Wardens. Four health, weaving, and shooting — the first thing that is two problems at once. ─
  { at: 694, enemy: 'warden', formation: 'line', count: 3, lane: 50 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 722, enemy: 'weaver', formation: 'line', count: 5, lane: 60 },
  { at: 750, enemy: 'charger', formation: 'column', count: 5, lane: 30, origin: 'acrossMinus' },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 778, enemy: 'drifter', formation: 'vee', count: 5, lane: 36 },
  { at: 805, enemy: 'drifter', formation: 'line', count: 6, lane: 55 },
  { at: 859, enemy: 'warden', formation: 'column', count: 3, lane: 40 },
  { at: 915, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },
  { at: 969, enemy: 'lancer', formation: 'vee', count: 5, lane: 62 },
  { at: 1025, enemy: 'warden', formation: 'line', count: 3, lane: 45 },
  // ⚠️ Filler, and it was filling something the density guard measured rather than something anybody
  // felt: two three-wide waves in a row used to be a six-enemy trough, and wardens are four health
  // each so making THEM more numerous would have changed the level's difficulty to fix its pacing.
  //
  // ⚠️ **IT IS NO LONGER LOAD-BEARING ON ITS OWN** — 0113 compressed every level by thirty seconds
  // without removing a body, so the view holds more at once and this wave can go without the guard
  // noticing. Driven: one removed is green, two are green, three go red. It stays because the level
  // was authored with it, not because the floor still needs it.
  { at: 1052, enemy: 'drifter', formation: 'line', count: 5, lane: 62 },
  { at: 1079, enemy: 'turret', formation: 'line', count: 3, lane: 55 },
  { at: 1134, enemy: 'charger', formation: 'column', count: 5, lane: 25, origin: 'acrossPlus' },
  { at: 1190, enemy: 'drifter', formation: 'vee', count: 6, lane: 50 },
  { at: 1244, enemy: 'warden', formation: 'vee', count: 3, lane: 50 },
  { at: 1300, enemy: 'weaver', formation: 'line', count: 5, lane: 40 },
  { at: 1354, enemy: 'lancer', formation: 'line', count: 5, lane: 68 },
  { at: 1410, enemy: 'charger', formation: 'line', count: 5, lane: 45 },
  { at: 1464, enemy: 'spinner', formation: 'column', count: 3, lane: 35 },

  // ── Chargers at density, through standing fire. The stretch that punishes standing still. ───────
  { at: 1519, enemy: 'charger', formation: 'vee', count: 5, lane: 55 },
  { at: 1574, enemy: 'warden', formation: 'line', count: 3, lane: 45 },
  { at: 1629, enemy: 'lancer', formation: 'line', count: 6, lane: 50 },
  { at: 1685, enemy: 'charger', formation: 'column', count: 5, lane: 35, origin: 'acrossMinus' },
  { at: 1739, enemy: 'turret', formation: 'line', count: 3, lane: 60 },
  { at: 1794, enemy: 'weaver', formation: 'column', count: 5, lane: 30 },
  { at: 1849, enemy: 'charger', formation: 'column', count: 5, lane: 70, origin: 'acrossPlus' },
  { at: 1904, enemy: 'lancer', formation: 'vee', count: 5, lane: 50 },
  { at: 1959, enemy: 'warden', formation: 'column', count: 3, lane: 55 },
  { at: 2014, enemy: 'charger', formation: 'line', count: 6, lane: 42 },
  { at: 2070, enemy: 'charger', formation: 'vee', count: 5, lane: 60 },
  { at: 2124, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 2179, enemy: 'turret', formation: 'column', count: 3, lane: 28 },
  { at: 2234, enemy: 'lancer', formation: 'line', count: 5, lane: 65 },
  { at: 2289, enemy: 'warden', formation: 'line', count: 3, lane: 45 },
  { at: 2344, enemy: 'charger', formation: 'column', count: 5, lane: 50, origin: 'acrossMinus' },

  // ── Everything, with wardens holding the lane the player wants. ─────────────────────────────────
  { at: 2399, enemy: 'charger', formation: 'vee', count: 6, lane: 55 },
  { at: 2454, enemy: 'warden', formation: 'vee', count: 3, lane: 50 },
  { at: 2509, enemy: 'weaver', formation: 'line', count: 5, lane: 40 },
  { at: 2564, enemy: 'charger', formation: 'column', count: 5, lane: 65 },
  { at: 2619, enemy: 'turret', formation: 'line', count: 3, lane: 45 },
  { at: 2674, enemy: 'lancer', formation: 'column', count: 5, lane: 32 },
  { at: 2729, enemy: 'warden', formation: 'line', count: 3, lane: 58 },
  { at: 2784, enemy: 'charger', formation: 'vee', count: 5, lane: 45 },
  { at: 2839, enemy: 'lancer', formation: 'line', count: 6, lane: 50 },
  { at: 2894, enemy: 'weaver', formation: 'vee', count: 5, lane: 55 },
  { at: 2949, enemy: 'turret', formation: 'column', count: 3, lane: 70 },
  { at: 3004, enemy: 'lancer', formation: 'vee', count: 5, lane: 38 },
  { at: 3059, enemy: 'warden', formation: 'column', count: 3, lane: 50 },
  { at: 3114, enemy: 'charger', formation: 'column', count: 5, lane: 60, origin: 'acrossPlus' },
  { at: 3169, enemy: 'charger', formation: 'vee', count: 6, lane: 45 },
  { at: 3224, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 3279, enemy: 'lancer', formation: 'line', count: 5, lane: 30 },

  // ── The hardest stretch in the game so far. ─────────────────────────────────────────────────────
  { at: 3334, enemy: 'warden', formation: 'line', count: 4, lane: 50 },
  { at: 3385, enemy: 'charger', formation: 'vee', count: 5, lane: 55 },
  { at: 3438, enemy: 'turret', formation: 'line', count: 3, lane: 40 },
  { at: 3489, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 3540, enemy: 'charger', formation: 'column', count: 5, lane: 65, origin: 'acrossMinus' },
  { at: 3593, enemy: 'lancer', formation: 'vee', count: 5, lane: 50 },
  { at: 3644, enemy: 'warden', formation: 'column', count: 4, lane: 35 },
  { at: 3696, enemy: 'drifter', formation: 'line', count: 6, lane: 55 },
  { at: 3748, enemy: 'charger', formation: 'column', count: 5, lane: 25 },
  { at: 3799, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },
  { at: 3851, enemy: 'turret', formation: 'column', count: 3, lane: 68 },
  { at: 3903, enemy: 'warden', formation: 'vee', count: 3, lane: 45 },
  { at: 3955, enemy: 'lancer', formation: 'line', count: 5, lane: 60 },
  { at: 4006, enemy: 'charger', formation: 'column', count: 5, lane: 40, origin: 'acrossPlus' },
  { at: 4059, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },
  { at: 4110, enemy: 'warden', formation: 'line', count: 4, lane: 50 },
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
  { at: 267, kind: 'weapon', lane: 62 },
  { at: 721, kind: 'shield', lane: 28 },
  { at: 1238, kind: 'missile', lane: 66 },
  { at: 1658, kind: 'weapon', lane: 40 },
  { at: 2176, kind: 'weapon', lane: 30 },
  { at: 2629, kind: 'missile', lane: 58 },
  { at: 3146, kind: 'weapon', lane: 44 },
  { at: 3599, kind: 'bomb', lane: 52 },
  { at: 3955, kind: 'shield', lane: 32 },
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
  { at: 359, enemy: 'lancer', formation: 'line', count: 5, lane: 58 },
  { at: 418, enemy: 'drifter', formation: 'line', count: 5, lane: 42 },
  { at: 477, enemy: 'lancer', formation: 'line', count: 5, lane: 53, origin: 'acrossMinus' },
  { at: 536, enemy: 'drifter', formation: 'line', count: 5, lane: 44 },
  { at: 595, enemy: 'lancer', formation: 'line', count: 5, lane: 60 },
  { at: 654, enemy: 'drifter', formation: 'line', count: 5, lane: 50 },
  { at: 713, enemy: 'lancer', formation: 'line', count: 5, lane: 40, origin: 'acrossPlus' },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 742, enemy: 'charger', formation: 'vee', count: 4, lane: 40 },
  { at: 772, enemy: 'sower', formation: 'column', count: 5, lane: 50 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 801, enemy: 'drifter', formation: 'line', count: 5, lane: 64 },
  { at: 831, enemy: 'lancer', formation: 'column', count: 5, lane: 41 },
  { at: 890, enemy: 'lancer', formation: 'column', count: 5, lane: 60, origin: 'acrossMinus' },
  { at: 948, enemy: 'weaver', formation: 'column', count: 5, lane: 45 },
  { at: 1008, enemy: 'charger', formation: 'column', count: 5, lane: 55 },
  { at: 1067, enemy: 'lancer', formation: 'column', count: 5, lane: 42, origin: 'acrossPlus' },
  { at: 1126, enemy: 'weaver', formation: 'column', count: 5, lane: 56 },
  { at: 1185, enemy: 'charger', formation: 'column', count: 5, lane: 49 },
  { at: 1244, enemy: 'lancer', formation: 'column', count: 5, lane: 50, origin: 'acrossMinus' },
  { at: 1303, enemy: 'sower', formation: 'column', count: 5, lane: 44 },
  { at: 1361, enemy: 'lancer', formation: 'column', count: 5, lane: 60 },
  { at: 1420, enemy: 'lancer', formation: 'column', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 1480, enemy: 'weaver', formation: 'column', count: 5, lane: 55 },
  { at: 1539, enemy: 'warden', formation: 'column', count: 5, lane: 42 },
  { at: 1598, enemy: 'turret', formation: 'vee', count: 4, lane: 47 },
  { at: 1657, enemy: 'weaver', formation: 'vee', count: 4, lane: 56 },
  { at: 1716, enemy: 'lancer', formation: 'vee', count: 4, lane: 42, origin: 'acrossMinus' },
  { at: 1774, enemy: 'turret', formation: 'vee', count: 4, lane: 53 },
  { at: 1833, enemy: 'sower', formation: 'vee', count: 4, lane: 44 },
  { at: 1892, enemy: 'lancer', formation: 'vee', count: 4, lane: 60, origin: 'acrossPlus' },
  { at: 1952, enemy: 'turret', formation: 'vee', count: 4, lane: 50 },
  { at: 2011, enemy: 'weaver', formation: 'vee', count: 4, lane: 44 },
  { at: 2070, enemy: 'lancer', formation: 'vee', count: 4, lane: 47, origin: 'acrossMinus' },
  { at: 2129, enemy: 'turret', formation: 'vee', count: 4, lane: 58 },
  { at: 2187, enemy: 'weaver', formation: 'vee', count: 4, lane: 44 },
  { at: 2246, enemy: 'lancer', formation: 'vee', count: 4, lane: 53, origin: 'acrossPlus' },
  { at: 2305, enemy: 'turret', formation: 'vee', count: 4, lane: 44 },
  { at: 2364, enemy: 'weaver', formation: 'vee', count: 4, lane: 56 },
  { at: 2424, enemy: 'charger', formation: 'line', count: 5, lane: 50 },
  { at: 2483, enemy: 'charger', formation: 'line', count: 5, lane: 41, origin: 'acrossMinus' },
  { at: 2542, enemy: 'weaver', formation: 'line', count: 5, lane: 56 },
  { at: 2600, enemy: 'charger', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 2659, enemy: 'lancer', formation: 'line', count: 5, lane: 55 },
  { at: 2718, enemy: 'weaver', formation: 'line', count: 5, lane: 44, origin: 'acrossMinus' },
  { at: 2777, enemy: 'charger', formation: 'line', count: 5, lane: 59 },
  { at: 2836, enemy: 'charger', formation: 'line', count: 5, lane: 49, origin: 'acrossPlus' },
  { at: 2896, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 2955, enemy: 'charger', formation: 'line', count: 5, lane: 41, origin: 'acrossMinus' },
  { at: 3013, enemy: 'charger', formation: 'line', count: 5, lane: 60 },
  { at: 3072, enemy: 'weaver', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 3131, enemy: 'charger', formation: 'line', count: 5, lane: 55 },
  { at: 3190, enemy: 'lancer', formation: 'line', count: 5, lane: 42, origin: 'acrossMinus' },
  { at: 3249, enemy: 'charger', formation: 'column', count: 5, lane: 47 },
  { at: 3308, enemy: 'turret', formation: 'column', count: 5, lane: 58, origin: 'acrossMinus' },
  { at: 3368, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 3426, enemy: 'lancer', formation: 'column', count: 5, lane: 53, origin: 'acrossPlus' },
  { at: 3485, enemy: 'charger', formation: 'column', count: 5, lane: 44 },
  { at: 3544, enemy: 'turret', formation: 'column', count: 5, lane: 60, origin: 'acrossMinus' },
  { at: 3603, enemy: 'weaver', formation: 'column', count: 5, lane: 50 },
  { at: 3662, enemy: 'lancer', formation: 'column', count: 5, lane: 40, origin: 'acrossPlus' },
  { at: 3721, enemy: 'charger', formation: 'column', count: 5, lane: 47 },
  { at: 3780, enemy: 'turret', formation: 'column', count: 5, lane: 58, origin: 'acrossMinus' },
  { at: 3839, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 3898, enemy: 'lancer', formation: 'column', count: 5, lane: 53, origin: 'acrossPlus' },
  { at: 3957, enemy: 'charger', formation: 'column', count: 5, lane: 44 },
  { at: 4016, enemy: 'turret', formation: 'column', count: 5, lane: 60, origin: 'acrossMinus' },
];

/**
 * ⚠️ **Level three's lanes swing wider than level one's, which is its own idea reaching the pickups.**
 * The level is about `origin` — threats arriving across the lane rather than down it — so a player
 * crossing for a pickup here is crossing the axis the level attacks from. The pickups do not change;
 * what changes is what it costs to reach them.
 */
const COILWARD_PICKUPS: readonly PickupEntry[] = [
  { at: 300, kind: 'weapon', lane: 44 },
  { at: 697, kind: 'shield', lane: 56 },
  { at: 1210, kind: 'missile', lane: 34 },
  { at: 1614, kind: 'weapon', lane: 60 },
  { at: 2127, kind: 'weapon', lane: 38 },
  { at: 2576, kind: 'missile', lane: 56 },
  { at: 3089, kind: 'weapon', lane: 48 },
  { at: 3538, kind: 'bomb', lane: 46 },
  { at: 3891, kind: 'shield', lane: 38 },
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
  { at: 357, enemy: 'drifter', formation: 'line', count: 5, lane: 41 },
  { at: 415, enemy: 'charger', formation: 'line', count: 5, lane: 60 },
  { at: 472, enemy: 'drifter', formation: 'line', count: 5, lane: 45 },
  { at: 530, enemy: 'charger', formation: 'line', count: 5, lane: 55 },
  { at: 588, enemy: 'drifter', formation: 'line', count: 5, lane: 42 },
  { at: 645, enemy: 'charger', formation: 'line', count: 5, lane: 59 },
  { at: 703, enemy: 'drifter', formation: 'line', count: 5, lane: 49 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 731, enemy: 'drifter', formation: 'vee', count: 5, lane: 34 },
  { at: 760, enemy: 'charger', formation: 'column', count: 5, lane: 47 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 789, enemy: 'weaver', formation: 'line', count: 5, lane: 54 },
  { at: 817, enemy: 'weaver', formation: 'column', count: 5, lane: 56 },
  { at: 875, enemy: 'charger', formation: 'column', count: 5, lane: 42 },
  { at: 932, enemy: 'sower', formation: 'column', count: 5, lane: 53 },
  { at: 990, enemy: 'charger', formation: 'column', count: 5, lane: 44, origin: 'acrossMinus' },
  { at: 1048, enemy: 'weaver', formation: 'column', count: 5, lane: 56 },
  { at: 1105, enemy: 'charger', formation: 'column', count: 5, lane: 50 },
  { at: 1163, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 1220, enemy: 'charger', formation: 'column', count: 5, lane: 47 },
  { at: 1277, enemy: 'sower', formation: 'column', count: 5, lane: 56, origin: 'acrossPlus' },
  { at: 1335, enemy: 'charger', formation: 'column', count: 5, lane: 42 },
  { at: 1392, enemy: 'weaver', formation: 'column', count: 5, lane: 53 },
  { at: 1450, enemy: 'charger', formation: 'column', count: 5, lane: 44 },
  { at: 1508, enemy: 'weaver', formation: 'column', count: 5, lane: 56 },
  { at: 1565, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },
  { at: 1623, enemy: 'charger', formation: 'vee', count: 6, lane: 41 },
  { at: 1680, enemy: 'lancer', formation: 'vee', count: 6, lane: 60 },
  { at: 1737, enemy: 'weaver', formation: 'vee', count: 5, lane: 45, origin: 'acrossMinus' },
  { at: 1795, enemy: 'charger', formation: 'vee', count: 6, lane: 55 },
  { at: 1852, enemy: 'lancer', formation: 'vee', count: 6, lane: 42 },
  { at: 1910, enemy: 'weaver', formation: 'vee', count: 5, lane: 56 },
  { at: 1968, enemy: 'charger', formation: 'vee', count: 6, lane: 49, origin: 'acrossPlus' },
  { at: 2025, enemy: 'lancer', formation: 'vee', count: 6, lane: 50 },
  { at: 2083, enemy: 'weaver', formation: 'vee', count: 5, lane: 44 },
  { at: 2140, enemy: 'charger', formation: 'vee', count: 6, lane: 60 },
  { at: 2197, enemy: 'lancer', formation: 'vee', count: 6, lane: 45, origin: 'acrossMinus' },
  { at: 2255, enemy: 'weaver', formation: 'vee', count: 5, lane: 55 },
  { at: 2312, enemy: 'charger', formation: 'vee', count: 6, lane: 42 },
  { at: 2370, enemy: 'charger', formation: 'line', count: 5, lane: 47 },
  { at: 2428, enemy: 'weaver', formation: 'line', count: 5, lane: 56 },
  { at: 2485, enemy: 'turret', formation: 'line', count: 5, lane: 42, origin: 'acrossMinus' },
  { at: 2543, enemy: 'charger', formation: 'line', count: 5, lane: 53 },
  { at: 2600, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 2657, enemy: 'turret', formation: 'line', count: 5, lane: 60, origin: 'acrossPlus' },
  { at: 2715, enemy: 'charger', formation: 'line', count: 5, lane: 50 },
  { at: 2772, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 2830, enemy: 'turret', formation: 'line', count: 5, lane: 47, origin: 'acrossMinus' },
  { at: 2888, enemy: 'charger', formation: 'line', count: 5, lane: 58 },
  { at: 2945, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 3003, enemy: 'turret', formation: 'line', count: 5, lane: 53, origin: 'acrossPlus' },
  { at: 3060, enemy: 'charger', formation: 'line', count: 5, lane: 44 },
  { at: 3117, enemy: 'weaver', formation: 'line', count: 5, lane: 56 },
  { at: 3175, enemy: 'charger', formation: 'column', count: 6, lane: 50 },
  { at: 3232, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 3290, enemy: 'drifter', formation: 'column', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 3348, enemy: 'charger', formation: 'column', count: 6, lane: 45 },
  { at: 3405, enemy: 'charger', formation: 'column', count: 6, lane: 55 },
  { at: 3463, enemy: 'weaver', formation: 'column', count: 5, lane: 44, origin: 'acrossPlus' },
  { at: 3520, enemy: 'drifter', formation: 'column', count: 6, lane: 59 },
  { at: 3577, enemy: 'charger', formation: 'column', count: 6, lane: 49 },
  { at: 3635, enemy: 'charger', formation: 'column', count: 6, lane: 50, origin: 'acrossMinus' },
  { at: 3692, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 3750, enemy: 'drifter', formation: 'column', count: 6, lane: 60 },
  { at: 3808, enemy: 'charger', formation: 'column', count: 6, lane: 45, origin: 'acrossPlus' },
  { at: 3865, enemy: 'charger', formation: 'column', count: 6, lane: 55 },
  { at: 3923, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 3980, enemy: 'drifter', formation: 'column', count: 6, lane: 59, origin: 'acrossMinus' },
];

/**
 * ⚠️ **Level four is the charger's level, so a pickup here is a thing to be grabbed between passes.**
 * Nothing about the list says so — that is the waves' job — but it is why the bomb sits at 3,650,
 * inside the stretch where chargers arrive in vees: 0053's blast lands on everything in a third of the
 * lane at once, and a formation that comes back twice is the one thing in the game that is worth
 * spending a charge on rather than outflying.
 */
const SHOAL_PICKUPS: readonly PickupEntry[] = [
  { at: 292, kind: 'weapon', lane: 52 },
  { at: 684, kind: 'shield', lane: 36 },
  { at: 1195, kind: 'missile', lane: 62 },
  { at: 1590, kind: 'weapon', lane: 44 },
  { at: 2101, kind: 'weapon', lane: 58 },
  { at: 2549, kind: 'missile', lane: 40 },
  { at: 3060, kind: 'weapon', lane: 30 },
  { at: 3507, kind: 'bomb', lane: 50 },
  { at: 3853, kind: 'shield', lane: 66 },
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
  { at: 357, enemy: 'drifter', formation: 'line', count: 4, lane: 58 },
  { at: 415, enemy: 'spinner', formation: 'line', count: 4, lane: 42 },
  { at: 472, enemy: 'drifter', formation: 'line', count: 4, lane: 53 },
  { at: 530, enemy: 'turret', formation: 'line', count: 4, lane: 44 },
  { at: 588, enemy: 'drifter', formation: 'line', count: 4, lane: 60 },
  { at: 645, enemy: 'turret', formation: 'line', count: 4, lane: 50 },
  { at: 703, enemy: 'drifter', formation: 'line', count: 4, lane: 40 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 731, enemy: 'weaver', formation: 'vee', count: 4, lane: 42 },
  { at: 760, enemy: 'spinner', formation: 'column', count: 4, lane: 50 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 789, enemy: 'drifter', formation: 'line', count: 6, lane: 58 },
  { at: 817, enemy: 'warden', formation: 'column', count: 4, lane: 41 },
  { at: 875, enemy: 'turret', formation: 'column', count: 4, lane: 60 },
  { at: 932, enemy: 'warden', formation: 'column', count: 4, lane: 45 },
  { at: 990, enemy: 'turret', formation: 'column', count: 4, lane: 55 },
  { at: 1048, enemy: 'warden', formation: 'column', count: 4, lane: 42, origin: 'acrossMinus' },
  { at: 1105, enemy: 'spinner', formation: 'column', count: 4, lane: 59 },
  { at: 1163, enemy: 'warden', formation: 'column', count: 4, lane: 49 },
  { at: 1220, enemy: 'turret', formation: 'column', count: 4, lane: 50 },
  { at: 1277, enemy: 'warden', formation: 'column', count: 4, lane: 41 },
  { at: 1335, enemy: 'turret', formation: 'column', count: 4, lane: 60 },
  { at: 1392, enemy: 'warden', formation: 'column', count: 4, lane: 45, origin: 'acrossPlus' },
  { at: 1450, enemy: 'turret', formation: 'column', count: 4, lane: 55 },
  { at: 1508, enemy: 'warden', formation: 'column', count: 4, lane: 42 },
  { at: 1565, enemy: 'warden', formation: 'vee', count: 4, lane: 47 },
  { at: 1623, enemy: 'turret', formation: 'vee', count: 4, lane: 58 },
  { at: 1680, enemy: 'lancer', formation: 'vee', count: 4, lane: 42 },
  { at: 1737, enemy: 'warden', formation: 'vee', count: 4, lane: 53 },
  { at: 1795, enemy: 'turret', formation: 'vee', count: 4, lane: 44, origin: 'acrossMinus' },
  { at: 1852, enemy: 'lancer', formation: 'vee', count: 4, lane: 60 },
  { at: 1910, enemy: 'warden', formation: 'vee', count: 4, lane: 50 },
  { at: 1968, enemy: 'turret', formation: 'vee', count: 4, lane: 40 },
  { at: 2025, enemy: 'lancer', formation: 'vee', count: 4, lane: 47 },
  { at: 2083, enemy: 'warden', formation: 'vee', count: 4, lane: 58, origin: 'acrossPlus' },
  { at: 2140, enemy: 'turret', formation: 'vee', count: 4, lane: 42 },
  { at: 2197, enemy: 'lancer', formation: 'vee', count: 4, lane: 53 },
  { at: 2255, enemy: 'warden', formation: 'vee', count: 4, lane: 44 },
  { at: 2312, enemy: 'turret', formation: 'vee', count: 4, lane: 60 },
  { at: 2370, enemy: 'turret', formation: 'line', count: 5, lane: 50 },
  { at: 2428, enemy: 'warden', formation: 'line', count: 5, lane: 41 },
  { at: 2485, enemy: 'weaver', formation: 'line', count: 5, lane: 56 },
  { at: 2543, enemy: 'turret', formation: 'line', count: 5, lane: 45, origin: 'acrossMinus' },
  { at: 2600, enemy: 'warden', formation: 'line', count: 5, lane: 55 },
  { at: 2657, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 2715, enemy: 'turret', formation: 'line', count: 5, lane: 59 },
  { at: 2772, enemy: 'warden', formation: 'line', count: 5, lane: 49, origin: 'acrossPlus' },
  { at: 2830, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 2888, enemy: 'turret', formation: 'line', count: 5, lane: 41 },
  { at: 2945, enemy: 'warden', formation: 'line', count: 5, lane: 60 },
  { at: 3003, enemy: 'weaver', formation: 'line', count: 5, lane: 45, origin: 'acrossMinus' },
  { at: 3060, enemy: 'turret', formation: 'line', count: 5, lane: 55 },
  { at: 3117, enemy: 'warden', formation: 'line', count: 5, lane: 42 },
  { at: 3175, enemy: 'warden', formation: 'column', count: 5, lane: 47 },
  { at: 3232, enemy: 'turret', formation: 'column', count: 5, lane: 58 },
  { at: 3290, enemy: 'charger', formation: 'column', count: 5, lane: 42, origin: 'acrossMinus' },
  { at: 3348, enemy: 'weaver', formation: 'column', count: 5, lane: 53 },
  { at: 3405, enemy: 'warden', formation: 'column', count: 5, lane: 44 },
  { at: 3463, enemy: 'turret', formation: 'column', count: 5, lane: 60, origin: 'acrossPlus' },
  { at: 3520, enemy: 'charger', formation: 'column', count: 5, lane: 50 },
  { at: 3577, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 3635, enemy: 'warden', formation: 'column', count: 5, lane: 47, origin: 'acrossMinus' },
  { at: 3692, enemy: 'turret', formation: 'column', count: 5, lane: 58 },
  { at: 3750, enemy: 'charger', formation: 'column', count: 5, lane: 42 },
  { at: 3808, enemy: 'weaver', formation: 'column', count: 5, lane: 53, origin: 'acrossPlus' },
  { at: 3865, enemy: 'warden', formation: 'column', count: 5, lane: 44 },
  { at: 3923, enemy: 'turret', formation: 'column', count: 5, lane: 60 },
  { at: 3980, enemy: 'charger', formation: 'column', count: 5, lane: 50, origin: 'acrossMinus' },
];

/**
 * ⚠️ **Level five is the one where nothing can be outrun**, so the bomb is placed against the level's
 * own idea rather than against the clock: turrets and wardens hold station and accumulate, and a
 * charge is the only thing in the game that clears a lane the player has let fill up.
 */
const BATTERIES_PICKUPS: readonly PickupEntry[] = [
  { at: 292, kind: 'weapon', lane: 36 },
  { at: 684, kind: 'shield', lane: 60 },
  { at: 1195, kind: 'missile', lane: 42 },
  { at: 1590, kind: 'weapon', lane: 54 },
  { at: 2101, kind: 'weapon', lane: 30 },
  { at: 2549, kind: 'missile', lane: 50 },
  { at: 3060, kind: 'weapon', lane: 62 },
  { at: 3507, kind: 'bomb', lane: 40 },
  { at: 3853, kind: 'shield', lane: 44 },
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
  { at: 355, enemy: 'sower', formation: 'line', count: 5, lane: 44 },
  { at: 410, enemy: 'drifter', formation: 'line', count: 5, lane: 60 },
  { at: 465, enemy: 'lancer', formation: 'line', count: 5, lane: 45, origin: 'acrossMinus' },
  { at: 519, enemy: 'weaver', formation: 'line', count: 5, lane: 55 },
  { at: 574, enemy: 'drifter', formation: 'line', count: 5, lane: 42 },
  { at: 629, enemy: 'lancer', formation: 'line', count: 5, lane: 59 },
  { at: 684, enemy: 'weaver', formation: 'line', count: 5, lane: 49, origin: 'acrossPlus' },
  { at: 739, enemy: 'drifter', formation: 'line', count: 5, lane: 50 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 767, enemy: 'charger', formation: 'line', count: 4, lane: 44 },
  { at: 794, enemy: 'turret', formation: 'line', count: 5, lane: 47 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 821, enemy: 'weaver', formation: 'vee', count: 5, lane: 60 },
  { at: 848, enemy: 'charger', formation: 'line', count: 5, lane: 58 },
  { at: 904, enemy: 'sower', formation: 'line', count: 5, lane: 44, origin: 'acrossMinus' },
  { at: 958, enemy: 'spinner', formation: 'line', count: 5, lane: 53 },
  { at: 1013, enemy: 'charger', formation: 'line', count: 5, lane: 44 },
  { at: 1068, enemy: 'weaver', formation: 'line', count: 5, lane: 56, origin: 'acrossPlus' },
  { at: 1123, enemy: 'turret', formation: 'line', count: 5, lane: 50 },
  { at: 1178, enemy: 'charger', formation: 'line', count: 5, lane: 40 },
  { at: 1233, enemy: 'weaver', formation: 'line', count: 5, lane: 47, origin: 'acrossMinus' },
  { at: 1287, enemy: 'turret', formation: 'line', count: 5, lane: 58 },
  { at: 1343, enemy: 'charger', formation: 'line', count: 5, lane: 42 },
  { at: 1397, enemy: 'weaver', formation: 'line', count: 5, lane: 53, origin: 'acrossPlus' },
  { at: 1452, enemy: 'spinner', formation: 'line', count: 5, lane: 44 },
  { at: 1507, enemy: 'charger', formation: 'line', count: 5, lane: 60 },
  { at: 1562, enemy: 'weaver', formation: 'line', count: 5, lane: 50, origin: 'acrossMinus' },
  { at: 1616, enemy: 'warden', formation: 'line', count: 5, lane: 50 },
  { at: 1672, enemy: 'charger', formation: 'line', count: 5, lane: 41 },
  { at: 1726, enemy: 'lancer', formation: 'line', count: 5, lane: 60, origin: 'acrossMinus' },
  { at: 1781, enemy: 'warden', formation: 'line', count: 5, lane: 45 },
  { at: 1836, enemy: 'charger', formation: 'line', count: 5, lane: 55 },
  { at: 1891, enemy: 'lancer', formation: 'line', count: 5, lane: 42, origin: 'acrossPlus' },
  { at: 1945, enemy: 'warden', formation: 'line', count: 5, lane: 59 },
  { at: 2001, enemy: 'charger', formation: 'line', count: 5, lane: 49 },
  { at: 2055, enemy: 'lancer', formation: 'line', count: 5, lane: 50, origin: 'acrossMinus' },
  { at: 2110, enemy: 'warden', formation: 'line', count: 5, lane: 41 },
  { at: 2165, enemy: 'charger', formation: 'line', count: 5, lane: 60 },
  { at: 2220, enemy: 'lancer', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 2275, enemy: 'warden', formation: 'line', count: 5, lane: 55 },
  { at: 2330, enemy: 'charger', formation: 'line', count: 5, lane: 42 },
  { at: 2384, enemy: 'lancer', formation: 'line', count: 5, lane: 59, origin: 'acrossMinus' },
  { at: 2440, enemy: 'charger', formation: 'line', count: 6, lane: 47 },
  { at: 2494, enemy: 'turret', formation: 'line', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 2549, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 2604, enemy: 'warden', formation: 'line', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 2659, enemy: 'charger', formation: 'line', count: 6, lane: 44 },
  { at: 2713, enemy: 'turret', formation: 'line', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 2769, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 2823, enemy: 'warden', formation: 'line', count: 6, lane: 40, origin: 'acrossPlus' },
  { at: 2878, enemy: 'charger', formation: 'line', count: 6, lane: 47 },
  { at: 2933, enemy: 'turret', formation: 'line', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 2988, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 3042, enemy: 'warden', formation: 'line', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 3098, enemy: 'charger', formation: 'line', count: 6, lane: 44 },
  { at: 3152, enemy: 'turret', formation: 'line', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 3207, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 3262, enemy: 'charger', formation: 'line', count: 6, lane: 50 },
  { at: 3317, enemy: 'weaver', formation: 'line', count: 5, lane: 44, origin: 'acrossMinus' },
  { at: 3372, enemy: 'warden', formation: 'line', count: 6, lane: 60 },
  { at: 3427, enemy: 'turret', formation: 'line', count: 6, lane: 45, origin: 'acrossPlus' },
  { at: 3481, enemy: 'lancer', formation: 'line', count: 6, lane: 55 },
  { at: 3537, enemy: 'charger', formation: 'line', count: 6, lane: 42, origin: 'acrossMinus' },
  { at: 3591, enemy: 'weaver', formation: 'line', count: 5, lane: 56 },
  { at: 3646, enemy: 'warden', formation: 'line', count: 6, lane: 49, origin: 'acrossPlus' },
  { at: 3701, enemy: 'turret', formation: 'line', count: 6, lane: 50 },
  { at: 3756, enemy: 'lancer', formation: 'line', count: 6, lane: 41, origin: 'acrossMinus' },
  { at: 3811, enemy: 'charger', formation: 'line', count: 6, lane: 60 },
  { at: 3866, enemy: 'weaver', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 3920, enemy: 'warden', formation: 'line', count: 6, lane: 55 },
  { at: 3975, enemy: 'turret', formation: 'line', count: 6, lane: 42, origin: 'acrossMinus' },
  { at: 4030, enemy: 'lancer', formation: 'line', count: 6, lane: 59 },
  { at: 4085, enemy: 'charger', formation: 'line', count: 6, lane: 49, origin: 'acrossPlus' },
];

/**
 * ⚠️ **Level six's idea is density, which is exactly what makes reaching one of these expensive.** Six
 * pickups over a script with no gaps in it is the level that will say soonest whether 0082's budget is
 * too mean — if any level leaves the player unable to reach what it offers, it is this one, and the
 * play-test after this chunk is where that shows.
 */
const GAUNTLET_PICKUPS: readonly PickupEntry[] = [
  { at: 284, kind: 'weapon', lane: 58 },
  { at: 674, kind: 'shield', lane: 42 },
  { at: 1191, kind: 'missile', lane: 66 },
  { at: 1591, kind: 'weapon', lane: 34 },
  { at: 2107, kind: 'weapon', lane: 60 },
  { at: 2558, kind: 'missile', lane: 38 },
  { at: 3075, kind: 'weapon', lane: 54 },
  { at: 3559, kind: 'bomb', lane: 44 },
  { at: 3947, kind: 'shield', lane: 46 },
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
  { at: 353, enemy: 'charger', formation: 'line', count: 5, lane: 58 },
  { at: 407, enemy: 'spinner', formation: 'line', count: 5, lane: 42, origin: 'acrossMinus' },
  { at: 461, enemy: 'sower', formation: 'line', count: 5, lane: 53 },
  { at: 514, enemy: 'charger', formation: 'line', count: 5, lane: 44 },
  { at: 568, enemy: 'turret', formation: 'line', count: 5, lane: 60, origin: 'acrossPlus' },
  { at: 621, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 674, enemy: 'charger', formation: 'line', count: 5, lane: 40 },
  { at: 728, enemy: 'turret', formation: 'line', count: 5, lane: 47, origin: 'acrossMinus' },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 755, enemy: 'drifter', formation: 'line', count: 6, lane: 36 },
  { at: 782, enemy: 'warden', formation: 'line', count: 6, lane: 50 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 808, enemy: 'charger', formation: 'vee', count: 4, lane: 64 },
  { at: 835, enemy: 'charger', formation: 'line', count: 6, lane: 41 },
  { at: 888, enemy: 'weaver', formation: 'line', count: 5, lane: 56, origin: 'acrossMinus' },
  { at: 942, enemy: 'warden', formation: 'line', count: 6, lane: 45 },
  { at: 996, enemy: 'charger', formation: 'line', count: 6, lane: 55 },
  { at: 1049, enemy: 'sower', formation: 'line', count: 5, lane: 44, origin: 'acrossPlus' },
  { at: 1103, enemy: 'warden', formation: 'line', count: 6, lane: 59 },
  { at: 1156, enemy: 'charger', formation: 'line', count: 6, lane: 49 },
  { at: 1209, enemy: 'weaver', formation: 'line', count: 5, lane: 50, origin: 'acrossMinus' },
  { at: 1263, enemy: 'warden', formation: 'line', count: 6, lane: 41 },
  { at: 1317, enemy: 'charger', formation: 'line', count: 6, lane: 60 },
  { at: 1370, enemy: 'weaver', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 1423, enemy: 'warden', formation: 'line', count: 6, lane: 55 },
  { at: 1478, enemy: 'charger', formation: 'line', count: 6, lane: 42 },
  { at: 1531, enemy: 'weaver', formation: 'line', count: 5, lane: 56, origin: 'acrossMinus' },
  { at: 1584, enemy: 'warden', formation: 'line', count: 6, lane: 49 },
  { at: 1638, enemy: 'charger', formation: 'vee', count: 6, lane: 47 },
  { at: 1691, enemy: 'spinner', formation: 'vee', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 1745, enemy: 'warden', formation: 'vee', count: 6, lane: 42 },
  { at: 1798, enemy: 'charger', formation: 'vee', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 1852, enemy: 'turret', formation: 'vee', count: 6, lane: 44 },
  { at: 1905, enemy: 'warden', formation: 'vee', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 1958, enemy: 'charger', formation: 'vee', count: 6, lane: 50 },
  { at: 2013, enemy: 'turret', formation: 'vee', count: 6, lane: 40, origin: 'acrossPlus' },
  { at: 2066, enemy: 'warden', formation: 'vee', count: 6, lane: 47 },
  { at: 2119, enemy: 'charger', formation: 'vee', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 2173, enemy: 'turret', formation: 'vee', count: 6, lane: 42 },
  { at: 2226, enemy: 'warden', formation: 'vee', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 2280, enemy: 'charger', formation: 'vee', count: 6, lane: 44 },
  { at: 2333, enemy: 'turret', formation: 'vee', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 2387, enemy: 'warden', formation: 'vee', count: 6, lane: 50 },
  { at: 2440, enemy: 'charger', formation: 'vee', count: 6, lane: 40, origin: 'acrossPlus' },
  { at: 2493, enemy: 'weaver', formation: 'column', count: 5, lane: 50 },
  { at: 2548, enemy: 'charger', formation: 'column', count: 6, lane: 41, origin: 'acrossMinus' },
  { at: 2601, enemy: 'warden', formation: 'column', count: 6, lane: 60 },
  { at: 2654, enemy: 'turret', formation: 'column', count: 6, lane: 45, origin: 'acrossPlus' },
  { at: 2708, enemy: 'weaver', formation: 'column', count: 5, lane: 55 },
  { at: 2761, enemy: 'charger', formation: 'column', count: 6, lane: 42, origin: 'acrossMinus' },
  { at: 2815, enemy: 'warden', formation: 'column', count: 6, lane: 59 },
  { at: 2868, enemy: 'turret', formation: 'column', count: 6, lane: 49, origin: 'acrossPlus' },
  { at: 2922, enemy: 'weaver', formation: 'column', count: 5, lane: 50 },
  { at: 2975, enemy: 'charger', formation: 'column', count: 6, lane: 41, origin: 'acrossMinus' },
  { at: 3028, enemy: 'warden', formation: 'column', count: 6, lane: 60 },
  { at: 3083, enemy: 'turret', formation: 'column', count: 6, lane: 45, origin: 'acrossPlus' },
  { at: 3136, enemy: 'weaver', formation: 'column', count: 5, lane: 55 },
  { at: 3189, enemy: 'charger', formation: 'column', count: 6, lane: 42, origin: 'acrossMinus' },
  { at: 3243, enemy: 'warden', formation: 'column', count: 6, lane: 59 },
  { at: 3297, enemy: 'turret', formation: 'column', count: 6, lane: 49, origin: 'acrossPlus' },
  { at: 3350, enemy: 'charger', formation: 'line', count: 6, lane: 47 },
  { at: 3403, enemy: 'warden', formation: 'line', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 3457, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 3510, enemy: 'turret', formation: 'line', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 3564, enemy: 'lancer', formation: 'line', count: 6, lane: 44 },
  { at: 3618, enemy: 'charger', formation: 'line', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 3671, enemy: 'warden', formation: 'line', count: 6, lane: 50 },
  { at: 3724, enemy: 'weaver', formation: 'line', count: 5, lane: 44, origin: 'acrossPlus' },
  { at: 3778, enemy: 'turret', formation: 'line', count: 6, lane: 47 },
  { at: 3832, enemy: 'lancer', formation: 'line', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 3885, enemy: 'charger', formation: 'line', count: 6, lane: 42 },
  { at: 3938, enemy: 'warden', formation: 'line', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 3992, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 4045, enemy: 'turret', formation: 'line', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 4099, enemy: 'lancer', formation: 'line', count: 6, lane: 50 },
  { at: 4153, enemy: 'charger', formation: 'line', count: 6, lane: 40, origin: 'acrossPlus' },
  { at: 4206, enemy: 'warden', formation: 'line', count: 6, lane: 47 },
];

/**
 * ⚠️ **The last authored level, and its pickups are the same six as the first one's.** That is the
 * point rather than an oversight: 0082's budget is a property of *a level*, and a run that reached
 * here is carrying whatever survived six levels' worth of deaths. What makes level seven harder than
 * level one is the script above it, not what it withholds.
 */
const EYE_PICKUPS: readonly PickupEntry[] = [
  { at: 284, kind: 'weapon', lane: 48 },
  { at: 678, kind: 'shield', lane: 64 },
  { at: 1200, kind: 'missile', lane: 32 },
  { at: 1605, kind: 'weapon', lane: 56 },
  { at: 2127, kind: 'weapon', lane: 40 },
  { at: 2584, kind: 'missile', lane: 62 },
  // ⚠️ 4800 rather than the 4600 the other levels use, and it is the boss being furthest away here:
  // level seven's is at 6540, so a cap at 4600 would leave a 54-second run to it with nothing to
  // rearm from — four seconds inside `tests/pickups.test.ts`'s ceiling, which is not headroom.
  { at: 3236, kind: 'weapon', lane: 34 },
  { at: 3693, kind: 'bomb', lane: 52 },
  { at: 4052, kind: 'shield', lane: 60 },
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
    bossAt: 4270,
    /*
      ⚠️ **ALL SEVEN SCRIPTS ARE THE SEED AND NOT YET AN AUTHORING CHOICE** —
      `docs/decisions/0158-a-level-says-where-its-sections-open.md`. Each is `bossAt` minus the three
      constants 0158 deleted, so the landing moves nothing a listener can hear and the diff is
      provable; the differences the ask is actually about are their own change, with their own
      play-test. **A level edited away from this shape is doing the thing the mechanism is for** —
      there is nothing to keep in step and no shared row to break.

      ⚠️ **THIS ONE'S `surge` IS THE FIGURE 0131 BOUGHT AND IT IS WORTH NOT BREAKING BY ACCIDENT.**
      2534 puts level one's crossing at **70.4 s, which is 44 bars exactly**, so the change is heard
      at the instant the distance is passed rather than up to a bar later
      (`docs/decisions/0131-the-surge-comes-sooner.md`). That was only ever true of one level while
      the distance was shared; now it is a property of this script, and it is the one number here
      that a play-test has already argued for.
    */
    sections: [
      { at: 0, section: 'run' },
      { at: 1249, section: 'push' },
      { at: 2534, section: 'surge' },
      { at: 3627, section: 'approach' },
    ],
    boss: 'sentinel',
    landmarks: [],
    theme: 'approach',
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
    bossAt: 4320,
    sections: [
      { at: 0, section: 'run' },
      { at: 1299, section: 'push' },
      { at: 2584, section: 'surge' },
      { at: 3677, section: 'approach' },
    ],
    boss: 'harrow',
    /*
      ⚠️ **1299 IS `push`, WHICH IS WHERE THE ORGAN OPENS** — `src/content/nebula.ts`'s ladder puts
      the pipe organ on `push`, and this level's `sections` opens `push` at 1299. Asked for by name:
      *"when the massive pipe organ kicks in music wise we see the pillars of god going past."*

      **The two numbers are the same number on purpose, and `tests/sky.test.ts` holds them equal** —
      typing 1299 twice is the drift `docs/decisions/0029-the-tracked-record-is-the-record.md` is
      about, so the guard reads the section list rather than this literal.

      ⚠️ **`lane: 72` AND THE NUMBER CAME OUT OF THE SHOT RIG, NOT OUT OF A CALCULATION.** At 30 the
      sprite spans lane −7.5 to 67.5, so the columns' feet stopped in mid-air on a hard horizontal
      cut two thirds down the screen — correct in every model quantity and obviously wrong in the
      picture (`docs/decisions/0027-measure-the-picture-not-the-model.md`). At 72 the feet run off
      the bottom of the frame and they read as planted.

      `depth: 0.08` is under the nebula layer's 0.09, which is the slowest field — 0203's *a landmark
      is the slowest thing on screen*. It also sets how long they take to cross: about a minute, so
      they are gone before the boss.
    */
    landmarks: [{ at: 1299, lane: 72, depth: 0.08 }],
    theme: 'nebula',
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
    bossAt: 4270,
    sections: [
      { at: 0, section: 'run' },
      { at: 1249, section: 'push' },
      { at: 2534, section: 'surge' },
      { at: 3627, section: 'approach' },
    ],
    boss: 'lattice',
    landmarks: [],
    theme: 'saurian',
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
    bossAt: 4240,
    sections: [
      { at: 0, section: 'run' },
      { at: 1219, section: 'push' },
      { at: 2504, section: 'surge' },
      { at: 3597, section: 'approach' },
    ],
    boss: 'shoalMother',
    landmarks: [],
    theme: 'labyrinth',
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
    bossAt: 4240,
    sections: [
      { at: 0, section: 'run' },
      { at: 1219, section: 'push' },
      { at: 2504, section: 'surge' },
      { at: 3597, section: 'approach' },
    ],
    boss: 'redoubt',
    landmarks: [],
    theme: 'rime',
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
    bossAt: 4340,
    sections: [
      { at: 0, section: 'run' },
      { at: 1319, section: 'push' },
      { at: 2604, section: 'surge' },
      { at: 3697, section: 'approach' },
    ],
    boss: 'chorus',
    landmarks: [],
    theme: 'mire',
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
    bossAt: 4460,
    /*
      ⚠️ **DRIVEN ON THE DESK AND PASTED BACK, WHICH IS WHAT `docs/decisions/0163-the-script-is-edited-here.md`
      IS FOR** — `docs/decisions/0180-the-black-heart-gets-there-sooner.md`. The four boundaries are a
      hand's, dragged on the handles 0138 built and read off the dashboard's own **EDITED** block.

      ⚠️ **THE OPENING IS HALVED AND THE MIDDLE TAKES IT.** 40.0s → 20.7s of `run`, with `push` and
      `surge` going 35.7 → 44.9 and 30.4 → 45.2. `bossAt` does not move, so the level is the same
      length and only where it turns has changed.
    */
    sections: [
      { at: 0, section: 'run' },
      { at: 744, section: 'push' },
      { at: 2360, section: 'surge' },
      { at: 3986, section: 'approach' },
    ],
    boss: 'axis',
    landmarks: [],
    theme: 'core',
  },
};
