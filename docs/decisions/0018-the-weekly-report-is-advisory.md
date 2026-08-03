# 0018 — The weekly report is advisory, and its window is a count

**Accepted 2026-08-04**, recording what was already built. `scripts/hotspots.mjs` and
`.github/workflows/hotspots.yml` shipped with CI in `7625686`, and the two commits that have touched
them since moved action and Node versions rather than behaviour. The behaviour's reasoning lived only
in `docs/scaffold-plan.md`, a gitignored file whose own rule is to lose each section as it resolves.
Same failure `docs/machine.md` was created to fix, same fix.

## The rule

The weekly report is a **ranking, not a gate**, and it does not become one:

- **Advisory.** It gates nothing, so there is nothing to game and no reason to relax it.
- **Two signals.** Touch rate — code only, living docs excluded. Net line growth — living docs
  included. Generated files are excluded from both.
- **The window is a commit count** (150 by default), never a time span.
- **Ranked, not thresholded.** A threshold lands only when there is history here to validate it
  against, and it names what it was validated against in the same commit.
- **One rolling issue**, edited in place, weekly. Never one issue per run.

## Why advisory, when the whole point is that these two things went wrong last time

Because there is no PR to fail. The predecessor's `app.ts` and its constitution became attractors by
accretion over hundreds of commits, each one reasonable; a gate has to reject a specific diff, and
whichever diff happened to cross the line would be an arbitrary one to punish. That is the same
finding that killed the per-PR risk rating in [0001](0001-revertability-not-risk-rating.md) — the
instrument was built for the large deliberate change, and neither of these failures is one.

A gate nobody can act on gets relaxed, and a relaxed gate is worse than no gate: it teaches you that
red means nothing. Advisory is not the weak option here, it is the honest one.

## Why two signals, when either sounds sufficient

Neither is. **Touch rate finds attractors:** the predecessor's `app.ts` was touched by 35.2% of all
commits while a file of the same size beside it was touched by 0.6% — sixtyfold difference in cost,
identical line count. *Line count does not predict pain; touch rate does.* But its `CLAUDE.md` was
touched by 67.3% of recent commits **by design**, so touch rate alone would have watched it
quadruple and said nothing. **Net growth caught that at +1,682 lines.** Hence living docs are
excluded from touch, where they are noise, and kept in growth, where they are the entire point.

Generated files are excluded outright from both, because one of them drowns everything: the census
found a single committed build artifact at **+10,594 lines in one commit**.

## Why the window is a commit count

The first draft said `--since='7 days ago'` and argued a time window "means the same thing at any
velocity". That is exactly inverted. A time window is the one that **fails to hold the denominator
constant**: at two PRs a day, "last 7 days" is ~14 commits, and any percentage fires on a file
touched twice. A count is the same denominator in a fast week and a slow one.

## Rejected: importing the predecessor's thresholds

`touch > 10%` is a good number. It was validated against a 150-commit window **on that repo**, where
it flagged exactly six files and no noise. It was still rejected, because calibration does not
travel: this repo had **nine commits** when the script was written, and importing the number would
have been an unvalidated threshold wearing a validated one's clothes.

⚠️ **The 150 survived; the 10% did not** — and the split is the transferable part. What the
calibration work established was the *size of window* a percentage needs to mean anything, which is
a fact about arithmetic. What it did not establish is which files in *this* repo are anomalous,
which is a fact about a codebase that did not exist yet. A ranking cannot be miscalibrated, and it
is useful from commit twenty rather than commit one hundred and fifty.

## Rejected: one issue per run

An advisory that arrives every Monday and accumulates becomes wallpaper, which fails the same way a
relaxed gate does — the failure the report exists to avoid, reproduced by its own delivery. So the
workflow opens the issue once and edits it thereafter. Weekly, for the same reason: a report you get
daily is a report you stop reading.

**Cost, named:** the issue holds only the latest report, so week-over-week movement is not visible in
it. Accepted — git holds the history, and any past report is reproducible by checking out that
commit and running the script.

## Not confirmed by breaking it, and why that is correct

[0005](0005-a-guard-must-be-seen-to-fail.md) does not apply: nothing here is a guard, so there is no
red to see. What stands in its place is that the report **announces its own worst failure mode**. A
shallow checkout would produce a one-commit report that looks exactly like a real one, so
`hotspots.yml` sets `fetch-depth: 0` and the script prints a low-history banner below 40 commits —
under a depth-1 checkout, `n` is 1 and the banner fires. The defect is loud rather than tested,
which is the most a non-gate can offer.

So this file carries no *Confirmed, not assumed* table and no `scripts/probes/0018-*.mjs`, and that
is an absence rather than a gap: [0019](0019-a-probe-must-be-seen-to-apply.md)'s harness proves that
a named guard reddens when broken, and there is no guard here to redden. The one thing that could be
proven — that a shallow checkout trips the banner — is a property of a GitHub Actions checkout depth,
which the harness cannot stage against the working tree.

## What this report cannot see

Admin-UI settings, which never enter git and so have neither a touch rate nor a line count. That gap
is [0004](0004-admin-settings-must-be-read-back.md)'s, and `scripts/settings-drift.mjs` is the
instrument for it. The two are complements: this one watches the repository, that one watches
everything around it.

## No rule follows

Per the [README](README.md) — forward-only, and a decision needs no rule. The two instructions a
future session actually needs are already at the point of use: the threshold rule is in the header
of `scripts/hotspots.mjs`, and the rolling-issue rule is in the comment above the step that opens it.
Restating either in `CLAUDE.md` would move it *down* the ladder — from repo content that must be read
in order to change the thing, to prose in a document nobody re-reads — while making the constitution
longer, which is the one pressure its preamble and the forward-only rule exist to hold off.
