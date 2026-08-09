# 0094 — In time is not in phase

**Accepted 2026-08-09.** The half [0093](0093-the-gun-is-on-the-grid.md) could not do, and the piece
[`the-gun-on-the-grid-mapped`](../../reports/the-gun-on-the-grid-mapped-2026-08-09.md) listed first
among the three that were *"not blocked"*.

## The rule

**The sim has a clock, every auto-weapon fires on a multiple of its cadence counted from that clock,
and the music's loops are moved to agree with it.**

## Two clocks, and 0093 only fixed the rate

0093 put every rung of the fire ladder on a musical fraction of the beat. **A cadence is a rate**, and
what makes a metronome land on the beat is where it starts.

⚠️ **`w.fireIn = w.weapon.fireEvery` keeps a perfect tempo at whatever phase the last reset left.** A
gun three steps behind the beat is a gun in exact time and audibly not on it — 50 milliseconds at 150
BPM, which is precisely the offset an ear reads as *nearly*. Every guard 0093 landed stays green
through it, because every one of them is about the interval between volleys.

⚠️ **And the phase was reset at the worst possible moment.** A respawn reloaded a full cadence, and a
death is the one event in a run guaranteed to happen at an arbitrary place in the bar — as well as the
most repeated event in a level ([0079](0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md)).

So: `stepsToGrid(w.steps, cadence)`, at all four reload sites. **Every rung divides `STEPS_PER_BEAT`**
(0093, guarded), so a multiple of any cadence is a subdivision of the beat — at every tier, across
every upgrade, and after every death.

## The sim's clock is a new number, and `cameraAlong` could not be it

⚠️ **"The camera is the clock" is about PACE, not about time.** A wave spawns at a camera distance so
a level plays the same on every device; that works because the scroll rate happens to be constant. It
is a distance that equals a time, and the day a level scrolls faster every phase in the game would
move with it. `SCROLL_PER_STEP` is also 0.6, so `cameraAlong / scrollPerStep` is a float division that
stops being an integer after a few thousand steps — and a phase is a modulo.

⚠️ **`w.steps` ticks where the camera advances, not at the top of `step()`.** A frame stepped while
`w.stepping` is false is a frame in which nothing the player is watching moved — a death beat, a menu
reaching the gamepad ([0046](0046-a-pad-is-a-first-class-way-to-press-a-button.md)) — and counting
those would slide the grid under the music while the world is held still.

## The music follows the sim, and the sim is never told

⚠️ **What this exists for is DROPPED STEPS, not crystal drift.** `AudioContext.currentTime` and the
display clock track the same system clock to within tens of parts per million: under ten milliseconds
across a three-minute level, a tenth of a sixteenth, inaudible. What is not inaudible is
`src/app/loop.ts` discarding everything past `MAX_STEPS` rather than spiralling — which is
[0022](0022-frame-rate-is-a-feature.md) working exactly as designed, and costs the phase permanently
every time it happens.

⚠️ **A `playbackRate` servo is the obvious build and it cannot do the job.** No allocation, no seam, no
discontinuity — and a trim small enough to be inaudible as pitch is about 0.2%, which takes
twenty-five seconds to absorb fifty milliseconds. `MAX_STEPS` is 5, so one 150ms hitch throws away
four steps at once. The servo would spend its life behind. **Rejected on arithmetic, not on taste.**

So the correction is a **jump**, and three rules keep it from being heard:

| | |
|---|---|
| **it only happens past 50ms** | half a sixteenth-note triplet at 150 BPM — the point at which a gun locked to the sim stops reading as locked to the music |
| **it always lands on a loop boundary** | a loop restarted mid-phrase cuts every tail crossing the join, which is the notch [0090](0090-the-music-is-four-loops.md)'s seam guard exists to keep out of the bake. It would be no better arriving at runtime. At a boundary the loop was going back to zero anyway, so all the correction moves is *when* |
| **the error is wrapped into half a loop** | the music is a LOOP, so being exactly one behind **is being in phase** — same samples, same instant. Without the wrap a backgrounded tab returns with tens of seconds of "error" |

