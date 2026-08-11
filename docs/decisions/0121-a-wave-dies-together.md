# 0121 — A wave is close enough to die together, and only on one axis

**Accepted 2026-08-11.** Reported from play:

> *"I'd like the individual waves to have tighter clusters of enemies — when they're spread far apart
> the music beats have less impact if you kill 1-2 enemies than if you kill 3-5."*

## The rule

**A wave's members sit inside the width of one volley.** `ACROSS_GAP` is bounded above by the fan the
player actually fires and below by the widest body in the game, and both bounds are measured rather
than typed.

## Why it is a music report

⚠️ **IT IS A CLAIM ABOUT [0109](0109-a-death-is-a-drum.md).** A death is a drum, and a drum struck
once is not the same event as a drum struck five times. The report is not that waves are too easy or
too hard — it is that the game's most repeated sound is being played too thinly.

## The number is squeezed from both sides and one integer fits

`src/content/pickups.ts` fans a volley at `SPREAD_STEP` 0.13 radians a barrel; four barrels span
0.39, which is a width of `2 · d · tan(0.195)` — about **0.395 × the distance ahead**, so **19.75
units** at the fifty a wave is typically engaged at.

| gap | 3 abreast span | inside the volley | clear air between the widest bodies |
|---|---|---|---|
| 8 | 16.0 | yes | **0.0 — they touch** |
| **9** | **18.0** | **yes** | **1.0** |
| 10 | 20.0 | **no** | 2.0 |
| 11 — before | 22.0 | no | 3.0 |

⚠️ **8 WAS THE FIRST ANSWER AND THE GUARD REFUSED IT.** The widest enemy is radius 4 — **8 across** —
so at a gap of 8 two neighbours touch exactly. The comment being replaced still said the widest
hurtbox was 3.7, which is why the bound is driven off `ENEMIES` and not off a number in prose.

⚠️ **FIVE ABREAST IN ONE VOLLEY IS NOT AVAILABLE AT ANY LEGIBLE SIZE.** It needs a gap under 5 against
bodies 8 across. **Three reliably, four often, five when the player has closed in** is what the
geometry allows, and
[0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md) is what buying more
would spend.

## The along axis was measured and deliberately left alone

⚠️ **IT WAS CHANGED TO 10 AND THE CHANGE WAS WRONG.** A probe that **refused to fire** is what
established that — the first guard asked whether a column of five passed inside two bars, which was
true at 14, true at 10 and true at 26. **A bound nothing was near**, which is the vacuous shape
[0116](0116-the-rig-plays-the-level.md) already found once in this repository.

⚠️ **AND THE REAL PROPERTY SAYS 14 IS RIGHT.** A beat is **14.4 world units** at 36 units a second:

| gap | neighbours arrive | on the grid |
|---|---|---|
| 10 | 0.69 beats | no |
| **14** | **0.97 beats** | **yes** |
| 20 | 1.39 beats | no |

At 14 a column's kills land on **consecutive beats** — the grid
[0093](0093-the-gun-is-on-the-grid.md) and [0096](0096-the-enemies-play-along.md) put every other
cadence in the game on. **10 would have taken them off it**, which is the opposite of what the report
asks for.

⚠️ **SO THE REPORT IS ABOUT THE ACROSS AXIS AND ONLY THE ACROSS AXIS.** A volley has no depth —
bullets are points — so the along gap decides *how long between kills*, never *how many*. The guard
that replaced the vacuous one fires in **both** directions and is what stops this number drifting
either way. [0105](0105-a-body-is-on-screen-long-enough-to-answer.md) is the precedent for measuring a
second axis and saying it was already right rather than tuning it anyway.

## What was rejected

**Tightening until five die together.** The arithmetic above: it needs bodies to overlap.

**Widening the volley instead.** `SPREAD_STEP` is a weapon number and moving it changes every
engagement in the game to fix the density of one. The wave is the thing the report is about.

**Making it a difficulty column.** Density per tier is `src/content/difficulty.ts`'s and this is a
property of what a formation IS. A tier that spread its waves would be a tier where the drum plays
differently, which is not what a tier is for.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| the wave spread back to where a volley reaches two of it | `THE REPORTED ONE: a volley reaches three abreast, where it used to reach two` |
| the gap tightened to where the widest bodies touch, which is legibility spent for density | `and they still do not overlap, which is what stops it going tighter` |
| the column tightened off the beat, so consecutive kills land nowhere the music is counting | `THE ONE THAT SAID THE ALONG AXIS WAS ALREADY RIGHT: a column arrives a beat at a time` |

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). One constant, and every authored
wave is unchanged — `tests/level.test.ts`'s lane-edge refusal has more slack at 9 than it had at 11.
