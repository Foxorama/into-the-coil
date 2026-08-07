/**
 * The screens the player reads, as DOM over the canvas.
 *
 * ── WHY DOM AND NOT PAINTED INTO THE CANVAS ─────────────────────────────────────────────────────
 *
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` puts **actions, not keys** and an
 * operable interactive surface in the unconditional tier. A real `<button>` is focusable, reachable
 * by tab, announced by a screen reader, and activated by the platform's own conventions on three
 * device classes. A rectangle painted into a canvas is none of those, and every one of them would
 * have to be rebuilt by hand — badly, and only for the cases somebody remembered.
 *
 * It is also the precedent already set next door: `src/app/mount.ts` builds the rotate prompt as an
 * element for the same reason, and says so.
 *
 * ── WHY CLASSES, WHEN THE ROTATE PROMPT USES INLINE STYLES ──────────────────────────────────────
 *
 * ⚠️ **Because a focus ring cannot be written inline.** `:focus-visible` and `:hover` are states, and
 * an inline style has no way to express one. The rotate prompt has no control on it, so it never
 * needed a stylesheet; a screen with a button does, and a button whose focus is invisible fails the
 * floor above in the specific way keyboard players notice first.
 *
 * ── AND THEREFORE THE PREFIX RULE, WHICH 0017 DEFERRED TO EXACTLY THIS MOMENT ───────────────────
 *
 * `docs/decisions/0017-the-state-is-slices.md` deferred a class-prefix rule *"in the same commit as
 * the first screen's chrome, when there is real usage to prove the extraction against"*. This is that
 * commit. Every class here is `itc-<screen>-…`, because CSS class names and DOM ids are global while
 * the modules that write them cannot see each other — the predecessor took a real regression from
 * `.gs-hud` being shared between two different HUDs, and its own constitution cites the incident
 * twice. `tests/chrome.test.ts` is the guard.
 */

import { SCREENS, type Screen, type SettingName } from '../state/screens.ts';
import type { Palette } from '../content/palette.ts';
import { PICKUPS, PICKUP_KINDS } from '../content/pickups.ts';
import { SPRITE } from '../content/sprites.ts';
import { bakeAtlas } from '../render/bake.ts';
// The strip's width, from the file that hit-tests it. One number, or the picture and the hit region
// disagree — `docs/decisions/0060-a-trigger-is-a-place-on-the-glass.md`.
import { TAP_STRIP } from './touch.ts';

/**
 * The class prefix a screen's chrome owns.
 *
 * ⚠️ **The single description of the rule**, called by the builder below and by the guard in
 * `tests/chrome.test.ts` — never restated in either. An earlier draft of a guard in this repository
 * wrote its rule out twice, once in the scan and once in the fixture proving the scan, so the proof
 * tested a copy and would have gone on passing after the real one broke;
 * `docs/decisions/0017-the-state-is-slices.md` records that mistake against itself.
 *
 * Lowercased, because `itc-gameOver-heading` puts a capital in the middle of a CSS class for no
 * reason a stylesheet cares about.
 */
export function prefixFor(screen: Screen): string {
  return 'itc-' + screen.toLowerCase() + '-';
}

/**
 * The attribute naming which setting a strip of options belongs to.
 *
 * Exported for the same reason `prefixFor` is: it is a contract with a browser test, and a second
 * spelling of it in the test file is a contract kept in step by hand.
 */
export const SETTING_ATTR = 'data-itc-setting';

/**
 * The stylesheet, as one string.
 *
 * ⚠️ **Every selector in here is a class, and every class is prefixed.** No element selectors, no
 * ids, nothing that could reach outside this overlay — the page is also hosting a canvas and, on
 * itch.io, an iframe inside somebody else's document.
 */
