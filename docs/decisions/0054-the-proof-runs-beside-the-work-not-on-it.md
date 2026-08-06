# 0054 — The proof runs beside the work, not on it

**Accepted 2026-08-06.** Extends [0005](0005-a-guard-must-be-seen-to-fail.md) and
[0019](0019-a-probe-must-be-seen-to-apply.md); neither is superseded. What changes is where a probe
is applied, not what it proves.

## The rule

**A probe is applied to a disposable copy of the repository, and copies are proven in parallel.**
Your working tree is never opened for writing. A run is bracketed by two checks that the serial
harness did not make:

| check | what it catches |
|---|---|
| the suites this run will judge are **green before anything is broken** | a guard's test that was already red, which makes every probe over that suite a vacuous pass |
| every worker tree is **byte-identical to the copy it started as** | a restore that half worked, and handed the next probe a tree that was already broken |

The four refusals 0019 lists are unchanged and still exact.

## Why: the cost was never the tests

`npm run prove` reached **nine to ten minutes** at 234 probes. 0019 sized it at *"twenty-two probes
cost about twenty seconds"*, and the line from there to here is straight — which is the finding. It
was not that the suites got slow. It was that **every probe waited for the one before it**, and the
only reason they had to was that they all wrote to the same files.

Measured on this machine before changing anything (12 cores):

| | |
|---|---|
| 234 probe runs, one whole suite each, serial | 8.4 min |
| the final green pass, 40 separate vitest spawns | ~1.6 min |
| **of which: node + vitest + `globalSetup`'s build, ~0.95s × 234** | **~3.9 min** |
| **of which: 6 browser suites / 21 probes** | **4.9 min** |

Two things fall out of that table and both were surprises.

**Roughly 40% of the run was process startup**, before a single assertion. That is why making the
runs *smaller* barely helps — see the rejected shortcut below.

**`tests/menu.browser.test.ts` costs 38.8s per run**, and it is not a defect. Its fourth test flies a
real run until the ship dies and then waits seven real seconds for the countdown to expire. It is one
of the most honest tests in the repository. The waste was running it three times to prove two probes
that were not about it.

## What does not change, stated exactly

The edit is a real edit to a real file. `verifyApplied` still reads the bytes back off the disk.
A real `vitest run` of the **whole suite** still has to go red, and red **on the named test**.
`planEdit` still refuses a `find` that is absent or ambiguous. The only thing that moved is which
directory it all happens in.

## Rejected: running only the test the guard names

The obvious shortcut, and the only change that would have altered what a probe proves —
`vitest -t <guard>` runs the guard's test and nothing else. It was measured before being believed in:

| | serial | 6 workers |
|---|---|---|
| whole suite per probe | 8.4 min | **1.89 min** |
| only the guard's test | 6.2 min | 1.47 min |

Serially it looked worth having. **Once the probes run in parallel it buys 25 seconds**, and
25 seconds does not pay for narrowing what a break is watched against. Refused.

⚠️ Worth keeping in the drawer: the filtered run also revealed a failure mode nothing currently
catches — a `guard` string naming **no test at all**. All 234 match today. If that ever stops being
true, filtering is how it would be found.

## Why a copy, and not a `git worktree`

A worktree carries what is **committed**. `prove` has to judge the code you actually have, so the
copy is taken off the disk, uncommitted edits included.

⚠️ **And it copies gitignored files too, which is load-bearing.** 0038's second probe breaks a
tracked document by pointing it at `docs/scaffold-plan.md` — a file that must be **present and
untracked** for the guard to fire on the right half of its assertion. A tracked-files-only copy
leaves it absent; the guard still goes red, saying *"nothing there"* instead of *"gitignored"*, and
the probe passes having proven the other half of the test. That is 0019's own blind spot — a break
and its guard agreeing for the wrong reason — reappearing in the harness rather than in a guard.

`.git` is copied rather than shared for the same class of reason: `git ls-files` refreshes the index,
and six workers sharing one `.git` would be six processes writing one file. `node_modules` is a
junction, because 95 MB per worker is not a trade and nothing in a probe run writes to it. A tree is
**5 MB and 550 files**; six of them take about two seconds.

