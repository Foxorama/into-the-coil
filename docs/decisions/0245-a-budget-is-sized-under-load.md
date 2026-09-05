# 0245 — A budget is sized under load

**Accepted 2026-09-05.** The fifth guard in a day to time out under `npm run prove`'s baseline and
pass alone, and the one where the class was measured rather than answered again.
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) applied to itself: the earlier
four were each fixed one guard at a time, and [0241](0241-the-ship-wears-its-colours.md)'s class
fix — a minute for every test — was sized from an assumption that turned out wrong by a factor of
twenty.

## The rule

**A wall-clock budget on a test is three times the worst cost measured for it under the whole
suite, and the measurement is written beside the number.** Never sized alone, never sized from a
projection, and never raised until it goes quiet: a budget that moves carries the figure that moved
it. The global `testTimeout` in `vite.config.ts` is sized the same way against the slowest test that
has no budget of its own.

**A budget's job is to say which test hung, not to bound the hang.** The CI job bounds the hang.
Three minutes for an ordinary test and seven for the heaviest bake are what that costs, and a
runaway still fails inside a job rather than holding one.

## What was measured

All on the development box (6 cores, 12 threads), 2026-09-05, with nothing else running. "Alone"
is the test by itself; "suite" is `npx vitest run`; "baseline" is the proof's own first step over
the 76 probed suites.

| guard | alone | suite | baseline | budget before | after |
|---|---|---|---|---|---|
| themes: no theme drives the bus past full scale | 41 s | 115 s | 126 s | 180 s | 420 s |
| authored: every registered claim is measured once | 28 s | 104 s | 119 s | 180 s | 360 s |
| music: the band a chest resolves is a real share | 9 s | 16 s | 38 s | 60 s | 120 s |
| sound: the boundary bake takes the same slice | — | 30 s | 35 s | 60 s | 120 s |
| sound: a press finishes the prewarm | — | 24 s | — | 60 s | 90 s |
| orientation: the world does not advance behind the gate | — | 14 s | — | 30 s | 60 s |
| menu: counts down and returns to the title | — | 49 s | 53 s | 60 s (global) | 180 s (global) |
| continue: puts the player back into the game | — | 27 s | 30 s | 60 s (global) | 180 s (global) |

⚠️ **The music bake is the finding.** Sixteen seconds in one clean whole-suite run, thirty-eight in
the next, over sixty under the baseline that reddened the coil proof — three runs of the same
deterministic arithmetic on the same idle box. The loaded cost of a bake is a range set by what the
scheduler puts beside it (the browser suites launch Chromium outside vitest's worker count, and
where they land against the DSP suites is not stable), so a budget at 1.6× one loaded figure is a
coin toss and a budget at 3× the worst seen is a margin.

⚠️ **The reddened proof's box was not loaded by anything else.** The task outputs' modification
times put the `npm run check` that ran that evening at a minute before the proof started, and CI's
own baseline of the same tree was green. What varied was the suite's own scheduling.

## Why 0241's minute was wrong

Its comment sized sixty seconds against *"the slowest single test in the repository … the prewarm at
about two seconds alone."* Under the suite the slowest budget-less test is the menu's countdown at
fifty-three seconds — a real seven-second countdown behind a boot, on a loaded box — so the global
budget had a headroom of 1.1 and the next red was a matter of time. The assumption was never
measured; this decision's rule is that it has to be.

## ⚠️ What was rejected

**Pinning the worker count so the load is predictable.** The proof's baseline and `npm test` already
share one vitest with one worker count and still produced 16 s and 38 s for the same test. The
variance is in what lands beside what, not in how many workers there are, and a lower count makes
every run slower to make one number less wrong.

**A CPU-time budget.** vitest offers none per test, and a hang in a browser test is not CPU-bound.

**Leaving the budgets and rerunning.** [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md):
a rerun is not evidence.

## Confirmed, not assumed

⚠️ **This decision has no probe, on the same terms as 0044.** A budget's number cannot be broken
in a way the suite would see — lowering one makes a test red only under a load a probe cannot
arrange, and the table above is the measurement that stands in for it. `tests/prove-guard.test.ts`
lists this decision as one whose table is a measurement rather than a break, and this is the why.
