/**
 * How hard the game is, chosen before a run and fixed for its length.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. Behaviour
 * rides the row: nothing downstream switches on a tier's name, it reads the numbers off the row.
 *
 * ── WHY THIS IS NOT AN ASSIST, AND CANNOT BE ONE ────────────────────────────────────────────────
 *
 * ⚠️ `docs/decisions/0024-the-accessibility-floor-is-settings.md` closes the assist ladder with **no
 * assist may ever make the game harder**, and `src/sim/assist.ts` is built so that the whole product
 * of settings can be proved monotone. That makes *"harder than the default"* literally
 * unrepresentable there — correctly. A player who turns the flashing down must not be playing a
 * harder game, and the ladder is what guarantees it.
 *
 * A tier is the other axis. It is chosen deliberately, it is a property of the RUN rather than of the
 * device, and its whole purpose is to be harder. The two are orthogonal and both have to exist:
 * `docs/decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md`.
 *
 * ── WHY THE EASIEST TIER IS ALL ONES ────────────────────────────────────────────────────────────
 *
 * ⚠️ **`legendary` multiplies nothing, and that is a rule rather than a coincidence.** Asked for in
 * play: *"keep the current flow as Easy."* It means a level author, a play-test report and every
 * number in `src/content/levels.ts` are all read against one baseline — the content as authored — and
 * the two harder tiers are stated as departures from it. A middle tier that was also the baseline
 * would make *"the level is too thin"* a sentence with three possible meanings.
 *
 * `tests/difficulty.test.ts` holds it, and holds the ordering. It holds none of the values.
 *
 * ── WHAT IS AND IS NOT SCALED ───────────────────────────────────────────────────────────────────
 *
 * ⚠️ **Nothing here touches the player's own numbers.** `SHIP_SPEED`, the flight response and the
 * auto-fire are the same on every tier — `docs/decisions/0037-the-ship-has-mass.md` settled them by
 * playing, and a tier that also moved them would mean the hand that settled them had settled one
 * third of a game. What a tier changes is what the level sends: how much killing it takes, how often
 * it shoots, and how fast it arrives.
 *
 * ⚠️ **And it does not change the SCRIPT.** A tier that added waves would make
 * `src/content/levels.ts` three levels wearing one name, and `tests/level.test.ts`'s lane and pacing
 * guards would then be checking one of them. Density is authored; toughness is a tier.
 */

import { onFireGrid } from './cadence.ts';

/**
 * Every tier, **easiest first**.
 *
 * ⚠️ **The order IS the list, and `tests/difficulty.test.ts` walks it in pairs.** A separate ordering
 * table beside a `Record` is two descriptions of one fact, which is the mistake
 * `src/content/sprites.ts` records the cost of; and *harder than the one before* is only a
 * well-formed statement about a sequence.
 */
export const DIFFICULTY_KINDS = ['legendary', 'savior', 'burn'] as const;

/** Derived from the list, so a tier cannot exist in the union and be missing from the table. */
export type DifficultyKind = (typeof DIFFICULTY_KINDS)[number];

