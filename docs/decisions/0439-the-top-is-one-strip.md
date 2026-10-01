# 0439 — The top is one strip

**Accepted 2026-10-01.** Restyles [0045](0045-the-player-can-see-what-they-are-carrying.md)'s
readout, [0360](0360-the-boss-has-a-health-bar.md)'s boss bar and [0428](0428-the-score-is-kept.md)'s
score into one row of plates. It keeps the grid, its columns and both decisions' guards.

## The ask

> *"the top in game elements, ship info etc boss bars and score aren't cohesive design and don't all
> sit on the same line across the top of the screen"*

## What was there

Measured at 1280×760 on the bench with a boss up:

- the readout: bare icons and counts, centred about 34 px down, with no box;
- the bar: a 0.6em outlined pill, hung 0.9em down, about 24 px;
- the score: three lines tall, the *SCORE* caption at 20 px, the digits at 50 px and the streak at 85 px.

That is three heights, three centre lines and three visual languages.

## The rule

**Each of the three is a plate of one height, `--itc-strip`, on one centre line. Every plate has the
same glass of the void and the same rim, the studio's violet into cyan
([0440](0440-every-screen-speaks-with-the-titles-voice.md)). Each keeps its own ink inside: the cyan
readout, the enemy's bar, the gold score.**

| | |
|---|---|
| **the readout** | unchanged inside, now on a plate |
| **the bar** | the plate holds a track. The fill is a lit capsule in the enemy's ink, and the phase notches are cut through the track in the void, so they read over the full part and the empty part alike |
| **the score** | one line: the eight rolling digits, then the multiplier with its streak bar under it. The *SCORE* caption is gone |

## Why the caption went

It made the score three lines tall, and fitting a plate one line tall to it was the point. Eight padded
gold digits in the top right corner are the genre's own picture of a score, and the element's label
still says *Score N, times M* to a reader (0024). A caption beside the digits was tried on paper and
refused: at 667 px it makes the score wider than its column, and the grid would take the room from the
bar.

## Considered, not done

- **A caption on the bar** (*BOSS*, or the boss's name). Rows have no display name, and a caption
  would be the bar's alone after the score lost its own.
- **A backdrop blur on the plates.** It is compositing work over the canvas on every frame for an
  effect the glass already gives. [0022](0022-frame-rate-is-a-feature.md) has nothing to gain from it.

## Held by

`tests/hud.browser.test.ts`, *0439*, in pixels: at 667×375, 844×390, 915×412 and 1280×720, with the
bar raised and the score at its widest, the three boxes share a centre line and a height to a pixel,
and nothing spills out of any plate. The spill check exists because a fixed height makes a box measure
as on the line whatever overflows it, and the first probe written against the box alone could not
fire. 0360's and 0428's guards (no overlap, score top right) pass unchanged.
`scripts/probes/0439-the-top-is-one-strip.mjs` hangs the bar low and stands the score in a column.

## Rollback

Nothing irreversible.
