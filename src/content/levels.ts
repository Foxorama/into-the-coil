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
import type { Eruption } from './volcano.ts';
import { MIRE_ACID_CAPS, MIRE_BANK_CAPS, MIRE_BED, type SpriteKind } from './sprites.ts';
import { PLAYER_MARGIN } from '../sim/flight.ts';
import { ACROSS_SPAN } from '../sim/camera.ts';

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

/**
 * How many waves of one class — firing, or not — a level may send in a row.
 *
 * `docs/decisions/0231-a-level-is-a-mix.md`. Reported: *"they're grouped up into non-firing and
 * firing waves, so instead of a good mix, you get a bunch of enemies that don't shoot in a few
 * waves, then a bunch of enemies that shoot in a few waves."* Measured before the fix: The Approach
 * ran twelve non-firing waves in a row, the shoal level seventeen, the batteries level twenty-nine
 * firing.
 *
 * ⚠️ **A BUDGET, AND THE PLAY-TEST OWNS THE NUMBER.** Three, because the report said *a few*: a
 * pair reads as a mix and four is *a bunch*. `tests/mix.test.ts` holds every level to it, sorted by
 * arrival — and holds the number itself, so a level that will not fit under three is fixed rather
 * than the number raised. The one stretch it skips is level one's run-up, which 0086 forbids to fire.
 */
export const MIX_RUN = 3;

/**
 * One firing wave in this many is put on the field of those that fly in with a mid-boss — 0267, 0472,
 * and since 0502 only those.
 *
 * ⚠️ **0502 TOOK THE HALF OF THIS THAT RAN WHILE THE MID-BOSS LIVED.** Played: *"so let's go with 25
 * secs and if you take longer to kill the miniboss you get increased difficulty with adds"*, and of an
 * early kill, *"leave the gap empty."* Each mid-boss now has a window (`MidBoss.windowSeconds`) that no wave
 * is authored inside, so there is nothing for this to thin over the first twenty-five seconds; past
 * it the waves are the adds the player asked for, and come as authored. What is left is the lead —
 * `FIGHT_LEAD` below — which is a stretch of script and not a stretch of fight. The argument below is
 * 0267's, kept because it is why the window is authored as seconds rather than as a place.
 *
 * ── A FIGHT'S LENGTH IS THE PLAYER'S, AND A WAVE'S PLACE IS THE AUTHOR'S ────────────────────────
 *
 * `docs/decisions/0267-a-fight-thins-the-waves-over-it.md`. Reported: *"when the minibosses are on
 * screen there are way too many waves in general happening and it's a lot."* 0247 said *the waves
 * keep coming around it*, and they do: the camera never stops for a fight, so the stretch of script
 * that lands on one is however far the camera got while the player was killing it.
 *
 * ⚠️ **NO EDIT TO THESE TABLES COULD HAVE FIXED IT**, which is why this is a spawn rule and not a
 * re-authoring. `scripts/weigh-fight.mjs` walks every level through the real frame with the ship
 * holding the boss's lane: at three rungs a fight takes 20–39 s and 5–12 firing waves land on it; at
 * one rung — what a player carries at the mid-boss, since a level authors one weapon near its start
 * and the fight's own drop comes after it — the same authored script delivers 14–25 over 42–83 s.
 * Move the waves for one and the other gets a hole.
 *
 * ⚠️ **A BUDGET, AND THE PLAY-TEST OWNS THE NUMBER.** Three, because the ask is *"still need some
 * during miniboss otherwise miniboss is too easy, but not as many"* — a third of 14–25 is 5–8, which
 * is what the stretch BEFORE the fight already carries, and one in two was measured first and left
 * the busiest levels above where they started. `tests/fight.test.ts` held every level to it over
 * the instrument's own walk until 0502.
 */
export const FIGHT_FIRING_IN = 3;

/**
 * How far short of a mid-boss's `at` a firing wave already counts as its fight's, in world units — 0472.
 *
 * ⚠️ **THE WAVES THAT FLY IN WITH THE BOSS WERE NEVER THINNED.** Reported: *"there's some spots,
 * especially around minibosses, that it's too bullety."* 0267 thinned the waves put down while the
 * mid-boss is in the pool; but the mid-boss is put down on the same horizon as the waves, so every
 * firing wave authored in the stretch just before it is on the field already and arrives on the
 * screen with the hull — 0441's picket and lancer before the sentinel, three lancers and a sower
 * before the shoal mother. `scripts/weigh-fight.mjs` at Savior, with the thinning set to admit
 * nothing, still saw 1.3–4.6 firing bodies per ten seconds arrive on each fight.
 *
 * ⚠️ **A BUDGET, AND THE PLAY OWNS THE NUMBER.** Two thirds of the widest view: a wave this close is
 * still crossing the screen when the hull settles on station. 0472 has the measurement at 0, this
 * and the whole view.
 *
 * ⚠️ **KEPT BY 0502, AND BOUNDED BY THE MID-BOSS'S OWN `at`.** It used to run on past the mid-boss
 * for as long as it lived, which is the half 0502 took. The lead is still what 0472 measured: waves
 * put down before the hull and arriving with it, which the window — a stretch AFTER the hull — does
 * not touch.
 */
export const FIGHT_LEAD = 190;

/**
 * How long each level's mid-boss fight should take, in seconds, at the loadout it is met with — 0269.
 *
 * ── THE LADDER IS IN SECONDS BECAUSE HEALTH IS NOT A THING THE PLAYER CAN FEEL ──────────────────
 *
 * `docs/decisions/0269-a-mid-boss-is-fought-for-as-long-as-its-level-says.md`. Asked for after the
 * alpha play: *"mid bosses need less health."* 0247 built the roster as a health ladder — 240 up to
 * 570 — and what that produced was fights of 37 to 112 seconds in no order at all, because **damage
 * actually landed varies four-fold across the seven** and runs inversely to how fast the hull crosses
 * the lane: a shot is fired where the ship is, and a fast hull is somewhere else when it arrives. The
 * redoubt carries more health than the lattice and dies in a third of the time.
 *
 * ⚠️ **SO THE HEALTHS IN `src/content/bosses.ts` ARE DERIVED AND THESE ARE AUTHORED.**
 * `scripts/solve-mid-health.mjs` measures each fight through the real frame and prints the health
 * that hits these numbers; every mid-boss's `health` is that output. `scripts/solve-hold.mjs` is the
 * same pattern for the music's loudness and exists for the same reason — a quantity nobody can reason
 * about directly is solved against the one that can be measured, with the solver committed beside it.
 *
 * ⚠️ **KEYED BY THE LEVEL AND NOT BY THE BOSS, WHICH IS WHAT THE RULE IS ACTUALLY ABOUT.** The first
 * draft keyed it by mid-boss kind, and to do that it had to be a `Record<string, …>` — only seven of
 * the fourteen bosses are mid-bosses — which `tests/registry.test.ts` refused on 0016's terms and was
 * right to. The rule is *how long this level's fight takes*; the run order is the order the numbers
 * climb in; a level owns both. It lives in this file rather than in `bosses.ts` for the same reason:
 * `levels.ts` already imports `BossKind`, so the other direction is a cycle.
 *
 * ⚠️ **IN RUN ORDER, WHICH IS THE ORDER A PLAYER MEETS THEM** — 17 seconds at the Approach climbing
 * to 23 at the Black Heart. 0247 records the roster climbing *"through the TABLE and not through the
 * run"*, which happened because the lattice and the shoal mother swapped levels; a ladder the player
 * cannot be in the order of is not a ladder. **The mean is 20, which is the number the play asked
 * for**, and the play owns both the mean and the spread.
 */
export const MID_BOSS_SECONDS: Record<LevelKind, number> = {
  approach: 17,
  descent: 18,
  coilward: 19,
  shoal: 20,
  batteries: 21,
  gauntlet: 22,
  eye: 23,
};

/**
 * Where an authored `lane` lands across the lane, in world units.
 *
 * ⚠️ **A `lane` IS A SHARE OF THE LANE, 0 TO 100, AND NOT A POSITION** —
 * `docs/decisions/0364-the-view-zooms-out.md`. The numbers were written when the lane was 100 units
 * and the two readings agreed; widening the lane to zoom the picture out would otherwise have pushed
 * every wave, pickup and landmark towards the near edge. Five hundred rows keep the number they were
 * written with, and the one conversion lives here rather than at each of the places that read them.
 */
export function laneAcross(lane: number): number {
  return (lane * ACROSS_SPAN) / 100;
}

export interface WaveEntry {
  /** Camera distance, in world units from the level's start, at which this wave spawns. */
  at: number;
  enemy: EnemyKind;
  formation: FormationKind;
  /** How many. The formation decides where each of them goes. */
  count: number;
  /**
   * Where the formation is centred across the lane, as a share of it, 0 to 100 — `laneAcross`.
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
  /** Where across the lane it sits, as a share of it, 0 to 100 — `laneAcross`. */
  lane: number;
}

/**
 * What a mid-boss's death throws onto the field, where it died — 0256.
 *
 * ── THE FIGHTS ARE WHERE THE ARMOUR AND THE CHARGES COME FROM ───────────────────────────────────
 *
 * `docs/decisions/0256-a-pickup-keeps-the-count.md`. Asked for, after the first play with the
 * mid-bosses in: *"weapons → 1 near the start of the level, 1 from the miniboss death; shields → 1
 * from the miniboss death; bombs → 1 from the miniboss death, 1 from the boss death."* A level
 * authors its upgrades and nothing else; the shield is earned in the fight halfway.
 *
 * ⚠️ **A MISSILE WHERE THE BOMB WAS — `docs/decisions/0372-a-death-keeps-the-ladders.md`.** The
 * bomb pickup is gone and so is the clear's charge, so the fight still throws three and the third
 * is the ladder the level authors least of. A charge comes from overflowing a ladder now.
 *
 * ⚠️ **ONE LIST FOR EVERY MID-BOSS**, on 0083's argument for one budget for every level: a fight
 * that quietly dropped a second shield would be authoring a difficulty curve in the one file that
 * must not.
 *
 * ⚠️ **A BOMB WHERE THE WEAPON WAS — 0441.** The weapon pickup is the bomb pickup, so the fight throws
 * a charge, a shield and a tube; and since the level authors no bomb after the first, the fight is
 * where a level's charge comes from.
 */
export const MID_BOSS_DROP: readonly PickupKind[] = ['bomb', 'shield', 'missile'];

/*
  ── `weaponsOfferedBy` WAS HERE, AND 0441 TOOK IT WITH THE DIAL'S WEAPON TERM ─────────────────────

  It counted the weapon pickups a level put on the field, because a weapon pickup turned the dial
  (`docs/decisions/0084-the-dial-is-the-level-and-the-guns.md`): a gun one rung up was a player who
  could take more. A gun has no rungs now, and a bomb pickup is a charge rather than a stronger ship,
  so the dial counts the levels and nothing else (`src/content/difficulty.ts`).
*/

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
/** A boss inside a level: which, and the camera distance at which it arrives — 0247. */
export interface MidBoss {
  kind: BossKind;
  at: number;
  /**
   * The seconds of fight this level is written for — its WINDOW — 0502. No wave is authored inside
   * it: none is put down from the moment the mid-boss is until this many seconds of camera later.
   *
   * Played: *"depending on the weapon anywhere between 10-25 secs or so. so let's go with 25 secs and
   * if you take longer to kill the miniboss you get increased difficulty with adds"*; and asked what
   * an early kill leaves, *"leave the gap empty."* So the window is the longest fight the player
   * reported, the script resumes where it ends whether the hull is dead or not, and a quick kill buys
   * quiet rather than an earlier level.
   *
   * ⚠️ **IN SECONDS, AND ON THE ROW, NOT A CONSTANT — 0282.** Every level says its own, so one can be
   * written for a longer fight without the others moving. `windowEnd` turns it into a place at the
   * rate the camera flies, which the caller hands it: the sim's step rate is not this layer's.
   *
   * ⚠️ **AND IT IS AUTHORING, NOT A SPAWN RULE.** The camera never stops for a mid-boss (0267), and
   * the mid-boss is put down on the same horizon as the waves, so *nothing put down for N seconds* is
   * *nothing authored for N seconds of camera* exactly. A rule in the spawner that held waves back
   * would put them where nobody authored them, which is the defect the note on `at` records.
   * `tests/window.test.ts` flies every level through the real frame and holds the gap in seconds.
   */
  windowSeconds: number;
}

