# The vocabulary is the ceiling — why a boss takes a dozen passes

**Written 2026-09-08**, on the question asked after the serpent's second pass:

> *"how do we manage the graphics properly because I had the same issue with Golf-Stars (The Far
> Carry) it took repeated attempts to get the serpent looking good and we did get there, but we're
> having the exact same issue here and I don't want to have to do a dozen passes against each boss
> to get them looking great."*
>
> *"like the serpent boss for The Approach has gone from a weird grey space worm to a weird green
> space worm that looks slightly better, but it's not even close to as good as the Jormungandr from
> Golf-Stars yet"*

⚠️ **THIS IS A DIAGNOSIS AND NOT A CHANGE.** Nothing here has been acted on. It exists so the next
art pass starts from a measured cause rather than from another read of `src/render/bake.ts` —
[0029](../docs/decisions/0029-the-tracked-record-is-the-record.md).

## What was looked at

`node scripts/shot-sheet.mjs boss8 boss9 boss12 --port=5199 --zoom=4 --theme=approach`, and the PNGs
read — [0193](../docs/decisions/0193-the-sheet-is-the-instrument.md),
[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md). Then the predecessor's
`C:\Golf-Stars\src\render\shipArt.ts` `case 'serpent'`, read for this reason and nothing else —
[0020](../docs/decisions/0020-the-fiction-transfers-the-code-does-not.md).

## ⚠️ The passes are not converging because they are re-arranging flat polygons inside a vocabulary that cannot draw a creature

Three measurements, all from the shipped file:

| | measured | what it means in the picture |
|---|---|---|
| **curves** | `bezierCurveTo`/`quadraticCurveTo` appear **once in 7,324 lines** of `bake.ts`, and **zero times** in the boss painting region (2930–4600) | every edge of every boss is a straight line between authored points. The serpent's spine is nine samples, so its body is a chain of eight straight quads with visible corners. **A serpent is a curve.** |
| **tones** | `FoeSkin` is **four colours** — `hull`, `plate`, `lit`, `eye` (`src/content/themes.ts:492`) — and the boss region uses **zero gradients** | nothing has volume. Every shape is a paper cutout at one of three greens. There is no light direction, no falloff, no terminator. |
| **contour** | one `ctx.stroke()` at `seal()`, around the outer silhouette only | nothing inside the hull is separated by a line. The head does not end and the neck begin; the fin does not sit on the back. Flat colour without line work reads as a blob. |

**That is the whole of the difference between the two serpents, and none of it is taste.** The lit
stripe reads as a road marking because it is a hard-edged uniform-width band. The fins read as
sawteeth because they are triangles with no root and no contour. The tail reads as a stump because a
taper drawn as eight straight quads has eight visible steps in it.

⚠️ **NO NUMBER OF PASSES INSIDE THIS VOCABULARY REACHES THE JORMUNGANDR**, because the Jormungandr is
not made of the things this vocabulary has. It is:

- **one Bézier spine, stroked at stacked widths**, so the taper is honest across an S-bend;
- **the same stroke blown out and dimmed** for the aura;
- **the same stroke dashed with a marching offset** for the venom-light, so the light follows the
  coils instead of sliding across them;
- **eight or so opacity-layered marks** per sample (`0.92`, `0.42`, `0.4`), rotated to the body's
  local heading.

## ⚠️ AND ONE OF THE THREE CEILINGS IS A DEFECT, BECAUSE THE GUARD PICKED THE DRAWING TECHNIQUE

[0264](../docs/decisions/0264-the-real-bosses-are-drawn.md)'s *What was rejected*:

> **Strokes after the seal.** The predecessor's serpent is stacked strokes on one path, and it
> would be the natural way to draw a taper; `tests/paths.ts` models a stroke as its fill, so a
> stroked spine would be a mark the containment guard cannot see. Ribbons are polygons.

**The exact technique that makes the predecessor's serpent work was rejected because the test
harness cannot measure it.** `tests/paths.ts`'s `Trace` carries `strokes: number` — a count, with no
geometry.

⚠️ **CLAUDE.md, [0192](../docs/decisions/0192-a-guard-holds-an-invariant.md): *"A red guard is never
answered by changing the work to suit it."*** This is that, one step earlier and harder to see — the
guard was not even red. Its *modelling limit* was read as a constraint on the art. The invariant it
holds is **a mark stays inside the collision silhouette**, and a stroked spine can satisfy that
perfectly well; the harness just cannot currently see that it does.

## What it would cost to lift, which is much less than it looks

**All three are free at runtime.** `src/render/bake.ts` is **not** in `HOT_FILES`
(`tests/budget.test.ts:1121`) and is listed nowhere near it — baking is cold, once, at boot and
resize. A curve, a gradient and a stroke at bake time are the **same single blit** afterwards.
[0022](../docs/decisions/0022-frame-rate-is-a-feature.md) and
[0025](../docs/decisions/0025-the-frame-budget-is-counted-not-timed.md) count draw calls and
allocations in the frame loop, and this touches neither.

