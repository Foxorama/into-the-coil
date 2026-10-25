# 0682 — The phone pass, again

**Accepted 2026-10-25.** Item 9 of [`the-menus-planned`](../../reports/the-menus-planned-2026-10-24.md), the last,
from [`the-menus-reviewed-again`](../../reports/the-menus-reviewed-again-2026-10-24.md). It amends:

- [0566](0566-the-phone-pass.md): the phone held upright is photographed and held by the layout guard.
- [0571](0571-the-dock.md): the cockpit strip on the deck is not drawn on a touch phone.
- [0511](0511-the-run-can-be-paused.md): on a touch screen the pause plate stands clear of the score.
- [0572](0572-the-dock-is-dressed.md): a keeper's bubble hangs clear of the balance.

## The ask

On a phone the cockpit strip stood on the deck under the ship, over the picture a phone has least room for,
saying what the plate's bands already say. The pause plate stood at the score's elbow, and the score pops toward it
on every gain. The title's pilot band showed faces and no names on a phone, so the face picked said nothing. And the
upright layout 0566 built was in no handover's photographs, so nobody looked at it.

The player's answer, given before the build: the phone's cockpit strip is not drawn, and the shards sheet stays.

## The rule

| | was | is |
|---|---|---|
| **The cockpit strip on a touch phone** | drawn on the deck under the ship | not drawn, under the touch phone rule (under 460 px tall, or upright and under 700 px wide). The readout is still moved into the dash's cell (0539), so what reads it by class still finds it |
| **The pause plate on a touch screen** | 0.6 em from the score's box. Measured at 844×390, the digits at the top of their pop stood 3.5 px over the plate | the strip's width from it, and the digits keep their reach beside them as a margin: 1.22 times eight digits at the strip's 1.45 em, tracked 0.05 em, less their own width |
| **The chosen pilot on the phone's title** | a face, unnamed | the face, and the name under it. Only the one chosen: every name was taken off the phone in [0521](0521-the-hangar-opens.md) for width |
| **A keeper's bubble** | hung over the keeper's head, wherever the balance was | the same, unless it shares columns with the balance: then it hangs from under the balance, and may cover the top of the keeper's awning. Placed again when the balance changes height |
| **The handover's photographs** | the pair, the guard's six, and the wide two for the hangar family | and `--sizes=portrait`: 390×844 and 412×915, touch, walked on its side and turned upright for each picture, because the title is gated upright ([0031](0031-landscape-is-the-shipped-orientation.md)) |

## Done differently from the plan, and not done

- **The pause plate was already left of the score.** The plan asked for it to move there. It has stood there since
  0511, because the trigger discs stack up the right edge. What it lacked was the gap.
- **The gap is a margin as well as a gap.** The strip's width alone was not enough. The digits pop from their right
  edge, so their left edge reaches back by a fifth of their own width, about 21 px at 844×390. With only the gap, the
  popped digits were 20.5 px from a plate 31.2 px wide; with only the margin, 19.2 px.
- **A keeper's bubble moved, which the plan did not ask.** Photographed for this item, Cosmo's bubble stood over the
  balance's second line at 844×390, and over all of it held upright at 412×915. Held upright at 390×844, Unity's stood
  over the sheet's words on Hangin' Out. [0681](0681-the-dock-dressed.md) made Cosmo's worse: it stood his shop
  forward and taller, and his head higher. It can be seen in 0681's own photographs, and was not looked for there;
  0678's show the bubble already touching the sheet's rim. The player's answer was that the sheet stays, so it is
  fixed here, with its own guard.
- **The balance at 480×320 is still not seen.** The plan said to confirm it. Confirmed: on the narrowest phone the
  plate takes the width and the stand lies behind it at a third of its strength, and the balance is in the stand
  (0572). 0566's comment says it moves into the plate's foot beside Back. It does not. It is placed once, in the
  stand, when the screen is built. Placing it by the screen's size would need it moved on every resize, and where it
  stands in a plate that is already full at 320 px tall is a layout question. Owed, below.
- **Safe areas** stay owed on a device with a notch, as the plan said. The script cannot see one.

## What it cost and the guards it moved

Stylesheet rules, and one more read of a box when a bubble is placed. No sim, no save, no shipped surface.

- **`tests/layout.browser.test.ts`**, *0682*, new: six tests.
  - At 390×844 and 412×915, touch, upright: every screen that stands is drawn whole on the display, every control
    is pressed where it is drawn, and none needs scrolling. They are held as the landscape six are.
  - At 844×390 touch and at both upright sizes: on each tab, reached by its tab, the keeper's bubble and the balance
    share no area.
  - At 844×390 touch: the chosen pilot's name has a box, whole on the display, and on each tab the dash has none.
- **`tests/pause.browser.test.ts`**, *0682*, new. At 844×390 touch, from the pause plate's right edge to the left
  edge of the score's digits at the top of their pop, at least the plate's width. In CSS pixels, the pop held at its
  first frame.
- Probed in `scripts/probes/0682-the-phone-pass.mjs`, PROVE_RESULT

**Not held by any guard:** that the plate's own reach for a thumb (0511's `::before`) clears the score. It is a hit
area and not a picture. Also not held: that the bubble covering an awning reads well.

**Photographed** with `scripts/shot-menus.mjs` at the pair, the guard's six and the two upright sizes.

## What is owed

- A play with a phone in a hand: whether the pause is easy to reach and never pressed by mistake, whether the bubble
  hung lower reads as the keeper's, and how the upright hangar feels held.
- **The balance on the narrowest phone.** At 480×320 it is behind the plate. Either it moves into the plate's foot by
  the screen's size, or it stands over the plate. The player chooses.
- Safe areas, on a device with a notch.
