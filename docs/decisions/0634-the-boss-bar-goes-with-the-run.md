# 0634 — The boss bar goes with the run

**Accepted 2026-10-18.** From [`the-run-resets`](../../reports/the-run-resets-2026-10-18.md), item 2. Amends
[0559](0559-a-run-ends-whole.md)'s `closeRun`.

## The ask

> *"ending a run on a boss → boss's remaining health shows on next run"*

## What was true

The world tells the chrome the boss bar's value only when it changes. `shownBoss` is the last value sent, and
`onBoss` is called when the new one differs (0360).

`closeRun` put `shownBoss` back to "no boss" (−1) and did not call `onBoss`, so the chrome kept the dead run's
fraction. The bar is hidden on screens that do not step and shown again on `playing`. The next run's "no boss"
equalled the reset latch, so nothing ever told the chrome again. The dead boss's health stood over the next run
until the next end boss arrived and changed it.

0559 named the hazard, *"A latch that happens to equal the next run's value skips that redraw"*, and fixed it for
the world. The health and the score are re-sent when the shell syncs a new run. The bar had nothing.

## The rule

**A run that ends with a boss bar up takes it down.** `closeRun` tells the chrome the bar is gone (`onBoss(-1)`)
when it was up, then puts the latch back. The run is closed where it ends, as 0559 says, and the chrome is part of
what the run leaves.

## What guards it

`tests/run-ends.test.ts`, *0634*: a run that ends with a bar up tells the chrome −1 last. The world is the whole
model the chrome draws from, so what it is told last is what the player sees.

The probe in `scripts/probes/0634-the-boss-bar-goes-with-the-run.mjs` takes the call out; seen red.

`tests/run-ends.test.ts`'s whole-world comparison could not see this, because the stale value lived in the
chrome and not in the world.

## Owed

- **A run lost to a boss, then a new one**: no bar until the next end boss arrives.