/**
 * Where a mid-boss's window ends, in level coordinates: its `at`, and its `windowSeconds` of camera
 * travel.
 *
 * ⚠️ **`windowSeconds` AND NOT `window`**, which is the DOM's global: `tests/layering.test.ts` reads
 * the bare word in `src/content/` as reaching for the browser, and refused the first spelling.
 *
 * ⚠️ **THE RATE IS AN ARGUMENT** — the camera's units per second, which is `SCROLL_PER_STEP` times the
 * step rate, and the step rate is `src/state/`'s (0015). Content never reads a clock.
 */
export function windowEnd(midBoss: MidBoss, unitsPerSecond: number): number {
  return midBoss.at + midBoss.windowSeconds * unitsPerSecond;
}

export interface LandmarkEntry {
  /** World units from the level's start, exactly as a wave's `at` is. */
  at: number;
  /** Where across the lane its centre sits, as a share of it, 0 to 100 — `laneAcross`. */
  lane: number;
  /**
   * How far it moves per unit of camera travel — below every field's, so it is furthest away.
   *
   * ⚠️ **0203 KEPT 0112's *slower* CLAUSE AND STRUCK ONLY *no edge*.** A landmark that moved at a
   * field's rate would be a large object going past at the speed of the things that can kill you,
   * which is 0069's actual concern stated properly.
   */
  depth: number;
  /**
   * How far the camera travels for one beat of it, in world units. `0` for a landmark that is still.
   *
   * ⚠️ **IN WORLD UNITS AND NOT IN SECONDS, WHICH IS 0034 RATHER THAN A SHORTCUT.** *"Every speed is
   * in the camera's frame"* — everything else about a landmark (`at`, `depth`, `extent`) is measured
   * against camera travel, and a beat measured against a wall clock would be the one quantity in this
   * type that a paused, scrubbed or re-scaled camera desynchronises. It also keeps the renderer free
   * of a clock it does not otherwise have: `paintLandmarks` already knows where the camera is.
   */
  beat: number;
  /**
   * Which casting of the place's landmark this is — 0, 1 or 2.
   *
   * ⚠️ **A LANDMARK IS A BAKED BITMAP, SO A LEVEL THAT PLACES THREE PLACES THE SAME ONE THREE TIMES**
   * — `docs/decisions/0225-a-landmark-is-not-a-carbon-copy.md`. Asked for: *"lets go and add that seed
   * to the landmarks and levels… to make the levels more interesting rather than carbon copies."*
   * 0224 gave Saurian Belt three volcanoes and they came out identical, with two usually on screen
   * together.
   *
   * ⚠️ **AND IT IS AN INDEX RATHER THAN A FREE SEED, WHICH IS THE THING WORTH KNOWING.** A seed on the
   * entry would have to be honoured at DRAW time, and the drawing happens once per level at bake time
   * — so a free seed means baking per entry, and the atlas is a fixed array of bitmaps
   * (`docs/decisions/0065-the-sky-is-baked-and-blitted.md`). Three castings are baked from three seeds
   * at the boundary and an entry names one. It is the same trade `landmark` itself made: one slot,
   * seven completely different drawings, chosen by the place rather than by the sprite table.
   */
  variant: 0 | 1 | 2;
  /**
   * How much bigger than its bitmap this entry is drawn. Absent is 1 —
   * `docs/decisions/0346-the-pillars-fill-the-sky.md`.
   *
   * ⚠️ **ON THE ENTRY, PER 0282**: played, *"the pillars could be more prominent, they only take up
   * part of the screen and level, we can make them larger."* A bitmap is `SPRITE_EXTENT.landmark`
   * for every place, and a taller one for all seven is memory six of them have no use for; a number
   * the painter already takes is free, and a volcano or a heart that says nothing is unchanged.
   */
  scale?: number;
  /**
   * What this landmark throws, and absent for one that throws nothing —
   * `docs/decisions/0347-the-belt-is-a-jungle-under-a-live-volcano.md`. Only a place with a vent in
   * `VENT_OF` may state it; `tests/places.test.ts` holds that.
   */
  erupts?: Eruption;
}

/**
 * A level flown down a walled corridor — `docs/decisions/0348-the-labyrinth-is-walled.md`.
 *
 * Played: *"The end boss has some walls around it, but otherwise there's no labyrinth that the player
 * is actually flying through."*
 *
 * ⚠️ **A CENTRELINE AND A WIDTH, AND FOR NOW BOTH ARE THE BOX.** The faces stand exactly where
 * `src/sim/flight.ts` already clamps the ship, so the corridor is the picture of a rule that has been
 * in the game since 0074 and nothing new collides — `tests/corridor.test.ts` holds that in lane units.
 * Authored as two numbers rather than as *the box* so that 4b, where the corridor turns and forks,
 * changes a number into a curve instead of inventing the shape.
 */
export interface CorridorRow {
  /** Where the corridor's middle is, across the lane. */
  centre: number;
  /** How far apart its two wall faces are, across the lane. */
  width: number;
  /** What its walls are built of — the room's own stone, so the room is where the corridor arrives. */
  wall: SpriteKind;
  /**
   * Side passages opening off it, in level coordinates: where one starts, which wall (−1 near, +1
   * far), and how long it is. Dressing — a flanking wave opens its own as it arrives (`frame.ts`).
   */
  passages: readonly { at: number; side: -1 | 1; length: number }[];
  /**
   * How it turns — `docs/decisions/0350-the-corridor-turns.md`. Absent is straight, as 0348 laid it.
   *
   * Points in level coordinates. `narrow` is 0 at the full `width` and 1 at the tier's narrowest
   * (`DifficultyRow.corridor`); `swing` is −1 to 1, how far towards the near or the far side the
   * corridor is pushed, as a share of the room its narrowing leaves inside the box — so a corridor at
   * full width cannot swing, and the walls never leave the box whatever the numbers. Between points
   * it eases along a half-cosine; before the first and after the last it holds.
   *
   * ⚠️ **ONE SHAPE, AND THE TIER DECIDES HOW HARD IT IS** — the player's answer. The turns are in the
   * same places on every tier; how narrow they get and how steeply their walls may run is the tier's.
   */
  shape?: readonly { at: number; swing: number; narrow: number }[];
  /**
   * A corridor that is a FLOOR of acid rather than two walls of stone — 0383, and absent for stone.
   *
   * ⚠️ **ONE WALL, AND IT IS THE FAR ONE.** The Mire is flown over its ground, not down a corridor:
   * *"make it a hard ground wall like the labyrinth wall that causes hit damage/death to everything
   * but the end boss."* So the far face is the shore, and the near one is laid where nothing is.
   *
   * ⚠️ **AND IT IS ACID, WHICH SAYS THREE THINGS STONE DOES NOT.** It is drawn in front of what is in
   * it, because a thing in acid is under its surface; a flank from below rises up through it rather
   * than out of an opening — *"rise through unbroken acid"*, the player's answer; and a rift does not
   * carve it, because a lake closes over a hole. What it shares with stone is everything that bites.
   */
  bank?: BankRow;
}

/**
 * The Mire's floor — `docs/decisions/0383-the-mire-floor-is-a-wall.md`.
 *
 * ⚠️ **THE SHORE ROLLS, AND IT IS AUTHORED RATHER THAN ROLLED.** *"Rolling shore, world speed"* was the
 * player's answer: the ground scrolls with the world as the Labyrinth's walls do, and its edge rises
 * and falls. A knot per wall tile in whole lane units, as `layFaces` lays stone (0350), so a rise
 * across one tile is a whole number and the painter needs one baked cap per whole number.
 */
export interface BankRow {
  /**
   * The shore at each knot, in lane units, read round and round for as long as the level lasts — so
   * it runs on under a fight whose length nobody knows. A knot every `wall` tile.
   */
  shore: readonly number[];
  /** The cap for each whole rise across a tile, steepest fall first, level in the middle. */
  caps: readonly SpriteKind[];
  /**
   * The bed of pools under the shore: the tiles of one drawing, in the order they lie along the world
   * — `POOLS_OF` is where the pools are, and its bubbles rise off these.
   */
  bed: readonly SpriteKind[];
  /**
   * The caps a stretch of the bank wears where a boss stands in it — acid under the shore where the
   * rest is mud, rise for rise with `caps` — 0384. The stretch is the boss's (`wade.pool`); the shore
   * itself does not move, so what bites is exactly what bit.
   */
  pool: readonly SpriteKind[];
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
  /** The end boss: what waits at `bossAt`, and what the level's fight is. */
  boss: BossKind;
  /**
   * The mid-boss, and where it arrives, or `null` for a level with none —
   * `docs/decisions/0247-a-level-has-a-mid-boss-and-a-real-one.md`.
   *
   * ⚠️ **Asked for: *"change the current bosses to have about 50% less health and then be
   * mid-level bosses and add in the actual real bosses."*** A mid-boss holds station like an end
   * boss and must be killed like one, but the level does not end on it and the music does not turn
   * for it: it is a fight inside the run, and the waves keep coming around it. `at` is level-local
   * like `bossAt`, and before it.
   *
   * ⚠️ **`null` rather than optional**, on the same terms as a boss's `uncoil`: a level without one
   * is a decision somebody made, and `undefined` is a decision somebody forgot — 0016.
   */
  midBoss: MidBoss | null;
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
  /**
   * The corridor the level is flown down, and absent for one flown in the open — 0348, on 0282's
   * terms: one level states one, and six are drawn exactly as they were.
   */
  corridor?: CorridorRow;
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
/*
  ── `MULTI_HIT_RUNUP` WAS HERE — 0086's run-up after the pickup that lifted the one-hit clamp — AND
  0441 TOOK IT WITH THE CLAMP. Every ship opens on its whole gun, so there is no second weapon for the
  teeth to wait for; nothing read it once the dial went.
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
  { at: 377, enemy: 'lancer', formation: 'column', count: 8, lane: 50 },
  { at: 435, enemy: 'drifter', formation: 'vee', count: 6, lane: 55 },
  { at: 494, enemy: 'lancer', formation: 'line', count: 8, lane: 30 },
  { at: 551, enemy: 'drifter', formation: 'line', count: 5, lane: 65 },
  { at: 609, enemy: 'lancer', formation: 'vee', count: 8, lane: 45 },
  { at: 667, enemy: 'drifter', formation: 'vee', count: 6, lane: 50 },

  // ── Weavers. Introduced alone, then mixed into shapes that were safe without them. ──────────────
  { at: 725, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 754, enemy: 'drifter', formation: 'line', count: 5, lane: 38 },
  { at: 783, enemy: 'picket', formation: 'vee', count: 8, lane: 50 },
  { at: 812, enemy: 'drifter', formation: 'line', count: 5, lane: 65 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 841, enemy: 'weaver', formation: 'vee', count: 4, lane: 62 },
  // The swift — 0328: the first body in the run that flies a curve, met before the sentinel with the
  // one gun the level has handed over, and clamped to one hit here like everything before 1,000.
  { at: 870, enemy: 'swift', formation: 'vee', count: 5, lane: 50 },
  { at: 899, enemy: 'lancer', formation: 'column', count: 8, lane: 40 },
  { at: 956, enemy: 'weaver', formation: 'column', count: 5, lane: 55 },
  /*
    ── THE RUN-UP: THE STRETCH THE SECOND WEAPON GETS TO ITSELF ─────────────────────────────────────

    `docs/decisions/0086-the-teeth-wait-for-the-gun.md`, and the run-up 0441 removed was the promise
    these ten lines kept. Reported from play: *"we need to remove the enemies that take multiple
    shots to kill from the 1st level, they can't start appearing till after the second weapon
    pickup… they're too difficult to kill with the default fire mode."*

    ⚠️ **A three-health turret stood at 2,310 and the second weapon pickup was at 2,300** — ten world
    units, **a third of a second**. `docs/decisions/0084-the-dial-is-the-level-and-the-guns.md` lifts
    the single-hit clamp the instant that pickup SPAWNS, so the turret it was protecting the player
    from arrived alongside the pickup rather than after it: the player met it with the gun the clamp
    existed because they did not have.

    ⚠️ **MOVED UP THE LEVEL BY 0256, WITH THE PICKUP IT BELONGS TO.** The second weapon sits at
    1,000 now — *"before the miniboss appears"* — so this band runs from there to 1,600, with the
    sentinel arriving inside it at 1,549: the first thing in the level that takes more than one hit
    is the mid-boss, nine seconds after the gun that answers it. Two lancers and a picket that stood
    here went to the stretch after it, which the teeth now open.

    ⚠️ **Nothing here has more than one hit in it, and that is authored rather than clamped.** Past
    1,000 the clamp is off and every health in the table is real, so this band is a band of
    ONE-HEALTH KINDS — drifters and weavers. The clamp and this stretch answer the same complaint at
    two different times and neither covers the other's.

    ── AND SINCE 0441 IT HAS SHOOTERS IN IT ─────────────────────────────────────────────────────────

    ⚠️ **THE RUN-UP'S PREMISE WENT WITH THE CLAMP.** Every ship opens on its whole gun, so there is no
    second weapon for this stretch to wait for, and with nothing in it that fired, level one flew 12.1
    seconds without a bullet on the screen against 0259's nine (`tests/bullets.test.ts`). Asked, the
    player chose shooters: five waves here are the level's own firing kinds at the places and lanes
    the quiet ones stood — a picket line at 1,015, the swifts it met at 870 again at 1,073, a lancer
    line at 1,130, a picket vee at 1,305, a lancer column at 1,479 — so no more than two that do not
    fire come in a row, and no more than three that do (`MIX_RUN`). The first draft swapped three and
    the stretch from 956 to 1,130 still ran dry for twelve seconds; four left it at 9.02 against nine.
  */
  { at: 1015, enemy: 'picket', formation: 'line', count: 8, lane: 40 },
  { at: 1073, enemy: 'swift', formation: 'vee', count: 5, lane: 65 },
  { at: 1130, enemy: 'lancer', formation: 'line', count: 8, lane: 35 },
  { at: 1189, enemy: 'weaver', formation: 'vee', count: 5, lane: 60 },
  { at: 1246, enemy: 'drifter', formation: 'vee', count: 5, lane: 55 },
  { at: 1305, enemy: 'picket', formation: 'vee', count: 8, lane: 50 },
  { at: 1362, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 1420, enemy: 'drifter', formation: 'vee', count: 6, lane: 40 },
  { at: 1479, enemy: 'lancer', formation: 'column', count: 8, lane: 30 },
  { at: 1536, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },
  /*
    ⚠️ **NOTHING FROM 1,549 TO 2,449: THE SENTINEL'S WINDOW — 0502.** Twenty-five seconds of the
    camera from the mid-boss's own place, which no wave is put down inside: *"leave the gap empty."*
    Every wave from here to the boss stood 1,594 to 4,060 until then, and is the same script in the
    same order, scaled into what the window leaves. The places the notes below name are where those
    waves stood before 0502.
  */
  { at: 2450, enemy: 'weaver', formation: 'column', count: 5, lane: 30 },

