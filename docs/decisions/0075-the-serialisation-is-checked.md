# 0075 — The serialisation is checked

**Accepted 2026-08-08.** Adds the missing half of
[0033](0033-a-branch-starts-at-main.md)'s check. No product change.

## The rule

**0033's rule is unchanged. It is now checked in full.**

[0033](0033-a-branch-starts-at-main.md) is titled *"A branch starts at `main`, **and the next one
waits**"* and its body is explicit about which clause is load-bearing:

> *"What survives of the instinct is the serialisation, and that is in the rule above: the next
> branch waits. **That is what stops there being anything to stack onto.**"*

`scripts/check-base.mjs` checked the first clause and nothing checked the second. **Four PRs open at
once are four PRs based on `main`, and every one of them passed.**

## What went wrong, and why nothing caught it

Reported, as a quality problem rather than a preference:

> *"Make sure you merge every PR before starting a new PR, this PR piling up bullshit is getting to be
> a pita and it's poor form quality that's going to introduce real issues at some point."*

⚠️ **The tell was not a failure. It was work being done AROUND the problem**, which is why it ran for
four PRs without anything going red:

| what happened | what it should have been |
|---|---|
| 0073 cited `reports/medium-played-2026-08-07.md` as a bare path with a note saying *"it becomes a link when the report is on `main`"* | a link |
| the report cited 0072 as a PR number with the same note, pointing the other way | a link |
| `docs/state-of-play.md` was deliberately **not edited** on two branches, because [`the-list-that-doubled-itself-twice`](../../reports/the-list-that-doubled-itself-twice-2026-08-07.md) says that file cannot be edited from more than one | the handover, updated by the change that changed it |
| a whole PR — #100 — existed only to pay off the three items above | nothing |
| two previews each held half the game, and needed a paragraph explaining which | one preview |

⚠️ **None of that is a merge conflict**, and that is the point. `git merge` cannot see a document
citing another as *not yet linkable*; it cannot see a section nobody dared write. The failures 0033
predicts arrive as **prose that has been shaped around the situation**, and prose is exactly what no
tool in this repository diffs semantically.

⚠️ **It also produced the class of bug this project has already paid for once.** The handover has
doubled itself twice from parallel branches, and the report about it says *"read it before editing
this list from more than one branch."* The correct response to that warning is not to edit carefully
from several branches — it is to have one.

## The check

`pileUpProblem(open)`, beside `baseProblem(base)` in the same script, given the count by the workflow:

```
open=$(gh pr list --state open --json number --jq 'length' 2>/dev/null || echo "")
node scripts/check-base.mjs "<base ref>" "$open"
```

⚠️ **One is the healthy state, because this PR is in the count.** Zero is what a run outside a pull
request reports and is not a pile-up.

⚠️ **It fails OPEN on anything it cannot read.** A `gh` that is missing, a token without the scope, an
API blip — none of those are a reason to block a change, and advisory infrastructure that can take a
repository down is worse than the thing it guards. A non-number is *"could not ask"*.

⚠️ **It runs before `npm ci`, with the base check**, on the same reasoning 0033 gives: a mechanical
mistake costs nothing to detect and four minutes to detect late.

## Why a check rather than a rule, given the rule already existed

`docs/scaffold-plan.md`'s instruction ladder puts **remove the affordance** at the top and calls it
*"the only tier that reliably works"*, above making the repo agree and far above writing a rule down.
0033 wrote the rule down. It was then followed for weeks and abandoned in a single session by
somebody who had read it — which is the ladder's own prediction about its bottom rung, arriving on
schedule.

The affordance cannot be removed here: GitHub will always let a second pull request be opened. What
is available is the rung below it, and this is that.

## What it deliberately does not do

**It does not stop parallel BRANCHES.** 0033 already draws that line — *"branches may exist; what may
not exist is a pull request against something other than `main`"* — and the same applies here.
Preparing work locally on top of unmerged work is a rebase away from fine.

**It does not close anything, or merge anything.** It reports and fails. The recovery is a merge
button on the older PR, and if that is wrong then the two changes wanted to be one.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0075-serialisation.mjs`.

⚠️ **The half that rots is the workflow calling it**, exactly as `tests/base.test.ts` already warns
about its sibling: *"a perfect script nobody runs is the shape `scripts/verify-deploy.mjs` was in when
it went stale — correct, and describing a fact it had stopped being told about."* So the probe breaks
the wiring as well as the logic.
