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

## Most of it cannot run on the built-in token

Measured on a runner, not assumed. Under `github.token`:

- `GET /repos/{owner}/{repo}` **omits** `allow_auto_merge`, `delete_branch_on_merge` and all three
  merge-method flags — they are absent from the response, not returned as `false`
- `GET /branches/{b}/protection` returns **403**

No `permissions:` key fixes either; `administration` is not valid in a workflow, and a file
declaring it fails to parse. **11 of the 14 decided settings need an admin token.**

So those are opt-in on a `SETTINGS_READ_TOKEN` secret (a fine-grained PAT, *Administration: read*,
this repo only). Without it the weekly report says **NOT CHECKED**, in those words, and lists every
setting being taken on trust.

Failing weekly instead was considered and rejected: a job that is red for a reason nobody intends to
fix gets switched off, and takes the three settings it *can* check down with it. A gap that
announces itself beats a guard nobody runs.

## ⚠️ How this was nearly missed

The first two runs of this workflow reported **success while the script was throwing**. The step ran
`node … | tee drift.md`, which reports *tee's* exit code, and GitHub's shell does not set
`pipefail`. It was quoted as evidence that the guard worked.

Nothing about the run summary showed it. It took reading the log. That is [0005](0005-a-guard-must-be-seen-to-fail.md)
applying to a workflow rather than a test: **a green job is not evidence until you have seen what it
printed.**

⚠️ Still outside any automated check, and read back by hand at RELEASE: Pages source, the
`github-pages` environment ref policy, DNS, the Cloudflare build configuration, and the itch upload
flags. Four of the ten incidents came from that list.
