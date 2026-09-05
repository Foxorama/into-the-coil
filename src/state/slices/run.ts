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
import { UPGRADE_TIERS, afterDeath, tiersOf, type UpgradeKind } from '../../content/pickups.ts';
import { DIFFICULTIES, type DifficultyKind } from '../../content/difficulty.ts';
import { SHIPS } from '../../content/ships.ts';
import type { WeaponKind } from '../../content/weapons.ts';
import type { MissileKind } from '../../content/missiles.ts';

/**
 * The ship a run is flown in, and therefore the kinds an empty run resolves to — 0233.
 *
 * ⚠️ **One ship, named once.** `docs/game.md`'s roster is a table with one row, and the day it has
 * two the run will carry a `ship` field and this becomes `SHIPS[state.ship]`; until then a constant
 * beside the reducer is the honest shape, on `src/content/ships.ts`'s own refusal to invent a
 * roster for content that does not exist.
 */
const BASE_SHIP = SHIPS.proof;

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
 * ⚠️ **A DEATH NO LONGER CALLS THIS** — `docs/decisions/0085-a-death-does-not-cost-the-bombs.md`.
 * Two callers are left and both are a run being stocked rather than a ship being replaced: `begin`
 * and `continued`.
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
  /**
   * Which gun and which tube the upgrades are on — 0233.
   *
   * ⚠️ **In the RUN, beside the list, because the save has to hold them.** A weapon pickup of a
   * kind the ship is not carrying switches the gun, so *which gun* is a thing the list alone cannot
   * say. `docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md`.
   *
   * ⚠️ **A DEATH KEEPS THEM — 0256.** 0233 had `lifeLost` put both back to the ship's base kinds on
   * the line it emptied the list; a death costs a rung now and not the gun, so the kinds are the one
   * thing in this state a death never touches.
   */
  weapon: WeaponKind;
  missile: MissileKind;
}

