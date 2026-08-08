/**
 * The run: how many lives are left, how deep it has got, and what the ship is carrying.
 *
 * `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md` is the whole of what this
 * file decides; the reasoning is there and is not repeated here, per
 * `docs/decisions/0029-the-tracked-record-is-the-record.md`.
 *
 * ⚠️ **Plain data, because this is the thing `save/` will serialise** — no `Map`, no `Set`, no class
 * instance. `tests/state-shape.test.ts` holds it, and the reason it is worth a guard is that a `Map`
 * survives `structuredClone` and comes back from `JSON.parse(JSON.stringify(…))` as `{}` with no
 * error anywhere.
 */

import { SPECIALS, type SpecialKind } from '../../content/specials.ts';
import { type UpgradeKind } from '../../content/pickups.ts';
import { DIFFICULTIES, type DifficultyKind } from '../../content/difficulty.ts';

/**
 * The tier a run that has not begun is carrying.
 *
 * ⚠️ **`begin` always sets one, so nothing reads this except a state nobody is playing.** It is the
 * middle tier because that is the one the game is tuned for — a default that is a real answer,
 * rather than a sentinel that would have to be checked for.
 */
export const DEFAULT_DIFFICULTY: DifficultyKind = 'savior';

/**
 * Lives a run starts with, on a given tier.
 *
 * ⚠️ **`STARTING_LIVES` was the single description of this and is now a column in
 * `src/content/difficulty.ts`.** 0039 put the number in the same category as `SHIP_SPEED` — placed
 * by a hand, settled by playing — and that is still true of each of the three; what has changed is
 * that there are three of them and a tier is what picks one.
 * `docs/decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md`.
 *
 * Nothing may assert on the values. What the tests hold are the relationships that must be true at
 * any value.
 */
export function livesFor(difficulty: DifficultyKind): number {
  return DIFFICULTIES[difficulty].lives;
}

/**
 * One owned special, and how many uses are left of it.
 *
 * ⚠️ **A LIST OF ENTRIES rather than a list of kinds, and the difference is the binding table.**
 * `src/content/actions.ts` says `special1` and `special2` are POSITIONS in this list, one trigger
 * per owned weapon — so charges cannot be repeated entries, or a player carrying three bombs would
 * have the same weapon on three triggers and the third would be unreachable.
 *
 * ⚠️ **Plain data, because this is what `save/` serialises** (0039). Two fields, both numbers or
 * strings, no class and no `Map` — `tests/state-shape.test.ts` is the guard.
 */
export interface ArsenalEntry {
  kind: SpecialKind;
  /** Uses left. An owned weapon at zero is still owned, and still holds its trigger. */
  charges: number;
}

/**
 * What a run — or a life — begins with.
 *
 * ⚠️ **This is 0039's *"back to the ship's base weapon and starting special"* finally cashing.** The
 * reducer used to clear the arsenal to `[]` on a death, because there was no starting special for it
 * to go back to; there is one now, and the ask names its size: *"the player starts with 2."*
 *
 * ⚠️ **A function rather than a constant**, so nothing can hold a reference to the array a run is
 * using and mutate the next run's starting kit through it.
 */
export function startingArsenal(): readonly ArsenalEntry[] {
  return [{ kind: 'bomb', charges: SPECIALS.bomb.charges }];
}

export interface RunState {
  /**
   * How hard this run is, chosen before it started and fixed for its length.
   *
   * ⚠️ **On the RUN, because it is a property of the run and because `save/` has to store it.** A
   * saved run resumed at a different tier would be a different run, and the resume
   * (`docs/game.md`) is explicitly an interruption hedge rather than a second chance.
   *
   * ⚠️ **Not on `Assists`, and it never may be.**
   * `docs/decisions/0024-the-accessibility-floor-is-settings.md` closes that ladder with *no assist
   * may ever make the game harder*, which makes two of these three tiers unrepresentable there.
   */
  difficulty: DifficultyKind;
  /** Lives left. A death spends one; at zero the run is over. */
  lives: number;
  /** Which level, zero-based. */
  level: number;
  /**
   * What the ship is carrying beyond its base weapon, in the order it was taken.
   *
   * ⚠️ **A LIST, and empty until something authors a special worth picking up.** `docs/game.md`
   * calls this a code constraint rather than a flourish: *"a ship modelled with one special field,
   * an input layer with one special binding, or a save storing one special kind each independently
   * make a second special a rewrite instead of a pickup."* The input half already refuses the
   * mistake — `src/content/actions.ts` says `special1` and `special2` are POSITIONS in this list and
   * not weapon kinds. This is the state half.
   */
  arsenal: readonly ArsenalEntry[];
  /**
   * Auto-fire upgrades, in the order they were taken.
   *
   * ⚠️ **A LIST rather than a tier, for the same reason the arsenal is** — and this is where that
   * shape stops being an argument and starts being used. `src/content/pickups.ts` resolves the whole
   * list into a weapon every time it changes, so *"two rapids and a spread"* is a statement the save
   * can hold and the reducer can compare. A running `fireEvery` on the run would be a number nobody
   * could undo, and a death has to undo it.
   */
  upgrades: readonly UpgradeKind[];
}

