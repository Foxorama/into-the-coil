# 0631 — The mid-bosses are drawn

**Accepted 2026-10-18.** From the play-test of 2026-10-18 —
[`the-play-test-of-2026-10-18`](../../reports/the-play-test-of-2026-10-18.md), item 2. Paints the seven mid-bosses in
the manner [0264](0264-the-real-bosses-are-drawn.md) set for the end bosses, and keeps each one's idea from
[0247](0247-a-level-has-a-mid-boss-and-a-real-one.md) and the hulls before it.

## The ask

> *"Mini-boss: remove placeholder graphics with miniboss art"*

## What was there, photographed first

All seven on the sprite sheet and in the fight, each in its own place. Each was a primitive in one flat ink with one
or two plates, a motif and an eye: a notched hexagon, three prongs, a diamond, a teardrop, a stepped slab, three
circles on a bar, three rings. Three had black bars or slots carved in them, which read as holes in the art rather
than parts of a body. Two hulls disagreed with themselves under `evenodd`:

- the redoubt's two outer ports ran over its outline, and each filled a crescent of wall out in the sky;
- the chorus's three lobes and its bar cancelled wherever two overlapped, so it was lenses with the sky through them.

## The rule

Each keeps the one idea its hull was built around, and is painted as an end boss is:

- a form-shade over the whole hull, lit above and in shadow below;
- plates and lit edges;
- seams;
- the parts its idea names;
- its lights in its place's eye ink, or the lit ink where the eye ink is too dark to burn.

| mid-boss (place) | now |
|---|---|
| sentinel (The Approach) | a raider frigate (`SENTINEL_HULL`): a ram prow, a turret on each sponson, a superstructure with its bridge lit, rivets, three drives |
| harrow (Ember Nebula) | three tines on a body (`HARROW_HULL`); the carved spine is a raised core with three vents burning, a pod at each outer tine's root, the tips lit. The Nebula's eye ink is all but black, so these burn in the lit ink brightened |
| lattice (The Labyrinth) | the same frame, shaded and not its hole; its joints, a node lit in each strut, an emitter at each point, the hole's rim burning and a translucent field across it |
| shoal mother (Saurian Belt) | a fish (`SHOAL_HULL`) with a dorsal and a ventral fin swept to its tail; the carved streaks went, and it has a lit back, a belly, gills, a lateral line, fin rays and eyes in sockets |
| redoubt (Rime Shelf) | crenellated along both long edges (`REDOUBT_HULL`); the outer ports are bites in the outline, the carved bands are raised buttresses, the ports burn, and the middle one is ringed |
| chorus (The Toxic Mire) | one outline (`CHORUS_HULL`): each lobe's arc that no other covers, pinched where they meet. Each lobe is turned on an opaque base, lowest first, with its rim lit, veins and an eye; the spine runs down all three |
| axis (The Black Heart) | the same rings; the outer ring shaded and segmented with a lamp at each of its four marks, translucent light in the gap, and the core an eye — an iris round the pupil |

Every solid mark stays inside its hull and clears 0106's 2.5 px at the fight's camera. Every translucent mark stays
inside the sprite's box (`tests/accents.test.ts`). Each hull reaches no further than the one it replaced, and no
muzzle moved.

## What guards it

`tests/accents.test.ts`, *0631: no sub-path of a hull straddles its outline*, over every body in every place. A
sub-path wholly inside the outline is a hole and one wholly outside is a separate piece. One with points both sides
fills ink beyond the body under `evenodd`, which is what the redoubt's ports and the chorus's lobes did. Nothing else
in the game does it today.

Probes are in `scripts/probes/0631-the-mid-bosses-are-drawn.mjs`, both seen red:

- **The chorus put back to three circles.**
- **The redoubt's middle port cut across the face's edge.** Putting the outer ports back as whole circles stayed
  green. With the bites in the outline, each circle lies wholly outside it, so the guard counts it as a separate
  piece. That is the edge of what this guard claims, so the probe breaks the port the arm still cuts.

Two of 0149's probes are re-anchored, and all seven of 0149's probes were seen red again:

- *a boss given another boss's hull* now hands the shoal mother the lattice's frame through `trace`;
- *an eye moved out through its lobe* now moves it to where the lobe's edge is, since the lobes no longer cancel.

How well each reads as the thing it is named for is not guarded. That is a matter of taste, and it is owed to play.

## Owed

- **A look in play at each, in its own place**, above all whether the thinner seams and the lattice's field read at
  the fight's size or only on the sheet.
- **The sentinel was shown to the player as a sample before the other six were drawn**, and the other six were drawn
  before an answer came back. Anything they say about it applies to all seven.
