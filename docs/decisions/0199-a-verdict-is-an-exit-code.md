# 0199 — A verdict is an exit code, and a pipe throws it away

**Accepted 2026-08-28.** A narrow addition to a family that is otherwise already complete:
[0005](0005-a-guard-must-be-seen-to-fail.md) holds a guard that cannot fail,
[0019](0019-a-probe-must-be-seen-to-apply.md) a probe that does not apply,
[0115](0115-a-probe-runs-its-own-guard.md) and [0177](0177-a-red-is-a-verdict.md) a red nobody read.
**This holds the last gap: the shell around them.**

> *"the dominant pattern is false verification — declaring work green when the check never really ran
> (swallowed exit codes, stale builds, unset env vars)"*
> — the usage report over 2026-07-26 → 2026-08-24, which counted this the largest single category of
> friction across 85 sessions.

## ⚠️ Most of what that report describes is already held, and saying otherwise would be the bug

This decision was nearly written three times as wide as it is. Before writing it, the harness was
read rather than assumed, and it turns out `verdictOf` in `scripts/prove-guard.mjs` already refuses
the headline case:

- **A suite that runs zero assertions** exits zero with no failures. `verdictOf` returns
  `NO SUCH GUARD` on `ran === 0`, and its comment names it *the new class* —
  [0115](0115-a-probe-runs-its-own-guard.md).
- **A test that crashed or timed out** reports a failed title without ever evaluating its claim.
  `verdictOf` returns `NEVER REACHED ITS CLAIM` — [0177](0177-a-red-is-a-verdict.md).
- **A probe whose anchor has moved** is caught by `anchorFailures` before any suite runs —
  [0019](0019-a-probe-must-be-seen-to-apply.md).

**So the rule this decision adds is deliberately one sentence wide**, and the reason is
[0029](0029-the-tracked-record-is-the-record.md): a fourth document restating *be careful about green*
would be a second copy of three that already exist, and would have prevented none of the failures
below, because in each of them the reader was being careful and the number was lying.

## The one thing genuinely unheld: `pipefail`

`npm run prove | tail -20` exits with `tail`'s status. `tail` succeeds on any input, including none.
The whole harness above — every verdict 0115 and 0177 buy — is discarded by one pipe.

⚠️ **The repository already knows this and wrote it down in the wrong form.**
`.github/workflows/settings-drift.yml` sets `set -o pipefail` and carries a comment explaining that
`node … | tee` reports `tee`'s status. **It is the only place in the repository that does**, and the
knowledge has been sitting there as prose in one file rather than as an invariant over all of them.
That is precisely the shape [0198](0198-the-accessibility-pass-comes-after-the-game.md) was written
about a week ago: a rule that exists in one place and is therefore not followed anywhere else.

The live example is from the session that produced this decision. `npm run typecheck` returned
**exit 127 in 26 ms with no output**, because node is not on the Bash tool's `PATH` here — a fact
`docs/machine.md` states in its first ten lines. Empty output and a fast return are what a clean pass
looks like. Piped into `tail`, it is a green.

## Why it is an invariant, not a taste

[0192](0192-a-guard-holds-an-invariant.md) sets the test: *name a change to the content that would
redden this and be CORRECT.* For a tracked shell step that pipes one command into another without
`pipefail`, there is no such change — it is either not checking what it claims to, or checking it by
luck. It fails hard.

## The rule

**A tracked shell step that pipes sets `set -o pipefail`**, and `tests/verdict.test.ts` holds it.

## The costs, named

- **The guard scans workflow YAML by line, not with a parser.** An exotic block style would defeat
  it. `scripts/probes/0199-verdict.mjs` breaks it in the two shapes this repository actually writes
  and no others; widening it is one edit and a reason.
- **It cannot reach an interactive shell**, which has no tracked artifact to hold. That half is a
  working practice, not a guard, and is written down as
  [0200](0200-the-tool-that-edits-must-not-lose-what-it-edits.md) with its lack of a guard stated
  rather than papered over.
