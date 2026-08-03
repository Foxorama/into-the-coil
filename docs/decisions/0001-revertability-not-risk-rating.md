# 0001 — Revertability is a property of the diff, not a judgement about it

**Accepted 2026-08-03.** Supersedes the predecessor's "one feature per PR", which its own archive
already contradicted (one branch shipped three PRs' worth).

## The rule

A PR answers one **factual** question, never an estimate: does the diff touch an *irreversible
surface*?

- a storage key (`itc_*`) or the save schema
- the service-worker cache prefix
- the origin
- anything already shipped — an installed PWA, a pushed itch channel

**Yes → the PR carries a rollback note. No → it does not.** Quality does not vary with the answer;
there is no low tier for it to vary into.

## Why not a risk rating

A four-tier rating (low/medium/high/critical) was proposed and tested against every incident behind
this project's scaffold plan, asking what rating each PR would have carried *at the moment it was
opened*:

- **four never passed through a PR at all** — Pages source set to "deploy from a branch", the
  `github-pages` `main` ref rule, the unset output directory, the itch playable flag
- **four were one-line changes** any honest author rates lowest — browser tests skipping for
  months, `portrait` in a landscape game's manifest, the SW prefix disagreeing across three files,
  a stale launcher label
- **two were accretion** over hundreds of commits with no single PR to rate

**It would have caught none of the ten.** A rating is built for the large deliberate change; the
observed failure mode is the small change with invisible blast radius, and the setting that never
enters git.

Two further objections. Self-rating rates what the author *was* thinking about, and the risk is in
what they were not. And a rating has no consumer in a one-developer repo — tiers earn their keep
when something routes on them (a second approver, a deploy window, an on-call handoff), and nothing
here does.

The question above avoids both: it is a fact about a diff, so being wrong is discoverable, and some
of it is machine-checkable — `privacy.test.ts` is specified to cross-check storage keys in both
directions.

## Enforcement

Prose is the tier that fails. The question lives in `.github/PULL_REQUEST_TEMPLATE.md`, landing
with CI — an affordance at the point of use, not a rule in a document nobody re-reads.

## The one setting that changed rollback in fact

`allow_rebase_merge` **disabled 2026-08-03**. Squash and merge-commit each produce a single
revertable unit, so most of what a rating would have promised is already true by construction. A
rebase merge is the exception: it lands N commits on `main` with nothing tying them together, so
there is no single thing to revert.
