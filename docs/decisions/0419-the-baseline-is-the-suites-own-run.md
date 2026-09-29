# 0419 — The baseline is the suite's own run, when it can be shown to be

**Accepted 2026-09-30.** Extends [0054](0054-the-proof-runs-beside-the-work-not-on-it.md), whose
baseline gate is unchanged in what it asks; what moves is who answers it in CI. The first of three
changes toward a CI run under ten minutes, and ideally under five:

> *"our CI pipeline is ridiculously slow for a project of this size. How do we get it from where it is
> to sub-5minutes without sacrificing any quality?"* — and then: *"our new margin can be 10mins, let's
> be ambitious … under 5mins is ideal, not the end target of the project."*

## The rule

**In CI, `npm run prove` reads its baseline from the run `npm run check` already made**, and only
when that run can be shown to be the baseline:

| the report must be | because otherwise |
|---|---|
| **sealed to these bytes** — the tree's hash taken before the suite ran equals the tree's hash now | its green is some other tree's |
| **a run of every suite the proof judges** | a suite it never ran is a baseline never made |
| **every test in those suites passed or failed** — none skipped | a `-t` or `--shard` run skips what it did not ask, and skipped is not green |
| **a suite that threw before its first test counts as failed** | it carries no tests, so counting tests alone reads it as green |

Anything else is **refused, not run the long way**: a proof that meant to reuse a run and cannot show
which one has found something. Outside CI nothing changes — `prove` runs its own baseline as before.

## What CI was spending, measured

The last green run before this one, [#445](https://github.com/Foxorama/into-the-coil/pull/445),
4-vCPU runner:

| step | wall clock |
|---|---|
| checkout, node, `npm ci`, base check | 0.2 min |
| `npm run check` — 127 files, 1,794 tests | **13.8 min** |
| `prove`: baseline — 122 of those same files, same bytes, one minute later | **13.4 min** |
| `prove`: 1,612 probes on 3 workers | **34.1 min** |

⚠️ **A QUARTER OF CI WAS ONE QUESTION ASKED TWICE.** 0054 added the baseline for the machine it was
built on, where nothing has asked the suite about the tree yet. In CI, `check` has, one step earlier,
in the same checkout, and a red there stops the job before `prove` starts.

## Why the seal, when CI's checkout cannot change between two steps

Because the claim *the tree cannot change* was unverified, and it is the one that would make this
wrong. `npm run check` writes `dist/`; a test could write beside itself; a config could start emitting
a build-info file. Any of those between the seal and the proof would make the report describe other
bytes, so the proof hashes the tree again with `drift`'s own `manifest` — the same view the restore
check already trusts, `node_modules`, `dist` and `.git` out — and refuses on any difference.
**Measured on this machine: seal, then a full `npm run check`, then the proof — the seals agree** (the
run is below).

## Found on the way: a guard that slept on the clock

The first end-to-end run of this change went red in `npm run check`, on a test it does not touch:
`tests/intro.browser.test.ts` — *"Feather was picked and her cap is not in the intro: expected 0 to be
greater than 10"*. Alone it passed three times in three.
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md): that is not flaky, it is a wrong
quantity. The test slept to the middle of the pilot's run **as the beats place it at sixty steps a
second** — 9.8 s after the pick — and read the canvas once. Under the whole suite the loop falls
behind real time and the read lands on an empty deck.