export interface DifficultyRow {
  /**
   * What the player picks, and what they would be called for finishing it.
   *
   * ⚠️ **A title rather than a grade.** *Easy · Normal · Hard* is what every game says and it is a
   * description of the software; these are descriptions of the pilot, which is the thing the player
   * is choosing to be. `docs/game.md`'s voice rule wants terse, not flavourless.
   */
  title: string;
  /**
   * The one line under it, and it exists because the titles do not sort themselves.
   *
   * ⚠️ **Disambiguation is not the over-explaining the voice rule bans.** *Let the Galaxy Burn* is
   * the most attractive of the three names and the hardest of the three tiers; a player who picks it
   * for the name has been misled by the screen rather than by themselves.
   */
  hint: string;
  /**
   * Lives a run starts with.
   *
   * ⚠️ **The one knob here that is about the RUN rather than about what arrives**, which is why it
   * is a count and not a multiplier. `STARTING_LIVES` was the single description of this and is now
   * the easiest tier's entry — `src/state/slices/run.ts` has the note.
   */
  lives: number;
  /**
   * Multiplier on the health of everything that can be shot. Rounded up, never below one.
   *
   * Rounded UP so a tier can never make something take fewer shots than the tier below it — at 1.6 a
   * one-health drifter would round to 2 either way, and at 1.2 it would round to 1 while a
   * four-health warden went to 5. Down, the drifter would go to 1 and the ordering would hold by
   * luck rather than by construction.
   */
  toughness: number;
  /**
   * Multiplier on the steps between shots, for everything that shoots at the player. **Lower is
   * faster**, because the field it multiplies is a gap.
   *
   * ⚠️ It is the one field here that is inverted, and it is named `fireGap` rather than `fireRate`
   * for exactly that reason — `src/sim/assist.ts` makes the same argument for `playerDamage` over
   * `playerToughness`. The guard walks the tiers in pairs and knows which way each field goes.
   */
  fireGap: number;
  /** Multiplier on how fast an enemy closes on the player, on top of the camera's own advance. */
  closing: number;
  /**
   * Multiplier on the speed of everything fired at the player.
   *
   * ⚠️ **Separate from `closing`, because they are two different things to be bad at.** A faster
   * enemy is less time to decide; a faster bullet is less time to move. The middle tier raises the
   * first more than the second on purpose — a shot the player cannot outrun is a coin flip, and
   * `src/content/shots.ts` says the whole of what makes `spit` dodgeable is being slower than the
   * ship.
   */
  shotSpeed: number;
  /**
   * Multiplier on how hard a body that reacts to the player steers towards them.
   *
   * ── WHY THIS IS THE TIER AXIS THE PLAY-TEST ASKED FOR BY NAME ───────────────────────────────────
   *
   * Reported: *"they need to circle, double back etc and be actively dog-fighting with the player,
   * **it can be straightforward dog-fighting depending on difficulty**."*
   * `docs/decisions/0073-an-enemy-is-a-pilot.md`. So the reactive motions in
   * `src/content/enemies.ts` author a rate, and this is what a tier does to it: the easiest tier
   * gets a body that leans towards you, the hardest gets one that stays on you.
   *
   * ⚠️ **It reaches only the three REACTIVE motions.** A weave is a shape in the world and a roam
   * turns round at a fixed band; multiplying either would change a picture the level is authored
   * against rather than change how hard something is trying, which is the distinction between this
   * field and `closing`.
   *
   * ⚠️ **Higher is harder, like everything here except `fireGap`.**
   */
  aggression: number;
}

export const DIFFICULTIES: Record<DifficultyKind, DifficultyRow> = {
  /**
   * The content as authored, with a life in hand.
   *
   * ⚠️ **Every multiplier is exactly 1 and that is load-bearing** — see the file header. Asked for:
   * *"this should provide me no challenge, but still require concentration."* The extra lives are
   * where the *no challenge* half lives, because they are the one thing that can be given without
   * changing what the player is looking at.
   */
  legendary: {
    title: 'Legendary Pilot',
    hint: 'The gentlest way in',
    lives: 5,
    toughness: 1,
    fireGap: 1,
    closing: 1,
    shotSpeed: 1,
    // Straightforward dog-fighting, which is the play report's own phrase for what the easy tier
    // should get: the reactive motions run at exactly the rate `src/content/enemies.ts` authors.
    aggression: 1,
  },
  /**
   * The tier the game is tuned for.
   *
   * ⚠️ **PLAY-TEST NUMBERS, every one**, on the same terms as `SHIP_SPEED` and `STARTING_LIVES`.
   * The target is stated and the numbers are a first guess at it: *"this should be hard for me, I
   * should be able to get to level 4 with challenge."* Nothing asserts on any value below.
   */
  savior: {
    title: 'Savior of the Galaxy',
    hint: 'What the game is tuned for',
    lives: 3,
    toughness: 1.6,
    fireGap: 0.78,
    closing: 1.2,
    shotSpeed: 1.15,
    aggression: 1.3,
  },
  /**
   * The tier that is supposed to end runs.
   *
   * ⚠️ Also a guess, against a stated target: *"I should be able to get to maybe the end boss of
   * level 2."* Two lives rather than three is deliberate — a tier that only made things tougher
   * would lengthen every fight without changing what a mistake costs, and length is not difficulty.
   */
  burn: {
    title: 'Let the Galaxy Burn',
    hint: 'It is not meant to be survived',
    lives: 2,
    toughness: 2.2,
    fireGap: 0.5,
    closing: 1.4,
    shotSpeed: 1.3,
    /*
      ⚠️ **Raised further than `closing` is, and that is deliberate.** A faster body is less time to
      decide; a body that STAYS ON YOU is a different problem, and it is the one this tier is named
      for. At 1.7 a hunting lancer crosses the lane in about five seconds rather than nine.
    */
    aggression: 1.7,
  },
};

