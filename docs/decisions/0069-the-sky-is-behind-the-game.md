# 0069 — The sky is behind the game

**Accepted 2026-08-07.** A tuning pass over
[0065](0065-the-sky-is-baked-and-blitted.md), which landed the sky the day before. Nothing about how
it is built moves: still two baked tiles, still a handful of blits, still no entities.

## The rule

**Nothing the background draws is as big as the smallest thing that can kill the player**, and the
near layer earns its depth from parallax rather than from size or solidity.

One size ceiling for the whole sky, stated in world units and held against `SHOTS`. The two layers
are told apart by three things that all point the same way: the near one is **fewer**, **fainter**
and **faster**.

## What was reported

> *"The closer to screen layer is too prominent, needs to be backgrounded a bit."*

## The measurement, which is the whole decision

`SKY_STARS` already carried a paragraph saying the near layer is sparser *"because fast-moving dots
near the player's eye are the ones that compete with a bullet"*. The reasoning was right and the
arithmetic beside it was not:

| | radius, in world units |
|---|---|
| a near star, before | **0.60 – 1.20** |
| a far star | 0.30 – 0.60 |
| `SHOTS.pulse` — the smallest thing that ends a life | **0.90** |

**The background's dots were drawn larger than a bullet.** A screenshot of the shipped page at six
seconds shows it plainly: grey discs and orange discs, the same size, in different inks. Fewness
cannot buy back a shape that size, and neither can dimming.

⚠️ **The old constant was a fraction of the TILE — `size * 0.012` — and that is why nobody noticed.**
A sky tile is `ACROSS_SPAN` units across, so a number that reads as *just over one percent* is 1.2
world units. Written as a fraction of the thing it is drawn on, a star's size could not be compared
with anything; written in world units it sits next to a bullet's radius and the answer is immediate.
This is [0027](0027-measure-the-picture-not-the-model.md) at the level of a unit rather than a rig.

## What changed, and what deliberately did not

| | before | after |
|---|---|---|
| star ceiling, near | 1.2 units | **0.6** |
| star ceiling, far | 0.6 units | 0.6 — **unchanged** |
| near layer alpha | 1 | **0.4** |
| count, parallax, ink, tile size, blit cost | | all unchanged |

**The far layer is untouched on purpose.** It was not what was reported, it was already below a
bullet, and *"the other changes are pretty sick"* was the verdict on everything else. A tuning pass
that also quietly retuned the half nobody complained about would make the next report impossible to
attribute.

**Size stops being a depth cue at all**, which reads backwards and is not. Whichever layer were the
bigger one, it would be either over the ceiling or indistinguishable from the other — there is no
room between *visible* and *0.6 units* for two sizes. Depth is carried by parallax, which
`src/app/mount.ts` runs at 0.3 against 0.12, and by the count and the alpha.

## Three variants, and the rig is what picked one

[0027](0027-measure-the-picture-not-the-model.md) owes an eyes-on look before a tuning pass on
anything the player watches move, and `scripts/shot.mjs` is that rig. Three builds, one screenshot
each, at the camera the game actually ships:

- **near at 0.34 units, alpha 0.55.** The sky recedes and the far layer, cut to 0.45, goes with it —
  more than was asked for, and it takes the thing the player liked with it.
- **near at 0.55, alpha 0.4.** Good, and it keeps *bigger means closer* — at the price of two
  ceilings where one will do.
- **near at 0.6, alpha 0.4, far untouched.** ← this one. The far field is pixel-for-pixel what
  shipped; the near field is a dim wash behind it.

⚠️ **No number here was reasoned to.** Every one was looked at.

## Confirmed, not assumed

Probes in `scripts/probes/0069-sky.mjs`. **3 red, and every tree back to what it was copied as.**

| broken on purpose | went red |
|---|---|
| the near layer's stars restored to the size they shipped at | `THE REPORTED ONE: no star is drawn as big as the smallest thing that can kill the player` |
| the size ceiling written as a fraction of the tile again, which is how it hid | `THE REPORTED ONE: no star is drawn as big as the smallest thing that can kill the player` |
| the near layer drawn as solidly as the far one | `and the near layer is the quiet one, on every count that buys attention` |

⚠️ **The guard reads `skyField`, which is what will be DRAWN**, and never `SKY_MAX_STAR_UNITS`. That
is why the drawing is split from the placement: a test that asserted the constant against a number
written beside it would go green on both of the first two breaks. The radii it measures are the ones
the bake loop uses.

⚠️ **The alpha's VALUE is not pinned, only its direction.** It is a hand's number on
[0037](0037-the-ship-has-mass.md)'s terms, exactly like the lives per tier that `tests/run.test.ts`
refuses to assert on. What is held is *the near layer is fainter than the far one*, which has to be
true at whatever a later play-test settles on.

## What this leaves owed

**The sprites are next, and this decision is half of that ask.** The same report:
*"we'll need to start looking at adding in more detailed sprites now to counteract the background."*
Dimming the sky buys separation; it does not add detail, and every shape in `src/render/bake.ts` is
still the placeholder 0022 called one.

**Nothing here has been played, only looked at.** A screenshot cannot see a parallax rate, and 0.3
against 0.12 is still the pair 0065 placed by hand.
