# 0215 — A transition is a shape, not an instant

**Accepted 2026-09-03.** The first mix change since the music room made the game's music and the
room's music one thing — and the first that therefore lands on both without anybody choosing.

> *"let's tweak some of the music, in The Approach at 41sec in, the volume increases a bit too loudly.
> there's too big a jump from the transition to the spike at that level, and we'll need to make sure
> the transitions are smoothed out for the rest of the level so there's no weird drops later."*
>
> *"the black heart level has a similar issue, so run a pass on all the levels just to check."*

## The rule

**A move's ramp is as long as the move is big.** Every write took `RAMP_SECONDS` whatever it was
doing; it now takes between that and `RAMP_SPREAD` times it, keyed on how far the layer's own gain
travels in dB.

**A departure lasts at least as long as the arrivals it makes room for.** A closing layer still leaves
on the downbeat, ahead of every arrival — [0120](0120-a-rung-may-close-a-layer.md) is kept — but it
fades across the build instead of finishing before it starts.

**The longest ramp is the width of a build.** `RAMP_SPREAD` is derived from `BUILD_BARS`, not typed.

⚠️ **AND THIS IS THE FIRST DECISION UNDER A STANDING INSTRUCTION**: *"all changes requested should
affect both equally and I shouldn't need to specify going ahead."* It is **structural rather than a
discipline** — [0212](0212-the-room-walks-the-level.md) made the room ask `auditionRung`, which is a
run's own `musicLevelFor`, so a change to `levelWrites` reaches both surfaces by construction and
`tests/arc.ts` measures both with one walk. If a mix change ever needs to know which screen it is on,
that is the smell.

## ⚠️ Nothing here could measure a jump, and three instruments looked like they could

`weigh-boundary` subtracts the two sides of a rung change. `weigh-build` says when each arrival lands.
`weigh-heard` asks whether a layer clears its margin once settled. **All three are green over an arc
that steps four decibels in one bar**, because a jump is a difference between two moments and none of
them has both a time axis and a sum in it. [0140](0140-no-layer-is-inaudible.md) rules out the
obvious substitute: *a gain is not a loudness* — the faders span 7 dB and what comes out of them
spans 38.

So `scripts/weigh-arc.mjs` and `tests/arc.ts` were written first, and they print what the whole mix
sums to against the clock. **The reported moment came out at +2.2 dB inside one bar, at 0:41**,
against the +1.4 dB the four seconds before it had spent.

## The pass over all seven, which is what the second report asked for

Two places were reported. **Five had the defect, and two of the five were worse than either report.**

| place | worst one-bar rise, before | after |
|---|---|---|
| The Approach | **+2.2** at 0:41 ← reported | **+1.1** |
| Ember Nebula | +1.0 | +0.8 |
| Saurian Belt | +0.2 | +0.1 |
| The Labyrinth | **+3.7** at 0:36 | **+1.9** |
| Rime Shelf | +1.4 | +1.1 |
| The Toxic Mire | **+3.8** at 0:43 | **+1.8** |
| The Black Heart | **+2.8** at 0:22 ← reported | **+1.6** |

**Every hole is now zero.** Before, five of seven had a stretch quieter than both ends of a boundary.

⚠️ **THE RESIDUE IS THE COMPOSITION AND NOT A TIMING DEFECT.** The Black Heart's `run → push` is worth
**+5.1 dB** and a build is four bars, so the arithmetic floor is about 1.25 dB a bar. A guard set at
the audibility threshold would be demanding that [0136](0136-the-place-has-a-room-and-an-arc.md)'s
authored *"Up, Up, Up, drop, sharp Down"* be flattened, which is a different decision and not one a
transition-timing rule may make. `BAR_RISE_CEILING_DB` is 2 for that reason.

## ⚠️ The metric conflated two things and sent the first pass the wrong way

*Dip below where the boundary started* looked like the obvious measure of a drop. It reported The
Toxic Mire's `surge → approach` at **−4.9 dB of defect when 3.5 of it is the composition** — a rung
that is genuinely quieter, which is the authored arc.

**The two are now separate.** `settled` is what the rung change is worth once everything has arrived;
`hole` is how far the mix falls below **both** ends, which is the only part of a dip nobody wrote. On
the corrected metric the holes were −0.4 to −1.4, not −5, and the fix had something reachable to aim
at.

## ⚠️ And I tuned a constant twice that was not the cause

