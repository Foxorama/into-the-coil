# The bodies have no inside to mark, and that is the art working

**2026-09-02.** Written because the work was attempted, measured and **abandoned**, and the
measurements are worth more than the attempt was.

> *"start working on enemy graphics, things like feathered dinosaurs in the saurian level, stained
> glass enemies in the ember nebula etc. make the enemy graphics match the levels"*

## What was tried

A per-place **livery**: one bold mark inside each enemy hull, chosen per place. Leading for Ember
Nebula, a crest for Saurian Belt, a fracture for Rime Shelf, a seam for The Labyrinth, a blister for
The Toxic Mire, a hollow for The Black Heart, and nothing for The Approach.

It used the mechanism [0194](../docs/decisions/0194-a-hull-has-a-livery.md) already built, drew
after the hull so it could never join the outline, and **worked on screen** — every treatment was
visible and distinct in the bench, and no silhouette moved.

## Why it was abandoned

⚠️ **THREE OF THE EIGHT BODIES CAN CARRY A MARK. THE OTHER FIVE HAVE NO INSIDE.**

`tests/accents.test.ts` measures clearance in CSS pixels of a 1280×720 screen, against
[0106](../docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)'s 2.5px floor. Measured,
one body at a time, as each was pulled in to try to fit:

| body | hull | verdict |
|---|---|---|
| drifter | solid diamond | fits |
| lancer | triangle narrowing to a point | fits, after the mark shrank to a third of its first size |
| sower / spinner | narrow, partial | marginal |
| **weaver** | a bar `0.44r` wide — **5.9px on screen** | **2.5px of clearance each side leaves under a pixel** |
| **charger** | a dart `±0.22r` tall ≈ 3px | no room at any mark size |
| **turret** | an arc crescent | a centred mark is in the gap |
| **warden** | a ring | a centred mark is in the hole — missed by **12.57px** |

**A livery worn by three bodies out of eight reads as a bug rather than as a style**, so it was not
shipped.

## ⚠️ The reason is the art working, not the art failing

The hulls are thin, hollow and narrow **on purpose**.
[`enemy-silhouettes-2026-08-05`](enemy-silhouettes-2026-08-05.md) is the play-test that made them so:
a lancer drawn as a five-sided arrowhead read as *"a slightly smaller diamond"*, players could not
tell a one-shot body from a two-shot body, and **the game was reported as buggy**. What replaced it
was *three points against four* — shapes that differ at twenty pixels, which means shapes with as
little interior as possible.

**The property that makes an enemy legible is the property that leaves it nothing to decorate.** Those
are the same decision, seen from two sides.

## What would work instead, and why it was not just done

**A per-place enemy INK.** The hulls are flat filled shapes, so a tint reads instantly at any size,
costs no interior room, and cannot move a silhouette. It fits
[0081](../docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md)
rather than fighting it: **shape says what a thing is, colour says where you are** — the ink is not
carrying meaning alone, it is carrying place.

Two things stopped it being done unasked:

1. ⚠️ **`enemy` is the worst ink in all fourteen palette cells** —
   [0196](../docs/decisions/0196-the-backdrop-is-rounded-out.md) — and Ember Nebula and The Toxic Mire
   have about a third of the headroom the others do. Any tint there is a small move, and the gameplay
   floor `tests/sky.test.ts` holds would decide how small.
2. **It is a different answer from the one asked for.** *Stained glass* and *feathered dinosaurs* are
   illustration; a tint is not. At eighteen pixels of hull radius nothing can be literal, but choosing
   the substitute is a taste call, and this is a note asking for it rather than a decision taking it.

## What is NOT recommended

**Changing the outer silhouette per place.** It is the one thing that would deliver the brief
literally, and it re-opens a bug that a play-test already found and a decision already fixed — seven
times over, for a player who has learnt the shapes.
