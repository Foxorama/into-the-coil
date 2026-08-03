# 0011 — Three environments, and staging gets its own ORIGIN

**Accepted 2026-08-03**, landed ahead of RELEASE rather than with it.

## The rule

| | host | trigger | audience |
|---|---|---|---|
| production | GitHub Pages, `intothecoil.vulpecula.games` | a version tag | installed PWAs — **does not exist yet** |
| staging | Cloudflare Pages, `next.intothecoil.vulpecula.games` | every push to `main` | us |
| preview | Cloudflare Pages, `<branch>.into-the-coil.pages.dev` | every branch | us, before merge |
| itch | butler | the same version tag | itch players — **not set up yet** |

Production cannot move. Staging cannot be a path.

## Why a separate origin, and not `/next/`

A PWA binds to its **origin**, and `localStorage` is per-origin — not per-path. Staging under
`/next/` on the production host would share one storage namespace with the real game, so a staging
build with a bumped save schema writes something production refuses to read, on a real player's
device. The subdomain is not tidiness; it is the only boundary the platform actually enforces.

The same fact makes production a one-way door. Everyone who installs is pinned to the hostname they
installed from, and moving it means every player uninstalling, reinstalling, and hand-carrying a save
across. The name has to be right before the first tag, not after.

## Why it arrived early

The scaffold plan put all three environments in RELEASE. Staging moved ahead of it because staging is
what lets the game be opened on a phone, and that is worth having before there is a release to make.
The predecessor's own account of why this exists is a play-test loop that was running in production —
four passes at one mechanic in a day, each live on players' phones within minutes of merging.

## The blind spot this creates

**No workflow is involved.** Cloudflare Pages builds from the repository through its own git
integration, so nothing in `.github/` describes this deploy, nothing in CI can assert it, and no
read-back exists for it in the way [0004](0004-admin-settings-must-be-read-back.md) demands for
GitHub's settings. It is the admin-UI blind spot arriving through a different door.

`.node-version` exists entirely because of that: it is the only channel this repository has for
telling that build anything. Pages otherwise defaults to a Node far too old to run the toolchain, and
`tests/toolchain.test.ts` holds it against CI's pin because they are now one decision in two files
that cannot share a value.

## Three traps, each paid for once

**Cloudflare does not rebuild when build settings change.** Setting the output directory and waiting
does nothing at all; it needs a new deployment. This presented as "the setting isn't saving".

**A green deployment is not a working one.** With no output directory, Pages serves the repository
root — `/src/main.ts` returns 200 and the game is raw dev source. The predecessor hit this on its
first staging deploy and left the signature behind: `/src/main.ts` in the served HTML is a string a
Vite build can never emit. It identified the fault here in one request.

⚠️ **The boot watchdog reported it before any of that.** Opening the URL gave `ITC-BOOT-FAILED`, the
failing file by name, and a version line reading the literal `%ITC_VERSION%` — which is exactly what
[0007](0007-the-boot-watchdog.md) predicted an unbuilt page would say, in the words it predicted.
That is the first time either guard fired on something real.

**The git connection is separate from the repository setting.** A Pages project can name a repository
it is no longer authorised to read — the GitHub App's allow-list is per-repository, and a repo
created after the app was installed is simply absent from it. Deployments then stop silently: the
project keeps serving its last build, the deployment list keeps showing an old commit, and every
push looks ignored. **The tell is the commit in the deployment list, not the error banner.**

## Two deliberate deviations from the predecessor

- The Cloudflare project is `into-the-coil`, not `next-into-the-coil`, so previews are
  `<branch>.into-the-coil.pages.dev`. Cosmetic: the custom domain is the only URL ever shared, and it
  survives a project recreation. Not worth deleting a correctly-configured project over.
- No `_redirects`. That file belonged to the predecessor's *website* repo, not its game.

## Known limit

**Staging is proxied and production is not**, so Cloudflare injects roughly 1.2KB of bot-detection
script into staging that production will never see. The two are not byte-identical, and no guard that
scans `src/` can see anything injected at the edge — which is why the Cloudflare audit still open in
the scaffold plan puts auto-injection settings first, ahead of proxy status and SSL mode. `PRIVACY.md`
will be claiming the game sends nothing.
