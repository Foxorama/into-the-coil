/**
 * Where the player is. One slice, one fact.
 *
 * `docs/decisions/0017-the-state-is-slices.md`: a slice owns its state type, its initial value, its
 * actions and its reducer, and **cannot import a sibling**. It knows nothing about the run — that a
 * run ending should show `gameOver` is an agreement between two slices, and an agreement lives in
 * `src/state/root.ts` where it is one visible line.
 */

import { type Screen } from '../screens.ts';

export interface ScreenState {
  current: Screen;
}

/**
 * ⚠️ **Every action names its slice**, per 0017, so the root dispatches by looking the slice up
 * rather than by switching over action names — which is what stops the root from growing the
 * 127-case reducer the decision was written about.
 */
export type ScreenAction = { slice: 'screen'; type: 'show'; screen: Screen };

/** A run that has not started yet. The game opens on the title screen and waits. */
export const initialScreen: ScreenState = { current: 'title' };

export function reduceScreen(state: ScreenState, action: ScreenAction): ScreenState {
  switch (action.type) {
    case 'show':
      // Identity preserved when nothing moved, so the shell can tell a real transition from a
      // repeated dispatch without comparing fields.
      return state.current === action.screen ? state : { current: action.screen };
    default: {
      // Adding a member to `ScreenAction` fails to compile HERE, per
      // `docs/decisions/0016-a-hub-enumerates-kinds.md`'s fifth defeat.
      const unhandled: never = action.type;
      return unhandled;
    }
  }
}
