# 0440 — Every screen speaks with the title's voice

**Accepted 2026-10-01.** A taste, on [0192](0192-a-guard-holds-an-invariant.md)'s terms: it has no
guard, because no change to the content would redden one and be wrong. A later restyle is a correct
change. Extends [0436](0436-the-title-has-a-voice.md) and [0437](0437-the-title-is-lit.md) from the
title to everything else, and **reverses the direction of 0436's wordmark**.

## The ask

> *"we have the title colour showing now, but the menu buttons icons in game, choose your pilot at the
> start etc all haven't been updated."*
>
> *"also the new company banner is purple through to cyan, not cyan to purple so we'll need to update
> all that as well."* — with `vulpeculagames-site/assets/img/itch-banner.png`.

## The reference

The banner, sampled: the name runs from lavender on the left to sky blue on the right with a soft glow,
and a rule with a diamond at each end sits under it. Its rule inks are close to the palette's own
`ally` (#c9a7ff) and `player` (#7ae7ff), so the game needs no new colour, only the other order. Its
void carries a violet wash on the left and a deep blue on the right.

## The rule

| | was | is |
|---|---|---|
| **the wordmark** | cyan into violet | violet into cyan, as the banner runs |
| **every other heading** (golfers, break, run over, victory, music room) | the panel's plain cyan | the wordmark's treatment, and the banner's diamond-tipped rule under it |
| **a control** (every screen's buttons, the golfers' cards, the intro's *Skip*) | a 2px cyan outline on nothing | a plate: a glass of the void, a violet-into-cyan rim, and a cyan halo that rises under the pointer |
| **a chosen setting, the place playing** | filled with the cyan | filled with the violet-into-cyan run |
| **the golfer flying now** | a cyan tick | the tick filled with the run, and a card that lights as it lifts |
| **the title's void** | flat | the banner's two washes |
| **a touch screen's trigger discs** | a cyan rim | the plate's rim |

## Why it is built the way it is

**One section, last in the stylesheet, that sets no size.** It wins on source order over the rules it
restyles and touches only paint: rims, fills, shadows. The phone's own sizes under 0370's query stand,
the layout guard sees the same boxes, and every probe that anchors on the rules above still finds its
text.

**The rim is a background, not a border.** A border cannot hold a gradient and keep its radius, so the
rim is a second background clipped to the border box. The glass is a background *image* for the same
reason, so `background-color` stays what the rule above set it to. 0070's guard tells a chosen option
from a hollow one by that colour.

**The rule's diamonds are a mask.** A gradient cannot draw a diamond. The first version used a conic
one and drew a bow tie, and the screenshot showed it. So the run of the two inks is cut by a mask into
a line and two diamonds. The mask's SVG has no colour of its own, so the palette still colours the rule.
It hangs from the heading out of flow, so no screen grows a pixel.

**The palette's inks, not the banner's pixels.** A high-contrast palette sets the whole interface in
its own two inks. The banner's paler tints are the glow over these, not a third and fourth colour.

## What it leaves

The music room's controls, the crossing's nav plate (0341) and the finale's bubbles keep their own
looks. The music room's buttons get the plate because they are `-action`s. The plate is the crossing's
cousin rather than its copy, and the review did not reach those screens.

## Held by

Nothing, deliberately. The guards it had to keep passing (0070's fill, 0049's layout, 0060's discs,
0063's break, 0437's tiers) all run unchanged. One unrelated guard went red on this branch's run:
0415's splash test, which was reading wall clock. It is repaired here and its own comment says why.

## Rollback

Nothing irreversible.