⚠️ **`makeMusicOut` decides nothing.** The arithmetic is `rephaseIn`, which is pure and headless for
the same reason `musicLevelFor` is: it is the part most likely to be wrong and the only part a test
without a browser can drive.

⚠️ **AND THE SIM IS NEVER TOLD ANYTHING.** The shell reads `world.steps` and moves the audio; nothing
about the music reaches a step. The tempting inverse — align the gun to the audio clock — is refused
by [0024](0024-the-accessibility-floor-is-settings.md), because a player with the sound off would fly
a different game, and by [0015](0015-the-layer-ladder.md), which does not permit the arrow.

## A browser test wrote the settling rule

⚠️ **`tests/sound.browser.test.ts` counted 37 source nodes where it expected 7.** A driven sim races
ahead of a standing audio clock, so the measured error grows without bound and every frame asks for a
correction. The real loop does a milder version of the same thing whenever it runs `MAX_STEPS` steps
in one frame.

**Nothing is corrected until the current anchor has played a whole loop.** It is a correctness rule —
*an error measured over less than a loop is measuring the catch-up* — and it is simultaneously the
allocation ceiling, because every correction re-anchors: **six source nodes per `LOOP_SECONDS`, worst
case.** That is the budget the map costed the idea at before it was built.

⚠️ **A source node is single-use by specification**, which is why a correction allocates at all — the
same fact `src/app/sound.ts` is on `tests/budget.test.ts`'s deliberately-cold list for. If a
correction never runs, the loops free-run exactly as they did before this decision: **the failure mode
is the old behaviour, not silence.**

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0094-in-phase.mjs`.

| broken on purpose | went red |
|---|---|
| the fire clock reloaded to its cadence again | `THE ASK: every volley lands on a multiple of its own cadence, counted from the run's origin` |
| a respawn restarting the fire clock | `and a DEATH rejoins the grid rather than restarting it, which is where the phase used to go` |
| the sim clock counting steps in which nothing moved | `and the clock counts the steps the GAME ran, which is not the same as the steps called` |
| the loop wrap removed | `THE TRICK: a whole loop of drift is no drift at all, so a backgrounded tab is a small correction` |
| the correction taken off the loop boundary | `and the correction always lands on a loop boundary, because a loop has no other seam` |
| the settling rule removed | `and corrects nothing until the anchor has played a whole loop, which is the allocation ceiling` |

⚠️ **THE FIRST TWO CAME BACK WRONG AND THE FIRST IS THE ONE TO REMEMBER: AN ALIGNMENT TEST THAT
STARTS ALIGNED TESTS NOTHING.** The fixture opens at step zero with a countdown equal to the cadence,
so its first volley lands on a multiple by accident — and a *relative* reload from there produces a
perfectly gridded sequence for ever. The probe put the shipped code back and the guard stayed green.
It starts deliberately off the grid now, and asserts the offset actually happened before asserting
that everything after it rejoined.

That is the same family as the phase-sampling mistake 0093 recorded, seen from the other side: **a
guard whose starting condition is the thing it means to detect.**

The second was a death test that never triggered a respawn — it reloaded the clock by hand and
measured `fireShip`'s path twice. It calls `respawn` now, and covers the **first** volley after it,
which is the only one that can see the bug: `fireShip` re-grids after every volley it fires.

## What this does not settle

**Whether any of it is audible.** Nothing in a test suite can hear a gun sitting on a beat. What can
be said is that the model no longer has a way to drift, which it did.

**Whether 50ms is the right threshold.** It is derived — half the shortest gap between volleys at the
weapon cap — and it has never been heard. Too low and the music twitches; too high and the gun sits
off the beat. One number, in `src/app/music.ts`.

**The correction has never been heard either.** It fires only after the game has already stuttered,
and it lands on a downbeat where a kick is about to hit, which is the best possible place to hide a
join. That is an argument, not evidence.
