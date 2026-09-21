# 0352 — The Mire is a swamp

**Accepted 2026-09-21.** Item 6 of [`the-places-are-painted`](../../reports/the-places-are-painted-2026-09-21.md),
built by the loop in [`how-the-places-get-painted`](../../reports/how-the-places-get-painted-2026-09-21.md).
**Reverses [0221](0221-a-planet-is-not-a-space.md)'s tight corridor**, on a newer ask. **Uses
[0347](0347-the-belt-is-a-jungle-under-a-live-volcano.md)'s far range and stated land colours.**

## The ask

> *"Overgrowth ceiling needs to be raised and to be an actual ceiling, the background needs to be
> swampy trees and murk and the ground needs to be vibrant glowing acid pools spitting bubbles."*

**This decision is the ceiling, the swamp and the pools. The bubbles are not in it.** They are motion —
0347's mechanism 2, which hangs off a landmark's vent, and pools are ground, not landmarks — so they
need that mechanism lifted off the landmark first. That is its own piece of work and the next one;
the handover names it. Until it lands, *"spitting bubbles"* is undone.

## What the player sees differently

A roof of dark foliage across the top of the screen, its underside clumped with leaves and hung with
vines; behind the fight, two rows of drowned trees standing out of dark water with mist at their feet;
and along the bottom, pools of acid lit from within, brightest at the surface, with ripples across them.

## Everything that was on the screen, and what became of it

| on screen | verdict |
|---|---|
| a canopy edge a third of the way down, flat dark | **raised** to lane 10, hanging to lane 24 at most; leaf clumps and vines along its underside |
| the shadow bands under it | **kept**, moved up with the roof |
| dark fronds hanging from the old roof line | **kept, moved** to the new line, shorter and straighter — at the old sway they crossed the trunks as a second tangle in mid-air |
| murk, and nothing in it | **the swamp** — `RANGE_OF.mire`, two rows of trunks in 0347's far layer |
| flat trapezoid pools in the glow at half alpha | **redrawn** — shallow lenses in a saturated acid green, graded with depth, rippled |
| the bright shoreline | **kept, with a reason** — below |
| the canopy's underside catching the light | **kept** |

## The rules

**The canopy is a ceiling.** Its line is at tile 0.3, lane 10 — it was 0.4, lane 30 — and it hangs
from there. `tests/places.test.ts` held *the corridor is tight*, 0221's ask; this ask reverses it, so
the guard now holds the roof above lane 30, where the reported one stood, and still holds the ship's
room under it. The probe that lifted the canopy to break *tight* is deleted from 0221's file with that
reason: it is the change the player asked for.

**The Mire states its land** — `ThemeRow.land`: the pools' surface (`lit`), the roof's leaf, the far
trees. **The acid is as bright across its area as the floor allows**: every land colour keeps every ink
at 3:1 (0347), so the surface is a saturated green at luminance 0.078, 3.12:1 against the worst ink
on vivid. The vibrance is saturation. `tests/mire.test.ts` holds that **no area the swamp paints** —
fills, rects, gradient stops — is brighter than the brightest stated colour.

**Lines are not held by it, and that is said here rather than hidden.** The shoreline has been a
stroke in the place's glow at 0.85 alpha since 0221; the glow (`#4ad85a`) puts the worst ink at
**1.08:1**. The ripples on the pools are thinner strokes in the same glow at 0.55. They are lines a
bullet crosses in a frame, not a field it sits on — the distinction 0222's band draws for compact
marks — and the shoreline is untouched here. If the play says a shot is lost on the shore, the lever
is that line.

## What it cost

- **The sky's room:** unchanged, 1.48× vivid and 1.43× high contrast (`scripts/weigh-sky.mjs`); the
  roof, the swamp and the pools are land, not sky.
- **Memory:** the `skyRange` bitmap, as for Saurian Belt and Rime Shelf.

## Owed

**A play** — above all whether the pools read as *vibrant glowing* at the floor's ceiling, which is the
same question 0351 asks about white, and whether the trunks behind the fight are too busy. **And the
bubbles**, next.

## The guards, and that each was seen to fail

Four breaks in `scripts/probes/0352-*.mjs`, each red:

| guard | the break |
|---|---|
| the canopy is a ceiling, and the ship fits under it | the roof back at 0.4 — *hangs to lane 41* |
| no area the swamp paints is brighter than its brightest stated colour | the pools filled in the glow; the swamp layer left out |
| every land colour keeps every ink (0347) | the acid stated as the glow — `player` at 1.31:1 |

**Re-anchored:** 0211 (the fronds' sway). **Deleted:** 0221's *canopy lifted* probe, above.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
