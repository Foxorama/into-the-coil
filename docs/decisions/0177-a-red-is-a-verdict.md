# 0177 — A red is a verdict, and not any failure with the right name

**Accepted 2026-08-19.** [0005](0005-a-guard-must-be-seen-to-fail.md) says a guard that has only ever
been green is not known to work. This is about the other half of that sentence: **a guard seen red for
a reason nobody read is not known to have fired.**

It answers the item the previous session left at the top of `docs/state-of-play.md`:

> *"`npm run prove` called a probe red on CI and `wrong test` here, on a tree `git diff` says is
> byte-identical, and I couldn't explain it. Until that's understood, every 'seen red' in the repo is
> worth slightly less than it says."*

## The rules

**A probe's `red` means the named test reached a verdict.** One thing is not a verdict — **the runner
aborting the test** — and it is a fourth outcome, `NEVER REACHED ITS CLAIM`, which fails `npm run
prove` rather than passing as proof.

**Everything else is.** An assertion, a fixture refusing, a module throwing, a browser wait giving up:
the test executed and arrived somewhere. Chai and Playwright are libraries the test *called*; the
runner is the thing that *stops* it.

**Every probe's line in the log carries what its guard said.** One line, and it is the quantity rather
than the verdict.

## ⚠️ The answer was unrecoverable by construction, and that is the actual finding

