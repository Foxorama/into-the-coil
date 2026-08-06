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
import { DIFFICULTIES, DIFFICULTY_KINDS } from '../content/difficulty.ts';

/** Every screen, in no particular order — nothing indexes this list by position. Closed. */
export const SCREEN_KINDS = ['title', 'playing', 'gameOver', 'cleared', 'victory'] as const;

/**
 * Where the player is. Derived from the list, so a screen cannot exist in the union and be missing
 * from the table — the incident that argues for deriving is in `src/content/sprites.ts`.
 */
export type Screen = (typeof SCREEN_KINDS)[number];

/**
 * One control on a screen.
 *
 * ⚠️ **The hint is on the ROW rather than in the chrome that draws it**, for the reason
 * `src/content/pickups.ts` gives about the title screen's key: a list of explanations living in
 * `src/app/chrome.ts` is a second description of the content, and the day one changes the other goes
 * on saying the old thing. Empty for a control that needs none, which is most of them.
 */
export interface ScreenAction {
  label: string;
  hint: string;
}

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
   * the arsenal being a list rather than a slot.** It was written one release before anything
   * needed it, and the thing that needed it arrived immediately: the title screen is now the
   * difficulty choice —
   * `docs/decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md`.
   * `docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md` has the focus ring that
   * makes a list navigable at all.
   */
  actions: readonly ScreenAction[];
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
   * Whether this screen's chrome HIDES the scene behind it.
   *
   * ── A SECOND FIELD BECAUSE THERE ARE TWO QUESTIONS ──────────────────────────────────────────────
   *
   * ⚠️ **`steps` and `dims` were one thing until a screen wanted them apart.** Every screen with
   * chrome on it stopped the simulation AND painted over the scene, so nothing had ever needed to say
   * which of the two it meant. Reported from play: *"the current pause/level screen interrupts the
   * flow"* — and what the level break wants is the second without the first: a banner over a sky that
   * is still moving. `docs/decisions/0063-a-level-break-is-a-respite.md`.
   *
   * ⚠️ **A dimming screen is also the only kind that shows a countdown**, and that is a relationship
   * rather than tidiness: a screen that has stopped the world owes the player a number saying when it
   * will stop doing that. A banner over a world that never stopped does not, and a countdown on one
   * would be exactly the *restating what the screen already shows* `docs/game.md` bans.
   */
  dims: boolean;
  /**
   * How many fixed steps the player has before the screen acts for them, or `null` for one that waits.
   *
   * ── WHAT EXPIRING MEANS, AND WHY IT NO LONGER NEEDS SAYING ──────────────────────────────────────
   *
   * ⚠️ **A screen that expires PRESSES ITS OWN FIRST CONTROL**, and that is the whole rule. It used
   * to carry a `then: Screen` as well, which was a second description of what the control already
   * did: the run-over screen's *Again* went to the title and its timeout went to the title, and the
   * two agreed only because somebody kept them in step. `docs/decisions/0063-…`.
   *
   * It is also what lets a level break expire into something that is not a screen at all — *Onward*
   * carries the run into the next level, which no `Screen` value could have named.
   *
   * ⚠️ **Counted in STEPS, not in milliseconds**, because the step is fixed at 60Hz
   * (`docs/decisions/0022-frame-rate-is-a-feature.md`) and a screen that is not stepping the
   * simulation is still being stepped by the loop. A wall-clock timer here would be the one thing on
   * these screens that runs at display rate, and it would drift on a throttled tab.
   * `src/content/ships.ts` counts `INVULN_STEPS` the same way, for the same reason.
   */
  timeout: { steps: number } | null;
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
  /*
   * ⚠️ **"Start" is gone, and the three tiers are in its place.** A run cannot begin without a
   * difficulty, so a screen that started one without asking would be choosing for the player — and
   * `docs/decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md` says a tier is a
   * property of the run rather than a setting to be found later.
   *
   * ⚠️ **Built by walking `DIFFICULTY_KINDS`, so the buttons ARE the table.** A tier added to
   * `src/content/difficulty.ts` appears here without anybody remembering to come and add it — the
   * same argument `src/app/chrome.ts` makes for the pickup key being walked rather than listed, and
   * the order is the table's order, which is easiest first.
   */
  title: {
    heading: GAME_TITLE,
    actions: DIFFICULTY_KINDS.map((kind) => ({ label: DIFFICULTIES[kind].title, hint: DIFFICULTIES[kind].hint })),
    steps: false,
    dims: true,
    timeout: null,
  },
  playing: { heading: '', actions: [], steps: true, dims: false, timeout: null },
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
    actions: [{ label: 'Again', hint: '' }],
    steps: false,
    dims: true,
    // ⚠️ **`then: 'title'` is gone and nothing was lost.** Expiring presses *Again*, and *Again* goes
    // to the title — the destination was written twice and agreed only by hand. 0063.
    timeout: { steps: 7 * STEPS_PER_SECOND },
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
  /*
    ⚠️ **THE ONE SCREEN THAT KEEPS THE WORLD RUNNING.** Reported from play: *"the current pause/level
    screen interrupts the flow"*, and — in the same breath — that the interruption is what makes the
    branching chart between levels look like the wrong idea.
    `docs/decisions/0063-a-level-break-is-a-respite.md`.

    `steps: true` and `dims: false`: the sky the boss died in goes on scrolling, the player goes on
    flying, and this is a line of text over the top of it. `timeout` presses *Onward* after three
    seconds, so the break costs the player nothing they have to do — and *Onward* is still there for
    a hand that wants to skip it.
  */
  cleared: {
    heading: 'Level clear',
    actions: [{ label: 'Onward', hint: '' }],
    steps: true,
    dims: false,
    timeout: { steps: 3 * STEPS_PER_SECOND },
  },
  /**
   * Every level in the run is behind the player.
   *
   * ⚠️ **A separate screen rather than `cleared` with different words**, because they are different
   * events: one carries a run forward and the other ends it. `docs/game.md` puts eight levels and a
   * final boss at the end of a run; two of them exist, so this is the end of what has been authored
   * rather than the end of the game — and the wording says only what is true.
   */
  victory: { heading: 'Coil cleared', actions: [{ label: 'Again', hint: '' }], steps: false, dims: true, timeout: null },
};
