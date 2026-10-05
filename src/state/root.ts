/**
 * The whole state, and the reducer that ROUTES.
 *
 * `docs/decisions/0017-the-state-is-slices.md`: the root composes slices and dispatches to them, and
 * **holds no `case` arms**. The moment it starts deciding things itself it becomes the one file every
 * feature has a reason to touch, which is the 127-case reducer that decision was written about.
 *
 * ⚠️ **`tests/state-shape.test.ts` counts `case ` in this file and requires zero.** That is a
 * mechanical check over a structural rule, and the structural rule is the one below: a decision that
 * belongs to one slice's state goes in that slice. What is left here is routing, and two agreements.
 */

import { type ScreenAction, type ScreenState, initialScreen, reduceScreen } from './slices/screen.ts';
import { type RunAction, type RunState, initialRun, reduceRun } from './slices/run.ts';
import {
  type SettingsAction,
  type SettingsState,
  initialSettings,
  reduceSettings,
} from './slices/settings.ts';
import { type HangarAction, type HangarState, initialHangar, reduceHangar } from './slices/hangar.ts';
import { LEVEL_KINDS } from '../content/levels.ts';
import { CREDITS } from '../content/credits.ts';

/** Every slice. Closed — a new one fails `State` to build until it has been given a shape below. */
// 0521: and the hangar, which outlives every run as the settings do.
export type SliceName = 'screen' | 'run' | 'settings' | 'hangar';

/** What each slice holds. The one place a slice name is tied to its type. */
interface SliceState {
  screen: ScreenState;
  run: RunState;
  settings: SettingsState;
  hangar: HangarState;
}

/**
 * The state, as a `Record` over `SliceName` — 0017's shape, written as a mapped type so the two
 * cannot drift. Adding a member to `SliceName` fails to build until `SliceState` answers for it.
 */
export type State = { readonly [K in SliceName]: SliceState[K] };

/** Every action in the game. Each names its slice, which is what makes routing a lookup. */
export type Action = ScreenAction | RunAction | SettingsAction | HangarAction;

export const initialState: State = {
  screen: initialScreen,
  run: initialRun,
  settings: initialSettings,
  hangar: initialHangar,
};

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
    return agree(screen === state.screen ? state : { ...state, screen });
  }
  /*
    ⚠️ **The settings slice takes part in NO agreement, and that is the point of it.** What a run is
    doing and what the game looks like are independent by construction — `agree` below never reads
    it, so a style change can never move a screen and a screen can never change a style.
    `docs/decisions/0070-a-style-is-a-setting-and-the-first-one.md`.
  */
  if (action.slice === 'settings') {
    const settings = reduceSettings(state.settings, action);
    return settings === state.settings ? state : { ...state, settings };
  }
  // 0521: the hangar takes part in an agreement only as its subject — a run finished wins its ship —
  // so a fitting changed between runs can move no screen and no run, on the settings' terms above.
  if (action.slice === 'hangar') {
    const hangar = reduceHangar(state.hangar, action);
    return hangar === state.hangar ? state : { ...state, hangar };
  }
  const run = reduceRun(state.run, action);
  return agree(run === state.run ? state : { ...state, run });
}

/** The actions the agreements below need. Module-level, so routing allocates nothing extra. */
const SHOW_GAME_OVER: ScreenAction = { slice: 'screen', type: 'show', screen: 'gameOver' };
// A run with no credit left to offer ends on its account — 0517.
const SHOW_ENDED: ScreenAction = { slice: 'screen', type: 'show', screen: 'ended' };
// The run finished goes to the finale, which expires into the victory screen — 0418.
const SHOW_FINALE: ScreenAction = { slice: 'screen', type: 'show', screen: 'outro' };

/**
 * THE AGREEMENTS BETWEEN TWO SLICES, deliberately here rather than in either of them.
 *
 * A run with no lives left is over, and the screen has to say so. `run` cannot import `screen` and
 * `screen` cannot import `run` — 0017's sibling ban — so this is the sanctioned place, where it is
 * one visible line instead of a hidden coupling inside whichever slice happened to be edited first.
 *
 * ⚠️ **Conditioned on `playing`, so it cannot fight the shell.** Without that, every action
 * dispatched while the game-over screen is up would re-assert it, and a `begin` — which stocks three
 * lives — would be immediately overwritten by a stale reading of a state that no longer holds.
 *
 * ⚠️ **WHICH SCREEN IS THE RUN'S CREDITS', READ OFF THE RUN — 0517.** Freeplay offers the continue
 * (0068); no quarters ends the run on the game-over screen. The run carries the choice because `begin`
 * copied it there, so this still never reads the settings slice.
 */
function agree(state: State): State {
  if (state.run.lives <= 0 && state.screen.current === 'playing') {
    const over = CREDITS[state.run.credits].continues ? SHOW_GAME_OVER : SHOW_ENDED;
    return { ...state, screen: reduceScreen(state.screen, over) };
  }
  /*
    THE SECOND AGREEMENT: a level cleared past the end of the run is the run finished.

    ⚠️ **Here rather than in the shell, so the rule can be tested without a browser.** The first
    version asked `state.run.level < LEVEL_KINDS.length` inside `src/app/mount.ts` and dispatched one
    screen or the other — correct, and reachable only by mounting a canvas. The distinction between
    *a level ended* and *a run ended* is exactly the sort of thing that gets quietly inverted, and
    `docs/decisions/0015-the-layer-ladder.md` gives this layer no capabilities precisely so rules
    like it can be played out in a unit test.
  */
  /*
    ⚠️ **AND THE RUN FINISHED IS ITS SHIP WON — 0521**, at the same moment and for the same reason it
    is here: *"when you beat the jellyfish with a pilot and ship you unlock that ship."* The finale's
    opening is the jellyfish beaten, so a page closed during the finale has still won; the victory
    screen nineteen seconds later would have lost it. The run's ship, read off the run, so a pilot
    changed on the title afterwards cannot move which ship was won in.
  */
  if (state.screen.current === 'cleared' && state.run.level >= LEVEL_KINDS.length) {
    const hangar = reduceHangar(state.hangar, { slice: 'hangar', type: 'won', ship: state.run.ship });
    return { ...state, screen: reduceScreen(state.screen, SHOW_FINALE), hangar };
  }
  return state;
}
