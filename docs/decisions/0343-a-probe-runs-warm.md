# 0343 — A probe runs warm

**Accepted 2026-09-21.** Extends [0115](0115-a-probe-runs-its-own-guard.md) and
[0054](0054-the-proof-runs-beside-the-work-not-on-it.md); neither is superseded, and **0115's refusal
of *"running only the probes whose source files changed"* stands** — it was proposed again here,
measured, and refused again for a second reason.

## The ask

> *"how do we sort out the 2hr proof and seriously slow checks … automatic testing and proofs should
> not be taking two hours per build/check for a project this small. what have I set up wrong?"*

## The rules

**A worker tree keeps one vitest alive, and a probe is asked of it.** The same config, the same test,
the same escaped `-t` pattern, the same failure shapes through the same `verdictOf`.

**A warm run can pass a probe and can never fail one.** Anything a live instance reports other than
`red` is asked again of a new vitest, exactly as every probe was before, and only that answer fails.

**A flush is read back.** After every edit and after every restore, the harness walks the module
graph and throws if anything for that file still holds a transform.

**A browser suite is never asked warm**, and **`dist/` is rebuilt after every new-vitest run**,
because a live instance builds nothing.

## What was measured, and it is not what was assumed

| | |
|---|---|
| probes | **1,216**, over 94 suites |
| a vitest process that runs no test at all | **4.7 s** |
| the median guard's own test | **0.01 s** |
| so: starting vitest, summed | **95 worker-minutes** |
| every guard's test body, summed | 66 worker-minutes — **62 of them in 70 probes** |

⚠️ **THE PROOF WAS NOT SLOW BECAUSE THE TESTS WERE.** 1,146 of 1,216 probes cost nothing but the
process around them. [0054](0054-the-proof-runs-beside-the-work-not-on-it.md) found *"roughly 40% of
the run was process startup"*; 0115 found that ratio had inverted; it has inverted back, because 0115
worked — the bodies got filtered to one test and the start-up was left as the whole cost.

## The saving that was proposed first, and why it is refused twice now

The first plan was 0115's refused one with a better selector: run a probe only when its probe file,
its suite, its edit target **or anything its suite imports** is in the diff, and prove everything
nightly. The import closure was meant to answer 0115's objection — *"a probe that stops running
exactly when the code around it drifts"* — because the code around it is in the closure.

⚠️ **IT WAS PROMISED AT *"a few dozen probes a PR"* AND MEASURED AT ELEVEN HUNDRED**, over the last
forty merges to `main`:

| selector | probes selected per PR |
|---|---|
| import closure | mean **1,115** of 1,216 — 92% |
| probe file, suite or edit target only | median **438** — and it is 0115's refused option unchanged |
| probe file or suite only | mean 83 — and blind to an edit beside the anchor |

⚠️ **AND THE REASON IS THE ARCHITECTURE, SO IT WILL NOT IMPROVE.**
[0016](0016-a-hub-enumerates-kinds.md) makes content rows in a table, so a content PR edits a table:
`src/content/bosses.ts` was touched by 24 of those 40 merges and sits in the closure of 1,066 probes;
`src/app/frame.ts` by 25, and 798. A sound selector selects everything and a cheap one is the thing
0115 refused. [0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md): the number that would have
approved this was one nobody had checked.

## What a live instance can get wrong

⚠️ **A STALE MODULE, IN TWO DIRECTIONS, AND ONLY ONE OF THEM IS LOUD.** An edit the instance did not
see is a guard that stays green, and the harness already shouts about that. **A restore it did not
see** leaves the last probe's break in the cache, and the next probe over that file goes red for a
break that is not its own — [0005](0005-a-guard-must-be-seen-to-fail.md)'s vacuous proof, produced by
the harness that exists to prevent it.

⚠️ **FOUND BY IT HAPPENING, IN THE SPIKE.** `path.resolve` returns backslashes; vite keys its module
graph on forward slashes; `invalidateFile` on a key that misses does nothing and says nothing. Sixty
real probes through that instance read: most edits unseen, one restore unseen. With the path spelled
correctly the same sixty read **60 red, 60 green after restore, 0.42 s a run.**

So the read-back does not ask the keyed lookup a second time — that would agree with itself about a
wrong key. It walks every module and compares paths with case and slashes folded.
[0019](0019-a-probe-must-be-seen-to-apply.md)'s `verifyApplied`, asked of the cache instead of the disk.

