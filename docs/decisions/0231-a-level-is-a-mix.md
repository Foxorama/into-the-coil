# 0231 — A level is a mix of what shoots and what does not

**Accepted 2026-09-05.** The pacing item from the 2026-09-04 play-test.

> *"One of the big ones is the spacing of enemy waves, they're grouped up into non-firing and firing
> waves, so instead of a good mix, you get a bunch of enemies that don't shoot in a few waves, then a
> bunch of enemies that shoot in a few waves, then a bunch of enemies that don't shoot in a few
> waves etc."*

## ⚠️ Measured, and it was worse than the report

The longest run of one class, in waves, sorted by arrival:

| level | before | after |
|---|---|---|
| The Approach | 12 non-firing | 3 |
| the descent | 4 | 2 |
| coilward | 8 firing | 3 |
| the shoal | **17 non-firing** | 3 |
| the batteries | **29 firing** | 3 |
| the gauntlet | 3 | 2 |
| the eye | 3 | 2 |

Two causes, and the second is the one that matters. Every level was authored in stretches by kind —
*"one kind at a time, in shapes that read at a glance"* — so a stretch of weavers followed a stretch
of drifters. And **every firing kind has two or more hits of health and every non-firing kind has
one** (`src/content/enemies.ts`), so the shoal level, authored from chargers and drifters for speed,
could not have fired if its waves were shuffled any way at all: seventeen in a row is what its roster
allows.

## The rules

**No level sends more than `MIX_RUN` waves of one class in a row.** Three, in
`src/content/levels.ts`, and the play-test owns the number; `tests/mix.test.ts` holds it over every
level, sorted by arrival.

**The fix kept every wave's shape and every stretch's arrival distances.** Within each commented
stretch, the waves were reordered so the classes alternate and the stretch's own set of `at` values
reassigned in order — so the density, the sections and the pacing 0158 and 0040 argue for are exactly
where they were. Where a stretch was all one class, the wave that would run past three became the
LIGHTEST kind of the other class the level already sends: a drifter became a lancer, a turret a
drifter. 161 lines moved or changed; no wave was added or removed.

**The run-up is untouched, and it is the one stretch the guard skips.**
[0086](0086-the-teeth-wait-for-the-gun.md) forbids anything with more than one hit between the
second weapon pickup and the end of the run-up, and every firing kind has more than one — so that
stretch cannot fire, by a decision older than this one. Nothing in it was converted, and
`tests/mix.test.ts` resets its count on either side of it. The first draft of the fix converted a
drifter at 1710 to a lancer, 122 units after the pickup, and 0086's guard was what said so.

## ⚠️ What this changes about the levels, said plainly

The shoal level fires more than it did and the batteries level less. That is the report, applied:
*a good mix* is a claim about every level, and the two that had none were the two named by their
runs. Whether the batteries level still reads as *things that must be killed* with a drifter every
fourth wave is the next play-test's.

## What is owed

- **An eye on the two levels that changed most.** The shoal and the batteries.
- **A signature enemy per place will change these rosters again**, and the guard holds whatever it
  authors.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content only.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0231`:

| broken on purpose | went red |
|---|---|
| a level given a fourth non-firing wave in a row | `THE REPORTED ONE: no level sends more than MIX_RUN waves of one class in a row` |
| the budget raised to what the batteries level used to run | same |
