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

## Built, 2026-08-03

`scripts/settings-drift.mjs` and `.github/workflows/settings-drift.yml`. Expected values live in
`.github/expected-settings.json` **with the reason beside each one**, so the report explains itself
rather than reporting an unexplained mismatch. It speaks only when something is wrong.

A missing field is a **failure**, not a pass: a token that cannot see a setting must never be
mistaken for a setting that is correct.

## The half that could not be automated

**Branch protection needs a token this project does not have.** Measured, not assumed:
`GET /branches/main/protection` returns **403** under the built-in workflow token, and no
`permissions:` key grants it — `administration` is not valid in a workflow and a file declaring it
fails to parse.

So that half is opt-in on a `SETTINGS_PROTECTION_TOKEN` secret (a fine-grained PAT, *Administration:
read*, this repo only). Without it the weekly report says **NOT CHECKED**, in those words, and names
the six settings being taken on trust.

Failing weekly instead was considered and rejected: a job that is red for a reason nobody intends to
fix gets switched off, and takes the eight repository settings it *can* check down with it. A gap
that announces itself beats a guard nobody runs.

⚠️ Still outside any automated check, and read back by hand at RELEASE: Pages source, the
`github-pages` environment ref policy, DNS, the Cloudflare build configuration, and the itch upload
flags. Four of the ten incidents came from that list.
