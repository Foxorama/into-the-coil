/**
 * Where the player is. One slice, one fact.
 *
 * `docs/decisions/0017-the-state-is-slices.md`: a slice owns its state type, its initial value, its
 * actions and its reducer, and **cannot import a sibling**. It knows nothing about the run — that a
 * run ending should show `gameOver` is an agreement between two slices, and an agreement lives in
 * `src/state/root.ts` where it is one visible line.
 */

import { SCREENS, type Screen } from '../screens.ts';

export interface ScreenState {
  current: Screen;
  /**
   * The screen that opened the menu the player is in — 0458. Where a row's `back: 'opener'` goes.
   *
   * ⚠️ **RECORDED ON THE WAY IN, FROM A SCREEN WITH NO WAY BACK OF ITS OWN.** Settings opens the music
   * room and the music room comes back to Settings; were the opener rewritten on every move, Back from
   * Settings after a visit to the room would go to the room. A screen that has a `back` is inside a
   * menu, and one that has none — the title, a paused run — is what a menu was opened from.
   */
  opener: Screen;
}

/**
 * ⚠️ **Every action names its slice**, per 0017, so the root dispatches by looking the slice up
 * rather than by switching over action names — which is what stops the root from growing the
 * 127-case reducer the decision was written about.
 */
export type ScreenAction = { slice: 'screen'; type: 'show'; screen: Screen };

/**
 * A run that has not started yet. The game opens on the splash, which gives way to the golfers once it
 * has loaded; picking one plays the intro, which hands over to the title by itself —
 * `docs/decisions/0415-the-golfer-is-chosen.md`, 0411 — and the title waits.
 */
export const initialScreen: ScreenState = { current: 'splash', opener: 'title' };

export function reduceScreen(state: ScreenState, action: ScreenAction): ScreenState {
  switch (action.type) {
    case 'show': {
      // Identity preserved when nothing moved, so the shell can tell a real transition from a
      // repeated dispatch without comparing fields.
      if (state.current === action.screen) return state;
      /*
        ⚠️ **FROM OUTSIDE THE MENU, WHICH WAS *A SCREEN WITH NO BACK* UNTIL ONE HAD A BACK — 0511.** The
        pause's Back is the count-in, and the pause opens Settings; read as *no back of its own*, it was
        not an opener, and Back from Settings would have gone to the title with the run still held.
        Inside the menu is a screen that goes back to an opener-row (the music room to Settings) or is
        one (How to play beside Settings); anything else opened it.
      */
      const from = SCREENS[state.current].back;
      const inside = from === 'opener' || (from !== null && SCREENS[from].back === 'opener');
      const entering = SCREENS[action.screen].back === 'opener' && !inside;
      return { current: action.screen, opener: entering ? state.current : state.opener };
    }
    default: {
      // Adding a member to `ScreenAction` fails to compile HERE, per
      // `docs/decisions/0016-a-hub-enumerates-kinds.md`'s fifth defeat.
      const unhandled: never = action.type;
      return unhandled;
    }
  }
}
