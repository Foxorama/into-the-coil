# 0673 — Cosmo's foot is one line, its sub-tabs whole, and a lone option shows the way there

**Accepted 2026-10-25.** Item 6 of [`the-menus-planned`](../../reports/the-menus-planned-2026-10-24.md), from finding 8
and §1.6–1.7 of [`the-menus-reviewed-again`](../../reports/the-menus-reviewed-again-2026-10-24.md), answered *"Agree
with the suggested answers."* It amends [0564](0564-cosmos-sells-pictures.md) (Cosmo's foot and its sub-tabs) and
[0565](0565-paint-in-swatches.md) (the art's picture), and widens [0670](0670-the-plate-from-the-short-side.md)'s
whole faces to every band on a stand.

## The ask

> *"Cosmo's foot is three shapes and a defect. Buy · 575 ✦ wraps to three lines in a tall narrow button; Back is a
> short one; Show owned is a wide one … The sub-tab strip … truncates to Tu at 2560×1080 and to Han… Whe… Flam… Shie…
> at 667×375."*

And on Paint & Parts: the shield row cuts its third chip (*Phoenix plu…*) at 1280×720; a lone chip (*Flame: Standard*)
stands in a row sized for three with nothing to say the rest are at Cosmo's; the art chips' pictures are the size of
a glyph.

## The rule

| | was | is |
|---|---|---|
| **Cosmo's foot** | *Buy*, *Back* and *Owned* in a row of three shapes, Buy wrapped to three lines | *Buy · 575 ✦* on one line across the foot as the primary, with the title's *Fly* rim; *Back* beside it |
| **Owned** | an action in the foot | the same action, standing at the shelf's head under the sub-tabs, small and to the right: it filters the shelf and does nothing to the ware. The walk and a press reach it as before; only where it stands moves |
| **The sub-tabs** | squeezed to the strip's width, each cut to an ellipsis | each its name's width; the strip scrolls, the open one is brought into view, and a tab the strip only partly shows is put away. The shelf's heading under them (*HANGING* under *Hanging*) is not drawn; it stays as the band's label for a reader |
| **A band's chips** | 0670 kept whole faces on a band of portraits only | every band on a stand's plate shows whole chips, and the chip that is on is scrolled into its track before the cut is worked out, so it is never the one put away |
| **A lone option** | one chip, and the hint line saying in prose that Cosmo's sells more | beside it a dashed tile in the shop's colour, *More at Cosmo's →*, which opens Cosmo's on that slot's shelf. Shown only while the band has one option, and not on a phone: there a band is a cell the width of the one chip it shows, so a lone option fills it, and the first build's tile ran over the next band and off a 480×320 screen, which `tests/layout.browser.test.ts` caught. Which shelf sells a slot is `SLOT_SHELVES` in `src/state/screens.ts`, beside `SLOT_NAMES`: `null` for a slot nothing is sold for |
| **The art's picture** | 21 px tall | 96 × 48 px, the ship's middle band |
| **Paint & Parts' groups** | stood at the foot of 0670's stretched row, an 80 px gap between the sub-tabs and the first band at 1280×720 | fill the row from the top. Where the plate is 900 px tall or more and a group has three bands or more, they are spaced down it |

## Why the art's picture is not a new bake

The plan asked for a 96 × 48 render of the door from `drawPlayerShip`, cached the way the ware art is, with the
canvases counted and the bake timed before a number was written. Read in `src/app/mount.ts`, the band's picture
already is the ship in its fit (`thumbOf`) baked 96 px across and kept per ship and fit. It was drawn at 2.1 em. So
the picture is drawn at 96 × 48 and cut to its middle (`object-fit: cover`) rather than shrunk to fit. No canvas is
added and no bake is longer, so there was nothing to time. What it shows is the ship's flank with the art on it, not
the door alone. If a play says the door reads better, that is a new bake and owes the measurement the plan names.

## What it cost and the guards it moved

- **`tests/cosmo.browser.test.ts`**, *0673*: at 1280×720, 1920×1080 and 667×375, Buy is the widest of the foot, on
  one line, Back beside it, Owned under the sub-tabs and over the shelf, and no shelf heading drawn. The first
  build hid that heading, but a later rule in the desktop plate's block (landscape, 461 rows and up) still drew it. The
  photograph found it, and the guard was written after. At 480×320, 667×375, 1280×720 and
  2560×1080 no sub-tab is cut short. At 1280×720 Paint & Parts draws no chip in part, the Firebird's lone flame shows
  the way to Cosmo's and it opens the flames shelf, and the art's picture is at least 80 × 44 px.
- **A chip flush with its track's end is whole.** 0670 put away a face more than half a pixel past the edge. Across
  every band that put away the gun a step had just tried on, and the fitted one at rest: a scroll stands on a whole
  pixel and the chips on fractions. 0657's `tests/tries.browser.test.ts` went red. The slack is two pixels, and the
  cut is worked out again as soon as a step scrolls, not on the scroll's event a frame later.
- **Spacing the groups down a tall plate was first written for every group.** At 720 rows it opened 70 px gaps
  between bands a glance takes together, and Paint's two bands stood a plate apart. It is kept to a plate 900 px
  tall or more and a group of three bands or more.

Probed in `scripts/probes/0673-cosmos-foot-is-one-line.mjs`: Owned left in the foot, the heading drawn again, the sub-tabs cut with an
ellipsis, whole chips kept to faces, the way to Cosmo's never shown, and the art left at a glyph's size.

**Not held by any guard:** the tile's words and colour, the primary's rim, and the groups' spacing on a tall plate.
Those are tastes.

**Photographed** at 1280×720 and 844×390, the layout guard's six, and 1920×1080 and 2560×1080: Cosmo's shelves and
Paint & Parts.

## What is owed

- A play of Cosmo's foot and Paint & Parts on a desktop. The art's picture is the flank, not the door (above).
- *More at Cosmo's →* is a pointer's. The cursor's walk does not stop on it (`tabIndex = -1`): A on a lone chip
  fits what is already fitted, and the shoulders reach Cosmo's in one press.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)): no storage, schema or shipped surface is touched.
