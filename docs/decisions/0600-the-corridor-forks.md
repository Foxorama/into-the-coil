# 0600 — The corridor forks

**Accepted 2026-10-12.** The third and last step of 4b, from
[`the-labyrinth-turns-and-forks`](../../reports/the-labyrinth-turns-and-forks-2026-09-21.md): *"the corridor
forks. Islands, branches, waves into one or both."* **Builds on [0349](0349-the-stone-bites.md)**, which made
the stone solid, **and [0350](0350-the-corridor-turns.md)**, which made it turn. The question that held it
back was put in [`the-night-of-2026-09-21`](../../reports/the-night-of-2026-09-21.md) and answered with its
recommendation: *a fork's own thirty a way, every tier.*

## The ask

> *"Next phase of the labyrinth is to have the background move up/down with branching paths so it feels
> like a labyrinth as well anyway — the straight corridor to the boss is not a labyrinth, it's a boring
> corridor."*

## What the player sees differently

Three times in the Labyrinth the corridor opens out to the box and splits round an island of the same
masonry: a point, a block that holds its width, and a point at the far end — twenty tiles, a little under
seven seconds from one point passing the ship to the other, and longer than the screen, so a way once taken
is flown to its end. Each way is **thirty**, on every tier. Waves coming down the lane part round the point,
a line across the middle is put down in both ways and a column off it in one, and **the island is cover**:
shots, lightning and a bomb's blast stop at it, both ways.

| fork | island | where in the level |
|---|---|---|
| 1 | 696 – 936 | the first turning stretch, after its first two turns |
| 2 | 2436 – 2676 | the second turning stretch, after the lattice's fight |
| 3 | 3048 – 3288 | the second turning stretch, before the run-in to the gyre's room |

The same three on every tier: walls at the box's edges, island from 36 to 84, ways of 30. The turns between
them are still the tier's — legendary pinches to 57, savior to 45, burn to 34, read by
`tests/corridor.test.ts` as before.

## The numbers, measured rather than carried

**The lane is a hundred and eight wide between the clamps, not the plan's eighty-eight.** `ACROSS_SPAN` became
120 after the plan was written, so the night report's arithmetic — *30 + 12 + 30 = 72 fits in 88* — fits with
more room than it said: an island can be forty-eight wide with thirty either side, and the forks here are.

**An island's point opens at `ISLE_NOSE_RISE`, three units a side a tile**, the gentlest tier's slope (0.25):
the island is the same on every tier, so its point is one shape under every tier's ceiling. It reaches its
forty-eight eight tiles from each end, and the four tiles between hold it.

## The rules

**An island is laid from the faces** — `CorridorRow.forks`, `{ at, length }` in level coordinates, and
`layIsles` in `src/sim/corridor.ts`. It is centred between the faces and is as wide as leaves `FORK_WAY` either
side, so **each way is thirty by construction**, and a fork authored where the corridor pinches would be a
thinner island, off its middle — refused by `tests/corridor.test.ts` on every tier, because the painter
could not draw it. The shape therefore holds the corridor at the box from a little before each island to a
little after it.

**An island is a wall seen from both sides.** Its low face is a far wall to what is below it and its high
face a near wall to what is above, so `stoneAt` names it `ISLE_BELOW` or `ISLE_ABOVE` — the walls' own signs,
doubled — and every question the stone already answered asks it the same way: the ship takes one hit and is
put back in the way it came from; a shot breaks on it; a line of sight stops at it (`clearLine`), so a blast
and a link do not reach the other way; a rift carves it, under one tag for its whole width, and the painter
drops the column it carved; a pickup is held off it and bounces from it; a `wall` attack skips a slot in it.

**A wave beside an island is read into a way** — `laneIn`: each member into the way on its own side of the
middle, at its place in that half of the corridor at rest. *"Absent meaning the branch nearest its lane"* is
read per member, so a line across the middle parts round the island and a column off it arrives in one way. A
**flanker** is read into the way beside the wall it comes through, wherever its lane points: aimed at the
far way it would cross the island to get there.

