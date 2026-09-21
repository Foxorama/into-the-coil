# 0350 — The corridor turns

**Accepted 2026-09-21.** The second step of 4b, from
[`the-labyrinth-turns-and-forks`](../../reports/the-labyrinth-turns-and-forks-2026-09-21.md). **Builds
on [0348](0348-the-labyrinth-is-walled.md)**, which walled the Labyrinth, **and
[0349](0349-the-stone-bites.md)**, which made the stone solid — so a corridor that turns is one the
ship, the shots and the waves all have to reckon with.

## The ask

> *"The straight corridor to the boss is not a labyrinth, it's a boring corridor."*

Answered on the plan: *"do all 3 but per difficulty, saviour is 44, burn is 34, legend is 56."* One
authored shape, and each tier's row says how narrow it may pinch and how steeply a wall may run.

## What the player sees differently

The Labyrinth swings from side to side and pinches between the opening, the lattice's fight and the
run-in to the gyre's room, which stay straight and full width. The stone that is now on the screen
between the face and the lane's edge is the same masonry, and each face is a sloped coping that
follows the turn rather than a stair of square tiles.

| tier | narrowest, as laid | steepest wall, as laid | the tier's ceiling |
|---|---|---|---|
| legendary | **56** | 0.25 (14°) | 0.25 |
| savior | **44** | 0.33 (18°) | 0.35 |
| burn | **34** | 0.42 (23°) | 0.58 |

Read off each tier's faces by `tests/corridor.test.ts`. **Burn's walls are not as steep as burn
allows**: the tier's ceiling is a rise of six a tile and the authored shape never asks for more than
five. The ceiling is the player's number; the shape is what reaches it, and a steeper burn is a shape
edit, not a rule change. 239 of the 346 knots turn, 2,868 of the level's units.

## The rules

**The shape is authored on the level's row** — `CorridorRow.shape`, points of `swing` and `narrow`
between which a half-cosine eases — **and the tier's row caps it**:
`DifficultyRow.corridor = { narrowest, slope }` in `src/content/difficulty.ts`. `layFaces` in
`src/sim/corridor.ts` walks the knots: where the shape wants each face, moved at most `slope × extent`
from the last knot — **so no wall is ever steeper than its tier by construction** — in whole lane
units, never narrower than the tier's narrowest and never outside the box. The corridor is laid at
the level boundary with the run's tier.

**The art is a cap per whole rise.** Thirteen baked sprites, `wallRise0`–`wallRise12`, for a rise of
−6 to +6 across one tile: masonry below a sloped face, courses parallel to it, and a lit coping. The
painter blits one at each tile's face midpoint — turned over for the near wall — and square
`roomWall` tiles out to the lane's edge behind it. An opening drops the whole column on its side.

**Everything the corridor holds is carried as it turns.** These are the fixes the first flights of the
turning corridor forced, and each is guarded:

- **A wave's lane is read into the corridor where each member arrives** — `laneIn` and `inCorridor`:
  its place in the band its hull can occupy at rest is its place in the band here. **At the member's
  own along**, not the wave's: a column read at its head was put down at 0.50, 0.39, 0.25, 0.10 and
  −0.04 of the band.
- **A body keeps its place in that band from step to step** — `rideCorridor`, for enemies and
  pickups. The band is `bandAt`: the face at the hull's centre and at every knot its hull spans,
  stood off by its radius, **because those are the places `stoneAt` asks**.
- **A weave is squeezed with the corridor** — `squeezeAt`, the same proportion — so its swing is the
  row's, in corridor terms.
- **A drifter turns at the band**, not at the centre's face.
- **A flanker's passage covers its whole crossing, either way along.** 0348 laid it forward by the
  camera's travel over a crossing of `PLAYER_MARGIN`. A wave's flanker holds the screen *on top of* its
  row's closing, so a charger crosses going backwards through the world; and a turned face stands up
  to thirty units in. The passage is now laid from the body's own velocity over the wall's depth where
  it crosses — `deepestFace`, read over the stretch the crossing covers.
