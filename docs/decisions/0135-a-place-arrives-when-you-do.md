# 0135 — A place arrives when you do, not up to 25 seconds later

**Accepted 2026-08-13.** [0133](0133-the-place-is-baked-at-the-boundary.md) made the game play a
place's own music. The first time anyone heard it, it arrived late.

> *"The start of level 2 sounded a bit like the default start, it should immediately pick into the new
> thematic track."*

## The rule

**A change of place lands on the next BAR.** `placeArrivesAt`, in `src/app/music.ts`. It was the next
**phrase**.

| | |
|---|---|
| a phrase | 25.6 s |
| a bar | **1.6 s** |

⚠️ **AND A LEVEL OPENS DELIBERATELY EMPTY**
([0043](0043-a-weapon-is-a-budget-and-a-level-opens-empty.md)), so the wait landed on exactly the
stretch with nothing else in it. What the player heard was level one's piece over level two's first
quiet minute — the one part of the level where the music is the only thing happening.

## ⚠️ 0128 chose the phrase, and its argument was about the wrong piece

> *"Swapping anywhere else restarts a sixteen-bar chord progression in the middle of itself."*

**True of the piece being replaced. False of the one arriving.** `swapTo` starts every source at
position zero, so the incoming place begins at its own bar one whenever the swap fires — the phrase
alignment was buying a tidy exit for material the player is leaving behind.

⚠️ **At a change of place, cutting the old piece is the POINT.** A level boundary is the one moment in
a run where *you are somewhere else now* is the thing to say.
[0117](0117-a-section-change-lands-on-the-beat.md) is kept whole — nothing lands mid-bar — and the
cost falls from a phrase to a bar.

⚠️ **`phaseTo`'s correction still waits for the phrase and must.** There the piece is not changing: a
re-phase is a repair nobody should hear ([0094](0094-in-time-is-not-in-phase.md)), so it waits for the
instant every layer is back at the top anyway. **Same mechanism, two clocks, and the difference is
whether the listener is meant to notice.** That distinction is the whole decision.

## ⚠️ It was invisible until a place had something of its own to arrive with

0128 and 0133 were both green and both correct about everything they measured. The defect needed
**three things at once**: a place with its own material (0132), the plumbing to deliver it (0133), and
a listener at the start of a level. No guard here could have found it, because until this week every
place played the same notes — a 25-second wait for identical audio is not a wait.

⚠️ **That is worth recording as a shape rather than as an incident.** A mechanism landed ahead of the
content that exercises it will pass every test it has and be wrong the first time it is used for real.

## What is guarded

`placeArrivesAt` is a function rather than four lines inside a closure over an `AudioContext`, on
`src/app/lifecycle.ts`'s own terms — the instant is the whole subject, and
[0005](0005-a-guard-must-be-seen-to-fail.md) cannot break what no test can reach.

| | |
|---|---|
| **a place is heard within a bar of the boundary** | ✅ asserted in SECONDS, over a spread of offsets — [0027](0027-measure-the-picture-not-the-model.md): *the next bar* is the model talking to itself, *how long am I still hearing the last level* is the report |
| and still lands ON a bar | ✅ the fix must not trade this defect for 0117's |
| and far enough ahead to be scheduled | ✅ a bar two milliseconds away cannot be started on |

⚠️ **`scripts/probes/0135-a-place-arrives.mjs` restores 0128's phrase swap** — the shipped defect, not
an invented one — and the guard was seen red.

⚠️ **`SCHEDULE_AHEAD` is exported for the guard**, because the bound is *a bar plus the scheduling
floor* and a `0.06` typed into the test would assert the old number the day this moves —
[0116](0116-the-rig-plays-the-level.md).

## Rollback

None owed — [0001](0001-revertability-not-risk-rating.md). One instant, computed per boundary; no
storage key, no save schema, no cache prefix.
