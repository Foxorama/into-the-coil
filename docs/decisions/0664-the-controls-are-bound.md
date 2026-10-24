# 0664 — The controls are bound

**Accepted 2026-10-24.** From [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), item 16.

## The ask

> *"Controls config for keyboard + gamepad in settings. Need to make sure it saves properly."*

## The rule

- **A Controls tab beside Settings** — `controls` in `src/state/screens.ts`, between Settings and How to play on
  all four tabs' strips. A button per thing a hand can be bound to, in `CONTROL_ROWS`' order: the four ways to fly
  and the three triggers on the keyboard, then the three triggers on the pad; then *Reset to defaults* and *Back*.
  Each button's line under its name says what it is bound to now.
- **A press listens; the next key or pad button is the binding** — `src/app/mount.ts`. A key is taken in the
  capture phase and stopped there, so the key the tab is listening for is its answer and nothing else's: not the
  menu's step, not Back, not a trigger. A pad row takes the first button pressed since it began listening, read in
  `onIdle` before the menu's own reading, which does not hear it. Escape, or the pad's Back or Start, keeps what was
  there; leaving the tab stops it listening.
- **What may be bound** — on the keyboard, any key but Escape (Back and the pause), P (the pause) and Tab (the
  page's focus), `RESERVED_KEYS` in `src/content/actions.ts`, which says *"P is the menu's — press another"*. On the
  pad, the faces, the bumpers, the triggers and the stick presses (`BINDABLE_PAD_BUTTONS`); not Back and Start, which
  are the menu's, and not the cross, which walks it. Movement on the pad is the sticks and is not bound.
- **A binding never leaves a key on two actions or an action on none** — `bindKey`: the action gets the key alone,
  another action that had it gives it up, and one left with nothing takes what the rebound action had. `bindButton`
  swaps two triggers' buttons. Both in the content table, so the reducer and the save read one rule.
- **Kept with the settings** — `keys` and `pad` on the settings slice, written in `itc_settings` on 0512's
  per-field terms (no new version). Read back all or nothing: every action one or two keys of a code's shape, none
  reserved and none on two actions; every trigger a bindable button and none on two. A document that fails reads as
  the defaults, whole — a binding read half-right is a game some key does not work in.
- **Heard at once** — the keyboard's source is bound again when the keys change (`rebind` in `src/app/input.ts`,
  which lets go of every key so nothing stays held under a binding it no longer has); the pad reads its triggers'
  buttons every step (`buttons` in `src/app/pad.ts`). How to play's controls and a face's sheet say the player's
  bindings (`setBindings` in `src/app/chrome.ts`).

The four ways are called up, down, left and right — the landscape screen's, as `ACTIONS` names up and down — and
not back and forward: a row called *Fly back* beside the tab's *Back* is two buttons that answer to one word, and
the guard's own helper pressed the wrong one.

## Not done

- **The menus' own keys are not bound.** Arrows and WASD walk a menu, Enter presses, Escape backs out, Q and E turn
  the tabs, whatever the game's bindings are. Binding the menu as well is a second table of every press the chrome
  hears, and the ask was for the game's controls.
- **A key's name is its `code`** (`KeyK` is K): a layout that prints another letter on that key shows the code's.

## What guards it

- `tests/settings-kept.test.ts`, *0664*: a key and a pad button rebound read back as they were left; a document
  from before reads as the defaults; five forged keys and four forged pads each read as the defaults, whole; a key
  taken from another action leaves it what the rebound one had, and a button swaps.
- `tests/controls.test.ts`: the keyboard throws a trigger on its new key and not its old one; a rebinding lets go
  of a held key; the pad throws on the button its binding says, read every step; the tab has a button per action
  and per trigger.
- `tests/controls.browser.test.ts`, *THE ASK*: on the built page, a key and a pad button bound on the tab (P refused
  on the way), the page loaded again and both still there, and a run that throws the gun's charge on K and on RB
  and not on Space.
- `tests/menu.test.ts` lists the tab among the screens that wait for a hand.

The probes in `scripts/probes/0664-the-controls-are-bound.mjs` keep nothing, read a forged binding as it stands,
leave an action keyless, deafen the keyboard and the pad to their bindings, and bind nothing on the tab.

## Rollback

**`itc_settings` may now hold two fields no earlier build knows**, `keys` and `pad`
([0001](0001-revertability-not-risk-rating.md)). An earlier build reads the fields it knows and ignores the rest
(`settingsFrom`), so it plays on the default bindings and every other setting as kept; when it next writes the
settings it writes without them, and the player's bindings are gone. Nothing else is lost.
