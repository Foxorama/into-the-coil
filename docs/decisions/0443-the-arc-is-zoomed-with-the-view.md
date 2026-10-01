# 0443 — The arc is zoomed with the view

**Accepted 2026-10-01.** It corrects an omission in [0364](0364-the-view-zooms-out.md), and moves
the reach that [0303](0303-the-reach-goes-up-a-rung.md) settled by playing.

## The ask

> *"We also need to make the lightning gun have a longer initial jump and do just slightly more damage
> as when we zoomed out the screen we didn't make the lightning gun proportionally longer and so we
> accidentally stealth nerfed it."*

## What was true

0364 took `ACROSS_SPAN` from 100 to 120, so everything is drawn at 1/1.2 of its old size. It retuned
the shuriken's speed, the shot life, the boss stations and fifteen sprites. The decision never
mentions the arc. A first jump of 68 units, drawn at the new scale, was a bolt a sixth shorter on
the screen than the one 0303 settled by playing.

## The rule

| | was | is |
|---|---|---|
| **the first jump** | 68 | **82**: 68 × 1.2, the length played, on the screen played now |
| **the jumps after** | `falloff` 0.6 | untouched, so the chain is 82 → 49 → 29.5 |
| **a hit's weight** | 2 | **2.2**: a tenth, which is *"slightly"* beside the jump's fifth |
| **its weight on a boss** | 1.5, the serpent's own 1 | untouched |

## Why it is built the way it is

**The ratio is 0364's, not a taste.** *"Proportionally longer"* has an exact meaning here: the view
grew by 1.2, so the bolt grows by 1.2.

**Only the first jump.** It is the one the player aims, and the one the ask names. 0302 made the
jumps after it a share of the jump before, so they lengthen with it anyway.

**Since 0441 there is one rung.** Each gun is its ship's at its old cap, so the cap's 68 is the only
number that moved.

Measured with the serpent at its 0441 health (900), the arc is the quickest gun at 31 s, three over
the floor.
