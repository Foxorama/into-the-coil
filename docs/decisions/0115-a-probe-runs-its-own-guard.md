# 0115 — A probe runs its own guard, and a suite bakes once

**Accepted 2026-08-11.** Extends [0005](0005-a-guard-must-be-seen-to-fail.md) and
[0019](0019-a-probe-must-be-seen-to-apply.md); neither is superseded.

**It amends one sentence of [0054](0054-the-proof-runs-beside-the-work-not-on-it.md)** — *"a real
`vitest run` of the **whole suite** still has to go red"* — and **takes the option 0054 measured and
refused.** That refusal was correct on its evidence and the evidence moved. Everything else in 0054
stands: the disposable copies, the baseline gate, the drift check, the four refusals.

## The rules

**A probe runs the test it names, not the suite around it.** `vitest -t <guard>`, with the guard
title escaped to the literal string the verdict already compares with `String.includes`.

**A guard title that resolves to no test is a failure, never a pass.** An empty vitest run exits zero
with nothing failed, which is indistinguishable from a guard that did not fire.

**The whole suite runs when the named guard does not fire, and only then.** *What else went red* is
the difference between a vacuous guard and a misaimed one, and it is fetched on the path that reads
it.

**A test suite synthesises the music once.** `tests/bakes.ts`, memoised per rate, handing out copies.

## What 0054 measured, and what has moved since

0054 refused this in as many words, five days ago:

| | serial | 6 workers |
|---|---|---|
| whole suite per probe | 8.4 min | **1.89 min** |
| only the guard's test | 6.2 min | 1.47 min |

> *"Once the probes run in parallel it buys 25 seconds, and 25 seconds does not pay for narrowing
> what a break is watched against. Refused."*

⚠️ **THE REFUSAL RESTED ON A MEASUREMENT THAT IS NO LONGER TRUE, AND 0054 SAYS WHICH ONE.** Its
finding was *"It was not that the suites got slow"* — roughly 40% of the run was process startup,
which is why shrinking a run barely helped. **That ratio has inverted.** Startup is about a second;
the suite it fronts is thirty-six.

| | 0054, 2026-08-06 | now |
|---|---|---|
| probes | 234 | **552** |
| `tests/music.test.ts`, per run | — | **35.7 s** |
| its share of the whole run's CPU | — | **41.8%** (42 probes × 35.7 s = 25.0 of 59.8 CPU-min) |
| CI wall clock | — | **40.2 min, of which `prove` is 37.2** |

⚠️ **EVERY DECISION THAT MADE THIS SUITE EXPENSIVE IS AFTER 0054.** 0089 to 0114 are the audio arc —
a cue with a body, four loops, an aura, a level's own piece, a mastered bus, a boss's piece — and each
one added seconds to one suite that forty-two probes each pay for in full. 0054 could not have
measured a cost that had not been incurred.

⚠️ **AND 0054 LEFT IT IN THE DRAWER ON PURPOSE**: *"the filtered run also revealed a failure mode
nothing currently catches — a `guard` string naming no test at all. All 234 match today. If that ever
stops being true, filtering is how it would be found."* This is that drawer opened, and the failure
mode is now held rather than merely noticed.

## What answers the refusal's substance

⚠️ **THE NARROWING IS UNDONE RATHER THAN ACCEPTED.** 0054's objection was to *narrowing what a break
is watched against*, and it is exact. The answer is that the whole suite still runs — just not on the
path where nothing reads it.

Under the old harness a passing probe reddened its named guard and whatever else it reddened was
**computed and discarded**. Every branch of the verdict except one is about the named test. So on the
green path nothing was ever surfaced to lose, and on the red path the full suite is run before a word
is printed. **The diagnostic is byte-for-byte what it was.**

## The escape is not a detail, and it was measured

⚠️ **`-t` IS A REGEX AND A GUARD TITLE IS PROSE.** The verdict compares titles with `String.includes`;
handing the same string to `--testNamePattern` unescaped makes `(` a group and `.` any character.
**Eight of the 552 guard titles carry one of `( ) . *`** — counted, not feared. Unescaped, those eight
either throw inside a worker or match a test nobody named, and the second one is silent.

⚠️ **It is the harness's own founding failure in a new coat.** `scripts/prove-guard.mjs` exists
because a probe's `find` string did not survive a shell, twice, and *"the developer cannot tell the
guard is vacuous from my probe did nothing"*. A guard title that does not survive a regex is the same
sentence about the other end of the probe.

## The bake was computed six times, and the file had already found it once

⚠️ **`bakeLoops` synthesises 272 seconds of audio and costs about 2.5 s.** `tests/music.test.ts`
called it **six** times — four inside `it` bodies, one at the head of each of two `describe`s — so
fifteen of its thirty-six seconds were the same numbers, six times over.

⚠️ **AND THE FILE HAD ALREADY DIAGNOSED THIS AT A SMALLER SCOPE.** Its mixer carries *"BAKED AND MIXED
ONCE, AND THE FULL SUITE IS WHAT SAID SO"*, written after four rungs meant four bakes and a five-second
timeout. The finding was right and the scope was one `describe` wide.

