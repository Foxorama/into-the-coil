# 0019 — A probe must be seen to apply, and the confirmation table must be re-runnable

**Accepted 2026-08-04.** Extends [0005](0005-a-guard-must-be-seen-to-fail.md), which is not
superseded — this is the mechanism 0005 always needed.

## The rule

**A guard is broken on purpose by a declared probe, not by hand.** Probes are data in
`scripts/probes/<decision>-<slug>.mjs`; `npm run prove` applies each one, runs the suite, and checks
that the *named* test went red. It runs in CI, inside the required `test` job.

The harness refuses to continue in four cases, and the first is the whole point:

| refusal | what it catches |
|---|---|
| the `find` string does not appear, or appears twice | **the probe is stale or ambiguous and changed nothing** |
| the bytes on disk are identical after applying | the write went somewhere else |
| the suite stays green | the guard does not fire on what it exists to catch |
| a *different* test goes red | the break landed somewhere other than where it was aimed |

Every decision carrying a **Confirmed, not assumed** table must have probes behind it, or a row in
`WITHOUT_PROBES` saying why not. That map is asserted to shrink: a decision that gains probes must
lose its excuse.

## Why prose was not going to fix this

`NEXT-TIME.md` already carried the rule — *"write mutation harnesses in a real language, bash
word-splitting will report guards as proven while changing nothing"* — earned from five separate
incidents on day one. **It then happened twice more in the very next session, in the session that was
citing it.** Once with a `node -e` one-liner whose backslashes did not survive the shell, once with a
bash loop that wrote the literal text `${probe%%|*}` into every probe file and printed `=== $name
===` as its own header.

That is the ladder in `docs/scaffold-plan.md` behaving exactly as it predicts. A rule in a document
is its weakest tier; the affordance — a shell one-liner, always closer to hand than anything else —
wins. The Flux rule failed the same way and for the same reason.

⚠️ **And the previous answer was wrong, which is the more useful finding.** "Use a real language"
does not help: `node -e` *is* a real language and it failed identically, because in both cases the
shell owns the quoting before the language ever sees the string. The fix is to put the probe in a
file no shell parses, and to make the harness **read the target back** before it will run anything.

## Why the failure is invisible without this

A probe that changes nothing produces a green suite. A guard that is correctly proven also produces
a green suite — after the restore. The two states are identical in the test runner's output, and the
only place the difference is visible is in the shell's own echo, which is exactly what nobody is
reading at that moment. This is decision 0005's failure shape turned one level inward: not a guard
that is vacuous, but a *proof* that is.

## Why it runs in CI, and why in the existing job

A confirmation table is a claim about a session that happened once. Six months later the guard it
describes may have stopped firing — a pattern edited, a scan re-scoped, an assertion made vacuous by
a refactor — and the table still reads as evidence. Running the probes on every PR is what keeps the
tables true rather than historical. It is decision [0004](0004-admin-settings-must-be-read-back.md)'s
rule pointed at a guard instead of at a repository setting: a ✅ in a document is a claim, a command
is evidence.

It is a **step in the existing `test` job**, not a job of its own. A new job is a new status context,
which is a branch-protection change to make it required — and an unrequired check blocks nobody and
therefore rots. Twenty-two probes cost about twenty seconds.

## Rejected: a source scan banning hand-rolled mutations

The obvious shape, and it cannot work. The failing probes were **typed into a terminal**; they were
never files, so no scan over `src/`, `tests/` or `scripts/` could ever have seen them. A row in
`tests/one-description.test.ts` scanning for them would pass vacuously forever, which that file's own
header names as a failure mode. The affordance is removed by making the correct path *shorter* than
the wrong one — `npm run prove 0016` beats writing a loop — not by prohibiting the wrong one.

## Rejected: a probe per assertion, generated from the test file

Deriving probes from the guards would keep them in step automatically. Rejected because a generated
break is a break the author did not choose: the value of the table is that someone decided *this
specific plausible mistake* is the one worth catching — `Record<string, …>` rather than a random
character flip. A stale hand-written probe is caught by the first refusal above, loudly, which is
cheaper than a generator that mostly makes uninteresting mutations.

## The hole, named rather than papered over

Six earlier decisions — 0002, 0007, 0008, 0009, 0012, 0014 — carry confirmation tables with no
probes, and each has a reason in `WITHOUT_PROBES`. They divide in two:

- **Would script today, not yet backfilled:** 0002's one-character `index.html` case change, 0012's
  workflow-YAML rows, 0014's `src/` and `PRIVACY.md` rows.
- **Genuinely cannot, as the harness stands:** anything asserting on a built `dist/` or driving a
  browser (0007, 0008, 0009), because the harness runs vitest against the working tree and does not
  build; and anything against the live repository or a deliberately broken live deploy (0012's
  verifier row, 0014's settings-drift row).

Teaching the harness an optional build step would move most of the second group. That is follow-up
work, and it is written here rather than left as six silent gaps.

## Confirmed, not assumed

The harness is a guard, so per 0005 its own failure modes were watched. A temporary
`scripts/probes/9999-selftest.mjs` was added, run, and deleted:

| broken on purpose | the harness said |
|---|---|
| a probe whose `find` string is not in the file | `PROBE FAILED` — *"the code moved and the probe did not. THIS IS THE FAILURE THIS HARNESS EXISTS FOR"* |
| a probe that plants a harmless file | `STILL GREEN` — *"the guard does not fire on the thing it exists to catch"* |
| a probe that reddens a guard other than the one it names | `WRONG TEST`, printing both the expected and the actual |

All three exited non-zero and the tree was restored. The two checks that produce the first row are
unit-tested in `tests/prove-guard.test.ts`, so they hold on every commit rather than only on the day
they were written.

The twenty-two probes behind 0015–0017 were then run: **22 red, and green again afterwards.** The
tables in those three decisions are now generated by the command, not typed from memory.