const STYLE = `
/*
  ⚠️ **THE OVERLAY IS A SCROLL CONTAINER AND A QUERY CONTAINER, AND BOTH ARE LOAD-BEARING.**
  Decision 0049. It is a query container so every size below can be a fraction of THIS BOX rather
  than of the viewport — the box is the one the player is looking at, and on a page that embeds the
  game those are not the same number. It scrolls so that content which does not fit is reachable
  rather than lost, which is what the reported bug actually was.

  ⚠️ **No font here, and no padding either.** A container cannot query itself: a length in cq units
  written on this element resolves against its own nearest ANCESTOR container, which is the page.
  Everything sized against the short axis therefore lives on the panel below.
*/
.itc-title, .itc-gameover, .itc-cleared, .itc-victory {
  position: absolute;
  inset: 0;
  display: none;
  overflow: auto;
  container-type: size;
}
.itc-title-shown, .itc-gameover-shown, .itc-cleared-shown, .itc-victory-shown { display: flex; }
/*
  ── A SCREEN THAT DOES NOT DIM ──────────────────────────────────────────────────────────────────

  Decision 0063. The level break keeps the world running behind it, so its overlay must not paint
  over the scene and must not take the pointer — a full-bleed box across the playfield would swallow
  every drag the player makes with the thumb they are still steering with.

  ⚠️ **The CONTROL takes pointer events back**, so *Onward* is still pressable by a hand that wants
  to skip the break. That pair — none on the box, auto on the button — is the whole mechanism, and it
  is the same one the HUD uses one rule down.

  The background is set inline per screen by the builder, so nothing here has to know which is which.
*/
.itc-cleared { pointer-events: none; }
.itc-cleared-action { pointer-events: auto; }
/*
  ⚠️ **Centred by AUTO MARGINS, not by justify-content, and that is the fix rather than a style.** A
  flex item centred by the container is centred when it overflows too — half of it pushed off the
  START edge, where no scrollbar can reach it. That is precisely what the title screen did on a phone:
  the heading was off the top of the screen and the third tier was off the bottom. Auto margins
  distribute POSITIVE free space only, so an overflowing panel falls back to the top and scrolls.
*/
.itc-title-panel, .itc-gameover-panel, .itc-cleared-panel, .itc-victory-panel {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: min(1.5rem, 3.5cqh);
  /*
    ⚠️ **4cqh and not 5, and the change is about the SHORTEST screen only.** Both terms are a min, so
    a desktop is unaffected past a container about 800px tall; what moves is the phone, where 5cqh
    was spending 32 of 320 pixels on the margin of a full-bleed overlay. Decision 0049 says the chrome
    is authored against the short axis, and padding is the first thing that should give on it — ahead
    of type, which has a floor, and ahead of content, which is the screen.
  */
  padding: min(2rem, 4cqh) min(2rem, 4cqw);
  max-width: 100%;
  text-align: center;
  /*
    ⚠️ **A clamp and not a bare min: type has a FLOOR.** Sizing purely as a fraction of the box means
    a short enough box has 5px buttons, which "fit" in the sense that a photograph of them fits —
    decision 0024's accessibility floor is about the opposite of that. Below the floor the screen
    overflows instead, which is what the scroll container is for and what the suite asserts
    separately. (No file paths in this block: the prefix guard reads every dotted token here as a CSS
    class, so an extension fails as an unprefixed class name.)
  */
  font: 600 clamp(0.85rem, 5.4cqh, 1.25rem)/1.35 system-ui, sans-serif;
}
.itc-title-heading { font-size: clamp(1.25rem, min(6cqw, 9cqh), 3.5rem); letter-spacing: 0.02em; margin: 0; }
.itc-gameover-heading, .itc-cleared-heading, .itc-victory-heading {
  font-size: clamp(1.1rem, min(5cqw, 8cqh), 2.75rem);
  margin: 0;
}
/*
  THE TITLE SCREEN'S TWO COLUMNS — the key beside the choice, not above it.

  ⚠️ **The long axis is where a list goes.** Landscape is the shipped orientation
  (docs/decisions/0031), so the screen the game is read on is wide and SHORT — a phone gives about
  320 to 400 CSS pixels of height and two or three times that of width. Stacking six things down the
  short axis is what put half of them off the screen; the key and the tiers are independent, so they
  sit side by side and the scarce axis carries whichever is taller rather than their sum.

  ⚠️ **A GRID WITH FRACTIONAL COLUMNS, AND THE FIRST VERSION WAS A WRAPPING FLEX ROW THAT CI CAUGHT.**
  A flex row wraps when its items' NATURAL widths do not fit, and a natural width is a text
  measurement — so the layout held on the machine it was written on and stacked on the CI runner,
  where system-ui is a different font with wider metrics. Sixty-seven pixels off the bottom of a
  480x320 phone, from a font. Fractional tracks are a fraction of the container and cannot be pushed
  wider by their contents, so the two columns are two columns on every font there will ever be.

  ⚠️ **minmax(0, Nfr) and not a bare fr.** A track's default floor is its content's min-content
  width, which is the same blowout wearing grid syntax. (No backticks in this block: it is a template
  literal, and the house style's backtick quoting ends the string — twice now.)
*/
.itc-title-body {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 11fr);
  align-items: center;
  /*
    ⚠️ **The ROW gap is small and the COLUMN gap is not, and they stopped being one number when the
    settings became a row of their own.** There are exactly two rows here — the key beside the tiers,
    and the settings strip under both — so the row gap applies to nothing except the space above that
    strip. It is a subdued footer at 85% opacity and two thirds the type size, not a third peer, and
    the space above it should say so. Measured at 480x320 it is the difference between fitting and a
    scrollbar.
  */
  gap: min(0.4rem, 1.2cqh) min(2.5rem, 4cqw);
  width: 100%;
}
.itc-title-choices, .itc-gameover-choices, .itc-cleared-choices, .itc-victory-choices {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: min(1.5rem, 3.5cqh);
}
.itc-title-action, .itc-gameover-action, .itc-cleared-action, .itc-victory-action {
  font: inherit;
  padding: 0.55em 1em;
  border-radius: 0.4em;
  border: 2px solid currentColor;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
/*
  The hint under a control's label. A block, so it takes its own line inside the button rather than
  running on after it — three tiers whose names wrap into each other is a choice nobody can read at a
  glance, and the choice is the whole screen.
*/
.itc-title-action-hint {
  display: block;
  font-size: 0.62em;
  font-weight: 400;
  opacity: 0.72;
  margin-top: 0.3em;
}
/*
  The tiers are a column and they are wider than a one-word button, so they get a shared width. The
  order is the table's order, which is easiest first — see decision 0047.

  ⚠️ **A width rather than a min-width, and it is a fraction of its own COLUMN.** A minimum is a
  floor that content can push past, which is the wrapping mistake above in miniature; a full-width
  button is whatever the grid track turned out to be, so three tiers are always exactly as wide as
  each other and never wider than the space there is. The character cap is what stops a desktop
  drawing a button the width of a table.
*/
.itc-title-action { width: min(100%, 32ch); }
.itc-title-action:hover, .itc-gameover-action:hover, .itc-cleared-action:hover, .itc-victory-action:hover {
  background: rgba(255, 255, 255, 0.12);
}
/*
  ⚠️ An outline OFFSET from the border, not a colour change. A focus ring that only recolours is
  invisible to the high-contrast and colour-blind palettes 0024 promises, and those palettes exist
  precisely so no cue is carried by colour alone.

  ⚠️ **The -cursor classes sit in the SAME rule, and that is not tidiness.** A browser decides
  :focus-visible from how the focus arrived, and focus moved by the menu reader arrives by script —
  which most engines classify as not-visible, so a pad player would navigate a menu with no cursor
  in it at all. The chrome therefore sets a class of its own; and it has to draw the IDENTICAL ring,
  because two devices reaching the same control must not produce two pictures. A second rule saying
  the same thing in the same words is a second description, and this one was written that way first
  and immediately broke 0039's probe — which anchors on this declaration precisely because there was
  only ever one of it. See decision 0046.

  ⚠️ Neither backticks NOR file paths in here. It is a template literal, so a backtick ends the
  string; and the prefix guard reads every dotted token in this block as a CSS class, so a path with
  an extension on it fails as an unprefixed class name. Both were hit while writing this comment.
*/
.itc-title-action:focus-visible,
.itc-gameover-action:focus-visible,
.itc-cleared-action:focus-visible,
.itc-victory-action:focus-visible,
.itc-title-action-cursor,
.itc-gameover-action-cursor,
.itc-cleared-action-cursor,
.itc-victory-action-cursor {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
/*
  The countdown on a screen that expires. Small and beneath the control, because it is a fact about
  the screen rather than something to do — the voice rule in the product definition: say the one
  thing and stop.
*/
.itc-gameover-timer {
  font-size: clamp(0.7rem, min(2cqw, 3.2cqh), 1rem);
  font-weight: 400;
  opacity: 0.7;
  /* Reserves its own line so the button does not jump a pixel as the digit changes. */
  min-height: 1.4em;
}
.itc-title-key {
  display: grid;
  grid-template-columns: auto auto auto;
  /* Its own three columns centred inside whatever track it was given, so the two halves of the
     screen read as balanced rather than as a block shoved against the left of a wide one. */
  justify-content: center;
  gap: 0.4em 0.8em;
  align-items: center;
  font-size: clamp(0.7rem, min(2.2cqw, 4cqh), 1rem);
  font-weight: 400;
  opacity: 0.85;
}
.itc-title-key-icon { display: block; width: 1.6em; height: 1.6em; }
.itc-title-key-name { text-align: left; }
.itc-title-key-hint { text-align: left; opacity: 0.7; }
/*
  ⚠️ The HUD is NOT inside a screen's overlay. Those are absolutely positioned over the whole page
  and would swallow every pointer event on the playfield; this sits in a corner and takes no pointer
  events at all, because nothing on it is a control.
*/
.itc-playing-hud {
  position: absolute;
  top: 0;
  left: 0;
  display: none;
  gap: 1.2em;
  align-items: center;
  padding: 0.7em 1em;
  font: 600 clamp(0.8rem, 2vw, 1.05rem)/1 system-ui, sans-serif;
  pointer-events: none;
}
.itc-playing-hud-shown { display: flex; }
.itc-playing-hud-group { display: flex; gap: 0.35em; align-items: center; }
.itc-playing-hud-icon { display: block; width: 1.4em; height: 1.4em; }
/*
  ⚠️ A filled disc against a HOLLOW one, not two colours. Decision 0024 puts "colour never carries
  meaning alone" in the unconditional tier, and a shield readout is the most tempting place in the
  game to break it — full and empty are the same shape in two inks everywhere else in the genre.

  ⚠️ No backticks anywhere in this stylesheet. It is a template literal, and the house style's
  backtick-quoted file paths end the string — twice, while this block was being written.
*/
.itc-playing-hud-pip {
  width: 0.7em;
  height: 0.7em;
  border-radius: 50%;
  border: 2px solid currentColor;
  background: currentColor;
}
.itc-playing-hud-spent { background: transparent; }
/*
  ⚠️ **BELOW THE SHARED PANEL RULE, AND THAT IS THE WHOLE OF WHY IT WORKS.** The panel rule near the
  top sets margin: auto to centre every screen's content, so this has to beat it on source order —
  written earlier it lost the cascade silently and the banner went on sitting exactly where it was
  not wanted. Caught by measuring where the button actually landed, which is the only thing that
  could have caught it. Anything after it is free to be here as long as it is not about margins.

  The level break sits at the TOP because the middle is where the ship is: a banner centred over a
  playfield the player is still flying in covers the one part of the screen they cannot look away
  from. Auto on the bottom only, so it is a top margin rather than a centred box.
*/
.itc-cleared-panel { margin-top: min(1.5rem, 5cqh); margin-bottom: auto; }
/*
  ── A SETTING, OFFERED ──────────────────────────────────────────────────────────────────────────

  Decision 0070. A choice is not an action: it has a current value, the player can see which one is
  on, and pressing it leaves them where they were. So it is drawn as a labelled row of small buttons
  with the live one filled, rather than as another full-width control that looks like a way to start.

  ⚠️ Only the title screen has any, which is why only its prefix appears here. The builder is
  general — a screen that grows a choice gets its rules the same way its actions did.
*/
/*
  ⚠️ **Sized against the SHORT axis first** — decision 0049. On the smallest landscape phone the
  title screen is already within eleven pixels of needing a scrollbar, and a settings row is the kind
  of thing that gets added at a comfortable desktop size and quietly pushes a phone over the edge.
  It did, and the layout guard said so before anybody looked at a phone.
*/
/*
  ⚠️ **THE SETTINGS SIT BESIDE EACH OTHER AND WRAP, AND THEY STACKED UNTIL THERE WERE TWO.** The box
  had no rule of its own — one setting needs no arrangement — so the second one took a whole line of
  the shortest axis on the screen and pushed the smallest landscape phone six pixels into a
  scrollbar. The layout guard said so before a phone did, for the second time in two settings.

  A wrapping ROW rather than a shorter stack, because the shape has to survive the queue: the palette,
  reduced motion and flash intensity are all waiting, and five labelled rows down a 320px-tall screen
  is not a layout that can be shaved into working. Wrapped, they cost a line only when a line is what
  is left.
*/
.itc-title-settings-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  grid-column: 1 / -1;
  gap: 0.35em 1.2em;
}
.itc-title-settings {
  display: flex;
  align-items: center;
  gap: 0.5em;
  flex-wrap: wrap;
  font: 500 clamp(0.6rem, min(2cqw, 2.4cqh), 0.9rem)/1.1 system-ui, sans-serif;
  opacity: 0.85;
}
.itc-title-setting-label { opacity: 0.7; }
/* The key and the settings, stacked, as the left half of the title screen's two columns. */
.itc-title-column { display: flex; flex-direction: column; gap: 0.6em; min-width: 0; }
.itc-title-options { display: flex; gap: 0.4em; }
/*
  ⚠️ A FILLED button against a HOLLOW one, not two colours — decision 0024 puts "colour never carries
  meaning alone" in the unconditional tier, and which setting is on is exactly the kind of state a
  hue alone would hide.
*/
.itc-title-option {
  font: inherit;
  color: inherit;
  background: transparent;
  border: 2px solid currentColor;
  border-radius: 0.4em;
  padding: 0.15em 0.6em;
  cursor: pointer;
  opacity: 0.55;
}
/*
  ⚠️ **The fill comes from a CUSTOM PROPERTY and not from currentColor, and the difference is a
  black-on-black button.** currentColor in a background resolves against the element's OWN colour —
  which this rule has just set to the void — so the two lines would cancel and the label would
  vanish. The pair is set on the overlay by the builder, where the palette is.
*/
.itc-title-option-on {
  background: var(--itc-ink);
  color: var(--itc-void);
  opacity: 1;
}
/*
  ── THE FACE, WHICH IS THE UI HALF OF A STYLE ───────────────────────────────────────────────────

  Decision 0070: the ask is *"Retro UI / Modern UI"*, and a style that changed only the background
  would be a sky toggle with a misleading name. The stack lives here rather than in the style table
  for the reason the palette gives about inks: a font stack is a fact about a browser, and a second
  copy of it in a content row drifts the day one of them gains a fallback.

  ⚠️ No file paths in this stylesheet — the prefix guard reads every dotted token as a class name.
*/
.itc-title-face-pixel,
.itc-gameover-face-pixel,
.itc-cleared-face-pixel,
.itc-victory-face-pixel,
.itc-playing-face-pixel {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  letter-spacing: 0.06em;
}
/*
  ── THE TAP STRIP, DRAWN ────────────────────────────────────────────────────────────────────────

  Decision 0060. Reported from play: *"how do you fire bombs on mobile? I can do one and then can't
  fire any more."* Half of that was a dead band; this is the other half — the live one was never
  drawn, so where to press was a guess.

  ⚠️ **pointer-events: none, on every part of it.** The bands are a PICTURE of where the canvas is
  listening, not controls of their own. A real button here would take the tap away from the touch
  source, which is also what owns not-stealing-the-drag — and the two would then disagree about what
  a second finger means.

  ⚠️ **The geometry is the tap zone's, read from the same two numbers.** TAP_STRIP is the width and
  the band count comes from bandCount, so the picture cannot drift from the hit test.

  ⚠️ No file paths anywhere in this stylesheet: the prefix guard reads every dotted token in it as a
  CSS class, so an extension fails as an unprefixed class name. Hit again while writing this block.
*/
.itc-playing-strip {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: none;
  flex-direction: column;
  pointer-events: none;
  font: 600 clamp(0.7rem, 2vw, 1rem)/1 system-ui, sans-serif;
}
.itc-playing-strip-shown { display: flex; }
/*
  A dashed edge, because a solid one reads as a wall in a game whose whole subject is where the walls
  are. Only the leading edge is drawn: the strip's outer three sides are the screen.
*/
.itc-playing-strip-band {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3em;
  border-left: 2px dashed currentColor;
  border-bottom: 2px dashed currentColor;
  opacity: 0.45;
}
.itc-playing-strip-band:last-child { border-bottom: none; }
.itc-playing-strip-icon { display: block; width: 1.6em; height: 1.6em; }
`;

