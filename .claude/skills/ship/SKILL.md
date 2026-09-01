---
name: ship
description: Land a change as a proven, auto-merging PR. Use when a change is ready to become a branch, a decision record and a merged pull request in this repository.
---

# Ship

The merge ritual for Into the Coil. **This file originates nothing** — every step cites the decision
it comes from, per [0029](../../../docs/decisions/0029-the-tracked-record-is-the-record.md). If a step
here disagrees with a decision, the decision wins and this file is wrong.

Written down because it was previously reassembled from memory every session —
[0201](../../../docs/decisions/0201-the-ritual-is-tracked-or-it-is-not-followed.md).

## 0. Before anything

**node is not on PATH.** Every command below needs this first, in every new shell:

```bash
export PATH="/c/Users/foxor/AppData/Local/gf-node/node-v24.17.0-win-x64:$PATH"
```

`docs/machine.md` (gitignored) explains why, and what to do when that path moves.

**Read `docs/state-of-play.md` before proposing the work** —
[0038](../../../docs/decisions/0038-the-handover-is-a-file.md).

## 1. One PR at a time

```bash
gh pr list --state open --json number,headRefName,mergeStateStatus
```

If one is open, **stop and wait for it.** A branch starts at `main` and the next one waits —
[0033](../../../docs/decisions/0033-a-branch-starts-at-main.md). Stacking is not harder here, it is
broken: squash plus `delete_branch_on_merge` orphans the stacked history and closes its PR.

While waiting, build the next change and hold it as a patch rather than a branch.

## 2. Branch from a fresh `main`

```bash
git checkout main && git pull --ff-only && git checkout -b <name>
```

Never base a branch on another branch. CI refuses it before `npm ci` (`scripts/check-base.mjs`).

## 3. Implement

- **Write and Edit, never a heredoc, `node -e` or `sed`**, for anything holding a backtick or a
  backslash — [0200](../../../docs/decisions/0200-the-tool-that-edits-must-not-lose-what-it-edits.md).
- **Anchor edits on an exact unique string**, never a pattern.
- A rule added to `CLAUDE.md` **names the decision behind it**, and the reasoning lives in the
  decision, never in `CLAUDE.md`.
- A new guard holds an invariant, a budget names who owns its number, a taste goes in
  `tests/authored.ts` — [0192](../../../docs/decisions/0192-a-guard-holds-an-invariant.md).
- A new guard needs a probe under `scripts/probes/` that **breaks it on purpose** —
  [0005](../../../docs/decisions/0005-a-guard-must-be-seen-to-fail.md),
  [0019](../../../docs/decisions/0019-a-probe-must-be-seen-to-apply.md).

## 4. Prove it, and read the exit code

```bash
set -o pipefail
npm run check 2>&1 | tail -40; echo "CHECK_EXIT=${PIPESTATUS[0]}"
npm run prove 2>&1 | tail -40; echo "PROVE_EXIT=${PIPESTATUS[0]}"
```

**A verdict is the exit code, never the output** —
[0199](../../../docs/decisions/0199-a-verdict-is-an-exit-code.md). Without `pipefail` both of these
report `tail`'s status, which is zero for any input including none. Read the number.

`npm run prove` is slow — start it at commit time in the background. The failure it most often
catches is a probe anchor stranded by an unrelated edit.

## 5. Commit, then re-run the link guard

```bash
git add -A && git commit
npx vitest run tests/links.test.ts 2>&1 | tail -20; echo "LINKS_EXIT=${PIPESTATUS[0]}"
```

⚠️ **In that order.** `tests/links.test.ts` skips untracked files, so a new decision's own citations
go unchecked until it is committed. This is the single most common CI failure on this repository.

## 6. Push — after re-reading the branch

```bash
git branch --show-current
git push -u origin <name>
```

**Re-read the branch immediately before the push, every time.** The checkout is shared between
sessions and has been changed underneath one mid-task. **Never `git push HEAD:<branch>`** — it pushes
whatever is checked out to a name that may not be it.

Never force-push, delete a branch, or run `git worktree remove` without listing what would be lost
and asking first — [0200](../../../docs/decisions/0200-the-tool-that-edits-must-not-lose-what-it-edits.md).

## 7. Open the PR with auto-merge armed

```bash
gh pr create --base main --fill
gh pr merge --squash --auto
```

Arm it at creation. CI here runs 20–60+ minutes, so poll in the background rather than waiting.

**If the PR touches an irreversible surface** — an `itc_*` storage key, the save schema, the service
worker cache prefix, the origin, anything already shipped — **the body carries a rollback note**.
Nothing else does — [0001](../../../docs/decisions/0001-revertability-not-risk-rating.md).

## 8. After it merges

- Rewrite `docs/state-of-play.md`: what is settled, what is next, why in that order. **Pointers and
  intentions, never findings** — [0038](../../../docs/decisions/0038-the-handover-is-a-file.md).
- Play-testing happens on a deployed URL, and staging is `main` only. Hand over the branch preview
  URL read off the check run — the documented alias truncates at 28 characters and 404s for most
  branch names.
- A milestone record duplicates and never originates —
  [0029](../../../docs/decisions/0029-the-tracked-record-is-the-record.md).