⚠️ **EVERYTHING ELSE IT CANNOT SEE COSTS TIME AND NOT A VERDICT.** The instance read `vite.config.ts`
once and cannot rebuild `dist/`. Each of those blindnesses makes a guard look like it did not fire —
and *did not fire* from a live instance is never reported, only re-asked.

⚠️ **ONE BLINDNESS RUNS THE OTHER WAY AND IS CLOSED BY CONSTRUCTION.** A new-vitest run builds `dist/`
**with the break still in**, because `tests/globalSetup.ts` runs before the suite and the undo after
it. Harmless while every run rebuilt first; with warm runs following, a suite that reads the built
page would see the previous probe's break. The drift check cannot see it — `dist` is not copied and
not compared. So the harness builds `dist/` from each pristine tree before the first probe, the live
instance has no `globalSetup` at all, and every new-vitest run is followed by a rebuild.

## What it cost, measured

Same machine, same 21 probes (`0032`: four suites, two of them browser), back to back:

| | |
|---|---|
| a new vitest per probe (`PROVE_WARM=0`) | **4 min 06 s** |
| warm | **1 min 24 s** — 19 settled warm, 2 asked of a new vitest, same 21 verdicts |

⚠️ **THE WHOLE-PROOF NUMBER IS CI's AND BELONGS ON THE PR**, for 0115's reason: the before is **47 to
61 minutes over the five green runs before this one — 9 in `check` and 53 in `prove` on the last of
them**, and the after is
whatever this PR's own run reports. **It is not taken on the development box** because that box runs
several sessions at once — a guard measured at 27 s alone took 194 s while another session's suite
ran — and a number taken there is a measurement of the neighbours. **The first full proof of this
very change went red in its BASELINE, 700 s in, on three timeouts, with a second session's proof
running beside it** — before one probe had been applied, so before any line of this change had run.

## What is still owed, and is not this decision

**The seventy.** 62 of the 66 body-minutes are 70 probes, and two tests are most of it: the clip
guard in `tests/themes.test.ts` is **184 s alone on an idle machine** and five probes name it; the
0149 hull guard is 27 s and seven do. Its own comments record three rounds of making it cheaper
without measuring less, and say the remainder is the bake.

**The question that was asked.** *What was set up wrong* is that nothing owns what the suite costs:
every decision adds a guard and three or four probes, [0192](0192-a-guard-holds-an-invariant.md)
limits which of them may fail hard, and [0245](0245-a-budget-is-sized-under-load.md) answers a slow
test by sizing its timeout. No rule says a test gets cheaper. That is a rule, so it is a decision of
its own and is not slipped in under this one.

## What was rejected

**Proving the diff.** Above.

**A green run after every restore, to show the restore was seen.** It is the direct measurement and
it doubles every test body, which is the half of the cost this decision does not touch. The read-back
is the same claim asked of the cache, and the fixture in `tests/prove-worker.test.ts` asks it of a
real instance once.

**Routing by a list of suites that need a build.** A list is a second description of what the suites
do and would rot; *ask warm, and re-ask anything that is not red* needs no list and is right about
suites that do not exist yet. Browser suites are skipped only because the answer is known.

## Confirmed, not assumed

Probes in `scripts/probes/0343-a-probe-runs-warm.mjs`; the guards are in `tests/prove-worker.test.ts`.

| broken on purpose | went red |
|---|---|
| a path handed to the module graph as Windows spelled it, so the lookup misses and nothing is invalidated | `THE ONE THAT WAS FOUND BY IT HAPPENING: a Windows path is spelled the way the module graph spells it` |
| the read-back answering that nothing is held, whatever the graph holds | `THE READ-BACK: a module still holding a transform is named, however its path is spelled` |
| a live instance allowed to settle a probe it did not see go red | `A WARM RUN CAN PASS A PROBE AND CAN NEVER FAIL ONE: only red settles it` |
| the flush reading the graph back without ever having invalidated anything | `THE ONE IT IS FOR: a live vitest sees the edit, and then sees it taken back` |

⚠️ **The fourth is about the instance and not a model of it** —
[0027](0027-measure-the-picture-not-the-model.md). Its red was the read-back itself refusing a real
stale transform in a real vitest: *"src/value.ts was invalidated and the instance still holds a
transform for …/src/value.ts"*.

⚠️ **No probe breaks the speed**, for 0115's reason. `PROVE_WARM=0` is the old harness, kept as the
way to ask whether a confusing verdict is the instance's.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). `scripts/`, `tests/` and documents;
the build output is byte-identical.
