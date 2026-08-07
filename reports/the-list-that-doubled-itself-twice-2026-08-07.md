# The list that doubled itself twice

**2026-08-07.** A post-mortem on `docs/state-of-play.md`, which grew a second copy of its own work
list, was repaired, and then grew a third copy of three items before the day was out.

## What happened

The second play-test list is fourteen items in the player's words. Nine of them were built in one
session, each as its own branch off `main`, each landing its own decision and probes —
[0033](../docs/decisions/0033-a-branch-starts-at-main.md) forbids stacking, so every branch was cut
from a `main` that did not yet have any of its siblings in it.

Every one of those branches did the right thing and marked its item done in `docs/state-of-play.md`.

**The first doubling.** Six PRs each appended their item to a list that, on their base, still showed
it as not started. `git merge` took both — items 1, 2, 3, 7, 8 and 9 each appeared twice, once with a
✅ and a decision link, and once as the original ask. Repaired alongside
[0068](../docs/decisions/0068-a-run-over-is-a-continue.md).

**The second doubling, hours later.** Three branches were still in flight when that repair merged.
They had been cut before it, so their copy of the list still had the pre-repair shape, and their
merges reinstated exactly what the repair had removed — items 3, 4 and 5, doubled again. Repaired the
same day.

## Why the merge could not have caught it

Nothing here is a conflict. Both sides of every one of these merges are *correct about their own
item*: the branch says "3 is done" because on that branch it is, and `main` says "3 is not started"
because when the branch was cut it was not. They touch different lines of the same list, so the merge
is clean, and the result is a document that says both.

This is the failure mode [0038](../docs/decisions/0038-the-handover-is-a-file.md) is about, arriving
by a route it did not anticipate. 0038's concern is a status document that *drifts* — that goes stale
and quietly stops matching the code. What happened instead is worse and reads better: the file was
never stale. Every line in it was written by somebody who had just done the work it describes, and it
still contradicted itself, because **two true statements about the same item at two different times
merge into one document that asserts both as current.**

⚠️ **A reader cannot tell which half is live.** Out-of-date is a state a reader can detect — the dates
are wrong, the links are dead, the code has moved. Self-contradictory is not: both halves cite real
decisions, both are formatted identically, and the only tell is that the numbers in a numbered list
stop ascending.

## What would have caught it

Nothing did, either time. Both were found by reading.

**The tell is cheap and mechanical**: a numbered list whose numbers do not ascend. `3, 4, 5, 3, 4, 5`
is not a list anybody wrote on purpose. That is a guard's worth of signal and it is not written,
because the shape of the fix matters more than the detection — see below.

**A guard was considered and is not obviously right.** The list is prose in a gitignored-adjacent
tracked document with no schema; a check that parses ordered lists out of Markdown and asserts they
ascend would fire on every legitimately interrupted list in the repository, and there are several
(`docs/game.md` numbers its levels beside its bosses). The version that is narrow enough to be safe —
only this file, only this section — is a guard over one document's current shape, which will be wrong
the next time the section is renamed. **Recorded as a known gap rather than guarded**, on
[0028](../docs/decisions/0028-quality-is-the-constraint.md)'s terms: the assumption is discharged by
naming what would check it, not by pretending it is checked.

## What is actually worth carrying

**Append-only survives concurrent branches; edit-in-place does not.** The *Landed* table in the same
file took six concurrent additions across the same period and never doubled, because every branch
added a row and none of them rewrote one. The item list doubled because marking an item done means
editing the line that describes it, and two branches editing the same line's *meaning* on different
bases is not something a three-way merge has any way to reconcile.

**So the rule is about where the ✅ goes, not about remembering to update the file.** Every branch did
remember. If the done-marker were a row appended to a separate table rather than a rewrite of the
item, both doublings would have been a merge of two appends — which is the case git handles.

⚠️ **Not acted on here.** Changing the list's shape mid-project trades a known problem for an unknown
one, and the list is nearly finished: all fourteen items are done, so the next edit to it is likely to
be its deletion. The finding is worth more to the next project than to this one, which is what
`docs/milestones/NEXT-TIME.md` is for.

## The one-line version

**Two true statements about the same thing at two different times merge cleanly into one document
that asserts both.** Concurrency does not only produce conflicts; it produces agreement between
statements that were never meant to be read together.
