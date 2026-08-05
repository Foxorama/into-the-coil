# 0044 — An intermittent guard is measuring the wrong thing

**Accepted 2026-08-06.** The sibling of [0005](0005-a-guard-must-be-seen-to-fail.md), which says a
guard that has only ever been green is not known to work. This is the other failure of the same
organ: a guard that is *sometimes* red is not known to work either, and it is worse, because there is
a word available that makes it go away.

## The rule

**"Flaky" is not a diagnosis.** A guard that fails intermittently has found something — a real
intermittency in the code, or a wrong quantity in the guard — and which of the two it is has to be
established, not assumed.

Reruns are not evidence. A guard may be **deleted**, **fixed**, or **left red**; it may not be
re-run until it is convenient.

## What happened

The measurements are in [`two-levels-played`](../../reports/two-levels-played-2026-08-06.md).

`tests/frame.browser.test.ts`'s *moves — the frame after is not the frame before* failed once during
`npm run prove`, and the first response written down was *"that browser failure was flaky"* — with no
investigation, in the same sentence as moving on. The correction came from the player:

> There is no flaky — tests can be brittle on purpose, but if there's a flaky test, let's test that
> better. Flaky is an escape excuse.

Investigated, it was neither flaky nor random.

⚠️ **The test asserted that the picture changed across 600 milliseconds of WALL CLOCK.** That is only
the same as *across frames* on an idle machine. `npm run prove` runs the whole suite once per
probe — 172 vitest invocations — so the machine is saturated and a headless page's
`requestAnimationFrame` is starved. Six hundred milliseconds elapse, the loop advances barely at all,
the canvas is unchanged, and the assertion fails. **Nothing about the game was wrong. The guard was
reading the wrong clock, and the load that exposed it was this project's own harness.**

It now samples the canvas on **consecutive animation frames**, taken inside the page. The browser's
rAF fires whether or not the game's loop is running, so two consecutive ticks bracket exactly one
opportunity to draw: if the simulation is advancing the canvas differs, and if it is stopped it does
not. Under load the ticks simply arrive slower, which changes how long the test takes and nothing
about what it says. Measured 5/5 in both directions.

## The first theory was wrong, and measuring is what killed it

Worth recording, because it was plausible and it was confidently held.

The suspicion was **aliasing**: auto-fire has a period of nine steps — 150ms — and the samples were
600ms apart, exactly four periods. On an opening screen that
[0043](0043-a-weapon-is-a-budget-and-a-level-opens-empty.md) had just emptied, the only thing moving
is a periodic bullet stream, so sampling at a multiple of its period would compare identical
pictures. Elegant, and it would have made the emptied opening the cause.

Driven sixty times, it produced **0 of 6 identical at 600ms**. The renderer interpolates between
steps by a wall-clock fraction ([0022](0022-frame-rate-is-a-feature.md)), so drawn positions never
quantise to the step and the picture is not periodic at all.

⚠️ **Had the fix gone in on the theory rather than on a measurement, it would have "worked"** — any
change to the sampling interval makes the symptom rarer — and the actual fault, a guard that cannot
survive its own harness, would still be there. That is the same shape
[0027](0027-measure-the-picture-not-the-model.md) refuses one level up: a mechanism that is correct,
plausible, and not the one in play.

## Why this is a rule and not a note

Because the escape is cheap and always available. Every intermittent failure has a rerun that passes,
and the rerun costs nothing and settles nothing. The two real answers — the code is intermittent, or
the guard measures the wrong quantity — both cost time, and the word "flaky" is what gets spent
instead of it.

[0005](0005-a-guard-must-be-seen-to-fail.md) already says a green guard is not evidence. This says an
*occasionally* green one is worse: it looks like evidence twice as often.

## Confirmed, not assumed

⚠️ **This decision has no probe, and the reason is not that it was skipped.** What it asserts is a
rule about how a human responds to a red test, and there is no file to break that would make the
suite refuse the sentence *"that was flaky"*. `tests/prove-guard.test.ts` requires a decision with a
confirmation table to have probes behind it or to **say why not**; this is the why.

What the change itself carries is a measurement rather than a probe: **5/5 all-identical while frozen
and 5/5 any-different while playing**, driven against the shipped page, and **171 guards seen failing
and green again** on the loaded run that produced the original failure.