**What is in a way stays in it.** A drifter turns at the island as at a wall (`wayAt`); a weave swings
across its way rather than the corridor (`squeezeAt`, given where the body is); a body flying down the lane
onto a point is carried to the side of the middle it was on — and then the one departure:

**A body that steers into an island is put back beside it, not destroyed** (`holdInWay`). 0349 destroys a
body that meets a wall, and 0350 made that rare by carrying and squeezing what the corridor holds until only
*what cannot help it* still meets the stone. An island cannot be made rare the same way: a way is thirty of
the box's hundred and eight, and the Labyrinth's weaves and sowers are authored about the middle of the lane
with swings of twelve and sixteen. Flown with the hold taken out and the ship kept alive, the islands
destroyed **37 bodies at legendary, 51 at savior and 53 at burn** in one flight of the level — 0350's
*massacre*, which it measured at 29 to 75 before its fixes. *"Waves … explode if they hit a wall"* is the player's ask, and this is the island not keeping
it; **it is a decision for the player to overturn**, and overturning it is deleting one line.

**And the point is read at its widest under the hull.** A wall's face nearest a body is where it reaches
furthest in, which is why `stoneAt` reads it there; an island's point is the opposite, nothing at its tip and
widening away. Read nearest the centre, a hull over the point read clear while its rim lay on the stone a
unit back — flying the Labyrinth at legendary, the picture guard counted 39 sightings of a body over the
stone, every one of them at an island's point. `stoneAt`, `outOfStone` and `isleBand` read an island at both ends of the stretch the hull covers.

## What the stone still takes

Flown with the ship kept alive, from the first step to the gyre, the Labyrinth's stone destroyed **nothing,
on every tier**. 0350 counted two on every tier when it landed — a sower and a weaver its stretches put
against a wall — and the reshaped stretches no longer do. No guard counts them, for 0350's reason: a count
over the real level would limit what may be authored.

## The art

An island is drawn as the walls are — `wallRise` caps on its two faces, the near-wall cap turned over on the
high one, and `roomWall` masonry between, laid first so each cap's coping is over it. **Its point is two baked
tiles**, `isleNose0` from the point to six across and `isleNose1` from six to twelve, turned over at the far
end: a cap's stone reaches six units past its face, so on an island less than a tile across it would reach
past the other face into the way. Each half is one of the cap's courses, lit along its face and shaded to a
mortar joint at the middle.

## What it costs

On six levels, nothing: an empty `isles` returns on the first line of every new read. On the Labyrinth, per
body per step beside an island, three island reads for its band and two for the stone; the painter draws a
fork's column in two caps and one or two tiles of masonry, where the outer walls at the box now draw fewer
than they did in a pinch. Two more baked sprites. Nothing allocates in the frame.

## The guards, and that each was seen to fail

`tests/fork.test.ts`, on a fixture forked from the first step: the ways are thirty; the ship's one hit and its
way; a shot ends at the island; a blast and a link do not cross it; a body steered at it is held; a drifter
turns; a point parts what flies at it; a wave parts round it, one body per place; a flanker comes into its
own way; a weave fits its way; a rift carves it and the picture opens with it.

`tests/corridor.test.ts`, on the Labyrinth at every tier: thirty a way at every island knot and a tile of
stone at every island's widest; every island column one the painter can draw; a hull at its way's edge is
never in the island; the island's faces under the tier's slope; the painter's caps on the island's knots;
and, flying the level, nothing drawn over its stone.

Sixteen breaks in `scripts/probes/0600-the-corridor-forks.mjs`, each red.

## Not held by any guard

- **Whether it reads as a labyrinth**, whether a way reads as a choice, and whether the island's point reads
  as stone at speed — a play, on each tier.
- **The point's art** — the two baked tiles have not been photographed in the game.
- **A body circling the ship** (`circle`) orbits through an island, and the hold flattens its orbit against the
  face. Nothing in the Labyrinth circles; a level that put one at a fork would want its orbit held to its way.
- **A line of sight sampled every two units** (`clearLine`) can pass the first two thirds of a unit of a point,
  where it is under two units across. A blast or a link reaching round the very tip is the most it can do.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