  // ── Teeth. The lancer first, at the two health the run-up was hiding, and then the turret at three
  //    — so the level introduces *takes more than one shot* and *takes three* as two separate events.
  //    Mixed with the one-health kinds three at most in a row, which is 0231's rule; this stretch was
  //    the run-up's eight one-health waves until 0256 moved the second weapon up the level.
  { at: 2488, enemy: 'lancer', formation: 'line', count: 8, lane: 60 },
  { at: 2527, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 2565, enemy: 'drifter', formation: 'vee', count: 6, lane: 50 },
  { at: 2603, enemy: 'turret', formation: 'line', count: 6, lane: 55 },
  { at: 2642, enemy: 'drifter', formation: 'line', count: 6, lane: 35 },
  /*
    ⚠️ **THREE LANCER WAVES ARE SWIFTS — 0328 — AND THEY REPLACE RATHER THAN JOIN.** At the one-rung
    loadout `tests/fight.test.ts` walked this level with, the sentinel's fight ran most of the way to
    the serpent, so a firing wave ADDED anywhere past 1,549 landed on the fight and 0267's guard
    reddened: *the fight is the busiest part of the level.* A swift wave in a lancer wave's place
    sends five two-hit bodies where eight stood, so the fight gets no busier and the level gets a
    body that curves. A vee astride the centre crosses itself in an X. (0502 took that guard: a
    fight past its window is meant to get busier — *"increased difficulty with adds."*)
  */
  { at: 2679, enemy: 'swift', formation: 'vee', count: 5, lane: 50 },
  { at: 2718, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },
  { at: 2767, enemy: 'drifter', formation: 'column', count: 5, lane: 40 },
  { at: 2794, enemy: 'drifter', formation: 'vee', count: 6, lane: 45 },
  { at: 2833, enemy: 'picket', formation: 'line', count: 8, lane: 50 },
  /*
    ⚠️ **LANE 40, NOT 30 — 0382.** This column's fire used to depend on hiding: authored at 30, its
    turrets roamed off the near edge before anyone saw them, sat twenty units past the screen where
    the cap's sweeping guns cannot reach, and came back at sixty seconds to fire — the bursts at 60
    and 62 s in `scripts/weigh-bullets.mjs`'s strip. A roam that turns inside the lane until it is
    seen put the same column on the screen, where the sweep killed it before its first volley, and
    the level went 15.3 s dry at 2358 units against 0259's nine. Measured at 30 / 40 / 50: cover
    35% / 39% / 38%, and the dry stretch is inside the run-up at either of the last two. Forty is
    the lane the column at 2405 already flies.
  */
  { at: 2871, enemy: 'turret', formation: 'column', count: 6, lane: 40 },
  { at: 2910, enemy: 'lancer', formation: 'line', count: 8, lane: 60 },
  { at: 2948, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },
  { at: 2986, enemy: 'turret', formation: 'column', count: 6, lane: 40 },
  { at: 3025, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },

  // ── Chargers. Faster than a reaction, so they have to be seen coming. ───────────────────────────
  { at: 3063, enemy: 'charger', formation: 'line', count: 5, lane: 50 },
  { at: 3101, enemy: 'drifter', formation: 'line', count: 6, lane: 35 },
  // From the side, and back out by it — 0328: level one's first U, in a lancer vee's place.
  { at: 3139, enemy: 'swift', formation: 'column', count: 5, lane: 50, origin: 'acrossPlus' },
  { at: 3178, enemy: 'charger', formation: 'column', count: 5, lane: 65, origin: 'acrossMinus' },
  { at: 3216, enemy: 'charger', formation: 'column', count: 4, lane: 55, origin: 'acrossPlus' },
  { at: 3254, enemy: 'turret', formation: 'line', count: 6, lane: 40 },
  { at: 3293, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 3330, enemy: 'charger', formation: 'line', count: 5, lane: 50 },
  { at: 3369, enemy: 'lancer', formation: 'column', count: 8, lane: 60 },
  { at: 3408, enemy: 'drifter', formation: 'vee', count: 6, lane: 40 },
  { at: 3446, enemy: 'charger', formation: 'column', count: 5, lane: 30, origin: 'acrossMinus' },
  { at: 3484, enemy: 'turret', formation: 'column', count: 6, lane: 65 },
  { at: 3522, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },
  { at: 3561, enemy: 'charger', formation: 'line', count: 5, lane: 55 },

