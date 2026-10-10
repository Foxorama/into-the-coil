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
// 0340: the crossing's knob, on the two lines above's exact terms.
import { TRAVELS, TRAVEL_KINDS } from '../content/travel.ts';
// 0512: the touch section's two, on the same terms.
import { HANDS, HAND_KINDS, STEERS, STEER_KINDS } from '../content/touch.ts';
// 0210: the music room's buttons ARE the place table — `state` sits above `content` on 0015's ladder.
import { THEMES, THEME_KINDS } from '../content/themes.ts';
import { CREDITS, CREDIT_KINDS } from '../content/credits.ts';
import { INTRO_STEPS, type StandCamera } from '../content/port.ts';
import { OUTRO_STEPS } from '../content/finale.ts';
import { GOLFERS, GOLFER_KINDS, type GolferKind } from '../content/golfers.ts';
import { SHIPS, SHIP_KINDS, type ShipKind } from '../content/ships.ts';
import { DANGLES, DANGLE_KINDS } from '../content/dangles.ts';
import { RIMS, RIM_KINDS } from '../content/rims.ts';
import { ART } from '../content/art.ts';
import { HUES, TONES } from '../content/livery.ts';
import { FLAMES, FLAME_KINDS } from '../content/flames.ts';
import { SHELLS, SHELL_KINDS } from '../content/shells.ts';
import { OWNABLES, SHELF_KINDS, SHELVES, type OwnableKind, type ShelfKind } from '../content/wares.ts';
import { RACKS, RACK_KINDS, TUBE_WARE_KINDS } from '../content/racks.ts';
import type { KeeperKind } from '../content/keepers.ts';
import { WEAPONS } from '../content/weapons.ts';
import { SIDE_LABELS, SPECIALS, type Side } from '../content/specials.ts';
import { PICKUPS, bombFaceOf, missileFaceOf, wardFaceOf, type PickupKind } from '../content/pickups.ts';
import { MISSILES } from '../content/missiles.ts';
import { SHOTS } from '../content/shots.ts';
import { ACROSS_SPAN, REFERENCE_ASPECT } from '../sim/camera.ts';

/** Every screen, in no particular order — nothing indexes this list by position. Closed. */
export const SCREEN_KINDS = [
  'splash',
  'intro',
  'title',
  'settings',
  'hangar',
  'parts',
  'shop',
  'guide',
  'playing',
  'gameOver',
  'ended',
  'cleared',
  'outro',
  'victory',
  'music',
  'travel',
  'paused',
  'quit',
  'resuming',
] as const;

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
// 0458: the tier is a setting since the title became rows — chosen on a band, kept until changed.
// 0512: and the touch section's two.
// 0517: and whether a run that runs out may be continued.
// 0590: and no longer the look, whose one alternative had stopped being what it was asked for as.
export type SettingName = 'difficulty' | 'sound' | 'travel' | 'pilot' | 'hand' | 'steer' | 'credits';

/**
 * Every slot the hangar fits on a ship — 0521. Closed. The plate is the first; the plan's queue
 * (`reports/the-hangar-planned-2026-10-05.md`) names the rest.
 *
 * ⚠️ **NOT A SETTING, AND THAT IS WHY IT IS A SECOND NAME.** A setting has one value, held by the
 * settings slice; a slot has one value PER SHIP, held by the hangar, and the band shows the value for
 * the ship of the pilot on it. Folded into `SettingName` it would have to be a field of
 * `SettingsState`, which is keyed by this union — a field that could only ever hold one ship's plate.
 */
// 0523: and what hangs from the dash.
// 0524: and the special a run opens with.
// 0526: and the gun it flies.
// 0527: and what its wheels wear, on the Paint & Parts tab.
// 0528: and what it wears on its nose, its dome or its flank.
// 0529: and the colour its body is painted, a hue and a tone.
// 0530: and what its engines burn.
// 0578: and the tubes it carries into a run — `rack`, since `tubes` is the shelf they are sold on.
// 0584: and the shell its shields wear — `shell`, since `shields` is the shelf they are sold on.
export const SLOT_NAMES = ['plate', 'dangle', 'special', 'gun', 'rim', 'art', 'livery', 'tone', 'flame', 'rack', 'shell'] as const;
export type SlotName = (typeof SLOT_NAMES)[number];
/** Whether a band's name is a slot of the ship — 0561, so the shell can fit or try on any slot in one arm. */
export function isSlot(name: ChoiceName): name is SlotName {
  return SLOT_NAMES.some((slot) => slot === name);
}

/**
 * Cosmo's shelves — 0523: which ware the shop has in its window. Neither a setting nor a slot: nothing
 * is kept, and the band is where the player is looking, which the shell holds while the shop is up.
 *
 * ⚠️ **A BAND A SHELF SINCE 0542, AND AN AISLE.** It was one band of every ware; each shelf is the band of
 * its own table's wares (`SHELF_KINDS`), and the aisle steps which shelf is in view, so a fourth table is
 * a fourth band of the same shape and never a new name here.
 */
export type ShelfName = ShelfKind | 'aisle';

/*
  0579: which of a stand's groups is in view, on a stand that shows them one at a time (`StandRow.tabbed`).
  Neither a setting nor a slot nor a shelf: nothing is kept, and its options are the stand's own headings.
*/
export type SectionName = 'section';

/** What a band on a screen may choose: a setting, a slot of the ship on the hangar's stand, a ware, or a section. */
export type ChoiceName = SettingName | SlotName | ShelfName | SectionName;

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
export type ScreenChoice = ChoiceRow &
  (
    | { faces: 'words' | 'chip' }
    | {
        faces: 'portraits';
        /**
         * What stands under a band of faces about the one that is on — 0538. `'whole'` is 0513's card:
         * the ship, the name, the pronouns and home, who they are, the craft and its gun. `'line'` is the
         * name, the craft and the gun on one line — the title's, where the bio was the heaviest text on
         * the screen and said nothing about the run about to be flown; the person is read in the hangar.
         */
        card: 'line' | 'whole';
      }
  );

interface ChoiceRow {
  name: ChoiceName;
  /** What the row is called on screen. */
  label: string;
  /** The options, in the order the content hub lists them. Position is the value. */
  options: readonly { label: string; hint: string }[];
  /**
   * What a segment of the band shows — 0458: its words, or the golfer's portrait.
   *
   * ⚠️ **A FACT ABOUT THE CHOICE AND NOT A SWITCH ON ITS NAME**, on `pushed`'s terms below: the pilot
   * band is the one drawn in faces today, and a later band of ships would say so here rather than in
   * an arm of the chrome.
   */
  /*
    ⚠️ **`'chip'` SINCE 0517: ONE BUTTON IN THE ROW OF ACTIONS, SAYING THE OPTION THAT IS ON**, for a
    two-way choice on a screen with no height left for a band. A press steps it round; the cursor walks
    it as one of the buttons beside it, and its hint is the button's tooltip rather than a line under it.
  */
  faces: 'words' | 'portraits' | 'chip';
  /**
   * Which devices the band is offered on — 0512. `'touch'` for a setting about the glass, which a
   * keyboard and a pad have no use for; `'all'` for the rest.
   *
   * ⚠️ **A CAPABILITY OF THE DEVICE, READ THE WAY THE STRIP IS** (`touchable` in `src/app/mount.ts`):
   * a laptop with a touchscreen has the discs, so it has the choice of which side they stand on.
   */
  on: 'all' | 'touch';
  /**
   * What a press on the band does — 0513. `'steps'` moves it on to the next option, round the end,
   * which is what every band did; `'takes'` presses the option already on it, which is the pilot
   * band's: the cursor on a pilot is the highlight, and A or Enter on it flies them.
   *
   * ⚠️ **A FACT ABOUT THE CHOICE, ON `faces`'s TERMS**: the chrome reads it and never the band's name.
   *
   * `'tries'` since 0561 is a slot of the ship on a stand: a step puts the option on the ship and fits
   * nothing, a press fits the one tried on, and leaving the band puts the fitted one back — *"seeing how
   * it immediately looks is good, but it shouldn't auto-equip when scrolling menus."* A step reaches a
   * shut option too, so the player can see what it is and read what opens it.
   */
  press: 'steps' | 'takes' | 'tries';
}

/**
 * How a screen stands in the port — 0539: its plate on the right with the bands grouped under headings,
 * and on the stand beside it the dash, the real readout moved down into it, showing what a run opens
 * with. The hangar family's, where a ship is fitted; `null` on every other screen.
 */
