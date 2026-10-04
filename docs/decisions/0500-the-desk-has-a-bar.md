# 0500 — The desk has a bar

**Accepted 2026-10-04.** Adds to [0364](0364-the-view-zooms-out.md)'s camera and keeps its one rule:
the lane is still `ACROSS_SPAN`, fully visible on every device. Leaves
[0080](0080-the-box-is-the-screen-and-the-screen-is-16-9.md)'s box where it is.

## The ask

> *"overall the game looks way better on mobile — more screensize overall … in desktop I'm using
> 1920x1080 and … screenspace is tight"*

When offered bars at the top and bottom so a monitor sees further ahead:

> *"can we do that without affecting mobile? … can we shift the hud and things into the bar at the
> top on desktop?"*

Played in a maximised window, and on the bar's size:

> *"halfway should be about the size of our hud layout now and then just a tiny bit for bordering
> around the top and bottom"*

## What was true

The view is always the lane tall, so how far ahead a screen sees is its aspect. A maximised 1920×1080
browser window plays at about 1920×950, which is 2.0 to 1 and shows 241 units ahead. The player's phone
plays at 2.37 to 1 and shows 284. The HUD is a strip of plates laid over the top of the field.

## The rule

**A desktop keeps a bar at the top for the HUD, and the world is fitted to the screen under it.** The
bar is exactly the strip:

- the strip's own air above its plates (0.5 em of its type);
- the plates themselves (2.6 em);
- the same air again below them.

At the player's window that is 75 pixels. The world is fitted to the 1920×875 below it, which shows
**263 units ahead**, a little past halfway from 241 to 284.

| window | bar | seen ahead, was → is |
|---|---|---|
| 1920×950, maximised | 75 px | 241 → 263 |
| 1280×720 | 75 px | 213 → 238 |
| any phone | none | unchanged |

**A touch screen keeps none.** That is the same question the trigger strip already asks (0060): can a
finger land here? The phone already sees further than any monitor, and it is the screen the player
says looks right.

## How it is built

- **The camera is told the bar, and does not work it out.** `viewOf(width, height, bar)` takes the bar
  off the top of a landscape screen and fits the world to the rest. Without a bar it is the camera it
  was, so no fixture, rig or guard that asks for a view changes. A portrait screen, or a bar that
  would leave less than half the screen, gets no bar.
- **The bar's height is the strip's own numbers.** The strip's type and plate sizes were literals in
  the stylesheet. They are now `STRIP` in `src/app/chrome.ts`, which the stylesheet interpolates, and
  `hudBar` reads the same object. The bar cannot drift from the plates it holds.
- **The field is clipped to below the bar.** A flanker enters from past the lane's edge, and a big
  hull can reach over it. Before, both were off the canvas; with a bar they would have been drawn
  behind the HUD. The canvas backend's `clear` fills the bar black and clips the frame to the field,
  using the context's own save and restore. The surface stays three verbs wide.

## What did not move

**`MIN_ASPECT`, which is the player's box and the screen the levels are written for.** The ship flies
where it flew. A monitor now shows a strip past the box, as the phone always has.

## What it changes that was not asked for

**Everything on a desktop is drawn about 8% smaller.** That is the trade, and it is the one the phone
already makes.

**The picture guards are still asked at `viewOf(1280, 720)`, which no longer has a bar.** A real
1280×720 window now shows the field at about 89% of that size. Those guards hold a floor in pixels:
- the sky's 2.5 px marks (0106);
- a body's paint (0227);
- the 2-pixel cycle (0410).

On the player's 1920×950 window the field is bigger than the guards' screen: 7.3 px a unit against
6.0. A 1280×720 window is smaller, at 5.4. Re-judging every floor at the barred 720p screen is its own
pass, the one 0364 made for fifteen sprites. **It is owed, not done.**

## Rejected

- **A fixed floor on the aspect the camera shows**, which was this decision's first draft. It is a
  number, not the HUD. It did nothing on a maximised window, which is already 2.0. And it moved every
  guard that asks for a 1280×720 view: 21 of them went red.
- **Bars at the top and the bottom.** The bottom one would hold nothing.
- **A global zoom out.** It would shrink the phone too.

## Confirmed

- **The camera**, in `tests/camera.test.ts`: a 1920×950 window with a 75-pixel bar fits the lane
  under it and sees further. Portrait, an oversized bar and a bar that is not a number each keep none.
- **The page**, in `tests/hud.browser.test.ts`. At 1920×950, 1280×720 and 1366×657, the readout, the
  boss bar and the score are inside the bar, with equal air above and below. The bar is drawn black,
  and the row under it is not. A touch screen's top row is not the bar.
- **The picture**, photographed running at 1920×950 and on an 844×390 phone with touch. The HUD
  stands in the bar on the monitor. The phone is unchanged.
- **0500's probes** break each guard and see it go red.

## Owed

- A play in the maximised window.
- The picture guards' pass at a barred 720p screen, described above.
- Whether the bar should be black or the place's own dark.