/** A screen's overlay, the controls on it, and whatever else it has to say. */
interface Panel {
  root: HTMLElement;
  /**
   * The controls, in the order `SCREENS` lists them. Empty for a screen the player does not act on.
   *
   * ⚠️ **A list even though every screen has one today.** `src/state/screens.ts` says why the row is
   * a list; this is where a focus ring becomes possible at all, and a ring over one control is
   * exactly what a pad needs on the screens that exist —
   * `docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md`.
   */
  controls: readonly HTMLButtonElement[];
  /** Where the countdown is written, for a screen that has one. `null` for a screen that waits. */
  timer: HTMLElement | null;
  /**
   * The option buttons, per setting the screen offers — decision 0070.
   *
   * ⚠️ **Kept apart from `controls` even though every one of them is also IN `controls`.** The
   * focus ring needs one flat list; painting which option is on needs them grouped by setting. One
   * list cannot be both without the painter re-deriving the grouping from an index, which is the
   * second description this file already refuses elsewhere.
   */
  options: Partial<Readonly<Record<SettingName, readonly HTMLButtonElement[]>>>;
}

/**
 * The resolution the chrome's own icons are baked at, in pixels per world unit.
 *
 * ⚠️ **Its own bake, deliberately not the atlas the game is drawing with.** That one is re-baked on
 * every rotation and DPI change (`src/app/mount.ts`), and its bitmaps are the live objects the
 * painter blits — appending one to the DOM would take it out of the atlas. This is a second bake at
 * a fixed size, and it costs one pass over the sprite list at boot.
 *
 * ⚠️ **The icons are still the REAL art**, which is the whole point: a key drawn with hand-written
 * SVG would be a second description of every silhouette, and the day an art pass changed one the key
 * would quietly go on showing the old shape. `src/content/sprites.ts` records what a second
 * description of the sprite table already cost this project once.
 *
 * ⚠️ **28 and not 12, and the difference was looked at rather than reasoned about.** The icons render
 * at roughly 20 CSS pixels, so 12 per unit produced a source barely larger than its destination and
 * the life icon showed visible pixel steps at the top of the screen. Baking well above the drawn size
 * costs a few kilobytes once and is what the whole bake-and-blit pipeline is for — art that is a
 * function of resolution rather than a fixed asset (0022).
 */
