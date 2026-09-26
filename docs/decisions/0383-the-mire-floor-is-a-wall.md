# 0383 — The Mire's floor is a wall

**Accepted 2026-09-27.** The Toxic Mire's ground is lowered until the lower row of pools is just off
the screen, and it becomes a wall: a rolling shore that moves with the world and bites what the
Labyrinth's stone bites. **Builds on [0349](0349-the-stone-bites.md)** — every rule of the stone is
reused, not restated — **and [0350](0350-the-corridor-turns.md)**, whose caps-per-whole-rise draw the
shore. **Moves [0353](0353-the-acid-bubbles.md)'s pools** out of the ground tile and into the bank.
**Amends [0352](0352-the-mire-is-a-swamp.md)**: the ground tile is the canopy alone.

## The ask

> *"The bottom ground with the acid pools sits slightly too high on the screen, there's a black layer
> between the bottom of the acid pools and the bottom of the screen. It needs to be lower so that the
> lower row of acid pools sits just off screen. We also need to make it a hard ground wall like the
> labyrinth wall that causes hit damage/death to everything but the end boss."*

Answered before building, because each answer changed what was built:

| question | answer |
|---|---|
| the ground scrolled at 0.45 of the world with a jagged edge; a lethal edge on it would drift against its own picture | **a rolling shore, at world speed** |
| fifteen of the level's waves flank in from the bottom edge, through the acid | **they rise through unbroken acid** |

## What the player sees differently

The ground along the bottom moves with the world now, like the Labyrinth's walls: a bank of dark mud
whose edge rises and falls in low hills, lit along its top by the acid under it, with the upper row
of pools showing along the screen's bottom edge and the lower row just below it. Touching the bank
costs the ship a hit and puts it back above it; a body that meets it bursts; a shot breaks on it. A
wave from below comes up out of the acid, drawn under its surface until it is out.

## Everything that was on the screen, and what became of it

| on screen | verdict |
|---|---|
| the pools, the land under them and the shoreline, in the ground tile at 0.45 | **moved** into the bank, at world speed — a wall that bites has to move with the world, or a body bursts on a shore the picture has already slid past |
| the black band under the pools | **gone** — every pool 0.067 of the tile lower (below) |
| the jagged shoreline, a stroke centred on the edge | **replaced** by the shore's lit edge, laid wholly *under* the face, so the picture's edge is the model's |
| the canopy, its shadow, the acid's light on its underside | **kept**, in the ground tile as before |
| the swamp behind | **kept** |
| the bubbles | **kept**, on the bed's pools at world speed |

## The rules

**The pools are 0.067 of the ground tile lower, and the number is the ask's.** The highest point a
lower-row pool is *drawn* at is its surface less the lens's bulge, `0.075 × deep`; the highest was
0.683, and 0.683 + 0.067 is lane 120, the screen's edge. Measured on the surface line alone the move
is 0.064 and leaves a sliver of the row on the screen — which is why the guard reads the drawing.
Every upper-row lens now reaches past the edge, so no ground is left under a pool on the screen. The
upper row shows two to three lanes of acid; the ask put it there, and a play may ask for more.

**The shore is authored, in whole lanes, between 106 and 113** — forty knots, one per twelve-unit
tile, read round and round: hills of three to seven lanes, never steeper than two a tile. It stands
at least three lanes over the highest pool so the lit edge is never drawn in one, and at its highest
it takes eight lanes off a box that ends at 114.

**The floor is a corridor with one wall.** `CorridorRow.bank` makes the far face the shore and lays the
near face a whole lane above the box, where nothing is ever put; every question the stone answers is
the question it already was. What a bank says that stone does not, from the two answers above:

- **it is drawn in front of what is in it** — after the enemies' layer, before the debris, every shot
  and the ship. What it covers is only what is in it: a body that touches the shore bursts on that
  step, and a shot breaks at the face. The end boss's lower body will stand in it.
- **a flank from below rises through it.** While a body is still steering for its lane from the
  wall's side, the acid spares it — *on the body, not on the wall*. The Labyrinth cuts a passage, and a
  passage is a stretch of wall that is air for everything, the ship included, until it scrolls away;
  the acid spares only what is rising out of it, and only until it is out. No opening is cut.
- **a rift does not carve it** (0377): a hole in a lake closes, and one the picture could not show
  would be shore that no longer bites.

**It runs until the place goes.** The hydra's fight has no room and the camera never stops in it, so
the bank has no end: its faces repeat, and the crossing clears the corridor at full burn, under the
streaks, where it swaps the place (`src/app/mount.ts`).

**The floor bends what flies low over it, and nothing above its reach.** A wave is read into a corridor
against the corridor at rest and a body rides it ([0350](0350-the-corridor-turns.md)); the Labyrinth's
rest is the whole box. The Mire's is the lowest quarter of the lane, 90 to the box's floor: a lane
outside the rest is put down where it was authored, and the band a body rides is held to the rest
(`heldAt` — `bandAt` exactly for stone, whose faces never leave the box). Chosen by measuring, flying
the level on every tier and the mid-boss fight with `scripts/weigh-fight.mjs`:

