# 0454 — A worker tree is the checkout, and nothing beside it

**Accepted 2026-10-02.** Amends [0054](0054-the-proof-runs-beside-the-work-not-on-it.md)'s *"it
copies gitignored files too, which is load-bearing"*, which no longer holds; the rest of 0054 stands.

## The rule

**A worker tree holds what `git ls-files --cached --others --exclude-standard` lists, and is a file on
disk — the tracked, and the work git would add — plus `.git` and a linked `node_modules`.** Nothing
ignored, and no checkout nested inside this one. `checkoutFiles` in `scripts/prove-guard.mjs` is the
list; it is taken once and every worker is offered the same one.

## The failure

`npm run prove` in `C:\into-the-coil` stopped before its first probe:

> `EPERM: operation not permitted, symlink 'C:\into-the-coil\node_modules' -> '…\w0\.claude\worktrees\agitated-nash-38b187\node_modules'`

The copier was `cpSync` over the whole directory, skipping only the top-level `node_modules` and
`dist`. So it walked into `.claude/worktrees/`, where every other session's checkout keeps its own
`node_modules` junction, and Windows refused to recreate one. The way round it meanwhile was proving
from a clean detached worktree with a junction of its own.

⚠️ **THE JUNCTION WAS THE LOUD HALF. THE SIZE WAS THE QUIET ONE.** Measured on the main checkout:

| per worker | files | size |
|---|---|---|
| the old copy | 7,212, and 4 junctions | **825.5 MB** |
| `checkoutFiles` | 1,248 | **15.9 MB** |
| `.git`, copied either way | 586 | 30 MB |

The difference is 650 MB of `.wav` renders at the root, 60 MB of `shots/`, and the other sessions'
worktrees — copied up to six times per proof. 0054 measured a tree at *"5 MB and 550 files"*; it had
grown by a factor of a hundred and fifty without anyone asking it to.

## Why the ignored files can go

0054 kept them for one probe: 0038's second, which cites `docs/scaffold-plan.md` from a tracked
document so that the links guard fires on its *"exists here, GITIGNORED"* half rather than its
*"nothing there"* half.

⚠️ **THE GATE NEVER HAD THAT FILE.** CI's checkout is a clone, and an ignored file is in no clone, so
on every PR since 0054 that probe has gone red on *"nothing there"* — the half the other probe in the
same file already proves. The half 0054 copied ignored files to reach was proven on one machine only,
and only when the whole proof ran there, which since
[0434](0434-the-whole-proof-is-cis.md) is never.

So that probe now cites `../dist/index.html`. `dist/` is ignored, and it exists in every worker before
the links suite runs — built before the first warm probe, and by `tests/globalSetup.ts` on every cold
one — here and in CI alike. Seen, in a tree built by `checkoutFiles`, with and without a `dist/`
placed in advance: both times *"docs/state-of-play.md → ../dist/index.html (exists here, GITIGNORED —
no clone has it)"*. The half 0054 wanted is now proven by the gate for the first time.

**And no other guard can need an ignored file**, for the same reason: CI has none, so such a guard is
already red on `main`. The baseline still runs in the real tree, where ignored files exist; a guard
green there only because of one would be red in the gate first.

## What was rejected

**Skipping `.claude/worktrees` by name.** It fixes the report and leaves the 650 MB, and it is a list
of places that rots the first time something else nests a checkout — the next one would be another
EPERM, found the same way.

**Copying ignored files and skipping ignored directories.** It keeps every `.wav` and draws the line
by the shape of the ignore rule rather than by what a worker needs.

**`git worktree add` instead of a copy.** 0054's reason stands: it carries what is committed, and
the proof judges the work.

## ⚠️ Noticed, not changed

**A worker made from a linked worktree shares its index.** There `.git` is a file naming the main
repository's `worktrees/<name>`, so six copies of it point at one index — the thing 0054 copies
`.git` to avoid. Proofs have been run from worktrees for weeks and none has been seen to collide;
what would show it is an `index.lock` error from a worker. It is untouched here because nothing in
this change makes it more or less likely.

## Confirmed, not assumed

Probes in `scripts/probes/0454-a-worker-tree-is-the-checkout.mjs`; the guards in
`tests/prove-guard.test.ts` ask `checkoutFiles` of a real repository holding one of each thing the
main checkout held — a tracked file, a new one, a tracked file deleted in the work, ignored renders
and screenshots, and a `git worktree` inside it.

| broken on purpose | went red |
|---|---|
| only tracked files listed, so a new file not yet added is not in the tree being proven | `and the work not yet added, which is what the proof exists to judge` |
| the ignore rules not applied, so every render and screenshot is copied into every worker | `and nothing gitignored is copied — no render, no shot` |
| anything that exists offered for copying, so a nested checkout is copied as a directory | `THE ONE THIS IS FOR: another checkout inside this one is another repository, and is not copied` |
| only directories skipped, so a tracked file deleted in the work is offered for copying | `and a tracked file deleted in the work is not offered for copying` |

`npm run prove 0454` and `npm run prove 0038` both ran in trees this change built: 4 red and 3 red,
every tree back to what it was copied as.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). `scripts/`, `tests/` and documents.