⚠️ **COPIES, AND THAT IS NOT CAUTION.** A shared buffer would let one test change another's subject
silently, with both green — a guard measuring something else, which no probe can catch because no
guard has failed. The copy is ~40 ms against a 2.5 s bake, so every caller keeps exactly today's
semantics at a sixtieth of the price. **Nothing here trades correctness for time.**

⚠️ **`tests/sound.test.ts`'s cold-versus-prewarmed test deliberately does not use it.** Its subject IS
that baking twice gives the same answer, and handing it one bake twice is
[0027](0027-measure-the-picture-not-the-model.md)'s guard measuring itself. `tests/music.test.ts`
35.7 s → 19.8 s with the suite still green on all 48.

## What a probe cannot prove here, stated rather than left out

⚠️ **NO PROBE BELOW BREAKS THE FILTER ITSELF, AND THAT IS NOT AN OVERSIGHT.** 0115 is a change of
**cost** as well as of shape, and a test cannot go red because something was slow: a harness that ran
the whole suite would report every probe correctly and merely take thirty-seven minutes.
[0005](0005-a-guard-must-be-seen-to-fail.md) reaches what a break can redden, and a speed is not one.
**What is probed is the two ways the filter can be WRONG**, which is the half that can lie.

⚠️ **The wall clock is therefore the evidence for the speed and the probes are the evidence for the
correctness**, and they are different claims. Both are recorded here; neither stands in for the other.

## What it cost, measured

| | |
|---|---|
| the full run, this machine, 12 cores / 11 workers | **452 s**, 555 probes, all red, every tree restored |
| the baseline gate inside that | 891 tests over 54 suites, green |
| `npm run check` | 932 tests over 61 files, green; build unchanged |

⚠️ **THE BEFORE-NUMBER ON THIS MACHINE WAS NOT TAKEN, AND IS NOT ESTIMATED HERE.** What is measured
is CI, where the complaint was: **40.2 min, of which `prove` is 37.2**, on 3 workers, over the runs
that carried 0108 to 0114. **The after-number is whatever this PR's own CI run reports** — same
runner, same worker count, same suites — and it belongs in the PR rather than back-edited into a
decision. `docs/decisions/README.md`: a file that gets revised is one whose reasoning can drift from
what was decided.

⚠️ **AND THE BASELINE GATE FIRED ON THIS WORK BEFORE THE PROBES DID**, which is worth more than the
clock. The first full run refused in **78 seconds** with *"every relative link in every markdown file
resolves, **in a clean checkout**"* — this decision was still untracked, so `docs/state-of-play.md`'s
pointer to it resolved on the author's disk and would have been broken for every clone. That is
[0054](0054-the-proof-runs-beside-the-work-not-on-it.md)'s newest check catching the newest file, and
it is exactly the shape [0038](0038-the-handover-is-a-file.md) means by *"a citation rots as silently
as a summary drifts."*

## What was rejected

**Sharding `prove` across CI runner jobs.** It multiplies whatever this achieves and it is the obvious
next lever — 3 workers on a 4-vCPU public runner is what CI has. It is refused **in this decision**
rather than for ever: it needs a matrix, which means new required contexts, which means a branch
protection change and [0004](0004-admin-settings-must-be-read-back.md)'s read-back. That is a
different PR with a different risk, and it should be sized against what CI costs *after* this one.

**Running only the probes whose source files changed.** It is the largest saving available and it is
the one that would hollow the harness out. [0019](0019-a-probe-must-be-seen-to-apply.md) exists
because a guard rots silently, and a probe that only runs when somebody touched its file is a probe
that stops running exactly when the code around it drifts.

**Lowering the sample rate in the audio guards.** It would be faster than memoising and it changes
what the spectral assertions measure — [0027](0027-measure-the-picture-not-the-model.md), a guard
about a quantity the player does not hear.

## Confirmed, not assumed

Per 0005, the new mechanism's own failure modes were broken on purpose and watched. The probes are in
`scripts/probes/0115-prove-runs-the-guard.mjs`; the guards they redden are in
`tests/prove-guard.test.ts`, which imports the verdict as a **pure function** — that is why the
verdict is a function at all rather than three branches inside a worker loop no test can reach.

| broken on purpose | went red |
|---|---|
| the guard title handed to vitest unescaped, so a metacharacter stops being a character | `THE SILENT ONE: every guard title in the repository still matches itself as a pattern` |
| the empty-run arm dropped, so a guard title that resolves to no test reads as one that did not fire | `THE NEW CLASS: a guard title that resolves to no test is refused, not read as green` |
| any red taken as proof, so a break that reddens the wrong test passes | `and a guard that fires is the only thing that passes` |

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Nothing here touches an
`itc_*` storage key, the save schema, the service-worker cache prefix, the origin or anything
shipped: `scripts/`, `tests/` and a decision. The build output is byte-identical.
