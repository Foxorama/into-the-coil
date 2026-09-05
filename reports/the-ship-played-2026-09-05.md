# The ship played — 2026-09-05

The fifth play-test of the new weapons, on the branch preview of
[0240](../docs/decisions/0240-the-blades-reach-the-boss.md), the same day it was built. Every item
is answered in [0241](../docs/decisions/0241-the-ship-wears-its-colours.md); this file is the record
of what was said.

## The items

**The arc, still.**

> *"also realised the lightning problem, aside from it still being too strong. 5% reduction on the
> range and 1 less max hit"*

**The three blues.**

> *"blue homing missiles, blue lightning, blue ship, it all looks the same. missiles need to be a
> different colour and our ship needs to look a lot cooler with more colour variance"*

**The exhaust.**

> *"also the thrusters when you go up/down don't angle, they move up and down on the ship which is
> a bug."*

A screenshot came with it: the ship climbing, its flame drawn a hull's width below the tail.

## What was built, that this is a verdict on

The arc reached 103 units at the cap with four links. The seeker, the bolt's glow and the hull were
all in the `player` ink, and the hull's livery (0194) was three inks all darker than the hull. The
exhaust (0230) was one bitmap per state, slid across the tail against the ship's sideways velocity
by `SWAY`.
