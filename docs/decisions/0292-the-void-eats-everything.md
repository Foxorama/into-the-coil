# 0292 — The void eats everything

> ⚠️ **AMENDED 2026-09-11 by [0307](0307-the-serpent-is-armoured.md).** A void takes the bolt it is
> **in the way of**, not any bolt within reach: flown against the serpent, the pull over the whole
> reach cost the arc about nine volleys in ten from the void phase on. The chain still ends there.

**Accepted 2026-09-09**, from the same play as [0291](0291-the-void-has-an-appetite.md), answering
what that decision left owed:

> *"let's change it so it eats missiles and bombs and that it sucks in the lightning from the
> player's cannon"*

Which is the rest of the original brief —
[`the-serpent-played`](../../reports/the-serpent-played-2026-09-08.md):

> *"void blasts should be larger balls that absorb the player's weapons/missiles/bomb… it'll be
> interesting to see how it interacts with the lightning gun"*

## The rules

**Three arrivals, three shapes.** A missile is spent like a bullet; a bomb's blast is an area and is
not; the arc is hitscan and never touches a pool at all.

**A void blast takes the bolt before anything else does, and ends the chain there.**

## ⚠️ 0291 named this gap rather than narrowing the ask, which is why it was one edit

*"It feeds on `playerShots` alone… two more pairings, each with its own question — a missile is
guided and would need to choose a blast as a target, and a bomb's blast is an area rather than a
body. Neither is hard and neither is this."* Both turned out to be four lines each. **The value was
in the gap being written down**, so the next session started from a list instead of a re-reading.

⚠️ **A MISSILE NEEDED NOTHING OF ITS GUIDANCE.** A seeker already chooses a target every step; a
blast it flew into is simply where it ended up, and the pairing is the same swept overlap the guns
get.

⚠️ **A BOMB IS NOT CONSUMED, WHICH IS `blastInto`'s OWN SHAPE.** A blast is a region that hurts
everything standing in it, and one that vanished into a single void blast would be a bomb the player
lost to a bullet. **But it may not bite on every step it overlaps** — a bomb held over a void empties
a six-point appetite in three frames, and the swell nobody saw is the only warning there was. `landIn`
is the field [0234](0234-a-blade-circles-the-ship.md) added for exactly this, *already landed*,
counted down beside the flash, so a blast lands on a void once a flash — the rate a blade lands on a
body.

## ⚠️ *Sucks in* is a pull, not a permission

The arc searches `enemies` and `bossPool` through `nearestFrom`, which takes a POOL — and only some of
the hostile pool swallows, so this could not be that call with a third argument.

⚠️ **AND NEAREST-WINS WOULD HAVE BEEN THE WRONG READING.** *May also hit* is what a third pool gets
you; what was asked for is a pull, so **a void in reach takes the link even when an enemy is nearer**,
and **the chain ends there**. Both halves matter: links after it would jump out of the blast to
whatever is behind, which would make the arc *better* against a screen with voids on it than one
without.

This is the one target that costs the player the rest of their volley, and that is what makes a void
blast a thing to fly around rather than a thing to ignore. It is also the one interaction the player
asked about twice before it existed.

## ⚠️ Three guards that measured the fixture, and the harness said so three times

**`npm run prove` reported STILL GREEN on three of four probes.** Every new guard passed with the
feature removed.

The ship's own `fireIn` was held off and **`missileIn` was not** — so the ship threw a seeker of its
own every couple of seconds and fed the blast in all three tests. What was being measured was the
fixture.

⚠️ **AND THE OTHER TWO WERE THE SAME CLASS WEARING DIFFERENT CLOTHES.** The bomb's probe went red on a
`TypeError` out of the fixture — a pool of four blasts exhausted on the fifth step and `spawn()`
handed back `null` — which is a probe red for the wrong reason and proves nothing. And the pull's
probe stayed green **twice**: first because nothing else was in reach to compete, and then because
nearest-wins strikes the drifter and JUMPS to the void on its next link, so *was it fed* is true
either way.

⚠️ **WHAT SEPARATES A PULL FROM A COINCIDENCE IS WHAT THE CHAIN DID NOT HIT.** The drifter's health is
half that assertion now. [0019](0019-a-probe-must-be-seen-to-apply.md) earned its keep four times in
one decision, and the honest record of this change is that **not one of its guards held what it
claimed until the probes were run.**

## What is held, and where

| Claim | Where |
|---|---|
| a MISSILE feeds it | `tests/serpent.test.ts`, driven |
| a BOMB feeds it, and is not consumed doing so | `tests/serpent.test.ts`, driven |
| the LIGHTNING is sucked in — and the nearer enemy is left alone | `tests/serpent.test.ts`, driven |

⚠️ **THE FIXTURE SILENCES BOTH OF THE SHIP'S CADENCES AND EMPTIES FOUR POOLS A STEP**, so the only
thing that can reach the blast is the one the test places on it. The next weapon added to this ship is
a third cadence nobody will remember here either, which is why the pools are cleared as well as the
timers held.
