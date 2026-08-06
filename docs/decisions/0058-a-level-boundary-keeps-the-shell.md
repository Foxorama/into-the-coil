# 0058 — A level boundary keeps the shell

**Accepted 2026-08-07.** Amends what `startLevel` does. Does not touch
[0050](0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md), which owns what a
shield *is*, or [0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md), which owns what a death
costs.

## The rule

**A level ending keeps the shell. A death takes it.** Shields cross a level boundary with the lives,
the upgrades and the arsenal, because the ship that flies into level two is the same ship. A run
BEGINNING keeps nothing — a new run opens on the hull.

Which of the three it is is an **argument**, `startLevel(world, level, keepShell)`, and never an
ordering.

## What was reported

> *"Shields don't carry forward between levels."*

## Why it was happening

`startLevel` calls `resetScene`, which calls `respawn` — and `respawn` is the answer to *what does a
new life get*. It puts the ship back with `shipRow.health`, which is the hull and nothing else. That
is exactly right after a death and exactly wrong at a level boundary, where nothing died.

⚠️ **The shell had no other home to survive in**, and that is 0050 working as designed rather than a
gap in it: a shield is armour on the LIFE, so it lives on `ship.health` — the field the collision
already moves — and deliberately not in the run slice, where a second copy would only ever be updated
by the pickup. So it is the one thing the player carries that a level boundary had no reason to
preserve, and nothing noticed.

⚠️ **The read is before the reset and the write is after it, rather than `respawn` learning not to
reset.** `respawn` goes on saying one thing. The difference between a life and a level lives in the
function whose name is that difference.

## The interesting part: the first version was correct and unprovable

The carry was originally unconditional, and a run could not inherit a shell because `src/app/mount.ts`
calls `resetScene` **before** `enterLevel` at the top of a run — so by the time the count was read the
ship was already a bare hull. True, and stated by nothing.

⚠️ **`npm run prove` said so.** The probe that removed that line from `startRun` came back **STILL
GREEN**: the rule lived in the gap between two files, so no test could see it broken, and the guard
over it read as thorough while being unable to fire. That is
[0019](0019-a-probe-must-be-seen-to-apply.md) catching exactly what it exists to catch, and the fix is
not a cleverer test — it is a caller that has to say which boundary it is at.

⚠️ **The line it depended on still looks redundant**, because `enterLevel` resets the scene again a
moment later. A rule whose only support is a line that reads as dead code is a rule with a countdown
on it.

## Confirmed, not assumed

Probes in `scripts/probes/0058-shell-boundary.mjs`. **4 red, and every tree back to what it was copied
as.**

| broken on purpose | went red |
|---|---|
| the level boundary putting a bare hull back, so the shell is lost between levels | `carries every shield into the next level` |
| the shell carried as a flag rather than as a count, so one shield arrives as three | `carries a partial shell too, so it is the count and not a flag` |
| the carry made unconditional, so a new run opens wearing the last run's shell | `cannot carry one into a NEW run` |
| the carry allowed past what the ship can wear, so the shell outgrows its own pool | `never carries more than the ship can wear` |

⚠️ **The second probe is the one a hand could not have found.** A count carried as a flag —
*had a shell, gets a shell* — produces the identical picture for a player crossing with three, which
is the only case anybody checks by hand, and hands a free pair of shields to a player crossing with
one.

⚠️ **One of the guards is about the PICTURE**, not the number: the marks are back on the ship on the
first step of the new level. A shell that survived as health and not as a shell is
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) with the sign reversed — the model
kept something the player cannot see they still have.

## What this leaves owed

**Whether carrying the shell is the right BALANCE has not been played.** It makes a level boundary
worth arriving at intact, which is the point; it also means a player who reaches the sentinel with
three shields opens level two with them, and
[0047](0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md)'s two harder tiers were sized
against neither answer. A starting position on [0037](0037-the-ship-has-mass.md)'s terms.

**The save has to store it.** When `save/` lands, *resume at the start of the level you were in*
([0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md)) now has one more number in it, and it
is a number that does not live in the run slice. Named here rather than discovered there.
