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
export const SCREEN_KINDS = ['title', 'playing', 'gameOver', 'cleared', 'victory'] as const;

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
  /**
   * What the controls say, in the order they appear. Empty for a screen the player does not act on.
   *
   * ⚠️ **A LIST and not one nullable label, and the reason is the same one `docs/game.md` gives for
   * the arsenal being a list rather than a slot.** Every screen has exactly one control today; a
   * screen with a choice on it — which difficulty, which destination on the chart — is a screen this
   * shape already fits, and `src/app/chrome.ts`'s focus ring is only meaningful over a list.
   * `docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md`.
   */
  actions: readonly string[];
  /**
   * Whether the simulation steps while this screen is up.
   *
   * ⚠️ **`playing` and nothing else.** A title screen over a live game is an attract mode, which is
   * a feature nobody asked for and a way to be killed before pressing start; a game-over screen over
   * a live game keeps spawning enemies at a corpse. Both are the same bug, and the field is what
   * makes it one answer rather than two.
   */
  steps: boolean;
  /**
   * What happens if the player does nothing at all, and after how many fixed steps.
   *
   * ⚠️ **One nullable object rather than two fields, so "a timeout with nowhere to go" cannot be
   * written.** A duration and a destination are meaningless apart.
   *
   * ⚠️ **Counted in STEPS, not in milliseconds**, because the step is fixed at 60Hz
   * (`docs/decisions/0022-frame-rate-is-a-feature.md`) and a screen that is not stepping the
   * simulation is still being stepped by the loop. A wall-clock timer here would be the one thing on
   * these screens that runs at display rate, and it would drift on a throttled tab.
   * `src/content/ships.ts` counts `INVULN_STEPS` the same way, for the same reason.
   */
  timeout: { steps: number; then: Screen } | null;
}

/**
 * Fixed steps in a second, at the 60Hz `docs/decisions/0022-frame-rate-is-a-feature.md` fixes.
 *
 * ⚠️ **Exported, because the shell has to turn a step count back into the number it shows the
 * player** — and two spellings of "sixty" is the shape of second description
 * `tests/one-description.test.ts` exists for. It is not imported from `src/app/loop.ts` because the
 * arrow runs the other way: `docs/decisions/0015-the-layer-ladder.md` puts `state` above `app`'s
 * reach, so the rate is stated here and the shell reads it.
 */
export const STEPS_PER_SECOND = 60;

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
  title: { heading: GAME_TITLE, actions: ['Start'], steps: false, timeout: null },
  playing: { heading: '', actions: [], steps: true, timeout: null },
  /**
   * ⚠️ **No score, no summary, no coaching.** `docs/game.md`: *players are assumed to be adaptable;
   * hints are added where play proves they are needed, never pre-emptively.* What the player needs to
   * know is that the run ended and how to start another one, and the frozen scene behind this says
   * everything about why —
   * `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`.
   */
  /*
   * ⚠️ **The one screen with a timeout, and it was asked for in play**: *"this screen should have a
   * 7 second countdown; when it expires, the player is returned to the title screen."*
   *
   * It is the right screen for it and the only one. `cleared` and `victory` both sit on top of
   * something the player earned and would be rude to take away; `title` is where a player who has
   * walked away should end up, because it is the screen that says what the game is
   * (`docs/decisions/0045-the-player-can-see-what-they-are-carrying.md` put the pickup key there).
   * An arcade cabinet does exactly this and for exactly this reason.
   */
  gameOver: {
    heading: 'Run over',
    actions: ['Again'],
    steps: false,
    timeout: { steps: 7 * STEPS_PER_SECOND, then: 'title' },
  },
  /**
   * The boss is dead and there is another level behind it.
   *
   * ⚠️ **"Onward" now, and it said "Again" when there was one level** — a screen that offered to
   * continue when there was nowhere to go would have been a promise the build could not keep. This is
   * where the chart will eventually go: `docs/game.md` puts a branching map of destinations between
   * levels, and a button is what a straight line looks like —
   * `docs/decisions/0042-a-run-is-a-sequence-of-levels.md`.
   */
  cleared: { heading: 'Level clear', actions: ['Onward'], steps: false, timeout: null },
  /**
   * Every level in the run is behind the player.
   *
   * ⚠️ **A separate screen rather than `cleared` with different words**, because they are different
   * events: one carries a run forward and the other ends it. `docs/game.md` puts eight levels and a
   * final boss at the end of a run; two of them exist, so this is the end of what has been authored
   * rather than the end of the game — and the wording says only what is true.
   */
  victory: { heading: 'Coil cleared', actions: ['Again'], steps: false, timeout: null },
};
