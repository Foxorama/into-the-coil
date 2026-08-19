# 0177 — A red is a verdict, and not any failure with the right name

**Accepted 2026-08-19.** [0005](0005-a-guard-must-be-seen-to-fail.md) says a guard that has only ever
been green is not known to work. This is about the other half of that sentence: **a guard seen red for
a reason nobody read is not known to have fired.**

It answers the item the previous session left at the top of `docs/state-of-play.md`:

> *"`npm run prove` called a probe red on CI and `wrong test` here, on a tree `git diff` says is
> byte-identical, and I couldn't explain it. Until that's understood, every 'seen red' in the repo is
> worth slightly less than it says."*

## The rules

**A probe's `red` means the named test reached a verdict.** A failure raised by the machinery around
the test — a timeout, a crash, an unhandled rejection — is a fourth outcome, `NEVER REACHED ITS
CLAIM`, and it fails `npm run prove` rather than passing as proof.

**The verdict is the throw site: the FIRST frame, not the stack.**

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

## ⚠️ THE FIRST VERSION OF THE RULE WAS WRONG, AND THE MEASUREMENT IS WHY IT DID NOT SHIP

*The failure's stack names the suite* is the obvious rule. It is also wrong: a timed-out test's stack
**still carries the frame for its own `it(...)` declaration**, so the suite is named — at the bottom.

```
Error: STACK_TRACE_ERROR
    at task (file:///…/node_modules/@vitest/runner/dist/chunk-artifact.js:1784:27)
    …
    at C:/into-the-coil/tests/themes.test.ts:738:3          ← the it(), not the throw
```

⚠️ **This is [0027](0027-measure-the-picture-not-the-model.md) inside the proof harness**: a rule
about a quantity, checked against the constant it was derived from, agreeing with itself. What caught
it was staging a real timeout and reading the bytes. `tests/prove-guard.test.ts` now holds that stack
verbatim, with the assertion `expect(TIMEOUT).toContain('tests/themes.test.ts')` above the one that
matters, so the wrong rule cannot come back looking reasonable.

## ⚠️ And *the assertion specifically* is a different rule, not a tidier one

`AssertionError:` on the first line is simpler than parsing a frame and states a stronger claim — *the
guard's own `expect` fired*. It was refused. **Sixteen places under `tests/` refuse by throwing** —
*"the ship never died — the fixture is not measuring what it says it is"* — and a fixture's refusal is
the suite reaching a verdict about the world, which is the thing being asked about. Reading those as
*never reached its claim* would have turned working probes red for being right.

The limit, stated rather than hidden: **a `beforeAll` that throws is raised in the suite too**, and
would still read as `red`. Nothing in this repository has one.

## ⚠️ What this does NOT do, and the sentence is load-bearing

**It does not explain the disagreement at `05c4e16`.** That evidence is gone — it was never written
down. What this changes is that the next one is a diff instead of a dead end: six hundred and
seventy-nine lines of *what the guard actually said* land in every CI log, so two machines that
disagree can be compared on the quantity rather than on the verdict.

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
| the fourth arm reached without asking whose failure it is, so another test's timeout answers for this guard | `and the arms stay in this order: no such guard, not this guard, no verdict, red` |

⚠️ **One thing here is NOT probed and it is named rather than left as a gap**, on 0115's precedent:
`runSuite` carrying the message out of the report is not reachable from a unit test — it is not
exported, and it needs a real vitest run to have a report to parse. What stands in for a probe is that
dropping it is self-announcing: an empty message makes the verdict false for *every* failure, so the
next `npm run prove` reports `NEVER REACHED ITS CLAIM` on all six hundred and seventy-nine probes
rather than on none. Loud, and the wrong way round from the class 0005 is about.

## Rollback

Nothing shipped moves: no storage key, no save field, no service-worker cache prefix, no origin, and
no file under `src/`. This is `scripts/prove-guard.mjs`, its suite and its probes. Reverting the commit
restores the previous verdict exactly, at the cost of `red` going back to meaning *some failure with
the right title*.
