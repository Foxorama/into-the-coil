# 0540 — The hangar is the port

**Accepted 2026-10-06.** Item 3 of [`the-menus-are-a-place`](../../reports/the-menus-are-a-place-2026-10-05.md),
standing [0539](0539-the-readout-stands-down.md)'s layout in [0411](0411-the-chase-begins-at-the-port.md)'s
room.

## The ask

> *"good Hangin Out screen - spaceport, garage style with background, setting and ships etc."*

## The rule

**The hangar's three tabs stand in the intro's room, held still: the Viper gone and her pad empty, the
beacons dark, the bar's door shut, and the pilot's ship on its own pad, idling on its beam and wearing the
fit. Each tab's camera is a field on its row. The port is baked when a tab opens and dropped at Back.**

| | |
|---|---|
| **the picture** | `paintStand` in `src/render/port.ts`: the room drawn by the same helpers the intro's hangar is (`paintRoom`, `paintLamps`, `paintDeck`, `paintEdge`) — one description of the room, two pictures of it — and the pilot's ship on its pad at the intro's hangar size, lit from the first frame and never going. Its clock (`world.stand`) drives only what idles: the bob, the flame, the sky past the bay |
| **the camera** | `camera` on each tab's `stand` (`src/state/screens.ts`), in `STAGE`'s units: on the pad for the hangar, closer on it (2.3) for *Paint & Parts*, at the bar for Cosmo's. `standViewInto` writes the view, held inside the room so no edge shows the void it is painted on — at the game's widest aspect, a camera at the bar would otherwise show a sliver past the wall |
| **the bake** | `applyScreen` bakes the port the first time a tab that stands is shown, keeps it across the three, and drops it on any other screen, on the intro's terms. A fitting re-bakes only the pieces that are the pilot's ship (`bakePortShip`, every piece named *blue*), and only when the ship or its fit moved |
| **the spinners** | a car on a rim that turns turns it on the pad, as it does in the fight (0527): the fight's spinner, baked into the port at the hangar's scale (`blueWheel`) and turned over each tyre at the rim's rates. The card turned them until now, and the card's ship is gone |
| **the card** | no ship on a screen that stands: the ship on its pad is the preview, at two and a half times the fight's size. 0539 drew the card's ship large on the stand until the port was there |
| **the bar** | none while a tab stands: the bar is the play readout's (0500), and the readout is in the dash. `CanvasSurface.clear` now puts back the clip a barred frame set when a frame has no bar — the first build stood the room under a black band |
| **dims** | `false` on the three rows: the screen shows the picture behind it rather than painting over it |

## What it cost, measured

Opening the hangar holds the page 4 to 20 ms from the press to the frame after it — the first open is the
most — against 1 to 3 for Settings; a fitting that re-bakes the ship holds it 4 to 5. Measured on this
machine in a page alone, at a desktop's pixel and at two to one. That is about a frame. **No budget is
written**: 0245 sizes one at three times the worst seen under the whole suite, and this was not measured
under it — owed if the open is ever felt.

## The tests that read the ship

The art, livery and wheels suites read the card's ship as a picture; the card has none now. They read
the ship on its pad off the game's canvas instead (`tests/stand.ts`), which is never still — it bobs — so
the stand is read **at the same point of the bob, by the page's own clock taken over**, and what is
counted is the share of its pixels whose colour moved past a margin. A colour histogram was tried first
and read the Firebird's flames as half again its noise; pixel by pixel the same look is seven thousandths
of the stand, and the stand standing still is nil. Under the whole batch of browser suites, once, the
stand read as moving between two reads a bob apart, so the reader waits for two that agree before it acts.

## Raised for the screen

**Cosmo's camera.** At the bar, the counter and its lit shelf fill the stand; the pilot's pad is under the
plate on a phone. Cosmo behind the counter is item 5, and the camera is that item's to set.

## What guards it

`tests/stand.test.ts`, blit by blit: the room on every tab with nothing happening in it; the ship on its
pad in the stand's part of the screen on the hangar's two tabs at every size; the room over every edge,
the widest screen too; the spinners turning, and none on a still rim. `tests/stand.browser.test.ts`: the
room to the top of a desktop's screen and the bar back for the title. The art, livery and wheels suites:
each fitting reaches the ship on the pad. `tests/intro.test.ts`: every piece of the port is drawn by the
intro or the stand. Probes in `scripts/probes/0540-the-hangar-is-the-port.mjs`.

## Owed

- A play on the branch preview: the room, the cameras, a fitting on the pad.
- The bake measured under the whole suite, if the open is ever felt.
