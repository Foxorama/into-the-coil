# 0354 — The heart has veins

**Accepted 2026-09-22.** Item 7 of [`the-places-are-painted`](../../reports/the-places-are-painted-2026-09-21.md),
the last of the seven. **Reverses [0211](0211-every-place-has-its-own-structure.md)'s *nearly empty***
on a newer ask. **Uses [0343](0343-the-stars-are-drawn-for-a-desk.md)'s star rows and
[0353](0353-the-acid-bubbles.md)'s pattern for a moving backdrop**: one authored table, read by the
baker and by the scene.

## The ask

> *"Needs veins pulsing throughout the level and a beautiful starry backdrop."*

## What the player sees differently

A dense star field in the heart's own colours — rose, crimson, violet, ice blue and a few white — with
a band of far light across it; and threaded through it the length of the level, wine-dark vessels
branching as they go, with light running down them in the heart's two thumps and a rest.

## Everything that was on the screen, and what became of it

⚠️ **Read from the code, not a photograph**: this pass did not photograph the place before its first
edit, which is the loop's first step, and says so rather than reconstruct one.

| on screen | verdict |
|---|---|
| the shared star field at a third of its density (0211's *nearly empty*) | **replaced** — the heart's own row, denser than The Approach's, six tints and a band |
| nine dark streaks drawn towards a point off the lane | **removed** — the vessels are the place's structure now |
| clouds, faint | **kept** |
| the speed streaks (`skyRush`) | **kept** — the speed cue, shared on 0343's terms |
| the heart itself, the landmark, beating | **kept** — its beat is what the pulse now keeps |

## The rules

**The veins are authored, and both sides read them.** `VEINS_OF` in `src/content/veins.ts` holds each
place's trunks (a base and whole cycles of sine per tile, so every vessel meets itself at the seam),
their branches, and the pulse — beads per trunk, the steps a bead takes to cross a tile, and the steps
in a beat. `STRUCTURE_OF.core` bakes the vessels from it; `paintPulse` blits the light along the same
trunks, over every weather tile it draws. `skyFor` gives a place in space that states veins its own
copy of the sky, built once, with the weather layer carrying them (`SkyLayer.veins`).

**A bead is a pure function of the sim's steps and an index**, as the ember and the bubbles are, and
it rides the clock, not the camera. **The beat is the landmark's own shape** (`beatAt`, two thumps
and a rest) **and it travels**: a bead further down its vessel is later in the beat, so the thump runs
along the vein rather than every bead swelling at once.

**A bead is a head with a tail, turned to the vessel's heading** — the ember's shape. The first bead
was a round glow 1.4 units across and at 1080p it was one more star. The head is `BEAD_HEAD` of the
bitmap, under the smallest thing that can kill the player; the rest is light.

**The vessels are lit in the gas's own body colour** — `StructureMark.gas`, new and optional. Dark
first, they were black lines on a nearly black sky and could not be found in the photograph; lit in
the glow, which here is ice blue, they were blue pipes. `skyCover` still charges every lit mark at the
glow, the brighter of the two — an over-count, the direction a floor may err.

**The stars are the heart's own row** on 0343's machinery — denser than The Approach's, in six tints,
with a band.

## What it cost

- **The sky's room**, measured with `scripts/weigh-sky.mjs` now that it charges gas-lit marks at their
  own colour: vivid 1.70× → **1.62×**, high contrast 1.51× → **1.42×**. The vessels' own reading is
  0.85 cover in wine.
- **The floor's model** — `skyCover` reads the gas-lit marks apart (`which = 'gas'`), and
  `tests/sky.test.ts` holds every ink against the glow backdrop *and* that backdrop with the gas-lit
  marks composited over it in the body colour. Charged at the glow, as every lit mark was, the
  vessels put `player` at 1.85:1 over a backdrop no pixel of the place is: the guard was measuring the
  wrong colour, and was changed rather than the vessels dimmed to suit it
  ([0192](0192-a-guard-holds-an-invariant.md)).
- **Draw calls:** four trunks, three beads each, over the weather tiles in view — at most 24 blits.

## The guards, and that each was seen to fail

`tests/heart.test.ts`. Seven breaks in `scripts/probes/0354-*.mjs`, each red:

| guard | the break |
|---|---|
| every bead lies on one of the vessels, in lane units | the beads three units off — 1353 strays |
| the vessels baked are those same vessels | the baked trunks moved off the table |
| the camera stops and the heart does not | the travel taken off the clock; the beads left at one size |
| a bead's head is under the smallest shot | the head grown to 2.0 units |
| the floor sees the vessels, at their own colour | the gas-lit marks dropped from the reading |
| only a place that states veins pulses | every place in space given the heart's veins |

**Re-anchored:** 0347 (the haze line in `skyCover`, which the split gave a condition).

⚠️ **The star field has no guard of its own here**: 0343's guards hold every place's own stars — the
seam and the size — and *"beautiful"* is not a quantity. The ask is the player's to judge.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
