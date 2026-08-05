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

import { type SpecialKind } from '../../content/specials.ts';

/**
 * Lives a run starts with.
 *
 * ⚠️ **A play-test number, not a decided one** — 0039 puts it in the same category as `SHIP_SPEED`
 * and `SCROLL_PER_STEP`, which `docs/decisions/0037-the-ship-has-mass.md` settled by playing rather
 * than by reasoning. Nothing may assert on this value; what the tests hold are the relationships
 * that must be true at any value.
 */
export const STARTING_LIVES = 3;

export interface RunState {
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
  arsenal: readonly SpecialKind[];
}

export type RunAction =
  | { slice: 'run'; type: 'begin' }
  | { slice: 'run'; type: 'lifeLost' }
  | { slice: 'run'; type: 'took'; special: SpecialKind };

/**
 * No run in progress.
 *
 * ⚠️ **Zero lives rather than three**, which is what makes `begin` the only way into a run: a state
 * that is already stocked would let a reload or a stray dispatch drop the player into a half-run
 * whose level and arsenal came from nowhere.
 */
export const initialRun: RunState = { lives: 0, level: 0, arsenal: [] };

export function reduceRun(state: RunState, action: RunAction): RunState {
  switch (action.type) {
    case 'begin':
      return { lives: STARTING_LIVES, level: 0, arsenal: [] };
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
      return state.lives <= 0 ? state : { lives: state.lives - 1, level: state.level, arsenal: [] };
    case 'took':
      return { lives: state.lives, level: state.level, arsenal: [...state.arsenal, action.special] };
    default: {
      // Adding a member to `RunAction` fails to compile HERE, per
      // `docs/decisions/0016-a-hub-enumerates-kinds.md`'s fifth defeat.
      const unhandled: never = action;
      return unhandled;
    }
  }
}
