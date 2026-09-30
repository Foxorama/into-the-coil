# 0420 — The CI is sharded, and the required job joins it

**Accepted 2026-09-30.** The second of three changes toward a CI run under ten minutes, ideally under
five. **Amends [0419](0419-the-baseline-is-the-suites-own-run.md)**: the proof's baseline is still the
suite's own sealed run, but it is now read by the join over every suite shard at once, and the
single-job path 0419 added to `main()` is gone. **Takes the option
[0115](0115-a-probe-runs-its-own-guard.md) refused *"in this decision rather than for ever"*** —
sharding across runner jobs — because the cost that refusal named does not have to be paid.

## The rule

**The suite and the probes are dealt across runner jobs, and the required context `test` is a job
that waits on all of them and joins what they report.**

| job | what it does |
|---|---|
| `base` | 0033's stacked-PR check, alone; every job that installs `needs` it |
| `typecheck` | `npm run build` — `tsc` with `noEmit`, then the shipped page |
| `suite` ×6 | `vitest --shard`, sealed first, report kept |
| `prove` ×10 | every tenth probe of the whole set, sealed first, result kept |
| **`test`** | `if: always()`, `needs` every other job, and `node scripts/prove-guard.mjs --join` |

**The join is the verdict.** It fails unless every job succeeded, every job sealed the tree the join
is standing in, every test file ran in some suite shard, every suite a probe judges was green, every
probe ran in some probe shard, and every probe shard saw all of its guards go red.

## Why 0115's refusal does not apply

0115: *"it needs a matrix, which means new required contexts, which means a branch protection
change."* It needs a matrix; it does not need a new required context. **The required context is a
job key, and `test` stays one** — so branch protection is untouched and
[0004](0004-admin-settings-must-be-read-back.md) has nothing to read back.

## ⚠️ The trap, and it is the whole of the risk

**A job whose dependency failed is SKIPPED, and GitHub reports a skipped required check as
PASSING.** Written the obvious way — `test: needs: [suite, prove]` — one red shard skips `test`, and
the PR merges green. `!cancelled()` does not close it: a cancelled run skips `test` too, and the head
reads green. So `test` runs `if: always()` and reads every dependency's result itself, and a skipped
or cancelled dependency is a failure there.

⚠️ **The skipped-reads-as-passing half is GitHub's documented behaviour for required checks, not
something observed in this repository** — watching it would mean merging a red. The guard does not
depend on it being true: `always()` plus a join that fails on anything but `success` is correct
whether a skipped check passes or blocks.

Three guards hold the workflow's half in `tests/shards.test.ts`, and three probes break it. The
join's half is `joinProblems`, a pure function, held in `tests/prove-guard.test.ts`.

## The baseline, taken after

0054's baseline makes a probe's red attributable: *a break cannot be shown to have caused a failure
that was there first.* In one job it ran before the probes. Across jobs it cannot — the suite is
running beside them — so the join establishes it afterwards, over every suite shard's report, on
bytes sealed equal to the probe shards'. **A red is exactly as attributable either way**: the claim
is that the suite was green on the same bytes the break was applied to, and nothing about it depends
on the order. What *before* bought was a clear failure forty seconds in rather than at the end, and
the suite shards now fail in minutes on their own.

⚠️ **So a probe shard has no baseline of its own, and says so.** It reads `PROVE_SHARD` and
`PROVE_RESULT` together or refuses; its result is read by nothing but the join.

## Dealt, not cut

A shard takes every tenth probe rather than a tenth of the list in a run. A decision's probes sit
together in the set and the expensive ones arrive a decision at a time — six on the 0149 hull guard,
four on the clip guard — so cutting would put all six on one shard and make it the long one.

## What was rejected

**Shards in a matrix and no join — `test` merely `needs` them.** The trap above, exactly.

**Probe shards that wait for the suite (`needs: suite`) and read its reports, as 0419 did in one
job.** It keeps the baseline first, and it puts the suite's length in front of the proof's: two
long poles in series. The join makes the same claim with them side by side.

**Hand-sized shard counts spelled twice.** The matrix list is the count, and the step reads it back
as `strategy.job-total`; the join refuses any run where a file or a probe went unrun, so a hole in
either partition cannot pass.

**Per-job `timeout-minutes`.** A job's limit is a wall-clock budget, and
[0245](0245-a-budget-is-sized-under-load.md) sizes one from a measurement under load. No shard has
been measured yet; this PR's own run is the first measurement, and the limits follow it.

## What it costs, and what is still long

Seventeen more runner jobs a PR, each paying ~20 s of checkout and install. The repository is public
and standard runners are free for it; twenty concurrent jobs is the plan's limit, and this uses
nineteen.

⚠️ **The floor is now the longest single piece of work, not the sum.** On #445's run the longest
file was `tests/sound.test.ts` at 270 s and the longest test the 0149 hull guard at 169 s — **which
now times out locally at 345 s under the suite, and takes 89 s alone where its budget was sized at
26.7 s.** Splitting the long files and making that guard cheaper is the third change, and it is what
decides whether this lands under five minutes or under ten.

## Confirmed, not assumed

Probes in `scripts/probes/0420-the-ci-is-sharded-and-joined.mjs`; 0033's ordering probe is re-aimed
to the new shape (a job that installs without waiting for the check).

| broken on purpose | went red |
|---|---|
| the required job left to be skipped when a shard fails, which GitHub reports as passing | `THE TRAP: it always runs` |
| the required job not waiting on the probe shards, so a probe that stays green is never heard | `and it waits on every other job` |
| the join handed nothing of what the jobs did, so it can only agree | `and it JOINS them` |
| the first probe of the set dealt to no shard | `THE PARTITION: the shards together are every probe` |
| the set cut into runs rather than dealt, so a decision’s expensive probes share one shard | `DEALT, NOT CUT` |
| only a FAILED dependency counted, so a skipped or cancelled one joins as a success | `THE TRAP, READ: a SKIPPED dependency is not a successful one` |
| an empty list of dependencies joined as if every one had succeeded | `and a join that waited on nothing has joined nothing` |
| a job sealed to other bytes joined, so its green is some other tree’s | `A TREE THAT IS NOT THIS ONE` |
| the suite shards trusted to cover every file, so a hole in the partition is a file never run | `A HOLE IN THE PARTITION` |
| the baseline taken after and then ignored, so a red over an already-red suite proves itself | `THE BASELINE, AFTER` |
| the probe shards trusted to cover the set, so a probe dealt to no one is a guard never broken | `A PROBE NO SHARD RAN is named` |
| a probe shard’s own verdict not read, so one that saw a guard stay green joins as proven | `and a shard that came back without every guard red fails the join` |

⚠️ **Not probed: a shard's `ok` counting its reds against the probes it was dealt**, which is a line
inside `main()` rather than a pure function — 0054's owed item, the same shape again. A shard that
drops a probe before the loop is still caught by the join, which counts keys, not `ok`.

⚠️ **The join has only run locally against an empty directory**, where it refused with every problem
it should have named. **Its first real run is this PR's CI**, and a join that has never passed on a
real run is not known to pass — the PR carries that run.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). The workflow, `scripts/`, `tests/`
and documents. Branch protection is untouched, since the required context is still the job key
`test`.