⚠️ **Measured before it was changed**, over two whole intros sampled every 150 ms: Feather's teal and
Bo's violet are **0 px for the whole intro unless that golfer was picked**, and 106 and 126 px at
most while they run, from about 8.9 s to 11.1 s. **The window the sleep had to land in is 2.2 s
wide.** (Larry's amber is *not* unique — 14 to 25 px elsewhere — and is not used.)

So it now waits for **either** cap to be drawn and reads both on that same frame: the picked one must
be there and the other must not. The moment is the picture's rather than the clock's, the handover's
budget bounds it, and a break that draws the wrong golfer resolves as soon as that golfer appears
rather than when the wait runs out. It is a stronger claim than the one it replaces — the old one
read a single instant it could not guarantee was during the run.

## What was rejected

**Dropping the baseline in CI outright**, on the argument that `check` runs first and a red there
fails the job. True today, and it leaves the proof trusting a workflow's step order it cannot see —
the next reordering, or a `continue-on-error`, would make every probe over a red suite a vacuous pass
with nothing to say so. The sealed report costs a hash and says so.

**Having `prove` run the whole suite as its baseline and dropping `npm test` from `check`.** The same
saving, and `prove`'s runs capture their output — the advisory claims in `tests/authored.ts` would stop
being printed on every run, which [0192](0192-a-guard-holds-an-invariant.md) requires.

**Binding the report by file modification times.** No extra step, and it is a model of the bytes
rather than the bytes; the hash is what `drift` already uses.

## What is next, and is not this decision

**Sharding across runner jobs**, which [0115](0115-a-probe-runs-its-own-guard.md) refused *"in this
decision rather than for ever"* because new jobs mean new required contexts. They need not: the
required context can stay `test` as a job that waits on the shards. ⚠️ **Its trap is that a job whose
dependency failed is SKIPPED, and a skipped required check reports success** — so it runs `if:
always()` and reads every dependency's result itself, with a guard and a probe on exactly that.

**Then the long single tests**, which set the floor any sharding reaches: the 0149 hull guard at 169 s
and six probes, the clip guard at 132 s and four, `tests/authored.test.ts`'s one test at 150 s, and
five files that run for over three minutes on one worker each. [0344](0344-a-probe-runs-warm.md)
already names them as owed.

## Confirmed, not assumed

Probes in `scripts/probes/0419-the-baseline-is-the-suites-own-run.mjs`; the guards are in
`tests/prove-guard.test.ts`.

| broken on purpose | went red |
|---|---|
| a report sealed to other bytes accepted, so a green somebody else earned becomes this tree’s | `THE SEAL: a report of other bytes is refused` |
| the seal taken over the file names alone, so an edited file seals as the tree it was | `and the seal is of the bytes, not only the names` |
| no report at all read as a baseline with nothing failed | `and a report with no seal is refused` |
| a suite the report never ran passed over, so a probe over it is judged against no baseline at all | `A SUITE THE REPORT NEVER RAN is a baseline never made` |
| a skipped test read as a passed one, so a filtered run seals a guard it never asked | `SKIPPED IS NOT GREEN` |
| a suite that threw before its first test counted by its tests, which are none, so it reads as green | `THE ONE WITH NO TESTS: a suite that threw before any test ran is a failure` |

⚠️ **Not probed: that `PROVE_BASELINE` and `PROVE_SEAL` go together**, which is a branch inside
`main` rather than a pure function — 0054's own owed item, the same shape. One without the other is
refused before anything runs; the evidence is the run below rather than a probe.

⚠️ **No probe breaks the speed**, for 0115's reason. The wall clock is this PR's own CI run.

End to end on this machine, in order: `--seal`, `npm run check` with the report kept, then
`prove 0419` holding the report to the seal —

| | |
|---|---|
| `npm run check` with the report kept | 127 files, 1,803 tests; the JSON beside the usual output |
| `prove 0419` holding that report to the seal | *"read from the suite’s own run, sealed to these bytes ... green (39 tests)"*, 6 of 6 red |
| **the same report after one test file was edited** | **REFUSED** — *"sealed to different bytes from the tree being proven"*, exit 1 |
| `PROVE_BASELINE` without `PROVE_SEAL` | **REFUSED** — *"go together"*, exit 1 |

⚠️ **The seals agreed across a whole `npm run check`**, which was the unverified claim: nothing the
suite writes lands inside what `manifest` reads.

⚠️ **ONE THING SEEN ONCE AND NOT EXPLAINED.** The first time the edited-tree refusal ran, the process
printed its refusal in full and then did not exit for ten minutes, idle. Stopped by hand. **Twenty-one
runs since, in both refusal shapes, with and without a wrapper and after a typecheck as the first
was, each exited at once with 1.** It is on the refusal path, so it cannot pass anything; in CI it
would hold a job until the job's own limit. Recorded here rather than called flaky —
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) — and owed a look if it recurs.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). `scripts/`, `tests/`, the vitest
config's reporters under an environment variable only CI sets, the workflow, and documents. The build
output is byte-identical.
