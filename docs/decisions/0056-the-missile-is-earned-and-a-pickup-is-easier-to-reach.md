# 0056 — The missile is earned, and a pickup is easier to reach

**Accepted 2026-08-06.** Amends [0051](0051-a-missile-is-the-second-auto-weapon.md) in one line, and
answers a second report about how close the ship has to get to a pickup. Both numbers came from
playing the two-level build.

## The rules

- **The base ship carries no launcher.** `launchers` starts at 0, so the first `missileSpread` pickup
  is the missile weapon arriving rather than a second tube. Everything 0051 says about launchers being
  *positions* still holds; there is now a rung below its first one.
- **Collecting reaches further than the hull.** The ship's radius is scaled by `COLLECT_REACH` for the
  pickup pairing only, and for nothing else.

## What was reported

> *"Missile secondary weapon keeps a missile tube on the player ship, default missile tubes should be
> 0 and increase to 1 then to 2."*

> *"Power ups are slightly too hard to pick up in size."*

## Why this is an amendment to 0051 rather than a fix

0051 wrote *"the base ship has one, at the middle"* straight out of the ask that created the weapon,
and it was right about the geometry — the centreline tube, then `across`-minus, then `across`-plus.
What it got wrong is **when the player first has one**, which is a different question and was never
asked. So the positions are untouched and only the starting count moves.

⚠️ **It changes what a run opens as, and it makes a death cost more.**
[0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) clears the upgrade list on a death, and
the base weapon is *whatever an empty list resolves to* — which is now a ship with no missiles at all
rather than one with a single tube. That is a real increase in what dying costs, arriving in the same
session as a report that dying is *"incredibly penalising"*. It is landed as asked and flagged here
rather than quietly softened.

⚠️ **The cap stays at three, and the ask only names two rungs.** *"Increase to 1 then to 2"* is
satisfied exactly by starting at zero; whether a third launcher should still exist is a question about
the top of the curve rather than the bottom, and 0051's third position has art, a side and a probe
behind it. Left alone deliberately, and named here so it is a decision rather than an oversight.

## The half that is invisible in the missile count

A cadence that keeps counting while the ship has no tube reaches zero, resets, and reaches zero again.
Nothing is fired either way — the volley loop runs zero times — so the bug is **invisible in every
count and every sprite**. What it costs is the moment a launcher lands: the clock is at a position
nobody chose, so the reward for finding the weapon is a volley leaving up to a full cadence early,
from wherever the ship happened to be. It reads as the pickup firing the gun.

It has its own guard for exactly that reason, and the guard asserts on the clock, because the
observable everything else would use is zero in both cases.

## Why the reach and not the sprites

The obvious fix is a larger `radius` on six rows in `src/content/pickups.ts`, and it is the wrong one.
[0052](0052-a-pickup-is-two-things-and-the-camera-says-which.md) pairs every pickup with another as a
single silhouette in two fills, and `src/content/sprites.ts` already writes down that two of them risk
reading alike. Growing the art to fix a collision problem spends that legibility on something that is
not an art question.

So the reach grows and the pictures do not: `pickup.radius + ship.radius × COLLECT_REACH`, which at
2.4, 2 and 1.8 is **exactly 6 world units — 6% of the lane**, against 4.4% before.

⚠️ **It cannot make the game harder, which is what keeps it clear of `src/sim/assist.ts`.** Nothing
collected can hurt the player, so there is no version of this that costs anything —
[0024](0024-the-accessibility-floor-is-settings.md)'s rule about assists does not apply, and `hurtbox`
(which shrinks the ship, and only for damage) is untouched.

⚠️ **The guard is a fraction of the lane, never the multiplier.** The lane is a fixed 100 across on
every device ([0023](0023-the-long-axis-is-the-scroll-axis.md)), so a fraction of it is a distance the
player actually flies. An assertion written from `COLLECT_REACH` would prove only that the code agrees
with itself — [0027](0027-measure-the-picture-not-the-model.md)'s rule, and
[0019](0019-a-probe-must-be-seen-to-apply.md)'s note that a probe cannot catch this because a break
and its guard share an author and a vocabulary.

## The corridor, not the floor

*"Slightly too hard"* is answered by making it easier, and there is no natural stopping point on that
road. A reach nothing can miss is not a more forgiving game — it deletes the decision 0052 is built
on, which is **which of the two faces the player flies for**. So the reach is held from both sides: a
pickup 5% of the lane away is taken, and one 12% away is still missed.

## Confirmed, not assumed

Probes in `scripts/probes/0056-earned-missiles.mjs`. **4 red, and every tree back to what it was
copied as.**

| broken on purpose | went red |
|---|---|
| the base ship given a launcher again, so a run opens with both weapons | `fires nothing at all until a launcher is found` |
| the missile clock left running with no tube, so a found launcher fires immediately | `does not run the missile clock down while it has nothing to fire from` |
| the collect reach returned to the hull, so a pass that felt like a hit is a miss | `is taken from 5% of the lane away` |
| the collect reach grown until a pickup an eighth of the lane away collects itself | `is still MISSED from far enough away` |

## What this leaves owed

**Neither number has been played.** 6% of the lane and *the missile is earned* are both starting
points on the terms [0037](0037-the-ship-has-mass.md) sets: a hand settles them, and the guards above
hold the shape rather than the value.

**The title screen's key now says *"A missile tube"* rather than *"Another missile tube"***, which is
correct and is also the only place a player is told the ship starts without one. Whether that reads is
a play-test question, and `docs/game.md`'s rule is that hints go where play proves they are needed.
