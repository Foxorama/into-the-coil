# 0207 — The Eagle has lanes, and gas alone was never going to be a nebula

**Accepted 2026-09-01.** Finishes Ember Nebula's backdrop, which
[0203](0203-the-rule-was-never-about-size.md) and
[0204](0204-a-landmark-is-lit-by-the-place-it-stands-in.md) left half done: the Pillars were drawn and
the weather behind them was still the generic cloud layer.

> *"I want to see the eagle nebula in a scrolling background and when the massive pipe organ kicks in
> music wise we see the pillars of god going past."*

## Density was never the problem

Ember Nebula already had **the thickest weather in the game** — `SKY_STYLE_OF.nebula` is
`clouds: 2, cloudSize: 1.4, cloudAlpha: 1.7`, the highest of all three on every axis — and
[0196](0196-the-backdrop-is-rounded-out.md) measured it as having about a third of the contrast
headroom the other five places do. **And it still read as a smooth plum wash.**

⚠️ **BECAUSE SOFT OVERLAPPING GRADIENTS READ AS FOG AT ANY DENSITY.** Turning them up makes brighter
fog. Every axis 0196 had to work with — count, size, alpha, drift, lean — moves a blob, and a pile of
blobs has no structure at any setting. That is the same *"nine axes over two primitives is still dots
and lines"* the backdrop pass was reported for, arriving from the other direction: not too few axes,
but no axis that could produce an EDGE.

## The rule

**A place's weather may carry dark dust lanes, drawn in the space colour over the gas.** Authored per
place — Ember Nebula has three; the other six have none until each is written on its own terms,
because *"none of those elements are transposable"*.

⚠️ **IT IS THE PILLARS' OWN SENTENCE, WIDENED.** 0204 draws the columns as holes punched in the light
rather than shapes in front of it. Lanes are the same statement at the scale of the whole sky — which
is what makes the near view and the wide view read as one object rather than two pieces of art in the
same colour.

## ⚠️ A lane must be PERIODIC, which is stricter than 0206's wrap

[0206](0206-the-tile-wraps-round.md) draws every cloud again at ±`size` so that what leaves one edge
arrives at the other. **That is not sufficient here.** A cloud is a disc and the copy carries its own
shape with it; a lane crosses the entire tile, so the copy one tile over only joins if the lane
*arrives* at the right edge where it *left* the left one.

So `y` at `x = size` is forced equal to `y` at `x = 0`. Without it, 0206's seam returns wearing a new
costume — a dark band with a step in it, arriving on a schedule — and the wrap would still be there,
looking correct, three copies drawn end to end.

## ⚠️ What the probe caught, which is the most transferable thing here

0206's guard scanned the whole of `bake.ts` for its wrap loop. The moment this decision gave the
lanes **a wrap loop of their own**, breaking the *cloud* wrap left the string present in the *lane*
one — and 0206's guard stayed green over precisely the defect it is named for.

`npm run prove` said so on the first run. A guard asking *does this text appear anywhere* is
answering a different question from the one it claims, and it is
[0027](0027-measure-the-picture-not-the-model.md) one layer down: the measurement agreed with itself
and not with the thing. It is now scoped to the cloud loop, and the probe that exposed it is the
reason the scoping is written down rather than assumed.

## The costs, named

- **Dust darkens the backdrop**, so it spends no contrast — it buys some back. The gameplay floor is
  unaffected in the direction that matters.
- **No guard holds whether it looks like the Eagle Nebula**, on the same argument 0204 and
  [0161](0161-the-shape-of-a-level-is-not-guarded.md) both make. What is held is periodicity, which
  is arithmetic. The appearance was checked in the bench —
  [0205](0205-the-bench-jumps-to-where-the-thing-is.md) — at three positions across a tile join.
- **Six places still have no weather of their own** beyond the blob axes, and this decision does not
  give them any. Each is its own authoring problem, which is the point.
