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
  /*
    ⚠️ **THE FIRST THING THE LEVEL OFFERS IS THE SHIELD PAIR, and it is in the empty opening
    stretch.** The hull is one hit (0050), so a player who has not yet found the controls is one
    contact from a life — and `docs/decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md`
    gave them that stretch precisely so the first thing that happens to them is not a death. It sits
    off-centre like every other pickup: reaching it is still a decision, made against an empty screen.

    ⚠️ **What a player actually gets here is a shield OR an extra life**, because
    `docs/decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md` made every pickup two
    things. A level authors the PAIR and the camera picks the face — which amends what 0050 wrote
    about this line, and does not weaken it: both faces of this pair answer *the ship is one hit*.
  */
  { at: 260, kind: 'shield', lane: 40 },
  { at: 420, kind: 'rapid', lane: 25 },
  { at: 1010, kind: 'spread', lane: 72 },
  { at: 1300, kind: 'shield', lane: 55 },
  /*
    ⚠️ **THE MISSILE UPGRADES START LATER THAN THE PULSE ONES, and that is teaching rather than
    balance.** A player meets the pulse and its two upgrades in the opening minute; the second weapon
    fires itself from the first frame, so what is left to learn is that a DIFFERENT pickup family
    changes it. Handing both families out at once would make the first four pickups a lottery.
  */
  { at: 1450, kind: 'missileSpread', lane: 30 },
  { at: 1620, kind: 'rapid', lane: 38 },
  { at: 2150, kind: 'extraLife', lane: 60 },
  // ⚠️ Added because `tests/pickups.test.ts` measured a 28-second stretch with nothing to rearm
  // from — an extra life sitting in the middle of it does not answer the question a death asks.
  { at: 2200, kind: 'spread', lane: 30 },
  { at: 2400, kind: 'shield', lane: 68 },
  { at: 2620, kind: 'spread', lane: 28 },
  { at: 2900, kind: 'missileRate', lane: 64 },
  { at: 3160, kind: 'rapid', lane: 70 },
  { at: 3400, kind: 'shield', lane: 32 },
  { at: 3700, kind: 'spread', lane: 45 },
  { at: 4240, kind: 'rapid', lane: 22 },
  { at: 4340, kind: 'missileSpread', lane: 44 },
  { at: 4400, kind: 'shield', lane: 58 },
  { at: 4700, kind: 'spread', lane: 40 },
  { at: 4800, kind: 'extraLife', lane: 66 },
  { at: 5300, kind: 'spread', lane: 35 },
  { at: 5420, kind: 'missileRate', lane: 72 },
  { at: 5500, kind: 'shield', lane: 26 },
  { at: 5860, kind: 'rapid', lane: 62 },
  // ⚠️ The last one is before the boss rather than during it. A fight that hands out shields while
  // it is being fought is a fight whose difficulty is a supply line — 0040 keeps a boss to its own
  // clock, and this is the shell the player takes INTO it.
  { at: 6200, kind: 'shield', lane: 50 },
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
  // The opening shield, on the same terms as level one's — and level two opens on the same empty
  // stretch for the same reason, so it is the same answer to the same question.
  { at: 260, kind: 'shield', lane: 62 },
  { at: 480, kind: 'rapid', lane: 28 },
  { at: 1120, kind: 'spread', lane: 68 },
  { at: 1500, kind: 'shield', lane: 35 },
  { at: 1640, kind: 'missileSpread', lane: 66 },
  { at: 1720, kind: 'rapid', lane: 42 },
  { at: 2280, kind: 'extraLife', lane: 55 },
  { at: 2340, kind: 'spread', lane: 32 },
  { at: 2800, kind: 'shield', lane: 70 },
  { at: 2940, kind: 'rapid', lane: 62 },
  { at: 3180, kind: 'missileRate', lane: 30 },
  { at: 3540, kind: 'spread', lane: 45 },
  { at: 3900, kind: 'shield', lane: 24 },
  { at: 4140, kind: 'rapid', lane: 25 },
  { at: 4400, kind: 'missileSpread', lane: 52 },
  { at: 4720, kind: 'spread', lane: 58 },
  { at: 4780, kind: 'extraLife', lane: 35 },
  { at: 5100, kind: 'shield', lane: 48 },
  { at: 5320, kind: 'rapid', lane: 50 },
  { at: 5600, kind: 'missileRate', lane: 22 },
  { at: 5900, kind: 'spread', lane: 40 },
  { at: 6200, kind: 'shield', lane: 50 },
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
  { at: 1128, enemy: 'drifter', formation: 'column', count: 5, lane: 41 },
  { at: 1220, enemy: 'lancer', formation: 'column', count: 5, lane: 60, origin: 'acrossMinus' },
  { at: 1312, enemy: 'weaver', formation: 'column', count: 5, lane: 45 },
  { at: 1404, enemy: 'drifter', formation: 'column', count: 5, lane: 55 },
  { at: 1496, enemy: 'lancer', formation: 'column', count: 5, lane: 42, origin: 'acrossPlus' },
  { at: 1588, enemy: 'weaver', formation: 'column', count: 5, lane: 56 },
  { at: 1680, enemy: 'drifter', formation: 'column', count: 5, lane: 49 },
  { at: 1772, enemy: 'lancer', formation: 'column', count: 5, lane: 50, origin: 'acrossMinus' },
  { at: 1864, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 1956, enemy: 'drifter', formation: 'column', count: 5, lane: 60 },
  { at: 2048, enemy: 'lancer', formation: 'column', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 2140, enemy: 'weaver', formation: 'column', count: 5, lane: 55 },
  { at: 2232, enemy: 'drifter', formation: 'column', count: 5, lane: 42 },
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
  { at: 3704, enemy: 'drifter', formation: 'line', count: 5, lane: 41, origin: 'acrossMinus' },
  { at: 3796, enemy: 'weaver', formation: 'line', count: 5, lane: 56 },
  { at: 3888, enemy: 'charger', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 3980, enemy: 'drifter', formation: 'line', count: 5, lane: 55 },
  { at: 4072, enemy: 'weaver', formation: 'line', count: 5, lane: 44, origin: 'acrossMinus' },
  { at: 4164, enemy: 'charger', formation: 'line', count: 5, lane: 59 },
  { at: 4256, enemy: 'drifter', formation: 'line', count: 5, lane: 49, origin: 'acrossPlus' },
  { at: 4348, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 4440, enemy: 'charger', formation: 'line', count: 5, lane: 41, origin: 'acrossMinus' },
  { at: 4532, enemy: 'drifter', formation: 'line', count: 5, lane: 60 },
  { at: 4624, enemy: 'weaver', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 4716, enemy: 'charger', formation: 'line', count: 5, lane: 55 },
  { at: 4808, enemy: 'drifter', formation: 'line', count: 5, lane: 42, origin: 'acrossMinus' },
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

