# 0388 — The laser is jagged

**Accepted 2026-09-27.** The pterodactyls' lasers — the quetzal's (level three) and the hydra's third
head's — are a new random zigzag every beam, warned along the path they will burn. **Amends
[0250](0250-the-quetzal-screams.md)**, whose beams were straight. Medusa's stay straight.

## The ask

> the pteradactyl head needs to shoot a random jagged lazer as it currently fires straight ahead and
> because the head is basically static, it's essentially a non-event in the fight - this change needs
> to affect the level 3 pteradactyl boss as well, it needs jagged lazers as opposed to single straight
> beams.

Asked back whether the warning line should show the zigzag: *"Warn along the zigzag"* — random, and
dodgeable because the path is shown before it burns.

## What changed

**A beam row may carry `jag`**, how far either side of its line the knots swing, in lane units. With
one, the beam is a zigzag from its far end to the mouth: twelve legs, alternating sides, each knot a
hashed distance out between a fifth of the swing and all of it, and each moved up to a third of a leg
along the beam so the legs are uneven. The mouth's point sits on the line, so the beam leaves the head.

**The path is derived, not stored — `src/sim/jag.ts`.** A bolt carries its `jag` and a seed in `spin`,
drawn once from a new `beamRng` stream when it fires ([0021](0021-one-stream-per-concern.md)); the
painter strokes the path's points and the frame measures the ship to its nearest leg, both through the
same functions, so the warning, the burn and the hurt are one zigzag. The lightning's flicker hash moved
there with it, and the file is on the hot list.

| boss | beams | half-width | swing |
|---|---|---|---|
| quetzal, wings | two | 1.5 | 10 |
| quetzal, mouth | one | 6 | 18 |
| quetzal, all three | three | 2.5 | 7 |
| hydra, pterodactyl head | one | 3 | 12 |

## What was found on the way

**An evenly spaced zigzag met the ship at the same place on every beam.** The ship holds station a fixed
share of the way along a beam, so on a grid of knots that never moved it met every beam at the same
point of a leg — and a zigzag that alternates sides crosses its line at the same point of every leg.
Measured before the shift, three beams running that swung eighteen units met the ship 1.7, 0.1 and 4.1
units from their straight line: the jag was on the screen and not where the player was. Each beam's knots are now
shifted by a seeded share of a leg.

**The mouth's first swing was too small to move it.** At twelve units a beam six wide rarely stood clear
of its own line at the ship; eighteen does. **And the straight line is not safe under a jagged beam,
and is not claimed to be**: a zigzag crosses its line once a leg, and a leg a few units down the lane
burns a ship parked on the line beside it. A jagged beam covers more of the lane than the straight one
did — its legs are steep — which is part of what makes it an event, and is owed a play.

## The guards, and that each was seen to fail

`tests/quetzal.test.ts`, *0388*. Five breaks in `scripts/probes/0388-the-laser-is-jagged.mjs`, each red:

| guard | the break |
|---|---|
| the pterodactyls' lasers jag and Medusa's do not | the quetzal's mouth straight |
| THE REPORTED ONE, IN LANE UNITS: a jagged beam burns along its zigzag, where a straight one could not reach | the hurt left on the straight line |
| every beam is a new zigzag, and leaves the mouth | one seed for every beam; the mouth's knot off the line |
| the picture: warned and burned on one zigzag | the beam drawn straight |

0250's own beam tests read the zigzag at the ship now rather than the root, and its picture test holds
the zigzag where it held *straight*. **Re-anchored**, on only what they break: 0250's mouth warning and
half-width, and 0254's head shot (the new stream threaded through the throw).

## Not held by any guard

**Whether it reads as a laser rather than as lightning**, and whether the quetzal's mouth phase is now
too wide to dodge. Photographed on the bench, both bosses; owed a play.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
