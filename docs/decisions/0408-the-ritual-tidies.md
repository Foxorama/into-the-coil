# 0408 — The ritual ends by tidying, because a tool nobody runs is a document

**Accepted 2026-09-29.** Asked for on 2026-09-08, after a session left six merged branches behind:

> *"delete the branch if it's not needed, let's just bake that in that branches get properly cleaned
> up"*

It was written that day as 0281 on a branch that was never pushed, and the number went to
[another decision](0281-a-boss-guards-its-own-back.md). Found again in
[the review of what never landed](../../reports/the-unlanded-work-2026-09-29.md), with sixty local
branches and twenty-three emptied worktree directories as the evidence that the step was still missing.

**Amends [0201](0201-the-ritual-is-tracked-or-it-is-not-followed.md)** by adding a step to
`.claude/skills/ship/SKILL.md`, which 0201 requires be decided here rather than in the skill: *"The
ritual originates nothing — every step cites the decision it comes from."*

## The rule

**`npm run tidy` is the last step of shipping**, run after a PR merges, in the same breath as
rewriting the handover.

## The tool already existed and was not being run

`scripts/tidy.mjs` fast-forwards `main`, proves each branch merged **by reading its PR** rather than by
a patch-id heuristic, deletes the ones that are provably on `main`, keeps everything else with a stated
reason, and prunes worktrees. `scripts/probes/tidy.mjs` breaks its judgements.

It is not mentioned in the ship ritual, in `CLAUDE.md`, or in `docs/state-of-play.md`. That is
0201's own argument arriving a second time: the ritual exists because it *"was previously reassembled
from memory every session"*, and a step that is not in the tracked ritual is where the whole ritual
used to be — available, sensible, and skipped.

## What it changes about tidy

`scripts/probes/tidy.mjs` says in its header that tidy has no decision record because it is a tool and
not a rule. That was right while running it was a judgement call. **The ritual running it makes it a
rule**, which is why this file exists rather than a line quietly appearing in the skill. The tool's
reasoning still lives in its header, and nothing here restates it —
[0029](0029-the-tracked-record-is-the-record.md).

## What is not changed

**Tidy's own conservatism.** It keeps a branch that is checked out in a worktree, a branch with commits
not on `main` and no merged PR, and a branch whose head has moved past the sha its PR merged. This does
not widen any of that, and a step that ran it with a `--force` of any kind would be
[0200](0200-the-tool-that-edits-must-not-lose-what-it-edits.md) backwards.

**Nothing is deleted from a remote.** A remote branch is GitHub's `delete_branch_on_merge` —
[0033](0033-a-branch-starts-at-main.md).

**It does not remove a worktree directory.** `git worktree prune` forgets a worktree whose directory is
gone; a directory left holding only a `node_modules` junction is not gone, and deleting through a
junction would delete the target. Those are removed by hand, and 0200 says how.

**And it is not put in CI.** The branches pile up in a working checkout, which is where the step
belongs.

## ⚠️ No probe, and why

This adds no guard. It adds a step to a document. *Whether someone ran the script* is not a thing a
probe can redden, and claiming otherwise would be [0005](0005-a-guard-must-be-seen-to-fail.md) with
the meaning taken out. The part that can be wrong — tidy's classification — is already probed.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A decision and a line in a skill.
