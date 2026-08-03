# 0012 — A release is a tag, and a deploy has to prove itself

**Accepted 2026-08-03**, landed as RELEASE.

> ⚠️ **One claim below is corrected by [0013](0013-the-github-pages-environment-refuses-you-two-ways.md).**
> The section *"No manual trigger"* argues the `github-pages` environment does not exist until the
> first deployment creates it. That is true of a repository that has never enabled Pages, and was
> false of this one — the first tagged release was refused by a `main` rule the environment already
> held. The rule this file sets stands; that piece of its reasoning does not.

## The rule

One `release.yml`, firing on `tags: ['v*']` and **nothing else**. It calls `tests.yml` rather than
restating it, asserts the tag against `package.json`, builds, deploys to GitHub Pages, and then
**verifies the live origin** with `scripts/verify-deploy.mjs`.

`public/CNAME` carries the production hostname. `.node-version` is the only place a Node version is
written — four workflows and Cloudflare Pages all read it.

## No manual trigger — a deliberate deviation

The predecessor's equivalent has `workflow_dispatch:`, and its own notes explain the danger: while
the `github-pages` environment carried a `main` branch rule, a dispatch could publish staging code
to every installed PWA. The answer there was to fix the environment policy.

That answer does not transfer to a repository that has never deployed. **The environment does not
exist until the first deployment creates it**, and until its policy is set it allows everything — so
there is a window in which a Run button is a one-click publish of whatever is on `main`, and the
window opens exactly when someone is most likely to press it.

The scaffold plan's ladder puts *remove the affordance* above every softer tier, and re-running a
finished run from the Actions UI covers the only thing dispatch was actually for. So the button is
not there. `tests/release.test.ts` holds it not-there, because adding it back is a one-line change
that looks like a convenience.

## Why itch is absent rather than broken

The plan calls for one workflow with Pages and itch as **sibling** jobs — both depending on `build`,
neither on the other — so one destination failing cannot gate the other. That shape is the whole
reason for consolidating, and it is preserved: `deploy` depends on `build` alone, so an itch job
drops in beside it without rewiring. A test holds that wiring.

The job itself is absent because there is no itch project and no `BUTLER_API_KEY`. A job that fails
on every single tag does not "fail loudly" — it teaches everyone that a red release is normal, which
is the wallpaper failure the weekly report is separately designed to avoid.

## A green deployment is not a working one

This is the part with the most evidence behind it, all of it recent.

The predecessor's first staging deploy went green while serving its repository root. **This project
then did exactly the same thing**, and did it while every check upstream was green: the build was
correct, the upload was correct, and the host served raw TypeScript. Nothing inside CI can see that,
because nothing inside CI ever asks the host what it returned.

So the release ends by asking. `scripts/verify-deploy.mjs` fetches the deployed origin and checks
content, not status — the page carries no `/src/main.ts`, no `%ITC_%` placeholder survived, the
version is the one being released, no external script is on the render path, the manifest parses and
installs landscape, every icon really is an image, and `sw.js` is JavaScript carrying a stamped cache
name.

⚠️ **Two things make the obvious version of this check useless.** Both were learned by writing the
useless version first:

1. **Status codes prove nothing.** Cloudflare Pages answers an unknown path with `200` and the body
   of `index.html`. `/src/main.ts` never 404s regardless of what is deployed — so a status check
   reports success on a completely broken deploy, and reports it forever.
2. **The CDN will lie.** A plain request returned a **66-minute-old** cached copy of the previous
   deployment: a correct-looking response describing a build that no longer existed. Every request
   the script makes carries a cache-buster. Without it the script reports on whatever the edge kept.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md), and this pass was worth more than usual — two of
the findings are defects in the guards themselves:

| broken on purpose | went red |
|---|---|
| `workflow_dispatch:` added back | `has no manual trigger, so nothing can publish main to installed apps` |
| `branches: [main]` added to the trigger | `fires on version tags and on nothing else` |
| the suite restated instead of called | `calls the suite rather than restating it` |
| the tag/`package.json` assertion removed | `refuses to ship a tag that disagrees with package.json` |
| `deploy` rewired to need `test` | `keeps deploy hanging off build alone` |
| `CNAME` given a `https://` scheme | `is a bare hostname` |
| `CNAME` pointed at the staging origin | `is not the staging origin` |
| a `node-version:` literal put back | `no workflow spells a Node version` |
| `public/CNAME` deleted | the `dist/` sidecar allowlist |
| **the verifier pointed at a repo-root deploy** | **8 checks, and then it crashed** — see below |

**The verifier had two defects, and only running it against a broken deploy found them.**

It parsed the manifest with `.json()`, so a *missing* manifest — which arrives as a 200 full of HTML
on this host — threw an unhandled `SyntaxError` and killed the run mid-way. It reported four faults
and then died rather than reporting the remaining four.

Worse, it ended with `process.exit(1)` while undici still held keep-alive sockets, and node aborted
during teardown: every finding printed correctly, then the process exited **`0xC0000409`** instead of
`1`. The exit code is the only part of this CI reads. A gate that describes the fault perfectly and
then crashes on the way out is a gate whose verdict cannot be trusted.

Both are fixed, and both are the same lesson in different clothes: **a guard has to be exercised
against the failure it exists for, not only against the success it hopes for.** Passing against a
healthy origin proved nothing about either bug.

## Still outside git

Enabling Pages, the custom domain, DNS, and the `github-pages` environment's tag policy are all
admin-UI, and none of them can be asserted from here. They are read-back-able, which
[0004](0004-admin-settings-must-be-read-back.md) requires:

```bash
gh api repos/Foxorama/into-the-coil/pages
gh api repos/Foxorama/into-the-coil/environments/github-pages/deployment-branch-policies
```

⚠️ **DNS must be unproxied for production** — grey cloud, resolving straight to GitHub — while
staging is proxied. The two rows will look inconsistent in Cloudflare and that is correct;
proxying production puts Cloudflare's certificate in front of GitHub's and breaks its issuance.
