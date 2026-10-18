# 0622 — The water breaks at its end

**Accepted 2026-10-18.** From the play-test of 2026-10-18 —
[`the-play-test-of-2026-10-18`](../../reports/the-play-test-of-2026-10-18.md), item 8. Amends
[0610](0610-the-paint-sticks.md)'s cone and [0616](0616-the-water-flows.md)'s mist.

## The ask

> *"water gun special -> end needs to be a bit wider + splashier"*

## The rule

| | |
|---|---|
| **the end** | the spray opens to `tipWidth` 5.5 either side at its end, where 0610 opened it to 4, on a curve: `flare` 1.7 on the row, read by `streamWidth` as `(age / flight) ^ flare`. Half way out it is 2.66 either side, where the straight cone was 2.7, so the stream along its run is the one that was played; its last third throws open |
| **the landing** | through the same function, so it lands as wide as it is drawn (0250): the end lands a third wider |
| **the mist** | five puffs where 0616 had three, each swelling from 0.9 to 1.9 of a unit's scale where it went from 0.55 to 1.05 |
| **the splash** | a crown of ten drops off the tip (`JET_SPLASHES`), each thrown on its own heading up to 1.4 radians either side of the water's, out to 2.6 of the tip's half-width past it over twelve steps, larger as it leaves and fading as it flies, then thrown again on a new heading — one leaving every step or so, so the end is always breaking up. None before the spray has reached its front |

`flare` is on the row because a second jet with a different end is a number, not a branch (0282).

## The numbers that were moved after a picture

Photographed on the bench (`?ship=duck`, the special thrown through `__bench.throwSpecial`) at 0.3, 0.7 and 1.2 s.
The first crown — drops at 1.3 of a unit's scale, out to 1.6 of the tip's width — was a few specks lost against the
tip's mist; at 2.4 and 2.6 it reads as spray thrown off the end. The tip's strands already fanned to the new width.

## The screen, considered

[0295](0295-a-ranking-guard-is-a-content-limiter.md): the end is 47 units off the nose at the ends of the swing, in the
middle of the lane where enemies come from. Every new mark is the player's water in the water's own inks, and no
hostile shot is a blue drop. The jet costs ten more blits (`BLITS_PER_JET`, 32), under the frame's budget.

## What guards it

`tests/duck.test.ts`, *0622*: the end is at least 1.3 times 0610's 4, and half way out within a tenth of its 2.7;
painted at a step of the fight, at least eight drops lie within 2.6 tip-widths of the tip, four of them beyond its own
edge, in pixels. 0610's guard that it is drawn as wide as it lands holds the new end. Probes in
`scripts/probes/0622-the-water-breaks-at-its-end.mjs`, all three seen red; 0610's landing probe is re-anchored.

## Owed

A play: whether a third wider is *a bit*, and whether the crown is splash or clutter. All three are numbers in the
row and at the top of `src/render/scene.ts`'s jet.
