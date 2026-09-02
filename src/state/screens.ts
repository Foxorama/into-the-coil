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
import { SOUNDS, SOUND_KINDS } from '../content/sound.ts';
import { STYLES, STYLE_KINDS } from '../content/styles.ts';
// 0210: the music room's buttons ARE the place table — `state` sits above `content` on 0015's ladder.
import { THEMES, THEME_KINDS } from '../content/themes.ts';

/** Every screen, in no particular order — nothing indexes this list by position. Closed. */
export const SCREEN_KINDS = ['title', 'playing', 'gameOver', 'cleared', 'victory', 'music'] as const;

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

/**
 * Every setting that can appear on a screen. Closed.
 *
 * ⚠️ **Declared HERE rather than in the slice, on 0017's own terms**: this file is one level above
 * `slices/` and is the sanctioned place for a shape two of them must agree on. `settings` keys its
 * state by it and `screen` rows name it, and neither imports the other.
 */
export type SettingName = 'style' | 'sound';

/**
 * One setting a screen offers, and the options it offers for it.
 *
 * ⚠️ **`name` is the SETTING and not a label**, which is what lets the shell route a press without a
 * table of its own: `src/app/mount.ts` reads it to decide which action to dispatch, and a second
 * setting is a row here rather than an arm there.
 *
 * ⚠️ **An option carries NO VALUE, only a position — and that is what keeps the shell cast-free.**
 * The difficulty buttons already work this way: `DIFFICULTY_KINDS` IS the order, so a control's index
 * reads straight off it. A `value: string` here would arrive at the reducer as a string that has to
 * be narrowed to a `StyleKind`, and `docs/decisions/0016-a-hub-enumerates-kinds.md` bans exactly the
 * escape hatches that would take.
 */
