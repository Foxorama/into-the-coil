# 0432 — The whole proof is CI's, and the one before the push is the change's own

**Accepted 2026-10-01.** Asked for after [0420](0420-the-ci-is-sharded-and-joined.md) took CI to five
minutes and the proof before the push stayed at two hours:

> *"adding proof's for new changes has seemed like high value and catches things almost every piece of
> work, but 2hrs local time vs 5mins ci time is a helluva diff"*

**Amends [0201](0201-the-ritual-is-tracked-or-it-is-not-followed.md)'s ritual**, step 4 of
`.claude/skills/ship/SKILL.md`, which is decided here rather than in the skill.

## The rule

**Before the push, prove the change's own decision — `npm run prove <NNNN>` — and not the whole set.
The whole suite and the whole proof are the required check's, and they run on every PR.**

Before the push:

| run | why it stays |
|---|---|
| `npm run typecheck` | seconds, and the commonest red there is |
| the suites the change touches | what the work is about, read while it is still open |
| `npm run prove <NNNN>`, when the change adds probes | its own guards seen to fail — the thing the quote says catches something almost every time |

## Why the whole proof before the push stopped paying

**CI was not made cheaper; it was spread out.** 0420 deals the suite over six runners and the probes
over ten, three workers each. The same work on one machine is `npm run check`, then the whole suite
again as the proof's baseline — the question 0419 stopped CI asking twice is still asked twice here —
then every probe at most six at a time (`scripts/prove-guard.mjs`, the `workers` line).

**And the required check already runs all of it.** `test` joins every suite shard and every probe
shard and refuses anything less than every probe red; the PR is armed to auto-merge, and a red does
not merge. So a full proof before the push is the gate run twice, the first time at twenty-four times
the wall clock, to save a round trip that now costs about five minutes.

## What the filtered proof still does

**Every probe's anchor is checked, not only the decision's.** `main()` runs `anchorFailures` over the
whole set before anything is copied or run, with the reason written beside it: *the probe an edit
strands is almost never one belonging to the decision being worked on.* The ritual named a stranded
anchor as the failure the proof most often catches, and that half is seconds.

**What moves to CI** is the other half: an edit that leaves some other decision's guard green with its
break in. CI's probe shards find it, in the same five minutes.

⚠️ **A change that adds no probe has nothing to filter to**, and `prove` refuses an empty filter. CI's
probe shards run the same anchor check first, before any suite, so a stranded anchor there fails in
the shard's first minute rather than at its end.

## Why this is not 0344's refusal again

[0344](0344-a-probe-runs-warm.md) refused *proving the diff* — selecting which probes **the gate**
runs — because a sound selector selects 92% and a cheap one stops proving what drifts. Nothing here
selects for the gate: CI still runs every probe on every PR. What is dropped is a local copy of the
gate, which never decided anything the gate would not.

## What was rejected

**Keeping the whole proof before the push "for a shared quantity".** The state of play asked for it —
*guards stop reaching their subject without ever going red, and only a full run sees it* — and that
stays true: the full run is CI's, and it sees it. What was an argument for running it at all is not
one for running it twice.

**Raising the local worker cap past six.** It halves nothing that CI does not already do, and a second
session's proof on the same machine already times out baselines —
0344's *one proof at a time*.

## ⚠️ Not measured

**The new step's wall clock on this machine is unmeasured.** It is typecheck, a few suites, and one
decision's probes with their suites' baseline, which is minutes by construction, and the next PR shipped
under it is its first measurement. The two hours and the five minutes are the ones measured: the
five is `gh run list` on #455's run, 21:41 to 21:46.

## No probe, and why

A step in a document, like [0408](0408-the-ritual-tidies.md). *Whether someone ran the full proof
first* is not a thing a probe can redden, and what the step leaves to CI is held by 0420's own probes.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A decision, a skill, and a line in the
state of play.
