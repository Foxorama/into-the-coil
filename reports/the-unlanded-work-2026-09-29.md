# The unlanded work — 2026-09-29

Asked: *"apparently there's a whole bunch of uncommitted changes stashed or something, like hundreds of
them. can you review, report and then implement anything that still needs to be implemented."*

## What was actually there

**No uncommitted changes and no stashes.** `git status` and `git stash list` were empty in the main
checkout and in all nine registered worktrees. `C:\Golf-Stars` has 19 uncommitted files and is not this
project.

What had piled up instead:

- **60 local branches**, 34 of which `node scripts/tidy.mjs --dry-run` proves merged by their PR.
- **23 directories `C:\into-the-coil-*`** that git no longer knows about, each holding nothing but a
  `node_modules` junction: `arc art bob boss bullets death eagle frost frost2 gyre homing hydra medusa
  mid quetzal serpent serpent2 serpent3 shuriken sig volcano waves wt`.
- **Two finished branches that were committed and never pushed**, and four pieces of work that were
  started, set aside, and never picked up again.

The branch pile is the defect [0408](../docs/decisions/0408-the-ritual-tidies.md) repairs: tidy existed
and the ritual never ran it.

## Every branch with commits not on `main`

Checked by applying each branch's diff to `origin/main` in reverse, then by commit message, decision
number and merged-PR search where the code had moved on.

| branch | verdict | evidence |
|---|---|---|
| `the-boss-is-met-armed` | **finished, never pushed** | 0405 + 0406; applies to `main` with one import conflict |
| `an-update-waits-for-startup` | **finished, never pushed** | its number, 0392, was taken; lands as [0407](../docs/decisions/0407-an-update-waits-for-the-browser-to-finish-starting.md) |
| `the-ritual-tidies` | **missing** | the user's ask of 2026-09-08; lands as 0408 |
| `claude/vigilant-spence-9d2e1a` | **half missing** | the verdict half is `verdictOf`'s `ran === 0` arm; the build-error half lands as [0409](../docs/decisions/0409-a-failed-build-says-what-failed.md) |
| `keep/enemies-animate` | **missing** | 0280 ends *"enemies get real baked frames"*; only the drifter was drawn and nothing reached `main` |
| `the-bullets-are-seen` | 0260–0264 landed as #307–#311; **0265 missing** | [0264](../docs/decisions/0264-the-real-bosses-are-drawn.md) says the bullet report *"get[s] its own decision"*; no `muzzle` flare exists |
| `the-enemies-animate` | landed | its tip is an ancestor of `main` |
| `keep/album-cover-wip`, `keep/black-heart-listen-23` | landed | #382; `main`'s versions are newer |
| `per-level-beat` | superseded | [0159](../docs/decisions/0159-the-two-clocks-come-apart.md) |
| `the-serpent-is-a-chain` | landed | #327 |
| `wip-corridor-turns`, `wip-walls-bite` | landed | patch-ids identical to #393 and #392 |
| `the-handover-carries-the-music-plan` | landed | its section is in `docs/state-of-play.md` |
| `the-album-plan` | landed | its diff applies to `main` in reverse |
| `one-pilot-a-level`, `the-serpent-has-menace` | landed | #301, #322 and 0277's *"the neck is a waist"* |
| `a-special-is-the-guns-own`, `the-pickups-float` | landed | commits past their merge are #415 and #338 |

## The order they land in

One PR at a time — [0033](../docs/decisions/0033-a-branch-starts-at-main.md).

1. **0405 + 0406**, the play report about surges and mid-bosses. It is the one the player is waiting on.
2. **0407 + 0408 + 0409**, with this report. Tooling only, so one proof covers all three.
3. **Enemy frames**, the owed half of 0280.
4. **0265's muzzle flash**, re-measured against the bullets as they are now. Bullets have changed
   since 0265 was written ([0295](../docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md) and
   the place-coloured bullets), so its halo half is re-examined rather than replayed.

## Left for the player

- **The 23 emptied directories.** Deleting through a junction deletes its target, so each one is
  removed with `rmdir` on the junction first —
  [0200](../docs/decisions/0200-the-tool-that-edits-must-not-lose-what-it-edits.md) says to list them
  and ask, and they are listed above.
- **The branches tidy keeps** once these land: the `keep/*` and `wip-*` branches are landed or
  superseded by the table above, but tidy keeps them because no PR merged them. Deleting them is a
  branch delete, which is also 0200's to ask about.