const ICON_PIXELS_PER_UNIT = 28;

export interface Chrome {
  /** Everything to put on the page, in order. The stylesheet first. */
  elements: readonly HTMLElement[];
  /**
   * Redraw the in-game readout. Called on a change, never per frame.
   *
   * ⚠️ **`charges` is what the player can SPEND**, and it is the third thing on the row because it
   * is the third resource a run has: lives survive everything, the shell survives until it is hit,
   * and a bomb survives until it is thrown. A triggered weapon whose count is invisible is a weapon
   * the player will not use — which is 0045's whole argument, reaching the arsenal.
   */
  setHud(lives: number, health: number, maxHealth: number, charges: number): void;
  /**
   * Show exactly one screen's chrome and hide the rest. `null` shows none of it, which is what the
   * rotate gate needs — an overlay left visible under the gate is a focusable button on a page whose
   * whole message is that the game is not running.
   */
  show(screen: Screen | null): void;
  /**
   * Move the focus by `delta` controls on the screen currently shown.
   *
   * ⚠️ **Wraps, and does not clamp.** A ring of controls has no end to get stuck against, which is
   * what a player pushing a stick expects; a clamp makes the last control feel broken.
   */
  move(delta: number): void;
  /** Press the focused control, exactly as a click would. */
  activate(): void;
  /**
   * Draw the tap strip: one band per trigger that has a weapon behind it, in trigger order.
   *
   * ⚠️ **A PICTURE OF WHERE `src/app/touch.ts` IS LISTENING**, and nothing more — the bands take no
   * pointer events, so the canvas underneath still hears every tap. Two answers to *where is the
   * bomb* would be worse than one wrong one, and a real `<button>` here would take the tap away from
   * the file that also owns not-stealing-the-drag.
   *
   * An empty list hides it, which is what a device with no touch gets —
   * `docs/decisions/0060-a-trigger-is-a-place-on-the-glass.md`.
   */
  setTriggers(triggers: readonly { label: string; sprite: number; charges: number }[]): void;
  /**
   * Say how long the shown screen has left, in whole seconds, or `null` for a screen that waits.
   *
   * Called on a change of the displayed number — once a second at most — so it may be ordinary DOM
   * code, on the same terms as `setHud`.
   */
  setTimer(seconds: number | null): void;
  /**
   * Say which option of a setting is currently on, so the row can show it — decision 0070.
   *
   * ⚠️ **Pushed in rather than read out.** The chrome holds no state about a setting; it is told,
   * on the same terms as `setHud`. A chrome that remembered which style was on would be a second
   * copy of `src/state/slices/settings.ts`, and the two would disagree the first time anything
   * dispatched without going through here.
   */
  setChoice(name: SettingName, index: number): void;
  /**
   * Switch the chrome's typeface role — the UI half of a style, decision 0070.
   *
   * A class on every overlay rather than on the document, because the build puts this stylesheet in
   * a page it does not own (0003) and a rule on `body` would reach past the game.
   */
  setFace(face: 'pixel' | 'clean'): void;
  /** Drop every listener. */
  release(): void;
}