## What got stronger, and it is not only the clock

**The baseline gate is new.** A probe passes when its guard's test is red *with the break in*. If
that test was already red, the probe proves nothing — and the serial harness only noticed at the very
end, in a message about restores. Watched: `int()` broken in the real tree, then `prove 0021` — the
run refuses in forty seconds and names the two failing tests. Under the old harness all six of those
probes would have reported `red`.

**The restore check replaced a weaker one.** *"And the suite is green again afterwards"* could only
ever see a bad restore that some test happened to assert on, and 0019's own worked example — *"a
probe that reverted its own file but left a planted one behind"* — is exactly the case where no test
imports the leftover. Comparing the whole tree to the copy it started as has no such blind spot.

**`prove` no longer refuses a dirty tree.** That refusal existed because a crash mid-probe left the
tree mid-mutation, and *"losing real work to a proof is not a trade"*. Nothing writes to your tree
now, so the reason is gone rather than waived.

**Result: 9–10 min → 3.0 min**, of which about 50s is the new baseline gate. Nine workers measured no
better than six (the floor is that one 38.8s probe), so the cap is six.

## The risk that was checked rather than assumed

[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) is about a guard that failed **only
under the load of `npm run prove` itself** — it was reading wall clock where it meant frames.
Six-way concurrency multiplies that load, so this design's most plausible way of being wrong is
making a timing-sensitive browser test intermittent.

**Measured: the full 234-run workload at 6-way concurrency against unbroken code — 0 red**, across
roughly 2,900 test executions including every browser suite. The full `prove` run then passed with
all 234 probes red and every tree restored.

⚠️ **One clean run is not proof of non-flakiness, and 0044 forbids treating a rerun as evidence.**
The claim here is narrow: nothing intermittent has been seen yet. If something does surface, 0044
already says what to do with it — establish whether the guard or the code is wrong, and
`PROVE_WORKERS=1` reproduces the old serial ordering to find out.

## Confirmed, not assumed

The harness is a guard, so per 0005 its own failure modes were watched. The three from 0019 were
re-run against the new harness from a temporary `scripts/probes/9999-selftest.mjs`, since a permanent
set of probes that must FAIL would fail every run by design:

| broken on purpose | the harness said |
|---|---|
| a probe whose `find` string is not in the file | `PROBE FAILED` — *"the code moved and the probe did not"* |
| a probe that plants a harmless file | `STILL GREEN` — *"the guard does not fire on the thing it exists to catch"* |
| a probe that reddens a guard other than the one it names | `WRONG TEST`, printing both the expected and the actual |
| **`int()` genuinely broken in the tree, then `prove 0021`** | **`RED` before copying a single tree, naming both already-failing tests** |
| **the restore neutered to a no-op, then `prove 0021`** | **all six worker trees reported `src/sim/rng.ts — not restored`** |

The last two are the checks this decision adds. All five exited non-zero.

`drift` — the tree comparison — is a pure function, so it does **not** need that exemption: it is
unit-tested in `tests/prove-guard.test.ts` and has permanent probes in
`scripts/probes/0054-proof-tree.mjs`, run the ordinary way. **3 red, and every tree back to what it
was copied as.**

| broken on purpose | went red |
|---|---|
| the leftover-file check dropped, so a plant that never got removed goes unseen | `sees a file the probe left behind` |
| the restore compared by file list rather than by contents | `sees a file the probe did not restore` |
| a file that vanished from the tree reported as if it were merely different | `sees a file that went missing altogether` |

⚠️ Those probes break the harness **that is running them**, which is not a paradox: `prove` read
`scripts/prove-guard.mjs` from the real tree when it started, and the copy each probe edits is the
one inside a worker, read only by that worker's `vitest`.

## What this leaves owed

**The baseline gate is a branch inside `main`, not a pure function**, so it carries the measurement
above rather than a permanent probe. Extracting it far enough to probe would be shaping the code to
suit the harness; the honest version is the row in the table.

**The timings are this machine's.** CI has fewer cores, and `availableParallelism() - 1` will give it
fewer workers — no worse than the serial harness it replaces, and better by the batching. The number
worth watching there is whether the browser probes stay stable under whatever concurrency a runner
picks.