  // ── Everything, at density. The stretch that decides whether three lives was the right number. ──
  { at: 3599, enemy: 'picket', formation: 'vee', count: 8, lane: 50 },
  { at: 3637, enemy: 'turret', formation: 'column', count: 6, lane: 25 },
  { at: 3672, enemy: 'charger', formation: 'line', count: 5, lane: 60 },
  { at: 3706, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 3740, enemy: 'swift', formation: 'vee', count: 5, lane: 50 },
  { at: 3773, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },
  { at: 3808, enemy: 'charger', formation: 'column', count: 5, lane: 70, origin: 'acrossPlus' },
  { at: 3842, enemy: 'turret', formation: 'line', count: 6, lane: 45 },
  { at: 3876, enemy: 'weaver', formation: 'vee', count: 5, lane: 55 },
  { at: 3909, enemy: 'charger', formation: 'vee', count: 6, lane: 50 },
  { at: 3944, enemy: 'picket', formation: 'column', count: 8, lane: 65 },
  { at: 3978, enemy: 'drifter', formation: 'vee', count: 6, lane: 35 },
  { at: 4012, enemy: 'turret', formation: 'column', count: 6, lane: 40 },
  { at: 4046, enemy: 'charger', formation: 'column', count: 6, lane: 50, origin: 'acrossMinus' },
  { at: 4080, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
];

/*
  ── TWO PICKUPS A LEVEL, AND THERE WERE NINE, AND BEFORE THAT TWENTY-FOUR ────────────────────────

  `docs/decisions/0256-a-pickup-keeps-the-count.md`, amending
  `docs/decisions/0083-two-ladders-of-four.md`. 0083's nine were derived from a target — *"the player
  should be able to cap weapons before the first boss"* — and the target was sized for a death that
  cost the whole ladder (0039) and threw it back (0066). Played with the mid-bosses in, the verdict
  was the other way round: *"picking up a new weapon/missile type doesn't reset your power count…
  reduce and change the number of pickups → we don't need nearly as many if the power count isn't
  being reset… a death reduces the power count by 1."* A ladder that is only ever one rung down is a
  ladder that climbs across the RUN, so a level offers a rung of each kind and the fights offer the
  rest.

  ⚠️ **THE SHAPE IS THE SAME IN SIX OF THE SEVEN LEVELS, on 0083's own reasoning**: a weapon near the
  start and a missile a fifth of the way in; the mid-boss's death drops a weapon, a shield and a
  bomb where it died (`MID_BOSS_DROP`); the end boss's death is the clear's charge (0053). A level
  that quietly gave itself a second weapon would be authoring a difficulty curve in the one file
  that must not — and `tests/pickups.test.ts` holds the counts as the ask's, not as a copy of these.

  ⚠️ **LEVEL ONE IS THE EXCEPTION AND THE ASK NAMES IT**: *"level 1 → 1 additional weapon pickup
  before the miniboss appears, 1 additional missile pickup halfway between miniboss and level
  boss."* The run opens with the base gun and no tube, and level one is where both are handed over.

  ⚠️ **THE GUNS NO LONGER CAP INSIDE ONE LEVEL, AND THAT IS THE DESIGN.** Level one offers three
  weapons; the second level's two take a ship that lost nothing to the cap, and every level after
  that offers charges to a full ladder (0082's conversion) and rungs to one a death has cost. The
  fifty-second *never unarmed* ceiling 0082 kept as a drift detector is gone with its premise: a
  player who just died is one rung down, not unarmed.

  ⚠️ **THE DIAL STILL READS THESE** — `weaponsOfferedBy` counts the drop beside the list, and
  `src/content/difficulty.ts` sizes its per-level step so the last boss is still fought at 11.

  ⚠️ Lanes are deliberately off-centre and alternating. A pickup on the centreline is one the player
  drifts into without deciding anything, and `docs/game.md` wants every upgrade to be worth taking —
  which starts with taking it being a choice about position. At two a level that matters more than
  it did at nine: each of these is a crossing the player commits to.
*/
const APPROACH_PICKUPS: readonly PickupEntry[] = [
  /*
    ── THE WEAPON AT 267 WAS HERE, AND 0441 TOOK IT ───────────────────────────────────────────────

    *"We'll remove the first weapon pick up from each level so that the player doesn't end up with too
    many bombs."* It was the first thing the level offered, against an empty screen. A ship opens on
    its whole gun now, so the first crossing the level asks for is the tube below.
  */
  /*
    ⚠️ **THE MISSILE PICKUP IS THE SECOND WEAPON ARRIVING AT ALL.** The base ship has no tube
    (`docs/decisions/0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md`) and the ladder
    puts the first tube on tier 1, so this is not an upgrade to a thing the player has — it is a new
    thing. A fifth of the way in, which is the ask's *"about 20% of the way into the level"*, and
    after the first weapon because one new weapon at a time is how either gets noticed.
  */
  { at: 720, kind: 'missile', lane: 62 },
  /*
    ⚠️ **LEVEL ONE'S EXTRA PICKUP, BEFORE THE MID-BOSS — a bomb since 0441, and a weapon before it.**
    It was the pickup that lifted the one-hit clamp (0084, 0086); the clamp went with the weapon
    ladder, because its premise was a gun one rung up. What is left is a charge to bring into the
    first fight, 549 units before the sentinel arrives.
  */
  { at: 1000, kind: 'bomb', lane: 34 },
  /*
    ⚠️ **AND ITS EXTRA MISSILE, HALFWAY BETWEEN THE FIGHTS** — *"halfway between miniboss and level
    boss"*: the sentinel at 1549 and the serpent at 4270, so the midpoint is 2910. The second tube,
    for a player who took the first; a charge, for one whose rack is somehow already full.
  */
  { at: 2910, kind: 'missile', lane: 30 },
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
  { at: 300, enemy: 'lancer', formation: 'vee', count: 8, lane: 50 },
  { at: 355, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 365, enemy: 'spinner', formation: 'column', count: 3, lane: 30 },
  { at: 420, enemy: 'lancer', formation: 'line', count: 8, lane: 65 },
  { at: 474, enemy: 'charger', formation: 'vee', count: 5, lane: 50 },
  { at: 530, enemy: 'drifter', formation: 'vee', count: 6, lane: 40 },
  { at: 584, enemy: 'moth', formation: 'column', count: 5, lane: 35 },
  { at: 640, enemy: 'weaver', formation: 'column', count: 5, lane: 60 },

  // ── Wardens. Four health, weaving, and shooting — the first thing that is two problems at once. ─
  { at: 694, enemy: 'warden', formation: 'line', count: 5, lane: 50 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 722, enemy: 'weaver', formation: 'line', count: 5, lane: 60 },
  { at: 750, enemy: 'charger', formation: 'column', count: 5, lane: 30, origin: 'acrossMinus' },
  { at: 778, enemy: 'warden', formation: 'column', count: 5, lane: 40 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 805, enemy: 'drifter', formation: 'vee', count: 5, lane: 36 },
  { at: 859, enemy: 'drifter', formation: 'line', count: 6, lane: 55 },
  { at: 915, enemy: 'lancer', formation: 'vee', count: 8, lane: 62 },
  { at: 969, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },
  { at: 1025, enemy: 'moth', formation: 'line', count: 5, lane: 45 },
  // ⚠️ Filler, and it was filling something the density guard measured rather than something anybody
  // felt: two three-wide waves in a row used to be a six-enemy trough, and wardens are four health
  // each so making THEM more numerous would have changed the level's difficulty to fix its pacing.
  //
  // ⚠️ **IT IS NO LONGER LOAD-BEARING ON ITS OWN** — 0113 compressed every level by thirty seconds
  // without removing a body, so the view holds more at once and this wave can go without the guard
  // noticing. Driven: one removed is green, two are green, three go red. It stays because the level
  // was authored with it, not because the floor still needs it.
  { at: 1052, enemy: 'drifter', formation: 'line', count: 5, lane: 62 },
  { at: 1079, enemy: 'turret', formation: 'line', count: 6, lane: 55 },
  { at: 1134, enemy: 'charger', formation: 'column', count: 5, lane: 25, origin: 'acrossPlus' },
  { at: 1190, enemy: 'drifter', formation: 'vee', count: 6, lane: 50 },
  { at: 1244, enemy: 'warden', formation: 'vee', count: 5, lane: 50 },
  { at: 1300, enemy: 'weaver', formation: 'line', count: 5, lane: 40 },
  { at: 1354, enemy: 'lancer', formation: 'line', count: 8, lane: 68 },
  { at: 1410, enemy: 'charger', formation: 'line', count: 5, lane: 45 },
  // The swift — 0328: a line astride the centre, half sweeping each way, through the chargers.
  { at: 1437, enemy: 'swift', formation: 'line', count: 5, lane: 45 },
  { at: 1464, enemy: 'moth', formation: 'column', count: 5, lane: 35 },

  // ── Chargers at density, through standing fire. The stretch that punishes standing still. ───────
  { at: 1519, enemy: 'charger', formation: 'vee', count: 5, lane: 55 },
  { at: 1574, enemy: 'warden', formation: 'line', count: 5, lane: 45 },
  // ⚠️ Nothing from 1,599 to 2,499: the harrow's window — 0502. Everything below stood 1,629 to 4,110
  // until then, and is the same script in the same order, scaled into what the window leaves.
  { at: 2500, enemy: 'lancer', formation: 'line', count: 8, lane: 50 },
  { at: 2537, enemy: 'charger', formation: 'column', count: 5, lane: 35, origin: 'acrossMinus' },
  { at: 2572, enemy: 'turret', formation: 'line', count: 6, lane: 60 },
  { at: 2608, enemy: 'weaver', formation: 'column', count: 5, lane: 30 },
  { at: 2645, enemy: 'charger', formation: 'column', count: 5, lane: 70, origin: 'acrossPlus' },
  { at: 2681, enemy: 'moth', formation: 'vee', count: 5, lane: 50 },
  { at: 2717, enemy: 'warden', formation: 'column', count: 5, lane: 55 },
  { at: 2753, enemy: 'charger', formation: 'line', count: 6, lane: 42 },
  { at: 2790, enemy: 'charger', formation: 'vee', count: 5, lane: 60 },
  { at: 2825, enemy: 'turret', formation: 'column', count: 6, lane: 28 },
  { at: 2861, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 2897, enemy: 'lancer', formation: 'line', count: 8, lane: 65 },
  { at: 2934, enemy: 'moth', formation: 'line', count: 5, lane: 45 },
  { at: 2970, enemy: 'charger', formation: 'column', count: 5, lane: 50, origin: 'acrossMinus' },

  // ── Everything, with wardens holding the lane the player wants. ─────────────────────────────────
  { at: 3006, enemy: 'charger', formation: 'vee', count: 6, lane: 55 },
  { at: 3042, enemy: 'warden', formation: 'vee', count: 5, lane: 50 },
  { at: 3078, enemy: 'weaver', formation: 'line', count: 5, lane: 40 },
  { at: 3114, enemy: 'charger', formation: 'column', count: 5, lane: 65 },
  { at: 3150, enemy: 'turret', formation: 'line', count: 6, lane: 45 },
  { at: 3187, enemy: 'lancer', formation: 'column', count: 8, lane: 32 },
  { at: 3223, enemy: 'charger', formation: 'vee', count: 5, lane: 45 },
  { at: 3259, enemy: 'moth', formation: 'line', count: 5, lane: 58 },
  { at: 3295, enemy: 'lancer', formation: 'line', count: 8, lane: 50 },
  { at: 3331, enemy: 'weaver', formation: 'vee', count: 5, lane: 55 },
  { at: 3349, enemy: 'swift', formation: 'vee', count: 5, lane: 50 },
  { at: 3367, enemy: 'turret', formation: 'column', count: 6, lane: 70 },
  { at: 3403, enemy: 'lancer', formation: 'vee', count: 8, lane: 38 },
  { at: 3440, enemy: 'charger', formation: 'column', count: 5, lane: 60, origin: 'acrossPlus' },
  { at: 3476, enemy: 'moth', formation: 'column', count: 5, lane: 50 },
  { at: 3512, enemy: 'charger', formation: 'vee', count: 6, lane: 45 },
  { at: 3548, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 3584, enemy: 'lancer', formation: 'line', count: 8, lane: 30 },

  // ── The hardest stretch in the game so far. ─────────────────────────────────────────────────────
  { at: 3620, enemy: 'warden', formation: 'line', count: 5, lane: 50 },
  { at: 3654, enemy: 'charger', formation: 'vee', count: 5, lane: 55 },
  { at: 3689, enemy: 'turret', formation: 'line', count: 6, lane: 40 },
  { at: 3722, enemy: 'weaver', formation: 'line', count: 5, lane: 45 },
  { at: 3756, enemy: 'charger', formation: 'column', count: 5, lane: 65, origin: 'acrossMinus' },
  { at: 3790, enemy: 'moth', formation: 'vee', count: 5, lane: 50 },
  { at: 3824, enemy: 'warden', formation: 'column', count: 5, lane: 35 },
  { at: 3858, enemy: 'drifter', formation: 'line', count: 6, lane: 55 },
  { at: 3892, enemy: 'charger', formation: 'column', count: 5, lane: 25 },
  { at: 3926, enemy: 'turret', formation: 'column', count: 6, lane: 68 },
  { at: 3960, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },
  { at: 3994, enemy: 'warden', formation: 'vee', count: 5, lane: 45 },
  { at: 4028, enemy: 'moth', formation: 'line', count: 5, lane: 60 },
  { at: 4062, enemy: 'charger', formation: 'column', count: 5, lane: 40, origin: 'acrossPlus' },
  { at: 4096, enemy: 'drifter', formation: 'line', count: 6, lane: 50 },
  { at: 4130, enemy: 'warden', formation: 'line', count: 5, lane: 50 },
];

/**
 * Level two's pickups: the two every level after the first offers — 0256.
 *
 * ⚠️ **The old comment here said *"fewer upgrades than level one, and that is the difficulty"* and
 * that is no longer available as a lever** — 0256 fixes the budget at one weapon and one missile
 * everywhere after level one, so a level cannot be made harder by being stingier. What is left is
 * placement, and the lane.
 */
const DESCENT_PICKUPS: readonly PickupEntry[] = [
  // The opening weapon was here, as level one's was, and 0441 took both: *"we'll remove the first
  // weapon pick up from each level."* Every level after the first authors its tube and nothing else;
  // its charge is the mid-boss's.
  { at: 864, kind: 'missile', lane: 28 },
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
  { at: 359, enemy: 'lancer', formation: 'line', count: 8, lane: 58 },
  { at: 418, enemy: 'drifter', formation: 'line', count: 5, lane: 42 },
  { at: 477, enemy: 'lancer', formation: 'line', count: 8, lane: 53, origin: 'acrossMinus' },
  { at: 536, enemy: 'drifter', formation: 'line', count: 5, lane: 44 },
  { at: 595, enemy: 'lancer', formation: 'line', count: 8, lane: 60 },
  { at: 654, enemy: 'raptor', formation: 'line', count: 5, lane: 50 },
  { at: 713, enemy: 'lancer', formation: 'line', count: 8, lane: 40, origin: 'acrossPlus' },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 742, enemy: 'charger', formation: 'vee', count: 4, lane: 40 },
  { at: 772, enemy: 'sower', formation: 'column', count: 6, lane: 50 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 801, enemy: 'drifter', formation: 'line', count: 5, lane: 64 },
  { at: 831, enemy: 'lancer', formation: 'column', count: 8, lane: 41 },
  { at: 890, enemy: 'lancer', formation: 'column', count: 8, lane: 60, origin: 'acrossMinus' },
  { at: 948, enemy: 'weaver', formation: 'column', count: 5, lane: 45 },
  { at: 1008, enemy: 'charger', formation: 'column', count: 5, lane: 55 },
  { at: 1067, enemy: 'lancer', formation: 'column', count: 8, lane: 42, origin: 'acrossPlus' },
  { at: 1126, enemy: 'weaver', formation: 'column', count: 5, lane: 56 },
  // The swift from the side — 0328: the Belt's idea, *where things come from*, used twice by one body
  // that comes in by an edge and goes out by it.
  { at: 1155, enemy: 'swift', formation: 'column', count: 5, lane: 50, origin: 'acrossMinus' },
  { at: 1185, enemy: 'raptor', formation: 'column', count: 5, lane: 49 },
  { at: 1244, enemy: 'lancer', formation: 'column', count: 8, lane: 50, origin: 'acrossMinus' },
  { at: 1303, enemy: 'sower', formation: 'column', count: 6, lane: 44 },
  { at: 1361, enemy: 'weaver', formation: 'column', count: 5, lane: 55 },
  { at: 1420, enemy: 'lancer', formation: 'column', count: 8, lane: 60 },
  { at: 1480, enemy: 'lancer', formation: 'column', count: 8, lane: 45, origin: 'acrossPlus' },
  { at: 1539, enemy: 'weaver', formation: 'vee', count: 4, lane: 56 },
  // ⚠️ Nothing from 1,549 to 2,449: the shoal mother's window — 0502. Everything below stood 1,598 to
  // 4,016 until then, and is the same script in the same order, scaled into what the window leaves.
  { at: 2450, enemy: 'warden', formation: 'column', count: 5, lane: 42 },
  { at: 2490, enemy: 'turret', formation: 'vee', count: 6, lane: 47 },
  { at: 2530, enemy: 'lancer', formation: 'vee', count: 8, lane: 42, origin: 'acrossMinus' },
  { at: 2569, enemy: 'weaver', formation: 'vee', count: 4, lane: 44 },
  { at: 2608, enemy: 'turret', formation: 'vee', count: 6, lane: 53 },
  { at: 2648, enemy: 'sower', formation: 'vee', count: 6, lane: 44 },
  { at: 2689, enemy: 'raptor', formation: 'vee', count: 4, lane: 44 },
  { at: 2728, enemy: 'lancer', formation: 'vee', count: 8, lane: 60, origin: 'acrossPlus' },
  { at: 2768, enemy: 'turret', formation: 'vee', count: 6, lane: 50 },
  { at: 2808, enemy: 'weaver', formation: 'vee', count: 4, lane: 56 },
  { at: 2847, enemy: 'lancer', formation: 'vee', count: 8, lane: 47, origin: 'acrossMinus' },
  { at: 2887, enemy: 'turret', formation: 'vee', count: 6, lane: 58 },
  { at: 2927, enemy: 'charger', formation: 'line', count: 5, lane: 50 },
  { at: 2966, enemy: 'lancer', formation: 'vee', count: 8, lane: 53, origin: 'acrossPlus' },
  { at: 3007, enemy: 'turret', formation: 'vee', count: 6, lane: 44 },
  { at: 3047, enemy: 'charger', formation: 'line', count: 5, lane: 41, origin: 'acrossMinus' },
  { at: 3086, enemy: 'raptor', formation: 'line', count: 5, lane: 56 },
  { at: 3106, enemy: 'swift', formation: 'column', count: 5, lane: 50, origin: 'acrossPlus' },
  { at: 3125, enemy: 'lancer', formation: 'line', count: 8, lane: 55 },
  { at: 3165, enemy: 'charger', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 3205, enemy: 'weaver', formation: 'line', count: 5, lane: 44, origin: 'acrossMinus' },
  { at: 3245, enemy: 'charger', formation: 'line', count: 5, lane: 59 },
  { at: 3285, enemy: 'lancer', formation: 'line', count: 8, lane: 49, origin: 'acrossPlus' },
  { at: 3325, enemy: 'raptor', formation: 'line', count: 5, lane: 50 },
  { at: 3365, enemy: 'lancer', formation: 'line', count: 8, lane: 42, origin: 'acrossMinus' },
  { at: 3404, enemy: 'charger', formation: 'line', count: 5, lane: 41, origin: 'acrossMinus' },
  { at: 3444, enemy: 'charger', formation: 'line', count: 5, lane: 60 },
  { at: 3483, enemy: 'turret', formation: 'column', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 3523, enemy: 'weaver', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 3563, enemy: 'raptor', formation: 'line', count: 5, lane: 55 },
  { at: 3603, enemy: 'lancer', formation: 'column', count: 8, lane: 53, origin: 'acrossPlus' },
  { at: 3643, enemy: 'charger', formation: 'column', count: 5, lane: 47 },
  { at: 3682, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 3702, enemy: 'swift', formation: 'line', count: 5, lane: 50, origin: 'acrossMinus' },
  { at: 3722, enemy: 'turret', formation: 'column', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 3762, enemy: 'charger', formation: 'column', count: 5, lane: 44 },
  { at: 3802, enemy: 'raptor', formation: 'column', count: 5, lane: 50 },
  { at: 3841, enemy: 'lancer', formation: 'column', count: 8, lane: 40, origin: 'acrossPlus' },
  { at: 3881, enemy: 'charger', formation: 'column', count: 5, lane: 47 },
  { at: 3921, enemy: 'turret', formation: 'column', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 3961, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 4000, enemy: 'lancer', formation: 'column', count: 8, lane: 53, origin: 'acrossPlus' },
  { at: 4040, enemy: 'charger', formation: 'column', count: 5, lane: 44 },
  { at: 4080, enemy: 'turret', formation: 'column', count: 6, lane: 60, origin: 'acrossMinus' },
];

