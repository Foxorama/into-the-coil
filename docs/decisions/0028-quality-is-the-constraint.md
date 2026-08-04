# 0028 — Quality is the constraint, and it is set before the work rather than inspected after it

**Accepted 2026-08-04.** The first rule in the constitution, above process, because everything below
it is a mechanism for holding this.

Scope is negotiable, schedule is negotiable, the feature list is negotiable. **The bar is not.** If a
thing cannot be done well it does not get done in a worse form — it gets named as not doable, early,
and something else happens instead.

## The rule

Four clauses, each attached to a moment rather than to an intention.

**1. Before building — pressure-test the idea.** If it is sound, say so and go. If it is not, push
back: name the premise that is wrong, and propose the better one. This applies to the project owner's
ideas and to mine identically; an idea's author is not evidence about it. *A cheerful yes followed by
a half-working result is the worst available outcome*, and it is also the cheapest one to prevent —
one sentence before the work, against a rewrite after it.

**2. While building — implement properly or stop.** *"This cannot be done cleanly because X, and here
is what I would do instead"* is a result, not a failure. Longer is acceptable. Not doable is
acceptable. A shortcut is not, and there is no tier below the bar for work to quietly land in —
[0001](0001-revertability-not-risk-rating.md) already refused to create one.

**3. After a miss — repair the class, not the instance.** Bad work is not reverted and forgotten. The
fix names what would have caught it: a guard, a rule, or an explicit decision that neither is worth
the cost. A miss that produces only a corrected file has taught the repository nothing.

**4. Throughout — an assumption is discharged or owed, never merely labelled.** A verified claim
names *what checked it*. An unverified one names **what would check it**, and whether that is owed.
And the case that decides whether this clause is worth anything: **an assumption load-bearing enough
that the work is wrong if it is wrong does not get to stand — it is checked, or the work stops until
it can be.**

⚠️ **The word *assumed* on its own is a free pass, and was the first draft of this clause.** A bare
tag cannot tell apart a claim that *cannot* be checked here — [0025](0025-the-frame-budget-is-counted-not-timed.md)'s
*"still owed: a hand measurement on a physical 2021-class device"* — from one that simply *was not*,
and it hands the second the first's credibility. That failure runs in a specific direction with an
agent doing the writing: a hedge is free to attach and reads as care, so the prose drifts toward the
most defensible version of itself exactly as
[0029](0029-the-tracked-record-is-the-record.md) records it drifting toward the most dramatic one.

**This is not a new mechanism. It is the one this repository already uses, twice.**
`// @setup: <why>` exempts a line in a hot file only with a reason of real length —
[0025](0025-the-frame-budget-is-counted-not-timed.md) refuses a hand-wave and exempts nothing for a
plain comment. `WITHOUT_PROBES` in [`tests/prove-guard.test.ts`](../../tests/prove-guard.test.ts)
exempts a decision from having probes only with a stated reason, and **fails the moment the
exemption outlives the gap it named**. Both say the same thing: *an exception names its reason and its
discharge, or it is a hole*. Clause 4 is that rule pointed at prose, where nothing can enforce it.

The predecessor's version was a sentence, never a tag — *"No real device has been shown a newer
save… the `corrupt` arm has never been seen in the wild, only synthesised."* That names the gap, its
shape, and what would close it, in one line. It is the standard.

## Why this is not "try harder"

This is the clause that decides whether the rule has teeth, so it is stated before the rest.

**The predecessor's most expensive failures were not caused by insufficient care.** Every one of the
eight bounce passes in [0027](0027-measure-the-picture-not-the-model.md) was careful, measured,
reproduced and green. Fifty browser tests skipped silently in CI for months while the number that
proved it sat in every run's output. A save-protection feature shipped, on the day it landed, a bug
of exactly the kind it was written to prevent. None of that is a diligence problem, and a rule that
reads as *be more diligent* would have prevented none of it.

So the four clauses above are deliberately about **when a decision is made and what has to be
produced at that moment**, never about effort:

| clause | the moment | what has to exist |
|---|---|---|
| 1 | before a branch | a stated verdict on the premise |
| 2 | at the point it gets hard | a named obstacle and an alternative, or a stop |
| 3 | after a defect | a guard, a rule, or a written reason for neither |
| 4 | at every claim | what checked it — or what would, and whether it is owed |

Quality-as-effort is unfalsifiable and therefore free. Quality-as-artefact is not.

## The bar, stated plainly

**The predecessor is the floor, not the target.** The Far Carry is a genuinely high-quality game
built in five weeks by a first-time developer, and matching it is not the goal — this project starts
with its architecture already extracted, its nine most expensive failures already written down, and
twenty-six decisions taken before the first game file. Starting from that and landing in the same
place would be the actual failure.

This is written down because a bar that is not written down drifts to whatever the current session
has energy for, and the drift is invisible from inside the session.

## Shift-left, concretely, in a repository that already does it

This decision mostly **names something the repository already practises**, which is why it can be
stated as a rule rather than an aspiration. Nineteen decisions landed before a game file existed.
[0005](0005-a-guard-must-be-seen-to-fail.md) refuses to trust a guard that has only ever been green.
[0019](0019-a-probe-must-be-seen-to-apply.md) refuses to trust a break that was typed at a shell.
[0002](0002-brand-identity-contract.md) froze the identity strings on day one because a persisted
string is a contract afterwards. Every one of those is quality decided at the cheapest moment.

Naming it matters because **the cheap moment is the one a session in a hurry skips**, and the cost of
skipping it is paid by a later session that cannot see what it inherited.

## What was rejected

**Quality as a review gate at the end.** The only failure mode this catches is the one a reviewer can
see in a diff, and [0001](0001-revertability-not-risk-rating.md) already measured that against ten
real incidents: four never passed through a PR at all, four were one-line changes any reviewer waves
through, two were accretion across hundreds of commits. A gate at the end would have caught none of
the ten.

**A quality rating on a PR.** Same family, killed by the same measurement, plus the objection 0001
raised and that applies twice as hard here: a self-rating rates what the author was thinking about,
and the risk is in what they were not.

**Restating what the tooling already enforces.** The predecessor's working agreement also carried *be
concise*, *front-load the options*, *don't drag the session out*, and *one feature per session/PR*.
The first three are enforced by the harness and cost lines here for nothing. The fourth was already
superseded by 0001, and the predecessor's own archive contradicted it in practice — its real rule was
**ship the risky layer alone**, which 0001 encodes better. Everything left in this decision is
something no tool does.

## What has no guard

**Clause 1 has no artefact in git**, and that is the honest gap: a pushback that happened lives in a
conversation, and a pushback that should have happened and did not leaves nothing behind at all. This
is the one clause that depends entirely on being read.

The other three do leave traces, which is what makes them checkable by hand later: clause 2 produces
a decision file where there would otherwise have been silence, clause 3 produces a probe in
`scripts/probes/`, and clause 4 produces the *not verified* sections this file and
[0027](0027-measure-the-picture-not-the-model.md) both carry.

⚠️ **Ranked honestly: aspirational.** No failure in this repository is yet attributable to violating
it, and the extraction that recommended it ranked the predecessor's version the same way. It earns
its place anyway because it is the only rule here that says what all the others are *for*, and
because its cost is eight lines of constitution.
