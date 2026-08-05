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
.itc-title, .itc-gameover {
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
.itc-title-shown, .itc-gameover-shown { display: flex; }
.itc-title-heading { font-size: clamp(1.75rem, 6vw, 3.5rem); letter-spacing: 0.02em; margin: 0; }
.itc-gameover-heading { font-size: clamp(1.5rem, 5vw, 2.75rem); margin: 0; }
.itc-title-action, .itc-gameover-action {
  font: inherit;
  padding: 0.6em 2em;
  border-radius: 0.4em;
  border: 2px solid currentColor;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.itc-title-action:hover, .itc-gameover-action:hover { background: rgba(255, 255, 255, 0.12); }
/*
  ⚠️ An outline OFFSET from the border, not a colour change. A focus ring that only recolours is
  invisible to the high-contrast and colour-blind palettes 0024 promises, and those palettes exist
  precisely so no cue is carried by colour alone.
*/
.itc-title-action:focus-visible, .itc-gameover-action:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
`;

/** A screen's overlay, and the control on it. */
interface Panel {
  root: HTMLElement;
  /** `null` for a screen the player does not act on. */
  action: HTMLButtonElement | null;
}

export interface Chrome {
  /** Everything to put on the page, in order. The stylesheet first. */
  elements: readonly HTMLElement[];
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

  return {
    elements,
    show(screen: Screen | null): void {
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