The CI run for the disputed tree ([32138653915](https://github.com/Foxorama/into-the-coil/actions/runs/32138653915))
printed one line about it:

```
[609/679] 0134  the undercurrent held instead of running ... red
```

That is everything `npm run prove` was able to say, because the reason was dropped on the floor twice
over in `scripts/prove-guard.mjs`:

- `runSuite` accumulates the child's stdout and stderr into `out`, and reads `out` on exactly one
  path — the `vitest produced no report` throw. A report was produced, so vitest's own output went
  unread.
- the same function parses the JSON report for `t.status` and `t.title`, while `failureMessages` sits
  beside them in every assertion. Vitest's JSON reporter builds it as
  `errors.map((e) => e.stack || e.message)`.
- `verdictOf` was handed `{failed: string[], ran: number}`. **Titles only.** It could not have
  classified anything even had it wanted to.

⚠️ **SO *NO TIMEOUT APPEARS IN THE CI LOG* WAS A TRUE OBSERVATION AND A WRONG INFERENCE.** A timeout
could never have appeared in that log. The absence was not evidence, and it is what steered the
session away from the leading candidate: `tests/themes.test.ts` sets `DSP_MS = 60_000`, and CI's own
baseline timed that single test at **12.1 s** — under three concurrent probe workers on a four-core
runner, that is not a comfortable margin.

## ⚠️ A timeout reads as `STACK_TRACE_ERROR`, which is most of why nobody would find it

Measured on vitest 4.1.10 by staging each shape in `tests/` and reading it back out of the JSON
reporter — not written from memory:

| failure | first line of `failureMessages[0]` | first frame |
|---|---|---|
| `expect(1).toBeGreaterThanOrEqual(2)` | `AssertionError: expected 1 to be greater than or equal to 2` | `tests/…test.ts` |
| a fixture throwing on purpose | `Error: the fixture is not measuring what it says` | `tests/…test.ts` |
| **a test timing out** | `Error: STACK_TRACE_ERROR` | `@vitest/runner/…` |

⚠️ **The words *Test timed out in 60000ms* are on `error.message`, and the reporter prints
`error.stack || error.message`.** The stack exists, so the message is never reached. Grepping a CI log
for `timeout` will not find a timeout in this repository, and never would have.

## ⚠️ TWO WIDER RULES WERE WRITTEN FIRST AND A REAL RUN REFUTED BOTH

Neither could have been refuted on paper. **A rule about failure shapes, checked against the shapes
its author imagined, agrees with itself** — [0027](0027-measure-the-picture-not-the-model.md),
arriving inside the proof harness. What settled it was running all 686 probes and reading the eight
that came back.

**First: *the failure's stack names the suite*.** Wrong — a timed-out test's stack **still carries the
frame for its own `it(...)` declaration**, so the suite is named, at the bottom:

```
Error: STACK_TRACE_ERROR
    at task (file:///…/node_modules/@vitest/runner/…:1784:27)
    …
    at C:/into-the-coil/tests/themes.test.ts:738:3          ← the it(), not the throw
```

**Second: *the throw site is not in `node_modules`*.** Also wrong, and it called **four working probes
proofless** — 0024 twice, 0072, 0154 — because `.not.toContain` raises inside `@vitest/expect` rather
than at the line that called it. It would have done the same to every Playwright wait in the suite.

`tests/prove-guard.test.ts` holds all three stacks verbatim, transcribed off real runs rather than
written, each with the assertion that refutes the rule it defeats.

## ⚠️ Eight probes came back, and they split three ways

| what came back | how many | what it is |
|---|---|---|
| `AssertionError`, thrown inside `@vitest/expect` | 4 | the guard firing — **red** |
| `ReferenceError`, thrown in `src/` or `rig/` | 3 | our code deciding — **red**, and see below |
| `Error: STACK_TRACE_ERROR`, thrown in `@vitest/runner` | **1** | the runner giving up — **the catch** |

⚠️ **THE THREE `ReferenceError`s ARE A WEAKER RED AND THEY ARE NAMED HERE RATHER THAN FIXED.** 0090,
0126 and 0135 each break a file into throwing — `PHRASE_SECONDS is not defined` — so the module dies
*before* the guard asserts. That is our code deciding rather than the runner giving up, so it passes;
but it proves the break makes something explode, not that the guard discriminates. **They now print
that sentence on every run**, which is what makes them a list somebody can work rather than a worry.

The other limit, stated rather than hidden: **this names one package path**. A vitest that
restructured its internals would start counting timeouts as red again and say nothing, which is the
direction that costs — so `tests/prove-guard.test.ts` pins `@vitest/runner`'s existence on disk.

## ⚠️ The one catch was real, and the cause was in the guard rather than the probe

0031's *the resize path left ungated* has been reporting `red` for as long as it has existed, and the
guard was never asked: the test died on vitest's own 30-second timeout. Established rather than
rerun, per [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) — **run alone, off the
load of a full `prove`, with its five siblings all reddening on assertions, it still hung.**

⚠️ **`page.waitForFunction(fn, arg, options)` TAKES THE OPTIONS THIRD.** All three waits in
`tests/orientation.browser.test.ts` passed `{ timeout: 5_000 }` in the `arg` slot, where it is handed
to the predicate and ignored. Every one ran to Playwright's **30-second default**, which is also that
test's own `}, 30_000)` — so vitest won the race by eleven milliseconds, and a deadline the suite
states in three places had never once been enforced.

| | before | after |
|---|---|---|
| the guard green | 5.5 s | 5.5 s |
| the guard with the break in | **30.0 s, vitest timeout** | **10.4 s, `page.waitForFunction: Timeout 5000ms exceeded`** |

⚠️ **AND THE BREAK IS SMALLER THAN IT WAS.** `if (false) { setPlayable(false); return; }` dropped the
early RETURN as well as the gate, so a rotation fell through to `bakeAtlas` for a view nobody will
see — `onResize`'s own comment calls that *"the one expensive thing a resize can do"*. That was my
first explanation for the hang and it was **wrong**: dropping the resize listener entirely hung it
too, which is what pointed at the deadline. The break is now `setPlayable(true)`: the claim by itself.

## ⚠️ What this does NOT do, and the sentence is load-bearing

**It does not explain the disagreement at `05c4e16`.** That evidence is gone — it was never written
down. What this changes is that the next one is a diff instead of a dead end: six hundred and
eighty-six lines of *what the guard actually said* land in every CI log, so two machines that
disagree can be compared on the quantity rather than on the verdict.

⚠️ **It does make the leading candidate concrete, though.** One probe in this repository was already
passing on a runner timeout, found on the first run of the new arm. Whatever happened at `05c4e16`,
*a `red` that is a timeout* is no longer a hypothesis about this harness.

⚠️ **The probe at the centre of it is already re-aimed and that was always a separate thing** —
[0172](0172-a-place-opens-with-its-own-four.md) opened `arp` at Ember Nebula's `run` and the place got
faster underneath its own break. What was not fixed is the guard-of-guards, and that is this.

## What this is not

**Not a claim that CI is wrong and this machine is right.** Either could have been; nothing here
decides it.

**Not a retry, a rerun or a tolerance.**
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) is explicit that a rerun is not
evidence, and this adds no way to ask twice.

**Not a check on how long a guard takes.** A probe cannot redden a test for being slow —
[0115](0115-a-probe-runs-its-own-guard.md) says so about its own cost, and it is still true. What is
refused is a slow test's failure being *counted*, not the test being slow.

## Confirmed, not assumed

Per 0005, the new mechanism's own failure modes were broken on purpose and watched. The probes are in
`scripts/probes/0177-a-red-is-a-verdict.mjs`; the guards they redden are in `tests/prove-guard.test.ts`,
which imports the verdict as a pure function.

| broken on purpose | went red |
|---|---|
| the verdict check dropped, so any failure with the right title counts as the guard firing | `THE ONE THIS IS FOR: a guard that timed out is NOT a guard that was seen to fail` |
| the throw site read as the whole stack, which is the rule a timeout defeats | `and the difference is WHERE IT WAS THROWN, because a timeout names the suite too` |
| every library counted as machinery, so an assertion chai threw is not the guard speaking | `and an ASSERTION is a verdict wherever chai threw it, which is not where the guard is` |
| the fourth arm reached without asking whose failure it is, so another test's timeout answers for this guard | `and the arms stay in this order: no such guard, not this guard, no verdict, red` |

⚠️ **The second and third rows are the two refuted rules, restored exactly** — `find` → `findLast`,
and `@vitest/runner` → `node_modules`. A mistake that a real run had to catch is worth a probe, not a
paragraph.

⚠️ **One thing here is NOT probed and it is named rather than left as a gap**, on 0115's precedent:
`runSuite` carrying the message out of the report is not reachable from a unit test — it is not
exported, and it needs a real vitest run to have a report to parse. What stands in for a probe is that
dropping it is self-announcing: an empty message makes the verdict false for *every* failure, so the
next `npm run prove` reports `NEVER REACHED ITS CLAIM` on all six hundred and seventy-nine probes
rather than on none. Loud, and the wrong way round from the class 0005 is about.

## Rollback

Nothing shipped moves: no storage key, no save field, no service-worker cache prefix, no origin, and
**no file under `src/`**. This is `scripts/prove-guard.mjs`, its suite, two probe files and one browser
test's argument order. Reverting the commit restores the previous verdict exactly, at the cost of
`red` going back to meaning *some failure with the right title* — and of 0031's mid-run rotation guard
going back to never being asked.
