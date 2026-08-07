# 0062 — A boss dies loudly, and the level ends after it

**Accepted 2026-08-07.** Amends when the frame reports a level cleared. Does not touch
[0042](0042-a-run-is-a-sequence-of-levels.md), which owns what clearing a level is worth, or
[0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md)'s *reported rather than decided*: the
frame still only reports.

## The rule

**A boss's death starts a beat, and the level is reported cleared when the beat ends.** The beat is
`BOSS_DEATH_STEPS` — a second and a half — during which the boss comes apart in **pulses** rather than
in one burst, at the place the player was looking, **in the camera's frame**.

**The simulation keeps stepping through it.** The scroll runs on, the player still flies, and whatever
the boss left in the air still arrives.

## What was reported

> *"Bosses need a real explosion and an end-of-level beat. Currently the level just ends."*

## It did, and it was one line

`onCleared()` fired on the exact step `bossPool.size` reached zero. The shell answers a clear by
raising a screen over the frame ([0042](0042-a-run-is-a-sequence-of-levels.md)), and a screen stops
the simulation ([0017](0017-the-state-is-slices.md)'s `steps` field) — so the loudest event in the
game happened **behind an overlay, on the frame it started**. The 8-fragment burst every enemy gets
was drawn for one step and then covered up.

⚠️ **Both halves of the report are the same bug.** *"A real explosion"* and *"an end-of-level beat"*
read as two asks; the explosion could not be seen because there was no beat, and the beat did not
exist because the clear was instant. Fixing only the fragment count would have produced a bigger
explosion nobody sees.

## Three things the explosion had to get right

**A rate, not a total.** One burst of any size is over inside half a second and reads exactly like an
enemy dying — because it *is* an enemy dying with a bigger number. `BURST.boss` is fragments **per
pulse**, and the pulses run for the whole beat.

**In the camera's frame.** The camera covers 54 units while the beat plays, so the place is remembered
as an **offset** rather than as a world position. A world position is correct on the first frame of
the explosion and visibly behind by the last — the same mistake
[0034](0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md) records costing every off-lane enemy
shot its aim.

**Remembered every step, rather than read after the death.** A released pool slot is the next thing
`spawn` hands out (`src/sim/pool.ts`), so reading the boss's position after the collision reads
whatever moved in behind it. `deaths` carries positions for exactly this reason and could not be used:
it does not say which pool an entry came from, and a boss can die on the same step as an enemy.

## Why the beat is not a freeze

Stopping the world is the obvious way to make an explosion readable, and it is the one thing this game
may not do to a player who is still flying: the boss's last volley is in the air, and a player who dies
to it in the ninety steps after killing the boss has been killed by the fight rather than by a
cutscene. The arcade answer. There is a probe for the freeze, because it is what somebody would reach
for.

## Confirmed, not assumed

Probes in `scripts/probes/0062-boss-death.mjs`. **7 red, and every tree back to what it was copied
as.**

| broken on purpose | went red |
|---|---|
| the level cleared on the step the boss stopped existing, so it ends behind the overlay | `does not report the level cleared on the step the boss stops existing` |
| the explosion made one burst rather than a rate, so a boss goes up in a puff | `scatters fragments over many steps` |
| the explosion left in world coordinates, so the scroll walks away from it | `where the player watched it die` |
| the beat turned into a freeze, so the scroll stops while the boss burns | `keeps the world running through the beat, so it is not a pause` |
| the beat cut below what can be watched | `the beat is long enough to be watched` |
| the beat left counting into the next level, which then clears itself | `does not carry the beat into the next level` |
| the explosion's rate raised past what the debris pool can hold | `leaves room for a whole boss explosion` |

⚠️ **The stale-counter probe came back STILL GREEN first**, and then **WRONG TEST**. Nothing drove
`resetScene` while a beat was running, so a counter left across a level boundary — which reports the
NEXT level cleared a second and a half in, with its own boss still ahead of the player — was
unobservable. [0019](0019-a-probe-must-be-seen-to-apply.md) twice in one probe.

⚠️ **The fragment guard is bounded, and it is bounded because a probe hung it.** The freeze break
turns `while (clearedIn > 0) step()` into an infinite loop; a guard that never returns is not a guard.

⚠️ **The budget guard is arithmetic rather than a drive.** `BURST.boss × BURST.lifeMax ÷ pulse` is the
standing population, and the loudest moment in the game is exactly the moment
[0022](0022-frame-rate-is-a-feature.md)'s *a burst that will not fit is dropped* would start applying.

## What this leaves owed

**A second and a half has not been played**, nor has the pulse rate, nor `BURST.boss`. All three are
starting points on [0037](0037-the-ship-has-mass.md)'s terms.

**The beat ends in a screen, and that is the next item.** `docs/state-of-play.md`'s item 4 —
*"the current pause/level screen interrupts the flow"* — is what this beat is currently handing over
to, and the two want playing together.

**Nothing marks the boss's death for a player who was looking elsewhere.** The explosion is where the
boss was, which is where the player was almost certainly looking; that is an assumption rather than a
guard.
