# 0013 — The `github-pages` environment refuses you in two directions

**Accepted 2026-08-03**, immediately after the first tagged release was refused by it.
Corrects one claim in [0012](0012-a-release-is-a-tag-and-a-deploy-must-prove-itself.md).

## The rule

The `github-pages` environment carries **exactly one deployment-branch policy: the tag `v*`**, with
`custom_branch_policies: true`. Any `main` branch rule is **deleted**, never left alongside.

```bash
gh api repos/Foxorama/into-the-coil/environments/github-pages/deployment-branch-policies
```

## What happened

`v0.1.0` was tagged. The suite passed, the tag/version assertion passed, the build passed, the
artifact uploaded — and the deploy was refused:

> Tag "v0.1.0" is not allowed to deploy to github-pages due to environment protection rules.

Which is, word for word, the predecessor's v1.4.0 incident. Its own note is the useful part: the
message *"reads like a credentials or permissions fault and is neither"* — it is the workflow and
the environment disagreeing about what a release **is**. The build job going green is what makes the
deploy look like the broken component.

The environment held one rule, `main` type `branch`, created when Pages was first enabled with
*Deploy from a branch*. A tag matches no branch rule, so every tag is refused forever.

## ⚠️ The correction to 0012

0012 argued the environment *"does not exist until the first deployment creates it, and until its
policy is set it allows everything"* — and removed `workflow_dispatch` from `release.yml` to close
that window.

**That was true of a repository that has never enabled Pages, and false of this one.** Turning Pages
on from a branch creates the environment *and* seeds it with a branch rule, so the failure arrived
from the opposite direction: not an environment permitting too much, but one permitting the wrong
thing.

Both hazards are real, and which one applies depends on a piece of history — how Pages was first
turned on — that nothing in the repository records. The reasoning was wrong; **the remedy was right
either way, and it is the same remedy: read the policy back and set it explicitly.** That is the
argument for [0004](0004-admin-settings-must-be-read-back.md) in its strongest form, because here a
plausible model of the setting was confidently wrong and one API call settled it.

`release.yml` keeps no `workflow_dispatch`. The reasoning behind that stands on its own — a Run
button on the path to installed apps is worth removing whatever the environment happens to allow.

## Why the `main` rule is deleted rather than joined

Leaving it and adding `v*` beside it would have let the tag through, and that is the tempting fix.
It also leaves a rule saying **`main` may deploy to production** — so a branch deployment, by any
route that later exists, publishes staging to every installed app. The predecessor names exactly this:
while its `main` rule existed, the protection its whole release redesign was for held only as long as
nobody used the manual trigger.

One rule. It says what a release is.

## Not machine-checked, and that is the open gap

`.github/expected-settings.json` states plainly that it covers repo-level settings only, because
*"Pages, environments and DNS need scopes the workflow token does not have"*. So this setting — the
one that just refused a release — is guarded by nothing but this document.

`settings-drift.yml` already accepts an optional `SETTINGS_READ_TOKEN` (a fine-grained PAT with
*Administration: read*) for the repo settings the built-in token cannot see. Whether that same token
can read the environments API is a question with a one-command answer, and until somebody runs it
this is an intention written in a document — which the scaffold plan identifies as precisely the
tier of guard that fails.

**The setting is correct today and read back to prove it. Nothing yet will notice if it changes.**
