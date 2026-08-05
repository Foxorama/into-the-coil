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
 * fails if any member could leave the lane. There is no `across` cull, so an enemy that wanders out
 * of the dodge lane does not come back and does not get retired.
 */

import type { EnemyKind } from './enemies.ts';
import type { FormationKind } from './formations.ts';
import type { BossKind } from './bosses.ts';
import type { PickupKind } from './pickups.ts';

/** Every level. Closed, and one long — the roster is downstream of playing this one. */
export const LEVEL_KINDS = ['approach'] as const;

/** Derived from the list, so a level cannot exist in the union and be missing from the table. */
export type LevelKind = (typeof LEVEL_KINDS)[number];

export interface WaveEntry {
  /** Camera distance, in world units from the level's start, at which this wave spawns. */
  at: number;
  enemy: EnemyKind;
  formation: FormationKind;
  /** How many. The formation decides where each of them goes. */
  count: number;
  /** Where the formation is centred across the lane, 0 to 100. */
  lane: number;
}

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

    60 – 900       0:00 – 0:24   drifters and the first lancers. Nothing here can be met by surprise
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
  // ── Teaching. One kind at a time, in shapes that read at a glance. Some of this is already on
  //    screen when the run begins, because `at` is a place and the opening sits inside the horizon.
  { at: 60, enemy: 'drifter', formation: 'line', count: 5, lane: 50 },
  { at: 150, enemy: 'drifter', formation: 'line', count: 5, lane: 30 },
  { at: 240, enemy: 'drifter', formation: 'vee', count: 5, lane: 70 },
  { at: 330, enemy: 'drifter', formation: 'line', count: 5, lane: 45 },
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
  { at: 3930, enemy: 'charger', formation: 'column', count: 5, lane: 65 },
  { at: 4020, enemy: 'lancer', formation: 'vee', count: 5, lane: 45 },
  { at: 4110, enemy: 'charger', formation: 'vee', count: 5, lane: 55 },
  { at: 4200, enemy: 'turret', formation: 'line', count: 4, lane: 40 },
  { at: 4290, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 4380, enemy: 'charger', formation: 'line', count: 5, lane: 50 },
  { at: 4470, enemy: 'lancer', formation: 'column', count: 5, lane: 60 },
  { at: 4560, enemy: 'drifter', formation: 'vee', count: 6, lane: 40 },
  { at: 4650, enemy: 'charger', formation: 'column', count: 5, lane: 30 },
  { at: 4740, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },
  { at: 4830, enemy: 'turret', formation: 'column', count: 5, lane: 65 },
  { at: 4920, enemy: 'charger', formation: 'line', count: 5, lane: 55 },

  // ── Everything, at density. The stretch that decides whether three lives was the right number. ──
  { at: 5010, enemy: 'lancer', formation: 'vee', count: 6, lane: 50 },
  { at: 5100, enemy: 'turret', formation: 'column', count: 5, lane: 25 },
  { at: 5180, enemy: 'charger', formation: 'line', count: 5, lane: 60 },
  { at: 5260, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 5340, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },
  { at: 5420, enemy: 'charger', formation: 'column', count: 5, lane: 70 },
  { at: 5500, enemy: 'lancer', formation: 'line', count: 5, lane: 35 },
  { at: 5580, enemy: 'turret', formation: 'line', count: 5, lane: 45 },
  { at: 5660, enemy: 'weaver', formation: 'vee', count: 5, lane: 55 },
  { at: 5740, enemy: 'charger', formation: 'vee', count: 6, lane: 50 },
  { at: 5820, enemy: 'drifter', formation: 'vee', count: 6, lane: 35 },
  { at: 5900, enemy: 'lancer', formation: 'column', count: 5, lane: 65 },
  { at: 5980, enemy: 'turret', formation: 'column', count: 5, lane: 40 },
  { at: 6060, enemy: 'charger', formation: 'line', count: 6, lane: 50 },
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
};
