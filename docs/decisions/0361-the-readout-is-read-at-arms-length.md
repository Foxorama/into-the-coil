# 0361 — The readout is read at arm's length

**Accepted 2026-09-23.** A taste, on [0192](0192-a-guard-holds-an-invariant.md)'s terms: no guard,
because there is no change to the content that would redden one and be wrong. **Extends
[0045](0045-the-player-can-see-what-they-are-carrying.md)**; touches nothing but the stylesheet and
one CSS variable.

## The ask

> *"Make the interface better."*

Asked beside three specific things — a boss bar, a bomb button, a line to remove — so the general
sentence was read as *the in-game readout*, which is the interface a player sees while playing. The
title, the settings and the run-over screens were not touched; if *better* meant one of those, that is
the next report.

## What was wrong with it

Photographed before the change at 1280×720 — `scripts/shot.mjs`: three icons and two counts in a
line at the top left, at a type size two thirds of the game's smallest heading, with no separation
from a bright place's land. It was the one piece of chrome the player reads without looking away from
the ship, and the smallest text on the screen.

## The rule

**The readout is sized to be read without leaning in, and it carries a halo of the place's own void.**

| | was | is |
|---|---|---|
| type | `clamp(0.8rem, 2vw, 1.05rem)` | `clamp(0.95rem, 2.4vw, 1.3rem)` |
| icons | 1.4em | 1.7em |
| gap between groups | 1.2em | 1.5em |
| behind the ink | nothing | a text shadow and a drop shadow in `--itc-void`, the palette's `space` |

The void is set on the readout as a CSS variable from the palette, so a high-contrast palette gets
its own black rather than the vivid one's blue-black — the same seam the screens already use for
`--itc-void`.

## Why no guard

A guard here would be a number chosen today asserted against tomorrow — a font size is exactly the
kind of quantity [0192](0192-a-guard-holds-an-invariant.md) says goes in `tests/authored.ts` or
nowhere. What IS guarded is unchanged and still passes: the readout appears when a run starts, says
its numbers in words, and draws one pip per shell the tier allows
([0355](0355-a-tier-opens-on-a-shell.md)), all in `tests/hud.browser.test.ts`.

## What this deliberately does not do

**It does not put a panel behind the readout.** A box at the top left would be the first opaque thing
over the playfield; the halo does the same job for legibility and hides nothing.

**It does not move the readout.** Top left is 0045's row and the boss bar
([0360](0360-the-boss-has-a-health-bar.md)) now sits at the top centre beside it, so the whole top edge
reads as one line of chrome.

## What this leaves owed

**A play.** The size was chosen against a photograph on a desktop; a phone in landscape gets the
`2.4vw` arm of the clamp and has not been looked at with a thumb over it.