- **A pickup is held out of the stone** — it turns at the face before it reaches it, and
  `stoneHoldsPickups` puts back one a narrowing wall has come in on. At burn the face comes in at up
  to 0.35 a step, faster than a pickup's whole float of 0.28.
- **A `wall` attack skips a slot in the stone**, as it already skipped one off the box: at burn, every
  sentry that fired near a face lit two rows of sparks in the masonry, where its shots were born and
  broke on the same step. Photographed at burn, 930 units in.

**The ship is put back out on the band as well** — `outOfStone`, which reads the wall the way
`stoneAt` does. **And `stoneAt` is tile by tile**, because the painter drops a whole tile for an
opening: a sower half over the tile beside a passage was clear to the simulation and drawn over the
stone.

## What the stone still takes

Before these fixes, a flight of the Labyrinth lost **75 bodies to the stone at burn, 53 at savior and
29 at legendary** — none of them shot, all of them bursting on masonry. Now it is **two on every tier,
the same two**: a sower at 2,140 and a weaver at 2,842. Flown in an open level from the same places,
their waves leave the box on their own (the weaver's reaches 4.2 against the box's 6; the sower's hull
reaches 94.3 against 94). **They are the content's, and 0349's *what cannot help it*.** No guard counts
them: a count over the real level would limit what may be authored.

## What it costs

On six levels, nothing new: every addition returns on its first line without a corridor. On the
Labyrinth, per body per step, four band reads (each a face lookup, and at most one knot for any hull
under six units) for the ride
and one for a weave's squeeze; per flanking wave, a handful of knot reads to size its passage. Nothing
allocates. Thirteen more baked sprites.

## The guards, and that each was seen to fail

`tests/corridor.test.ts`. Thirteen breaks in `scripts/probes/0350-the-corridor-turns.mjs`, each red:

| guard | breaks |
|---|---|
| the box is the limit, and the straight stretches stand on it | the clamp taken off |
| the player's numbers, per tier, reached and never passed | the slope not applied; every tier laid with legendary's |
| the painter puts the stone where the model says | a cap stood on its first knot |
| no body *or pickup* is ever drawn over the stone, flying every tier | `stoneAt` reading an opening across the whole stretch; pickups not held (118–448 sightings) |
| **a turn is not a massacre** — a fixture flown at burn, every wave measured to fit the box, loses nothing to the stone | the ride removed; the weave not squeezed; the passage laid forward by the camera; lanes not read into the corridor |
| a column arrives as a column | members read at the head's along |
| where a body is carried, the stone says it is clear | the band read at the hull's centre alone |
| a wall of shots is as wide as the corridor | the skip off the box only — a shot born 11 units into the stone |

⚠️ **THE STONE HIDES WHAT IT KILLS, AND THE GUARD ON THE PICTURE WAS GREEN OVER A MASSACRE.** 0349 removes a body
the moment it meets the stone, so the guard that watches the picture — *nothing drawn over stone* —
cannot see a wave dashed against a wall: the body is gone before it is drawn. Removing the ride
altogether left it green. So the corridor counts what its stone destroys (`Corridor.kills`), and the
fixture holds that count at zero.

⚠️ **THE FIXTURE WAS WRONG BEFORE THE CODE WAS.** Its waves were first placed by eye, and one — a
column of weavers at lane 40 — leaves the box with no corridor at all. Every wave in it was then flown
in an open level at its own place, and the turret flank that leaves the box there is kept because it
drifts, and a drift turns at a face.

⚠️ **AND FOUR PROBES ELSEWHERE MOVED.** 0348's clamp guard became *the box is the limit*; 0348's flank
opening now makes a kill rather than a sighting, so it points at *a turn is not a massacre*; 0349's
push-out and 0048's pickup bounce were re-anchored on the lines they break.

The bench takes `?difficulty=` so each tier's corridor can be stood in.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