**And the harness is already shaped for it.** `tests/paths.ts` flattens `arc` into a polygon
*inside* the arc, so containment is answered conservatively, and returns `'gradient'` as the colour
for a radial fill. The three additions are the same move again:

1. **`quadraticCurveTo` / `bezierCurveTo`** — flatten to a polygon inside the curve, exactly as `arc`
   already does.
2. **`stroke()` with geometry** — record the polyline expanded by half the `lineWidth`, so a stroked
   spine is measured as the region it actually inks, and containment reads it as it reads a fill.
3. **`createLinearGradient`** — return `'gradient'`, as `createRadialGradient` already does.

**Then the four vocabulary primitives the bosses are missing** — a curved ribbon along a spine, a
form-shade across it, a contour at an interior seam, and a rim light down the lit edge — are one
change to the painting kit, **not seven changes to seven bosses.**

## ⚠️ What is NOT the cause, so it is not chased

- **Resolution.** `MAX_PIXELS_PER_UNIT = 10`; the serpent is 40 units and bakes at **400px**, and the
  sheet was read at 4×. There is plenty of pixel to see detail that is not being drawn.
- **The silhouettes.** They are better than they look. Five heads in the hydra's outline, a skull
  wider than its neck, four dorsal fins — all present, all held by `0264 — THE HEADS`.
- **The palette or the theme skins.** The venom-green is right. A grey worm became a green worm
  because the skin changed and **nothing else did**, which is exactly why the second pass moved so
  little.
- **`variant`**, the other half of `where-the-art-ceiling-is-2026-08-14`. Still worth doing, still
  not this.

## ⚠️ And the process half, which is the half that was actually asked about

**The highest-signal art channel this project has ever used was the player drawing on a
screenshot** — [`the-coil-drawn`](the-coil-drawn-2026-09-05.md), where a traced path converged the
blades in **one pass** after four passes of words had not. It has been used for motion and never for
a hull.

**And the predecessor's own comments are a record of the same thing working**: what made its serpent
converge is that each failed pass was named as a *picture* — *"a row of fir trees stood on a green
road"*, *"a dashed road marking down a green ribbon"* — rather than as a preference. Those sentences
are load-bearing and they are the format a verdict should come back in.

⚠️ **AGREED 2026-09-08: THE TARGET ARRIVES AS A REFERENCE OR A SKETCH**, and the first one was given
the same hour — see below.

## ⚠️ THE SERPENT'S REFERENCE, GIVEN 2026-09-08

The predecessor's Jörmungandr card, handed over with:

> *"so, the coil in the center isn't quite right here and we could use more of a tail, but this is
> the minimum level of what I'm after"*

**So it is a floor and not a copy**, with two named deviations: **less coil, more tail.**

What is in the picture, as marks to be built rather than as an impression:

| mark | what it is |
|---|---|
| **body** | one smooth continuous curve, no facet anywhere; fat from the neck through the midriff, whipping thin at the tail |
| **contour** | a thick near-black outline round the whole body — and it is what reads the **overlap** where the body crosses itself |
| **rim light** | a bright green line along the outer/upper edge of each curve, following it, not crossing it |
| **form shade** | one light direction, upper-left: the back lit, the belly dark. Clearest on the head — lit top-of-snout, dark jaw beneath |
| **scales** | an overlapping-arc motif over the whole body at **low** contrast, in a lighter green. A texture, not a set of marks |
| **head** | a true skull: lit crown, dark jaw, two white fangs, a dark-red mouth interior, a nostril |
| **eye** | amber iris, **black vertical slit** pupil, a violet ring round it — the one saturated non-green thing in the picture |
| **spines** | short light-green ticks radiating off the outer edge |
| **glow** | the whole body sitting in a soft green aura |

## ⚠️ AND THE COIL IS THE ONE MARK THAT FIGHTS `seal()`, WHICH IS WORTH KNOWING BEFORE IT COSTS A PASS

`seal()` is `ctx.fill('evenodd')`. **A body that crosses over itself, filled `evenodd`, has a HOLE
where it crosses** — the overlap has crossing number two, so it is not filled. A coiled serpent is
therefore not drawable as today's single sealed path at all, and it would come back from the sheet
as a serpent with a bite out of its own middle.

⚠️ **It is worse than a fill rule, and that is the useful half.** The reference's overlap reads
*because the near body carries its own dark contour over the far body* — near and far are drawn in
order, each with its own outline. That is depth, and one flat sealed pass cannot express it whatever
the fill rule is.

⚠️ **THIS IS NOT A REASON TO REFUSE THE COIL**, and the ask already softens it — *"the coil in the
centre isn't quite right… we could use more of a tail."* It is the reason the hull rule
([0227](../docs/decisions/0227-a-sprite-is-painted-not-filled.md)) has to be **answered explicitly**
in whatever decision lifts the kit, rather than discovered on the sheet. The collision silhouette can
stay exactly one sealed path; what has to give is the assumption that the **painted** body is that
same single pass.