export type RunAction =
  | { slice: 'run'; type: 'begin'; difficulty: DifficultyKind }
  | { slice: 'run'; type: 'continued' }
  | { slice: 'run'; type: 'lifeLost' }
  | { slice: 'run'; type: 'took'; special: SpecialKind }
  | { slice: 'run'; type: 'spent'; slot: number }
  /*
    ⚠️ **AN UPGRADE NAMES ITS KIND SINCE 0233.** The pickup that was taken was showing one face of
    its ladder, and the face is which gun or which tube it was offering; a reducer that only heard
    *weapon* could not tell a fifth pulse from a first arc.
  */
  /*
    ⚠️ **`count` WAS HERE — 0243's stack, one event for every rung a death threw back — and 0256
    deleted it.** A death throws nothing back now, so every pickup is worth one rung and the field
    would have been a number nothing could ever send but one.
  */
  | { slice: 'run'; type: 'upgraded'; upgrade: 'weapon'; kind: WeaponKind }
  | { slice: 'run'; type: 'upgraded'; upgrade: 'missile'; kind: MissileKind }
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
  weapon: BASE_SHIP.weapon,
  missile: BASE_SHIP.missile,
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
        weapon: BASE_SHIP.weapon,
        missile: BASE_SHIP.missile,
        difficulty: action.difficulty,
      };
    case 'continued':
      /*
        A CONTINUE — `docs/decisions/0068-a-run-over-is-a-continue.md`.

        ⚠️ **`begin` with the level left alone, and that single difference is the whole feature.** A
        run that ran out of lives is picked up where it stopped: the level index does not move, so
        the shell has nothing to re-enter and the field carries on underneath. Everything else goes
        back to what a run starts with — the tier's full complement, the starting kit, and no
        upgrades.

        ⚠️ **AND THE STARTING KIT IS NOW THE ONE THING THIS DOES THAT `lifeLost` DOES NOT** —
        `docs/decisions/0085-a-death-does-not-cost-the-bombs.md`, in the ask's own words: *"bombs
        should be reset on a continue, but not on player death."* Both arms used to restock, so the
        line below was a copy of a line in the arm above it; it is now the difference between the two
        events. It cuts both ways and 0085 says so — a player who reaches the continue screen holding
        five charges is put back to the starting two.

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
        weapon: BASE_SHIP.weapon,
        missile: BASE_SHIP.missile,
        difficulty: state.difficulty,
      };
    case 'lifeLost':
      /*
        ⚠️ **A DEATH COSTS THE UPGRADES AND LEAVES THE ARSENAL ALONE** —
        `docs/decisions/0085-a-death-does-not-cost-the-bombs.md`, reported from play: *"bombs should
        be reset on a continue, but not on player death."* This line used to send the arsenal back to
        `startingArsenal()` on both, and the two are now the two different events they always were: a
        death is a beat inside a run, and a continue is a run being restocked.

        ⚠️ **`state.arsenal` UNTOUCHED, which is a top-up removed as well as a cost.** A player who
        died holding five charges keeps five; a player who died having spent all of them keeps none,
        where the old line handed back the starting two. 0085 has the trade — the charges banked from
        clearing levels are the thing the ask is protecting, and a free restock every death is what
        made them worth nothing.

        ── A DEATH COSTS ONE RUNG PER LADDER, AND THE GUN STAYS — 0256 ──────────────────────────────

        ⚠️ **`upgrades: []` WAS THIS LINE, and it was what was left of
        `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md`** — *"back to the
        ship's base weapon and starting special"*, with 0085 amending the second half and 0066's
        scatter handing the first straight back. Asked for after the first play of the mid-bosses:
        *"a death reduces the power count by 1 (to a minimum of 1)."* `afterDeath` in
        `src/content/pickups.ts` is the single description of the cost; nothing is thrown back,
        because the rung IS the cost. The kinds stay too: a death is a rung, not the gun.

        ⚠️ **Unconditional on EVERY death, including the last one**, exactly as the arsenal clear was:
        a `lifeLost` that behaved differently on the last life would be a rule with a hidden
        condition, and the condition would be *did the caller intend to keep playing*, which is not a
        thing state can know. `continued` is where the answer to that question lives.

        ⚠️ **Clamped at zero, never below.** Nothing should dispatch this at zero lives, and the
        reducer is not the place to find out whether anything did: a negative life count would
        propagate silently into the save schema and into whatever renders a life counter.
      */
      return state.lives <= 0
        ? state
        : {
            lives: state.lives - 1,
            level: state.level,
            arsenal: state.arsenal,
            upgrades: afterDeath(state.upgrades),
            weapon: state.weapon,
            missile: state.missile,
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
        weapon: state.weapon,
        missile: state.missile,
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
        weapon: state.weapon,
        missile: state.missile,
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
    case 'upgraded': {
      /*
        ── A DIFFERENT KIND KEEPS THE COUNT — 0256, amending 0233 ─────────────────────────────────

        0233 started the new gun's ladder again at one rung, on *"they start from level one with
        that weapon upgrade"*. Played with the mid-bosses in: *"picking up a new weapon/missile type
        doesn't reset your power count — it's too punishing when you accidentally get a pickup with
        a lot of enemies on screen or right before a boss."* The ladder is the ship's and the kind is
        what it is fitted to: a pickup of another kind switches the kind and climbs the same ladder,
        so the list never loses an entry here and the hull keeps its tier through a switch.

        ⚠️ **CLAMPED AT THE CAP HERE rather than trusted to `tiersOf`.** A pickup of another kind
        at a full ladder is an upgrade (`effectOf` — the ship changes), and it used to be the one
        way the list could grow past `UPGRADE_TIERS` of a kind; it switches and adds nothing now, so
        the list is the tier and the save holds nothing the ladder cannot read.
      */
      const upgrades = tiersOf(state.upgrades, action.upgrade) < UPGRADE_TIERS ? [...state.upgrades, action.upgrade] : state.upgrades;
      return {
        lives: state.lives,
        level: state.level,
        arsenal: state.arsenal,
        upgrades,
        weapon: action.upgrade === 'weapon' ? action.kind : state.weapon,
        missile: action.upgrade === 'missile' ? action.kind : state.missile,
        difficulty: state.difficulty,
      };
    }
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
        weapon: state.weapon,
        missile: state.missile,
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
