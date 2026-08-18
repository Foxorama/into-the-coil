# 0166 — The level is solved as one trajectory

**Accepted 2026-08-18.** The fix
[`the-arrangement-holds-the-wrong-thing`](../../reports/the-arrangement-holds-the-wrong-thing-2026-08-17.md)
specified, with the half of it that measurement refused.

> *"The solved mix sounds a lot better, but it had the issues described above and needs some other
> work as well… the gain is changing drastically between boundaries and it makes the music jumpy when
> transitioning between run, surge, approach etc."*

## The rules

**A rung is not solved on its own.** `solveLevel` walks a level in order, each rung starting from the
gains the one before it left, with movement penalised. Every caller uses it; a per-rung loop is the
old solve wearing a new name.

**The penalty applies to every layer open on both sides, whatever its role does.** Not only to layers
whose role is unchanged.

**`HOLD_WEIGHT` is the largest weight that costs no audibility** — 0.40 — and it is a default under a
slider, not a setting.

**`calm` is solved alone.** The title screen is not inside a level's arc.

## ⚠️ The previous report's proposal does not work, and the reason is worth having

It specified continuity *"for any layer whose role has not changed and which is open on both sides"*,
on the measurement that **46 of the 57 lurches were role-unchanged**. Measured over all seven places:

| | worst in-level move | moves ≥6 dB |
|---|---|---|
| solve, per rung | 16.7 dB | 20 |
| role-held, w=0.40 | **18.1 dB** | 9 |
| role-held, w=0.80 | **17.3 dB** | 7 |

⚠️ **It halves the COUNT and never touches the WORST ONE.** Hold the crowd still and what is left is
the layers changing role — and those are the complaint, not the tail of it:

| place | boundary | layer | move | role |
|---|---|---|---|---|
| rime | `surge→approach` | **lead** | **−17.9 dB** | `part` → `counter` |
| saurian | `push→surge` | **ride** | **−13.4 dB** | `part` → `pulse` |

⚠️ **A ROLE CHANGE IS A 5 dB CHANGE OF TARGET PRODUCING AN 18 dB CHANGE OF GAIN**, because margin is
measured against the sum of everything else and that sum moves at the same instant. The previous
report considered ramping the handover and set it aside as *"eleven of them"*; after continuity takes
the other 46, those eleven are the whole of what is left.

## ⚠️ The cost, which is what was owed

That report says plainly: *"AND THE COST IS NOT YET MEASURED… That measurement is owed before the
change is judged, not after."* `node scripts/weigh-trajectory.mjs`, all seven places:

| | worst lurch | moves ≥6 dB | mean drift | adrift (0164) |
|---|---|---|---|---|
| shipped ladder | 1.8 dB | 0 | 4.50 | **91** |
| solve, per rung | 16.7 dB | 20 | 1.15 | 0 |
| **trajectory, w=0.40** | **11.2 dB** | **7** | **1.44** | **0** |
| trajectory, w=0.50 | 9.5 | 7 | 1.59 | 3 |
| trajectory, w=0.65 | 7.0 | 1 | 1.87 | 12 |
| trajectory, w=0.80 | 4.8 | 0 | 2.23 | 24 |

⚠️ **0.40 DOMINATES THE SHIPPING SOLVE ON EVERY AXIS AND COSTS NOTHING.** The worst move falls from
16.7 dB to 11.2, the big moves from 20 to 7, and **not one layer goes under
[0164](0164-a-role-is-a-promise-the-mix-has-to-keep.md)'s floor**. It is the largest weight at which
that is still true — 0.42 puts two under — so the default is the **edge of free**, measured to two
decimal places rather than chosen. A guard holds both halves.

⚠️ **THE *CLAIM BEING SPENT* IS SMALLER THAN IT LOOKED.** The per-rung solve is described as reaching
every role target *"to 0.00 dB"*, and per rung it does — but across seven places its mean distance
from target is already **1.15 dB**, because the aura is not solved and grows every rung. Continuity at
0.40 takes that to 1.44. **The trade is a quarter of a decibel of mean drift for 5.5 dB of lurch.**

## ⚠️ Past the default there is no knee, so the weight is a slider

Every decibel of steadiness bought after 0.40 costs audibility, smoothly, with nothing in the curve a
measurement can point at. That is precisely the shape of question
[0126](0126-the-dashboard-is-the-instrument.md) exists for, and
[0129](0129-the-desk-holds-a-value-not-a-multiplier.md)'s own lesson: a mix answer found by dragging
is worth more than one argued into a file. The desk has a **steady** slider beside the solved-mix
toggle; the default is what a measurement can defend and the rest is an ear's.

⚠️ **It re-solves on `change` and not on `input`.** A solve is about 400 ms a place; the obvious
wiring would recompute forty times during a drag and lock the page.

## What this is not

⚠️ **It still does not ship.** `MUSIC_LADDER × mixOf` decides every gain the player hears; this is a
dashboard toggle, as [0154](0154-the-mix-is-authored-as-intent.md)'s arrangement has been throughout.
Replacing the ladder is the next decision and it wants an ear on the weight first.

⚠️ **The two role handovers are NOT fixed, and a smaller move is the wrong fix for them.** rime's
`lead` and saurian's `ride` are the largest moves at any weight, because a place genuinely does hand
its lead over there — [0155](0155-a-place-follows-its-own-instrument.md). What is owed is a **longer
ramp for a role change**: 12 dB over 1.6 s is a step and over 6 s is a swell. `RAMP_SECONDS` is in
`src/app/music.ts` and is the shipped game, so a change to an instrument does not touch it.

⚠️ **`approach → boss` is excluded from every figure here.** That boundary is the boss arriving, the
shipped ladder moves the aura 7.1 dB there on purpose (0091), and the previous report leaves it
deliberately open. Flattening an event nobody complained about would be answering the wrong report.

## ⚠️ The guard set was wrong first, and `prove` is what said so

The first three guards were *the chain is real*, *the default costs nothing*, and *the default is at
the edge of free*. A probe applying the previous report's own proposal — role-held continuity —
reported **STILL GREEN**: all three pass under it, because it converges, costs nothing at 0.40, and
differs from a cold solve. **What no assertion said was that a boundary gets quieter, which is the
entire decision.**

⚠️ **[0005](0005-a-guard-must-be-seen-to-fail.md) paid for itself here.** The missing guard is written
against the solve it replaces rather than against a decibel: *the trajectory's worst in-level move is
smaller than the per-rung solve's, in every place*. Nothing to widen, and it moves when the material
does.

## Confirmed, not assumed

- Every figure from `scripts/weigh-trajectory.mjs` over all seven places at `main` ef5d41f;
  [`what-continuity-costs`](../../reports/what-continuity-costs-2026-08-18.md) has the full curve.
- The guard, the dashboard and all three scripts call one `solveLevel` — 0029.
- `npm run check` clean.
- Three probes, seen red, trees restored: `node scripts/prove-guard.mjs 0166`.

| broken on purpose | went red |
|---|---|
| the chain cut, so every rung solves from cold again and the trajectory is a per-rung solve | `0166 — AND A WEIGHT OF ZERO IS THE SOLVE THAT SHIPPED, so the chain is real rather than decorative` |
| the hold applied only where the role is unchanged, which is the previous report's own proposal | `0166 — THE TRAJECTORY MOVES A BOUNDARY LESS THAN THE PER-RUNG SOLVE DOES, in every place` |
| the default hold weight raised past the point where it starts costing audibility | `0166 — THE SHIPPED HOLD WEIGHT COSTS NO AUDIBILITY, and a heavier one would` |
