# 0433 — The readout is one voice

**Accepted 2026-10-01.** Items 2, 3 and 4 of [the screens review](../../reports/the-screens-reviewed-2026-10-01.md):
the in-game readout's icons, its events and its type, made one system after
[0430](0430-the-readout-counts-ships-and-shields.md) gave it the ship and the shields.

## The rule

| | was | is |
|---|---|---|
| **icons** | the ship and the bomb bare, a pickup's face in its bubble | every icon bare. `bakeGlyph` in `src/render/bake.ts` bakes a face with the bubble switched off and grows it back to the box, so a face and the bomb beside it are one optical size |
| **events** | a shield lost or gained toggled a class; a life lost changed a digit | a shield lost flares gold and drops into its socket, one gained pops in, a life lost shakes the ship in the loss ink. Not on the first call of a life, which is layout and not an event |
| **type** | counts in system-ui 600 | the score's weight, spacing and fixed-width figures, so a count going 9 → 10 does not shove the row |

The touch buttons ([0060](0060-a-trigger-is-a-place-on-the-glass.md), 0358) wear the same bare faces:
the disc round them is already the button's shape, and a bubble inside a disc was two rings.

## Why

**The bubble is a field word.** On the field it says *fly into me*
([0236](0236-the-guns-answer-the-first-play-test.md)); in the corner it said the same about a counter.

**An event the model resolves, the picture mentions** —
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md). A shield popping had a burst on
the ship and nothing in the readout, so a player looking at the lane learned their count only by
looking for it. The kicks are two classes swapped per event, as the score's pop is (0428): no timer,
no forced layout. Under reduced motion they flash colour and do not move, because the event is the
point.

## Rollback

Nothing irreversible.
