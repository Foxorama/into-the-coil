# 0087 — A pickup never parks

**Accepted 2026-08-09.** A play-test defect against the build
[0077](0077-a-pickup-arrives-rather-than-stopping.md) landed in — **the decision that already
answered it**, for the second time in two days.

**Completes [0064](0064-a-pickup-waits-to-be-taken.md) and
[0077](0077-a-pickup-arrives-rather-than-stopping.md)**; supersedes neither.

## The rule

**A waiting pickup keeps closing on the player. The wait is a journey from where the pickup slows to
where the ship flies, and there is no place on the screen where pickups stop.**

## What was asked for

> *"Pickups come up fast, still hit the middle barrier and then float a bit."*

## What 0077 fixed, and the half it left

0077 was given *"power ups hit a wall when they get to the center of the screen"* and diagnosed it
correctly: `driftPickups` **assigned** `velAlong` on the step a pickup crossed `PICKUP_STATION`, so
its screen-relative speed went from the whole scroll rate to zero between one frame and the next — a
picture of an impact with nothing there to hit. It replaced the assignment with a first-order lag and
added a bob.

⚠️ **Both of those were real, both are still here, and neither was the barrier.** Easing onto a
station is still arriving at a station. Every pickup still ended up **stopped dead at the same place
on the screen** — 100 units ahead of the camera, which on the narrowest device is 56% of the way up
the view, *the middle*. A shared line that everything arrives at and holds is a barrier whether a
body reaches it abruptly or gracefully.

⚠️ **And *"come up fast… then float"* is the sequence that produced**: two seconds at the full scroll
rate, a stop, then seven seconds of hovering. The complaint is the shape of the whole arrival, not
the speed of any part of it.

⚠️ **This is [0027](0027-measure-the-picture-not-the-model.md)'s subject arriving as a bug report for
the fifth time, and the second in two days** — [0086](0086-the-teeth-wait-for-the-gun.md) is the
other. Both are a decision that fixed the mechanism it was pointed at while the thing the player
watches carried on doing what it did.

## What it is now

| | before | now |
|---|---|---|
| approach | scroll rate, then a lag onto the station | unchanged |
| the wait | `velAlong = scrollPerStep` — holding station | `scrollPerStep × (1 − PICKUP_CLOSE_SHARE)` — **still closing** |
| where it slows | `PICKUP_STATION = 100`, typed | `PICKUP_SLOW_AT`, **derived** |
| the bob | ±6 units, phase offset by `across` | ±7.6 units, phase from `bobPhase`, and only while waiting |

⚠️ **`PICKUP_SLOW_AT` is derived and nobody chose 128.** It is
`SHIP_START_ALONG + PICKUP_LINGER_STEPS × PICKUP_CLOSE_SHARE × SCROLL_PER_STEP` — the distance a
waiting pickup covers before its wait runs out, measured back from the ship. **A pickup nobody
touches arrives at the ship's own place in the camera's frame on the step its wait ends**, which is a
rule a guard can check against two constants that each have their own separate reason
([0027](0027-measure-the-picture-not-the-model.md) allows exactly that shape and refuses the other
one).

⚠️ **What that costs, stated rather than hidden:** a player who does nothing has the pickup delivered
to their `along`. They still have to be on its lane — the lanes are authored off-centre for that
reason ([0082](0082-a-pickup-is-rare-and-says-what-it-is.md)) and it drifts across the whole time — so
*taking it is a decision about position* survives, with one axis of the decision made easier. That is
the direction the report is pushing.

⚠️ **0.35 has a ceiling with a reason.** `tests/pickups.test.ts` reads *the pickup stopped running
away* as **under half the rate it approached at**, in the player's units and naming no constant here.
A share at or above 0.5 is a pickup that never slowed down at all.

## The bob had been running at a quarter of its stated period, and only measuring found it

⚠️ **`Math.sin(cameraAlong / PICKUP_BOB_UNITS + item.across)`.** `across` drifts, at `PICKUP_DRIFT` a
step — so it was not an offset spreading two pickups apart, which is what it was written as. It was a
**second term advancing the phase**, about three times faster than the camera's own, and a
first-order lag attenuates by frequency. The bob ran at **47 steps where the source says 146**, and
what reached the picture was a third of the amplitude the constant describes.

⚠️ **Moving `PICKUP_BOB_SPEED` therefore did almost nothing**, which is how a constant becomes
decorative without anybody noticing. `Entity.bobPhase` is a per-pickup phase set once at spawn — the
golden angle times the pickup's index, so no two of a level's nine ever land in step.

