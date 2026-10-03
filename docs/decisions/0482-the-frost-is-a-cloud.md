# 0482 — The frost is a cloud

**Accepted 2026-10-04.** Item 6 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md),
its 10, from the play of that day:

> *"icicle burst fire rate is still too close together on ice boss and hydra boss - essentially it's
> still two cluster bombs really close together and rather than creating a navigable cloud of shrapnel,
> it creates either too much or it creates a non-event."*

## What it was

A frost shard ([0263](0263-the-frost-ship-shatters.md), [0371](0371-the-ice-is-staggered.md),
[0390](0390-a-dud-icicle-looks-like-one.md)) split after 38–56 steps into two bolts 0.6 rad apart; each
popped 36–48 steps later into six flakes flying at the shard's own speed, which melted 90 steps after
that. Two pops about 0.7 s and 20 units apart, then two rings racing out to 77 units: dense for a moment,
gone to the corners the next. The hydra's fourth head throws the same `frost`.

## The rule

**A fission stage may say how fast its children leave** — `pace`, a share of the row's speed, absent for
all of it. The frost's stages:

| stage | before | now |
|---|---|---|
| split | 38–56 steps, 2 bolts, 0.6 rad | **24–36 steps, 3 bolts, 1 rad** |
| ring | 36–48 steps later, 6 at the shard's speed | **60–72 later, 6 at 0.16 of it** |
| melt | 90 | **130** |

**The plan's numbers did not hold under arithmetic, and the intent was kept instead.** It proposed rings
at 0.4 of the speed and a ring fuse of 54–66, and called the result *"a second after the split, and a
cloud that grows to about 25 units across"*. At 0.4 a flake drifts about 0.34 a step and is 45 units out
at its melt — 90 across, not 25 — and 54 steps is under the second it promised. So the pace is solved for
the plan's own stated size — a cloud no more than a fifth of the lane in radius at its melt, held at the
tier where shots are fastest — and the fuse for its stated second.

**The first fuse is still narrower than the tightest stagger** (12 against Burn's 24), 0371's rule that
keeps two shards of a volley from opening on one step.

## Consider the screen

The clouds hang where they open instead of sweeping out across the lane, so there is more frost on the
screen at once and less of it reaching a ship that stands still:

| `weigh-threat hoarfrost`, median hits a second on a parked ship | before | after |
|---|---|---|
| pulse / arc / shuriken / ray | 0.81 / 0.65 / 0.69 / 0.74 | 0.52 / 0.37 / 0.39 / 0.51 |

Peak hostile shots over the Rime Shelf (`scripts/weigh-stuck.mjs`): **69 → 108**, against the 176 the
pool guard holds ([0479](0479-the-flame-slows.md) grew the pool to 200). The longest any shot is on the
screen there is 4.3 s, a flake of a cloud — inside [0474](0474-a-wave-keeps-its-heading.md)'s fifteen.

## Guards

`tests/frost.test.ts`, **THE REPORTED ONE, IN LANE UNITS AND SECONDS**: one wall driven at both ends of both
fuses, every shard through its split and its ring to its melt — **a shard's two bursts at least a second
apart**, and **every flake at its melt within a fifth of the lane of where its ring opened**.

Moved, because they held the old two-bolt split rather than their claims: *THE FISSION, DRIVEN* (the fan
is not one line — with three bolts the middle flies the shard's heading by construction, so the widest is
held), and the hydra's *every head's attack leaves its own mouth* (it read the first two shots in the air,
which are now a split shard's bolts; it reads the pair of shards at their first sighting).

Re-anchored: 0263's two probes and 0371's two on the new stages. 0270's *a shattering volley spending
the phase's count again* is aimed back at the pool guard: with the flakes hanging, the restored break
fills the pool again (200 of 200 on Burn) before the gentlest tier's room fails.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0482`:

| broken on purpose | went red |
|---|---|
| the snowflake at the shard's whole speed | `THE REPORTED ONE, IN LANE UNITS AND SECONDS` |
| the second burst under a second after the first | `THE REPORTED ONE, IN LANE UNITS AND SECONDS` |

## Owed

- **A play of the frost ship and the hydra's ice head**, for whether a hanging cloud reads as a field to
  thread. Its size and how long it hangs are `pace` and the melt, one row.
- **The escorts** (the plan's 5.2) still wait for a play of [0471](0471-the-cold-breathes.md).

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Content and one multiplication in the
frame; nothing persisted.
