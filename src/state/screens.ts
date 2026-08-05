/**
 * The screens, and what each one is.
 *
 * `docs/decisions/0017-the-state-is-slices.md` names this file: the `Screen` union lives one level
 * above `slices/`, which is the sanctioned place for a shape two slices must agree on without either
 * importing the other.
 *
 * ⚠️ **A row, not a bare union**, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. The
 * alternative — a union plus a `switch` in the shell deciding what each screen shows and whether the
 * game is running — puts the same three facts in three places and lets them drift. Here, adding a
 * screen is one row, and the compiler produces the list of what is owed.
 *
 * ⚠️ **`steps` is the load-bearing field and it is state, not chrome.** It is what stops the
 * simulation behind a game-over overlay. `src/app/mount.ts` already learned this lesson once for the
 * rotate gate, where the comment reads *"it stops the SIMULATION, it does not cover it"* — an
 * overlay above a running game loses the run to something the player cannot see.
 */

import { GAME_TITLE } from '../brand.ts';

/** Every screen, in no particular order — nothing indexes this list by position. Closed. */
export const SCREEN_KINDS = ['title', 'playing', 'gameOver'] as const;

/**
 * Where the player is. Derived from the list, so a screen cannot exist in the union and be missing
 * from the table — the incident that argues for deriving is in `src/content/sprites.ts`.
 */
export type Screen = (typeof SCREEN_KINDS)[number];

export interface ScreenRow {
  /**
   * The one line of chrome. Terse, per `docs/game.md`'s voice rule: *no explanatory commentary, no
   * restating what the screen already shows.*
   */
  heading: string;
  /** What the one control says, or `null` for a screen the player does not act on. */
  action: string | null;
  /**
   * Whether the simulation steps while this screen is up.
   *
   * ⚠️ **`playing` and nothing else.** A title screen over a live game is an attract mode, which is
   * a feature nobody asked for and a way to be killed before pressing start; a game-over screen over
   * a live game keeps spawning enemies at a corpse. Both are the same bug, and the field is what
   * makes it one answer rather than two.
   */
  steps: boolean;
}

export const SCREENS: Record<Screen, ScreenRow> = {
  /**
   * ⚠️ **The game no longer starts by itself, and that is a deliberate loss.** Until now the page
   * loaded straight into a moving scene, which was right for something proving the page draws and is
   * wrong for a game with a run in it: a run that began before the player's hands were on the keys
   * has already spent some of their three lives.
   */
  // ⚠️ The heading is `GAME_TITLE`, never a literal — `docs/decisions/0002-brand-identity-contract.md`
  // puts every user-facing spelling of the name in `src/brand.ts`, and this is the first screen in
  // the game that says it out loud.
  title: { heading: GAME_TITLE, action: 'Start', steps: false },
  playing: { heading: '', action: null, steps: true },
  /**
   * ⚠️ **No score, no summary, no coaching.** `docs/game.md`: *players are assumed to be adaptable;
   * hints are added where play proves they are needed, never pre-emptively.* What the player needs to
   * know is that the run ended and how to start another one, and the frozen scene behind this says
   * everything about why —
   * `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`.
   */
  gameOver: { heading: 'Run over', action: 'Again', steps: false },
};
