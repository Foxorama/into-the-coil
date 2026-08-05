# 0038 — The handover is a file, and it holds pointers rather than findings

**Accepted 2026-08-05.** From a question at the end of a long session: *"have we got that recorded so
the next session can pick it up and run with it?"*

The honest answer was **no, and only for one half of it.**

## The gap

[0029](0029-the-tracked-record-is-the-record.md) is thorough about *findings*: a report is a
committed file because chat evaporates, a decision holds the reasoning, a milestone duplicates and
never originates. Every one of those is backward-looking — they record what was learnt.

**Nothing had a home for what to do next.** The plan, the sequencing, and the reason for the
sequencing lived in a conversation, which is precisely the thing 0029 says is not a record. A next
session reading `CLAUDE.md` → `docs/machine.md` → `docs/game.md` would find the rules, the machine
and the product, and nothing at all about where the work had got to.

⚠️ **It was reconstructable and that is not the same as recorded.** The reports are dated and
sequential, so a diligent reader could have inferred the state by reading nine of them in order. A
handover that requires an archaeology pass is a handover that will not happen.

## The rule

**`docs/state-of-play.md` holds what is settled, what is next, and why in that order.** Tracked,
maintained, and rewritten as things land — unlike a report, which is dated and left alone.

⚠️ **It holds POINTERS AND INTENTIONS, never findings.** Every conclusion in it is a link. That
constraint is the whole design, and it is there because 0029 names the exact hazard this file walks
into: *"a document restating another cites the line rather than summarising it; a summary is a second
copy, and one drifted here inside a single day."*

A status document is a summary generator. The only version of one that survives is the version that
cannot state a conclusion — so if a reader finds themselves explaining a result there rather than
linking it, the result belongs in a report and the link belongs in the file.

## Why not somewhere that already exists

**`docs/scaffold-plan.md`** did this job for the scaffold and is the closest analogue. It is
gitignored, explicitly *"not maintained past RELEASE"*, and its own rule is to delete sections as
they resolve. It is also about the scaffold rather than the game. Reusing it would put the game's
forward state in a document scheduled for deletion — the same mistake `docs/machine.md` was extracted
to avoid.

**`docs/game.md`** is what the game *is*. Status is not product definition, and mixing them makes the
one document that must stay short enough to read before every session grow a section that changes
weekly.

**`docs/milestones/`** is explicitly refused: gitignored, *"duplicates and never originates"*, and
*"a select list to read at the end of the project, **never** a reference for the current one."*

**`reports/`** refuses it in its own README: *"not a status update, and not a summary of a session
that went normally."*

⚠️ Four documents each declined this job for a good reason, which is how the gap survived this long.

## The guard, and the failure mode it covers

`tests/links.test.ts`: every relative markdown link in the repository resolves.

The rule that everything cites rather than summarises trades one failure mode for another. **A
summary drifts silently; a citation rots silently** — a link to a renamed decision reads exactly like
a link that works, and the reader who follows it finds out months later, in the middle of something
else. A file whose entire content is links needs that check more than anything else in the project.

It deliberately does **not** check anchors or external URLs: heading text is edited far more often
than filenames, and a guard that fires on ordinary prose edits is a guard someone switches off.

## Rejected: recording open PRs and branch state

The obvious content for a handover, and the fastest thing in the project to go stale. `gh pr list` is
the truth and takes one second; a list in a file is wrong the moment anything merges. The file says
to run it instead.

## What this deliberately does not decide

**How often it is rewritten.** Every rule this project has about *when* to write something down —
0029's milestone-when-it-lands, 0005's break-it-first — exists because a deferred record is a lost
one. This one gets the same instinct and no mechanism: it is rewritten when the answer to *"what is
next"* changes, and nothing can check that.

---

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0038-handover.mjs`.

| broken on purpose | went red |
|---|---|
| a citation pointed at a decision that does not exist, which is how every rotted link looks | `every relative link in every markdown file resolves, in a clean checkout` |
| a tracked document citing gitignored working material, which resolves here and nowhere else | `every relative link in every markdown file resolves, in a clean checkout` |
| a settled row explaining its result instead of citing where it is recorded | `cites on every settled row rather than summarising` |

⚠️ **The scan was green on its first run over ~60 existing cross-references**, which is the shape
0005 refuses to trust. It is proved two ways instead: the probes above, and assertions inside the
test that run the extractor over a link, an anchor, an external URL and a fenced example — so a typo
in the pattern fails immediately rather than passing forever over prose written to satisfy it.

## ⚠️ It was green because it asked the wrong question, and CI said so

The first version checked the **filesystem**. It passed here and failed on the first clean checkout,
because **four decisions cite `docs/milestones/`, which is gitignored** — 0023, 0025 and 0029 twice.
Those citations had been dead for every reader except the one person who could not tell, since the
files exist on the machine that wrote them and in no clone.

So *"does it exist"* is the wrong question and **"is it in the repository"** is the right one. The
scan now asks git.

⚠️ **The rule runs one way only.** A tracked document may cite only tracked material, because a clone
has nothing else. An untracked one — `docs/milestones/`, `docs/scaffold-plan.md`, `docs/machine.md` —
is machine-local working material by definition and may cite its equally machine-local neighbours
freely. The first attempt at the fix missed that and flagged every milestone citing another
milestone, which is the over-firing that gets a guard switched off.

The four dead citations are repaired as plain references rather than links. The reference is real;
the target is simply not something a reader can be sent to.

**This is the strongest argument for the guard that could have been made, and it was made by the
guard.** A rule that everything cites rather than summarises had been quietly accumulating
unfollowable citations for five decisions, and nothing in the project could see it — including the
first version of the test written specifically to look.
