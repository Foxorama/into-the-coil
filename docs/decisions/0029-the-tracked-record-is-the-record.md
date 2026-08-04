# 0029 — The tracked record is the record: reports are files, milestones duplicate, restatements cite

**Accepted 2026-08-04.** [0016](0016-a-hub-enumerates-kinds.md) says one fact has one home in code.
This says the same thing about prose, and settles where each kind of prose lives.

## The rule

**1. A report is a committed file: `reports/<topic>-YYYY-MM-DD.md`.** Chat evaporates between
sessions. A finding that exists only in a conversation has not been recorded, however carefully it
was written.

**2. A milestone record duplicates; it never originates.** `docs/milestones/` is a select list to
review at the end of the project, not a live reference for the current one. If a lesson exists only
there, **that is a defect in the tracked record** — promote it to a decision first, then let the
milestone repeat it.

**3. A document that restates another cites the line; it does not summarise it.** A summary is a
second copy, and a second copy drifts.

## Why milestones must not originate — and why they stay ignored

The gitignore already names the cost of ignoring them: *"gitignored means machine-local… the whole
point of them is to be read by the NEXT project."* The tempting fix is to track them. That is the
wrong fix, and this decision refuses it.

A milestone record's job is to be **readable in an hour at the end of the project** — a short set of
"what this cost, what went wrong, what would make the next one faster." The alternative is what the
predecessor produced: over a hundred thousand lines of accumulated archive in which the important
things are present and unfindable. Making a milestone the authority for anything forces it to grow
toward completeness, and completeness is exactly what destroys its only advantage.

So the duplication between `docs/decisions/` and `docs/milestones/` is **deliberate and is the
price**, not an accident to be tidied away. What makes the price worth paying is clause 2: once
nothing is unique to a milestone, ignoring the folder costs nothing at all. The leak was never that
milestones are gitignored — it was that they were allowed to be the only home for something.

### The audit this immediately triggers, and its result

Every lesson currently in `docs/milestones/NEXT-TIME.md` that constrains *this* repository was
checked against the tracked tree. Most had already graduated, which is the reassuring half:

| lesson | tracked in |
|---|---|
| build guards in two halves, prove each with a break the other cannot see | [0025](0025-the-frame-budget-is-counted-not-timed.md) |
| when a guard fires on first real code, suspect the guard before the pattern | [0025](0025-the-frame-budget-is-counted-not-timed.md) |
| an import guard must decide type-vs-runtime explicitly | [0015](0015-the-layer-ladder.md), [0026](0026-the-first-frame-the-page-draws.md) |
| set `NODE_ENV=production` wherever the test rig builds | [0010](0010-the-build-under-test-is-the-build-that-ships.md) |
| a decision restating another must cite rather than summarise | clause 3, above |

⚠️ **One did not, and is named here rather than left found-and-forgotten: *push first, arm auto-merge
second — never the reverse and never in one command*.** A merge queue takes what it has the moment
checks go green, so a PR can report merged having left the commit you just pushed on the branch; it
was caught only because `scripts/tidy.mjs` compares the merged sha against the branch head. The
*setting* is tracked in `.github/expected-settings.json`; the **ordering** is not tracked anywhere.

Its home is the pull-request template rather than a decision of its own, on
[0001's enforcement argument](0001-revertability-not-risk-rating.md): an affordance at the point of
use beats a rule in a document nobody re-reads. **Owed, and deliberately not done in this decision** —
it is a change to a process surface and belongs in its own diff.

## Why "cite, don't summarise" belongs in this decision

Because it is the same rule as the other two: one fact, one home. It has been paid for twice.

In the predecessor, a summary of a fix described a script as having *"printed no chromium and exited
0"* — the failure mode of sixty-four *other* scripts, borrowed and pinned on this one because it made
a better story. The claim reached **a chat summary, a commit message, a PR body and a source comment
on `main`** before anyone re-read the file. The machine-checked guard was precise; the prose around it
drifted toward the more dramatic version.

And in this repository, inside a single day: a decision summarised `docs/game.md` rather than citing
it, and *"auto-fire is on"* became *"the whole arsenal fires itself"* — in the file whose entire job
is to be the durable record.

**A test that names the file cannot be talked into a better story. A summary can.**

## What was rejected

**Tracking `docs/milestones/`.** Argued above: it would force the records toward completeness and
destroy the property that makes them worth writing.

**`IDEAS.md` and `DEVLOG-IDEAS.md`.** Deferred rather than refused. Both were load-bearing in the
predecessor and both will earn a place here — but [milestone 0003](../milestones/0003-the-line-before-the-game.md)
already caught this constitution referencing an `IDEAS.md` that did not exist, which is the exact
failure a file created before it has contents produces. The trigger is contents, not a date.

**A guard over any of this.** See below.

## What has no guard, stated rather than assumed

None of the three clauses is guarded, and clause 2 **cannot be** by anything that runs in CI:
`docs/milestones/` is gitignored, so a tracked test cannot read it on a runner. A test that skips
when the directory is absent would be worse than none — a conditionally-skipped test is a test you do
not have, and that specific pattern silently cost the predecessor fifty tests for months.

So clause 2 is enforced by re-reading, at the moment a milestone record is written, which is also the
moment the lesson is freshest. Named as a gap, per
[0028](0028-quality-is-the-constraint.md) clause 4 and
[milestone 0004](../milestones/0004-the-game-appears.md)'s *a prose document has no guard*.

Clauses 1 and 3 are *partly* mechanisable and deliberately not mechanised yet: a scan could assert
that `reports/` is not gitignored, or that a decision naming another document also links it. Neither
has a second caller yet — the admission rule
[`tests/one-description.test.ts`](../../tests/one-description.test.ts) states for the register applies
here too, and a guard against a fact nobody has re-derived twice is over-abstraction wearing a
guard's clothes.
