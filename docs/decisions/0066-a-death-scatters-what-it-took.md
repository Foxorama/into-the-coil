# 0066 — A death scatters what it took

**Accepted 2026-08-07.** The other half of the dying-is-punishing report that
[0057](0057-a-death-does-not-rewind-the-level.md) deliberately did not answer. Does not touch
[0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md): a death still costs the arsenal.

## The rule

**A death throws every upgrade it took back onto the field**, from where the ship was, spread **across
the lane** and holding the distance it died at.

A scattered pickup **does not cycle** and is **on a short timer** — five seconds — and leaves a burst
when it runs out.

**The lifetime is what says it is scattered.** An authored pickup never carries one, so `lifeFor > 0`
is *this came off a ship that just died*: one field, no flag, and no way for the two answers to
disagree.

## What was reported

> *"When a player dies, their power ups should explode from where they were and bounce around the
> screen."*

> *"Non-cycling and on a short timer so there's enough time to grab some, but maybe not all."*

## Why it is the answer to a report about something else

[0057](0057-a-death-does-not-rewind-the-level.md) fixed *"when a player dies the entire screen
resets"* and wrote down what it was leaving: *"coming back invulnerable but ARMED WITH NOTHING is
still the hard part, and this does not address it."*
[0056](0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md) then made a death cost the
missiles as well, in the same session as the report that dying was already too punishing.

So the twenty seconds after a death are the hardest in the level, and the player is flying them with
the base weapon. Scattering is not mercy for its own sake: it is the thing that makes *a death costs
the arsenal* a decision the player can act on rather than a wall.

## Three details that are the whole of it

**Across only.** Every scattered pickup carries the scroll rate along, so it holds the distance the
ship died at and spreads sideways — [0034](0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md)'s
*every speed is in the camera's frame*. Thrown along as well, it is off the front or the back of the
screen inside two seconds, which is the opposite of *"enough time to grab some"*.

**A fan, not a roll** — the opposite of what `burst` does, deliberately. Debris is something coming
apart and wants to look accidental; this is the game handing back a **countable set** of things, and a
seeded scatter that stacked two of them on one lane would take one of them away.

**Non-cycling.** A scattered `spread` that turned into a `missileSpread` on the way back would be the
game handing out something the player never found — [0052](0052-a-pickup-is-two-things-and-the-camera-says-which.md)
working exactly as designed on a body it was never meant to reach.

## The ordering, and the fact that no file can state it

`scatterUpgrades` has to run **before** `lifeLost`, because the reducer is what empties the list. That
is a rule about the sequence of two calls in `src/app/mount.ts`, and there is nowhere in
`src/app/frame.ts` to write it down — the frame cannot see the run. So the probe for it breaks the
scatter into a no-op and the guard is the reported behaviour itself.

## Confirmed, not assumed

Probes in `scripts/probes/0066-scatter.mjs`. **7 red, and every tree back to what it was copied as.**

| broken on purpose | went red |
|---|---|
| the scatter removed, so a death takes the upgrades and offers none of them back | `THE REPORTED ONE: one pickup per upgrade, where the ship was` |
| the scatter left cycling, so what comes back is not what was lost | `does not cycle, so what comes back is what was lost` |
| the no-cycling rule widened to every pickup, which undoes 0052 entirely | `an AUTHORED pickup still cycles` |
| the scatter thrown along the lane too, so it leaves the screen before it can be reached | `holds the distance the ship died at, rather than flying off the screen` |
| the fan flattened, so a whole loadout arrives stacked on one lane | `spreads across the lane instead of stacking on one line` |
| the short timer removed, so a death costs the player nothing | `is gone on a short timer, and says so when it goes` |
| the scatter moved after the reducer that empties the list, so it throws nothing | `THE REPORTED ONE: one pickup per upgrade, where the ship was` |

⚠️ **The third probe is the counterweight and it matters as much as the second.** *Non-cycling* is a
property of a **scattered** pickup, not of pickups — and a break that switched the cycle off
everywhere would satisfy every other assertion in the set while undoing 0052 entirely.

⚠️ **The fixture had to learn to move the ship out of the way**, because the game does: `onDeath`
scatters and then respawns at `SHIP_START_ALONG`. The first version left the ship on top of the
scatter, collected the whole thing on the first step, and measured nothing.

⚠️ **The expiry leaves a burst**, because
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) is named for three cases where the
model resolved something and the screen said nothing. A pickup the player was flying towards that is
simply not there any more reads as a collection that failed.

## What this leaves owed

**The pool went from eight to twelve**, out of the particle share, on the same terms as the shell, the
missiles and the bomb. It is still not the arsenal's size, and cannot be: a player carrying twenty
upgrades scatters twelve. Sizing it for a run nobody has had would spend
[0022](0022-frame-rate-is-a-feature.md)'s budget on a hypothetical.

**Five seconds, 0.66 units a step and the fan's spacing are all starting points**, on
[0037](0037-the-ship-has-mass.md)'s terms. The one most likely to be wrong is the timer, and it is the
one the ask was most specific about: *"enough time to grab some, but maybe not all."*

**A death near the back of the player's box drops the scatter on top of the respawn.** The replacement
ship arrives at `SHIP_START_ALONG` and the scatter holds the distance the old one died at, so a player
who dies there recovers more of it. Named rather than guarded: it is a mercy rather than a fault, and
whether it reads as one is a hand on the controls.
