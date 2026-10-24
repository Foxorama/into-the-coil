# 0649 — The streak ticks down

**Accepted 2026-10-24.** From [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), item 7.
Amends [0647](0647-the-streak-is-kept-by-hitting.md): what the quiet does when it runs out.

## The ask

> *"Point decay should be 3 sec, + then it ticks down per sec till a hit happens."*

## What was wrong

0647 ended the streak whole after three seconds with nothing landing: ×8 to ×1 in one step, for one lull.

## The rule

**Three seconds with nothing landing takes the multiplier down one step, and every second after that
takes another, until something lands or it is ×1.**

- *"Ticks down"* is read as **the multiplier**, the number the readout shows and the page calls the score
  counter, and not the kill count under it: a kill a second would take ten seconds to lose one step.
- A step down puts the streak at **the first kill of the step below** (`streakStepDown`,
  `src/content/score.ts`), so the next kill climbs from there. A streak past the cap comes down from the
  cap: ×8 is followed by ×7, however many kills it had past the kill that reached ×8.
- **What a landing is, what stops the clock and what starts it again are 0647's**, unchanged. A landing
  puts the clock back at once; nothing earned back is given back.
- `STREAK_DECAY_SECONDS` is the second, a play number beside 0647's three.

## What guards it

`tests/score.test.ts`:

- **Through the real frame**: ×5 holds for three seconds, is ×4 on the step they run out, holds a second,
  is ×3, reaches ×1 two seconds later and stays there. The probe breaks it two ways: the whole streak gone
  at once, as 0647 had it, and one step taken and no more.
- **The arithmetic**: a step down is one multiplier lower at every streak to twelve steps, never below ×1.

The probes are in `scripts/probes/0649-the-streak-ticks-down.mjs`. 0647's own probe of a clock that only a
kill puts back is re-anchored onto the renamed test.

## Not held by any guard

- **A second.** Whether ×8 falling to ×1 in ten seconds of quiet is a cost a player feels is the play's.
- **The readout says nothing while it falls.** 0647 named that as the next change if a falling streak needs
  to be seen before it falls; with a step a second it is seen as it falls, which may be enough.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)): the streak is a frame count, never stored.