| rest from | the shore destroys, legendary / savior / burn | the mid-boss fight, against the 22 s asked |
|---|---|---|
| 6 — the whole box, as first built | 0 / 0 / 0 | **25.6 s**, and `tests/midboss.test.ts` red |
| 60 | 0 / 0 / 0 | **25.5 s** |
| 80 to 96 | 0 / 0 / 0 | 21.0 s — exactly the level with no floor at all |
| 100 | 7 / 5 / 3 | 20.9 s — too little reach: bodies meet a shore it did not bend them over |

Toggled one behaviour at a time, the whole of the 4.5 s was the proportional squeeze at spawn — every
lower-half wave put down a few lanes higher than written — and not the ride, the stone's kills or the
shots breaking on the shore. **The mid-boss's health was not retuned to hide it**: the level moved, not
the boss. 90 is the middle of the range that leaves what the author wrote alone and loses nothing to
the shore. A drifter's near bound is the open level's again.

**A roam not yet seen turns at the shore as well as at the lane's edges.** Flying the real level to the
hydra, the shore first took **twelve bodies at legendary, nine at savior and eight at burn** — every
one a drifter or a warden roaming down into it ahead of the screen, burst before anyone could see it.
[0382](0382-a-roam-waits-to-be-seen.md) turns an unseen roam a hull short of the lane's edges and stops
there, before the corridor's check; it now also turns at a corridor's band, on where the step would
take it. After it: **nought on every tier.** An open level is exactly 0382's, since the band is
infinite there. The Labyrinth's turned walls had the same hole and it is closed with this one. No
guard counts kills over the real level, on 0350's argument — a count would limit what may be
authored; the guard is on the mechanism.

**Everything but the end boss.** The model gives no boss to the stone, as the Labyrinth's never did.
Neither Mire boss reaches the shore: the chorus bobs 22 about the lane's middle and the hydra 18,
their hulls reaching lane 98 and 94 against a shore no higher than 106 — computed from their rows,
**not guarded**; a fight authored lower would be drawn under the acid without being hurt by it, and
that is the question to ask when the hydra is drawn standing in it next.

## What it costs

- **Draw calls:** a cap and one tile of mud per twelve units of view, and two bed tiles — about forty
  blits on a 16:9 screen, the Labyrinth's figure. The near wall draws nothing: a face a tile beyond
  the lane is skipped. Six levels pay nothing.
- **Memory:** the bed is one 240-unit drawing baked as two 120-unit halves, blitted in turn — the
  ground tile's repeat at half the pixels of one square tile of it. The ground tile is unchanged in size.
- **The ship's room:** two to eight lanes at the bottom of the box, where the shore stands.

## Not held by any guard

- **The corridor goes at the crossing's swap.** A line in `stepCrossing`; nothing drives the crossing
  in a test. Checked by eye on the branch preview is what is owed.
- **The bosses' clearance of the shore**, above.

## The guards, and that each was seen to fail

`tests/floor.test.ts`, in lane units and pixels. Breaks in `scripts/probes/0383-*.mjs`:

| guard | the break |
|---|---|
| THE ASK: the lower row is just off the screen, and no dark band is left under the upper row | a lower pool at its old height; the row moved by its surface line alone; every pool sunk five lanes more |
| the shore stands over every pool and never rises steeper than a cap is baked for | a fall of four across a tile |
| the ship: one hit, and left above the shore | the shore laid twenty lanes below its picture |
| a body that meets the shore bursts, and is not the player's kill | the whole floor sparing every body |
| a drifter turns at the shore before it is seen, as well as after | 0382's unseen roam as it was |
| the level as it was authored: the shore bends what flies low over it, and nothing above its reach | the rest back to the whole box; a lane above the rest squeezed as if in it |
| a shot ends at the shore | shots broken on the near wall only |
| a flank from below rises through unbroken acid, and no opening is cut | nothing spared as it rises; a passage cut for it |
| the painter puts the shore where the model says, for as long as the level runs | the shore read once and not round; every cap stood on its first knot |
| the acid is over what is in it and under what flies | painted behind the bodies; painted after every layer |

**Scoped:** `tests/corridor.test.ts`'s guards are about two walls that pinch per tier and hand over
to a room — the Labyrinth's — and now say so rather than being bent to fit a floor.
**Rewritten:** 0352's floor-under-the-acid guard watches the bank as well; 0353's bubbles are read
off the bed at world speed. **Deleted:** 0353's *only a place that states pools bubbles* and its probe
— no sky layer holds pools now, and bubbles are painted only with a floor, which no other place lays,
so it could not go red. **Re-anchored**, on only what they break: 0149, 0348, 0350, 0353.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
