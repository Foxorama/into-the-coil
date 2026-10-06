# 0558 — A run ends at the title

**Accepted 2026-10-07.** Asked: *"fix the lives bug and the run ending properly so that things reset
correctly"*, and then, of a first version that left the field to be swept by whatever showed it next:
*"we should clear-out the whole run and not rely on the music room and next run to tidy up for us. there's
a very real chance we implement something in the future that hangs around and bites us because we didn't
properly close a run now."* Adds a third agreement to [0017](0017-the-state-is-slices.md)'s root, and a
fifth row to the lifecycle [0068](0068-a-run-over-is-a-continue.md) tabulates.

## What was measured first

In the shipped page, a run flown and then quit from the pause, with the tree at `main` for the whole run:

- **The title read ×3 lives.** Only `lifeLost` takes a life, and nothing ended the run. A victory leaves
  for the title the same way.
- **The pad stood the last run's wheels on the next pilot's ship.** With the Firebird on spinners, a run
  quit and the caddie's pilot chosen on the title, Paint & Parts' pad turned 120 pictures a second over a
  ship with no wheels.

`initialRun` already says what *no run in progress* is. The shell reads lives above nought as *a run is
flying*, so `fitPilot` refused and `fitAtlasGun` baked the run's ship as the one in flight for the rest of
the tab. That is the shape of the play report that spinners stopped *"until a fresh tab"*.

And in the world, a run flown forty seconds and then swept the way a new run sweeps it (`startLevel`)
still held: the lightning gun's bolts in flight, the stick's last reading, the run's clock, this step's
death and pickup logs, the readout's latches, and where the last boss stood. Nothing showed them, and
nothing had to. That is the ask's point.

⚠️ **A first diagnosis was refuted by a measurement that never measured anything.** `tests/globalSetup.ts`
runs `vite build` before every browser suite, so a `dist/` built from a reverted tree is rebuilt from the
working tree before the test reads it. Every "old build" compared that way compared the fix with itself.

## The rule

| | |
|---|---|
| **the run** | a run that ARRIVES at the title is gone: the root routes the run slice `ended`, which returns `initialRun`. Not lives to nought with the account left on it, the whole run |
| **on arriving, not on being there** | *Fly* begins a run with the title still up, so it is in the screen route, where the change of screen is known, and not in `agree` |
| **every way there** | quit, victory, game over, a continue left to run out, and any way off a run not written yet: the rule is the title's |
| **the world** | `lifecycle.end`, the fifth verb: `startLevel` on level one (the script, the camera, the ship at the start), then `closeRun`, which clears every layer the world draws but the ship's, by walking the list rather than naming pools, and puts back the run's clock, the stick, the step's logs, the readout's latches and the boss's remembered place. The spawn stream is reseeded as `begin` reseeds it |
| **the shell** | on that arrival after a run, `leaveRun`: the lifecycle's `end`, then the world refitted to the pilot (`fitPilot`) and the readout synced |
| **the score** | a continue left to run out onto the title goes on the table as it did (0438), but written as the title is asked for (`walkedAway`, in `dispatch` before the reducer moves), because the title now empties the run's account |

## Why it is built the way it is

**Closed where it ends, not swept where it is next shown.** The first version left the field, because the
title is drawn on the void and the next run and the music room sweep before they show it. That made every
future thing that outlives a run somebody else's to clear, and the bolts proved it was already happening.

**By the list, not by name.** `closeRun` walks `layers`, so a pool added later is cleared with no line
here. The guard does not name fields either: it compares the whole world (every field, every pool, every
body in it) with one where a run began and ended at once. A new field that outlives a run fails it
without anybody having thought of it.

**An agreement, because neither slice may import the other.** As 0017 puts *a run with no lives on the
playing screen is over*.

## What holds it

- `tests/run-ends.test.ts`: in the reducer, a run left from any screen is `initialRun` at the title, the
  pause and its menus keep it, and the next run begins stocked. In the world, a run flown with a body put
  in every layer ends leaving the world exactly as an untouched one. Measured red, it listed 22 leftovers.
- `tests/run-ends.browser.test.ts`: a pilot chosen after a quit stands on the pad in their own ship, and
  a continue left to run out is on the saved table.

Four probes in `scripts/probes/0558-a-run-ends-at-the-title.mjs`, all seen red.

## What is owed

A play of the spinners after a won run and after a quit. It should show whether this was the whole of
the report.
