# 0688 — The break presses for itself, quietly, with no cursor

**Accepted 2026-10-26.** From the play of 2026-10-26. Amends [0669](0669-one-cursor.md) (the brackets on every
screen) and [0659](0659-a-menu-press-is-heard.md) (every press heard).

## The ask

> *"the interlevel bits have the flashing cursor on the 'onward' sign, and then there's a noise that plays going
> to the next level like you've clicked a button."*

## What was there

The level break (0063) is a banner over the running game with one button, *Onward*, that its own timeout
presses after six seconds (0428) through the same path a hand's press takes. 0669 put the breathing brackets on
every screen's cursor, so they breathed on *Onward* for six seconds; 0659 made every press heard, so the
timeout's press rang the confirm.

## The rule

| | |
|---|---|
| **the cursor** | not drawn on a screen that presses its own button — `cursorDrawn` in `src/state/screens.ts`, read off the row: a `timeout` whose `then` is `null`. That is the break and only the break. *Onward* is still pressable, and Enter still lands on it |
| **the sound** | a press the screen makes itself is not heard. The shell sets `selfPressing` round the one call that presses for the player and the action callback reads it; a hand's press on *Onward* is still a confirm |

## What guards it

`tests/menu.test.ts`: the one screen that presses its own control draws no cursor and every other draws one.
Probed in `scripts/probes/0688-the-break-presses-for-itself-quietly.mjs`. The silence of the self-press has
no guard: the break is reached only by clearing a level, which no browser test flies, and the cue count the
sound suite keeps is a press by hand. 0659's probe is re-anchored on the line that now reads the flag.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
