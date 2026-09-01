# 0206 — The tile wraps round, and the comment saying it did not need to was wrong

**Accepted 2026-09-01.** Fixes a defect in [0112](0112-the-sky-has-weather.md) that has been reported
more than once and never found. Amends nothing else about it.

> *"we need to fix that seam, it's an earlier issue that I was struggling to get you to sort out with
> dimensionality"*

## The claim that was wrong, written down where the bug was

`nebulaField` places clouds with no margin, and the comment above it explained why that was safe:

> *"A MARK cut by a seam is a hard edge arriving on a schedule; a gradient cut by one is already down
> at a fraction of its own alpha out there, **and the tile repeats — so what the player sees is the
> same cloud continuing.** There is no margin here on purpose."*

⚠️ **THE SECOND HALF IS FALSE.** Tiling repeats **the same bitmap**. The part of a cloud hanging off
the right edge is discarded at bake time; what appears at the left edge of the next tile is that
tile's own left edge, not the rest of that cloud. Nothing continues. A cloud whose centre sits near
an edge is simply **truncated on a straight vertical line**, at whatever alpha it had there — which
for a centre just inside the edge is most of it.

The first half is true, which is what made the sentence survive: a mark cut by a seam *is* worse, and
the reasoning about alpha *is* right for a cloud whose centre is far from the edge. It is a correct
argument with a false conclusion bolted on, and it was sitting directly above the line that caused
the defect.

## The rule

**A tiled backdrop draws every cloud at ±`size` on both axes**, so what leaves one edge arrives at
the other. Positions stay marginless: a margin would push every cloud towards the middle of the tile
and band the sky, which is the cure being worse.

Both axes rather than the tiling one, because `bakeOne` rotates the whole atlas for the top view —
so which sprite axis is the scrolling one depends on a setting `drawNebula` cannot see. Eight of the
nine copies are skipped by a bounds test for any cloud not near an edge, and this file is on
`tests/budget.test.ts`'s DELIBERATELY_COLD list, so the cost is bake time and nothing else.

## ⚠️ Why it took three reports and a new tool to find

**Nothing measures a seam.** `cloudCover` sums alpha, `tests/sky.test.ts` compares fields between
places, and the contrast guards read inks — every one of them is a statement about the tile's
*contents*, and a seam is a property of its *edges*. All were green throughout.

It also could not be seen from where anybody was looking. It is a vertical line in a dark backdrop
that moves with the camera; on the title screen there is no camera, and in a run the player is
dodging. **It was found in the first five minutes of
[0205](0205-the-bench-jumps-to-where-the-thing-is.md)** — standing still, on level two, at a fixed
camera position, looking at the sky on purpose. That is the whole argument for that tool, arriving
before the tool's own decision was written.

⚠️ **AND IT IS THE SAME DEFECT AS ONE FIXED HOURS EARLIER, IN THE SAME FILE.**
[0204](0204-a-landmark-is-lit-by-the-place-it-stands-in.md) records a landmark's gas *"ending on a
straight vertical line in open space"* because a radial gradient was clipped by `fillRect` at the
tile's edge. That one was fixed by fitting the lobes inside the sprite, which is the right answer for
an object drawn once and the wrong one for a tile drawn end to end. **Two instances of *a gradient
does not know where the bitmap stops*, found within a day, neither by a guard.**

## The cost, named

**No guard holds this either**, and it is the same reason 0204 gives: *is there a visible seam* has
no content change that would redden a test and be correct. What could be held is the arithmetic —
that a cloud crossing an edge is drawn twice — and that is what `tests/sky.test.ts` now asserts, with
a probe that removes the wrap and watches it go red. That guards the mechanism, not the appearance,
and the difference is stated rather than blurred.
