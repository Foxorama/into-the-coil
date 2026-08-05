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

import { SCREENS, type Screen } from '../state/screens.ts';
import type { Palette } from '../content/palette.ts';
import { PICKUPS, PICKUP_KINDS } from '../content/pickups.ts';
import { bakeAtlas } from '../render/bake.ts';

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
 * The stylesheet, as one string.
 *
 * ⚠️ **Every selector in here is a class, and every class is prefixed.** No element selectors, no
 * ids, nothing that could reach outside this overlay — the page is also hosting a canvas and, on
 * itch.io, an iframe inside somebody else's document.
 */
const STYLE = `
.itc-title, .itc-gameover, .itc-cleared, .itc-victory {
  position: absolute;
  inset: 0;
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  text-align: center;
  padding: 2rem;
  font: 600 1.25rem/1.4 system-ui, sans-serif;
}
.itc-title-shown, .itc-gameover-shown, .itc-cleared-shown, .itc-victory-shown { display: flex; }
.itc-title-heading { font-size: clamp(1.75rem, 6vw, 3.5rem); letter-spacing: 0.02em; margin: 0; }
.itc-gameover-heading, .itc-cleared-heading, .itc-victory-heading {
  font-size: clamp(1.5rem, 5vw, 2.75rem);
  margin: 0;
}
.itc-title-action, .itc-gameover-action, .itc-cleared-action, .itc-victory-action {
  font: inherit;
  padding: 0.6em 2em;
  border-radius: 0.4em;
  border: 2px solid currentColor;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.itc-title-action:hover, .itc-gameover-action:hover, .itc-cleared-action:hover, .itc-victory-action:hover {
  background: rgba(255, 255, 255, 0.12);
}
/*
  ⚠️ An outline OFFSET from the border, not a colour change. A focus ring that only recolours is
  invisible to the high-contrast and colour-blind palettes 0024 promises, and those palettes exist
  precisely so no cue is carried by colour alone.
*/
.itc-title-action:focus-visible,
.itc-gameover-action:focus-visible,
.itc-cleared-action:focus-visible,
.itc-victory-action:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
.itc-title-key {
  display: grid;
  grid-template-columns: auto auto auto;
  gap: 0.4em 0.8em;
  align-items: center;
  font-size: clamp(0.75rem, 2vw, 1rem);
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
`;

/** A screen's overlay, and the control on it. */
interface Panel {
  root: HTMLElement;
  /** `null` for a screen the player does not act on. */
  action: HTMLButtonElement | null;
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
  /** Redraw the in-game readout. Called on a change, never per frame. */
  setHud(lives: number, health: number, maxHealth: number): void;
  /**
   * Show exactly one screen's chrome and hide the rest. `null` shows none of it, which is what the
   * rotate gate needs — an overlay left visible under the gate is a focusable button on a page whose
   * whole message is that the game is not running.
   */
  show(screen: Screen | null): void;
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
  return row.heading.length > 0 || row.action !== null;
}

/**
 * Build every screen's chrome. `onAction` is fired with the screen whose control was pressed.
 *
 * Allocates freely: this runs once at boot, from `mount.ts`, which is on
 * `tests/budget.test.ts`'s deliberately-cold list.
 */
export function makeChrome(colours: Palette, onAction: (screen: Screen) => void): Chrome {
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
    root.style.background = colours.space;
    root.style.color = colours.player;

    const heading = document.createElement('h1');
    heading.className = prefix + 'heading';
    heading.textContent = row.heading;
    root.appendChild(heading);

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
      root.appendChild(key);
    }

    let action: HTMLButtonElement | null = null;
    if (row.action !== null) {
      action = document.createElement('button');
      action.type = 'button';
      action.className = prefix + 'action';
      action.textContent = row.action;
      const onClick = (): void => onAction(screen);
      action.addEventListener('click', onClick);
      listeners.push(() => action?.removeEventListener('click', onClick));
      root.appendChild(action);
    }

    panels[screen] = { root, action };
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

  const shieldGroup = document.createElement('div');
  shieldGroup.className = 'itc-playing-hud-group';
  // `role="img"` with a label, because a row of divs is not something a screen reader can read and
  // the number is what matters — 0024's floor is that every cue has a twin, not that it is visual.
  shieldGroup.setAttribute('role', 'img');
  const pips: HTMLElement[] = [];
  hud.append(livesGroup, shieldGroup);
  elements.push(hud);

  return {
    elements,
    setHud(lives: number, health: number, maxHealth: number): void {
      livesCount.textContent = '×' + String(Math.max(0, lives));
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
    show(screen: Screen | null): void {
      hud.classList.toggle('itc-playing-hud-shown', screen === 'playing');
      for (const name of Object.keys(panels) as Screen[]) {
        const panel = panels[name];
        if (panel === undefined) continue;
        const shown = name === screen;
        panel.root.classList.toggle(prefixFor(name) + 'shown', shown);
        // Focus the control the moment its screen appears, so a keyboard player never has to find
        // it and a screen reader announces the one thing there is to do.
        if (shown && panel.action !== null) panel.action.focus();
      }
    },
    release(): void {
      for (const drop of listeners) drop();
    },
  };
}
