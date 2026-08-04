# The camera did not interpolate — 2026-08-04

**The first thing `scripts/trace-frame.mjs` measured, and it found a bug on its first run.**

The instrument exists because [0027](../docs/decisions/0027-measure-the-picture-not-the-model.md)
says to build it *before* the first tuning pass on anything the player watches move, rather than
after the seventh "it doesn't feel right". This is the first report it produced.

## What was measured

The shipped page (`dist/index.html`), 1280×720, holding nothing for one second — a ship asking for no
movement at all, which in world units holds station **exactly**: its `velAlong` equals the camera's
`scrollPerStep`, so the subtraction is arithmetically perfect.

| | screen travel x | net x |
|---|---|---|
| before | **4.0px** | −4.0px |
| after | **0.0px** | −0.0px |

## The cause

`src/render/scene.ts` draws each entity `alpha` of the way between its previous and current step
positions. The camera was subtracted at its **stepped** value, un-interpolated:

```
inView = (prevAlong + (along − prevAlong) × alpha) − cameraAlong
```

So the entity moved smoothly through the step and the thing it was measured against jumped once per
step. The error is bounded by one step of camera travel — `0.6` world units, about 4px at this scale
— and it applies to **every entity on screen**, not just the ship.

It is worst where it is least affordable: on a display that is not exactly 60Hz, which is the case
the interpolation exists for in the first place.

## Why nothing caught it

**All 271 assertions in the suite were green before the fix and after it.**

That is not a coverage gap to be filled by more of the same. Every guard in the repository asserts on
the model — world units, step counts, draw counts, projection maths — and by every one of those
measures the code was correct. The ship *was* stationary. The camera *was* advancing at exactly the
right rate. The bug lived entirely in the relationship between two correct numbers, at a moment no
model-space assertion looks at.

This is the predecessor's bounce failure in miniature: eight passes improving a model that was
already right, while the thing on screen did not move the way the player saw. The difference here is
that it cost one run of an instrument instead of five weeks.

## The fix

`World` carries `prevCameraAlong`; `GameFrame.draw` interpolates the camera on the same `alpha` as
everything it gets subtracted from.

Held by `tests/interpolation.test.ts`, which asserts the picture rather than the model: the same
world drawn at alphas 0, 0.25, 0.5, 0.75 and 1 must put the ship in the same place, and must still do
so after 600 steps. Proved to fail on the old behaviour via `scripts/probes/0027-picture.mjs`.

⚠️ The third assertion in that file is a control — debris left behind *must* move. Without it, a
projection that pinned every entity would make the other two perfectly green over a frozen scene.

## What this changes about how to work here

Nothing, and that is the point — 0027 already said it. What it supplies is the first piece of
evidence from **this** project rather than the predecessor's, which the decision explicitly flagged
as owed:

> ⚠️ **And the evidence is inherited, not ours.** Every number above is the predecessor's.

It is ours now.

## Not verified

The 4px figure is measured at 1280×720 with `scrollPerStep` at 0.6. It scales with both, so a faster
scroll or a denser display makes it worse; neither has been measured. Nobody has looked at the
before-and-after on a real screen — the claim is that a number went to zero, not that a human saw the
judder stop.
