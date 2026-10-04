# 0501 — The hole moves with the wall

**Accepted 2026-10-04.** Item 4.2 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md),
on the player's word: *"I want the holes to be in different positions to keep the player actively moving around the
screen."* The plan held it back because it reverses part of [0151](0151-the-gap-you-have-to-reach.md).

## What it was

0151 put the hole at `uncoil.at` as one share of every line. On the gyre's eight walls
([0332](0332-the-gyre-is-set-into-the-wall.md)) that put three of the four walls across the lane on its near side,
and **all four walls along the lane about forty units ahead of the camera's trailing edge, which is where the ship
already sits.** So most walls were passed by holding still, or by drifting back to one corner.

## The rule

**A wall that turns authors a hole per stance.** `Uncoil.atBy` is the place for each of the eight stances, in `at`'s
units, or `null` for `at` on every one. `holeAt` is the one reader, used by the thrower, `scripts/weigh-walls.mjs`
and the guards. The two bosses whose walls do not turn author `null`, so nothing changes for them. The gyre's places
are `GYRE_HOLES`:

| k | stance | hole | where the ship has to be |
|---|---|---|---|
| 0 | across | 31 | near side |
| 1 | backslant | 31 of a line from the far edge | far side, 89 across |
| 2 | alongFar | 75 | the front of the screen |
| 3 | rakeFar | 30 | the back |
| 4 | astern | 89 | far side |
| 5 | rakeNear | 75 | the front |
| 6 | alongNear | 30 | the back |
| 7 | slant | 89 | far side, then the across wall sends it near |

**What 0151 decided still holds.** Each wall's hole is where it was last fight, so the pattern is still learned and
is never drawn from a stream or opened near the ship. What changes is that learning it now means flying it.

## Consider the screen

Each across-lane hole is still within reach from the far wall at Burn (0151's limit), now measured for every place an
across wall leaves one: 31 and 89, mirror images. Each along-lane hole sits between a quarter and five eighths of the
line from the camera's edge to the hull, inside the ship's box. The wall from astern opens at 89, and is still
beaten from the worst corner of the box. Shot counts, spacing and timing are unchanged. `weigh-walls` reads the same
on this branch as on main: 13 walls at Legendary on the pulse and 17 at Burn, the same 0–1% of wall shots lost. One
wall at Burn on the shuriken is a shot short **on main as well**, so it is not this change.

## Guards

`tests/gyre.test.ts`:

- **0501 — THE HOLES MOVE**: driven through all eight walls, in the units the ship flies (a hole's across for a wall
  across the lane, its distance ahead of the camera for one along it). No two consecutive walls of the same kind open
  within a hole's width of each other. Red on main.
- *THE EIGHT WALLS, DRIVEN* asks each wall's hole at its stance's own share. *The wall from astern* flies to the
  astern hole.

`tests/level.test.ts`: the far-wall reach at Burn is asked of every across place, and *the whole hole is inside the
lane* of every stance.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0501`:

| broken on purpose | went red |
|---|---|
| the gyre authoring no hole per stance, so every wall uses the one place | `THE HOLES MOVE` |
| the curtain thrown with its hole at the row's one place whatever the stance | `THE EIGHT WALLS, DRIVEN` |
| the slant's hole hung off the far end of its line | `and the whole hole is inside the lane` |

The rows gained `atBy`, so the probes that quote them (0151, 0252, 0260) are re-anchored, and 0252's
*the hole read as a place across the lane* probe now breaks `holeAt`'s line. 0151's 8, 0252's 6, 0260's 2 and 0333's
4 are all red.

## Owed

- **A play of the Labyrinth's fight**: does each wall now move you, and is any of the eight unfair from where the
  previous one left you?

## Rollback

⚠️ **None owed**: [0001](0001-revertability-not-risk-rating.md). Content and the thrower; nothing persisted.
