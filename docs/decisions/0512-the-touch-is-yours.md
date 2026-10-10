# 0512 — The touch is yours

**Amended by [0590](0590-the-settings-are-tidied-and-the-game-has-a-left-hand.md)**: the trigger side became
the hand, offered on every device, and *Left* mirrors the whole field with the discs.

**Accepted 2026-10-04.** Item 4 of [`the-menus-reviewed`](../../reports/the-menus-reviewed-2026-10-02.md),
the touch section. Asked as *trigger side, sensitivity, both, neither?*, and answered **both**.

## The rule

**On a screen that can be touched, Settings has two more bands. *Triggers* puts the trigger discs up
the right edge or the left one. *Steering* is Gentle, Standard or Quick. Both are kept with the other
settings ([0510](0510-the-settings-are-kept.md)).**

| | |
|---|---|
| **Triggers** | `right` (where [0358](0358-a-trigger-is-a-button.md) put them, and the default) or `left`, at the same inset and size. The hit test (`triggerX`, `tapZone`) and the drawn discs read the one setting |
| **Steering** | a ratio on [0032](0032-touch-is-relative-drag-and-not-a-stick.md)'s measured `DRAG_GAIN`: 1/1.4, 1, 1.4. Standard is the measurement unchanged. The stick scheme is scaled by the radius a full deflection takes. **Play numbers** |
| **where** | `on: 'touch'` on the two choices. The chrome hides them, and takes them out of the cursor's walk, where `touchable` is false: the same capability the trigger strip is shown by, so a touchscreen laptop gets them |
| **kept** | in `itc_settings`, still version 1. A version-1 document from before has neither field and reads as their defaults, on 0510's per-field rule, so adding a kept setting is not a new version |

## Why it cannot reach the game

[0024](0024-the-accessibility-floor-is-settings.md): no comfort setting may touch the sim. A hand
chooses where a tap counts as a trigger. A steer chooses how many pixels of drag ask for a full
step's travel. Both are answered in `src/app/touch.ts` before the `Intent` exists, and a full
deflection is still one step of `SHIP_SPEED`, so *Quick* reaches top speed with less finger and
never goes beyond it. `tests/touch-section.test.ts` holds both: no stop asks for more than full speed,
and nothing in `src/sim`, the frame, the boss or the painter imports the table.

## What it found: Settings was laid out for a page nobody touches

Every layout guard opened a page that could not be touched, and the touch section exists only on one
that can. With five bands in one column, Settings was 505 px of content on a 390 px phone and 39 px
too tall on a touchscreen laptop. At 480 and 667 wide, *Gentle* and *Quick* were drawn under the step
arrows. None of it was visible to a guard. So:

- **Settings is two columns on a touch screen, and the second column is the touch section**, filled
  down the columns so the walk's order and the eye's agree.
- **On a touch phone a band loses its steps and its label, at every width.** A thumb taps the segment
  it wants, and the band still names itself to a reader. This went by width first, below 760, and CI's
  wider fonts found the steering words under the arrows at 480 and then at 812, each a few pixels past
  where this machine's ended. A rule that holds by a margin of fonts is not a rule.
- **`tests/layout.browser.test.ts` opens Settings on a touch page at every viewport**, with each band
  showing its longest line: no scroll, no segment under a step, every segment drawn whole. It went red
  on the defects above before they were fixed.

## Considered and not done

**The left-hand discs stand where the ship flies.** The ship holds the left of the lane, and the left
edge is where it does. A left thumb asked for the triggers there; nothing else moved to make room. If
play says the discs hide the ship, the answer is about where the ship holds, and it is a different
decision.

## What guards it

- `tests/touch-section.test.ts`: the same swipe moves the ship further at each stop, and Standard is
  the measured gain, in the player's pixels. No stop asks past full speed, and the stick scales too.
  With Left, the left disc fires and the same tap mirrored steers. The two sides are mirror images.
  The sim cannot see the table.
- `tests/touch-section.browser.test.ts`: the bands are on a touch page and not on a desktop. With
  Left, every disc is drawn within a pixel of where the hit test reads a left thumb.
- `tests/layout.browser.test.ts`: Settings on a touch page, at every viewport.
- `tests/settings-kept.test.ts`: both are kept, and an older document reads as their defaults.

Probed in `scripts/probes/0512-the-touch-is-yours.mjs`. 0032's, 0060's and 0510's anchors moved with
the lines they break.

**Photographed** at 844×390 and 480×320 at a device scale of two: Settings in two columns, and a run
with the discs up the left edge.

## Rollback

**Touches an irreversible surface: two fields added to `itc_settings`**, without a version bump.
Reverting the code leaves `hand` and `steer` in players' documents, unread. Re-landing must read them
under the same names or ignore them.
