# 0033 — A branch starts at `main`, and the next one waits

**Accepted 2026-08-05.** Lands `scripts/check-base.mjs` and a step in the required CI job. A process
decision, from measured evidence rather than from taste — it is the first rule here proposed *after*
the cost it prevents had already been paid.

## The rule

**A pull request's base is `main`. Always.** No PR is opened against another branch, and the next
branch is not started until the last one has landed.

Refused in CI, before `npm ci`, by `scripts/check-base.mjs`.

## The evidence, which is the whole argument

One session, eight PRs. Grouped by what the branch was based on:

| branch | based on | what happened |
|---|---|---|
| #39 | `landscape-is-shipped` *(open)* | `CONFLICTING` the moment #38 squashed. Rebase; force-push blocked; recovered by merging `main` in and resolving by hand |
| #41 | `ship-moves` *(open)* | **Auto-closed** by GitHub when its base was deleted on merge. Reopened as #44 |
| the touch branch | `ship-moves` *(open)* | Rebase onto `main` tried to replay nine already-merged commits. Aborted, cherry-picked three, and verified the result tree-identical by hand |
| #40 #43 #44 #45 #46 | `main` | Clean rebase, merged first attempt |

**Every stacked branch failed. No `main`-based branch did.** Nothing was lost, but only because each
recovery ended in a `git rev-parse ^{tree}` comparison against the pre-rebase state — the safety came
from checking, not from the process.

## Why stacking is fatal *here* rather than merely untidy

Two repository settings, each right on its own:

- **Squash merge.** [0001](0001-revertability-not-risk-rating.md) chose it because a squash is a
  single revertable unit. It also rewrites the branch's history into one new commit, so every commit
  a stacked branch shares with its base becomes an orphan with a different sha.
- **`delete_branch_on_merge: true`.** Keeps the branch list honest — and deletes the base out from
  under any PR pointed at it, which GitHub resolves by **closing that PR**.

Together they mean a stacked PR is not *harder* after its base lands. It is broken, and sometimes
closed, with no warning at the moment of stacking.

## Rejected: one change per PR

The rule that was actually proposed, and it does not match the data. **Size ran the opposite way:**
#43 was the largest PR of the session — twenty files, three input devices, fifty-two new assertions —
and merged on the first attempt. #39 was three commits and cost the most hours. The variable that
separated success from failure was the base, not the diff.

It would also make things worse. More PRs in flight is more opportunity to stack, and each one costs
a full CI cycle; splitting #43's touch, gamepad and composer would have produced a PR adding a
composer with one device to compose, which is a change nobody can review on its own.

**What survives of the instinct is the serialisation**, and that is in the rule above: the next
branch waits. That is what stops there being anything to stack onto.

## Rejected: merge commits for stacked branches

Technically sound — a merge commit preserves history, so a stacked branch rebases cleanly afterwards.
Rejected because it makes the merge strategy a per-PR decision made *before* anyone knows whether a
branch will be stacked onto, and because it trades away the property 0001 chose squash for. Not
stacking costs nothing and needs no one to predict the future.

## Rejected: a branch-protection rule instead of a check

GitHub cannot express "base must be `main`" as protection. The nearest thing is a required check,
which is what this is.

## Why the logic is a script and not a line of YAML

⚠️ **Because a condition written inline in the workflow can never be seen to fail.** `npm run prove`
edits a file and runs a vitest suite; it cannot reach a step that only executes on GitHub. An inline
check would be permanently in the state [0005](0005-a-guard-must-be-seen-to-fail.md) exists to
refuse — green forever, and unknown.

`scripts/check-base.mjs` splits the decision from the exit, so `tests/base.test.ts` drives the
decision directly and a probe can break it. The same file also asserts that the workflow **calls**
the script, in the required job, before `npm ci` — because a correct script nobody runs is precisely
the shape `scripts/verify-deploy.mjs` was in when it went stale a day ago.

⚠️ **It runs first, before `npm ci`.** Five seconds to catch a stacked PR instead of four minutes.

## What this deliberately does not decide

**How large a PR may be.** Rejected above, and nothing replaces it — the unit that matters is the
decision a PR lands, which [0029](0029-the-tracked-record-is-the-record.md) already makes every PR
name.

**Whether work can be prepared in parallel.** Branches may exist; what may not exist is a *pull
request* against something other than `main`. Local work on top of an unmerged branch is a rebase
away from fine, and the check fires at the only moment it matters.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0033-base.mjs`.

| broken on purpose | went red |
|---|---|
| the base check accepting anything, so a stacked PR sails through | `THE ONE: refuses a base that is another branch — the stacked PR` |
| the refusal reduced to a rule with no remedy | `says what to do about it, because a refusal with no next step is a wall` |
| an empty base treated as a failure, which blocks every release run | `ignores an empty base, which is every run that is not a pull request` |
| the workflow no longer calling the script — a correct guard nobody runs | `calls scripts/check-base.mjs from the required job` |
| the check moved after `npm ci`, spending the cycle it exists to save | `THE ORDERING ONE: runs it before npm ci, so a stacked PR fails in seconds` |

⚠️ **The last two probes are the ones this decision would fail without.** The script's own logic is
easy to get right and easy to test. The failure that actually happens to guards in this repository is
that nothing calls them — which is how `scripts/verify-deploy.mjs` spent a day describing a manifest
value that had changed underneath it.
