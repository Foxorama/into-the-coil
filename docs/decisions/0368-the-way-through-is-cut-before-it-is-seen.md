# 0368 — The way through is cut before it is seen

**Accepted 2026-09-25.** A flanking wave's opening in the corridor's wall is cut ahead of the screen,
by a second cursor over the level script, rather than on the step the wave is put down. Extends
[0348](0348-the-labyrinth-is-walled.md) and [0350](0350-the-corridor-turns.md).

## The ask

> *"the labyrinth walls, spawn and show and then disappear on screen to make the gaps"*

## What was happening

A flanking wave is put down at the screen's leading edge
([0338](0338-the-arrival-is-seen.md)), and it cut its way through the wall
on that step. The painter drops every `roomWall` tile the opening touches, twelve units each, and the
opening's near end sits behind the spawn point by the flanker's radius, the clearance and — for a body
that closes faster than the scroll — its drift backwards through the world, which 0350 added. So one
to four tiles the player had watched scroll in vanished in one frame. 0348's note said *"at most the
last sliver of one tile"*, and it was wrong on both counts.

Two fixes were put back to the player: cut each opening a little ahead of its wave, at the same size,
or cut every opening at the level's start, at up to 75 units longer each. The answer was **cut it
earlier**.

## The rule

**`cutFlank` runs `FLANK_CUT_LEAD` (120) ahead of the wave cursor**, on the same script, and cuts the
opening where the wave will be put down:

- **The camera it will be put down at is known**: the wave spawns on the first step its `at` is inside
  `spawnAlong`, so it is that `at` back by `spawnAlong`'s reach, give or take one step of scroll. The far
  end carries that step.
- **Where along that screen is known up to the ship.** `flankAlongFor` puts it at the leading edge unless
  a ship far enough forward pushes it on. The opening runs from the leading edge to where a ship at the
  very front of its box would push it. On any screen wider than about 1.9:1 those are the same place.
  On 16:9 they are about thirteen units apart, and that is how much longer an opening can be than
  before.
- **Placement is unchanged.** `spawnWave` still puts the wave down against the camera and the ship as
  0338 says; only the cut moved.
- **120 units** leaves the nearest stone of an opening more than fifty units beyond the last tile drawn,
  against a worst drift of about forty-five. Cutting early costs nothing in the world, and costs a slot of
  the passage ring for longer, so `RUNTIME_PASSAGES` is 16. An overwritten slot is stone coming back on
  the screen, so the ring is doubled rather than sized to the edge.
- **A wave the fight thins ([0267](0267-a-fight-thins-the-waves-over-it.md)) keeps its opening.** That
  is decided when the wave is due, after the cut; an empty passage is one the level already has eight of
  on purpose.

## What is held

`tests/corridor.test.ts` — *stone the player has seen does not vanish while it is on the screen*,
every walled level on every tier. Each step the corridor is painted into a recorder, and a tile drawn
whole on the screen on one step must be drawn on the next if it is still whole on it. Seen red on the
old code: on Legendary, six tiles vanished 203 to 206 units into a 213-unit screen, which is the
leading edge where the waves arrive.

Probe: *the cut made when the wave is put down again*. 0350's probe on the passage's travel is
re-anchored onto `cutFlank`.

## What is owed

**A boss's summoned flankers** (`summonAdds`) still cut their opening as they arrive, because nothing
scripts them ahead of time. The guard stops at the end boss, so it does not see them. If a play reports
the gap popping during a fight, that is where it is.

**The level's first step.** The corridor is laid at the level boundary, so the whole of it appears
across the screen at once as the Labyrinth begins. That is a separate thing from this, and nobody has
reported it.
