# 0064 — A pickup waits to be taken

**Accepted 2026-08-07.** Extends [0052](0052-a-pickup-is-two-things-and-the-camera-says-which.md),
which made a pickup two things, and [0048](0048-a-threat-may-arrive-from-the-side.md), which gave it
its wander. Does not touch [0041](0041-a-pickup-is-the-answer-to-what-a-death-costs.md)'s question of
what a pickup is worth.

## The rule

**A pickup stops.** It arrives at `PICKUP_STATION` — 100 units ahead of the camera — holds station in
the camera's frame for **seven seconds** while wandering across the lane, and then hands itself back
to the scroll and leaves.

**A face lasts 3.11 seconds**, half a second less than it did.

The station is inside two boxes and both are real: the **narrowest view any device gets** (150 units),
so the wait happens on screen everywhere; and the **player's own movement box** (144 units), so the
ship can fly to it.

## What was reported

> *"They enter the screen, change when they get to player safe distance, then disappear off the
> screen. They need to bounce and move around the screen so the player can grab them safely and grab
> the power up they want safely."* Also *"cycle .5 sec faster"*.

And the complaint underneath it, which is the one that matters:

> *"Shields are a hundred times more valuable than lives; however, nine times out of ten, because of
> the cycling implementation, the player is picking up a life or placing themselves in danger and
> losing a life to try and get a shield."*

## The two halves answer that complaint together, and neither does alone

A pickup carried no speed of its own, so it fell back through the whole view at the scroll rate: about
nine seconds of travel, most of it spent either beyond the player's reach or already behind them.
Against a 3.6-second cycle that is **a third of a face while the pickup is reachable** — so *which of
the two you get* was decided by when you happened to arrive, and a player who wanted the other one had
to chase it into whatever was also on the screen.

- **The wait** turns *catch it as it goes past* into *go and get the one you want*.
- **The faster cycle** turns seven seconds of waiting into **two and a quarter faces**.

⚠️ **The half-second is worth far more than it was.** On a pickup that merely passed through, half a
second off 3.6 changes almost nothing; on one that waits beside the player it is the difference
between seeing the other face twice and seeing it once. The ask named one knob; what it was describing
needed both.

⚠️ **The arithmetic is written out** — 130 units is 3.611s, minus 0.5 is 3.111s, which is 187 steps,
which is 112 units — because this comment was once wrong about its own duration by three quarters of a
face. [0027](0027-measure-the-picture-not-the-model.md) from the other end: a claim about a derived
number is owed its arithmetic.

## Why `holdFor` is a count and not a position test

The obvious implementation is *hold station while you are at or inside the station*. It cannot work,
and the reason is worth writing down: **a body holding station never moves relative to the camera**,
so the condition that started the hold is true for ever afterwards. The pickup parks in the view,
takes one of eight pool slots for the rest of the level, and a later pickup silently never appears.

So `holdFor` is set at spawn to the approach **plus** the wait, and counting it down is what ends the
hold. It is a step count in a codebase that argues for distances — and the argument does not reach
here: the step is fixed ([0022](0022-frame-rate-is-a-feature.md)), so a count of steps *is* a distance
of camera travel, and this one is computed from the distance the pickup has to cover.

⚠️ **The wait is the same seven seconds for every pickup**, rather than the total being the same. A
pickup that spawns already inside the station gets no approach and all of the wait, which is the
honest answer and the one a scattered pickup will need.

## Confirmed, not assumed

Probes in `scripts/probes/0064-linger.mjs`. **6 red, and every tree back to what it was copied as.**

| broken on purpose | went red |
|---|---|
| the wait removed, so a pickup runs back through the view and is gone | `THE REPORTED ONE: it stops running away, and holds still on screen for seconds` |
| the wait cut below one full cycle, so which face you get is luck again | `waits long enough for the player to see both of its faces and choose` |
| the wait made a position test rather than a count, so a pickup parks in the view for ever | `and then leaves, so the field does not fill up with things nobody took` |
| the station put beyond where the ship is allowed to fly | `waits somewhere the ship can actually fly to` |
| the wander dropped, so a waiting pickup sits on one line | `bounces across the lane while it waits` |
| the cycle returned to its old length, undoing the half second that was asked for | `is half a second faster than it was, which is what was asked for` |

⚠️ **Every guard is written in the units the player experiences.** Where the pickup is measured as
*world units ahead of the camera*, which is the frame it is watched in; how long it waits in *seconds*
and in *faces*; how much of the lane it covers in *units of lane*. Nothing asserts on
`PICKUP_STATION`, `PICKUP_LINGER_STEPS` or `CYCLE_UNITS` — except the last one **as a duration**,
because a half second is exactly the size of change no screenshot can show.

⚠️ **The collection fixtures had to learn to fly forward.** They held the ship on the pickup's lane
and waited for it to arrive, which it no longer does. That is the change rather than a fixture
failing, and it is the clearest statement of what this decision costs the player: a pickup is now
something you go to.

⚠️ **One new test tripped the loop bug `tests/spawns.test.ts` records twice**: `while (pickups.size >
0)` runs no steps at all, because nothing has spawned on step zero. Caught by an assertion reporting
`-Infinity`.

## What this leaves owed

**Seven seconds, 100 units and 112 units are all starting points** on
[0037](0037-the-ship-has-mass.md)'s terms, and the three are coupled: the wait is authored as *more
than one cycle*, so tuning either moves the other.

**The pool is eight slots and a pickup now occupies one for about sixteen seconds** rather than nine.
`src/content/levels.ts` places two pairs less than a hundred units apart, so the standing population
is higher than it was. It fits; it fits with less room than before, and the next thing to add pickups
to the field — a death scattering the ones it took, which is the next item — has to count them.

**Nothing yet stops a pickup waiting inside an enemy.** The station is a fixed distance and the wave
script is authored against the same axis, so *fly forward to the pickup* and *fly into the wave* can
be the same instruction. That is a play-test question and is named rather than guarded.
