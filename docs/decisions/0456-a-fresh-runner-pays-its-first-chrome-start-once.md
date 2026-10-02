# 0456 — A fresh runner pays its first Chrome start once, before any test is timed

**Accepted 2026-10-02.** [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) applied
to one probe that reddened once, and [0245](0245-a-budget-is-sized-under-load.md) applied to the
quantity that reddened it.

## The rule

**Every CI job that runs the suite or the proof starts Chrome once, in a step of its own
(`scripts/warm-chromium.mjs`), before the step that runs them.** The first Chrome start on a hosted
runner is a cost of the machine and not of any test, so no test's budget pays it.
`tests/shards.test.ts` holds both jobs to that, and the step prints what the start cost on every
run.

## The failure

Run 36944601498, shard `prove (7)`, attempt 1: the shard's first probe, 0070's *the chrome left on
one face*, came back `NEVER REACHED ITS CLAIM`. The stack said `STACK_TRACE_ERROR` from
`@vitest/runner`, which is what a timeout looks like here (`isAVerdict` in
`scripts/prove-guard.mjs`). `tests/style.browser.test.ts` gives its tests 60 s, and its first test
launches the browser inside its own body. The rerun of that shard was red on all six of 0070's
probes, and so was `npm run prove 0070` locally.

⚠️ **THE WHOLE FIRST WAVE WAS LATE, NOT THE PROBE.** Each shard proves on three workers, and browser
probes are dealt first (`longestFirst`), so every shard opens with three cold browser probes started
together. Timed from the trees being copied:

| `prove (7)` | first three probes finish | probes 4–6 finish |
|---|---|---|
| attempt 1 (red) | 65.8, 65.9, 67.6 s | 81.1, 82.4, 89.2 s |
| attempt 2 (green) | 19.1, 19.6, 21.5 s | 37.1, 37.7, 47.9 s |

The two attempts ran the same 169 probes. The first wave lost about 46 s, the second wave finished
about 15 s after the first in both attempts, and the two runs moved at the same pace from then on.
**Every worker paid a cost once, at the start, at the same moment, and the probe that timed out
was the one whose test had the smallest budget.**

Across 341 prove-shard logs from the last 40 runs, the first probe finished between 12.1 s (p10) and
32.0 s (p90) after the copy, and this one finished at 65.8 s. The tail was already there before this
run: other shards' first waves finished at 62.7, 59.9 and 56.8 s, under budgets they happened to
have room for.

## What was measured

A throwaway workflow on 20 fresh `ubuntu-latest` runners, each running three starts at once (as a
shard's first wave does), then three more on the same machine. Each start was a launch, a context,
the built page, its canvas, and the title past the intro.

| per start, 60 of each | cold (first three) | warm (next three) |
|---|---|---|
| launch + context | **1.3 – 32.5 s**, median 8.5 s | **0.3 – 0.9 s**, median 0.6 s |
| page to canvas to title | 4.1 – 8.0 s, median 6.5 s | 4.0 – 7.4 s, median 6.6 s |

Eight of the twenty runners were cold for under 1.7 s and twelve took 7.7 s or more. On every
runner, the three parallel starts finished launching within 32 ms of each other, so they were
waiting on one thing. **The page itself costs the same cold and warm, and the whole difference is
starting Chrome for the first time.** The slowest of twenty was 32.5 s. The red run's first wave
lost at least 46 s against its own rerun, and it is the slowest of 341.

## Which it is

**Not a wrong quantity in one timeout.** The style suite's 60 s is a literal with no measurement
beside it, which 0245 does not allow, but sizing it by 0245 would have measured the wrong thing.
Every browser suite starts Chrome inside its first test or hook, and any of them can be first on a
runner. The worst case on record is at least 46 s on top of the test, with no evidence of where the
tail ends, so budgeting for it would mean *three times the worst* on every browser test. That is
around three minutes each, and it would still be one slow machine short.

**A real intermittency, and not in the harness.** The harness deals probes as it should. The
intermittency is the runner's first Chrome start, which is a property of a freshly provisioned
machine, and it was being charged to whichever test came first. The fix moves that cost to a place
nothing times.

## Confirmed, not assumed

- **That a step in its own process spares a later one.** The first experiment only showed a second
  start in the same process was fast. A second run of the same workflow put
  `scripts/warm-chromium.mjs` in a step before the measuring one, on 20 more fresh runners:

  | 20 more runners | launch + context |
  |---|---|
  | the warm step | **0.9 – 32.5 s**, thirteen of twenty over 6 s |
  | the next process's three parallel starts, its first | **0.5 – 1.3 s**, median 0.9 s |
  | the same process's next three | 0.3 – 0.9 s, median 0.7 s |

  The cost is the machine's and not the process's, so a step that pays it spares every step after.
- **That the guard fires.** `scripts/probes/0456-a-fresh-runner-pays-its-first-chrome-start-once.mjs`
  takes the step out of the probe job, and moves it after the suite in the suite job. `npm run prove
  0456`, exit 0:

  | broken on purpose | went red |
  |---|---|
  | the suite shards warming Chrome after the suite, which is the cost paid twice and spared nowhere | `every job that runs the suite or the proof starts Chrome once before it does` |
  | the probe shards no longer warming Chrome, so the first wave of browser probes pays the runner’s cold start | `every job that runs the suite or the proof starts Chrome once before it does` |

## What was rejected

**Raising the style suite's budget.** It would answer the one test that was first this time. The
next runner may be slow on a different test.

**Launching in `tests/globalSetup.ts`.** It covers the same jobs and also every local run, at a warm
start's 0.6 s median for each new vitest, and every browser probe is a new vitest. That adds a
launch to each of the 91 browser probes, about nine per shard, to pay for one, and on a developer's machine nothing is cold.

**Rerunning.** [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md). The rerun is in
the table above, and what it shows is the cost moving, not going away.

**A budget on the warm step.** Its job is to absorb a cost whose tail is not known. A Chrome that
never comes up is a hang, and the job bounds that. The suite behind it would hang the same way.

## Still owed

The browser suites' per-test budgets (60, 105, 120 and 180 s across sixteen files) are literals, and
the style suite's has no measurement beside it. This decision takes the largest unmeasured cost out from under
them. It does not size them.
