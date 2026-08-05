/**
 * The whole state, and the reducer that ROUTES.
 *
 * `docs/decisions/0017-the-state-is-slices.md`: the root composes slices and dispatches to them, and
 * **holds no `case` arms**. The moment it starts deciding things itself it becomes the one file every
 * feature has a reason to touch, which is the 127-case reducer that decision was written about.
 *
 * ⚠️ **`tests/state-shape.test.ts` counts `case ` in this file and requires zero.** That is a
 * mechanical check over a structural rule, and the structural rule is the one below: a decision that
 * belongs to one slice's state goes in that slice. What is left here is routing, and one agreement.
 */

import { type ScreenAction, type ScreenState, initialScreen, reduceScreen } from './slices/screen.ts';
import { type RunAction, type RunState, initialRun, reduceRun } from './slices/run.ts';

/** Every slice. Closed — a new one fails `State` to build until it has been given a shape below. */
export type SliceName = 'screen' | 'run';

/** What each slice holds. The one place a slice name is tied to its type. */
interface SliceState {
  screen: ScreenState;
  run: RunState;
}

/**
 * The state, as a `Record` over `SliceName` — 0017's shape, written as a mapped type so the two
 * cannot drift. Adding a member to `SliceName` fails to build until `SliceState` answers for it.
 */
export type State = { readonly [K in SliceName]: SliceState[K] };

/** Every action in the game. Each names its slice, which is what makes routing a lookup. */
export type Action = ScreenAction | RunAction;

export const initialState: State = { screen: initialScreen, run: initialRun };

/**
 * Route an action to the slice that owns it, then let the one cross-slice agreement have its say.
 *
 * ⚠️ **An `if` per slice rather than a `switch`, and that is not a way around the guard.** The ban
 * is on the root *deciding*; what these lines do is hand an action to its owner. Each one narrows on
 * `action.slice`, so the slice reducer receives exactly its own action type with no cast anywhere —
 * `docs/decisions/0016-a-hub-enumerates-kinds.md` bans both the escape hatches a cleverer routing
 * table would need, and buying brevity with either would spend the thing that makes this safe.
 *
 * Identity is preserved when a slice returns its own state, so a caller can compare states by
 * reference to know whether anything moved.
 */
export function reduce(state: State, action: Action): State {
  if (action.slice === 'screen') {
    const screen = reduceScreen(state.screen, action);
    return agree(screen === state.screen ? state : { screen, run: state.run });
  }
  const run = reduceRun(state.run, action);
  return agree(run === state.run ? state : { screen: state.screen, run });
}

/** The one action the agreement below needs. Module-level, so routing allocates nothing extra. */
const SHOW_GAME_OVER: ScreenAction = { slice: 'screen', type: 'show', screen: 'gameOver' };

/**
 * THE ONE AGREEMENT BETWEEN TWO SLICES, and it is deliberately here rather than in either of them.
 *
 * A run with no lives left is over, and the screen has to say so. `run` cannot import `screen` and
 * `screen` cannot import `run` — 0017's sibling ban — so this is the sanctioned place, where it is
 * one visible line instead of a hidden coupling inside whichever slice happened to be edited first.
 *
 * ⚠️ **Conditioned on `playing`, so it cannot fight the shell.** Without that, every action
 * dispatched while the game-over screen is up would re-assert it, and a `begin` — which stocks three
 * lives — would be immediately overwritten by a stale reading of a state that no longer holds.
 */
function agree(state: State): State {
  if (state.run.lives > 0 || state.screen.current !== 'playing') return state;
  return { screen: reduceScreen(state.screen, SHOW_GAME_OVER), run: state.run };
}
