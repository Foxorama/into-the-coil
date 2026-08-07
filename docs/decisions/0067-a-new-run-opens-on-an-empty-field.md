# 0067 — A new run opens on an empty field

**Accepted 2026-08-07.** Repairs a regression [0057](0057-a-death-does-not-rewind-the-level.md)
introduced the day before, and does not amend it: *a death takes the ship and the level carries on*
is still the rule. What moves is where the field is swept, not whether a death sweeps it.

## The rule

**A pool that belongs to the LEVEL is emptied when a level starts. A pool that belongs to the LIFE
is emptied when a ship is replaced.** The enemies and their shots belong to the level, which is
exactly why they survive a death and must not survive a level — so `resetScene` clears them and
`respawn` does not.

## What was reported

> *"If you die and end the game, when you restart at level 1, the run is the same run as you were up
> to previously, so you can start middle of level 2."*

## The interesting part: the report names the wrong mechanism, and is right anyway

Nothing about the run was being carried over. `begin` put the level index back to zero and stocked a
full complement; the camera went back to zero and the wave table with it. Every number was correct.

What the player was flying through was **the last run's enemies**, still on the field, because
nothing had swept them — and a level whose content is somebody else's is indistinguishable from a
run that never ended. It is [0057](0057-a-death-does-not-rewind-the-level.md)'s own observation
arriving a second time from the other direction, and its own words are the warning:

> *"A rewind and an empty screen are indistinguishable from the cockpit … taking the words at face
> value would have produced a fix for a bug that did not exist, and left the one that did."*

⚠️ **So two of the four probes break what the report SOUNDED like** — the camera left where the last
run ended, and the wave table left where it was — for the reason 0057 gives for having done the
same: otherwise the next reader has no way to tell that the obvious reading was considered.

## How it got there, and why nothing saw it

`resetScene` ends by calling `respawn`, and for as long as `respawn` swept the enemies, `resetScene`
swept them too. 0057 took that sweep out of `respawn` — correctly, and with five probes to prove it —
and took it out of a new level and a new run in the same commit, silently, because **no test
anywhere asserted what a new run opens on.**

The post-mortem is [`the-sweep-that-served-two-rules`](../../reports/the-sweep-that-served-two-rules-2026-08-07.md):
a line that serves two rules is proven by the probes of one of them, and the other one's absence
looks exactly like green.

⚠️ **The repair is the guard, not the two lines.** `tests/continue.test.ts` now asserts
`resetScene`'s own contract against `resetScene`, rather than through what it happens to call —
which is the thing that was missing and the only thing that stops this recurring.

⚠️ **No rule in `CLAUDE.md`, deliberately.** *Do not rely on a callee for your own contract* is true
and is a slogan: it cannot be mechanically checked, it would flag every honest delegation in the
repository, and the constitution's own note about counting guards applies — *every one flagged its
healthy file as loudly as its sick one*. The guard is worth having; the rule is not.

## The half nobody reported

**A new LEVEL had the same bug**, and it is the more surprising half:
[0043](0043-a-weapon-is-a-budget-and-a-level-opens-empty.md) says a level opens on an empty screen so
the player can find the controls before anything finds them, and level two had been opening on level
one's survivors. Nobody reported it because a fight that carries across a boundary reads as
continuity rather than as a fault — which is why it is a test and not a play-test question.

## Confirmed, not assumed

Probes in `scripts/probes/0067-empty-field.mjs`. **4 red, and every tree back to what it was copied
as.**

| broken on purpose | went red |
|---|---|
| the field left unswept when a level starts, which is the state 0057 left behind | `THE REPORTED ONE: a run started from the title does not inherit the last one’s field` |
| the enemies swept and their bullets left in the air | `THE REPORTED ONE: a run started from the title does not inherit the last one’s field` |
| the camera left where the last run ended, which is the bug the report sounded like | `and starts at the beginning of level one, however deep the last run got` |
| the wave table left where the last run ended | `and starts at the beginning of level one, however deep the last run got` |

⚠️ **`begin` also stopped sweeping the field twice.** It called `resetScene` itself and then called
`enterLevel`, which calls `startLevel`, which calls it again one line later — the first of the two
over a world whose weapon the `begin` dispatch had not yet re-resolved. Two descriptions of *what a
run opens on*, and the one that won was the stale one.

## What this leaves owed

**Nothing measured.** The field a run opens on is a fact rather than a number, and there is no
starting point here for a hand to move.