/**
 * Screens that get an overlay.
 *
 * ⚠️ **Derived from the table, never listed again here.** A screen with no heading and no action has
 * nothing to draw — that is `playing`, and it is decided by `src/state/screens.ts` rather than by a
 * second list in the shell that would have to be kept in step with it.
 */
function hasChrome(screen: Screen): boolean {
  const row = SCREENS[screen];
  return row.heading.length > 0 || row.actions.length > 0;
}

/**
 * Build every screen's chrome. `onAction` is fired with the screen whose control was pressed.
 *
 * Allocates freely: this runs once at boot, from `mount.ts`, which is on
 * `tests/budget.test.ts`'s deliberately-cold list.
 */
export function makeChrome(
  colours: Palette,
  onAction: (screen: Screen, index: number) => void,
  onChoice: (name: SettingName, index: number) => void,
): Chrome {
  const style = document.createElement('style');
  style.textContent = STYLE;

  /** The chrome's own icons, at a fixed size, copied out of a bake so the atlas keeps its own. */
  const icons = bakeAtlas(colours, 'side', ICON_PIXELS_PER_UNIT);
  const iconOf = (sprite: number): HTMLCanvasElement => {
    const source = icons.bitmaps[sprite];
    const canvas = document.createElement('canvas');
    const size = Math.max(8, Math.round(icons.extents[sprite]! * ICON_PIXELS_PER_UNIT));
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx !== null && source !== undefined) ctx.drawImage(source, 0, 0, size, size);
    return canvas;
  };

  const panels: Partial<Record<Screen, Panel>> = {};
  const elements: HTMLElement[] = [style];
  const listeners: (() => void)[] = [];

  for (const screen of Object.keys(SCREENS) as Screen[]) {
    if (!hasChrome(screen)) continue;
    const row = SCREENS[screen];
    const prefix = prefixFor(screen);
    const root = document.createElement('div');
    // Trailing `-` trimmed for the block itself, so the overlay is `itc-title` and its parts are
    // `itc-title-heading`. Still one prefix, still one description of it.
    root.className = prefix.slice(0, -1);
    /*
      ⚠️ **Only a screen that DIMS paints over the scene** — decision 0063. A screen that keeps the
      world running is a banner, and a banner filling itself with the space colour would hide exactly
      the thing it is a banner over. The stylesheet cannot say this, because it is a fact about the
      screen rather than about the class.
    */
    if (row.dims) root.style.background = colours.space;
    root.style.color = colours.player;
    // The two inks a filled control needs, where the palette is. Custom properties rather than a
    // second stylesheet: the palette is chosen at runtime and a static rule cannot know it.
    root.style.setProperty('--itc-ink', colours.player);
    root.style.setProperty('--itc-void', colours.space);

    /*
      THE PANEL — everything the screen says, in one box that the overlay centres.

      ⚠️ **A wrapper rather than laying the children out on the overlay directly**, because the
      overlay has two other jobs now: it is the scroll container and the query container
      (decision 0049), and a scroll container cannot centre its own overflowing content safely. One
      child with `margin: auto` can, and it is the same element every screen scrolls.
    */
    const panel = document.createElement('div');
    panel.className = prefix + 'panel';
    root.appendChild(panel);

    const heading = document.createElement('h1');
    heading.className = prefix + 'heading';
    heading.textContent = row.heading;
    panel.appendChild(heading);

    /*
      The controls' own box. On the title screen it is a column BESIDE the key rather than under it —
      see the stylesheet, and decision 0049 for why the short axis decides that. Every other screen
      has one control and the box is a formality, which is the point: one description of where a
      screen's controls go.
    */
    const choices = document.createElement('div');
    choices.className = prefix + 'choices';

    /*
      The settings' own box — decision 0070.

      ⚠️ **It rides with the KEY and not with the controls, and that is a fit rather than a taste.**
      On the title screen the two columns are the key and the tier buttons, and the buttons are the
      taller of the two: a row added under them makes the panel taller and the smallest landscape
      phone starts scrolling, which decision 0049 refuses. Under the key it costs nothing, because the
      key column has the headroom. The layout guard is what found that, at nine pixels.
    */
    const settingsBox = document.createElement('div');
    settingsBox.className = prefix + 'settings-box';

    /*
      ⚠️ **THE KEY, ON THE TITLE SCREEN ONLY, AND IT IS THE UPGRADES AND NOT THE ENEMIES.** Asked for
      in play: *"on the intro starting screen we need a quick user key of what each upgrade does. We
      don't need a key for the enemies, but knowing that the upgrades are good pickups is important."*

      That asymmetry is right and worth writing down: an enemy announces itself by shooting at you, so
      the game teaches it in the only way that sticks. A pickup announces nothing — it is a small
      shape in a lane, and a player who does not already know it is good will not fly across the lane
      to find out.

      Built by walking `PICKUP_KINDS`, so a pickup added to the table appears here without anybody
      remembering to come and add it.
    */
    if (screen === 'title') {
      const key = document.createElement('div');
      key.className = prefix + 'key';
      for (const pickup of PICKUP_KINDS) {
        const row = PICKUPS[pickup];
        const icon = iconOf(row.sprite);
        icon.className = prefix + 'key-icon';
        // Decorative: the name beside it is the accessible text, and a screen reader announcing
        // "canvas" before every row would be noise rather than information.
        icon.setAttribute('aria-hidden', 'true');
        const name = document.createElement('span');
        name.className = prefix + 'key-name';
        name.textContent = row.label;
        const hint = document.createElement('span');
        hint.className = prefix + 'key-hint';
        hint.textContent = row.hint;
        key.append(icon, name, hint);
      }
      const column = document.createElement('div');
      column.className = prefix + 'column';
      column.append(key);
      const body = document.createElement('div');
      body.className = prefix + 'body';
      /*
        ⚠️ **THE SETTINGS ARE A FULL-WIDTH ROW UNDER BOTH COLUMNS, AND THEY RODE IN THE LEFT ONE
        UNTIL THERE WERE TWO** — `docs/decisions/0072-a-cue-is-baked-and-played.md`. 0070 put the
        style beside the pickup key because that column had the slack; measured at 480x320, the key
        is 191px against the tiers' 214, so the slack is 23px and two stacked settings want 51.

        Across the whole body they are 225px wide against 442 available, so they fit on one line —
        the deficit was vertical and the space that was going spare was horizontal.
      */
      body.append(column, choices, settingsBox);
      panel.appendChild(body);
    } else {
      panel.appendChild(choices);
      panel.appendChild(settingsBox);
    }

    /*
      The controls, one per label the row carries.

      ⚠️ **`click` is the ONE activation path, and the pad goes through it too** — `activate` below
      calls `.click()` rather than reaching for `onAction` itself. Two paths to the same effect is
      two places for a screen to start a run without resetting something, and this project has
      already paid once for two descriptions of one fact (`src/content/sprites.ts`).
    */
    const controls: HTMLButtonElement[] = [];
    row.actions.forEach((action, index) => {
      const control = document.createElement('button');
      control.type = 'button';
      control.className = prefix + 'action';
      control.textContent = action.label;
      /*
        The hint, INSIDE the button so it is part of what the control announces itself as.

        ⚠️ **Beside it would be a second thing to focus and a second thing to tab past**, and the
        hint is not a thing to do — it is what the control means. A `<span>` in the accessible name
        is read as one phrase by a screen reader, which is exactly the reading a sighted player gets.
      */
      if (action.hint.length > 0) {
        const hint = document.createElement('span');
        hint.className = prefix + 'action-hint';
        hint.textContent = action.hint;
        control.appendChild(hint);
      }
      const onClick = (): void => onAction(screen, index);
      control.addEventListener('click', onClick);
      listeners.push(() => control.removeEventListener('click', onClick));
      choices.appendChild(control);
      controls.push(control);
    });

    /*
      THE SETTINGS THIS SCREEN OFFERS — decision 0070.

      ⚠️ **Appended to `controls` AFTER the actions, so the focus ring reaches them and starts
      nowhere near them.** `show` puts the cursor back on control zero every time a screen appears
      (0046), so a pad user who presses confirm on arriving still starts a run; the settings are one
      move further on, which is where a thing you change once belongs.

      ⚠️ **Each option captures its own position and nothing else.** `src/state/screens.ts` says an
      option carries no value — the content hub's order IS the value — so the shell narrows an index
      against its own table rather than this file narrowing a string.
    */
    const options: Partial<Record<SettingName, HTMLButtonElement[]>> = {};
    for (const choice of row.choices) {
      const line = document.createElement('div');
      line.className = prefix + 'settings';
      const label = document.createElement('span');
      label.className = prefix + 'setting-label';
      label.textContent = choice.label;
      const box = document.createElement('div');
      box.className = prefix + 'options';
      /*
        ⚠️ **WHICH setting this strip belongs to, on the element rather than in a position** — added
        with the second setting (`docs/decisions/0072-a-cue-is-baked-and-played.md`), because with one
        there was no question to answer. `tests/style.browser.test.ts` had been reaching for *the nth
        option on the title screen*, which was exact while every option belonged to the same row and
        became a test about whichever setting happened to be listed first.

        A `data-` attribute rather than a class, on the same terms as `mount.ts`'s rotate gate: a
        class is a styling hook a later art pass may rename, and this is a contract with a test.
      */
      box.setAttribute(SETTING_ATTR, choice.name);
      const buttons: HTMLButtonElement[] = [];
      choice.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = prefix + 'option';
        button.textContent = option.label;
        // The hint is the accessible description rather than visible text: the row is a strip of
        // small buttons, and a sentence under each one would be a paragraph where a word will do.
        if (option.hint.length > 0) button.title = option.hint;
        const press = (): void => onChoice(choice.name, index);
        button.addEventListener('click', press);
        listeners.push(() => button.removeEventListener('click', press));
        box.append(button);
        buttons.push(button);
        controls.push(button);
      });
      options[choice.name] = buttons;
      line.append(label, box);
      settingsBox.appendChild(line);
    }

    /*
      The countdown, for a screen that expires.

      `aria-live="off"`: it is announced once by the button's own label and re-announcing a number
      every second would talk over everything else on the screen. A screen reader user who wants it
      can read it; one who does not is not interrupted seven times.
    */
    let timer: HTMLElement | null = null;
    /*
      ⚠️ **Only a DIMMING screen gets one, and that is a relationship rather than a filter.** A screen
      that has stopped the world owes the player a number saying when it will stop doing that; a
      banner over a world that never stopped does not, and a countdown on one would be exactly the
      *restating what the screen already shows* `docs/game.md` bans. Decision 0063.
    */
    if (row.timeout !== null && row.dims) {
      timer = document.createElement('div');
      timer.className = prefix + 'timer';
      timer.setAttribute('aria-live', 'off');
      panel.appendChild(timer);
    }

    panels[screen] = { root, controls, timer, options };
    elements.push(root);
  }

  /*
    ── THE IN-GAME READOUT ─────────────────────────────────────────────────────────────────────────

    Asked for in play: *"in game we need a life and shield tracker icons so the player has a clue."*

    ⚠️ **"Shield" is the ship's health, and it is the player's word rather than the code's.** There is
    also a `shield` in `src/content/specials.ts` — a special that absorbs a hit — and nothing triggers
    one yet. If both ever exist at once it is the SPECIAL that gets renamed, because this is the word
    a player already used for the thing that keeps them alive.

    ⚠️ **Built once and mutated, never rebuilt.** `setHud` is called on a change rather than on a
    frame (`src/app/frame.ts` only fires `onHealth` when the number actually moves), but rebuilding
    the pip row from scratch on every hit would still churn layout for no reason. The pips exist from
    boot at the ship's full health; a hit toggles a class.
  */
  const hud = document.createElement('div');
  hud.className = 'itc-playing-hud';
  hud.style.color = colours.player;

  const livesGroup = document.createElement('div');
  livesGroup.className = 'itc-playing-hud-group';
  const livesIcon = iconOf(PICKUPS.extraLife.sprite);
  livesIcon.className = 'itc-playing-hud-icon';
  livesIcon.setAttribute('aria-hidden', 'true');
  const livesCount = document.createElement('span');
  livesGroup.append(livesIcon, livesCount);

  const bombGroup = document.createElement('div');
  bombGroup.className = 'itc-playing-hud-group';
  const bombIcon = iconOf(SPRITE.bomb);
  bombIcon.className = 'itc-playing-hud-icon';
  bombIcon.setAttribute('aria-hidden', 'true');
  const bombCount = document.createElement('span');
  bombGroup.append(bombIcon, bombCount);

  const shieldGroup = document.createElement('div');
  shieldGroup.className = 'itc-playing-hud-group';
  // `role="img"` with a label, because a row of divs is not something a screen reader can read and
  // the number is what matters — 0024's floor is that every cue has a twin, not that it is visual.
  shieldGroup.setAttribute('role', 'img');
  const pips: HTMLElement[] = [];
  hud.append(livesGroup, shieldGroup, bombGroup);
  elements.push(hud);

  /*
    ── WHERE TO PRESS, ON A DEVICE WHERE THAT IS A PLACE RATHER THAN A KEY ─────────────────────────

    Decision 0060. Its width is `TAP_STRIP`, imported from the file that hit-tests it rather than
    written again here — the picture and the hit test are one number, or the player presses what they
    can see and something else happens.
  */
  const strip = document.createElement('div');
  strip.className = 'itc-playing-strip';
  strip.style.color = colours.player;
  strip.style.width = String(TAP_STRIP * 100) + '%';
  // Decorative twice over: it is a picture of a hit region, and the HUD already announces the
  // charges. A screen reader user is not tapping a band they cannot see the edges of.
  strip.setAttribute('aria-hidden', 'true');
  /** One band per trigger, grown once and reused — `setHud`'s argument about churning layout. */
  const bands: { root: HTMLElement; icon: HTMLElement; count: HTMLElement }[] = [];
  elements.push(strip);

  /*
    ── THE FOCUS RING ──────────────────────────────────────────────────────────────────────────────

    Which screen is up, and which of its controls the focus is on.

    ⚠️ **Held here rather than read back from `document.activeElement`.** The browser's idea of focus
    is lost the moment the player taps the canvas — a touch on the playfield blurs the button — and a
    pad pressed afterwards would then have nowhere to start from. This is the chrome's own answer and
    it survives anything the player does with another device.
  */
  let shownScreen: Screen | null = null;
  let focused = 0;
  /** The faces the strip is currently built from, so it is rebuilt on a change and not per call. */
  let bandFaces: number[] = [];

  /** Show the strip only where it is true: on the playing screen, with something behind a trigger. */
  const paintStrip = (): void => {
    strip.classList.toggle('itc-playing-strip-shown', shownScreen === 'playing' && bands.length > 0);
  };

  const paintFocus = (): void => {
    const panel = shownScreen === null ? undefined : panels[shownScreen];
    if (panel === undefined) return;
    for (let i = 0; i < panel.controls.length; i++) {
      const control = panel.controls[i]!;
      control.classList.toggle(prefixFor(shownScreen!) + 'action-cursor', i === focused);
      // Focus the element as well, so the keyboard, the screen reader and the pad all agree about
      // where the player is — one cursor, three devices.
      if (i === focused) control.focus();
    }
  };

  return {
    elements,
    setHud(lives: number, health: number, maxHealth: number, charges: number): void {
      livesCount.textContent = '×' + String(Math.max(0, lives));
      bombCount.textContent = '×' + String(Math.max(0, charges));
      bombGroup.setAttribute('aria-label', String(Math.max(0, charges)) + ' bombs');
      livesGroup.setAttribute('aria-label', String(Math.max(0, lives)) + ' lives');
      // Grown once, to whatever the ship's full health turns out to be. A later ship with a different
      // maximum is a table edit, not a rewrite of this.
      while (pips.length < maxHealth) {
        const pip = document.createElement('div');
        pip.className = 'itc-playing-hud-pip';
        pips.push(pip);
        shieldGroup.appendChild(pip);
      }
      for (let i = 0; i < pips.length; i++) {
        pips[i]!.classList.toggle('itc-playing-hud-spent', i >= health);
      }
      shieldGroup.setAttribute('aria-label', 'Shield ' + String(Math.max(0, health)) + ' of ' + String(maxHealth));
    },
    setTriggers(triggers: readonly { label: string; sprite: number; charges: number }[]): void {
      /*
        ⚠️ **Rebuilt on a change of the FACES, not on every call.** `setTriggers` rides `setHud`, which
        fires whenever a charge is spent — several times a run — and replacing three elements to write
        a number into one of them is the layout churn the pips already refuse.
      */
      const same = triggers.length === bandFaces.length && triggers.every((t, i) => t.sprite === bandFaces[i]);
      if (!same) {
        strip.replaceChildren();
        bands.length = 0;
        for (const trigger of triggers) {
          const band = document.createElement('div');
          band.className = 'itc-playing-strip-band';
          const icon = iconOf(trigger.sprite);
          icon.className = 'itc-playing-strip-icon';
          const count = document.createElement('span');
          band.append(icon, count);
          strip.appendChild(band);
          bands.push({ root: band, icon, count });
        }
        bandFaces = triggers.map((t) => t.sprite);
      }
      // Terse, per `docs/game.md`'s voice rule: the icon says what it is and this says how many are
      // left. No label — the title screen's key is where a thing gets a name.
      for (let i = 0; i < bands.length; i++) {
        bands[i]!.count.textContent = '×' + String(Math.max(0, triggers[i]?.charges ?? 0));
      }
      paintStrip();
    },
    show(screen: Screen | null): void {
      /*
        ⚠️ **Shown while the SIMULATION runs, not while the screen is `playing`** — decision 0063. The
        level break steps the world, so the player is still flying and still spending charges, and a
        readout that vanished for it would be the one moment in the game where what they are carrying
        is invisible.
      */
      hud.classList.toggle('itc-playing-hud-shown', screen !== null && SCREENS[screen].steps);
      for (const name of Object.keys(panels) as Screen[]) {
        const panel = panels[name];
        if (panel === undefined) continue;
        const shown = name === screen;
        panel.root.classList.toggle(prefixFor(name) + 'shown', shown);
      }
      shownScreen = screen;
      paintStrip();
      // Back to the first control every time a screen appears. A remembered position on a screen the
      // player has left is a cursor sitting somewhere nobody put it.
      focused = 0;
      paintFocus();
    },
    move(delta: number): void {
      const panel = shownScreen === null ? undefined : panels[shownScreen];
      const count = panel?.controls.length ?? 0;
      if (count === 0) return;
      // `+ count` before the modulo: JavaScript's `%` keeps the sign of the left operand, so a
      // backwards move off the first control would land on −1 and focus nothing.
      focused = (focused + delta + count) % count;
      paintFocus();
    },
    activate(): void {
      const panel = shownScreen === null ? undefined : panels[shownScreen];
      panel?.controls[focused]?.click();
    },
    setTimer(seconds: number | null): void {
      const panel = shownScreen === null ? undefined : panels[shownScreen];
      const timer = panel?.timer;
      if (timer === undefined || timer === null) return;
      // Terse, per `docs/game.md`: the screen already says the run is over, so this says only how
      // long it will keep saying it.
      timer.textContent = seconds === null ? '' : String(seconds);
    },
    setChoice(name: SettingName, index: number): void {
      for (const screen of Object.keys(panels) as Screen[]) {
        const buttons = panels[screen]?.options[name];
        if (buttons === undefined) continue;
        for (let i = 0; i < buttons.length; i++) {
          buttons[i]!.classList.toggle(prefixFor(screen) + 'option-on', i === index);
        }
      }
    },
    setFace(face: 'pixel' | 'clean'): void {
      /*
        ⚠️ **Toggled on every screen's overlay and on the readout**, because a face that changed on
        the title and not in the game would be the setting half-applied — and the readout is the one
        piece of chrome the player looks at while flying.
      */
      for (const screen of Object.keys(panels) as Screen[]) {
        panels[screen]?.root.classList.toggle(prefixFor(screen) + 'face-pixel', face === 'pixel');
      }
      hud.classList.toggle(prefixFor('playing') + 'face-pixel', face === 'pixel');
      strip.classList.toggle(prefixFor('playing') + 'face-pixel', face === 'pixel');
    },
    release(): void {
      for (const drop of listeners) drop();
    },
  };
}
