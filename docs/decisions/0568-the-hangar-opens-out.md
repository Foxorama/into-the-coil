# 0568 — The hangar opens out

**Accepted 2026-10-07.** A play of 0560–0567 at 1920×1080. Takes back
[0562](0562-the-plate-grows.md)'s plate that grew with the screen, and moves
[0563](0563-the-ship-is-the-picture.md)'s camera. Amends 0550's viewport, which is no longer kept in
view.

## The ask

> *"desktop especially at 1920 res it just looks bad … the ship over lays the trade stand, the trade stand
> base and ship hover base are poorly aligned and not overlapped well, the menu's take up like 80% of the
> screen space, the buttons are massive and fit in all the current options, but that doesn't matter when
> add something new - is it going to make the menus wider or enable the left <> right options? it has the
> pilot top and a pilot section bottom, the cockpit is just kind of floating off by itself down the bottom
> left. everything is way too big and zoomed in at this resolution*
>
> *I want the spaceship hangar with trader … the ship should be more centralised, the menu should be more
> compacted, I want to see the end of the hangar and the open starfield on the right hand side, it feels
> cramped and claustrophobic at the moment."*

Answered while it was planned: the menu is **a left column**; a band is **fixed-size chips that
scroll**; and the traders **move about between runs** (0569, next).

## Owned

**0562 was wrong in kind.** Growing the plate with the screen answered *"half the plate is empty at
1920"* by making the plate bigger. The answer was to make the hangar bigger. A bigger screen shows more
room, and the plate stays one size.

## The rule

On every screen that is not a phone and is not held upright:

| | |
|---|---|
| **the plate** | a column 24 rem wide docked on the left, in type that does not grow past 1 rem. It is the panel's height on every tab and never its content's |
| **a band** | its name over it, then ‹ chips ›. A chip is a third of the band's view whatever the band holds. More options scroll, and the arrows and the cursor bring the next into view. A band is never wider for a sixth gun |
| **the pilot** | said once, at the plate's head. The foot's card never speaks for the band of faces |
| **the ship** | on the pad by the bay, the Viper's, empty since she went (`STAGE.standPad`), at 46% of the hangar's width. The inner pad is not drawn on the stand: it stood half under the keeper's counter |
| **the keeper's counter** | by the inner pad, clear of the ship (`STAGE.stall` 106) |
| **the camera** | no closer than the room's whole height (the row's zoom, 1.15) and never further back than the room's height on the column's foot, so a bigger screen shows more hangar and more stars |
| **the bay** | the back wall ends inside the hangar's column, with open sky past it: about 25 units on a 1280×720, 38 on a 1920×1080, 13 on a 4:3. The sky is painted 400 units past the bay, so no screen's edge comes before it |
| **the dash** | on the deck under the ship |

On a phone the layout is 0566's. A third of a phone's screen at the room's full height holds the ship
or the counter, not both, so it holds the ship. 0569's staging of the keepers is where that is answered.

## What it cost, and the guards it moved

The ship is smaller on a laptop: 166 px of 1280, about what the review measured before 0563, and about
250 of 1920, with the bay beside it. **0563's floor** in `tests/stand.test.ts` is lowered from 0.17 to
0.125 of a 1280's width, and says why. Its probe now lets the ship shrink, since the row's zoom no
longer decides the camera.

- **0562's guard is turned round** (`tests/foot.browser.test.ts`): the plate is no wider at 1920×1080
  than at 1280×720, and under a quarter of the bigger screen. Its probe gives the plate a share of the
  screen again.
- **0550's viewport guard is replaced** by *the end of the hangar and the open stars past it*. The stars
  are the open bay's now. Its two probes went with it, and the viewport is still drawn where the camera
  sees it.
- **The stand's model of the column** in `tests/stand.test.ts` (`standColumn`) is the new layout's. The
  keeper is held in the column on every screen bigger than a phone, and the ship on every screen.
- **A rule that never held was deleted.** A first draft kept a reach of stars past the bay by drawing the
  camera back. Once the zoom was capped at the room's height it never decided anything at any size,
  and its probe stayed green, so it went (0019). The probe that moves the camera back to the inner pad,
  and the one that lets it close in, both go red.
- Three probes of 0540 whose anchors were renamed, `bluePad` to the stand's own `pad`, were moved.
- **The pixel guards read round the ship** (`tests/stand.ts`). They read the whole stand, which is now
  mostly wall and an open bay with stars drifting past. On CI every look's change came out about twice
  the noise and under the bar of three. They read a band of the ship's width about the pad, from above
  it to the deck, where the stars are not.
- **The plate's foot is pinned to its bottom**, and the bands above it scroll if a font runs taller. On
  CI's letters a fixed-height plate one line too tall put Buy under the clip, where a click could not
  settle. Checked here under `* { letter-spacing: 0.1em }`, twice the width that reproduced CI's
  overflow before.

## What is owed

A look at 1920×1080 and 1280×720. Then 0569: the keepers stood somewhere new after every run.
