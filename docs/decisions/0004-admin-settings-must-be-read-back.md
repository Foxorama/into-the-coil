# 0004 — An admin-UI setting is not done until it has been read back

**Accepted 2026-08-03.**

## The rule

A repository, Pages, environment, DNS or store setting is complete when a command has printed its
current value — not when it has been ticked and recorded. A ✅ in a document is a claim; the API
response is evidence.

```bash
gh api repos/Foxorama/into-the-coil
```

## Why

Of the ten incidents behind this project's scaffold plan, **four never passed through a PR at
all** — Pages source set to "deploy from a branch" (a permanent blank page, and a long hunt where
every code fix was correct but never the file being served), the `github-pages` `main` ref rule (a
dispatch could publish staging to every installed PWA), an unset output directory (a deploy went
green while serving the repo root), and the itch playable flag (the upload was not playable).

No test, review, or PR-level instrument can see any of them. They are invisible to git and, as the
predecessor's process audit puts it, will be *silently absent*. The only thing that catches them is
looking.

Three settings inherited by this repo — public visibility, auto-merge, auto-delete head branches —
were carried as ticked-and-recorded for days. Read back on 2026-08-03 they were all correct. That
is not evidence the practice works; it is one sample, and the cost of checking was one command.

## Known gap

This rule is still prose, and prose is the tier that fails. It becomes a real guard only as a
**scheduled check that reads the settings and opens an issue when one drifts** — cheap beside the
weekly hotspots workflow it would sit next to. Not yet built.
