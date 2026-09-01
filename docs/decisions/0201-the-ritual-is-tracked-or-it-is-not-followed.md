# 0201 — The ritual is tracked, or it is not followed

**Accepted 2026-08-28.** [0029](0029-the-tracked-record-is-the-record.md) says a report is a committed
file because chat evaporates. [0198](0198-the-accessibility-pass-comes-after-the-game.md) is what
happens when that is ignored: a rule decided out loud, never written down, **enforced wrongly by every
session for weeks and paid for in three art decisions.** This applies the same test to the *procedure*
rather than the record.

> *"You ran 543 commits and dozens of PR merges across 85 sessions with a repeating ritual (branch →
> implement → proof harness → decision record → PR → merge → handoff doc)."*
> — the usage report over 2026-07-26 → 2026-08-24.

## The ritual exists and is reconstructed from memory every session

Every one of those merges followed the same sequence, and **none of it is written anywhere in this
repository.** It has been reassembled each session out of assistant memory notes — the branch must
start at `main` and the next one waits, auto-merge is armed at creation, the branch is re-read
immediately before the push because the checkout is shared, `npm run prove` runs locally at commit
time because the failure it catches is an orphaned probe anchor, the link guard skips untracked docs
so it is re-run after `git commit`.

⚠️ **Those notes are machine-local and outside git.** They are the same fragility as
`docs/machine.md`, but unlike `docs/machine.md` nobody chose it — it happened by default. The rules
they encode are already decisions here ([0033](0033-a-branch-starts-at-main.md),
[0019](0019-a-probe-must-be-seen-to-apply.md), [0038](0038-the-handover-is-a-file.md),
[0001](0001-revertability-not-risk-rating.md)); what is missing is the **order they are applied in**,
which is not derivable from any of them individually.

## ⚠️ `.claude/` was untracked entirely, and that was never a decision either

`git ls-files .claude` returns nothing. The two files in it — `launch.json` and
`settings.local.json` — are excluded through `.git/info/exclude`, which is **itself untracked**, so a
clone inherits neither the files nor the exclusion. That is a live hazard rather than a tidy
arrangement: `settings.local.json` carries a snapshot of this machine's `PATH` (`docs/machine.md`
explains why), and nothing tracked prevents a future `git add -A` from committing it.

So the exclusion moves into the tracked `.gitignore` where it travels, and the parts of `.claude/`
that are *about the project rather than the machine* become tracked files like any other.

## The rules

- **`.claude/skills/` and `.claude/settings.json` are tracked.** They describe how this project is
  worked on, and a clone needs them for the same reason it needs `CLAUDE.md`.
- **`.claude/settings.local.json` and `.claude/launch.json` are ignored by the tracked `.gitignore`**,
  because they describe this machine — [0004](0004-admin-settings-must-be-read-back.md)'s distinction
  between a setting and a claim about one.
- **The merge ritual lives in `.claude/skills/ship/SKILL.md`.** It originates nothing: every step
  cites the decision it comes from, which is [0029](0029-the-tracked-record-is-the-record.md)'s *a
  document restating another cites the line rather than summarising it.*

## The hook, and why it is the cheap half

`.claude/settings.json` runs `npm run typecheck` after every file edit. It was measured before it was
chosen — **811 ms on this tree** — against an edit loop where the same error otherwise surfaces
minutes later inside a full `npm run check`.

⚠️ **It must not be believed without reading a log it wrote.** node is not on the Bash tool's `PATH`
here, and `docs/machine.md` records an entire class of failure — the MSIX `AppData` redirection —
found only by a log the failing process wrote itself, after four correct-sounding theories had been
shipped. A hook that silently never fires is [0199](0199-a-verdict-is-an-exit-code.md) in a new
costume, so the hook appends its exit code to `.claude/typecheck.log`, and that file is ignored.

## The costs, named

- **A tracked hook runs in every session in this repository, including one that did not ask for it.**
  It is one typecheck, it cannot modify the tree, and it is deleted by deleting four lines.
- **A skill can go stale in the way `docs/state-of-play.md` cannot**, because nothing reads it back.
  It is held only by the same link guard every other document is —
  [0038](0038-the-handover-is-a-file.md) — which catches a rotted citation and not a rotted step.
  That is a real gap and is not guarded.
