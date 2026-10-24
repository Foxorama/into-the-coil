# 0661 — The places are described

**Accepted 2026-10-24.** From [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), item 13.

## The ask

> *"Level descriptions."*

Three words, and the page does not say where. Built on a reading, which the play is owed a verdict on.

## What was there

Every place already has a line — `voyage` on its row in `src/content/themes.ts`, *what it is, never why it is good*
— and the crossing ([0340](0340-the-coil-is-a-route.md)) says it under the place's name while the ship burns
towards it. Two gaps: **the first place is never crossed to** — a run flies into it from the intro, so nothing ever
named The Approach or said its line — and **nowhere a player can look the places up** says it. The music room lists
every place by name and said nothing of any.

## The rule

- **A run opens naming its place** — `setArrival` in `src/app/chrome.ts`, called by `startRun` in
  `src/app/mount.ts`: the place's title over its `voyage`, in the crossing's type and the place's colour, under the
  strip and clear of the middle, where the ship is (0063's reason). It takes no pointer, fades by itself in four and
  a half seconds, and a pause or a menu takes it down. Only where a run begins: every later place is said by its
  crossing, and saying it twice would be the crossing's words with a second banner after them.
- **The music room says each place's line under its name** — the button's hint, on the screen row in
  `src/state/screens.ts`, read off the same row, so a place added to the table arrives with its line.

## Rejected

- **A card at every level start.** For six of the seven it repeats the crossing a second after the crossing said it.
- **New, longer descriptions.** The voice rule is terse on purpose, and the lines exist; a second set would be a
  second description of each place to drift from the first.

## What guards it

`tests/hud.browser.test.ts`, *0661*: on the built page, a run opens with its first place's title and line on the
screen, under the strip, above the middle third, centred, taking no pointer, and gone within eight seconds; and the
music room carries every place's line. The probes in `scripts/probes/0661-the-places-are-described.mjs` take the
call out and put the room's hints back to nothing.

## Not held by any guard

Whether this is what the page meant. If it was a description somewhere else — the title, a level select that does
not exist yet, or more than one line — the play says so.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
