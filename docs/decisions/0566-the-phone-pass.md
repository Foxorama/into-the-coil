# 0566 — The phone pass

**Accepted 2026-10-07.** Item 7 of the queue in
[the hangar family, reviewed](../../reports/the-hangar-family-reviewed-2026-10-07.md), its §5. Amends
[0031](0031-landscape-is-the-shipped-orientation.md)'s gate for the screens that stand in the port.

## The ask

The review, measured on an 844×390 touch phone: the tab strip was 31 px tall and 27 px at 480×320,
against the 44 pt / 48 dp floor. The readout's counts were 9.6 px. The row labels were gone, so two
bands side by side read *Catherine wheel* and *Candle* with nothing to say which was the gun. Names and
lines ended in ellipses. And the player's answer: **portrait is allowed in the hangar family.**

## The rule

| | |
|---|---|
| **portrait** | 0031's gate stands down while a screen that stands in the port is up, and comes back for every other screen. Back from the hangar to the title, held upright, is gated again. The room is still drawn side-on, across the top of the screen, with the plate the screen's width under it. The world is given the landscape view of the screen turned on its side, so everything that reads the view reads a side view |
| **why the gate may stand down here** | 0031's reason is the flight: side-profile art moving the wrong way across a portrait screen, which took the predecessor's player out of the game. Nothing in the hangar moves anywhere. The room is a still picture with a ship idling in it, and nothing can be flown from it: *Fly* is the title's, and the title is gated |
| **the camera upright** | 0563's fit, down the column as well as across it: the pad stands at the camera's share of the stand's own height, and the deck may end short of the screen's foot, where the plate is |
| **touch targets** | on a coarse pointer the tabs and the ‹ › arrows take presses from a box grown past what is drawn, to about 44 px, without moving anything on the plate |
| **swipe** | a thumb drawn across a band steps it, as its arrows do. The tap that ends a swipe is not also a press |
| **labels** | each band's name is back over it on a phone, small. The lines under the bands went in 0562, which paid for the height |
| **type** | the readout on the stand has a floor of 0.9 rem, where it was 9.6 px. Upright it is set by the width |
| **lines** | the pilot's line on Paint & Parts and Cosmo's is the name alone on a phone. Cosmo's line may take two lines |
| **safe areas** | the plate's sides keep clear of a notch (`env(safe-area-inset-*)`), and its top and foot do too upright. **Not checked on a device with a notch**, which is the only way to check it |

## What it does not do

The review's 480×320 layout, with a strip of the ship over a single-column plate, is not built. With
0563's camera fitted to the column, the ship is in the stand at 480×320 under the plate's glass, and
the layout guard holds the plate whole at that size. A strip of the ship there would cost the plate a
quarter of its height on the smallest screen the game supports, which is a trade for the player to
weigh, not a fix.

## What the guards say

`tests/upright.browser.test.ts`: in the hangar held upright there is no prompt, the room is drawn the
screen's height, the stand stands over the plate, Back is on the screen, and Back to the title brings
the prompt back. Its two probes gate the hangar again and leave the gate down on the title. 0031's
resize probe was moved to the new gate, and all six of 0031's probes were seen red again.
`tests/layout.browser.test.ts` holds the six landscape sizes. Every layout change here was checked under
`* { letter-spacing: 0.05em }`, which reproduces CI's wider letters.

## What is owed

A play on a phone, upright and on its side, and a look on a device with a notch.
