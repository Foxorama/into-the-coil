# 0061 — A boss keeps flying

**Accepted 2026-08-07.** Amends what `stepBoss` does after the boss arrives. Does not touch
[0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md)'s phase model — a phase is still keyed to
remaining health and still changes what the boss *does*.

## The rule

**A boss's station drifts along the lane**, as a function of the camera, between `station ± drift`.
The boss **tracks** that station: the ask is the distance to it, capped at the approach rate.

**A phase does not scale the drift**, unlike `patrol`. The forward end of the swing is bounded by the
**narrowest view any device gets**.

## What was reported

> *"When a boss reaches mid screen, it just goes up/down and there's no longer any flowing movement."*

## The scroll never stopped, and that is the interesting part

`cameraAlong` advances every step of a boss fight; the camera is the level's clock and nothing about
it changes when the boss arrives. So *the scroll stops* was not true of the model at all.

It was completely true of the **picture**. By the time the boss is on station the wave script is
finished, the field is empty, and the one remaining thing the player can see holds exactly one
distance from the camera — which is, by construction, a sprite that does not move along. The player
described the picture correctly and named a mechanism that was never the cause, which is
[0027](0027-measure-the-picture-not-the-model.md)'s subject arriving from the same direction
[0057](0057-a-death-does-not-rewind-the-level.md) took it from: a report about the picture is data
about the picture.

⚠️ **So the guard is written in the picture's units too** — how much of the lane the hull covered
over fifteen seconds of fight, against the narrowest screen — and not as a velocity. A velocity that
averages to zero is exactly what holding station already looks like.

## Two options were given and this is the second one

> *"A wall-type boss holding the far edge with its own style, or the scroll keeps running and the boss
> holds a distance while drifting."*

The second, because the first is a **new kind of boss** and this is a fault in the one that exists.
A wall boss is a real idea and it is content: `docs/game.md` says every boss is unique, and a row that
holds the far edge with its own style is the third boss, not a repair of the first two.

## Why a tracker replaced the bang-bang approach

0040's rule was *close at a fixed rate while you are past the station, otherwise match the camera
exactly*. That is correct against a station that does not move. Against one that slides back and
forth it is a switch flipping every few steps at five times the drift rate — the boss would jitter
rather than fly, and **every assertion about where it settled would still pass**, because it averages
to the right place.

So the ask is `(station − along) × STATION_TRACK`, clamped to `±APPROACH_PER_STEP`. Far out it
saturates at exactly the old fixed approach — the entrance is unchanged, which matters because
`src/content/levels.ts` leaves seven seconds of quiet in front of a boss *"so that the arrival is
something the player watches happen"*. Near the station it eases in and then follows.

⚠️ **The cap is the entrance, and it is guarded in seconds.** A tracker with no cap closes two hundred
units in one step: the quiet becomes an empty screen followed by a boss simply being there. That probe
came back **STILL GREEN** against the guards this decision started with, because everything they
measured was *where* the boss ended up — [0019](0019-a-probe-must-be-seen-to-apply.md), and the fix
was a new assertion rather than a cleverer probe.

## Why a phase does not scale the drift

`patrolScale` already escalates the across patrol, and scaling the drift with it reads as the obvious
next line. The forward bound is `ACROSS_SPAN × MIN_ASPECT` — 150 units — and the sentinel sits at 120
with an 11-unit radius, so the whole budget is 19 units. Doubling a 14-unit drift in the last phase
would put a quarter of the hull off the edge of a 3:2 laptop, in the phase the player can least afford
it. `tests/level.test.ts` holds the bound over the whole table, including bosses nobody has fought.

## Confirmed, not assumed

Probes in `scripts/probes/0061-boss-drift.mjs`. **5 red, and every tree back to what it was copied
as.**

| broken on purpose | went red |
|---|---|
| the station pinned again, so the boss holds one distance and only slides up and down | `it never stops moving along the lane, which is what a fight is` |
| the drift read from the boss's own position rather than from the camera | `arrives, closes on its station, and then holds it` |
| the bang-bang approach put back, so the boss chases a moving station instead of flying it | `it never stops moving along the lane, which is what a fight is` |
| the approach cap removed, so the boss snaps onto its station rather than arriving | `its arrival is still something the player watches happen` |
| a drift widened past what the narrowest device can show | `the whole hull stays on screen on the narrowest device` |

⚠️ **The third one is the one to read.** It leaves a boss that arrives correctly, settles at the right
distance, holds the camera's frame and fights exactly as before. What it takes away is the flight, and
a still frame cannot see a flight at all.

## What this leaves owed

**Both drifts and both wavelengths are starting points**, on [0037](0037-the-ship-has-mass.md)'s
terms, and neither has been played. The guards hold the bound and the fact of motion; nothing asserts
on a value.

**The other option is still on the table.** A wall-type boss holding the far edge is content, and
`docs/game.md`'s *every boss is unique* is where it belongs.

**Nothing still says how much boss is left.** 0040 named that as the thing the first play-test exists
to answer, and this does not touch it — a drifting boss is no more legible than a still one about its
own health.
