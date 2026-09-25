# 0369 — A turn leaves nothing behind it

**Accepted 2026-09-25.** Behind the orientation gate
([0031](0031-landscape-is-the-shipped-orientation.md)) the canvas leaves the layout rather than only
being hidden. The size is measured from the visual viewport and after `orientationchange` as well as
from the window's `resize`. A resize that leaves the game playable no longer re-applies the screen.

## The ask

> *"When I died I let the game continue to timeout, but I turned the phone into portrait mode. I was
> unable to start a new game in portrait mode. And then when I turned it landscape, I couldn't move
> the plane all the way to the top."*

Then: *"the user affected was using chrome in ios … I can't replicate on an android device"*, and no
screenshot was possible.

Not starting in portrait is 0031 working. The rest is the defect.

## What was found, and what was not

**It is not reproduced.** Chrome on iOS runs on WebKit, as every iOS browser does, and neither the
Android phone that tried nor the Chromium this suite runs on behaves the way WebKit does here. Flying
the same sequence in an emulated phone put the page, the canvas and the viewport back at exactly the
right size, and nothing that limits the ship reads the viewport. So this answers the causes that fit
the report, and says which is which:

1. **The canvas overflowed the page behind the gate.** It was hidden with `visibility`, which leaves
   it laid out, so a portrait page held a canvas at its landscape size: measured, 844 wide in a page
   390 wide. WebKit zooms and scrolls a page to fit what overflows it, and does not always give that
   back when the device turns home. With the top of the game off the top of the glass, the ship looks
   like it stops short of the top. **Now `display: none` as well**, so there is nothing to fit to.
2. **WebKit can report a rotation's size before it has settled**, and the window's `resize` was the
   only report. **Now the visual viewport's `resize` reports too**, and `orientationchange` is followed
   by one more measure `ROTATION_SETTLE_MS` (350) later. `onResize` does nothing for a size it has
   already fitted, so the repeats cost nothing.
3. **Found on the way, and a defect whatever the cause:** every landscape resize re-applied the screen
   through `setPlayable`. `applyScreen` says it runs *"only on a real transition"*: it arms countdowns,
   puts out a burn and puts the focus back on the first control. So a phone's toolbar sliding in
   mid-crossing dropped the ship out of the burn. More reports of the size would have made that
   worse, so **the screen is applied only when the gate changes**.

## What is held

`tests/orientation.browser.test.ts`, *a turn leaves nothing behind it*. All three guards are red on the
old code and green on the new:

- *behind the gate the canvas takes no room*: on the old code, 1280 px of canvas in a 720 px page.
- *a turn the window's own resize does not report is still fitted, from the visual viewport*: the
  window's `resize` is swallowed before the game mounts, and the turn home must still be fitted to the
  size it came back at. On the old code the gate never came up.
- *a resize while the game stays playable does not re-apply the screen*: focus stands on the title's
  second control through a resize. On the old code it went back to the first.

Each has a probe.

## What is owed

**The report itself, on an iPhone.** None of the above has been seen on WebKit. The next play on iOS
after this ships is the test. If it comes back the same, the cause is none of these three, and the
instrument owed is a readout of `visualViewport.scale`, `offsetTop` and `scrollY` on the device.

**A pinch on the gate.** The prompt is left zoomable on purpose
([0024](0024-the-accessibility-floor-is-settings.md)'s floor, in `suppressBrowserGestures`). A player
who zooms it in and then turns home may still come back zoomed. Script cannot reset a pinch zoom
without taking zoom away from the page, and that trade has not been made.
