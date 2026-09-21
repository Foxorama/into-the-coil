# 0348 — The Labyrinth is walled

**Accepted 2026-09-21.** Item 4 of [`the-places-are-painted`](../../reports/the-places-are-painted-2026-09-21.md).
**Extends [0335](0335-the-fight-happens-in-a-room.md)** — the room's walls become a corridor that runs
the whole level, and the room is where it arrives. **Amends [0059](0059-the-lane-is-the-players-box.md)**
on a walled level only: a drifter turns at the wall rather than past the lane's edge. **Deletes
[0220](0220-a-place-is-somewhere-you-are.md)'s two corridor guards**, whose claim this makes stronger.

## The ask

> *"The end boss has some walls around it, but otherwise there's no labyrinth that the player is
> actually flying through."*

Answered on the flanks, before building: *"For the flankers have the walls open with gaps, and/or move
the flankers so they come down the corridor."* And asked during it, about drifters crossing the stone:
**turn at the wall.**

## What the player sees differently

Masonry along the top and bottom of the flying space for the whole level, in the room's stone, broken by
side passages — some empty, and one opening wherever a flanking wave comes through; below, the maze going
on far down, passing slowly; and at the end, the corridor arriving at the gyre's room.

## Everything that was on the screen, and what became of it

| on screen | verdict |
|---|---|
| walls only in the boss room | **extended** — a corridor from the level's first step to the room's open side |
| the room's stone: slabs with black between them, a film strip | **rebuilt** — running-bond courses filling the tile, mortar, and a lit coping on the face; the room wears it too |
| the backdrop's wavy channel, island and side passages sweeping through the lane | **replaced** — under real walls they read as walls the ship flies through. It is **the maze going on below** now: a generated, braided grid, small and dim so it reads as far down |
| the room's side walls standing still on screen while the camera moved | **fixed** — see below |

## The rules

**A level may state a corridor** (`LevelRow.corridor`, optional, [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)):
a centreline, a width, its stone, and authored side passages. **Here the centreline and width are the
box**, so the faces stand exactly on the line `src/sim/flight.ts` already clamps the ship to — the ship
meets nothing new. Authored as two numbers so that 4b, where the corridor turns and forks, changes a
number into a curve.

**It ends where the room begins**, from the same numbers `layRoom` uses, on the same grid and stone, so
the joint has neither a gap nor a double.

**A flanking wave opens its own passage as it arrives.** A flanker enters outside the lane at the
screen's leading edge and keeps pace with the screen until it arrives in its lane
([0338](0338-the-arrival-is-seen.md)), so it crosses the wall's band standing still on the screen while
the world runs under it. Its opening runs from where it was put down to that point moved on by the
camera's whole crossing — and since it is put down at the leading edge, the opening scrolls in already
open. Eight slots written in place; nothing allocates. **Every one of the level's sixteen flanks is
answered by a gap**; none was moved to come down the corridor, because each reads as coming out of a
side passage — which is what a labyrinth's side passages are for.

**On a walled level a drifter turns at the wall's face, on its hull** — the player's answer. It turned
past the lane's edge ([0059](0059-the-lane-is-the-players-box.md)), which in a corridor is inside the
stone: counted, **1,190 sightings a level** of a body drawn over masonry. It turns on where the step
will take it, because the check runs before the move and a turn on where it is went 0.2 units into the
stone first. What drifters give up is the band past the lane's edge where the ship could not reach
them; in a corridor there is no such band. Every other motion and every other level is unchanged.

**Wall tiles are laid on the world's grid.** 0335 started its run at `camera − extent` once the camera
was past the room's open side, so every tile stood a fixed distance from the camera — a band that did
not move while the camera did. At rest nobody could see it; a corridor arriving in the same stone would
have slid against it at the joint.

## What it costs

- **Draw calls:** two blits per twelve-unit tile in view, thirty to forty on a 16:9 screen — the room's
  own figure — and a passage draws fewer, never more.
- **Contrast:** the maze below spends **less** than the channel did: the Labyrinth's worst room goes
  from **1.12× to 1.91×** vivid and to 1.54× high contrast (`scripts/weigh-sky.mjs`).
- **A sliver at the edge:** a flank's opening begins where the flanker is put down, at the screen's
  leading edge, so the last few units of one tile may go as the wave arrives. The guard below watches
  bodies, not tiles; this is owed an eye.

## The guards, and that each was seen to fail

`tests/corridor.test.ts`, in pixels and lane units, broken by `scripts/probes/0348-*.mjs`:

| guard | the break |
|---|---|
| each face stands exactly where the ship is stopped, read off the painted tiles | the corridor drawn narrower than the box |
| the room's walls begin where the corridor's end, same stone, same grid | the corridor run on to the fight |
| the room's walls scroll with the world | 0335's camera-relative tiling, exactly |
| **no body on the screen is ever drawn over stone**, flying the real level | three breaks: the opening begun past the spawn point (**the first draft — 140 sightings**), the drifter's bound removed, and the turn on where it is (**the second draft**) |

⚠️ **A probe came back STILL GREEN and taught something.** The first version of the passage probe
shrank the opening's drift and the guard stayed green: the fix that mattered was the opening's near end
— the first draft moved the whole range on by the drift, leaving the spawn point walled. The far end's
length is the model's honesty, not the fix. The probe now breaks the near end.

**Deleted:** 0220's *the corridor never closes* and *it branches*, which held the backdrop's channel as
the path the player is inside. That path is the corridor now, held above. Their two probes went with
them, with the reason in the probe file. **Re-anchored**, on only what they break: 0059 (two, into the
branch for an open level), 0211 (the maze's opening lines).

No rollback note: no storage key, save schema, cache prefix or origin is touched.