/**
 * ⚠️ **Level three's lanes swing wider than level one's, which is its own idea reaching the pickups.**
 * The level is about `origin` — threats arriving across the lane rather than down it — so a player
 * crossing for a pickup here is crossing the axis the level attacks from. The pickups do not change;
 * what changes is what it costs to reach them.
 */
const COILWARD_PICKUPS: readonly PickupEntry[] = [
  { at: 854, kind: 'missile', lane: 56 },
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
  { at: 472, enemy: 'sower', formation: 'line', count: 5, lane: 45 },
  { at: 530, enemy: 'charger', formation: 'line', count: 5, lane: 55 },
  { at: 588, enemy: 'drifter', formation: 'line', count: 5, lane: 42 },
  { at: 645, enemy: 'charger', formation: 'line', count: 5, lane: 59 },
  { at: 703, enemy: 'sower', formation: 'line', count: 5, lane: 49 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 731, enemy: 'drifter', formation: 'vee', count: 5, lane: 34 },
  { at: 760, enemy: 'sower', formation: 'column', count: 5, lane: 53 },
  { at: 789, enemy: 'charger', formation: 'column', count: 5, lane: 47 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 817, enemy: 'weaver', formation: 'line', count: 5, lane: 54 },
  { at: 875, enemy: 'weaver', formation: 'column', count: 5, lane: 56 },
  { at: 932, enemy: 'sentry', formation: 'column', count: 5, lane: 42 },
  { at: 990, enemy: 'charger', formation: 'column', count: 5, lane: 44, origin: 'acrossMinus' },
  { at: 1048, enemy: 'sower', formation: 'column', count: 5, lane: 56, origin: 'acrossPlus' },
  { at: 1105, enemy: 'weaver', formation: 'column', count: 5, lane: 56 },
  { at: 1163, enemy: 'charger', formation: 'column', count: 5, lane: 50 },
  { at: 1220, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 1277, enemy: 'sower', formation: 'column', count: 5, lane: 47 },
  { at: 1335, enemy: 'charger', formation: 'column', count: 5, lane: 42 },
  { at: 1392, enemy: 'weaver', formation: 'column', count: 5, lane: 53 },
  { at: 1450, enemy: 'lancer', formation: 'vee', count: 6, lane: 60 },
  { at: 1508, enemy: 'charger', formation: 'column', count: 5, lane: 44 },
  // ⚠️ Nothing from 1,519 to 2,419: the lattice's window — 0502. Everything below stood 1,565 to 3,980
  // until then, and is the same script in the same order, scaled into what the window leaves; the
  // places the notes below name are where those waves stood before it.
  { at: 2420, enemy: 'weaver', formation: 'column', count: 5, lane: 56 },
  { at: 2459, enemy: 'sentry', formation: 'vee', count: 6, lane: 42 },
  { at: 2498, enemy: 'weaver', formation: 'vee', count: 5, lane: 50 },
  { at: 2536, enemy: 'charger', formation: 'vee', count: 6, lane: 41 },
  { at: 2575, enemy: 'lancer', formation: 'vee', count: 6, lane: 50 },
  { at: 2614, enemy: 'weaver', formation: 'vee', count: 5, lane: 45, origin: 'acrossMinus' },
  { at: 2653, enemy: 'charger', formation: 'vee', count: 6, lane: 55 },
  { at: 2692, enemy: 'lancer', formation: 'vee', count: 6, lane: 45, origin: 'acrossMinus' },
  { at: 2730, enemy: 'weaver', formation: 'vee', count: 5, lane: 56 },
  { at: 2770, enemy: 'charger', formation: 'vee', count: 6, lane: 49, origin: 'acrossPlus' },
  { at: 2808, enemy: 'weaver', formation: 'vee', count: 5, lane: 44 },
  { at: 2847, enemy: 'sower', formation: 'vee', count: 6, lane: 60 },
  { at: 2886, enemy: 'sentry', formation: 'line', count: 5, lane: 42, origin: 'acrossMinus' },
  { at: 2924, enemy: 'weaver', formation: 'vee', count: 5, lane: 55 },
  { at: 2963, enemy: 'charger', formation: 'vee', count: 6, lane: 42 },
  { at: 3002, enemy: 'turret', formation: 'line', count: 5, lane: 60, origin: 'acrossPlus' },
  { at: 3041, enemy: 'charger', formation: 'line', count: 5, lane: 47 },
  { at: 3080, enemy: 'weaver', formation: 'line', count: 5, lane: 56 },
  { at: 3119, enemy: 'turret', formation: 'line', count: 5, lane: 47, origin: 'acrossMinus' },
  { at: 3157, enemy: 'charger', formation: 'line', count: 5, lane: 53 },
  { at: 3196, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 3235, enemy: 'turret', formation: 'line', count: 5, lane: 53, origin: 'acrossPlus' },
  { at: 3274, enemy: 'charger', formation: 'line', count: 5, lane: 50 },
  { at: 3313, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 3351, enemy: 'charger', formation: 'line', count: 5, lane: 58 },
  { at: 3391, enemy: 'sentry', formation: 'line', count: 5, lane: 44 },
  { at: 3429, enemy: 'charger', formation: 'line', count: 5, lane: 44 },
  { at: 3468, enemy: 'weaver', formation: 'line', count: 5, lane: 56 },
  { at: 3507, enemy: 'charger', formation: 'column', count: 6, lane: 50 },
  // Four, not five or six, from here to 3463 — 0472: three sowers in four waves were the level's
  // busiest two seconds at Savior outside its end boss, 35 live lances.
  { at: 3545, enemy: 'sower', formation: 'column', count: 4, lane: 44 },
  { at: 3584, enemy: 'drifter', formation: 'column', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 3623, enemy: 'charger', formation: 'column', count: 6, lane: 45 },
  // A sower since 0259, and it was a charger: the stretch from 3290 to 3463 was three non-firing
  // waves and the level's longest dry stretch at the capped loadout — `scripts/weigh-bullets.mjs`.
  { at: 3662, enemy: 'sower', formation: 'line', count: 4, lane: 55, origin: 'acrossMinus' },
  { at: 3701, enemy: 'sower', formation: 'column', count: 4, lane: 44, origin: 'acrossPlus' },
  { at: 3740, enemy: 'drifter', formation: 'column', count: 6, lane: 59 },
  { at: 3778, enemy: 'charger', formation: 'column', count: 6, lane: 49 },
  { at: 3817, enemy: 'charger', formation: 'column', count: 6, lane: 50, origin: 'acrossMinus' },
  { at: 3856, enemy: 'turret', formation: 'column', count: 5, lane: 44, origin: 'acrossPlus' },
  { at: 3895, enemy: 'drifter', formation: 'column', count: 6, lane: 60 },
  { at: 3934, enemy: 'charger', formation: 'column', count: 6, lane: 45, origin: 'acrossPlus' },
  { at: 3972, enemy: 'turret', formation: 'line', count: 5, lane: 55 },
  { at: 4012, enemy: 'sentry', formation: 'column', count: 5, lane: 44 },
  { at: 4050, enemy: 'drifter', formation: 'column', count: 6, lane: 59, origin: 'acrossMinus' },
];

/**
 * ⚠️ **Level four is the charger's level, so a pickup here is a thing to be grabbed between passes.**
 * Nothing about the list says so — that is the waves' job. The bomb this level used to author inside
 * the stretch where chargers arrive in vees is the mid-boss's now (0256), and the lattice sits in
 * that stretch.
 */