/*
  ── THE DIAL: A SECOND DIFFICULTY AXIS, AND IT MOVES DURING A LEVEL ──────────────────────────────

  `docs/decisions/0084-the-dial-is-the-level-and-the-guns.md`. Everything above is a TIER — chosen
  before a run and fixed for its length (0047). The dial is the other half of what the play-test asked
  for, and the project had no mechanism for it at all:

  > *"There should be progression of mission and difficulty from one level to the next… It's a dial
  > that starts at 1 and should be at 11 when the player is dealing with the last boss at the end of
  > the last level."*

  > *"Level 1 -> dial starts at 1, increases to 2 when the player gets their first weapon power up,
  > increases again when they get their next, until they get to the boss which should be difficulty 4
  > or so on the dial. Level 2 starts by dialing it back 2 notches to give the player a breathing
  > space and then dials it up per power up spawn so it should be around 5 at the end of the level.
  > That pattern then repeats."*

  ⚠️ **The two axes multiply and neither replaces the other.** A tier says *how hard is this run*; the
  dial says *how far into it are we*. `legendary` at dial 11 and `burn` at dial 1 are different games
  and both have to be reachable, which is why this is not a fourth tier.
*/

/** Where a run opens. The first level's first screen, before anything has been offered. */
export const DIAL_MIN = 1;

/**
 * Where the last boss sits, and it is the ask's own number.
 *
 * ⚠️ **REACHED EXACTLY, and that is arithmetic rather than luck** — see `dialFor`. A ceiling the
 * content stops short of would make the top of the dial a thing nobody ever sees, and one the content
 * runs past would make the clamp the real ending.
 */
export const DIAL_MAX = 11;

/**
 * What a level boundary adds, and what each weapon pickup the level OFFERS adds.
 *
 * ── THE SAWTOOTH IS THESE TWO NUMBERS AND NOTHING ELSE ──────────────────────────────────────────
 *
 * A level ends `DIAL_PER_WEAPON × weapons` above where it began, and the next begins
 * `DIAL_PER_LEVEL` above where the last one BEGAN — which is the *"dial it back a couple of notches
 * to give the player a breathing space"* the ask describes, expressed as a rise rather than as a drop
 * so that nothing has to remember where the previous level ended.
 *
 * ⚠️ **Both are 1, and that is derived rather than chosen.** `src/content/levels.ts` offers four
 * weapon pickups a level over seven levels, so the last boss sits at
 * `DIAL_MIN + 6×DIAL_PER_LEVEL + 4×DIAL_PER_WEAPON` = **11**, which is the ask's number to the
 * notch. `tests/dial.test.ts` recomputes that from the content rather than restating it, so a level
 * that gains a weapon pickup fails there rather than silently moving the top of the dial.
 */
export const DIAL_PER_LEVEL = 1;
export const DIAL_PER_WEAPON = 1;

/**
 * Where the dial is, given how far into the run and how much the level has already put on the field.
 *
 * ── OFFERED, NOT HELD — AND THE ASK SAYS BOTH ───────────────────────────────────────────────────
 *
 * ⚠️ **This counts what the LEVEL HAS SPAWNED, not what the player picked up**, and the ask uses both
 * words: *"increases to 2 when the player **gets** their first weapon power up"* and *"dials it up
 * **per power up spawn**"*. They are different mechanisms and only one of them can sawtooth.
 *
 * **Held cannot.** Upgrades cross a level boundary
 * (`docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md`), so a player entering level
 * two with four weapon tiers would carry those four notches with them and the dial would climb
 * monotonically to the end of the run — no breathing space, ever. Offered restarts with the script,
 * which is what makes the shape the ask drew possible at all.
 *
 * ⚠️ **What that costs is written down rather than hidden**: a player who ignores every pickup still
 * faces a rising dial. 0084 argues that the gap is small — a pickup waits seven seconds and reaches
 * 6% of the lane (0064, 0056), and a death now hands everything back (0083) — and names it as the
 * first thing a play-test should disagree with.
 *
 * ⚠️ **Clamped at both ends.** A level index past the roster is a shell bug and a black screen is a
 * worse way to report it than a hard fight — `src/app/lifecycle.ts` clamps the index for the same
 * reason.
 */
export function dialFor(levelIndex: number, weaponsOffered: number): number {
  const raw = DIAL_MIN + levelIndex * DIAL_PER_LEVEL + weaponsOffered * DIAL_PER_WEAPON;
  return raw < DIAL_MIN ? DIAL_MIN : raw > DIAL_MAX ? DIAL_MAX : raw;
}

