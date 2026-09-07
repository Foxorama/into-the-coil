# 0276 — The kit draws a creature

**Accepted 2026-09-08**, from a question about process rather than about a boss:

> *"how do we manage the graphics properly because I had the same issue with Golf-Stars (The Far
> Carry) it took repeated attempts to get the serpent looking good and we did get there, but we're
> having the exact same issue here and I don't want to have to do a dozen passes against each boss
> to get them looking great."*
>
> *"like the serpent boss for The Approach has gone from a weird grey space worm to a weird green
> space worm that looks slightly better, but it's not even close to as good as the Jormungandr from
> Golf-Stars yet"*

**Amends [0264](0264-the-real-bosses-are-drawn.md)**, which rejected the technique this restores, and
**changes a guard in `tests/accents.test.ts`** — [0192](0192-a-guard-holds-an-invariant.md) requires
that to be said out loud, and this is where it is said.

The measurement is [`the-vocabulary-is-the-ceiling`](../../reports/the-vocabulary-is-the-ceiling-2026-09-08.md).

## The rules

**A hull may be a curve.** `curveThrough` and `curveLoop` put Catmull-Rom cubics through authored
samples, so a body can be drawn as the animal it is rather than as a chain of straight quads.

**A mark may be a gradient.** `shaded` fills with a linear gradient across a stated direction, so a
hull has a light on it and therefore a volume.

**A mark may be a STROKE, and the invariant it is held to is the one every fill answers.** `seam`
paints an open line on a hull. **Exactly one stroke per body is the outline** — the one laid on the
hull's own path by `seal` — and every other stroke is paint, held inside the silhouette by
`strokeOutside` and exempt below `tests/accents.test.ts`'s existing 0.9 alpha, exactly as a fill is.

## ⚠️ The guard it changes, and why that is not answering a red guard by moving the work

`tests/accents.test.ts` asserted `traced.strokes === 1` for every body. **The count was never the
invariant.** Its own comment states the claim as *"one outline, however many fills go over it"* — and
it says *fills* only because `tests/paths.ts` recorded a stroke as a bare counter with no geometry, so
a stroke could not be held and was banned instead.

⚠️ **0264 THEN READ THAT BAN AS A FACT ABOUT DRAWING.** Its *What was rejected*:

> **Strokes after the seal.** The predecessor's serpent is stacked strokes on one path, and it
> would be the natural way to draw a taper; `tests/paths.ts` models a stroke as its fill, so a
> stroked spine would be a mark the containment guard cannot see. Ribbons are polygons.

**The guard was never red.** Its *modelling limit* picked the drawing technique — which is
[0192](0192-a-guard-holds-an-invariant.md) read backwards, one step earlier than the rule catches, and
is the class this decision repairs rather than the instance.

⚠️ **WHAT IS HELD NOW IS STRICTLY MORE THAN WHAT WAS HELD BEFORE.** A second outline still fails. A
solid stroke that leaves its hull now fails too, and could not have failed before, at any alpha, by
any amount — the probe drags the serpent's mouth line 50.97 CSS pixels off the front of its skull and
the suite says so.

## ⚠️ It costs nothing at runtime, and that is measured

`src/render/bake.ts` is not in `HOT_FILES` (`tests/budget.test.ts`) and is named in
`DELIBERATELY_COLD` beside `mount.ts`: baking happens once, at boot and resize. A curve, a gradient
and a stroke at bake time are the **same single blit** afterwards.
[0022](0022-frame-rate-is-a-feature.md) and [0025](0025-the-frame-budget-is-counted-not-timed.md)
count draw calls and allocations in the frame loop, and this touches neither.

## What the serpent is now

One spine from a skull to a whipping tail; the outline a curve, not a chain. A form-shade down the
whole body for its volume; a belly shadow and a back light as tapering ribbons in three nested steps,
because a one-piece band has an edge and a shadow does not. A scale field whose chord runs **across**
the body and bulges down it. A snake's skull with a lit crown plane, a dark maw, two fangs and a
slit eye.

⚠️ **THE DORSAL FINS ARE OUT OF THE SILHOUETTE.** Four triangles on a back read as sawteeth — a
polygon fin shares one edge with the body and so has no root — and the reference has none. What it
has is ticks of light off the outer edge, which are paint below the solid alpha and therefore may sit
outside the hull, as the plume and the glow already do.

## ⚠️ What was NOT built, and is owed as its own decision

**A body that crosses over itself.** `seal` fills `evenodd`, so a self-crossing hull has a *hole*
where it crosses; and the overlap in the reference reads because the near body carries its own dark
contour over the far body, which no single flat pass expresses whatever the fill rule is.
`inside` in `tests/paths.ts` already implements nonzero winding and reads the rule off the pass, so
`seal` taking a fill rule is a small change — but it reopens
[0227](0227-a-sprite-is-painted-not-filled.md) and it is not going in the same PR that changes the
pipeline. The ask leaves room: *"the coil in the centre isn't quite right… we could use more of a
tail."*

## ⚠️ And the process half, which is what was actually asked

**The target arrives as a reference or a sketch, before the drawing.** Agreed 2026-09-08, on
[`the-coil-drawn`](../../reports/the-coil-drawn-2026-09-05.md)'s evidence: a path the player traced
over a screenshot converged the blades in **one pass** after four passes of words had not. The first
one was given the same hour and is recorded in the report as marks to be built rather than as an
impression.

**And the kit is lifted once, not per boss.** The other six ride it.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Art, a test harness and a guard;
nothing persisted, no storage key, no schema, no cache prefix.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0276`:

| broken on purpose | went red |
|---|---|
| `strokeOutside` ignoring the `lineWidth`, so a fat stroke on a thin hull reads as contained | `reports the overhang when the line is too near an edge for its width` |
| `strokeOutside` sampling only the vertices, so a segment may cross a waist and out into space | `SAMPLES ALONG a segment and not only its ends` |
| the pen closing every sub-path, so an open spine is measured with a return leg across the void | `does NOT wrap an OPEN polyline back to its start, and DOES wrap a closed one` |
| the hull stroked a second time, which is the second outline the old count refused | `is more fills in the SAME bitmap, and not a second sprite over the first` |
| the serpent's mouth line dragged off the front of its skull, at full alpha | `is more fills in the SAME bitmap, and not a second sprite over the first` |

`node scripts/prove-guard.mjs 0264` still passes all five, with its skull probe re-anchored.

⚠️ **AND THREE DEFECTS IN THIS WORK WERE FOUND BY A GUARD OR BY THE SHEET, NOT BY REASONING**, which
is the whole of [0027](0027-measure-the-picture-not-the-model.md):

- the belly band at 0.99 of the half-width came **0.3 CSS pixels** outside the hull, because the
  outline is now a curve through the samples and a curve cuts inside its own control polygon;
- the eye's catchlight baked at **2.42 pixels** against the 2.5px floor below which a mark is not
  drawn at all;
- the neck's own back offset sat below both the crown ahead of it and the back edge behind it, so
  the outline had a V in it and the animal baked **as a cat**. That one only the sheet could say.
