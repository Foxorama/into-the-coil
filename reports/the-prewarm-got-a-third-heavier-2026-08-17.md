# The prewarm got a third heavier, and a browser guard is what said so

**2026-08-17.** Measured while establishing whether a CI failure on
[PR #201](https://github.com/Foxorama/into-the-coil/pull/201) was a flake. It was not.

## What failed

`tests/layout.browser.test.ts` → *keeps its first line on the display and its last control one scroll
away*, on CI only:

> `a wheel over the screen scrolled nothing — the rest of it cannot be reached: expected 0 to be
> greater than 0`

**8/8 locally, every time.** [0044](../docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)
says a rerun is not evidence and that the job is to establish which it is. The fourteen CI runs before
this branch were green, and the only two failures in the window are both on this branch — the other
one was the 0108 probe, a different test entirely.

## The measurement

`src/app/mount.ts:544` calls `prewarmAudio()` **at boot, with no gesture**. So a title screen — the
screen this guard measures — is synthesising audio in `setTimeout` chunks for its first few seconds,
on the main thread, while the test dispatches a wheel and sleeps 200 ms.

`bakeLoops(SAMPLE_RATE)`, five runs each, same machine, same node:

| tree | median | min | max | resident samples |
|---|---|---|---|---|
| `main` (8cfa7ae) | **2740 ms** | 2714 | 2786 | 12.00 M |
| the material pass | **3609 ms** | 3582 | 3634 | 12.00 M |

**+869 ms, or 32%.** Not more audio — the same 12.00 M samples. The envelope repairs lengthen notes
(`hook` alone goes from about 12 ms of ring to 110), and a longer note is more samples to filter and
shape inside the same buffer.

## What was done about it

**The guard's quantity was repaired, not its timeout.** It now waits for the scroll with a 5 s
deadline instead of sleeping 200 ms. The claim was always *the container scrolls*; wall clock was
standing in for it. `node scripts/prove-guard.mjs 0049` is **4 of 4 red**, including *the overlay
stopped scrolling* — so the repair is not vacuous.

**The 32% was not acted on**, and that is deliberate. Three reasons:

1. **The per-job ceiling still holds.** `tests/sound.test.ts` → *the whole set is small enough to
   spread across the title screen* guards the **longest single note** at under 3 s, because the
   prewarm yields between notes and a job longer than a frame is the hitch. That is green, and it is
   the quantity 0113 moved it to on purpose.
2. **Nothing has ever guarded the total**, and the same test says so in its own words — *"the budget
   did not disappear, it moved"*. Adding a ceiling to the total is a decision, not a fix, and it wants
   a number argued rather than the one this branch happens to produce.
3. **The material change is the point of the branch.** It takes the worst solved multiplier in the
   game from 16.67× to 3.46×. Trading it back for boot time is a product call.

## ⚠️ What is owed

**What the extra 869 ms actually costs a player is not measured.** The prewarm exists so the first
press does not hitch; a longer prewarm means a longer window in which a press takes the cold path
instead. Nobody has measured how often a real player presses inside that window, on this machine or
any other — and CI is not the target machine
([0025](../docs/decisions/0025-the-frame-budget-is-counted-not-timed.md)).

**The cheapest next move is to measure the window, not to cap the total.** How long after boot does
the prewarm finish on a desktop, and how long does a title screen actually sit there before someone
presses? Those two numbers decide whether 3.6 s is a problem at all.
