# 0157 — The prewarm was scheduled one note at a time, and a press paid for all of it

**Accepted 2026-08-17.** Found while establishing what the 4.6 seconds between pressing Start and the
playing HUD actually was. Four hypotheses were measured and killed before this one; the answer is not
in the music, the art or the renderer.

> `waited 0ms → start→HUD 4609ms` · `waited 6000ms → 4564ms` · `waited 20000ms → 80ms`

## The rules

**A prewarm slice is a time budget, not a job.** `PREWARM_SLICE_MS` is 8 — under a frame, and the
yield after it is what a browser clamps. The jobs and their order are untouched, so the samples are
identical.

**A gesture FINISHES a prewarm in flight rather than starting again.** `drainPrewarm` runs what is
left, synchronously, and hands over the set the prewarm would have finished with.

## What it cost, measured

| when the player presses | before | after |
|---|---|---|
| immediately | 4609 ms | 4347 ms |
| after 2 s | 4504 ms | **2971 ms** |
| **after 6 s** — a player who reads the title | 4564 ms | **277 ms** |
| after 20 s | 80 ms | 82 ms |

**Sixteen times faster for the case that is almost every player**, and the cost now decays as the
prewarm progresses instead of being flat.

## ⚠️ Two defects, and the second is the one a player feels

**The schedule.** `prewarmAudio` ran **one job per `setTimeout(run, 0)`**. A browser clamps a nested
timeout to about 4 ms, and there are roughly 3,000 jobs — so **3.6 seconds of synthesis took 12–20
seconds of wall clock**, and used about 4% of the main thread doing it. The window in which a press is
expensive was four times longer than the work.

**The flag.** `prewarmed` is assigned by the **last** job. The gesture path read
`prewarmed?.cues ?? bakeCues(…)`, so a press with nine tenths of the set already synthesised read as
*not started* and **re-synthesised all of it**. That is the 4,556 ms.

⚠️ **The two compound, and only together do they explain the measurement.** The schedule made the
window long enough that essentially every player landed inside it; the flag made landing inside it
cost the whole bake rather than the remainder.

## ⚠️ How it was found, because four wrong answers came first

A constant 4.6 s that did not move when the player waited longer. Each of these was measured and
killed:

| hypothesis | killed by |
|---|---|
| the place bake ([0133](0133-the-place-is-baked-at-the-boundary.md)) | stubbed it — **4566 ms** |
| the prewarm being unfinished | stubbed it — **4567 ms** (and this *introduced* a confound: no prewarm forces the cold path) |
| the nebula bake ([0112](0112-the-sky-has-weather.md)) | stubbed it — **4566 ms** |
| a headless rendering artefact | headful, GPU-backed — **4699 ms** |

What found it was **marking the keydown listener itself**: pressed at 6123 ms, the listener fired at
10798 ms. The event was not being delivered, which means the main thread was blocked — and a
`requestAnimationFrame` gap recorder around the press showed **one 4556 ms gap** starting at the press.
A block *at* the gesture, not before it.

⚠️ **`begin` is synchronous** — dispatch, `enterLevel`, show `playing` — and the HUD class landed 10 ms
after the handler ran. So none of the 4.6 s was the game changing screens, which is where three of the
four hypotheses had been looking.

## What was rejected

**Widening the browser guards' timeouts.** `tests/menu.browser.test.ts` allows 10 s and was
intermittently failing on CI; two of three PRs went red on it, including one that changed nothing but
documentation. Raising it would have hidden a **4.6 second freeze that every player was getting**.

**Making the prewarm smaller.** The synthesis is not the defect — 3.6 s of it is what the score costs,
and [`the-prewarm-got-a-third-heavier`](../../reports/the-prewarm-got-a-third-heavier-2026-08-17.md)
is the separate question of whether that number is right. What was wrong was spending four times it in
wall clock and then throwing the result away.

## ⚠️ What is still true, and is now the honest case for a loading screen

**Pressing instantly still costs 4.3 s**, and it always will: the audio cannot play before it has been
synthesised. That is the case a loading state covers, and it is now a real wait for a real reason
rather than a freeze hiding a scheduling bug — which is what the player already had in mind:
*"I'd been meaning to address it with a loading screen or something."*

## Confirmed, not assumed

- `node scripts/prove-guard.mjs 0157` — **2 of 2 red**. The first probe restores the one-job schedule;
  the second stops the drain, which is exactly what shipped.
- `tests/sound.test.ts` **76/76**, including 0102's *prewarmed and cold bakes are the same samples* —
  the property the drain must not break, and the drained set is compared to the fully-prewarmed one
  sample for sample as well.
- Every timing above is from the built `dist/index.html` the browser tests use, five runs per figure.

## Rollback

One source file, one test file, one probe. No storage key, save schema, SW cache prefix or origin —
[0001](0001-revertability-not-risk-rating.md).
