# 0563 — The ship is the picture

**Accepted 2026-10-07.** Item 4 of the queue in
[the hangar family, reviewed](../../reports/the-hangar-family-reviewed-2026-10-07.md), its §1.1.
Amends [0548](0548-the-hangar-holds-still.md)'s one camera's distance, and not its being one.

## The ask

The review measured the pilot's ship on the pad at about 170 px of a 1280×720 screen, smaller than the
keeper's counter beside it. At 1024×768 the plate covered its nose, and at 480×320 the stand is not
drawn. It asked for the ship to own the stand, the keeper framed at its edge, and a camera per tab.

## Pushed back, and kept

**One camera, as 0548 has it.** The review's camera per tab, with a dolly between them, is what 0548
was asked to undo: *"the room jumped a size every time the tab was stepped onto."* An eased move is
still a jump. The tabs keep the one camera, brought closer. Whether a slow dolly would read
differently is a question for the player, raised in the handover and not built.

## The rule

| | |
|---|---|
| **closer** | the stand's camera is on the pilot's pad, at 1.9 where it was 1.4 |
| **fitted to the column** | `fitStand`: the row's camera is fitted to the column the plate actually leaves. The pad stands at `STAND_PAD_AT` of the column, and the camera draws back from the row's zoom wherever the ship's box would pass `STAND_SHIP_SHARE` of the column, or the keeper, their counter or the back wall's viewport would be more than a quarter off the screen's left. The keeper and the stars are each the player's own ask (0550). The column is read off the laid-out page (`standBox`), so a 4:3, a phone and 0562's growing plate are answered by one line |
| **on a resize** | the camera is fitted again. The stand's view was only written when the screen changed, so a window resized in the hangar kept the last size's camera |
| **sharper** | the port's ship pieces and every keeper's figure and counter are baked as much sharper as the camera is closer. A sprite is drawn at its extent whatever its bitmap's size, so nothing else learns of it. The room behind them is left soft, which the eye reads as depth. The intro's port, baked plain, is baked again when the stand opens |
| **the stall** | six units nearer the pad, so its sign is read whole beside the ship at the closer camera |

## What it bought, measured

At 1280×720 the ship's box went from about 200 px to about 230 px. **That is 15%, not the third to
two fifths of the screen the review asked for.** What limits it is not this number but three things
the player asked for: the keeper whole at the counter, the stars through the viewport, and the
ship in its column clear of the plate. A ship much larger than this means a stall and a viewport
somewhere else in the room, or a narrower plate, and that is a picture question for the player
before it is a camera. At 1024×768 the ship no longer runs under the plate.

## What the guards say

`tests/stand.test.ts` draws the stand through `fitStand` with the stylesheet's column modelled. The
0542 and 0550 guards keep the keeper and the viewport in view through it, and a new one holds the
ship's box past a sixth of a laptop's width. Its probe puts the camera back at 1.4. Two probes
whose anchors the change moved were moved with it.

## What is owed

A look, and the player's word on the room: whether the stall and the viewport may move so the ship
can be larger, and whether a dolly between tabs is wanted after all.