export interface StandRow {
  /**
   * The headings on the plate, in order, each with the bands it holds — a band in none stands at the
   * plate's head, as the pilots do. A fact about each tab: a fourth tab writes its own.
   */
  groups: readonly { label: string; bands: readonly ChoiceName[] }[];
  /**
   * Whether the groups are shown one at a time — 0579: behind a band of their headings drawn as tabs, the
   * `section` band, so a group added is a tab and never a taller plate. `false` draws every group under
   * its heading. A fact about each tab, as its groups are.
   */
  tabbed: boolean;
  /**
   * Where the port's camera stands while the tab is up — 0540: on the pad for the hangar, closer on it
   * for Paint & Parts, beside the stall for Cosmo's (0542). Each tab's own; the room is the intro's.
   */
  camera: StandCamera;
  /**
   * Who keeps the counter on this tab, whose face and line head its plate and whose counter stands by the
   * pad — 0542: Cosmo, on Cosmo's; since 0550 Unity on Hangin' Out and MMXXVI on Paint & Parts. `null` on a
   * tab with no counter. A kind of the keepers' table, so a fourth tab names its own.
   */
  keeper: KeeperKind | null;
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
   * Whether the first action stands alone, a row of its own over the rest — 0538. The title's *Fly* is
   * the one thing that starts a run, and beside the hangar, the chip and Settings it was one button of
   * four at three sizes; alone it is the screen's primary and the rest are the quiet row under it.
   *
   * ⚠️ **A FACT ABOUT THE ROW, on `pushed`'s terms**: the chrome marks the action that leads and the
   * stylesheet stands it alone, and `screen === 'title'` there would be the hub naming an instance. The
   * walk needs nothing from it — inside a row of buttons the boxes decide where a push lands (0214).
   */
  leads: boolean;
  /**
   * Whether the screen stands in the port, and how — 0539. `null` for a screen that is a panel on the
   * void or over the field, which is every screen but the hangar's three tabs.
   *
   * ⚠️ **A FACT ABOUT THE ROW, AND IT WAS READ OFF THE CHOICES.** The readout came up over a screen
   * offering the `plate` slot or a `ware` (0521, 0523), so *Paint & Parts*, which offers neither, had no
   * dash — and the plan puts the dash on every tab of the three. Said here, the chrome asks the row.
   */
  stand: StandRow | null;
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
  /**
   * Whether the screen's words are PUSHED by the shell rather than written on this row — 0340.
   *
   * ⚠️ **IT EXISTS BECAUSE *WHAT A PANEL IS* WAS BEING INFERRED, AND THE INFERENCE RAN OUT.**
   * `src/app/chrome.ts` builds a panel for any row with a heading or an action, which was a true
   * description of every screen until one had neither: the crossing names a place that is not known
   * until it starts, and has no button on purpose. Without this it would be the second screen in the
   * project's history to be shown correctly and be completely invisible — 0210's was the first, and
   * that file's header has the story.
   *
   * ⚠️ **A FACT ABOUT THE ROW AND NOT A SWITCH ON ITS NAME.** `|| screen === 'travel'` in the chrome
   * would be the hub enumerating an instance, which `docs/decisions/0016-a-hub-enumerates-kinds.md`
   * is about. The music room's readout is pushed too and says so; it has a heading as well, so the
   * answer there changes nothing, and is stated because it is true.
   */
  pushed: boolean;
  /**
   * Whether the screen offers a Skip, which goes where its timeout goes — 0418. The intro and the
   * finale are pictures that play out by themselves, and a player who has seen one presses past it.
   *
   * ⚠️ **A FACT ABOUT THE ROW, on `pushed`'s own terms one field up**: the Skip was bound to the intro
   * by name until a second cutscene needed one, and `screen === 'intro' || screen === 'outro'` in the
   * chrome and the shell would be the hub enumerating instances.
   */
  skips: boolean;
  /**
   * Whether this screen is part of a run — 0418: the run's place is what the music is made of while it
   * is up, and anywhere else the title's is.
   *
   * ⚠️ **THE BUG THIS FIXES WAS THE MUSIC ASKING THE RUN WHILE NO RUN WAS ON.** The material a piece is
   * played from was chosen from `run.level` on every screen, and `run.level` is only reset when a run
   * begins — so after the last boss the victory screen and the title went on playing The Black Heart's
   * drone, pipes and kit under the title's mix, until a new run or the music room moved it. Reported:
   * *"the last level music doesn't stop till you start a new run or go to the music settings."*
   */
  inRun: boolean;
  /**
   * Where Back goes — B on a pad, Escape on a keyboard — 0458. `null` for a screen with no way back,
   * `'opener'` for one reached from more than one place, which goes back to whichever opened it.
   *
   * ── THERE WAS NO BACK, AND EVERY WAY OUT WAS A TILE ─────────────────────────────────────────────
   *
   * ⚠️ **Walked with a pad, on `main` at `5391d51`**: B on the music room did nothing, and the only way
   * off it was to walk to *Back* — the ninth tile. `reports/the-menus-reviewed-2026-10-02.md` has the
   * walk. A screen the player went INTO is a screen they expect to come back OUT of with one press.
   *
   * ⚠️ **`'opener'` IS SETTINGS' AND THE GUIDE'S**, because both are reached from the title and from a
   * paused run, and one fixed destination would send a player who opened Settings mid-run to the
   * title. `src/state/slices/screen.ts` records the opener as the screen is entered.
   *
   * ⚠️ **THE PAUSE'S BACK IS THE COUNT-IN — 0511.** B and Escape on a pause resume the run, which is
   * what every console's pause does with them, so its row says where they go like any other.
   */
  back: Screen | 'opener' | null;
  /**
   * The screens this one shares a tab strip with, in order, itself among them — 0458. Empty for a
   * screen with no tabs. Settings and How to play are two tabs of one place to the player and two rows
   * here, because each has its own controls and its own Back.
   */
  tabs: readonly Screen[];
  /**
   * Where the cursor starts the first time the screen is shown — 0458: on its first action, or on
   * its first choice. The title opens on *Launch* so a returning player's first press starts a run;
   * Settings opens on its first band, because changing one is what it is for.
   */
  opensOn: 'action' | 'choice';
  /**
   * What this screen has to do with a pause — 0511. `'offered'` where a run may be paused from (the
   * button is up, Escape, P and Start ask for it, a hidden tab takes it), `'held'` on a screen a
   * paused run is held under — the world stopped AND the audio clock stopped with it — and `null`
   * everywhere else.
   *
   * ⚠️ **TWO ANSWERS ON ONE FIELD, BECAUSE THEY CANNOT BOTH BE TRUE.** A screen a pause is offered on
   * is one the run is going on under, and a screen a run is held under is one it is not.
   *
   * ⚠️ **SETTINGS AND HOW TO PLAY ARE `null` AND ARE STILL HELD WHEN A PAUSE OPENED THEM.** Their
   * opener says so (`src/state/slices/screen.ts`): the same two screens are reached from the title,
   * where nothing is held, and a field on their rows could only be one of the two.
   */
  pause: 'offered' | 'held' | null;
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

/** One line of a pickup face's sheet — 0580: what is said, and what stands beside it. */
export interface FaceLine {
  label: string;
  value: string;
}

/**
 * What How to play's sheet says of one face of a pickup — 0580, *"have the icons and have a tap on them pop
 * up a window with their stats"*. Its name, what it gives, the trigger it goes on (`side`, so the shell can
 * name the button in the hand holding the game) and the lines under them.
 *
 * ⚠️ **EVERY NUMBER IS READ OFF A ROW, IN THE PLAYER'S UNITS.** A missile's hit in pulses (its shot's damage
 * over the pulse's), a seeker's life in seconds, a thrown special's reach as a share of the reference
 * screen's length (0023's view, so the same on every device). A row changed is a sheet changed.
 *
 * ⚠️ **NOT WHAT A SPECIAL DOES TO A BOSS.** That share is authored in five places by five mechanisms — a
 * blast's, a storm's strikes, a rift, a nova's ring, each of a candle's bursts — and one line over them is a
 * switch on the row's shape that the next special falls through.
 */
export function faceCard(kind: PickupKind, face: number): { title: string; said: string; side: Side | null; lines: FaceLine[] } {
  const from = { label: 'From', value: 'The ' + PICKUPS[kind].label + ' pickup' };
  if (kind === 'missile') {
    const missile = MISSILES[missileFaceOf(face)];
    const surge = SPECIALS[missile.special];
    const pulses = SHOTS[missile.shot].damage / SHOTS.pulse.damage;
    return {
      title: missile.label,
      said: missile.hint,
      side: null,
      lines: [
        from,
        { label: 'Fits', value: 'A tube on your ship, which fires by itself' },
        { label: 'Each hit', value: String(pulses) + ' pulses' },
        {
          label: 'Flies',
          value: missile.guidance === 'homing' ? 'Hunts what is on screen, for ' + (missile.fuse / STEPS_PER_SECOND).toFixed(1) + ' s' : 'Straight ahead, to the edge',
        },
        // 0577: a missile pickup at two tubes is a surge.
        { label: 'Both tubes full', value: surge.label + ', on your ' + SIDE_LABELS[surge.side].toLowerCase() },
      ],
    };
  }
  if (kind === 'shield' && face === 0) {
    const spill = PICKUPS.shield.spills;
    return {
      title: PICKUPS.shield.label,
      said: PICKUPS.shield.hint,
      side: null,
      lines: [from, { label: 'Fits', value: 'A plate on your shell' }, ...(spill === null ? [] : [{ label: 'Shell full', value: SPECIALS[spill].label + ' instead' }])],
    };
  }
  const special = SPECIALS[kind === 'bomb' ? bombFaceOf(face) : wardFaceOf(kind === 'shield' ? face - 1 : face)];
  const lines: FaceLine[] = [from, { label: 'Goes on', value: 'Your ' + SIDE_LABELS[special.side].toLowerCase() + ', one charge' }];
  if (special.shot !== null && special.reach > 0) {
    // Of the narrowest screen's length (0364), which every device shows at least.
    lines.push({ label: 'Goes off', value: 'About ' + String(Math.round((100 * special.reach) / (ACROSS_SPAN * REFERENCE_ASPECT))) + '% of the screen ahead' });
  }
  return { title: special.label, said: special.hint, side: special.side, lines };
}

/**
 * What a pilot flies, on one line — the pilot band's line, and what a reader hears of each face.
 *
 * ⚠️ **THE SHIP AND ITS GUN SINCE 0441, AND IT WAS THE GOLFER'S HOME.** Picking a pilot picks a ship
 * and a gun for the whole run, which is the one thing about the choice that changes how it plays. The
 * home, the pronouns and who they are went to the panel under the faces in 0513.
 */
function pilotHint(kind: GolferKind): string {
  const ship = SHIPS[GOLFERS[kind].ship];
  return `${ship.label} · ${WEAPONS[ship.weapon].label}`;
}

/** The pilot band's faces, on the title and in the hangar — one list, so the two cannot differ. */
const pilotOptions = GOLFER_KINDS.map((kind) => ({ label: GOLFERS[kind].name, hint: pilotHint(kind) }));

/**
 * Where the port's camera stands on the hangar's three tabs — 0548: one place, between Cosmo's stall and
 * the pilot's pad, at one zoom. Each tab had its own (0540, 0542), and stepping the tabs moved the room
 * and the ship under the player's eye three ways at once. Each row still names its camera; this is the
 * one they share today, and a tab that wants another writes its own.
 */
// 0568: no closer than the room's whole height and a little — the truss to the deck — so a bigger screen shows more hangar.
// 0571: on the ship on its cradle in the dock.
const PORT_CAMERA: StandCamera = { along: 112, across: 64, zoom: 1.15, x: 0.6, y: 0.5 };

/**
 * The band of a tabbed stand's headings — 0579: one option a group, in the stand's order, so a group added
 * to the row is a tab without a second list to keep in step. A step brings that group into view.
 */
function sectionBand(stand: StandRow): ScreenChoice {
  return {
    name: 'section',
    label: 'Section',
    options: stand.groups.map((group) => ({ label: group.label, hint: '' })),
    faces: 'words',
    on: 'all',
    press: 'steps',
  };
}

/** Paint & Parts' stand — a name of its own because its section band is read off it, on Hangin' Out's terms (0584). */
const PARTS_STAND: StandRow = {
  groups: [
    // 0579: the tubes were here a day (0578), for the height Hangin' Out had not got; they are loadout.
    // 0584: and the shell its shields wear.
    { label: 'Parts', bands: ['rim', 'flame', 'shell'] },
    { label: 'Paint', bands: ['art', 'livery', 'tone'] },
  ],
  /*
    0584: one group at a time, on Hangin' Out's terms (0579) — the shield made Parts three bands tall, and
    on the smallest phone the plate ran past the screen. 0579 named this as the shields' coming.
  */
  tabbed: true,
  /*
    0548: the port's one camera. It was closer on the pad at 2.3 (0540), so the wheels, the nose and the
    flame were large — and the room jumped a size every time the tab was stepped onto, which was asked
    to stop. The looks are still read close on rig/looks.html.
  */
  camera: PORT_CAMERA,
  // 0550: MMXXVI, who paints it.
  keeper: 'mmxxvi',
};

/** Hangin' Out's stand — a name of its own because its section band is read off it (0579). */
const HANGAR_STAND: StandRow = {
  groups: [
    // 0579: and the tubes, which are loadout as the gun and the special are.
    { label: 'Loadout', bands: ['gun', 'special', 'rack'] },
    // 0561: *Cockpit*, answered 2026-10-07 — a band named *Dash* stood under a heading named *Dash*.
    { label: 'Cockpit', bands: ['plate', 'dangle'] },
  ],
  /*
    0579: one group at a time — *"If we need to scroll or something on hanging out, then we need better
    menu's there. There's going to be shield cosmetics and other cosmetics as well"* — answered as
    sub-tabs: a later group is a tab, and the plate is never more than three bands tall.
  */
  tabbed: true,
  // 0548: the port's one camera, the pad and the keeper's counter in it — it was on the pad at 1.5 (0540).
  camera: PORT_CAMERA,
  // 0550: Unity, who puts the loadout and the dash together.
  keeper: 'unity',
};

/** A ship's name to follow *the* — the Firebird's label carries its own article. */
function plainLabel(kind: ShipKind): string {
  return SHIPS[kind].label.replace(/^The /, '');
}

/**
 * What the pilot band says while a pilot is still shut — 0546, or `null` when every pilot may fly. It
 * names who has still to clear the game, so the band says how far there is to go as well as where.
 */
export function pilotWhy(won: Readonly<Record<ShipKind, boolean>>): string | null {
  for (const kind of GOLFER_KINDS) {
    const left = GOLFERS[kind].opensAfter.filter((k) => !won[GOLFERS[k].ship]);
    if (left.length === 0) continue;
    const names = left.map((k) => GOLFERS[k].name);
    const list = names.length === 1 ? names[0]! : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]!;
    return 'Beat the jellyfish with ' + list + ' to fly ' + GOLFERS[kind].name;
  }
  return null;
}