const COILWARD_PICKUPS: readonly PickupEntry[] = [
  { at: 420, kind: 'rapid', lane: 48 },
  { at: 760, kind: 'shield', lane: 40 },
  { at: 1100, kind: 'spread', lane: 56 },
  { at: 1440, kind: 'shield', lane: 44 },
  { at: 1780, kind: 'missileRate', lane: 60 },
  { at: 2120, kind: 'shield', lane: 38 },
  { at: 2460, kind: 'missileSpread', lane: 52 },
  { at: 2800, kind: 'shield', lane: 62 },
  { at: 2900, kind: 'extraLife', lane: 50 },
  { at: 3140, kind: 'rapid', lane: 48 },
  { at: 3480, kind: 'shield', lane: 40 },
  { at: 3820, kind: 'spread', lane: 56 },
  { at: 4160, kind: 'shield', lane: 44 },
  { at: 4500, kind: 'missileRate', lane: 60 },
  { at: 4840, kind: 'shield', lane: 38 },
  { at: 5180, kind: 'missileSpread', lane: 52 },
  { at: 5520, kind: 'shield', lane: 62 },
  { at: 5860, kind: 'rapid', lane: 48 },
  { at: 6200, kind: 'rapid', lane: 56 },
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

const SHOAL_PICKUPS: readonly PickupEntry[] = [
  { at: 400, kind: 'rapid', lane: 48 },
  { at: 740, kind: 'shield', lane: 40 },
  { at: 1080, kind: 'spread', lane: 56 },
  { at: 1420, kind: 'shield', lane: 44 },
  { at: 1760, kind: 'missileRate', lane: 60 },
  { at: 2100, kind: 'shield', lane: 38 },
  { at: 2440, kind: 'missileSpread', lane: 52 },
  { at: 2780, kind: 'shield', lane: 62 },
  { at: 2820, kind: 'extraLife', lane: 50 },
  { at: 3120, kind: 'rapid', lane: 48 },
  { at: 3460, kind: 'shield', lane: 40 },
  { at: 3800, kind: 'spread', lane: 56 },
  { at: 4140, kind: 'shield', lane: 44 },
  { at: 4480, kind: 'missileRate', lane: 60 },
  { at: 4820, kind: 'shield', lane: 38 },
  { at: 5160, kind: 'missileSpread', lane: 52 },
  { at: 5500, kind: 'shield', lane: 62 },
  { at: 5840, kind: 'rapid', lane: 48 },
  { at: 6180, kind: 'rapid', lane: 56 },
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

const BATTERIES_PICKUPS: readonly PickupEntry[] = [
  { at: 400, kind: 'rapid', lane: 48 },
  { at: 740, kind: 'shield', lane: 40 },
  { at: 1080, kind: 'spread', lane: 56 },
  { at: 1420, kind: 'shield', lane: 44 },
  { at: 1760, kind: 'missileRate', lane: 60 },
  { at: 2100, kind: 'shield', lane: 38 },
  { at: 2440, kind: 'missileSpread', lane: 52 },
  { at: 2780, kind: 'shield', lane: 62 },
  { at: 2860, kind: 'extraLife', lane: 50 },
  { at: 3120, kind: 'rapid', lane: 48 },
  { at: 3460, kind: 'shield', lane: 40 },
  { at: 3800, kind: 'spread', lane: 56 },
  { at: 4140, kind: 'shield', lane: 44 },
  { at: 4480, kind: 'missileRate', lane: 60 },
  { at: 4820, kind: 'shield', lane: 38 },
  { at: 5160, kind: 'missileSpread', lane: 52 },
  { at: 5500, kind: 'shield', lane: 62 },
  { at: 5840, kind: 'rapid', lane: 48 },
  { at: 6180, kind: 'rapid', lane: 56 },
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

const GAUNTLET_PICKUPS: readonly PickupEntry[] = [
  { at: 380, kind: 'rapid', lane: 48 },
  { at: 720, kind: 'shield', lane: 40 },
  { at: 1060, kind: 'spread', lane: 56 },
  { at: 1400, kind: 'shield', lane: 44 },
  { at: 1740, kind: 'missileRate', lane: 60 },
  { at: 2080, kind: 'shield', lane: 38 },
  { at: 2420, kind: 'missileSpread', lane: 52 },
  { at: 2700, kind: 'extraLife', lane: 50 },
  { at: 2760, kind: 'shield', lane: 62 },
  { at: 3100, kind: 'rapid', lane: 48 },
  { at: 3440, kind: 'shield', lane: 40 },
  { at: 3780, kind: 'spread', lane: 56 },
  { at: 4120, kind: 'shield', lane: 44 },
  { at: 4460, kind: 'missileRate', lane: 60 },
  { at: 4800, kind: 'shield', lane: 38 },
  { at: 5140, kind: 'missileSpread', lane: 52 },
  { at: 5480, kind: 'shield', lane: 62 },
  { at: 5820, kind: 'rapid', lane: 48 },
  { at: 6160, kind: 'rapid', lane: 56 },
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

const EYE_PICKUPS: readonly PickupEntry[] = [
  { at: 360, kind: 'rapid', lane: 48 },
  { at: 700, kind: 'shield', lane: 40 },
  { at: 1040, kind: 'spread', lane: 56 },
  { at: 1380, kind: 'shield', lane: 44 },
  { at: 1720, kind: 'missileRate', lane: 60 },
  { at: 2060, kind: 'shield', lane: 38 },
  { at: 2400, kind: 'missileSpread', lane: 52 },
  { at: 2680, kind: 'extraLife', lane: 50 },
  { at: 2740, kind: 'shield', lane: 62 },
  { at: 3080, kind: 'rapid', lane: 48 },
  { at: 3420, kind: 'shield', lane: 40 },
  { at: 3760, kind: 'spread', lane: 56 },
  { at: 4100, kind: 'shield', lane: 44 },
  { at: 4440, kind: 'missileRate', lane: 60 },
  { at: 4780, kind: 'shield', lane: 38 },
  { at: 5120, kind: 'missileSpread', lane: 52 },
  { at: 5460, kind: 'shield', lane: 62 },
  { at: 5800, kind: 'rapid', lane: 48 },
  { at: 6140, kind: 'rapid', lane: 56 },
  { at: 6480, kind: 'spread', lane: 44 },
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
