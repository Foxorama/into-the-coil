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
    fireGap: 0.7,
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
 * The steps between shots a body with a `base` gap has on a given tier — at least one.
 *
 * Floored at one for the same reason `toughnessFor` is floored: a gap of zero is a body that fires
 * every step forever, which is not a hard tier but a broken one.
 */
export function fireGapFor(base: number, tier: DifficultyRow): number {
  return Math.max(1, Math.round(base * tier.fireGap));
}
