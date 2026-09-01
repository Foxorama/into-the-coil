# 0200 — The tool that edits must not lose what it edits

**Accepted 2026-08-28.** The half of [0199](0199-a-verdict-is-an-exit-code.md) that has no artifact to
guard. 0199 holds the shape of a tracked shell step; **this holds the shell nobody commits**, which
is where three separate sessions lost work.

> *"heavy ad-hoc Bash means quoting and escaping bugs eat cycles"*
> — the usage report over 2026-07-26 → 2026-08-24, which counted the shell as the largest category of
> friction originating outside the model.

## The three losses, each of which actually happened

1. **A heredoc silently rewrites what it carries.** `cat <<EOF` interpolates `$`, backticks and
   backslashes unless the delimiter is quoted, and the damage is invisible at the call site: the file
   is written, the command succeeds, and a regex or a code fence quietly lost its contents. **This
   decision was written with the `Write` tool for exactly that reason** — its own text is dense with
   backticks, and a heredoc would have eaten them while reporting success. The repository already
   carries a cousin of this in `docs/machine.md`, which has to say *after editing `dash.cmd`, run
   `node scripts/crlf.mjs dash.cmd`*, because every tool in the chain rewrites line endings.
2. **A regex re-anchor orphans what it does not match.** Re-pointing probe anchors or comment blocks
   by pattern rather than by exact string left a dangling half-comment that broke module parsing —
   and the failure surfaced somewhere unrelated, long after the edit.
3. **A destructive git command took a branch its session did not own.** A `git worktree remove` and a
   force-push each destroyed work belonging to a *concurrent* session. This is the observation behind
   [0033](0033-a-branch-starts-at-main.md)'s second half — *and the next one waits* — approached from
   the tooling side rather than the branching side.

## ⚠️ There is no guard here, and pretending otherwise would be worse than the gap

[0192](0192-a-guard-holds-an-invariant.md) asks what content a guard would hold. For (1) and (3) the
answer is **nothing in this repository**: the damage happens in a shell, before any artifact exists,
and a green tree is exactly what it leaves behind. A guard that scanned for the string `<<EOF` would
redden on a correct use and miss `node -e`, `sed`, and every other tool with its own quoting — it
would fail 0192's test on both sides at once.

**(2) is the exception and is already held.** `anchorFailures` in `scripts/prove-guard.mjs` refuses
any probe whose `find` no longer resolves, and `planEdit` refuses one that matches more than once —
[0019](0019-a-probe-must-be-seen-to-apply.md). The rule below adds nothing there; it says why the
tool that *makes* those edits should not be a regex in the first place.

So this is a rule with no guard, and the reason is written down rather than left to be rediscovered.
0192 permits exactly this — *the fix names the guard, the rule, or the reason neither is worth it* —
and this names the reason.

## The rules

- **Source, docs and anything holding a backtick or a backslash are written with `Write`/`Edit`, not
  with a heredoc, `node -e`, or `sed`.** A shell is for running things, not for authoring them.
- **An edit anchors on an exact unique string, never a pattern.** If the anchor is not unique, make
  it unique rather than making the pattern cleverer.
- **A command that can destroy another session's work — force-push, branch delete, `worktree remove`,
  `reset --hard` — lists what would be lost and stops for an answer.** The branch this session owns
  is re-read immediately before every push, because the checkout is shared and the session is not.

## The cost, named

The first rule is slower for the case it is aimed at, and that is the point: it trades a few seconds
per edit against a class of damage whose defining property is that it is invisible until much later.
It is a working practice held by being read, which is a weaker instrument than a guard — and the
honest expectation is that it will be broken occasionally and caught by review rather than by CI.
