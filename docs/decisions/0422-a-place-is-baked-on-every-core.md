# 0422 — A place is baked on every core

**Accepted 2026-09-30.** The next long pole after [0421](0421-the-hull-is-asked-near.md), on the way
from CI's 5 min 50 s toward five. It is the next of [0344](0344-a-probe-runs-warm.md)'s *seventy*: the
clip guard its own comments said was *"88% `bakeLoops`, and that is the thing it exists to measure."*

## The rule

**A test that needs the music baked asks `tests/bakes.ts`, and `tests/bakes.ts` bakes every layer it
is missing on every core at once**, with the game's own `layerNotes`, and hands back exactly the bytes
an in-process bake would. `primeLoops` does it for whole places; `bakeInPool` for any list of layers,
which is what `tests/clean.ts`'s own cache now asks it for. `tests/bakes.test.ts` holds the pool's bytes
to the same layers baked in the caller's thread.

## Measured before anything changed

`tests/themes.test.ts` alone on the development box: **124 s**, and in #447's CI suite shard **284 s** —
the longest file in the run, and a shard runs whole files. Its two long guards:

| | |
|---|---|
| *no theme at any rung drives the bus past full scale* | **59 s** — of which **54.8 s baking the seven places**, one layer at a time, and 6.4 s walking the samples |
| *every rung of a place holds its run loudness* | **31.5 s**, nearly all of it `tests/clean.ts` baking the same seven at half the rate, again one layer at a time |

⚠️ **ONE PLACE WAS HALF OF IT.** The Black Heart bakes in **29.2 s**; every other place in 3.3–5.0. Three
of its layers loop over **67.2 s** where every other place's longest is 25.6, and its `groove` alone —
the orchestra's long sustained strings, 4.3 beats plus a 1.5-beat release — is **13.5 s**, 2,078 notes at
5.7 ms each against The Approach's 0.55. The notes are long because the music is; nothing in them is
waste.

## Why it can be parallel, and why it is exact

Every layer is baked from its own named stream —
[0021](0021-one-stream-per-concern.md) — and shares nothing with any other: the game's own prewarm
already bakes them one at a time across frames, and `tests/sound.test.ts` holds that path equal to a
straight bake sample for sample. So the 161 layers of the seven places are 161 independent jobs. **A layer is the grain**: its
notes draw from one stream in order and cannot be split, so the floor is the slowest single layer —
The Black Heart's `groove` — rather than the sum.

**The threads run the same source through Node's own type stripping, from the same tree** — so a
probe's edit to `src/` is what they bake, exactly as a new vitest would. They write into shared memory
and the caller blocks in `Atomics.wait` until each job is done, **so `loopsAt` stays synchronous** and
none of its callers changes. A job that fails is baked again in the caller's thread, so a test reports
the synth's own exception with our stack; a thread whose source does not load marks every unclaimed job
failed at once rather than leaving the caller blocked to its deadline.

## And one `pow`, in the shipped synth

`sampleLayerInto` computed `Math.pow(to / from, u)` for every sample of every note, and a pitched note
sets `to` equal to `from` — so it was `Math.pow(1, u)`, which is exactly 1. The branch skips it. **Every
layer and every cue of the base and all seven places was fingerprinted before and after: the same
SHA-256, `acb03376…`.** It makes a whole-game bake 8–10% faster — The Black Heart 29.4 s → 26.1 s — and
that is the game's own boundary bake as well as the tests'. Two other candidates were measured and not
taken: reusing the filter's result object was byte-identical and **no faster** (V8 already removed the
allocation), and a change that buys nothing does not go into shipped code.

⚠️ **0099's probe was anchored on the line this rewrote**, and the harness refused to run until it
moved. Its break is unchanged — the sweep's ratio forced to 1, so every glide is held — now on the line
that decides it.

## What it cost, measured

| | before | after |
|---|---|---|
| the clip guard, alone | 59 s | **22 s** |
| the clip guard, whole suite, development box | 275 s | **79.4 s** |
| the loudness guard, alone | 31.5 s | **10.4 s** |
| `tests/themes.test.ts`, alone | 124 s | **65 s** |
| `tests/authored.test.ts`, alone — unchanged, through `loopsAt` | 58 s | **21 s** |
| its one long test, whole suite | 261 s | **57 s** |
| the new identity guard, alone / whole suite | — | 13.5 s / 33.6 s |

**Budgets, per [0245](0245-a-budget-is-sized-under-load.md), three times the whole-suite measurement:**
the clip guard 420 s → **240 s**, the loudness guard 600 s → **75 s**, the identity guard **105 s**.
One whole-suite run each; this PR's CI run is the second.

## What was rejected

**A bake cache on disk, or shared across files.** Every file would read the same seven places once —
and a cache keyed on anything short of every byte the bake depends on is a guard measuring last week's
music, green. [0027](0027-measure-the-picture-not-the-model.md) arriving in the harness.

**Splitting `tests/themes.test.ts` so its guards land in different shards.** Each part would bake the
same seven places again; more CPU in total to shorten one file, and no help to a probe of either guard.

**Baking at a lower rate, or fewer places.** Faster, and it measures other music —
[0134](0134-the-place-keeps-the-games-pace.md) exists because a guard baked one place and meant seven.

**Making the callers `await`.** A dozen call sites in four suites changed to save nothing: the caller
has nothing to do but wait.

## Confirmed, not assumed

Probes in `scripts/probes/0422-a-place-is-baked-on-every-core.mjs`.

| broken on purpose | went red |
|---|---|
| a thread baking the base composition whatever place it was asked for | `THE ONE IT IS FOR: every layer from the pool is the layer baked in this thread, to the byte` |
| a layer copied into its slot only half written, so the rest of it is silence | `THE ONE IT IS FOR: every layer from the pool is the layer baked in this thread, to the byte` |
| the bakes handed back in the order the threads took them rather than the order asked | `THE ONE IT IS FOR: every layer from the pool is the layer baked in this thread, to the byte` |
| the cached bake handed out itself rather than a copy, so one test can move another’s subject | `and what it hands out is a copy` |

⚠️ **Not probed: a failed job re-baked in the caller's thread**, and a thread that cannot load its
source failing every job at once. Neither can be staged by an edit the harness can make without every
thread failing and the caller baking everything itself — which is the fallback working, and green.
They are argued above; a run with a broken `src/` is where they show.

⚠️ **No probe breaks the speed**, for 0115's reason.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). `tests/`, `scripts/probes/`, documents,
and one branch in `src/app/sound.ts` whose output is byte-identical by fingerprint. Nothing shipped
changes sound.