export type RunAction =
  | { slice: 'run'; type: 'begin'; difficulty: DifficultyKind }
  | { slice: 'run'; type: 'continued' }
  | { slice: 'run'; type: 'lifeLost' }
  | { slice: 'run'; type: 'took'; special: SpecialKind }
  | { slice: 'run'; type: 'spent'; slot: number }
  | { slice: 'run'; type: 'upgraded'; upgrade: UpgradeKind }
  | { slice: 'run'; type: 'levelCleared' };

/**
 * No run in progress.
 *
 * ⚠️ **Zero lives rather than three**, which is what makes `begin` the only way into a run: a state
 * that is already stocked would let a reload or a stray dispatch drop the player into a half-run
 * whose level and arsenal came from nowhere.
 */
export const initialRun: RunState = {
  lives: 0,
  level: 0,
  arsenal: [],
  upgrades: [],
  difficulty: DEFAULT_DIFFICULTY,
};

export function reduceRun(state: RunState, action: RunAction): RunState {
  switch (action.type) {
    case 'begin':
      return {
        lives: livesFor(action.difficulty),
        level: 0,
        arsenal: startingArsenal(),
        upgrades: [],
        difficulty: action.difficulty,
      };
    case 'continued':
      /*
        A CONTINUE — `docs/decisions/0068-a-run-over-is-a-continue.md`.

        ⚠️ **`begin` with the level left alone, and that single difference is the whole feature.** A
        run that ran out of lives is picked up where it stopped: the level index does not move, so
        the shell has nothing to re-enter and the field carries on underneath. Everything else goes
        back to what a run starts with — the tier's full complement, the starting kit, and no
        upgrades, which is 0039's *a death costs the arsenal* applied one more time rather than
        forgiven.

        ⚠️ **The tier is carried, never re-chosen.** It is a property of the run
        (`docs/decisions/0047-…`), and this is still the same run — a continue that dropped the
        player onto the middle tier because that is the default would be the game quietly changing
        the game.

        ⚠️ **Not conditioned on the lives being zero.** The reducer is not the place to find out
        whether the shell asked at a sensible moment, on the same terms `lifeLost` and `spent` give
        for clamping rather than throwing. Nothing but the run-over screen dispatches it, and the
        run-over screen is the only screen a run with no lives can be on —
        `src/state/root.ts` holds that as an agreement.
      */
      return {
        lives: livesFor(state.difficulty),
        level: state.level,
        arsenal: startingArsenal(),
        upgrades: [],
        difficulty: state.difficulty,
      };
    case 'lifeLost':
      /*
        ⚠️ **The arsenal is cleared on EVERY death, including the last one.** It reads as redundant —
        the run is over, nobody will fly that ship again — and it is what keeps this reducer a
        function of its arguments rather than of what the shell does next. A `lifeLost` that
        sometimes clears and sometimes does not is a rule with a hidden condition, and the condition
        would be "did the caller intend to keep playing", which is not a thing state can know.

        ⚠️ **Clamped at zero, never below.** Nothing should dispatch this at zero lives, and the
        reducer is not the place to find out whether anything did: a negative life count would
        propagate silently into the save schema and into whatever renders a life counter.
      */
      /*
        ⚠️ **The UPGRADES go too, and that is `docs/decisions/0039-…`'s rule reaching the field it
        was written about before that field existed.** It says a death clears the arsenal *"back to
        the ship's base weapon and starting special"* — the base weapon is exactly what an empty
        upgrade list resolves to, so this line and `weaponFor` between them mean there is no second
        description anywhere of what the ship shoots when it has nothing.
      */
      /*
        ⚠️ **The arsenal goes back to the STARTING kit rather than to nothing**, which is what 0039
        actually says: *"back to the ship's base weapon and starting special."* An empty list was the
        placeholder for a game with no starting special in it. What a death costs is therefore
        everything EARNED — the charges banked from clearing levels — and never the thing the ship
        came with, which would leave a player who died with the tier's hardest stretch and no answer
        to it at all.
      */
      return state.lives <= 0
        ? state
        : {
            lives: state.lives - 1,
            level: state.level,
            arsenal: startingArsenal(),
            upgrades: [],
            difficulty: state.difficulty,
          };
    case 'took': {
      /*
        ⚠️ **A special already owned gains CHARGES rather than a second trigger.** `docs/game.md`
        says one trigger per owned weapon; a second entry of the same kind would put the same weapon
        on two buttons and, past the binding budget, on none.
      */
      const owned = state.arsenal.findIndex((entry) => entry.kind === action.special);
      const added = SPECIALS[action.special].charges;
      const arsenal =
        owned >= 0
          ? state.arsenal.map((entry, i) => (i === owned ? { kind: entry.kind, charges: entry.charges + added } : entry))
          : [...state.arsenal, { kind: action.special, charges: added }];
      return {
        lives: state.lives,
        level: state.level,
        arsenal,
        upgrades: state.upgrades,
        difficulty: state.difficulty,
      };
    }
    case 'spent': {
      /*
        ⚠️ **An entry at zero is KEPT.** The weapon is still owned — it holds its trigger, it appears
        in the readout, and the next thing that grants charges finds it. Removing it would shuffle
        every trigger below it, so spending the last bomb would silently rebind the player's buttons.

        ⚠️ **Clamped at zero, and a slot nobody owns is a no-op**, on the same terms `lifeLost` is
        clamped: the reducer is not the place to find out whether the shell asked for something
        impossible, and a negative charge count would reach the save and the readout.
      */
      const entry = state.arsenal[action.slot];
      if (entry === undefined || entry.charges <= 0) return state;
      return {
        lives: state.lives,
        level: state.level,
        arsenal: state.arsenal.map((e, i) => (i === action.slot ? { kind: e.kind, charges: e.charges - 1 } : e)),
        upgrades: state.upgrades,
        difficulty: state.difficulty,
      };
    }
    /*
      ── `gainedLife` WAS HERE, AND ITS REMOVAL IS THE LOUDEST THING IN 0082 ────────────────────────

      It added one to `lives` with no ceiling, on the grounds that *a level author decides how many
      are findable* — `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md`'s
      replacement for lives that refill at a level boundary.

      ⚠️ **`docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md` took the extra life off the
      field**, on the ask's own reasoning: *"a shield is an extra life anyway and it's far more game
      impactful and meaningful."* It is — a shield stops the death happening, so it also keeps the
      arsenal a death would cost. **But nothing grants a life any more, so a run's complement can only
      go down**, and 0039's replacement now has nothing behind it.

      ⚠️ **Deleted rather than left dispatchable, and that is the honest half.** An action nothing
      sends is a rule nobody can test — `src/content/specials.ts` argues exactly this about `took`,
      which had been in that state since 0039 and is only now cashed. Leaving a door ajar for a life
      source that does not exist would make this reducer describe a game that is not being played.

      ⚠️ **What makes it survivable today is `docs/decisions/0068-a-run-over-is-a-continue.md`'s free
      continue**, which is deliberate and temporary. The day that stops being free is the day this
      needs an answer, and 0082 says so rather than leaving it to be rediscovered.
    */
    case 'upgraded':
      return {
        lives: state.lives,
        level: state.level,
        arsenal: state.arsenal,
        upgrades: [...state.upgrades, action.upgrade],
        difficulty: state.difficulty,
      };
    case 'levelCleared':
      /*
        ⚠️ **Lives and arsenal are untouched, and that is the whole of what "carry forward" means.**
        `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md` amended `docs/game.md`
        to say upgrades cross a LEVEL boundary and not a death, and this line is the level boundary.
        A clear that reset anything would be the death rule wearing the wrong name.
      */
      /*
        ⚠️ **Every owned special gains a charge**, which is the ask — *"gains one per level cleared"* —
        stated as a rule about the arsenal rather than about the bomb. A second special added later
        inherits it without anybody remembering to, which is the whole reason the arsenal is a list.
      */
      return {
        lives: state.lives,
        level: state.level + 1,
        arsenal: state.arsenal.map((entry) => ({ kind: entry.kind, charges: entry.charges + 1 })),
        upgrades: state.upgrades,
        difficulty: state.difficulty,
      };
    default: {
      // Adding a member to `RunAction` fails to compile HERE, per
      // `docs/decisions/0016-a-hub-enumerates-kinds.md`'s fifth defeat.
      const unhandled: never = action;
      return unhandled;
    }
  }
}
