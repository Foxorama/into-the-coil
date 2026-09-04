# 0224 — The mountain is awake

**Accepted 2026-09-04.** The last item from the 2026-09-03 backgrounds report.

> *"saurian needs blue skies, but exploding volcanoes adding volcanic effects at some points in the
> level"*

The blue skies landed in [0221](0221-a-planet-is-not-a-space.md). This is the rest of the sentence.

## The rules

- **A landmark is handed the place's accent and its silhouette colour**, not only its gas.
- **Saurian Belt places three volcanoes**, one on each of its section boundaries.
- **A landmark on a planet has its feet in the ground.**

## ⚠️ *Points, plural* is the half that needed the slot

[0203](0203-the-rule-was-never-about-size.md) built a landmark to be *the one thing in the sky that can
be somewhere in particular* — and every place that has used it since has used it **once**. This is the
first level to place more than one, and the three sit on `push`, `surge` and `approach`, read off the
level's own `sections` rather than typed twice. The Pillars are tied to Ember Nebula's organ the same
way, and for the same reason: a landmark and the bar it arrives on are one fact, and typing it twice is
the drift [0029](0029-the-tracked-record-is-the-record.md) is about.

## ⚠️ Two colours were enough while every landmark was made of gas

The Pillars and the heart are both **holes punched in light**: drawn in the backdrop colour, with the
place's gas behind them. That works because both stand in gas. `drawLandmark` therefore took exactly
two colours, and it was right twice.

**A volcano is rock, on a planet, under a blue sky, and the thing worth looking at is the light coming
out of it.** In those two colours it is a maroon smudge in daylight. So the slot now carries three —
gas, accent ([0223](0223-a-place-has-a-palette.md)) and silhouette (0221's own land colour where a
place has one) — and the drawing picks. The volcano inverts the construction the other two share: a
**solid dark body**, with the glow **on top of it** rather than behind.

## ⚠️ The one the bench found: it was hanging in the air

On a planet the ground layer is painted **last** and a landmark is painted **first**, so the ground is
what a volcano's base disappears behind. The first draft's cone ended at lane 76 with the ridges
starting at 81 — **drawn correctly, sized correctly, floating.** Its foot runs off the bottom of its
own sprite now, at `0.92`.

That is a guard, in lane units, with **both numbers traced out of the drawings** rather than read from
the constants behind them — [0027](0027-measure-the-picture-not-the-model.md). A guard comparing the
two literals would only prove they had been typed to agree.

## ⚠️ And two shapes that were wrong in ways only a picture reports

**The plume was a polygon and came out as an anvil with a flat top.** A path up one side and down the
other joins its two ends with a straight line — so the one edge nobody authored is the one at the top,
where the eye goes. Ash billows; **nine overlapping discs of falling opacity** billow and a trapezoid
cannot.

**The cone was a funnel.** Its flanks used `(1 − t) ** 1.6`, which is so concave that the shape is
narrow for most of its height and flares only at the very bottom — a stem, not a mountain. `1.15` is a
cone. A straight line would be a pyramid, and the eye knows the difference without being able to say
why.

## What is held

| claim | how |
|---|---|
| a volcano arrives on each of the level's own section boundaries | `tests/places.test.ts`, off `sections` |
| a landmark on a planet has its feet in the ground | same, in lane units, both numbers traced |
| the place draws what its level places | 0220's guard, now reachable from the other side |

⚠️ **HOW A VOLCANO LOOKS IS A TASTE AND IS NOT GUARDED.** How much ash, how many lava runs, whether the
bombs read as thrown — [0192](0192-a-guard-holds-an-invariant.md) asks *name a change that would redden
this and be CORRECT*, and for all of those the answer is *almost any*. `scripts/shot-place.mjs` is the
instrument, and it found both shape defects above.

## What is owed

- **The eruption is a swell and not an explosion.** `beat: 190` scales the whole sprite about five
  seconds per cycle, which reads as a mountain breathing. *"Exploding"* would want the plume and the
  bombs to move independently of the cone, and a landmark is one bitmap — so that is a second baked
  frame or a new mechanism, and it is a decision rather than a number.
- **The beat curve is still a heart's**, two thumps and a rest. It is subtle at this period and on a
  mountain, but it is one shared function serving two objects that want different shapes.
- ~~**The three volcanoes are one drawing at three positions.**~~ **Paid immediately by
  [0225](0225-a-landmark-is-not-a-carbon-copy.md)**, which was asked for the moment this was reported:
  *"lets go and add that seed to the landmarks and levels."* A landmark has three castings now and an
  entry names one.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0224` — three breaks, three guards red. Two probes belonging to other
decisions were re-anchored by the third colour: 0204 and 0220.