/**
 * The dial below which nothing the player meets takes more than one hit.
 *
 * ⚠️ **THE SMALLEST PROOF THE DIAL CAN CARRY, and it is a reported defect rather than a demo.**
 * *"At the start of the game there should be no multiple hit enemies until after the 2nd upgrade has
 * been spawned — the difficulty curve currently has a massive spike at the start, then it also
 * immediately scales out and then drops off to super easy based on buffs the player has."*
 *
 * ⚠️ **Three, and it is the ask's *after the 2nd upgrade has been spawned* in dial units.** Level one
 * opens at `DIAL_MIN` = 1; the second weapon pickup puts it at 3. Written as a dial threshold rather
 * than as *two pickups* so that it means the same thing in every level — the clamp is a property of
 * how far into the run the player is, and level two opens past it.
 */
export const MULTI_HIT_DIAL = 3;

/**
 * Whether the run is still in the opening stretch where everything dies to one shot.
 *
 * ── THE `levelIndex === 0` TERM IS NOT BELT AND BRACES, AND A GUARD CAUGHT ITS ABSENCE ───────────
 *
 * ⚠️ **A dial threshold ALONE cannot express this, and the first draft assumed it could.** The
 * sawtooth reuses low dial values by construction: level two opens at `DIAL_MIN + 1` = 2, which is
 * under `MULTI_HIT_DIAL` — so a plain `dial < MULTI_HIT_DIAL` brings the clamp back at the start of
 * level two, and again at the start of level three's first weapon. The opening of most of the game
 * would have had no multi-hit enemies in it.
 *
 * ⚠️ **And no threshold fixes it, which is worth writing down so nobody tries.** The clamp must be
 * OFF at dial 2 (level two's opening) and ON at dial 2 (level one, one weapon in). Those are the same
 * number. The dial says *how hard*; it does not say *how far in*, and this rule is about the second.
 *
 * ⚠️ **It still reads the dial rather than counting pickups**, so the threshold stays a dial fact and
 * moves with it. What the level term adds is *and only during the opening*.
 *
 * ⚠️ **A predicate rather than an arm inside `toughnessFor`, because it must not reach a BOSS.** The
 * dial at every boss is far past the threshold, so folding it in would be dead code that only looked
 * safe — and the day somebody authored a boss earlier, a one-health boss would be the result.
 * `src/app/frame.ts` applies it at the one spawn site that is an enemy in a wave.
 */
export function singleHitOnly(levelIndex: number, weaponsOffered: number): boolean {
  return levelIndex === 0 && dialFor(levelIndex, weaponsOffered) < MULTI_HIT_DIAL;
}

/**
 * The health a body of `base` health has on a given tier — at least one, always.
 *
 * ⚠️ **A function rather than a multiply at every call site.** There are three of them (an enemy, a
 * boss, and whatever the next thing that can be shot turns out to be), and *"rounded up, floored at
 * one"* stated three times is the shape of second description this project has already paid for.
 * It allocates nothing and is called at spawn, never per step.
 */
export function toughnessFor(base: number, tier: DifficultyRow): number {
  return Math.max(1, Math.ceil(base * tier.toughness));
}

/**
 * The steps between shots a body with a `base` gap has on a given tier.
 *
 * Floored for the same reason `toughnessFor` is floored: a gap of zero is a body that fires every
 * step forever, which is not a hard tier but a broken one. The floor is one grid unit rather than
 * one step, because a cadence off the grid is the thing this function exists to prevent.
 *
 * ⚠️ **SNAPPED, AND THIS IS THE STEP THAT WOULD OTHERWISE UNDO THE WHOLE DECISION** —
 * `docs/decisions/0096-the-enemies-play-along.md`. Every cadence in `src/content/enemies.ts` and
 * `src/content/bosses.ts` is authored on the grid and guarded there; **0.7 of a grid value is not a
 * grid value**, so a tier would take content that was carefully in time and put all of it back off
 * the beat. There is exactly one multiplier in the game and this is it.
 *
 * ⚠️ **The ladder compresses at the fast end on the harder tiers, and that is accepted rather than
 * missed.** Two late boss phases can land on the same grid position once multiplied — 0096 has the
 * table — because the grid is 100ms and the phases are 30 steps apart before scaling.
 * `tests/level.test.ts` holds *never slower than the phase before, and the last strictly faster than
 * the first* rather than strict monotonicity at every rung of every tier.
 */
export function fireGapFor(base: number, tier: DifficultyRow): number {
  return onFireGrid(base * tier.fireGap);
}
