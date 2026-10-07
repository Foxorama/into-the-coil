# 0580 — The key opens

**Accepted 2026-10-08.** Item 2 of [`the-loadout-planned`](../../reports/the-loadout-planned-2026-10-07.md).
Builds on [0458](0458-the-title-is-rows.md)'s How to play, [0575](0575-a-pickup-is-what-it-shows.md)'s key
of every face, and [0564](0564-cosmos-sells-pictures.md)'s sheet.

## The ask

> *"do a summary of how it works on the how to play and have a link to the vulpecula.games website with more
> detail there rather than trying to perfect the screen. or have the icons and have a tap on them pop up a
> window with their stats or something"*

Answered: *"tap icons."*

## The rule

**Every face on How to play is a button, and a press opens a sheet of what it is: the face large, its name,
what it gives, the lines read off its rows, and the key that throws it on the device in hand.**

| | |
|---|---|
| **the faces** | each its own button, named for a reader, in the cursor's walk a row a pickup under the tabs; a tap, a click, Enter or A opens it |
| **the sheet** | 0564's sheet, on How to play: over the panel, its one button *Got it*, and Back, B, Escape or a press off the card put it away; the cursor comes back to the face |
| **the lines** | `faceCard` in `src/state/screens.ts`: the pickup it is on, then by kind — a tube: that it fires by itself, its hit in pulses, how it flies (a seeker's life in seconds), and the surge it is once both tubes are full; a shield: the plate, and the void it becomes at a full shell; a special: its trigger and, thrown, how far ahead it goes off as a share of the screen |
| **the key** | *Throw it* names the trigger's key, button or disc for the hand holding the game, from the same `triggerIn` the controls table now reads |

## Why it is built the way it is

**A sheet and not a link.** The ask offered both; the answer was the icons. The words a sheet says are the
rows', so a row changed is a sheet changed, where a page elsewhere is a second description of the game that
drifts the day a number moves.

**Numbers in the player's units, or not at all.** A hit is said in pulses because the pulse is the gun every
ship has; a life in seconds; a reach as a share of the narrowest screen's length (0364), which every device
shows at least. **What a special does to a boss is not said**: its share is authored in five places by five
mechanisms — a blast's, a storm's strikes, a rift, a nova's ring, each of a candle's bursts — and one line
over them would be a switch on the row's shape that the next special falls through.

**The ring comes off before a sheet goes up.** The ring is painted over the rows the walk holds, and a sheet
replaces them, so the face the cursor left stood ringed beside the sheet's button. Cosmo's purchase sheet
had the same flaw, unseen because its band's ring sits under the sheet's dim; both now take it off first.

**A face's button inherits the page's font.** A button's own is the browser's, and the icon's size is in
ems: in its own font every face grew, and How to play scrolled by 85 px on a 480x320.

## Rollback

None needed: no key, no save field, nothing shipped changes shape.

## What guards it

`tests/key-opens.test.ts`: every face has a sheet under the name and line the key gives it; a special is on
its own trigger and a thrown one says its reach; a missile's hit and a seeker's life are their rows'.
`tests/key-opens.browser.test.ts`, in the page at 1280x720 and 480x320: every face a button opening its own
sheet whole on the glass, put away by Escape; the keys onto the faces, Enter, the key the controls give its
trigger, and the cursor back on the face. `tests/layout.browser.test.ts` holds How to play unscrolled.
Probes in `scripts/probes/0580-the-key-opens.mjs`.

## Owed

- A play of the sheet: whether these are the stats the player wanted, and whether a boss's share is missed.