/**
 * What the hangar's dash band says when `ship`'s other dashes are shut — 0521, or `null` when one is
 * open. On the row's terms: the words are the screen's, and the shell only says which case it is in.
 */
export function plateWhy(ship: ShipKind, won: boolean, borrowable: boolean): string | null {
  return slotWhy(ship, won, borrowable, 'dash');
}

/** What the special band says when `ship`'s other specials are shut — 0524, on the dash's words exactly. */
export function specialWhy(ship: ShipKind, won: boolean, borrowable: boolean): string | null {
  return slotWhy(ship, won, borrowable, 'special');
}

/** What the gun band says when `ship`'s other guns are shut — 0526, on the same words. */
export function gunWhy(ship: ShipKind, won: boolean, borrowable: boolean): string | null {
  return slotWhy(ship, won, borrowable, 'gun');
}

/** `ship`'s three looks as a band offers them — 0528: by name, each with its line. */
export function artOptions(ship: ShipKind): { label: string; hint: string }[] {
  return SHIPS[ship].arts.map((kind) => ({ label: ART[kind].name, hint: ART[kind].hint }));
}

/** What the art band says while only the ship's first look is open — 0528, the dash's sentence. */
export function artWhy(ship: ShipKind, won: boolean): string | null {
  return won ? null : 'Beat the jellyfish in the ' + plainLabel(ship) + ' to change its art';
}

/** What the colour band says before the ship can be painted — 0529, the same sentence. */
export function liveryWhy(ship: ShipKind, won: boolean): string | null {
  return won ? null : 'Beat the jellyfish in the ' + plainLabel(ship) + ' to paint it';
}

/** What the tone band says when there is no paint to tone — 0529. */
export function toneWhy(won: boolean, painted: boolean): string | null {
  if (!won) return null;
  return painted ? null : 'Choose a colour first: the factory’s paint has its own tone';
}

/** What the tubes band says while no tube is owned — 0578: where they are sold, and what a bare ship does. */
export function rackWhy(boughtAny: boolean): string | null {
  return boughtAny ? null : 'Tubes are sold at Cosmo’s — without them, missile pickups fit yours';
}

/**
 * What the shield band says while it offers nothing but the ship's own — 0584: the dash's sentence, and
 * Cosmo's, since either opens some.
 */
