# 0445 — The backdrop is deeper

**Accepted 2026-10-01.** A taste, on [0192](0192-a-guard-holds-an-invariant.md)'s terms: no change to
the content would redden a guard for it and be wrong, so it has none. **Amends the drawing
[0343](0343-the-stars-are-drawn-for-a-desk.md) gave The Approach's band, the dust
[0345](0345-ember-nebula-is-in-colour.md) gave Ember Nebula, and the Pillars' rim and crowns
[0346](0346-the-pillars-fill-the-sky.md) lit** — and keeps every number 0346 placed them with: the
stands are as big, as many and where they were.

## The ask

> *"work on the background in ember nebula, it's too close to the screen for the orange nebula and
> pillars, it needs to feel like it's set deeper in the background and backdrop. same in level 1 for
> the nebula as well, feels too close to the screen."*

## What made it read close, measured first

Distance is read off five cues: how fast a thing slides, how big it is against the frame, how much
contrast it has against what is behind it, how sharp its edges are, and whether it competes with the
things in front. Each was checked against the 1080p photographs (`scripts/shot-place.mjs
--view=1920x1080`) before anything moved.

| cue | The Approach's band | Ember Nebula's gas | the Pillars | verdict |
|---|---|---|---|---|
| **parallax** | 0.09 of the camera: 29 px/s at 1080p, 66 s to cross | the same | 0.07–0.08: 23–26 px/s | **not the cause.** The slowest things on screen by 3.7× against the far stars at 0.33, and slower than any further cut could be noticed in a minute-long crossing |
| **size** | a third of the lane, rising and falling a ninth of it once a screen | — | 1.35–1.7×, the organ's stand taller than the lane | the band's billow is a near-object's motion; the Pillars' size is 0346's ask and is kept — big and far is a matter of haze, not of shrinking |
| **edges** | eight ribbons at 0.065 each: **eight ruled contours** up each flank, and two rifts as one crisp stroke at 0.42 | nine filaments as one crisp hairline at 0.3; three lane passes and three globule passes, each step a visible contour | the rim one crisp stroke at 0.85, ~5 px at 1.7× | **the main cause.** An edge you can count is an edge the eye can focus on, and focus is distance |
| **contrast** | — | — | the columns filled in the bare `space`, so **darker than the empty sky between the clouds** — the darkest thing on screen | **the Pillars' main cause.** Far things fall towards the colour of what is between you and them |
| **competition** | — | — | the rim and the crowns (0.55) were the hottest, most saturated orange on the screen, in the raiders' own hue ([0228](0228-an-enemy-wears-its-place.md)) | a backdrop that out-shouts the game is not behind it |

## What changed, per place

**The Approach** (`STRUCTURE_OF.approach`): the band is laid in **twenty** ribbons whose alpha rises
from 0.012 at the outside to 0.04 at the core — the same light at its centre (0.41 against 0.42), no
step big enough to be a line, and wider at its flanks so it thins into the dark. Its wander and swell
are about half what they were (0.022 → 0.012, 0.3 → 0.16): a galaxy seen edge-on is long and nearly
level. Each rift is three strokes, widest and faintest first, 0.29 dark at its core against 0.42.

**Ember Nebula's gas** (`STRUCTURE_OF.nebula`): each dust lane five passes rather than three over a
wider spread, 0.41 at its core against 0.53; each filament a halo and a fainter core (0.22 against
0.3); each globule five passes rather than three. Same curves, same seeds, same places.

**The Pillars** (`drawPillars`):

| | was | is |
|---|---|---|
| the dust | `space` | `mix(space, ink, PILLAR_HAZE)`, 0.3 of the way to the gas — still a silhouette against the lobes behind it, which are the gas at up to 0.95 |
| the rim | one stroke at 0.85 | six strokes, widest and faintest first, 0.40 at the core |
| the crowns | 0.55, far 0.3 | 0.4, far 0.22 |
| the streamers | 0.3 | 0.18 |

⚠️ **The rim was three strokes first, and the photograph showed three stripes.** A step of 0.14 at a
stroke's edge is a line in its own right at 1.7×; six smaller steps read as light.

**Every value is the place's own** ([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)):
`PILLAR_HAZE` is read by the Pillars alone, and the passes and weights sit on each place's row in
`STRUCTURE_OF`. `WEATHER_DEPTH` and every landmark's `depth` and `scale` are untouched, which is the
parallax finding above.

## What it cost, measured

`scripts/weigh-sky.mjs`, worst ink against the backdrop with everything the sky draws on it:

| place | palette | before | after |
|---|---|---|---|
| The Approach | vivid | 4.55 (1.52×) | **4.62 (1.54×)** |
| The Approach | high contrast | 4.17 | 4.17 |
| Ember Nebula | vivid | 4.33 | 4.33 — every mark changed here is dark, and dark is free (0222) |

The luminance floor is not spent; it gains a little. The Pillars are not counted by it, and nothing
in them got brighter: the dust is lifted towards the gas and stays below it, and the rim and crowns
both fell.

## Why no guard

*"The backdrop reads as deep"* is a picture, and every quantity that would stand for it here — a
ceiling on a mark's alpha, a floor on the Pillars' fill, a count of passes — is a number chosen today
asserted against tomorrow, and would redden the next place that is right to draw a crisp edge
([0295](0295-a-ranking-guard-is-a-content-limiter.md)'s *ask whether it makes sense for THAT THING to
be hard*). The guards that hold what is invariant here all re-ran green: the contrast floor
(`tests/sky.test.ts`, `tests/themes.test.ts`), 0345's *the dust has no corner*, 0222's band, and every
0346 guard on the Pillars' size and fit.

## What is owed

**An eye, in motion, on the preview.** A photograph shows edges and contrast; whether the Pillars now
sit *in* the nebula rather than on the glass while the gas slides over them is a thing only a play
can say. If they read too far — washed out — `PILLAR_HAZE` and the rim's weights are the levers; if
still too close, the next lever is their scale, which is 0346's ask and goes back to the player
before it moves.

**A dark soft disc in The Approach's band**, about 20 px, is in the shots before and after and is not
this change's: it drifts at about 0.18 of the camera, which no sky layer here does. Recorded rather
than chased.

Shots: `shots/before/` and `shots/after/`, untracked, the same three points per place.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
