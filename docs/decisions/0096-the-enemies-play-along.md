# 0096 — The enemies play along

**Accepted 2026-08-10.** The last of the five, and the half of the rhythm ask the player flagged as
the hard one.

> *"And it's going to be tricky, but if we can balance the enemies and enemy fire into the rhythm as
> well that'd be sick."*

## The rule

**Every cadence that shoots at the player is a whole number of sixteenths, the difficulty multiplier
cannot take it off them, and a body's first shot is quantised when it spawns.**

## A coarser grid than the player's, and that is deliberate

[0093](0093-the-gun-is-on-the-grid.md) put the ship's gun on exact note values, because a ship's
cadence is a **ladder a hand authored** — five rungs, each chosen to be a named subdivision. An
enemy's is a **tuned number a level designer reached by feel**, and `src/content/shots.ts` says
nothing may assert on those.

⚠️ **So they are rounded rather than re-authored, and the grid is chosen to make the rounding
invisible.** A sixteenth is 6 sim steps, 100ms:

| | | |
|---|---|---|
| lancer | 75 → 78 | +4% |
| turret | 48 → 48 | — |
| warden | 64 → 66 | +3% |

Every boss phase moved by at most 4 steps and **every one of them still fires strictly faster than
the phase before it**, which an eighth-note grid did not manage for three of the seven.

⚠️ **`fireGapFor` snaps again after the multiplier, and that one line is what the decision turns on.**
0.7 of a grid value is not a grid value. Without it, a tier takes content that was carefully in time
and puts all of it back off the beat — with the content guard still perfectly green.

⚠️ **The ladder compresses at the fast end on the harder tiers**, because the grid is 100ms and a
boss's late phases are 30 steps apart before scaling. At `burn`, two phases of three bosses land on
the same grid position. That is taken knowingly: the guard is *never slower than the phase before, and
the last strictly faster than the first* rather than strict monotonicity at every rung of every tier.

## A period on the grid is not a shot on the grid

⚠️ **This is [0094](0094-in-time-is-not-in-phase.md)'s lesson arriving at the other end of the
field.** Snapping a cadence makes a body keep a musical tempo; where its shots land still depends on
the step it happened to spawn on. **A dozen bodies at correct periods and arbitrary offsets is a
smear, not a rhythm.**

`nextOnGrid` quantises the first shot at spawn, and because every gap is a whole number of grid units
that one alignment holds for the body's whole life.

⚠️ **AND IT IS RELATIVE AFTER THAT, WHERE THE PLAYER'S GUN IS ABSOLUTE.** 0094 reloads the ship to a
multiple of the run's clock, which is right for **one** metronome. Every enemy of a kind doing that
would fire **in unison** — five turrets on screen would be a five-bullet volley every two beats
instead of a pattern. There is one ship and there are forty enemies, and the difference between the
two reloads is the whole of why the field sounds like a rhythm section rather than a stab.

⚠️ **The alignment nudges EARLIER, never later.** Quantising forward is the obvious way to write it
and it would make every body on the field open fire up to a grid unit late — a change to how quickly
a wave becomes dangerous, which nobody asked to move.

## The defect the picture found, and the comments that were already right

⚠️ **`tests/spawns.test.ts` reported 84 of 88 enemy volleys off the beat with every content guard
green.** The cause: both visibility rules in `stepEnemyFire` were written as a `continue` placed
**before** the countdown, so a body off screen had its clock frozen. **An arbitrary pause in a
periodic clock is an arbitrary phase shift**, and no amount of snapping the period survives one. A
wave spawns beyond the view and spends seconds getting into it.

⚠️ **Both of those rules already said, in their own comments, that the clock keeps running** — *"it
simply skipped its turn, which is what the player watched happen"*. The comment was true of the
intention and false of the code, and had been since the day enemies could shoot. The countdown now
runs first and the visibility checks skip the **shot**.

⚠️ **It is a real balance change and it is named rather than buried.** A body used to enter the view
with its whole gap ahead of it and now enters mid-count, so on average it opens fire half a cadence
sooner. That is what *skipped its turn* means; it is what the rules always claimed; and it is the
first thing to look at if waves feel sharper than they did.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0096-enemies-on-the-grid.mjs`.

| broken on purpose | went red |
|---|---|
| the tier multiplier rounding to any step again | `and the DIFFICULTY MULTIPLIER cannot take them off it, which is the step that would` |
| an enemy cadence authored off the grid | `THE ASK: every authored cadence is a whole number of grid units` |
| the spawn alignment rounded forward | `and a body never waits LONGER than its own cadence to open fire` |
| the first shot left unaligned | `THE PICTURE: every enemy bullet appears on a step the grid allows` |
| the fire clock frozen while a body is off screen | `THE PICTURE: every enemy bullet appears on a step the grid allows` |

⚠️ **The last of those found the defect rather than confirming it**, which is the best a probe ever
does — it was written to prove a guard could see a freeze and it turned out the shipped code had one.

⚠️ **And it came back STILL GREEN first time, on the wrong axis.** The draft froze the `across` check,
which reads as the same break; the fixture's enemies fly down the middle of a lane they never leave,
so nothing was frozen at all. **The freeze that shipped is the approach**, and the two visibility
rules are not interchangeable just because they are spelled the same way.

## What is NOT guarded, and cannot be

**That enemies of a kind do not fire in unison.** It is the failure the relative reload exists to
avoid and it is a one-word edit away — and there is no assertion that could catch it: the shots would
all be on the grid, every content table would be untouched, and *five turrets fire together* is a
statement about how it feels. The eyes-on rig is what would show it.

## What this does not settle

**Whether any of it reads as rhythm.** Five PRs have put the ship, the missiles, the music and now
everything that shoots on one grid at 150 BPM; not one of them has been heard by a person. That is the
whole of what the next play-test is for.

**Whether a sixteenth is coarse enough.** It is fine enough to move nothing by more than 4% and
coarse enough that every shot lands somewhere a listener would call a beat — but a sixteenth grid at
150 BPM is 100ms, and 100ms of quantisation is audible as *tight* or as *mechanical* depending
entirely on the ear.

**The bosses' movement and their phase changes**, which are chunk 8 and are a sequence of sessions.
Their fire is on the grid now; nothing else about them has been touched.
