# 0518 — The place stays behind the menus

**Accepted 2026-10-05.** A report against the Freeplay build (0517, *no quarters given*, still a
branch when this was written), with a question attached:

> *"during the freeplay run when you continue, the screen loses all the skins and shows a bare sky and
> the OG graphics — like the fish boss shows as green on a black starfield."*
>
> *"have we just layered effects on top of effects and is that causing massive performance issues?"*

## What it was

`placeOnScreen` in `src/app/mount.ts` decides which place the backdrop, the atlas, the weather and the
land are baked for. It was a list: `playing`, `cleared` and `outro` drew the field's place, and every
other screen got `audition`, which is `null` outside the music room — the title's void, and an atlas
baked as The Approach. [0340](0340-the-coil-is-a-route.md) had already found this once for the level
break and added it to the list. The screens added since did not get added: the run-over screen
([0068](0068-a-run-over-is-a-continue.md)), the pause, its quit question and its count-in
([0511](0511-the-run-can-be-paused.md)), and 0517's game over. Each one swapped the place out behind
the menu and swapped it back when the menu went: the void and an unskinned boss for as long as the menu
was up, and through the count-in after a pause.

Measured on 0517's branch, a probe build exposing the place, at level six:

| | screen | place drawn | atlas baked as |
|---|---|---|---|
| flying | `playing` | mire | mire |
| lives gone | `gameOver` | *(void)* | approach |
| continued | `playing` | mire | mire |
| paused | `paused` | *(void)* | approach |

## What it cost

The second question is answered by the same measurement. Headless Chromium, 1920×1080, rAF intervals
over four seconds of each level's opening and over each screen change:

- **Flying, all seven places:** p99 16.8 ms, worst frame 18.3 ms, no long tasks. The layered effects
  are not costing frames in flight.
- **Into the run over:** a 315 ms long task. **Continue:** 287 ms. **Pause:** 299 ms, and the same
  again on the way back. That is the atlas being re-baked from scratch — every sprite, the weather,
  the landmark and the land — twice per menu, for a picture nobody was meant to see change.

So the stalls were real and this was them. **Owed, not claimed:** the headless measurement is not the
desktop's GPU, and it flew each level's opening, not its boss fight. A frame trace of a boss fight on
the player's machine is what would discharge *nothing else is slow*.

## The rule

**A screen of a run draws the run's place.** `inRun` already says which screens are part of a run
([0418](0418-the-heart-lets-go.md)), and the music has read it since; the picture now reads it too, so
the two cannot disagree and the next screen laid over the field cannot fall through. The intro and
the crossing keep their own answers (0416, 0340). The rule moves out of `mount` into
`picturePlaceFor`, beside `musicPlaceFor` in `src/app/music.ts`, so it is a unit test rather than a
canvas.

## The guard

`tests/place-held.test.ts`, by screen name rather than by `inRun`, since the function reads `inRun` and
a test that did too would prove only that the code agrees with itself
([0027](0027-measure-the-picture-not-the-model.md)): the run over, the pause, the quit question and the
count-in draw a late level's place; the title and the victory screen draw the void. Probe
`scripts/probes/0518-the-place-stays-behind-the-menus.mjs` puts the list back, and it goes red on the
run-over screen.
