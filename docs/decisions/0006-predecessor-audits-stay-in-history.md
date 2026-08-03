# 0006 — The predecessor audits stay in git history

**Accepted 2026-08-03.** No rule follows from this; it exists to answer a question a future reader
will otherwise ask.

## The decision

`901674f` added three extraction audits of the predecessor project plus the scaffold plan — 5,262
lines analysing a *different* codebase. `eb747dd` removed them from the tree and gitignored them.
Both commits are on the public remote.

**History is not rewritten.** They stay where they are.

## Why

The requirement was never "purge the analysis"; it was **don't carry it forward into this project**.
That is already true and verifiable — every current tree is free of them, and they are gitignored
on disk:

```
git ls-files          # 23 files, none of them audits
git status --ignored  # docs/extraction/, docs/scaffold-plan.md → !!
```

Against that, a `filter-branch` plus force-push over public history is itself an irreversible
surface by [0001](0001-revertability-not-risk-rating.md)'s own test — a rollback note nobody could
honestly write — in exchange for a benefit that is now zero. Applying our own rule gives the
answer.

## Cost, named

The repository's history permanently contains a long analysis of another game. Someone reading back
through it will find golf. This file is what they will find next.

## What does carry forward

`docs/decisions/`. The audits' durable conclusions arrive there as decisions, one at a time, as the
phases that need them land — not as a document to be inherited and re-read.
