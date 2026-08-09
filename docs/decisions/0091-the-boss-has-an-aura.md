# 0091 — The boss has an aura

**Accepted 2026-08-09.** A design question asked against
[0090](0090-the-music-is-four-loops.md)'s own stated limit, and it turns out to be answerable inside
that limit rather than around it.

**Extends [0090](0090-the-music-is-four-loops.md).** No new mechanism: two more layers in the same
loop set, driven by a distance instead of by a level.

## The rule

**A boss brings two music layers with it, and how loud they are is how close it is to the ship.**

## What was asked for

> *"If we can't adjust the music when the boss appears, can we add a sound associated with the boss
> that compliments and amplifies the background music? Like an aura of sound on the bosses or
> something so that as it gets closer to the player it builds in tempo?"*

## The obvious build is a repeated cue, and it cannot work

⚠️ **A cue fired at an interval that shrinks with distance is the natural reading, and it is broken by
two clocks.** Cues are played from the fixed-step loop — `world.onTick`, driven by rAF through a fixed
step accumulator. The music runs on the `AudioContext`'s own clock. **They are independent
oscillators**, so a pulse meant to land on the beat drifts off it over the length of a fight, and
*complements the music* becomes *fights the music*.

⚠️ **There is nothing to tune, which is why this is a decision and not a number.** Even a pulse whose
interval is an exact integer number of steps — and 0.45s is exactly 27 steps, so they exist — is 27
steps of *sim* time against a bar of *audio* time. The two only agree by accident and never for long.

⚠️ **As LAYERS it cannot drift**, because it is in the same loop set: same length, same start
timestamp, sample-locked by construction. The problem disappears rather than being solved.

## *Builds in tempo*, without a tempo existing anywhere

| | |
|---|---|
| **`auraSlow`** | one swell every two beats — a low fifth rising into the bar, and a breath of filtered noise over it |
| **`auraFast`** | the beat and then the offbeat, plus a soft kick under them |

⚠️ **Adding the second to the first is what a build in tempo IS here.** The pulse goes from one every
two beats to one every half beat — a quadrupling — and no tempo is written down anywhere, because a
tempo would be a second clock and a second clock is the thing that does not work.

⚠️ **It is the same additive trick the ladder already uses**, one axis over. 0090's levels add layers
to make the music fuller; this adds subdivisions to make it faster. Same mechanism, same table, same
loops.

## The distance is the player's, which is the best thing about it

⚠️ **A boss holds a station 100–122 units ahead of the camera and the player's box runs from about 10
to 167.** So the gap swings between roughly 15 and 110 units **according to how far in the player has
pushed** — the aura answers to their aggression, not to the boss's script. Flying into its face is
what makes it loud.

| | |
|---|---|
| `AURA_FAR_UNITS` | 105 — silent |
| `AURA_NEAR_UNITS` | 26 — full |

⚠️ **Between the HULLS and not between the centres.** A radius runs from 11 to 13 across the seven and
will run wider; measured centre to centre, the same visible gap in front of two different bosses would
be two different sounds. What the player is judging is the space they are flying into.

⚠️ **Squared, so the last few units are where it moves.** A linear ramp spends most of its travel at
distances nobody is thinking about, and the interesting part of *"as it gets closer"* is the end.

⚠️ **A quarter of a level change's ramp — 0.4s against 1.6.** A level is a structural move; the aura is
tracking a thing the player is steering, and at the slower constant it would still be swelling after
they had backed out of range. That is a sound reporting where they *were*.

## What it costs, stated

⚠️ **Two more baked loops.** The bake goes from four to six, which is a few more milliseconds at the
first press and about a megabyte of buffer. Nothing that ships changes —
[0003](0003-single-file-build.md) is untouched, because the bake is code.

⚠️ **It is emphasis and not information**, which is what keeps it clear of
[0024](0024-the-accessibility-floor-is-settings.md). The aura tracks how close the largest object on
the screen is — a thing the player can already see, and is in fact looking directly at. A cue would
have needed a twin; a music layer that follows something visible does not invent a channel.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0091-aura.mjs`.

| broken on purpose | went red |
|---|---|
| the aura pinned at its ceiling, so it stops answering to how close the boss is | `THE ASK: the aura follows the boss in, and is silent when it is far away` |
| the nearness measured centre to centre, so a bigger boss is quieter at the same gap | `and it is measured between the HULLS, so every boss means the same thing` |
| the aura ramped linearly, so the half of the range the player fights in barely moves | `and the last few units are where it moves, because that is where the fight is` |
| the aura opened before the fight, so the boss brings nothing with it | `and nothing but a boss ever opens it` |
| the aura given no ceiling at the boss, so the whole feature is silent | `THE ASK: the aura follows the boss in, and is silent when it is far away` |

⚠️ **THE ONE THAT IS NOT HERE is *the aura runs as a cue*.** There is no edit that stages it — it
would be a different mechanism in a different file on a different clock — and the reason it fails is
an argument rather than a line. A probe cannot carry that; this decision has to.

⚠️ **A GUARD CAUGHT THE AURA'S OWN CONTENT WITHIN THE HOUR, AND IT BELONGED TO 0090.** `auraSlow`'s
swells first ended at 3.51s of a 3.6s loop, so the loop restarted from silence into a 0.22-second
attack and **pumped once a bar**. 0090's seam guard — *a loop cannot be quieter where it begins than
where it ends* — went red immediately. It was written as a property rather than against the drone, and
that is the whole reason it caught content written a decision later.

⚠️ **AND A PROBE FOUND A RULE LIVING WHERE NOTHING COULD GUARD IT.** *The gap is between the hulls* was
a subtraction at the call site in `src/app/mount.ts`, so the only thing a test could drive was the
curve — `npm run prove` reported STILL GREEN when the radii were dropped. `auraNearnessFor` exists
because of that: **a rule that lives in the shell is a rule with no guard over it.** This is the third
time in two days that a probe has found the guard pointed one layer away from the claim.

## What this does not settle

**Whether it is any good.** `node scripts/hear.mjs --music` now writes an extra file — a boss walking
from the far end of its range to the near end over four loops, with everything else holding still,
which is the only way to hear a continuous quantity that every other level in that rig is a step of.
The verdict is a hand on the controls.

**Whether it should react to anything else.** The boss's health is the obvious second input — an aura
that thins as the boss dies — and it is deliberately not here: one input is enough to find out whether
the idea works at all, and a second would make it impossible to say which one was doing the work.

**Whether the ordinary enemies want one.** They do not have one and should not until a boss's has been
played; the same sound on a wave of drifters is a texture rather than a presence.