The first fix scaled ramps by the arriving layer's **role**, on the reasoning that `entryBars` lands
the loudest arrival last and alone. It fixed The Approach and did **nothing at all** to The
Labyrinth or The Toxic Mire at any value between 2 and 6.

`--writes` was added to `weigh-arc.mjs` to stop the guessing, and it answered immediately: The
Labyrinth's `push → surge` turns **seven already-sounding layers up on one downbeat**, `chords` by
6.6 dB and `sub` by 5.6. **Not one of them was an arrival**, so a rule about arrivals could never have
reached them — and `levelWrites`' own comment said so out loud: *"a bed that merely gets louder moves
on the downbeat too: it is the boundary, not an arrival."*

⚠️ **THE SECOND ATTEMPT — treating a big rise as an arrival and putting it in the build — MADE IT
WORSE.** Seven movers overflow `BUILD_BARS`, and `entryBars` shares the surplus onto the downbeat, so
more landed together than before. It was reverted.

**What worked is one rule over every write**, keyed on the layer's own dB, which subsumes both cases
and leaves [0171](0171-a-boundary-is-a-build.md)'s ordering and
[0117](0117-a-section-change-lands-on-the-beat.md)'s downbeat untouched. **A layer still starts when
it started.**

## Three things measured rather than assumed, two of which said no

1. **A cheaper bake for the guard.** RMS is an energy measure, so a quarter sample rate ought to do.
   **Per layer it is badly wrong** — `ride` reads 6.0 dB low, a cymbal being mostly content the rate
   cannot carry. **Per boundary, which is what is asserted, the worst error across all seven places is
   0.05 dB** against a 2 dB threshold. Both numbers are in `tests/transition.test.ts`: the second is
   why it is safe, the first is why it is safe for nothing else.
2. **Caching bakes by shared material.** `tests/bakes.ts` says *"six of the seven places still share
   one bake"*. Measured: **six of seven re-voice 21 or 22 of the 23 layers**, so the sharing saves
   almost nothing. That note has been overtaken by 0132 and 0162 and is now stale.
3. **The departure floor.** Written first as an assignment, it made the fade *shorter* wherever a
   build was under four bars and deepened the hole it was meant to close. Caught by re-reading the
   table, and it has its own probe.

## ⚠️ A guard that was green over every one of these spikes

`tests/music.test.ts` asserted that every non-aura write takes exactly `RAMP_SECONDS / 3`. **That was
true, and it was the bug.** Its actual subject — the aura follows the boss while everything else
follows the bar — is untouched, so the equality became a band. A guard can be correct, passing, and
describing the defect.

⚠️ **AND THIS FILE TIMED OUT AN UNRELATED ONE.** Seven full-rate arcs at module scope took 33 seconds
and `tests/links.test.ts`, which runs in 825 ms alone, **failed at its 5-second timeout**.
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) says an intermittent guard has
found something; what it found was this file, and the answer was the cheaper bake above rather than a
wider timeout.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0215`.

| broken on purpose | went red |
|---|---|
| every move back on one ramp length, so the biggest arrivals land as steps | `never climbs more in one bar than the arrangement itself asks for` |
| a departure no longer lasting as long as the build it makes room for | `is never quieter than both the rung it left and the rung it is reaching` |
| the departure rule written as an override, so a short build shortens the fade | `never shortens a departure to fit a short build` |
| the longest ramp typed as a literal, so retuning the build no longer carries the ramps | `caps the longest ramp at the width of a build` |
| the ramp scale uncapped, so a big enough move ramps past the build and into the next one | `gives a bigger move a longer ramp, and never one longer than the build` |

The first of those reddens as *"approach run → push climbs 2.2 dB inside one bar, at 0:41"*, which is
the report in the guard's own words.

## What is owed

**A listen, and it is the only thing that can settle this.** Every figure above is a model quantity:
the sum is incoherent, the bus's `saturate` curve is not applied, and the arc is arithmetic over
baked material rather than a rendering. What was reported is that a moment sounded too loud; what is
claimed is that it no longer does.

⚠️ **AND THE THREE PLACES STILL OVER 1.5 dB A BAR ARE THE ONES TO LISTEN TO** — The Labyrinth, The
Toxic Mire and The Black Heart, all at `run → push`. If those still read as steps, the next move is
the **ladder** rather than the ramps: those boundaries are worth 4 to 5 dB, and no amount of timing
makes a 5 dB step gentle. That would be a change to 0136's arc, which is a decision and not a tweak.
