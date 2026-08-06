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
export const LEVEL_KINDS = ['approach', 'descent'] as const;

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
   * distance: a view is 150 to 240 world units wide by aspect.
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
   * ⚠️ **This is the load-bearing half of 0039.** A death empties the arsenal, so a player who dies
   * late in a level and cannot rearm has been handed its hardest stretch with its weakest loadout.
   * How much of that is answered is a property of THIS LIST, and `tests/pickups.test.ts` holds a
   * floor under it rather than leaving it to be noticed in a play-test.
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
    2300 – 3700    1:03 – 1:42   turrets: the first thing that cannot be cleared in passing
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

  // ── Turrets. Three health each, so the player starts having to choose what to leave alive. ──────
  { at: 2310, enemy: 'turret', formation: 'column', count: 4, lane: 30 },
  { at: 2400, enemy: 'drifter', formation: 'line', count: 5, lane: 60 },
  { at: 2490, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 2580, enemy: 'turret', formation: 'line', count: 4, lane: 50 },
  { at: 2670, enemy: 'lancer', formation: 'vee', count: 5, lane: 55 },
  { at: 2760, enemy: 'drifter', formation: 'line', count: 6, lane: 35 },
  { at: 2850, enemy: 'turret', formation: 'column', count: 4, lane: 70 },
  { at: 2940, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },
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
  ⚠️ **PLACED AGAINST THE DEATH RULE, NOT SPRINKLED.**
  `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md` empties the arsenal on a
  death, which makes the question *"how long is a player who just died without a weapon"*. The answer
  authored here is **never more than about twenty seconds**: an upgrade appears roughly every 600
  units, which is under seventeen seconds of camera, all the way to the boss.

  The two lives are early-middle and late — one before the difficulty turns, one in the stretch that
  decides the run. Lives survive a death, so they are worth flying for at any point.

  ⚠️ Lanes are deliberately off-centre and alternating. A pickup on the centreline is one the player
  drifts into without deciding anything, and `docs/game.md` wants every upgrade to be worth taking —
  which starts with taking it being a choice about position.
*/
const APPROACH_PICKUPS: readonly PickupEntry[] = [
  { at: 420, kind: 'rapid', lane: 25 },
  { at: 1010, kind: 'spread', lane: 72 },
  { at: 1620, kind: 'rapid', lane: 38 },
  { at: 2150, kind: 'extraLife', lane: 60 },
  // ⚠️ Added because `tests/pickups.test.ts` measured a 28-second stretch with nothing to rearm
  // from — an extra life sitting in the middle of it does not answer the question a death asks.
  { at: 2200, kind: 'spread', lane: 30 },
  { at: 2620, kind: 'spread', lane: 28 },
  { at: 3160, kind: 'rapid', lane: 70 },
  { at: 3700, kind: 'spread', lane: 45 },
  { at: 4240, kind: 'rapid', lane: 22 },
  { at: 4700, kind: 'spread', lane: 40 },
  { at: 4800, kind: 'extraLife', lane: 66 },
  { at: 5300, kind: 'spread', lane: 35 },
  { at: 5860, kind: 'rapid', lane: 62 },
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

  ⚠️ **Fewer upgrades than level one, and that is the difficulty.** 0041's ceiling still holds — never
  more than twenty seconds unarmed — but the pickups sit further apart inside it, so a death costs
  more here than it did there.
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
  { at: 2355, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },
  { at: 2440, enemy: 'charger', formation: 'column', count: 5, lane: 35, origin: 'acrossMinus' },
  { at: 2525, enemy: 'turret', formation: 'line', count: 3, lane: 60 },
  { at: 2610, enemy: 'weaver', formation: 'column', count: 5, lane: 30 },
  { at: 2695, enemy: 'charger', formation: 'column', count: 5, lane: 70, origin: 'acrossPlus' },
  { at: 2780, enemy: 'lancer', formation: 'vee', count: 5, lane: 50 },
  { at: 2865, enemy: 'warden', formation: 'column', count: 3, lane: 55 },
  { at: 2950, enemy: 'drifter', formation: 'line', count: 6, lane: 42 },
  { at: 3035, enemy: 'charger', formation: 'vee', count: 5, lane: 60 },
  { at: 3120, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 3205, enemy: 'turret', formation: 'column', count: 3, lane: 28 },
  { at: 3290, enemy: 'lancer', formation: 'line', count: 5, lane: 65 },
  { at: 3375, enemy: 'warden', formation: 'line', count: 3, lane: 45 },
  { at: 3460, enemy: 'charger', formation: 'column', count: 5, lane: 50, origin: 'acrossMinus' },

  // ── Everything, with wardens holding the lane the player wants. ─────────────────────────────────
  { at: 3545, enemy: 'drifter', formation: 'vee', count: 6, lane: 55 },
  { at: 3630, enemy: 'warden', formation: 'vee', count: 3, lane: 50 },
  { at: 3715, enemy: 'weaver', formation: 'line', count: 5, lane: 40 },
  { at: 3800, enemy: 'charger', formation: 'column', count: 5, lane: 65 },
  { at: 3885, enemy: 'turret', formation: 'line', count: 3, lane: 45 },
  { at: 3970, enemy: 'lancer', formation: 'column', count: 5, lane: 32 },
  { at: 4055, enemy: 'warden', formation: 'line', count: 3, lane: 58 },
  { at: 4140, enemy: 'charger', formation: 'vee', count: 5, lane: 45 },
  { at: 4225, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },
  { at: 4310, enemy: 'weaver', formation: 'vee', count: 5, lane: 55 },
  { at: 4395, enemy: 'turret', formation: 'column', count: 3, lane: 70 },
  { at: 4480, enemy: 'lancer', formation: 'vee', count: 5, lane: 38 },
  { at: 4565, enemy: 'warden', formation: 'column', count: 3, lane: 50 },
  { at: 4650, enemy: 'charger', formation: 'column', count: 5, lane: 60, origin: 'acrossPlus' },
  { at: 4735, enemy: 'drifter', formation: 'vee', count: 6, lane: 45 },
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

/** Level two's pickups: the same ceiling, further apart inside it. */
const DESCENT_PICKUPS: readonly PickupEntry[] = [
  { at: 480, kind: 'rapid', lane: 28 },
  { at: 1120, kind: 'spread', lane: 68 },
  { at: 1720, kind: 'rapid', lane: 42 },
  { at: 2280, kind: 'extraLife', lane: 55 },
  { at: 2340, kind: 'spread', lane: 32 },
  { at: 2940, kind: 'rapid', lane: 62 },
  { at: 3540, kind: 'spread', lane: 45 },
  { at: 4140, kind: 'rapid', lane: 25 },
  { at: 4720, kind: 'spread', lane: 58 },
  { at: 4780, kind: 'extraLife', lane: 35 },
  { at: 5320, kind: 'rapid', lane: 50 },
  { at: 5900, kind: 'spread', lane: 40 },
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
};