export interface ScreenChoice {
  name: SettingName;
  /** What the row is called on screen. */
  label: string;
  /** The options, in the order the content hub lists them. Position is the value. */
  options: readonly { label: string; hint: string }[];
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
   * The settings this screen lets the player change, if any.
   *
   * ⚠️ **A CHOICE IS NOT AN ACTION, and keeping them apart is the whole of this field.**
   * `docs/decisions/0070-a-style-is-a-setting-and-the-first-one.md`. An action *does* something and
   * the screen usually stops existing afterwards — a tier button starts a run. A choice *is*
   * something: it has a current value, the player can see which one is on, and pressing it leaves
   * them exactly where they were. Folded into `actions`, the title screen would have five buttons of
   * which three start a run and two do not, told apart by an index — and
   * `docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md`'s focus ring would walk
   * them as if they were the same thing.
   *
   * ⚠️ **A LIST of choices, each with a LIST of options**, for the reason `actions` gives one field
   * up: the second setting is a row rather than a rewrite. `docs/state-of-play.md` names the queue —
   * palette, reduced motion, flash intensity — and every one of them is this shape.
   *
   * ⚠️ **The state itself is NOT here.** A row says a choice exists and what it offers; which option
   * is on lives in `src/state/slices/settings.ts`, and the shell is what puts the two together. A
   * current value on this table would be a second copy of the state, drifting the moment anything
   * dispatched.
   */
  choices: readonly ScreenChoice[];
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
   * ── WHAT EXPIRING MEANS ─────────────────────────────────────────────────────────────────────────
   *
   * ⚠️ **`then: null` means the screen presses its own first control**, which is what lets a level
   * break expire into something that is not a screen at all: *Onward* carries the run into the next
   * level, and no `Screen` value could ever have named that.
   *
   * ⚠️ **A named screen means the timeout goes SOMEWHERE ELSE than the button, and this field was
   * deleted once for being a second description before it earned itself back the same week.** 0063
   * removed it on the grounds that the run-over screen's *Again* went to the title and its timeout
   * went to the title, so the destination was written twice and kept in step by hand. That was true.
   * Then `docs/decisions/0068-a-run-over-is-a-continue.md` turned *Again* into *Continue* — a button
   * that RESUMES the run — and pressing the control on expiry revived a run the player had walked
   * away from, which is the precise opposite of what a countdown is for.
   *
   * The rule the two of them add up to: **what happens when the player does nothing is a different
   * question from what happens when they press the only button**, and it only looks like the same
   * question while the button happens to be a way of giving up. Collapsing them is not a
   * de-duplication, it is an assumption about every future label — and it survived one.
   *
   * ⚠️ **Counted in STEPS, not in milliseconds**, because the step is fixed at 60Hz
   * (`docs/decisions/0022-frame-rate-is-a-feature.md`) and a screen that is not stepping the
   * simulation is still being stepped by the loop. A wall-clock timer here would be the one thing on
   * these screens that runs at display rate, and it would drift on a throttled tab.
   * `src/content/ships.ts` counts `INVULN_STEPS` the same way, for the same reason.
   */
  timeout: { steps: number; then: Screen | null } | null;
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
    /*
      ⚠️ **THE TIERS FIRST AND THE MUSIC ROOM LAST, AND THE ORDER IS LOAD-BEARING** — 0210.
      `src/app/mount.ts` narrows the index it is handed against `DIFFICULTY_KINDS`, so anything
      appended past the end of that table is not a tier and is routed as such. Putting the music room
      first would silently make it a difficulty.
    */
    actions: [
      ...DIFFICULTY_KINDS.map((kind) => ({ label: DIFFICULTIES[kind].title, hint: DIFFICULTIES[kind].hint })),
      { label: 'Music', hint: '' },
    ],
    /*
      ⚠️ **THE FIRST SETTING, AND IT IS ON THE TITLE SCREEN RATHER THAN BEHIND ONE** —
      `docs/decisions/0070-a-style-is-a-setting-and-the-first-one.md`. A settings screen is real and
      is not this: `docs/state-of-play.md` has had one queued for weeks, and inventing it to hold a
      single two-option row would put the one thing a player might want before their first run behind
      a door they have to find. The title screen is already the place a run is configured — 0047 put
      the tier there for the same reason.

      ⚠️ **Built by walking `STYLE_KINDS`, so the buttons ARE the table.** Same argument the tiers
      above make, and the same one `src/app/chrome.ts` makes for the pickup key.
    */
    /*
      ⚠️ **THE SECOND SETTING, AND IT COST NOTHING BUT THIS ROW** —
      `docs/decisions/0072-a-cue-is-baked-and-played.md`. 0070 said the queue behind the style was
      *"already the same shape"* and this is the first entry to test that claim: `src/app/chrome.ts`
      walks `choices` and needs no edit, the shell routes by `name` and needs one line, and the state
      is a field. It is the row that proves the mechanism rather than the one that needed it.
    */
    choices: [
      {
        name: 'style',
        label: 'Look',
        options: STYLE_KINDS.map((kind) => ({ label: STYLES[kind].title, hint: STYLES[kind].hint })),
      },
      {
        name: 'sound',
        label: 'Sound',
        options: SOUND_KINDS.map((kind) => ({ label: SOUNDS[kind].title, hint: SOUNDS[kind].hint })),
      },
    ],
    steps: false,
    dims: true,
    timeout: null,
  },
  playing: { heading: '', actions: [], choices: [], steps: true, dims: false, timeout: null },
  /**
   * ⚠️ **No score, no summary, no coaching.** `docs/game.md`: *players are assumed to be adaptable;
   * hints are added where play proves they are needed, never pre-emptively.* What the player needs to
   * know is that the run ended and how to carry on, and the frozen scene behind this says everything
   * about why — `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`.
   */
  /*
   * ⚠️ **"Continue", not "Again", and the two words describe different games** —
   * `docs/decisions/0068-a-run-over-is-a-continue.md`. The button no longer throws the run away and
   * sends the player back to the tier choice: it puts a fresh ship into the level that was already
   * running, on the field that is frozen behind this screen, with the scatter the last death threw
   * still lying in it (`docs/decisions/0066-a-death-scatters-what-it-took.md`).
   *
   * ⚠️ **The label is the promise, so it is the thing that must not drift.** *Again* over a resumed
   * level, or *Continue* over a restart, is a screen lying about what the button does — and it is
   * the only account of it the player ever gets.
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
   *
   * ⚠️ **It is now the countdown a cabinet actually has**, which it was not before: seven seconds to
   * decide whether to continue, and the run is gone when they run out. That is the shape 0068 gives
   * the offer its cost, since nothing here takes a coin.
   */
  gameOver: {
    heading: 'Run over',
    actions: [{ label: 'Continue', hint: '' }],
    choices: [],
    steps: false,
    dims: true,
    // ⚠️ **`then: 'title'` and NOT the button.** *Continue* resumes the run (0068); a countdown that
    // pressed it would hand the walked-away player their run back, which is the one thing seven
    // seconds of silence is evidence against. The offer expires — that is what gives it its cost.
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
    choices: [],
    steps: true,
    dims: false,
    // ⚠️ **`then: null` — the one screen that genuinely presses its own button.** *Onward* is not a
    // screen, it is `continueRun`, so there is nothing here a destination could have been written as.
    timeout: { steps: 3 * STEPS_PER_SECOND, then: null },
  },
  /**
   * Every level in the run is behind the player.
   *
   * ⚠️ **A separate screen rather than `cleared` with different words**, because they are different
   * events: one carries a run forward and the other ends it. `docs/game.md` puts eight levels and a
   * final boss at the end of a run; two of them exist, so this is the end of what has been authored
   * rather than the end of the game — and the wording says only what is true.
   */
  victory: { heading: 'Coil cleared', actions: [{ label: 'Again', hint: '' }], choices: [], steps: false, dims: true, timeout: null },
  /*
    ── THE MUSIC ROOM — `docs/decisions/0210-the-title-plays-the-music.md` ──────────────────────────

    Asked for: *"a menu option to the start screen for music that allows a user to select a level and
    play the music, or play all, which runs through the music from level to level and then restarts
    at level 1."*

    ⚠️ **BUILT BY WALKING `THEME_KINDS`, SO THE BUTTONS ARE THE TABLE.** The same argument the tiers
    and the style options make one screen up: a place added to `src/content/themes.ts` appears here
    without anybody remembering to come and add it, and the order is the table's order, which is the
    order a run meets them in.

    ⚠️ **`steps: false`.** Nothing is simulated here — no run exists, the camera does not move, and
    the only thing happening is the mixer. A screen that stepped would be a run the player did not
    start, which is the loss `title` deliberately took.
  */
  music: {
    heading: 'Music',
    actions: [
      ...THEME_KINDS.map((kind) => ({ label: THEMES[kind].title, hint: '' })),
      { label: 'Play all', hint: 'each place in turn, then round again' },
      { label: 'Back', hint: '' },
    ],
    choices: [],
    steps: false,
    dims: true,
    timeout: null,
  },
};