const SHOAL_PICKUPS: readonly PickupEntry[] = [
  { at: 848, kind: 'missile', lane: 36 },
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
  { at: 645, enemy: 'shard', formation: 'line', count: 4, lane: 50 },
  { at: 703, enemy: 'drifter', formation: 'line', count: 4, lane: 40 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 731, enemy: 'weaver', formation: 'vee', count: 4, lane: 42 },
  { at: 760, enemy: 'spinner', formation: 'column', count: 4, lane: 50 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 789, enemy: 'drifter', formation: 'line', count: 6, lane: 58 },
  { at: 817, enemy: 'warden', formation: 'column', count: 4, lane: 41 },
  { at: 875, enemy: 'turret', formation: 'column', count: 4, lane: 60 },
  { at: 932, enemy: 'shard', formation: 'column', count: 4, lane: 45 },
  { at: 990, enemy: 'drifter', formation: 'column', count: 4, lane: 55 },
  { at: 1048, enemy: 'warden', formation: 'column', count: 4, lane: 42, origin: 'acrossMinus' },
  { at: 1105, enemy: 'spinner', formation: 'column', count: 4, lane: 59 },
  { at: 1163, enemy: 'warden', formation: 'column', count: 4, lane: 49 },
  { at: 1220, enemy: 'drifter', formation: 'column', count: 4, lane: 50 },
  { at: 1277, enemy: 'shard', formation: 'column', count: 4, lane: 41 },
  { at: 1335, enemy: 'turret', formation: 'column', count: 4, lane: 60 },
  { at: 1392, enemy: 'warden', formation: 'column', count: 4, lane: 45, origin: 'acrossPlus' },
  { at: 1450, enemy: 'drifter', formation: 'column', count: 4, lane: 55 },
  { at: 1508, enemy: 'warden', formation: 'column', count: 4, lane: 42 },
  // ⚠️ Nothing from 1,519 to 2,419: the redoubt's window — 0502. Everything below stood 1,565 to 3,980
  // until then, and is the same script in the same order, scaled into what the window leaves; the
  // places the notes below name are where those waves stood before it.
  { at: 2420, enemy: 'shard', formation: 'vee', count: 4, lane: 47 },
  { at: 2459, enemy: 'turret', formation: 'vee', count: 4, lane: 58 },
  { at: 2498, enemy: 'drifter', formation: 'vee', count: 4, lane: 42 },
  { at: 2536, enemy: 'warden', formation: 'vee', count: 4, lane: 53 },
  { at: 2575, enemy: 'turret', formation: 'vee', count: 4, lane: 44, origin: 'acrossMinus' },
  { at: 2614, enemy: 'shard', formation: 'vee', count: 4, lane: 60 },
  { at: 2653, enemy: 'drifter', formation: 'vee', count: 4, lane: 50 },
  { at: 2692, enemy: 'turret', formation: 'vee', count: 4, lane: 40 },
  { at: 2730, enemy: 'lancer', formation: 'vee', count: 4, lane: 47 },
  { at: 2770, enemy: 'warden', formation: 'vee', count: 4, lane: 58, origin: 'acrossPlus' },
  { at: 2808, enemy: 'drifter', formation: 'vee', count: 4, lane: 42 },
  { at: 2847, enemy: 'shard', formation: 'vee', count: 4, lane: 53 },
  { at: 2886, enemy: 'weaver', formation: 'line', count: 5, lane: 56 },
  { at: 2924, enemy: 'warden', formation: 'vee', count: 4, lane: 44 },
  { at: 2963, enemy: 'turret', formation: 'vee', count: 4, lane: 60 },
  { at: 3002, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  // Every turret from here to the end four, not five — 0472: the level's busiest two seconds at
  // Savior were the run from 2715 to 2945, 42 live bullets, two thirds of them flak.
  { at: 3041, enemy: 'turret', formation: 'line', count: 4, lane: 50 },
  { at: 3080, enemy: 'shard', formation: 'line', count: 5, lane: 41 },
  { at: 3119, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 3157, enemy: 'turret', formation: 'line', count: 4, lane: 45, origin: 'acrossMinus' },
  { at: 3196, enemy: 'warden', formation: 'line', count: 5, lane: 55 },
  { at: 3235, enemy: 'weaver', formation: 'line', count: 5, lane: 45, origin: 'acrossMinus' },
  { at: 3274, enemy: 'turret', formation: 'line', count: 4, lane: 59 },
  // Three since 0472, from five: each one killed opens into frost that splits again.
  { at: 3313, enemy: 'shard', formation: 'line', count: 3, lane: 49, origin: 'acrossPlus' },
  // A weaver since 0472, and it was a turret: turret, shard, turret was the level's busiest two seconds
  // at Savior even with every turret at four, because a shard killed there shatters into the flak.
  { at: 3351, enemy: 'weaver', formation: 'line', count: 5, lane: 41 },
  { at: 3391, enemy: 'drifter', formation: 'line', count: 5, lane: 60 },
  { at: 3429, enemy: 'charger', formation: 'column', count: 5, lane: 42, origin: 'acrossMinus' },
  { at: 3468, enemy: 'turret', formation: 'line', count: 4, lane: 55 },
  { at: 3507, enemy: 'warden', formation: 'line', count: 5, lane: 42 },
  { at: 3545, enemy: 'weaver', formation: 'column', count: 5, lane: 53 },
  { at: 3584, enemy: 'shard', formation: 'column', count: 5, lane: 47 },
  { at: 3623, enemy: 'turret', formation: 'column', count: 4, lane: 58 },
  { at: 3662, enemy: 'charger', formation: 'column', count: 5, lane: 50 },
  { at: 3701, enemy: 'warden', formation: 'column', count: 5, lane: 44 },
  { at: 3740, enemy: 'turret', formation: 'column', count: 4, lane: 60, origin: 'acrossPlus' },
  { at: 3778, enemy: 'weaver', formation: 'column', count: 5, lane: 44 },
  { at: 3817, enemy: 'shard', formation: 'column', count: 5, lane: 47, origin: 'acrossMinus' },
  { at: 3856, enemy: 'turret', formation: 'column', count: 4, lane: 58 },
  { at: 3895, enemy: 'charger', formation: 'column', count: 5, lane: 42 },
  { at: 3934, enemy: 'weaver', formation: 'column', count: 5, lane: 53, origin: 'acrossPlus' },
  { at: 3972, enemy: 'warden', formation: 'column', count: 5, lane: 44 },
  { at: 4012, enemy: 'turret', formation: 'column', count: 4, lane: 60 },
  { at: 4050, enemy: 'charger', formation: 'column', count: 5, lane: 50, origin: 'acrossMinus' },
];

/**
 * ⚠️ **Level five is the one where nothing can be outrun**: turrets and wardens hold station and
 * accumulate, and a charge is the only thing in the game that clears a lane the player has let fill
 * up. The charge is the redoubt's to drop now (0256), a third of the way in.
 */
const BATTERIES_PICKUPS: readonly PickupEntry[] = [
  { at: 848, kind: 'missile', lane: 60 },
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
  // Four, not five — 0502, the count every turret after 0472 carries.
  { at: 355, enemy: 'turret', formation: 'line', count: 4, lane: 44 },
  { at: 410, enemy: 'drifter', formation: 'line', count: 5, lane: 60 },
  { at: 465, enemy: 'lancer', formation: 'line', count: 8, lane: 45, origin: 'acrossMinus' },
  { at: 519, enemy: 'warden', formation: 'line', count: 5, lane: 55 },
  { at: 574, enemy: 'drifter', formation: 'line', count: 5, lane: 42 },
  { at: 629, enemy: 'lancer', formation: 'line', count: 5, lane: 59 },
  { at: 684, enemy: 'spore', formation: 'line', count: 5, lane: 49, origin: 'acrossPlus' },
  { at: 739, enemy: 'drifter', formation: 'line', count: 5, lane: 50 },
  /*
    ⚠️ **FIVE WAVES 27 APART STOOD HERE UNTIL 0502**, at 739 to 848 — the densest stretch the level
    authored, in the stretch the player called heavy: *"heavy at the front of the level and then
    hardly any waves near the end."* The two 0113 fillers between went to the back, where it was
    thin, and the turret is four like every turret after 0472.
  */
  { at: 794, enemy: 'turret', formation: 'line', count: 4, lane: 47 },
  { at: 848, enemy: 'sower', formation: 'line', count: 5, lane: 44, origin: 'acrossMinus' },
  { at: 904, enemy: 'charger', formation: 'line', count: 5, lane: 58 },
  { at: 958, enemy: 'spinner', formation: 'line', count: 5, lane: 53 },
  { at: 1013, enemy: 'charger', formation: 'line', count: 5, lane: 44 },
  { at: 1068, enemy: 'spore', formation: 'line', count: 5, lane: 56, origin: 'acrossPlus' },
  { at: 1123, enemy: 'turret', formation: 'line', count: 5, lane: 50 },
  { at: 1178, enemy: 'charger', formation: 'line', count: 5, lane: 40 },
  { at: 1233, enemy: 'weaver', formation: 'line', count: 5, lane: 47, origin: 'acrossMinus' },
  { at: 1287, enemy: 'turret', formation: 'line', count: 5, lane: 58 },
  { at: 1343, enemy: 'charger', formation: 'line', count: 5, lane: 42 },
  { at: 1397, enemy: 'spore', formation: 'line', count: 5, lane: 53, origin: 'acrossPlus' },
  { at: 1452, enemy: 'spinner', formation: 'line', count: 5, lane: 44 },
  { at: 1507, enemy: 'charger', formation: 'line', count: 5, lane: 60 },
  { at: 1562, enemy: 'weaver', formation: 'line', count: 5, lane: 50, origin: 'acrossMinus' },
  { at: 1616, enemy: 'warden', formation: 'line', count: 5, lane: 50 },
  /*
    ⚠️ **NOTHING FROM 1,619 TO 2,519: THE CHORUS'S WINDOW — 0502.** Everything below stood 1,672 to
    4,085 until then and is the same script in the same order, with the two fillers from the front
    in it, laid evenly from the window's end to the boss: this level was one wave every 55 units,
    and it is one every 35 now. The places the notes below name are where those waves stood before
    it.
  */
  { at: 2520, enemy: 'charger', formation: 'line', count: 5, lane: 41 },
  { at: 2555, enemy: 'lancer', formation: 'line', count: 5, lane: 60, origin: 'acrossMinus' },
  { at: 2591, enemy: 'warden', formation: 'line', count: 5, lane: 45 },
  { at: 2626, enemy: 'spore', formation: 'line', count: 5, lane: 55 },
  { at: 2662, enemy: 'lancer', formation: 'line', count: 5, lane: 42, origin: 'acrossPlus' },
  { at: 2697, enemy: 'warden', formation: 'line', count: 5, lane: 59 },
  { at: 2733, enemy: 'charger', formation: 'line', count: 5, lane: 49 },
  { at: 2768, enemy: 'lancer', formation: 'line', count: 5, lane: 50, origin: 'acrossMinus' },
  { at: 2803, enemy: 'warden', formation: 'line', count: 5, lane: 41 },
  { at: 2839, enemy: 'charger', formation: 'line', count: 5, lane: 60 },
  { at: 2874, enemy: 'lancer', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 2910, enemy: 'warden', formation: 'line', count: 5, lane: 55 },
  { at: 2945, enemy: 'charger', formation: 'line', count: 5, lane: 42 },
  { at: 2981, enemy: 'lancer', formation: 'line', count: 5, lane: 59, origin: 'acrossMinus' },
  { at: 3016, enemy: 'spore', formation: 'line', count: 6, lane: 47 },
  // Every turret from here to the end four, not six — 0472: the level's two busiest stretches at
  // Savior were here, 47 and 39 live bullets over two seconds, three quarters of them flak.
  { at: 3052, enemy: 'turret', formation: 'line', count: 4, lane: 58, origin: 'acrossMinus' },
  { at: 3087, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 3122, enemy: 'warden', formation: 'line', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 3158, enemy: 'charger', formation: 'line', count: 6, lane: 44 },
  { at: 3193, enemy: 'turret', formation: 'line', count: 4, lane: 60, origin: 'acrossMinus' },
  { at: 3229, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 3264, enemy: 'warden', formation: 'line', count: 6, lane: 40, origin: 'acrossPlus' },
  { at: 3300, enemy: 'spore', formation: 'line', count: 6, lane: 47 },
  { at: 3335, enemy: 'turret', formation: 'line', count: 4, lane: 58, origin: 'acrossMinus' },
  { at: 3370, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 3406, enemy: 'warden', formation: 'line', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 3441, enemy: 'charger', formation: 'line', count: 6, lane: 44 },
  { at: 3477, enemy: 'turret', formation: 'line', count: 4, lane: 60, origin: 'acrossMinus' },
  { at: 3512, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 3548, enemy: 'spore', formation: 'line', count: 6, lane: 50 },
  { at: 3583, enemy: 'warden', formation: 'line', count: 6, lane: 60 },
  { at: 3618, enemy: 'weaver', formation: 'line', count: 5, lane: 44, origin: 'acrossMinus' },
  { at: 3654, enemy: 'turret', formation: 'line', count: 4, lane: 45, origin: 'acrossPlus' },
  { at: 3689, enemy: 'lancer', formation: 'line', count: 6, lane: 55 },
  { at: 3725, enemy: 'charger', formation: 'line', count: 6, lane: 42, origin: 'acrossMinus' },
  { at: 3760, enemy: 'weaver', formation: 'line', count: 5, lane: 56 },
  { at: 3796, enemy: 'warden', formation: 'line', count: 6, lane: 49, origin: 'acrossPlus' },
  // 0113's filler, moved here from the front by 0502: more death notes where the level was thin.
  { at: 3831, enemy: 'charger', formation: 'line', count: 4, lane: 44 },
  { at: 3867, enemy: 'turret', formation: 'line', count: 4, lane: 50 },
  { at: 3902, enemy: 'spore', formation: 'line', count: 6, lane: 60 },
  { at: 3937, enemy: 'lancer', formation: 'line', count: 6, lane: 41, origin: 'acrossMinus' },
  { at: 3973, enemy: 'weaver', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 4008, enemy: 'warden', formation: 'line', count: 6, lane: 55 },
  // 0113's filler, moved here from the front by 0502: more death notes where the level was thin.
  { at: 4044, enemy: 'weaver', formation: 'vee', count: 5, lane: 60 },
  { at: 4079, enemy: 'turret', formation: 'line', count: 4, lane: 42, origin: 'acrossMinus' },
  { at: 4115, enemy: 'charger', formation: 'line', count: 6, lane: 49, origin: 'acrossPlus' },
  { at: 4150, enemy: 'lancer', formation: 'line', count: 6, lane: 59 },
];

/**
 * ⚠️ **Level six's idea is density, which is exactly what makes reaching one of these expensive.** Two
 * pickups over a script with no gaps in it is the level that will say soonest whether 0256's budget
 * is too mean — if any level leaves the player unable to reach what it offers, it is this one.
 */
const GAUNTLET_PICKUPS: readonly PickupEntry[] = [
  { at: 868, kind: 'missile', lane: 42 },
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
  { at: 461, enemy: 'turret', formation: 'line', count: 5, lane: 53 },
  { at: 514, enemy: 'charger', formation: 'line', count: 5, lane: 44 },
  { at: 568, enemy: 'turret', formation: 'line', count: 6, lane: 60, origin: 'acrossPlus' },
  { at: 621, enemy: 'weaver', formation: 'line', count: 5, lane: 50 },
  { at: 674, enemy: 'charger', formation: 'line', count: 5, lane: 40 },
  { at: 728, enemy: 'gaze', formation: 'line', count: 5, lane: 47, origin: 'acrossMinus' },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 755, enemy: 'drifter', formation: 'line', count: 6, lane: 36 },
  { at: 782, enemy: 'warden', formation: 'line', count: 6, lane: 50 },
  // 0113 — a one-health, non-firing wave in this level's widest mid gap: more death notes, no more incoming.
  { at: 808, enemy: 'charger', formation: 'vee', count: 4, lane: 64 },
  { at: 835, enemy: 'charger', formation: 'line', count: 6, lane: 41 },
  { at: 888, enemy: 'warden', formation: 'line', count: 6, lane: 45 },
  { at: 942, enemy: 'weaver', formation: 'line', count: 5, lane: 56, origin: 'acrossMinus' },
  { at: 996, enemy: 'charger', formation: 'line', count: 6, lane: 55 },
  // ⚠️ Nothing from 1,044 to 1,944: the axis's window — 0502. Everything below stood 1,049 to 4,206
  // until then, and is the same script in the same order, scaled into what the window leaves; the
  // places the notes below name are where those waves stood before it.
  { at: 1945, enemy: 'sower', formation: 'line', count: 5, lane: 44, origin: 'acrossPlus' },
  { at: 1985, enemy: 'gaze', formation: 'line', count: 6, lane: 59 },
  { at: 2024, enemy: 'charger', formation: 'line', count: 6, lane: 49 },
  { at: 2063, enemy: 'weaver', formation: 'line', count: 5, lane: 50, origin: 'acrossMinus' },
  { at: 2103, enemy: 'warden', formation: 'line', count: 6, lane: 41 },
  { at: 2142, enemy: 'charger', formation: 'line', count: 6, lane: 60 },
  { at: 2181, enemy: 'weaver', formation: 'line', count: 5, lane: 45, origin: 'acrossPlus' },
  { at: 2220, enemy: 'warden', formation: 'line', count: 6, lane: 55 },
  { at: 2261, enemy: 'charger', formation: 'line', count: 6, lane: 42 },
  { at: 2300, enemy: 'weaver', formation: 'line', count: 5, lane: 56, origin: 'acrossMinus' },
  { at: 2339, enemy: 'warden', formation: 'line', count: 6, lane: 49 },
  { at: 2379, enemy: 'charger', formation: 'vee', count: 6, lane: 47 },
  { at: 2418, enemy: 'gaze', formation: 'vee', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 2458, enemy: 'warden', formation: 'vee', count: 6, lane: 42 },
  { at: 2497, enemy: 'charger', formation: 'vee', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 2536, enemy: 'turret', formation: 'vee', count: 6, lane: 44 },
  { at: 2575, enemy: 'warden', formation: 'vee', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 2614, enemy: 'charger', formation: 'vee', count: 6, lane: 50 },
  { at: 2655, enemy: 'gaze', formation: 'vee', count: 6, lane: 40, origin: 'acrossPlus' },
  { at: 2694, enemy: 'warden', formation: 'vee', count: 6, lane: 47 },
  { at: 2733, enemy: 'charger', formation: 'vee', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 2773, enemy: 'turret', formation: 'vee', count: 6, lane: 42 },
  { at: 2812, enemy: 'warden', formation: 'vee', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 2852, enemy: 'charger', formation: 'vee', count: 6, lane: 44 },
  { at: 2891, enemy: 'gaze', formation: 'vee', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 2930, enemy: 'warden', formation: 'vee', count: 6, lane: 50 },
  { at: 2969, enemy: 'charger', formation: 'vee', count: 6, lane: 40, origin: 'acrossPlus' },
  { at: 3008, enemy: 'weaver', formation: 'column', count: 5, lane: 50 },
  { at: 3049, enemy: 'warden', formation: 'column', count: 6, lane: 60 },
  { at: 3088, enemy: 'charger', formation: 'column', count: 6, lane: 41, origin: 'acrossMinus' },
  // Every turret from here to the end four, not six — 0472: the level's busiest stretch at Savior
  // outside its two fights was here, 33 live bullets over two seconds, nine tenths of them flak.
  { at: 3127, enemy: 'turret', formation: 'column', count: 4, lane: 45, origin: 'acrossPlus' },
  { at: 3167, enemy: 'weaver', formation: 'column', count: 5, lane: 55 },
  { at: 3206, enemy: 'charger', formation: 'column', count: 6, lane: 42, origin: 'acrossMinus' },
  { at: 3246, enemy: 'gaze', formation: 'column', count: 6, lane: 59 },
  { at: 3285, enemy: 'turret', formation: 'column', count: 4, lane: 49, origin: 'acrossPlus' },
  { at: 3324, enemy: 'weaver', formation: 'column', count: 5, lane: 50 },
  { at: 3363, enemy: 'charger', formation: 'column', count: 6, lane: 41, origin: 'acrossMinus' },
  { at: 3402, enemy: 'warden', formation: 'column', count: 6, lane: 60 },
  { at: 3443, enemy: 'turret', formation: 'column', count: 4, lane: 45, origin: 'acrossPlus' },
  { at: 3482, enemy: 'weaver', formation: 'column', count: 5, lane: 55 },
  { at: 3521, enemy: 'charger', formation: 'column', count: 6, lane: 42, origin: 'acrossMinus' },
  { at: 3561, enemy: 'gaze', formation: 'column', count: 6, lane: 59 },
  { at: 3601, enemy: 'turret', formation: 'column', count: 4, lane: 49, origin: 'acrossPlus' },
  { at: 3640, enemy: 'charger', formation: 'line', count: 6, lane: 47 },
  { at: 3679, enemy: 'warden', formation: 'line', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 3718, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 3757, enemy: 'turret', formation: 'line', count: 4, lane: 53, origin: 'acrossPlus' },
  { at: 3797, enemy: 'gaze', formation: 'line', count: 6, lane: 44 },
  { at: 3837, enemy: 'charger', formation: 'line', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 3876, enemy: 'warden', formation: 'line', count: 6, lane: 50 },
  { at: 3915, enemy: 'weaver', formation: 'line', count: 5, lane: 44, origin: 'acrossPlus' },
  { at: 3955, enemy: 'turret', formation: 'line', count: 4, lane: 47 },
  { at: 3995, enemy: 'lancer', formation: 'line', count: 6, lane: 58, origin: 'acrossMinus' },
  { at: 4034, enemy: 'charger', formation: 'line', count: 6, lane: 42 },
  { at: 4073, enemy: 'gaze', formation: 'line', count: 6, lane: 53, origin: 'acrossPlus' },
  { at: 4112, enemy: 'weaver', formation: 'line', count: 5, lane: 44 },
  { at: 4151, enemy: 'turret', formation: 'line', count: 6, lane: 60, origin: 'acrossMinus' },
  { at: 4191, enemy: 'lancer', formation: 'line', count: 6, lane: 50 },
  { at: 4231, enemy: 'charger', formation: 'line', count: 6, lane: 40, origin: 'acrossPlus' },
  { at: 4270, enemy: 'warden', formation: 'line', count: 6, lane: 47 },
];