export function shellWhy(ship: ShipKind, won: boolean, borrowable: boolean, bought: boolean): string | null {
  if (bought || borrowable) return null;
  const sentence = slotWhy(ship, won, borrowable, 'shield');
  return sentence === null ? null : sentence + ', or buy one at Cosmo’s';
}

/** What the flame band says while only the standard is had — 0530: where the rest are sold. */
export function flameWhy(bought: boolean): string | null {
  return bought ? null : 'Ion Thrusters are at Cosmo’s, the next tab';
}

/**
 * What the wheels band says when it offers nothing but the car's own — 0527: a ship with no wheels says
 * so, and a car says how to open the rest, the dash's sentence and Cosmo's, since either opens some.
 */
export function rimWhy(ship: ShipKind, wheeled: boolean, won: boolean, borrowable: boolean, bought: boolean): string | null {
  if (!wheeled) return 'The ' + plainLabel(ship) + ' flies on no wheels';
  if (bought || borrowable) return null;
  const sentence = slotWhy(ship, won, borrowable, 'wheels');
  return sentence === null ? null : sentence + ', or buy a set at Cosmo’s';
}

/**
 * Why one shut option of a slot is shut — 0561, said when the cursor tries it on. The band's sentence
 * said why the slot had shut options; a shut option the player is looking at says what opens it.
 */
export function optionWhy(name: SlotName, ship: ShipKind, index: number, won: Readonly<Record<ShipKind, boolean>>): string | null {
  const what = { plate: 'dash', special: 'special', gun: 'gun' } as const;
  switch (name) {
    case 'plate':
    case 'special':
    case 'gun': {
      const from = SHIP_KINDS[index];
      if (from === undefined) return null;
      if (!won[ship]) return 'Beat the jellyfish in the ' + plainLabel(ship) + ' to change its ' + what[name];
      return 'Beat the jellyfish in the ' + plainLabel(from) + ' to borrow its ' + what[name];
    }
    case 'rim': {
      const rim = RIM_KINDS[index];
      if (rim === undefined) return null;
      if (SHIPS[ship].wheels === null) return 'The ' + plainLabel(ship) + ' flies on no wheels';
      if (RIMS[rim].from === null) return 'Sold at Cosmo’s, the next tab';
      if (!won[ship]) return 'Beat the jellyfish in the ' + plainLabel(ship) + ' to change its wheels';
      return 'Beat the jellyfish in the ' + plainLabel(RIMS[rim].from) + ' to borrow its wheels';
    }
    case 'dangle':
    case 'flame':
      return 'Sold at Cosmo’s, the next tab';
    // 0584: a ship's own shell, another ship's on the dash's words, or one Cosmo's sells.
    case 'shell': {
      const shell = SHELL_KINDS[index];
      if (shell === undefined) return null;
      const from = SHELLS[shell].from;
      if (from === null) return 'Sold at Cosmo’s, the next tab';
      if (!won[ship]) return 'Beat the jellyfish in the ' + plainLabel(ship) + ' to change its shield';
      return 'Beat the jellyfish in the ' + plainLabel(from) + ' to borrow its shield';
    }
    // 0578: a rack wants tubes, and Cosmo's sells them — since 0579 two tabs over, so not *the next tab*.
    case 'rack':
      return 'Buy the tubes for it at Cosmo’s';
    // The band's own sentence covers these: a ship not yet won, or a factory paint with no tone.
    case 'art':
    case 'livery':
    case 'tone':
      return null;
    default: {
      const unhandled: never = name;
      return unhandled;
    }
  }
}

/** A ship's own slot, shut: why, in the one sentence every such slot uses — 0521's, since 0524 shared. */
function slotWhy(ship: ShipKind, won: boolean, borrowable: boolean, what: string): string | null {
  if (!won) return 'Beat the jellyfish in the ' + plainLabel(ship) + ' to change its ' + what;
  return borrowable ? null : 'Beat the jellyfish in another ship to borrow its ' + what;
}

/**
 * What the hangar's dangle band says while nothing has been bought — 0523, so the shut ones say where
 * they are sold; `null` once one has, and the band says what is on it.
 */
export function dangleWhy(boughtAny: boolean): string | null {
  return boughtAny ? null : 'More to hang at Cosmo’s, the next tab';
}

/**
 * What the shelf says of the ware in the window — 0523: that it is owned and where it is put on, or how
 * far the balance is from it, or `null` when it can be bought and the band says its price. 0527: a rim
 * is fitted on Paint & Parts, where a dangle hangs in the hangar — and since 0530 a flame is too.
 */
/*
  0578: a second tube waits for the first, which the shelf says before it says what the balance is short
  of — `waiting` is the ware it waits for. 0579: a tube is fitted in the hangar, under *Loadout*.
*/
export function wareWhy(ware: OwnableKind, owned: boolean, shards: number, waiting: OwnableKind | null = null): string | null {
  if (owned && DANGLE_KINDS.some((dangle) => dangle === ware)) return 'Yours — hang it in the hangar';
  if (owned) return TUBE_WARE_KINDS.some((tube) => tube === ware) ? 'Yours — fit it in the hangar' : 'Yours — fit it in Paint & Parts';
  if (waiting !== null) return 'Buy the ' + OWNABLES[waiting].name + ' first';
  const price = OWNABLES[ware].price ?? 0;
  return shards < price ? 'Need ' + String(price - shards) + ' more Star Shards' : null;
}

/** What the hangar is called, on its door on the title and over the screen itself — 0521. */
const HANGAR_TITLE = 'Hangin’ Out';

/**
 * Whether a screen leaving for `then` — run out or skipped — begins a run rather than showing a screen
 * — 0513.
 *
 * ⚠️ **INTO PLAY FROM OUTSIDE A RUN BEGINS ONE; FROM INSIDE IT, IT IS THE RUN GOING ON.** The intro
 * (`inRun: false`) ends in a run begun on what the pilot screen showed, because `playing` with no run
 * behind it is a field with nobody in it. The pause's count-in (`inRun: true`) ends in the run it held,
 * and beginning one there would throw the held run away at the end of every pause. Here rather than in
 * the shell so the difference can be held without a browser.
 */
export function beginsRun(from: Screen, then: Screen): boolean {
  return then === 'playing' && !SCREENS[from].inRun;
}

