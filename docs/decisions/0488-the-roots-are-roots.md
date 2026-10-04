# 0488 — The roots are roots

**Accepted 2026-10-04.** Item 9 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md),
its 1.1, after [0487](0487-the-storm-is-lightning.md). The serpent's *"roots"* were `rootWall`, one 12-unit tile
of strokes wallpapered about thirty times along both lane edges and across the far wall
([0459](0459-the-bosses-are-placed.md)). It had no shape, no curvature, and no relation to the body.

⚠️ **Superseded in part by [0515](0515-the-knot-is-gone.md)**: *the knot*. Played, it read as a thing in the
open screen that fades for no reason, and it is gone with its sinking and its two guards. The pieces round the
edges stand.

## The rule

**A room may be framed by root pieces placed rather than a tile tiled.** `Room.pieces` is a list of `RoomPiece`:
a sprite, a centre in world units from the resting camera's trailing edge, a turn, whether it is the far wall,
and whether it stands only for the entrance. `layRoom` lays the list and `paintRoom` blits each piece. The tiler
is untouched for rooms that still have a wall: the Labyrinth's stone.

**Four pieces of the world tree**: a trunk (72 units), a fork (64), a tapering tip that curls (56) and a knot
(44). Each is a few strands filled rather than stroked, so a root tapers, in 0459's own bark: shadow under it,
bark, and a lit flank. A piece's rootlets go to its `−y`, the side a room puts off the lane. The serpent's room
lays five: a trunk along the top edge, a tip and a trunk along the bottom, and a fork and a trunk down the far
side, which withdraw off the screen when it parts (0337). `rootWall` is gone with the strip.

**The serpent coils in round a root.** The knot is laid at the entrance's centre (107, 60), and the serpent's
coil ([0306](0306-the-serpent-coils-in.md)) winds round it. **And it sinks into the dark over a second once the
serpent has arrived.** The plan's own guard said no piece crosses the ship's box, and its knot stands mid-screen
where the ship flies. A root in the open lane through the whole fight would be a thing that looks solid and is
not ([0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)). So the knot is the arrival's alone:
`stepPieces` holds it while the boss enters and fades it after.

Nothing collides, because 0335's walls are the picture of a bound the ship already has. Everything is drawn
under every body, because nothing the player has to see is behind scenery (0459).

## Consider the screen

Every piece but the knot is outside the ship's box, so the picture of the bound is still the bound. The edge
pieces sit so that, like the strip, they show only in the six units between the lane edge and the box. The far
pieces stand past the box's leading edge, so on a 16:9 screen their tips show at the right. The knot is in the
middle of the screen for the six seconds of the arrival, behind the coil and under every body, and is gone a
second later.

## Guards

`tests/serpent.test.ts`, *0488 — the roots are roots*:

- **THE ASK**: the serpent's room has no wall, is framed by at least three pieces, and the coil's centre is at the
  knot, whose drawing lies inside the coil's radius.
- **IN LANE UNITS**: every vertex every piece but the knot draws, at the resting camera, is outside the ship's box.
- **AND THE KNOT SINKS ONCE THE SERPENT HAS ARRIVED, DRIVEN**: flown from the level's start, the knot stands on every
  step of the coil and is gone two seconds after the arrival.

0459's *THE ASK* asserted a wall of `rootWall`. It now asserts roots, and measures where they begin from the
nearest piece instead of the room's `from`, which no piece reads. Its probe is re-anchored on the top trunk, and
0335's on the room line that now admits roots. The four pieces join the scenery that `tests/accents.test.ts`
does not hold to one outline, as the tile was.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0488`:

| broken on purpose | went red |
|---|---|
| the knot away from the coil's centre | `THE ASK` |
| the top trunk laid inside the ship's box | `IN LANE UNITS` |
| the knot never sinking | `AND THE KNOT SINKS` |
| the knot not standing while the serpent coils in | `AND THE KNOT SINKS` |

## Owed

- **A play of the Approach's boss**: whether the frame reads as roots, and whether the knot reads as the root it
  coiled round or as a thing in the way. The plan asked for a sketch of the knot. The photographs are the question.
- **The body lying across the far root at rest**, which the plan also named, is not placed. The serpent patrols,
  and where it lies is the fight's.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Art, content and the frame; nothing persisted.