⚠️ **It was found by dumping the track and reading it, not by reading the line.** The line looks
right; it says *offset by the pickup's own across so two pickups do not bob in unison*, which is a
sentence about a value that is constant, in a file where that value is not. Nothing in the repository
could have caught it: the guard over the bob measures **forward travel**, which was positive by 0.02
units a step — a feature holding on by rounding, and passing.

## The bob belongs to the wait, and the first draft learned that from a guard

⚠️ **At 0.4 a bob during the approach reads as an arrival.** The first draft applied it the whole
time a pickup was on the field, and `tests/pickups.test.ts`'s *waits somewhere the ship can actually
fly to* went red: a pickup wobbling while it crossed the view satisfies *has it stopped running away*
from a place it is only passing through — 182 units out, past the box the ship is allowed to fly in.

**A guard measuring the picture caught a change to the picture**, which is the thing 0027 asks for and
the thing that is normally missing. It is kept as a probe.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0087-never-parks.mjs`.

| broken on purpose | went red |
|---|---|
| the closing share cut to nothing, so a waiting pickup holds station again | `and the wait is a journey that ends where the ship flies` |
| the station typed rather than derived, so the wait ends nowhere in particular | `and the wait is a journey that ends where the ship flies` |
| the bob's phase taken from a field that drifts, so the wander runs at a quarter of its period | `wanders along the lane while it waits, rather than tracking one line` |
| the approach branch deleted, so a pickup begins its wait the moment it spawns | `waits somewhere the ship can actually fly to` |

⚠️ **Every one of these leaves 0077's own guards green**, which is the point of the file: 0077's
guards measure the SMOOTHNESS of the arrival, and they were green over the build the player called
*"still hit the middle barrier"*. A second pass over a defect has to break something the first pass
had no opinion about.

⚠️ **Two of 0064's probes were re-anchored and one of 0077's.** 0064's *the wait removed* and *the
station put beyond where the ship is allowed to fly* both planted lines this decision rewrote; the
second is now the derivation replaced by a typed number, which is the same mistake made the same way.

⚠️ **`tests/pickups.test.ts`'s band assertion INVERTED and moved to its own test.** It held the
wander to under a quarter of the lane, on the reading that a wait happens in one place; a wait is a
journey now. It is a separate `it` rather than a rewrite in place, because the two claims fail for
different reasons and a probe names one test.

## Three guards were passing for the wrong reason, and every one was found by `npm run prove`

⚠️ **None of them is a guard this decision wrote.** They are 0064's and 0077's, they were green
before this change and green after it, and the whole-set proof is the only thing in the repository
that could say what had happened to them.

**1. *It never stops dead* went blind, and STAYED GREEN about 0077's own reported defect.** The probe
restores the assignment that shipped — `velAlong = target` — and the suite did not notice. The jump a
missing ease produces is `target − velAlong` on the single step the pickup slows, and under this
decision that target carries the bob; **one fixture pickup crosses at one bob phase**, and this one's
phase sat where the target was already near the pickup's speed. The whole impact was 0.03 units
against a bound of 0.15. *Deterministic, and wrong* — a guard that samples one phase of a periodic
quantity measures the phase. It now drives six pickups at six phases, keyed by `bobPhase` rather than
by pool slot, because `releaseAt` swaps the last live entry into a freed one and an index is not a
pickup.

**2. *And then leaves* was about to start measuring COLLECTION.** A pickup now ends its wait at
`SHIP_START_ALONG`, which is exactly where the fixture's ship sits, on the lane the fixture puts them
both on — so *the pool went back to zero* is satisfied by the ship eating the pickup, and a break that
parks one forever still ends with an empty pool. The fixture now takes the ship off the field, which
leaves one way for the pool to empty and it is the one the test is named for.

**3. 0064's *a pickup parks in the view for ever* models a failure that no longer exists.** Its break
stopped the wait's counter, on the reasoning that a body holding station never moves relative to the
camera so the hold never ends. **Nothing holds station now.** A hold that never ends produces a pickup
that drifts past the ship and is culled like anything else, and the proof reported WRONG TEST — it
reddened this decision's journey guard instead. Its break is now the one thing that can still park
one: both arms of the drift ternary given the camera's own rate.

⚠️ **The common shape is that this decision removed the thing three guards were leaning on** — a
pickup that stops. Two of them then measured something adjacent and one measured nothing, and all
three still passed. `npm test` saw none of it.

## What this does not settle

**Whether the arrival still reads as fast.** The approach is untouched — a pickup crosses from the
spawn horizon to `PICKUP_SLOW_AT` at the scroll rate, exactly as it did. What changed is that it does
not then stop. If *"comes up fast"* survives this, the next thing to move is where the slowdown
begins, and that is one constant with a derivation behind it rather than a free number.

**Whether a pickup delivered to the ship's own `along` is too generous.** Nobody has flown it.