export const SCREENS: Record<Screen, ScreenRow> = {
  /**
   * The splash — `docs/decisions/0415-the-golfer-is-chosen.md`. What the page opens on: the name, over
   * the dark, while the game loads behind it.
   *
   * ⚠️ **IT WAITS FOR A PRESS SINCE 0513, AND THE PRESS IS THE SOUND'S.** No browser plays anything
   * before the page is touched (0412). The golfers' cards were that press until the review found the
   * pilot asked twice; the splash takes the duty, which is the first screen of nearly every game for
   * exactly this reason. Once the game behind it has loaded and the name has been up its time,
   * *Press to begin* appears; a key, a click or a tap goes on to the pilot screen with sound, and one
   * made before then is remembered and goes on the moment it may. `timeout` is null: it never leaves
   * by itself. A pad cannot ask for sound, so a pad's press does nothing here — and the hint says so
   * by naming a key.
   *
   * ⚠️ **ESCAPE STILL ASKS FOR NOTHING** (0412): it goes on without building the sound.
   */
  splash: {
    heading: GAME_TITLE,
    pause: null,
    leads: false,
    stand: null,
    actions: [{ label: 'Press to begin', hint: '' }],
    choices: [],
    steps: false,
    dims: true,
    timeout: null,
    pushed: false,
    skips: false,
    inRun: false,
    back: null,
    tabs: [],
    opensOn: 'action',
  },
  /**
   * The chase begins at the port — `docs/decisions/0411-the-chase-begins-at-the-port.md`: the Viper
   * blasts out of the spaceport, the pilot runs out of the bar to their ship and goes after her, and
   * the level opens when they are gone.
   *
   * ⚠️ **IT ENDS IN THE RUN SINCE 0513, AND IT ENDED AT THE TITLE.** The boot's pick played it and the
   * title came after; the pick is the title's *Fly* now, so the intro plays on the first flight of a
   * visit and hands over to the run that flight asked for. `then: 'playing'` is the run beginning —
   * `src/app/mount.ts` begins it on the tier and the ship the title showed, rather than showing a
   * screen with no run behind it. Its Skip goes the same way, into level one.
   *
   * ⚠️ **NO PANEL, NO BUTTON, AND IT LEAVES ON ITS OWN CLOCK.** Any press skips it
   * (`src/app/mount.ts`), and that is the only thing a press does here. It is a picture and not a
   * screen with controls on it, which is why `heading` and `actions` are empty and the chrome builds
   * nothing for it — the same shape `playing` has.
   *
   * ⚠️ **`steps: false`: nothing in it is simulated.** The picture is a pure function of how long the
   * screen has been up (`src/render/port.ts`), so the sim never runs under it and there is no code path
   * by which anything here can touch the run that follows.
   */
  intro: {
    heading: '',
    pause: null,
    leads: false,
    stand: null,
    actions: [],
    choices: [],
    steps: false,
    dims: false,
    timeout: { steps: INTRO_STEPS, then: 'playing' },
    pushed: false,
    skips: true,
    inRun: false,
    back: null,
    tabs: [],
    opensOn: 'action',
  },
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
   * ── THE TITLE IS ROWS — `docs/decisions/0458-the-title-is-rows.md` ─────────────────────────────
   *
   * ⚠️ **TWO BANDS AND TWO BUTTONS, AND IT WAS FIVE BUTTONS AND SIX CHIPS.** Asked for as *"the
   * three difficulty buttons could be a single toggable band; the pilots could be smaller with
   * profile pics and be toggleable."* The three tiers were three of the five largest things on the
   * screen and one choice, and each was also the start button — which is why the pilot had to live a
   * screen away. A band is one row the player moves ALONG; *Launch* is the one thing that starts.
   *
   * ⚠️ **A run still cannot begin without a tier** (0047) — it begins on the one the band shows,
   * which is the one the player chose last, and *Savior* before anything was chosen (`TUNED`).
   *
   * ⚠️ **Built by walking `DIFFICULTY_KINDS` and `GOLFER_KINDS`, so the bands ARE the tables**, on
   * the terms the tier buttons and the boot cards were built on: a tier or a pilot added to its table
   * appears here without anybody remembering to come and add it. The pilot band is the reason a
   * larger roster costs this screen nothing — it is one row however long the table gets.
   *
   * ⚠️ **Look, Sound and Travel are on Settings now**, the screen 0070 said was real and not yet
   * worth a door. Four settings and a guide are worth one.
   */
  /*
   * ── THE TITLE IS THE PILOT SCREEN — `docs/decisions/0513-the-pilot-flies.md` ────────────────────
   *
   * ⚠️ **ONE SCREEN FOR THE BOOT'S JOB AND THE TITLE'S, BECAUSE THEY WERE THE SAME DECISION.** The boot
   * asked for a pilot on four large cards and then the title asked again on a band of faces beside
   * *Launch*: *"having the pilots to select from, but then have to click on a secondary launch
   * button."* The cards are gone; the faces are cards, the panel under them says who the highlighted
   * pilot is and what they fly, and a press on that pilot — or *Fly* — is the launch.
   *
   * ⚠️ **THE PILOT FIRST**, because the panel is what the strip is choosing between, and the tier is a
   * choice about the run the pilot is about to fly. The walk is the order they are drawn in.
   */
  title: {
    heading: GAME_TITLE,
    pause: null,
    // 0538: *Fly* alone, and the hangar, the chip and Settings the quiet row under it.
    leads: true,
    stand: null,
    // 0521: the hangar between them — where the pilot about to fly is fitted out, so beside *Fly*.
    actions: [
      { label: 'Fly', hint: '' },
      { label: HANGAR_TITLE, hint: '' },
      { label: 'Settings', hint: '' },
    ],
    choices: [
      {
        name: 'pilot',
        label: 'Pilot',
        options: pilotOptions,
        faces: 'portraits',
        // 0538: who they are is the hangar's; here, what the run is.
        card: 'line',
        on: 'all',
        // A press on the highlighted pilot flies them — 0513.
        press: 'takes',
      },
      {
        name: 'difficulty',
        label: 'Difficulty',
        options: DIFFICULTY_KINDS.map((kind) => ({ label: DIFFICULTIES[kind].title, hint: DIFFICULTIES[kind].hint })),
        faces: 'words',
        on: 'all',
        press: 'steps',
      },
      /*
        0517: whether the run may be continued — asked for on this screen, because it is the other
        choice about the run the pilot is about to fly. Built by walking `CREDIT_KINDS`.

        ⚠️ **A CHIP BESIDE *SETTINGS*, AND A BAND DID NOT FIT.** A third band put *Fly* under the fold
        of a 1280x720 laptop, and on a phone the title's grid has one cell for the tier. Chosen by the
        player of three ways to fit it: a chip costs the screen no height.
      */
      {
        name: 'credits',
        label: 'Continues',
        options: CREDIT_KINDS.map((kind) => ({ label: CREDITS[kind].title, hint: CREDITS[kind].hint })),
        faces: 'chip',
        on: 'all',
        press: 'steps',
      },
    ],
    steps: false,
    dims: true,
    timeout: null,
    pushed: false,
    skips: false,
    inRun: false,
    back: null,
    tabs: [],
    opensOn: 'action',
  },
  /**
   * Settings — 0458. Reached from the title, and the screen a paused run will open; Back goes to
   * whichever opened it.
   *
   * ⚠️ **THE THREE SETTINGS THE TITLE CARRIED, AS BANDS.** Each was two chips the pad stopped on
   * twice; a band is one stop that says its value, and its option's hint is written under it, which a
   * chip could only put in a tooltip.
   */
  settings: {
    heading: 'Settings',
    pause: null,
    leads: false,
    stand: null,
    // Past the bands, on 0070's terms: the music room is a place to go, and Back is a way out.
    actions: [
      { label: 'Music room', hint: '' },
      { label: 'Back', hint: '' },
    ],
    /*
      ⚠️ **Each built by walking its kind table, so the options ARE the table** — 0072 for the sound,
      0340 for the crossing, 0590 for the hand. **The crossing is a comfort knob over the picture and
      NOT over the sim** (0024): `src/content/travel.ts` holds what it changes, and
      `tests/travel.test.ts` makes that a fact.
    */
    choices: [
      {
        name: 'sound',
        label: 'Sound',
        options: SOUND_KINDS.map((kind) => ({ label: SOUNDS[kind].title, hint: SOUNDS[kind].hint })),
        faces: 'words',
        on: 'all',
        press: 'steps',
      },
      {
        name: 'travel',
        label: 'Travel',
        options: TRAVEL_KINDS.map((kind) => ({ label: TRAVELS[kind].title, hint: TRAVELS[kind].hint })),
        faces: 'words',
        on: 'all',
        press: 'steps',
      },
      /*
        ⚠️ **THE HAND — 0590, ON EVERY DEVICE**: *left* is the game mirrored, and on a touch screen the
        trigger discs go with it. It was 0512's *Triggers*, offered on touch alone, until the side the
        discs stand on became the side the game is played from. A knob over the picture and the input
        and not over the sim (0024): `src/content/touch.ts` holds what it changes.
      */
      {
        name: 'hand',
        label: 'Hand',
        options: HAND_KINDS.map((kind) => ({ label: HANDS[kind].title, hint: HANDS[kind].hint })),
        faces: 'words',
        on: 'all',
        press: 'steps',
      },
      /*
        ⚠️ **THE TOUCH SECTION — 0512**, on a screen that can be touched and nowhere else: how quick the
        steering is. A comfort knob over the input and not over the sim (0024).
      */
      {
        name: 'steer',
        label: 'Steering',
        options: STEER_KINDS.map((kind) => ({ label: STEERS[kind].title, hint: STEERS[kind].hint })),
        faces: 'words',
        on: 'touch',
        press: 'steps',
      },
    ],
    steps: false,
    dims: true,
    timeout: null,
    pushed: false,
    skips: false,
    inRun: false,
    back: 'opener',
    tabs: ['settings', 'guide'],
    opensOn: 'choice',
  },
  /**
   * *Hangin’ Out*, the hangar — `docs/decisions/0521-the-hangar-opens.md`. Reached from the title; the
   * pilot on the stand, and the slots of the ship they fly.
   *
   * ⚠️ **THE PILOT BAND IS THE TITLE'S OWN SETTING, OFFERED A SECOND TIME, AND IT STEPS.** Asked for:
   * *"allows you to select your pilot, then …"*. It is one value in one slice, so the two bands cannot
   * disagree, and a pilot chosen here is the one the title flies. A press does not fly from here: the
   * hangar is where a ship is fitted, and *Fly* is the title's.
   *
   * ⚠️ **THE READOUT IS UP OVER IT**, because the plate is what this screen fits and the readout is the
   * plate: `src/app/chrome.ts` shows it over any screen offering the `plate` slot, read off this row.
   */
  hangar: {
    heading: HANGAR_TITLE,
    pause: null,
    leads: false,
    // 0539: what the ship flies with, and what its dash wears — the two the player reads across.
    stand: HANGAR_STAND,
    actions: [{ label: 'Back', hint: '' }],
    choices: [
      {
        name: 'pilot',
        label: 'Pilot',
        options: pilotOptions,
        faces: 'portraits',
        card: 'whole',
        on: 'all',
        press: 'steps',
      },
      // 0579: the sub-tabs, under the pilot and over the one group they have in view.
      sectionBand(HANGAR_STAND),
      {
        name: 'plate',
        label: 'Dash',
        options: SHIP_KINDS.map((kind) => ({ label: SHIPS[kind].hud.name, hint: 'The dash from the ' + plainLabel(kind) })),
        faces: 'words',
        on: 'all',
        press: 'tries',
      },
      /*
        0523: what hangs from the dash — nothing first, then every dangle in the table's order, the ones
        not owned shut and saying where to get them. Built by walking `DANGLE_KINDS`.
      */
      {
        name: 'dangle',
        label: 'Hanging',
        // 0561: the empty hook, said as one, so it does not stand among the wares as though it were one.
        options: [{ label: 'Empty hook', hint: 'A clear dash' }, ...DANGLE_KINDS.map((kind) => ({ label: DANGLES[kind].name, hint: DANGLES[kind].hint }))],
        faces: 'words',
        on: 'all',
        press: 'tries',
      },
      /*
        0526: the gun the ship flies — each ship's own, in the ship table's order, named as the pilot
        card names it, with the ship it comes from. Built by walking `SHIP_KINDS`.
      */
      {
        name: 'gun',
        label: 'Gun',
        options: SHIP_KINDS.map((kind) => {
          const gun = WEAPONS[SHIPS[kind].weapon];
          return { label: gun.label, hint: gun.hint + ' — from the ' + plainLabel(kind) };
        }),
        faces: 'words',
        on: 'all',
        press: 'tries',
      },
      /*
        0524: the special a run opens with two of — each ship's own gun's, in the ship table's order,
        named as the bomb pickup's faces name them. Built by walking `SHIP_KINDS`.
      */
      {
        name: 'special',
        label: 'Special',
        options: SHIP_KINDS.map((kind) => {
          const special = SPECIALS[WEAPONS[SHIPS[kind].weapon].special];
          return { label: special.label, hint: special.hint + ' — from the ' + plainLabel(kind) };
        }),
        faces: 'words',
        on: 'all',
        press: 'tries',
      },
      /*
        0578: the tubes the ship carries into a run — none first, then every rack in the table's order, the
        ones the tubes owned are not enough for shut and saying where to buy them. Built by walking
        `RACK_KINDS`. 0579: on Hangin' Out, under *Loadout*.
      */
      {
        name: 'rack',
        label: 'Tubes',
        options: RACK_KINDS.map((kind) => ({ label: RACKS[kind].label, hint: RACKS[kind].hint })),
        faces: 'words',
        on: 'all',
        press: 'tries',
      },
    ],
    steps: false,
    // 0540: the port stands behind it, so the screen shows the picture rather than painting over it.
    dims: false,
    timeout: null,
    pushed: false,
    skips: false,
    inRun: false,
    back: 'title',
    // 0523: and Cosmo's beside it, one place to the player — buying and fitting. 0527: and Paint & Parts between.
    tabs: ['hangar', 'parts', 'shop'],
    opensOn: 'choice',
  },
  /**
   * *Paint & Parts* — `docs/decisions/0527-the-wheels-turn.md`. The hangar's second tab: how each ship
   * looks — its wheels, and as the plan's next items land its nose art, its livery and its flame — where
   * *Hangin' Out* keeps what it flies with and what its dash wears. Asked, when the hangar was about to
   * reach eight slots: a third tab, named *"Paint & Parts"*.
   *
   * ⚠️ **THE PILOTS AGAIN, ON THE SAME SETTING**, because which ship is being dressed is whose it is; a
   * face chosen here is the pilot chosen on the hangar and the title, one setting on three bands.
   */
  parts: {
    heading: 'Paint & Parts',
    pause: null,
    leads: false,
    // 0539: what is bolted on, and how it is painted.
    stand: PARTS_STAND,
    actions: [{ label: 'Back', hint: '' }],
    choices: [
      {
        name: 'pilot',
        label: 'Pilot',
        options: pilotOptions,
        faces: 'portraits',
        // 0539: whose ship is being dressed, and what it flies; who they are is the hangar tab's.
        card: 'line',
        on: 'all',
        press: 'steps',
      },
      // 0584: the sub-tabs, as Hangin' Out's (0579), over the one group they have in view.
      sectionBand(PARTS_STAND),
      /*
        0527: the wheels — every rim in the table's order, named with where it comes from. Built by
        walking `RIM_KINDS`; a ship with no wheels shows them all shut and says so.
      */
      {
        name: 'rim',
        label: 'Wheels',
        options: RIM_KINDS.map((kind) => {
          const rim = RIMS[kind];
          return { label: rim.name, hint: rim.hint + ' — ' + (rim.from === null ? 'from Cosmo’s' : 'from the ' + plainLabel(rim.from)) };
        }),
        faces: 'words',
        on: 'all',
        press: 'tries',
      },
      /*
        0528: the look on its nose, its dome or its flank — three places, because every ship authors its
        own three (`arts` on its row) and no ship wears another's. The row names the fighter's; the shell
        names the three of whichever ship is on the stand (`setLabels`), as it marks which are open.
      */
      {
        name: 'art',
        label: 'Art',
        options: artOptions('fighter'),
        faces: 'words',
        on: 'all',
        press: 'tries',
      },
      /*
        0529: the body's colour — the factory's first, then every hue round the wheel — and its tone. Two
        bands rather than a wheel, because a band is the picker every device already works: a step of
        either is a press a pad, a mouse and a thumb all make.
      */
      {
        name: 'livery',
        label: 'Colour',
        options: [{ label: 'Factory', hint: 'The paint it came in' }, ...HUES.map((hue) => ({ label: hue.name, hint: hue.name + ' paint, over the whole body' }))],
        faces: 'words',
        on: 'all',
        press: 'tries',
      },
      {
        name: 'tone',
        label: 'Tone',
        options: TONES.map((tone) => ({ label: tone.name, hint: 'The colour ' + tone.name.toLowerCase() })),
        faces: 'words',
        on: 'all',
        press: 'tries',
      },
      // 0530: what the engines burn — the standard, then every flame Cosmo's sells. Built by walking `FLAME_KINDS`.
      {
        name: 'flame',
        label: 'Flame',
        options: FLAME_KINDS.map((kind) => ({ label: FLAMES[kind].name, hint: FLAMES[kind].hint })),
        faces: 'words',
        on: 'all',
        press: 'tries',
      },
      /*
        0584: the shell its shields wear — every shell in the table's order, named with where it comes from.
        Built by walking `SHELL_KINDS`, on the wheels' terms.
      */
      {
        name: 'shell',
        label: 'Shield',
        options: SHELL_KINDS.map((kind) => {
          const shell = SHELLS[kind];
          return { label: shell.name, hint: shell.hint + ' — ' + (shell.from === null ? 'from Cosmo’s' : 'from the ' + plainLabel(shell.from)) };
        }),
        faces: 'words',
        on: 'all',
        press: 'tries',
      },
    ],
    steps: false,
    // 0540: on the hangar's terms.
    dims: false,
    timeout: null,
    pushed: false,
    skips: false,
    inRun: false,
    back: 'title',
    tabs: ['hangar', 'parts', 'shop'],
    opensOn: 'choice',
  },
  /**
   * *Cosmo's Cosmetics* — `docs/decisions/0523-cosmo-opens.md`. The hangar's second tab: the shelf of
   * what is for sale, *Buy*, and the balance in the corner.
   *
   * ⚠️ **THE READOUT IS UP OVER IT TOO, WEARING THE WARE IN THE WINDOW**, so a dangle is seen swinging
   * from the player's own dash before a shard is spent — the chrome shows it over any screen offering a
   * slot or a ware, read off the row.
   */
  shop: {
    heading: 'Cosmo’s Cosmetics',
    pause: null,
    leads: false,
    /*
      ⚠️ **0542: AT COSMO'S STALL, BY THE PAD, AND IT WAS AT THE BAR (0540).** The plan stood the camera at
      the bar, the counter and its lit shelf filling the stand, with the ship on its pad beyond — and asked
      that every ware be tried on where it goes, a rim on the ship's wheels and a flame in its exhaust. The
      bar's window and the pad are sixty-four units apart, which no camera that fills the screen fits in a
      stand a third of it wide: at the bar the ship stood under the plate. So Cosmo keeps a stall on the deck
      beside the pad, and the camera stands between the two — the port's one camera since 0548.
    */
    stand: { groups: [], tabbed: false, camera: PORT_CAMERA, keeper: 'cosmo' },
    // 0542: Buy names the price of the ware in the window, written by the shell — `Buy · 250 ✦`.
    actions: [
      { label: 'Buy', hint: '' },
      { label: 'Back', hint: '' },
    ],
    /*
      0542: the aisle, which steps the shelf in view, and a shelf per table — each its own wares, named with
      their price by the shell (`setLabels`), so what is owned can say so. Built by walking `SHELF_KINDS`.

      ⚠️ **0548: AND THE PILOTS FIRST, ON THE SAME SETTING**, because the ware in the window is tried on the
      ship on the pad, and which ship that is was a tab away: a rim tried on a ship with no wheels showed
      nothing, and the way to see it on a car was Back a tab, a pilot, and across again.
    */
    choices: [
      {
        name: 'pilot',
        label: 'Pilot',
        options: pilotOptions,
        faces: 'portraits',
        card: 'line',
        on: 'all',
        press: 'steps',
      },
      {
        name: 'aisle',
        label: 'Aisle',
        options: SHELF_KINDS.map((kind) => ({ label: SHELVES[kind].label, hint: '' })),
        faces: 'words',
        on: 'all',
        press: 'steps',
      },
      ...SHELF_KINDS.map(
        (kind): ScreenChoice => ({
          name: kind,
          label: SHELVES[kind].label,
          options: SHELVES[kind].wares.map((ware) => ({ label: OWNABLES[ware].name, hint: OWNABLES[ware].hint })),
          faces: 'words',
          on: 'all',
          press: 'steps',
        }),
      ),
    ],
    steps: false,
    // 0540: on the hangar's terms.
    dims: false,
    timeout: null,
    pushed: false,
    skips: false,
    inRun: false,
    back: 'title',
    tabs: ['hangar', 'parts', 'shop'],
    opensOn: 'choice',
  },
  /**
   * How to play — 0458. The pickups, what each does and how it is taken, and the specials and what
   * throws them on the device in hand. Its words are the content rows' and its layout is
   * `src/app/chrome.ts`'s; this row says only that it is a screen with a way back.
   *
   * ⚠️ **A REFERENCE THE PLAYER OPENS, NOT A HINT PUSHED AT THEM.** `docs/game.md`: *hints are added
   * where play proves they are needed, never pre-emptively.* This was asked for from play, and it
   * waits behind a tab rather than standing on the way into a run.
   */
  guide: {
    heading: 'How to play',
    pause: null,
    leads: false,
    stand: null,
    actions: [{ label: 'Back', hint: '' }],
    choices: [],
    steps: false,
    dims: true,
    timeout: null,
    pushed: false,
    skips: false,
    inRun: false,
    back: 'opener',
    tabs: ['settings', 'guide'],
    opensOn: 'action',
  },
  // `pushed: false` — the HUD is pushed at it, and the HUD is not a panel: `src/app/chrome.ts` builds
  // it apart and shows it on every row that steps, which is why this row still has no panel.
  playing: {
    heading: '',
    actions: [],
    leads: false,
    stand: null,
    choices: [],
    steps: true,
    dims: false,
    timeout: null,
    pushed: false,
    skips: false,
    inRun: true,
    back: null,
    tabs: [],
    opensOn: 'action',
    // 0511: the one screen a run is paused FROM. The break and the burn step too, and are not offered
    // it: each leaves on its own within seconds, and a pause there would have to resume into a screen
    // that has already half-expired.
    pause: 'offered',
  },
  /**
   * ⚠️ **No summary and no coaching — and one number, since 0428.** `docs/game.md`: *players are
   * assumed to be adaptable; hints are added where play proves they are needed, never pre-emptively.*
   * What the player needs to know is that the run ended and how to carry on, and the frozen scene
   * behind this says everything about why —
   * `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`. The score was asked
   * for (`docs/decisions/0428-the-score-is-kept.md`), and it is the one thing the frozen scene cannot
   * say: what the credit is worth, how far it got and where the table puts it — which it does when
   * the player continues and when the offer runs out alike, since a continue starts the score again
   * (`docs/decisions/0438-the-score-is-the-credits.md`).
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
    pause: null,
    leads: false,
    stand: null,
    actions: [{ label: 'Continue', hint: '' }],
    choices: [],
    steps: false,
    dims: true,
    // ⚠️ **`then: 'title'` and NOT the button.** *Continue* resumes the run (0068); a countdown that
    // pressed it would hand the walked-away player their run back, which is the one thing seven
    // seconds of silence is evidence against. The offer expires — that is what gives it its cost.
    timeout: { steps: 7 * STEPS_PER_SECOND, then: 'title' },
    pushed: false,
    skips: false,
    // Its *Continue* resumes the run, in the place it ended in (0068).
    inRun: true,
    back: null,
    tabs: [],
    opensOn: 'action',
  },
  /*
    ── GAME OVER — `docs/decisions/0517-no-quarters-given.md` ──────────────────────────────────────

    Where a run on *No quarters given* ends: *"it changes into a game over screen that gives the score
    summary and stats about that run and has a 'Main Menu' button."* The run-over screen's place and
    its frozen field, with no offer on it — so no countdown either: the seven seconds were the offer's
    cost (0068), and with nothing to take back there is nothing to expire. The run is on the table as
    the screen arrives, and the sheet says where.

    ⚠️ **A ROW OF ITS OWN AND NOT `gameOver` WITH ITS BUTTON HIDDEN**, on `victory`'s terms: the label
    is the promise. *Continue* on a screen that cannot continue, or a row whose actions changed with a
    setting, is the screen lying about what its button does.

    ⚠️ **`inRun: true`, as the run-over screen is**: the place it ended in is still what is on the
    screen, and its music is what goes on under the account until *Main Menu*.
  */
  ended: {
    heading: 'Game over',
    pause: null,
    leads: false,
    stand: null,
    actions: [{ label: 'Main Menu', hint: '' }],
    choices: [],
    steps: false,
    dims: true,
    timeout: null,
    pushed: false,
    skips: false,
    inRun: true,
    // No Back, on `victory`'s terms: the one way off is the one button, and the cursor opens on it.
    back: null,
    tabs: [],
    opensOn: 'action',
  },
  /**
   * The boss is dead and there is another level behind it.
   *
   * ⚠️ **"Onward" now, and it said "Again" when there was one level** — a screen that offered to
   * continue when there was nowhere to go would have been a promise the build could not keep.
   *
   * ⚠️ **THE CHART NO LONGER GOES HERE, AND THAT IS A CHANGE OF ANSWER RATHER THAN OF PLAN** —
   * `docs/decisions/0340-the-coil-is-a-route.md`. This note read *"this is where the chart will
   * eventually go"* from 0042 until 0340, and the chart went one row further on: the respite stayed
   * exactly what 0063 made it — three seconds of a world that never stopped — and `travel` below is
   * the burn that follows it, with the chart as an inset in its banner. A branching map of
   * destinations is still what `docs/game.md` describes and still not what is built; the straight
   * line 0042 recorded as a deliberate first step is now a straight line somebody can look at.
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
    pause: null,
    leads: false,
    stand: null,
    actions: [{ label: 'Onward', hint: '' }],
    choices: [],
    steps: true,
    dims: false,
    // ⚠️ **`then: null` — the one screen that genuinely presses its own button.** *Onward* is not a
    // screen, it is `continueRun`, so there is nothing here a destination could have been written as.
    /*
      ⚠️ **SIX SECONDS AND IT WAS THREE — 0428.** The break carries the level's account now, seven
      lines that arrive one after another over two seconds, and three seconds was one second of reading
      them. The world still never stops (0063), and *Onward* is still there for a hand that has read.
    */
    timeout: { steps: 6 * STEPS_PER_SECOND, then: null },
    pushed: false,
    skips: false,
    inRun: true,
    back: null,
    tabs: [],
    opensOn: 'action',
  },
  /**
   * The crossing: the respite is over, and the ship is burning its way to the next place.
   *
   * ⚠️ **`docs/decisions/0340-the-coil-is-a-route.md`.** Asked for as *"loading screens anyway for
   * transitions and to represent moving through the galaxy"*; built first as a full-screen chart with
   * a button on it; and played: *"it takes the player out of the game… completely out of place when
   * the fight goes boss death → starfield → animation → button click."* So it is not a screen in the
   * sense the title is one. It is the second row in this table that is the GAME with words over it,
   * and it is `cleared`'s pair for `cleared`'s reason.
   *
   * ⚠️ **`steps: true` AND `dims: false`, WHICH IS EXACTLY WHAT `cleared` IS, AND THAT IS THE DESIGN.**
   * `docs/decisions/0063-a-level-break-is-a-respite.md` was written because a screen between two
   * levels that stopped the world *"interrupts the flow"*, and
   * `docs/decisions/0076-a-level-has-an-origin.md` because one that moved the ship was *"disjointing"*.
   * The first build of this row stopped the world and painted a chart in place of it, and was reported
   * in the same words eleven weeks later. The world keeps stepping, the player keeps flying, the HUD
   * stays up (`src/app/chrome.ts` shows it while the simulation runs), and what happens is a thing the
   * ship does: `src/app/mount.ts` writes `World.warp` while this row is current, and the scroll rate,
   * the engine's flame and the streaks in the sky are all that one number being read.
   *
   * ⚠️ **NO ACTIONS, AND THE FIRST BUILD HAD ONE.** It auto-forwarded and did not need its *Onward*
   * pressed — and: *"it felt like a button click was needed, which is the same thing."* A control on a
   * held screen is an instruction whether or not it is one. Every input the player has already means
   * something here, because they are flying.
   *
   * ⚠️ **`timeout: null`, AND IT IS THE ONE ROW THAT LEAVES ON SOMETHING OTHER THAN A CLOCK OR A
   * HAND.** A timeout is *n steps, then press something*; this holds for a floor AND for the next
   * place's music being in the mixer's hands, and then takes a second and a half to trail off. That is
   * three facts a `{ steps, then }` cannot carry, so `src/content/travel.ts` holds the rule and
   * `src/app/mount.ts` spends the steps.
   */
  travel: {
    // ⚠️ **Empty, because the heading is the PLACE and the place is not known until the crossing
    // starts.** `pushed` below is what says so, and is why this row has a panel at all.
    heading: '',
    pause: null,
    leads: false,
    stand: null,
    actions: [],
    choices: [],
    steps: true,
    dims: false,
    timeout: null,
    pushed: true,
    skips: false,
    inRun: true,
    back: null,
    tabs: [],
    opensOn: 'action',
  },
  /**
   * The finale — `docs/decisions/0418-the-heart-lets-go.md`: the last boss beaten, the heart bursting,
   * the Viper inside it and whoever was in it, and the two ships leaving together. On the intro's terms
   * exactly — no panel, nothing stepped, a picture on its own clock — and it expires into the victory
   * screen, which is where its Skip goes too.
   */
  outro: {
    heading: '',
    pause: null,
    leads: false,
    stand: null,
    actions: [],
    choices: [],
    steps: false,
    dims: false,
    timeout: { steps: OUTRO_STEPS, then: 'victory' },
    pushed: false,
    skips: true,
    // The last place, heard to its end: the heart is still what is on the screen — 0418.
    inRun: true,
    back: null,
    tabs: [],
    opensOn: 'action',
  },
  /**
   * Every level in the run is behind the player.
   *
   * ⚠️ **A separate screen rather than `cleared` with different words**, because they are different
   * events: one carries a run forward and the other ends it. `docs/game.md` puts eight levels and a
   * final boss at the end of a run; two of them exist, so this is the end of what has been authored
   * rather than the end of the game — and the wording says only what is true.
   */
  victory: {
    heading: 'Coil cleared',
    pause: null,
    leads: false,
    stand: null,
    actions: [{ label: 'Again', hint: '' }],
    choices: [],
    steps: false,
    dims: true,
    timeout: null,
    pushed: false,
    skips: false,
    inRun: false,
    back: null,
    tabs: [],
    opensOn: 'action',
  },
  /*
    ── THE MUSIC ROOM — `docs/decisions/0210-the-title-plays-the-music.md` ──────────────────────────

    Asked for: *"a menu option to the start screen for music that allows a user to select a level and
    play the music, or play all, which runs through the music from level to level and then restarts
    at level 1."*

    ⚠️ **BUILT BY WALKING `THEME_KINDS`, SO THE BUTTONS ARE THE TABLE.** The same argument the tiers
    and the style options make one screen up: a place added to `src/content/themes.ts` appears here
    without anybody remembering to come and add it, and the order is the table's order, which is the
    order a run meets them in.

    ⚠️ **`steps: false`, AND THE CAMERA MOVES ANYWAY SINCE 0212.** Nothing is SIMULATED here — no
    ship, no bodies, no collisions, and no run the player did not start, which is the loss `title`
    deliberately took. What moves is a camera walking the place's own level, which is what makes the
    room play the same music a run does: `docs/decisions/0212-the-room-walks-the-level.md` has why
    those are different things, and `src/app/mount.ts` drives it off `onTick` rather than off `step`.
  */
  music: {
    heading: 'Music',
    pause: null,
    leads: false,
    stand: null,
    actions: [
      ...THEME_KINDS.map((kind) => ({ label: THEMES[kind].title, hint: '' })),
      { label: 'Play all', hint: 'each place in turn, then round again' },
      { label: 'Back', hint: '' },
    ],
    choices: [],
    steps: false,
    /*
      ⚠️ **THE ONLY PANELLED SCREEN THAT DOES NOT DIM, AND IT IS THE WHOLE FEATURE — 0212.** Asked
      for as *"a scrolling background to match the level/sound being played"*. A dim paints the space
      colour over the scene (`src/app/chrome.ts` sets it inline), so the room would be auditioning a
      place with a lid on it. `.itc-music-panel` gives the words their own translucent backing, which
      is the half of a dim that was ever doing work here.

      ⚠️ **`dims: false` DOES NOT MEAN `pointer-events: none`.** That is `cleared`'s rule and it is on
      `.itc-cleared` by name, because a level break is a banner over a run the player is still flying
      and this is a screen they are pressing buttons on.
    */
    dims: false,
    timeout: null,
    // The now-playing readout is `setNowPlaying`'s — 0212. True, and changes nothing: it has a heading.
    pushed: true,
    skips: false,
    inRun: false,
    // Reached from Settings since 0458, so that is where B goes — and Settings remembers its opener.
    back: 'settings',
    tabs: [],
    opensOn: 'action',
  },
  /*
    ── THE PAUSE — `docs/decisions/0511-the-run-can-be-paused.md` ──────────────────────────────────

    Asked for: *"we also need to add a pause/settings button in game as well so that people can pause,
    change settings or quit mid-game if they want."* There was none: a run could only be left by dying.

    ⚠️ **HELD, NOT JUST STOPPED.** `steps: false` stops the sim; `pause: 'held'` is what stops the
    audio clock with it (`src/app/mount.ts` suspends the context), because the music free-runs on
    `AudioContext.currentTime` (0160) and the beat-authored volleys are phased to it. A pause that
    stopped only the world would resume into a run whose volleys and score had come apart.

    ⚠️ **`back: 'resuming'`, SO B AND ESCAPE RESUME**, through the count-in like *Resume* does.
  */
  paused: {
    heading: 'Paused',
    pause: 'held',
    leads: false,
    stand: null,
    actions: [
      { label: 'Resume', hint: '' },
      { label: 'Settings', hint: '' },
      { label: 'How to play', hint: '' },
      { label: 'Quit', hint: '' },
    ],
    choices: [],
    steps: false,
    dims: true,
    timeout: null,
    pushed: false,
    skips: false,
    inRun: true,
    back: 'resuming',
    tabs: [],
    opensOn: 'action',
  },
  /*
    Quit asks once — 0511, from the review: *one stray press throwing away a run is worse than one
    extra press.* And a quit is kept on the table like a run over, if it makes the ten (answered
    2026-10-02).
  */
  quit: {
    heading: 'Quit this run?',
    pause: 'held',
    leads: false,
    stand: null,
    actions: [
      { label: 'Keep playing', hint: '' },
      { label: 'Quit', hint: '' },
    ],
    choices: [],
    steps: false,
    dims: true,
    timeout: null,
    pushed: false,
    skips: false,
    inRun: true,
    back: 'paused',
    tabs: [],
    // On *Keep playing*, which is first so the cursor lands on it: a press made in haste costs nothing.
    opensOn: 'action',
  },
  /*
    The count-in — 0511. *Resume carries a short count-in, so the player has their thumb back before
    the bullets move.* The field is shown and stopped (`dims: false`, `steps: false`), the number counts
    down over it, and it expires into the run.

    ⚠️ **TWO SECONDS, AND IT IS A PLAY NUMBER.** Long enough to find the stick again after a menu; any
    longer and the pause costs more than the interruption it was for.
  */
  resuming: {
    heading: 'Ready',
    pause: 'held',
    leads: false,
    stand: null,
    actions: [],
    choices: [],
    steps: false,
    dims: false,
    timeout: { steps: 2 * STEPS_PER_SECOND, then: 'playing' },
    pushed: false,
    skips: false,
    inRun: true,
    back: null,
    tabs: [],
    opensOn: 'action',
  },
};