/**
 * ⚠️ **The last authored level, and its pickups are the same two as the second one's.** That is the
 * point rather than an oversight: 0256's budget is a property of *a level*, and a run that reached
 * here is carrying whatever six levels' worth of deaths left on the ladder — one rung each. What
 * makes level seven harder than level one is the script above it, not what it withholds.
 */
const EYE_PICKUPS: readonly PickupEntry[] = [
  { at: 892, kind: 'missile', lane: 64 },
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
    // The serpent at the end, and the sentinel — the teacher — halfway, once the push has begun.
    boss: 'jormungandr',
    // Twenty-five seconds of nothing new from the sentinel's arrival — 0502, the player's number.
    midBoss: { kind: 'sentinel', at: 1549, windowSeconds: 25 },
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
    boss: 'volans',
    midBoss: { kind: 'harrow', at: 1599, windowSeconds: 25 },
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
    // ⚠️ `beat: 0` — the Pillars are rock and the only moving thing in them is the streamers off the
    // tips, which are baked. A landmark beats only where the place is named after something alive.
    /*
      ── THREE STANDS OF THEM, AND THEY FILL THE SKY — 0346 ────────────────────────────────────────

      Played: *"the pillars could be more prominent, they only take up part of the screen and level,
      we can make them larger and more interesting."* One casting at the bitmap's own 75 units was a
      thing in the lower right for a minute. The three castings 0225 bakes were always there and the
      level placed one; it places all three now, scaled so the tallest column runs from under the
      bottom of the lane to its top, at three rates so the stands slide against each other.

      ⚠️ **THE MIDDLE ONE IS STILL AT 1299 AND IS STILL THE BIGGEST**, because that is where the organ
      opens and `tests/sky.test.ts` holds it there. The first is on screen from the opening; the last
      arrives as the first is leaving, so the level is never without them and the fight has them behind it.

      ⚠️ **`lane` MOVED WITH THE SCALE, FOR 0204's OWN REASON**: the feet have to run off the bottom of
      the frame or they are cut off in mid-air, and a bigger sprite centred where the small one was
      puts them further down than they need to be and the tips off the top.
    */
    landmarks: [
      // ⚠️ NEGATIVE ON PURPOSE: `at` is where a stand ENTERS, and at this depth one entering at the
      // start has crept a fifth of the way in by the first section — photographed, and the opening was
      // empty. It entered fourteen hundred units before the level began, so it is standing there.
      { at: -1400, lane: 66, depth: 0.07, beat: 0, variant: 1, scale: 1.35 },
      { at: 1299, lane: 58, depth: 0.08, beat: 0, variant: 0, scale: 1.7 },
      { at: 2650, lane: 62, depth: 0.075, beat: 0, variant: 2, scale: 1.5 },
    ],
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
    // The pterodactyl at the end; the shoal mother — the labyrinth's old end, a flying thing that
    // fires little and hits hard — halfway, as the belt's mid-tier dino.
    boss: 'quetzal',
    midBoss: { kind: 'shoalMother', at: 1549, windowSeconds: 25 },
    /*
      ⚠️ **THREE, AND THIS IS THE FIRST LEVEL TO PLACE MORE THAN ONE** —
      `docs/decisions/0224-the-mountain-is-awake.md`. Asked for: *"exploding volcanoes adding volcanic
      effects at some points in the level."* **Points, plural**, is the whole reason the slot exists:
      0203 made a landmark the one thing in the sky that can be somewhere in particular, and until now
      every place that used it used it once.

      ⚠️ **ONE PER SECTION AFTER THE FIRST, SO THE LEVEL ESCALATES WITH ITS OWN MUSIC.** 1249, 2534 and
      3627 are `push`, `surge` and `approach` — read off `sections` above rather than typed twice, the
      way the Pillars are tied to Ember Nebula's organ. Each arrives a little before its boundary,
      because `at` is when a landmark's leading edge ENTERS and it takes most of a minute to cross.

      ⚠️ **THE SMOKE LEAVES THE TOP OF THE SCREEN, AND THAT IS WHAT `scale` AND `lane` ARE FOR — 0347.**
      Played: *"the volcano is one pulsing graphic that doesn't touch the sky."* The plume is drawn to
      the top of the bitmap, so the bitmap's top edge has to be above the lane or the column ends on a
      ruled line in mid-air, which is what shipped. At `scale: 1.4` the sprite is 105 units tall;
      centred at lane 46 it runs from −6.5 to 98.5, the crater lands between lane 23 and 31, and the
      foot is behind the far range. `tests/places.test.ts` holds both ends against the drawings.

      ⚠️ **`beat: 0`, BECAUSE A MOUNTAIN DOES NOT BREATHE.** It was a slow scale-swell — the heart's
      machinery at a long period — and it was the *"one pulsing graphic"* of the report. What moves now
      is what a volcano does: rock.

      ⚠️ **AND EACH ERUPTS HARDER THAN THE ONE BEFORE, WITH THE MUSIC.** `push` throws a few, `surge`
      more and faster, and the one that arrives with `approach` is going off.

      ⚠️ **AND NOTHING THEY THROW COMES DOWN UNTIL THE FIGHT — 0363.** *"Fire up into the air and off
      the screen, but they don't fall down as it's distracting."* Every rock leaves the top of the
      screen; the first rock that falls is the quetzal's `fall`, on the lane. Each volcano keeps about
      the throws a second it had when rock came back down — 0347's 5/170, 8/150 and 11/135 — so fewer are
      in the air at once, because a flight is now only the climb.
    */
    landmarks: [
      { at: 1249, lane: 46, depth: 0.07, beat: 0, variant: 0, scale: 1.4, erupts: { count: 2, period: 72, overshoot: 14, reach: 10 } },
      { at: 2534, lane: 48, depth: 0.075, beat: 0, variant: 1, scale: 1.4, erupts: { count: 3, period: 62, overshoot: 20, reach: 13 } },
      { at: 3627, lane: 45, depth: 0.065, beat: 0, variant: 2, scale: 1.45, erupts: { count: 4, period: 52, overshoot: 28, reach: 16 } },
    ],
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
    // The gyre — the lattice, upgraded — at the end; the lattice itself, the saurian belt's old end,
    // halfway.
    boss: 'gyre',
    midBoss: { kind: 'lattice', at: 1519, windowSeconds: 25 },
    landmarks: [],
    theme: 'labyrinth',
    /*
      ⚠️ **WALLED THE WHOLE WAY, AND THE ROOM IS WHERE IT ARRIVES — 0348.** The faces stand at the
      box's edges, where the ship is already clamped, and run from the level's first step to the gyre
      room's open side, which takes over in the same stone.

      ⚠️ **THE PASSAGES HERE ARE THE ONES NOTHING COMES OUT OF.** Every flanking wave opens its own
      as it arrives, at the screen's leading edge where a flanker enters — so the player learns that a
      gap in the wall is where things come from, and these few are the ones that stay empty. Spaced
      away from the level's sixteen flanks rather than on top of them.
    */
    corridor: {
      centre: ACROSS_SPAN / 2,
      width: ACROSS_SPAN - PLAYER_MARGIN * 2,
      wall: 'roomWall',
      passages: [
        { at: 150, side: 1, length: 36 },
        { at: 620, side: -1, length: 48 },
        { at: 1260, side: 1, length: 30 },
        { at: 1640, side: -1, length: 42 },
        { at: 2150, side: 1, length: 36 },
        { at: 2700, side: -1, length: 30 },
        { at: 3120, side: 1, length: 48 },
        { at: 3560, side: -1, length: 36 },
      ],
      /*
        ⚠️ **TWO TURNING STRETCHES, AND THE THREE STRAIGHT ONES ARE WHERE A FIGHT IS — 0350.** Straight
        and full width for the opening 300, for the lattice's fight (it arrives at 1519, and the
        stretch is held from 1270 to 2100), and for the last 400 before the room — the plan's rule
        that a fight in a corridor that is also turning is two difficulties at once. Between them the
        corridor swings from side to side and pinches, a point every 180 units or so: far enough
        apart that the half-cosine between them sets the shape, and the tier's slope only caps it.

        ⚠️ **TO 2100, NOT 1770, SINCE 0472** solved the lattice at the tuned tier. 1770 was sized for a
        fight nobody flew; at Savior the hull now dies with the camera near 1880 and its drop thrown at
        about 2046, where 1900's and 2080's swings had the stone across the lane.
      */
      shape: [
        { at: 300, swing: 0, narrow: 0 },
        { at: 450, swing: -0.8, narrow: 0.6 },
        { at: 620, swing: 0.7, narrow: 0.9 },
        { at: 800, swing: 0.9, narrow: 0.4 },
        { at: 980, swing: -0.6, narrow: 1 },
        { at: 1150, swing: 0, narrow: 0.5 },
        { at: 1270, swing: 0, narrow: 0 },
        { at: 2100, swing: 0, narrow: 0 },
        { at: 2260, swing: -0.9, narrow: 0.5 },
        { at: 2440, swing: 0.5, narrow: 0.8 },
        { at: 2620, swing: 0.9, narrow: 1 },
        { at: 2800, swing: 0, narrow: 0.6 },
        { at: 2980, swing: -0.8, narrow: 0.9 },
        { at: 3160, swing: 0.6, narrow: 1 },
        { at: 3340, swing: 0.9, narrow: 0.4 },
        { at: 3520, swing: -0.3, narrow: 0.8 },
        { at: 3740, swing: 0, narrow: 0 },
      ],
    },
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
    boss: 'hoarfrost',
    midBoss: { kind: 'redoubt', at: 1519, windowSeconds: 25 },
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
    boss: 'hydra',
    midBoss: { kind: 'chorus', at: 1619, windowSeconds: 25 },
    landmarks: [],
    theme: 'mire',
    /*
      ── THE GROUND IS A WALL — 0383 ───────────────────────────────────────────────────────────────

      *"The bottom ground with the acid pools sits slightly too high on the screen… it needs to be
      lower so that the lower row of acid pools sits just off screen. We also need to make it a hard
      ground wall like the labyrinth wall."*

      ⚠️ **AT REST IT IS THE LOWEST QUARTER OF THE LANE, FROM 90 TO THE BOX'S FLOOR AT 114**, where the
      Labyrinth's is the whole box. A wave is read into the corridor against its rest and a body rides
      it (0350), so this is how much of the lane the shore bends: what flies low over it keeps its
      height over it, and a wave authored above 90 is put down where it was authored. Measured, flying
      the level on every tier and the mid-boss fight with `scripts/weigh-fight.mjs`:

      | rest from | the shore destroys | the mid-boss fight, against the 22 s asked |
      |---|---|---|
      | 60 | 0 / 0 / 0 | **25.5 s** — the squeeze moved every lower-half wave, and the fight with it |
      | 80 – 96 | 0 / 0 / 0 | 21.0 s, the level as it was authored |
      | 100 | 7 / 5 / 3 | 20.9 s — too little reach, and bodies meet the shore it did not bend them over |

      90 is the middle of the range that changes nothing the author wrote and loses nothing to the shore.

      ⚠️ **THE SHORE STANDS BETWEEN LANE 106 AND LANE 113, AND BOTH ENDS ARE MEASURED.** The pools lie
      under it at fixed lanes — acid is level, and land rises over it — with the upper row's surfaces
      at 117 to 118 and the lower row's past the screen's edge (`POOLS_OF`), so the lowest shore leaves
      three lanes of bank over the highest pool, and the highest leaves eleven: the three to eight the
      bank was before 0383, give or take its hills. And at 106 it takes eight lanes off the bottom of a
      box that ends at 114, so the ship keeps a hundred of its hundred and eight at the shore's highest.

      ⚠️ **HILLS OF THREE TO SEVEN LANES, NEVER STEEPER THAN TWO A TILE** — a rise of 9.5°, gentle enough
      to be ground rather than a wall standing up out of it, and 480 units round, a little over two
      screens, so the eye does not find the repeat.
    */
    corridor: {
      centre: (ACROSS_SPAN * 0.75 + ACROSS_SPAN - PLAYER_MARGIN) / 2,
      width: ACROSS_SPAN * 0.25 - PLAYER_MARGIN,
      wall: 'mireBank',
      passages: [],
      bank: {
        shore: [
          112, 112, 111, 109, 108, 107, 107, 108, 110, 112,
          113, 113, 112, 111, 111, 110, 108, 106, 106, 107,
          109, 111, 112, 112, 111, 109, 108, 108, 109, 110,
          110, 109, 107, 106, 106, 107, 108, 110, 111, 112,
        ],
        caps: MIRE_BANK_CAPS,
        bed: MIRE_BED,
        pool: MIRE_ACID_CAPS,
      },
    },
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

      ⚠️ **AND `push` OPENS 6.3 SECONDS SOONER, ON A BAR** — `docs/decisions/0331-the-heart-beats-under-it.md`.
      *"Black heart needs the heartbeat a bit earlier, the beginning drums need to fade into the
      heartbeat at 15 secs or so."* 744 → 518 units is 20.7 s → 14.4 s, which is a downbeat, so the
      fade starts where it was asked for rather than on the next bar after it.

      ⚠️ **AND THE LAST TWO SLIDE UP A SECTION, SO THE CLIMB HAS A STEP AT 42 s** — 0331's fourth
      listen: *"we also need a mid-range tone kick in around the 42s mark, because the jump around 1.06
      in volume is too steep."* A level has four rungs before its fight and this one now needs four
      turns before 1:06, so `surge` opens at 41.6 s — a downbeat — for the piano, and `approach` takes
      the 2360 `surge` had, which is still where the heart landmark below goes past. The piece's peak
      now runs from 1:06 to the boss.

      ⚠️ **AND THEN THEY BECAME FOUR MOVEMENTS, EACH ON A PHRASE** — 0331's seventh listen: *"slow,
      sombre, melancholy intro → higher faster but similar tone → almost power ballad tale of loss →
      fading back into the sombre melancholy with a faster beat"*, with *"a bit of a twist around the
      1:10."* The lament's sixteen bars; the same song faster from bar 16 (25.6 s); the ballad from bar
      40 (64 s), so it has landed by 1:10; the acceptance from bar 60 (96 s). Each boundary is a few
      units short of its bar, so the rung has turned before that downbeat rather than after it.

      ⚠️ **AND THE BALLAD OPENS FOUR BARS SOONER, ON ITS OWN LEAD-IN** — 0331's twelfth listen: *"the
      volume rise and transition for the 1.10 change is a bit too severe, we need to increase the
      instruments and volume slightly earlier to bridge that transition."* `surge` turns at bar 36
      (57.6 s), and the ballad — still turned so its first bar lands on bar 40 — enters on its own last
      four, `Dm · Em · F · G`, climbing into the top of the song while it swells in (`swell` on the row).
    */
    sections: [
      { at: 0, section: 'run' },
      { at: 918, section: 'push' },
      { at: 2070, section: 'surge' },
      // 0331's fifteenth: the ballad's refrain and descent run to 1:55, so the acceptance opens at bar 72.
      { at: 4145, section: 'approach' },
    ],
    boss: 'medusa',
    midBoss: { kind: 'axis', at: 1044, windowSeconds: 25 },
    /*
      ⚠️ **NO LANDMARK SINCE 0400: THE HEART IS WHERE THE FIGHT IS.** It went past a long way off with
      `surge` from 0220 on, beating to the camera. *"The black heart needs to be set into the screen
      like the cog boss at the end of the 4th and not show in the background prior to that, with the
      background level arteries leading to it."* It is the seat of the last fight now (`BOSSES.medusa`),
      and the level's vessels run into it there.
    */
    landmarks: [],
    theme: 'core',
  },
};
