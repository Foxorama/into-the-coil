# 0559 — A run ends whole

**Accepted 2026-10-07.** Amends [0558](0558-a-run-ends-at-the-title.md), which ended a run at the title by
taking its lives to nought and refitting the world to the pilot, and left the field alone because the title
is drawn on the void and the next run and the music room each sweep it before showing it. Played back:

> *"we should clear-out the whole run and not rely on the music room and next run to tidy up for us.
> there's a very real chance we implement something in the future that hangs around and bites us because
> we didn't properly close a run now"*

Adds the fifth row to the lifecycle [0068](0068-a-run-over-is-a-continue.md) tabulates.

## What was measured first

A run flown for forty seconds in the test world (`tests/world.ts`), then swept the way a new run sweeps it
(`startLevel`), compared field by field with a world where a run began and ended at once. Still in it:

- **the lightning gun's bolts in flight.** `resetScene` names the pools it clears, and the bolts are not
  among them. This is the ask's worry, already real.
- **the run's clock** (`steps`), **the stick's last reading** (`intent`), and **this step's death and pickup
  logs** (stale entries behind a count of nought).
- **the readout's latches** (`shownHealth`, `shownPoints`). A latch that happens to equal the next run's
  value skips that redraw.
- **where the last boss stood** (`bossEntryAt`, `bossOffset`, `bossAcross`, `bossFullHealth`).

And the run's half of the state kept its arsenal, level, tallies and continues, with only its lives zeroed.

## The rule

| | |
|---|---|
| **the run** | `ended` returns `initialRun`: the whole run gone, not stood down |
| **the world** | `lifecycle.end`, the fifth verb: `startLevel` on level one (script, camera, ship at the start), then `closeRun`, which clears every layer the world draws except the ship's, by walking `layers` rather than naming pools, and puts back the clock, the stick, the step's logs, the readout's latches and the boss's remembered place. The spawn stream is reseeded as `begin` reseeds it |
| **the shell** | `leaveRun`, on arriving at the title after a run: `lifecycle.end`, then 0558's refit to the pilot and the readout synced |
| **the score** | a continue left to run out onto the title still goes on the table (0438), but it is written as the title is asked for (`walkedAway`, in `dispatch` before the reducer moves), because the title now empties the run's account |

## Why it is built the way it is

**Closed where it ends, not swept where it is next shown.** That a sweep elsewhere happens to come first
is a coincidence of today's screens, and it makes every future thing that outlives a run somebody else's
to find. The bolts were already one.

**By the list, not by name.** `closeRun` walks `layers`, so a pool added later is cleared with no line
here. The guard names nothing either. It puts a body in every layer, ends the run, and compares the whole
world (every field, every pool, every body in each) with one no run touched. A new field that outlives a
run fails it without anyone having thought of it.

**The scalars are named, and the guard is what catches the next one.** A world's numbers are not a list to
walk, and some of them are settings and must survive (the tier, the comfort knobs), so restoring every
number to its value at boot would be wrong. The ones a run leaves are named in `closeRun`, and the
whole-world comparison fails on the first one that is not.

## What holds it

- `tests/run-ends.test.ts`: a run left from any screen is `initialRun` at the title. A run flown with a
  body in every layer ends leaving the world exactly as an untouched one. Measured red, that listed 22
  differences.
- `tests/run-ends.browser.test.ts`: a continue left to run out is on the saved table.

Two probes in `scripts/probes/0559-a-run-ends-whole.mjs`, and 0558's slice probe re-pointed. All seen red.

## What is owed

Nothing to play beyond 0558's: the title looks the same, which is the point.
