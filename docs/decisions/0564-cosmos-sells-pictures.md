# 0564 — Cosmo's sells pictures

**Accepted 2026-10-07.** Item 5 of the queue in
[the hangar family, reviewed](../../reports/the-hangar-family-reviewed-2026-10-07.md), its §4. Amends
[0542](0542-cosmos-counter.md)'s shelves and Buy.

## The ask

The review: *"The store has no merchandise."* Every ware was its name and price in a pill. All three
shelves were drawn on a desktop while the cursor reached only the aisle's one. One click spent
shards with nothing asked. A ware just bought sent the player to another tab to fit it. And Cosmo's
first words on arrival remarked on whatever ware the window opened on.

The player's answers: **sub-tabs** — *"as we'll be expanding the range"* — and **a confirm sheet**.

## The rule

| | |
|---|---|
| **one shelf at a time** | on every device, stepped by the aisle drawn as tabs across the shelf's head. A sixth table is a sixth tab, never a taller plate |
| **a ware is a tile** | its picture, its name, and under it its price, *✓ Yours*, or its price in the hazard's gilt while the balance is short of it. The words and the ink both say so ([0024](0024-the-accessibility-floor-is-settings.md)). A dangle's picture is the readout's own drawing of it, copied with its inks, so the tile and the dash cannot differ. A rim is its wheel's picture baked at the tile's size, and a flame is drawn in its own inks |
| **the card** | on Cosmo's, the ware in the window large beside its name and what it is. Its state is on the tile and on the shop's first action |
| **the first action** | says what a press of it does: *Buy · 250 ✦*; *Need 160 more ✦*, which does nothing and says why; or, once the ware is theirs and not on the ship on the pad, *Fit it now*, which fits it there and then. It is put away once the ware is fitted, or cannot be fitted, as wheels on a ship with none |
| **the sheet** | *Buy* asks first: the ware, its price, and the balance before and after. Only the sheet's *Buy* buys. *Not now*, B and Escape put it away. While it is up the cursor walks its two buttons and nothing behind it can be pressed |
| **Cosmo** | greets on arrival, one line a visit in turn from four, until the player looks at something. *There. Wear it well.* when a ware is fitted at the counter, and *You've cleaned me out, friend* once every ware is theirs. The lines are taken in turn and not drawn by chance, so no stream of randomness is spent on a greeting ([0021](0021-one-stream-per-concern.md)) |
| **on a phone** | the tiles' pictures a size down, and no card, since it would say only the name the lit tile says. It cost the height the shelf needs at 667×375 on CI's wider letters |

## Why on the plate, and not on the counter

The review asked for the ware in the window *on the counter*, large, while the ship wears it beyond.
The counter is canvas and the plate is page, and a page element laid over a counter the camera moves
(0563) would be a second picture of where the counter is. The card is a fixed place the eye already
reads. The ship on the pad still wears what is tried on.

## What the guards say

`tests/cosmo.browser.test.ts`: one shelf drawn on a desktop, and every ware on it a picture with a
width. Buy asks before it buys, and the sheet says the balance after. A ware bought is offered to be
fitted, and one out of reach says how far and opens no sheet. Its three probes buy without the
sheet, draw every shelf, and empty the tiles. Two tests that bought through Buy now answer the
sheet too, and the readout's dangle is read inside the readout, because a tile carries a copy of
its drawing. Five probes whose anchors moved were moved with the code.

## What is owed

A play: a purchase with each hand, and the sheet's look.
