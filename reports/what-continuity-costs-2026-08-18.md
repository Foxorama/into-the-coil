# What continuity costs — the trade the solve was never given

**2026-08-18.** The measurement
[`the-arrangement-holds-the-wrong-thing`](the-arrangement-holds-the-wrong-thing-2026-08-17.md) said
was owed: *"Holding gain continuous means margin drifts off target, and by how much is exactly the
number that decides whether this is the right trade… That measurement is owed before the change is
judged, not after."*

> *"The solved mix sounds a lot better, but it had the issues described above and needs some other
> work as well… the gain is changing drastically between boundaries and it makes the music jumpy when
> transitioning between run, surge, approach etc."*

## How to read it

`node scripts/weigh-trajectory.mjs`. Four numbers per candidate mix, over all seven places:

- **worst lurch** — the largest single-layer gain change at an **in-level** boundary
  (`run→push`, `push→surge`, `surge→approach`), in dB, counting only layers open on both sides.
  `approach→boss` is excluded: that one is the boss arriving and is *supposed* to move.
- **moves ≥6 dB** — how many such changes there are, across all seven places.
- **mean drift** — how far the solved margins land from `ROLE_MARGIN_DB`, averaged. **This is the
  cost.** The independent solve's claim was *every role target reached to 0.00 dB*, and that claim is
  what continuity spends.
- **adrift** — how many place/rung/layer triples [0164](../docs/decisions/0164-a-role-is-a-promise-the-mix-has-to-keep.md)'s
  floor would still flag. The shipped ladder scores 91; this is the audibility the whole exercise is
  for.

⚠️ **The shipped ladder reads 1.8 dB here and 2.3–3.1 in the previous report**, and neither is wrong:
that one counted the aura and the boss boundary, this one counts neither. The comparison that matters
is between the columns, all measured the same way.

## ⚠️ The finding: the proposed fix does not work, and the reason is instructive

The previous report specified continuity *"for any layer whose role has not changed and which is open
on both sides"*, having measured that **46 of the 57 lurches happen with the role unchanged.**

| | worst lurch | moves ≥6 dB | mean drift | adrift |
|---|---|---|---|---|
| shipped ladder | 1.8 dB | 0 | 4.50 | **91** |
| solve, per rung — today’s toggle | **16.7 dB** | 20 | 1.15 | 0 |
| role-held, w=0.40 | **18.1 dB** | 9 | 1.41 | 0 |
| role-held, w=0.80 | **17.3 dB** | 7 | 1.95 | 16 |

⚠️ **It halves the COUNT and does not touch the WORST ONE.** 20 big moves become 9, and the largest
stays at 17–18 dB at every weight — because holding the role-unchanged layers still leaves the
role-*changed* ones free, and once the crowd is quiet those are the whole complaint.

Of the moves still ≥6 dB after role-held continuity, **6 change role and 4 do not**. The two worst:

| place | boundary | layer | move | role |
|---|---|---|---|---|
| rime | `surge→approach` | **lead** | **−17.9 dB** | `part` → `counter` |
| saurian | `push→surge` | **ride** | **−13.4 dB** | `part` → `pulse` |

⚠️ **A role change is a 5 dB change of TARGET producing an 18 dB change of GAIN**, because margin is
measured against the sum of everything else and that sum changes at the same instant. The previous
report considered ramping the handover and set it aside as addressing *"eleven of them"*. After
continuity handles the other 46, those eleven are what is left.

## ⚠️ Applying continuity through role changes is what works, and one point on the curve is free

| | worst lurch | moves ≥6 dB | mean drift | adrift |
|---|---|---|---|---|
| solve, per rung | 16.7 dB | 20 | 1.15 | 0 |
| **trajectory, w=0.40** | **11.2 dB** | **7** | **1.44** | **0** |
| trajectory, w=0.50 | 9.5 | 7 | 1.59 | 3 |
| trajectory, w=0.60 | 7.8 | 3 | 1.77 | 10 |
| trajectory, w=0.65 | 7.0 | 1 | 1.87 | 12 |
| trajectory, w=0.75 | 5.5 | 0 | 2.10 | 15 |
| trajectory, w=0.80 | 4.8 | 0 | 2.23 | 24 |

⚠️ **`w = 0.40` DOMINATES THE SHIPPING SOLVE ON EVERY AXIS AT NO COST.** The worst lurch falls from
16.7 dB to 11.2, the ≥6 dB moves from 20 to 7, and **not one layer goes adrift** — 0.40 is the largest
weight at which that is still true, measured to two decimal places (0.42 puts two layers under).
It is the default for that reason rather than by taste.

⚠️ **AND PAST IT THE TRADE IS REAL AND IS AN EAR'S TO MAKE.** Every decibel of lurch bought after 0.40
costs audibility: w=0.65 is a 7.0 dB worst move and twelve layers back under 0164's floor. There is no
knee in the curve, so there is nothing for a measurement to choose — which is why the weight is a
slider on the dashboard rather than a constant in a file, on
[0126](../docs/decisions/0126-the-dashboard-is-the-instrument.md)'s own terms.

## What is fixed here, and what is not

**Not fixed: the two role handovers.** rime's `lead` and saurian's `ride` are still the largest moves
at any weight, because a place genuinely does hand its lead over there —
[0155](../docs/decisions/0155-a-place-follows-its-own-instrument.md). What is owed is a **longer ramp
for a role change**, not a smaller move: 12 dB over 1.6 s is a step and over 6 s is a swell.
`RAMP_SECONDS` lives in `src/app/music.ts` and is the shipped game, so it is deliberately not touched
by a change to an instrument.

**Not fixed: the mix still does not ship.** `MUSIC_LADDER × mixOf` decides every gain the player
hears; this is still a dashboard toggle. Replacing it is the next decision and it wants an ear on the
weight first.

## ⚠️ And the guard set was wrong first, which `prove` said and nothing else could

The first three guards written for this decision were: *the chain is real*, *the default costs no
audibility*, and *the default is at the edge of free*. `npm run prove` applied the previous report's
own proposal — continuity for role-unchanged layers only — and reported **STILL GREEN**.

⚠️ **All three pass under it.** It converges, it costs nothing at 0.40, and it differs from a cold
solve. What it does not do is make a boundary quieter, which is the entire decision — and no
assertion said so. [0005](../docs/decisions/0005-a-guard-must-be-seen-to-fail.md) is the rule and
this is what it looks like when it pays: the missing guard is now
`0166 — THE TRAJECTORY MOVES A BOUNDARY LESS THAN THE PER-RUNG SOLVE DOES`, written against the solve
it replaces rather than against a decibel somebody chose.

## Confirmed, not assumed

- Every figure from `node scripts/weigh-trajectory.mjs`, over all seven places, at `main` ef5d41f.
  The guard in `tests/themes.test.ts` and the dashboard both call the same `solveLevel`, so a printed
  figure cannot disagree with an asserted one — [0029](../docs/decisions/0029-the-tracked-record-is-the-record.md).
- The floor the **adrift** column counts against is
  [0164](../docs/decisions/0164-a-role-is-a-promise-the-mix-has-to-keep.md)'s, derived from
  `ROLE_MARGIN_DB`'s widest adjacent step.
- `w = 0.40` is the edge of free measured to two decimal places: 0.40 flags nothing, 0.42 flags two.
  A guard asserts both halves.
- Three probes, seen red, trees restored: `node scripts/prove-guard.mjs 0166`.
