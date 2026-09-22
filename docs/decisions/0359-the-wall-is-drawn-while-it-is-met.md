# 0359 — The wall is drawn while it is met

**Accepted 2026-09-23.** **Amends [0074](0074-the-box-is-drawn.md)** by one word: the mark of the
player's forward wall is drawn *while the ship is against it*, and no longer at all times. The mark,
its ink, its dash, its place behind every body and its one constant are unchanged.

## The ask

> *"Can we get rid of the shitty dotted line on the right hand side of the screen for the no fly
> zone?"*

## What the line was for, and why it cannot simply go

0074 drew it in answer to a report of its own:

> *"The hard block on the player movement was a problem because there was no indication of it, and I
> got shot a couple of times because I tried to fly forward on the screen to avoid a bullet and
> couldn't."*

Both reports are the same player's and both are right. A wall with nothing drawn on it is a rule the
player finds by being shot; a dashed line down 81% of every frame of every level is a piece of the
rules nailed to the playfield for the whole of a run, most of which the ship spends nowhere near it.
The player named the second cost; the first is on record. **Deleting the mark reverts 0074's answer,
and keeping it as it was is the ask refused**, so neither is what was built — and per
[0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md) that is said here rather than left to be
noticed: the line is gone from play, and it is still the line when the ship is on the wall.

## The rule

**The mark is drawn from the step the ship comes within `BOUND_NEAR` of its forward wall, on every
step it stays there, and for `BOUND_HOLD` steps after it leaves.** Eight world units — four hulls —
and thirty steps, half a second. Both live in `src/app/frame.ts` beside the step that reads them;
the frame holds one number, `boundPress`, and hands the painter the mark while it is above zero and
`null` otherwise. `src/app/mount.ts` still owns WHAT the mark is; the frame now says WHEN.

## Why a reveal and not a glow, a fade or a new picture

0074 left *"it does not react to being pressed against — a glow on contact is the obvious next thing"*
owed to a hand. The hand asked for the line to go, not for a better line, so the cheapest change that
answers both reports is the one built: the same mark, shown less. A fade would need the alpha to vary
per blit, which [0025](0025-the-frame-budget-is-counted-not-timed.md) counts as a state change and
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) refused to grow the painter for,
or a ladder of baked alphas — a new sprite kind per rung — for a picture nobody has asked for. If
the reveal reads badly in play, that is the next report and the ladder is its likely answer.

## Why four hulls, and why half a second

**Four hulls out**, so the line is on the screen a few frames before the clamp bites: at the ship's
speed that is about five steps of warning, which is the *"no indication"* of the first report
answered without the line standing all level. Nought — the tidy value — would show the wall only
once the ship is already stopped on it, which is the first report back; the probe forces it.

**Half a second after**, so a dodge that brushes the wall twice in a second does not blink the line
on and off. A hold that never ran down is 0074's line back for the rest of the level; the probe
forces that too. The guard is a ceiling of two seconds rather than the constant, so the half-second
can move without the guard becoming a copy of it.

## Confirmed, not assumed

Probes in `scripts/probes/0359-bound-met.mjs`; 0074's four still hold the WHERE and still fire.

| broken on purpose | went red |
|---|---|
| the wall drawn at all times again | `THE ASK: at rest in the middle of the box, no mark is drawn` |
| the mark shown only once the ship is already stopped | `arrives as the ship pushes in, before the stop` |
| the hold never run down | `and goes when the ship leaves it` |

The load-bearing guard is still 0074's, in pixels: a ship held against the wall stops within a hull
of the mark. It passes unchanged, because a ship held against the wall is the one case the mark is
drawn in.

## What this leaves owed

**Whether the reveal reads as *a limit* or as *something appeared*.** A guard can say the mark is
there before the stop; only a play can say the player understood it. The first report of a stop with
no warning re-opens the distance; the first report of a line popping in re-opens the fade.
