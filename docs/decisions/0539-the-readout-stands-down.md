# 0539 — The readout stands down

**Accepted 2026-10-05.** Item 2 of [`the-menus-are-a-place`](../../reports/the-menus-are-a-place-2026-10-05.md).
Lays out [0521](0521-the-hangar-opens.md)'s hangar, [0527](0527-the-wheels-turn.md)'s *Paint & Parts* and
[0523](0523-cosmo-opens.md)'s Cosmo's as one place; changes none of their slots, their rules or their key.

## The ask

> *"good Hangin Out screen - spaceport, garage style with background, setting and ships etc. … The tabs
> should be good fits as well, the dashboard display should be down in the shop and hanger section not
> the top left."*

The plan answered it in three items; this is the layout the port will stand behind (item 3), proved on
the void first so that a picture question is never confused with a layout one.

## The rule

**The hangar's three tabs stand in the port: a stand on the left with the balance in its top corner and
the dash at its foot, and one plate on the right with the tabs on its head, the pilots, the bands under
the row's headings, and Back in its foot. The dash is the real readout, moved down into the stand, and it
counts what the run will open with.**

| | |
|---|---|
| **the row** | `stand` on the screen row (`src/state/screens.ts`): `null` everywhere but the three tabs, and each tab's headings with the bands under them — the hangar's *Loadout* (Gun, Special) and *Dash* (Dash, Hanging); *Paint & Parts*' *Parts* (Wheels, Flame) and *Paint* (Art, Colour, Tone); Cosmo's none until its counter (item 5) has a shelf per table |
| **the dash** | the readout element itself, moved into the stand's dash cell while a standing screen is up and back into the strip, first, the moment it goes. It keeps its classes, so every guard that reads it by class still reads it. Set in the strip's own type against the same box, so it is the dash the run flies with at the size it is flown at |
| **what it counts** | the lives the tier gives, the shell it opens with and the arsenal the pilot's ship would be issued with the special the hangar fitted — `livesFor`, `openingHealthFor` and `startingArsenal`, the run's own begin's functions. It said ×0 of everything: the counts of a run that was not running |
| **the tabs** | folder tabs along the plate's head, in the plate's type, the open one filled and joined to the rule under the strip; they were three heading-sized pills over the screen |
| **the walk** | the order drawn: the groups draw the bands in another order than the row lists them, so the bands are walked as the document has them |
| **Paint & Parts' pilot** | a line (0538's), not the card: who the pilot is, is the hangar tab's |
| **the ship** | the card's ship is built for the stand and stands over the dash, large, on both tabs with pilots — the plan takes the card's thumbnail away when the port's ship arrives (item 3); it is taken a step early, because the plate could not hold it and the stand had nothing to show |

## What the picture cost, measured

Every number from the built page at the layout guard's six sizes and the 844x390 touch phone, and again
with every letter spaced 0.08 em wider, which is how CI's wider type was stood in for after 0538 learned
that a margin measured on this machine's fonts alone is not one.

- **The plate's shape.** The first build stood the headings two to a row, half the plate each: the dash's
  four names were clipped at 1280x720 and the hangar tab ran 77 px under its fold. Each heading runs the
  plate's width now, a band to a line — its name, then its segments in one row — which is the plan's own
  picture; on a phone, where a band shows the one that is on (0523), the headings stand two to a row.
- **The pilots' head.** The faces lose their names and the band its label, as the title's do; the card
  is the name, the pronouns and home and the bio — the craft and the gun are the stand's ship and the
  Loadout under it. Beside the faces on a laptop and a phone; under them on a tablet, which has the height.
- **The tabs.** At three fifths of a 667x375 the strip ran off the plate, and a tab past the plate's edge
  is past its clip: a press on it found the overlay. On a phone the plate is two thirds; on the
  narrowest it takes the width and the stand stands behind it, as the plan said.
- **The dash.** About twenty-five of its em across, on a stand a third of the screen at its narrowest: at
  1024x768 it ran under the plate. Capping its type by the width set the counts at eight pixels on a
  phone, so it wraps instead — the stacks under the lives and the shell, in the same frame.
- **Spare**, with the wider letters: 18 px at 1280x720, 26 at 1024x768, 20 or more on every phone.

## Raised for the screen

**The stand on the void.** Until the port is painted behind it, the stand is the balance, the ship and
the dash on the dark. That is the plan's order — the layout proved first — and item 3 is the picture.

## What guards it

`tests/stand.browser.test.ts`: on every tab that stands, at every size, the readout is in the dash, whole
on the display, inside its stand and clear of the plate; it counts the opening complement; it is back in
the strip for the run. The hangar family's suites read the readout by class and are unchanged, which is
the proof that moving it moved nothing they read. Probes in `scripts/probes/0539-the-readout-stands-down.mjs`;
0050's, 0060's and 0355's re-anchored on `stacksOf`, which now takes the arsenal it counts.

## Owed

- A play on the branch preview.
