# 0565 — Paint & Parts in pictures

**Accepted 2026-10-07.** Item 6 of the queue in
[the hangar family, reviewed](../../reports/the-hangar-family-reviewed-2026-10-07.md), its §3. Amends
[0529](0529-the-livery-is-free.md)'s colour and tone bands and 0530's flame band on the plate.

## The ask

The review, measured at 1280×720. *Factory* was a 560 px pill with one word in it. The tone on the
factory's paint was a row of three dashed pills, and on a phone two dim arrows round nothing. The flame
was one option stretched across the plate, with arrows that went nowhere. Wheels and art were named
and not shown, so *Gold snowflakes* and *Whitewalls* could not be told apart at a glance.

## The rule

| | |
|---|---|
| **the colour** | a row of swatches: every paint the ship can wear, each drawn in the ink it would paint the body at the tone the ship has (Bright off the factory's), and the factory's own a split of two inks. The names stay on each for a reader and are said on the card (0562) |
| **the tone** | swatches of the hue the ship is painted, at each tone. **Not drawn on the factory's paint**, which has its own tone, so there is no row of nothing. A hue fitted brings it |
| **the flame** | both flames side by side, the one Cosmo's sells padlocked with *Sold at Cosmo's* until it is bought (0561) |
| **the wheels and the art** | each option with a picture of the ship wearing it, beside the name. Baked once per fit and kept, so stepping a band does not bake the ship again on every press |
| **on a phone** | a slot shows one option at a time as before. The colour is a chip with its paint down its left edge and its name. Twelve dots wrapped to three rows and put the plate twenty pixels past the others' at 667×375 |

## Why the fight's picture, and not the pad's

The thumbnails are the ship as the fight draws it, at the size of two ems. The pad's picture is a
whole port baked at the screen's size, and baking it once for each option of a band would be a room
per option. The fight's picture carries every look the band changes: the wheels, the art and the paint.

## What the guards say

`tests/swatches.browser.test.ts` asks the page. Thirteen paints are drawn, each in a different colour.
The tone takes no height on the factory's paint, and takes some once a hue is fitted. Every wheel has a
picture. Its three probes paint every swatch the one ink, draw the tone on the factory's paint, and
take the wheels' pictures away.

## What is owed

A look at the swatches on a pad and a phone.
