# 0621 — The tubes ride over the lights

**Accepted 2026-10-18.** From the play-test of 2026-10-18 —
[`the-play-test-of-2026-10-18`](../../reports/the-play-test-of-2026-10-18.md), item 9. Amends
[0586](0586-the-ships-are-lit.md)'s pad and [0582](0582-the-pad-wears-its-tubes.md)'s side-on tubes.

## The ask

> *"sideview of the Lil Caddie has the spinning lights playing in front of missiles"*

## What was true

The side view is the pad (the stand behind every hangar tab) and the intro's hangar, where the saucer is drawn edge-on
by its own hangar art. Its tubes were baked into that picture (`blueSide`), and the pad then laid the ring of bulbs
0586 gave it — running along the rim's near edge, each brighter as it comes round to the front — **after** the ship,
at the rim's height, which is where the tubes sit side-on. So the bulbs swept across the missiles. In the fight,
from above, the loaded tubes are a later layer than the lights already, which is why only the side view showed it.
Photographed on the pad before and after.

## The rule

**Side-on, a ship with hangar art of its own carries its tubes as their own picture, `blueTubes`, laid after its
lights.** On the pad: the ship, its wheels, its shell, its lights, then its tubes. In the intro's hangar, which lays no
lights, the tubes go on with the ship as they always did; in the chase, the side-on frame of the tilt carries them, and
every leaning frame still has its own tubes baked in, leaning as 0582 drew them. A ship drawn as the fight draws it
has its tubes in its own picture and no side-on art, and its `blueTubes` is empty.

## Why the tubes in front

The ring is painted round the rim's near edge and the tubes stand on the rim, so a missile on the near side is nearer
the eye than the bulb under it. Laying the bulbs behind only the tubes — rather than hiding the bulbs near a tube — keeps
the ring whole and turning, which is what 0586 asked for.

## What guards it

`tests/intro.test.ts`, *0621*: over a turn of the ring on the pad, every bulb is blitted before the tubes; and in the
intro's hangar the tubes are laid after the saucer. Probes in `scripts/probes/0621-the-tubes-ride-over-the-lights.mjs`,
both seen red. 0540's and 0612's probes on the pad's `paintBlue` are re-anchored.

## Rollback

Nothing irreversible. One more picture in the port's closed list, rebaked with the ship (`SHIP_PIECES` takes every
`blue` piece).

## Owed

A look at the pad with the caddie on two tubes of one kind and one of each.
