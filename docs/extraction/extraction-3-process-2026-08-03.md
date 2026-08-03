# Extraction 3 — the operating manual, and the anti-patterns

**Source:** The Far Carry (`Golf-Stars`), 822 commits / ~735 PRs over 40 days (2026-06-24 → 2026-08-03).
**For:** Into the Coil — landscape arcade space shooter, same universe, optional save import from
The Far Carry.
**Method:** read-only analysis of `.github/workflows/`, `package.json`, `CLAUDE.md`,
`docs/decisions/*.md` (18,862 lines of archive), `reports/`, `tests/`, `scripts/`, `.claude/`, and
the shape of `git log`.

Two halves. Half one reconstructs how work gets done. Half two is the expensive half: every place
this project shipped a fix, measured success, and found the problem still there.

---

# HALF ONE — THE OPERATING MANUAL

## 1. The change lifecycle

**The practice.** `main` is branch-protected. Every change is: branch → edit → commit → push → open
PR → CI runs on the merge commit → auto-merge lands it when the required `test` check passes →
GitHub deletes the head branch → sync `main`.

`CLAUDE.md` states it as a standing instruction, not a suggestion:

> **Default to shipping all the way.** When a change is complete and tests are green, take it to
> done: open the PR, enable auto-merge, then sync `main`. Only stop short if the work is WIP, the
> user says not to, or CI is red/unresolved.

**Automated vs manual:**

| step | who |
|---|---|
| branch, edit, commit, push, open PR | the agent |
| run the suite on the merge commit | `tests.yml` |
| merge once the required check passes | GitHub auto-merge |
| delete the head branch | GitHub (*Automatically delete head branches*) |
| sync local `main` | the agent |
| cut the release tag | a human decision, `npm version`-style bump + tag |
| write the itch devlog | **always manual** — `itch.yml`'s run summary literally says so |

**Why auto-merge over polling.** The archive is explicit: *"prefer auto-merge over a blocking
wait… the bot only needs to land the PR; it doesn't babysit the run."* This matters more with an
agent than a human — an agent waiting on a 7-minute CI run is an agent burning context on nothing.
The stale-pass hole is closed by `concurrency: cancel-in-progress` on `tests.yml`, so a newer push
supersedes an older run and an old green can never satisfy the gate over fresh red.

⚠️ One trap named in the archive: **enabling auto-merge with no required status check merges
immediately, with no CI gate at all.** The branch-protection rule is what makes auto-merge safe.
Setting one without the other is worse than neither.

**Commit messages** are sentence-form statements of the *why*, not the what. Real examples from
`main`:

```
A bounce that does not travel is not a bounce (GS-runout-clock) (#719)
The camera has to arrive before the ball does (GS-runout-clock round 2) (#720)
Retire the landing push-in, and stop the camera jumping at the hand-over (#722)
```

Each ends with a `Co-Authored-By: Claude` trailer. The `GS-*` tag in the subject is the grep key
that ties the commit to its CLAUDE.md bullet and its archive section. 71 merge commits against 822
total — i.e. squash-merge is the norm, so the PR number in the subject is the whole audit trail.

**Transfers: as-is.** Nothing here is golf-specific. The `GS-*` prefix becomes `ITC-*`.

---

## 2. What CI runs, when — and when it deliberately does not

**`tests.yml` fires on `pull_request` and `workflow_dispatch` only.** Steps: checkout → node 22 →
`npm ci` → `npx playwright-core install --with-deps chromium` → `npm run typecheck` → `npm test` →
`npm run build`. ~7 minutes.

### What it deliberately does NOT run on

**No `push: ['**']`.** This existed and was deleted (GS-ci-once, #734). A branch push and a PR land
in *different concurrency groups* (`refs/heads/<branch>` vs `refs/pull/<n>/merge`), so cancellation
could never collapse them: every commit on a branch with an open PR ran the whole suite **twice,
side by side, on identical code**. Measured over the repo's first 39 days: **2,333 runs, ~60/day,
roughly half of them duplicates.** On a public repo that costs $0, which is exactly why it survived
40 days — it cost wall-clock, and wall-clock is the resource an agent loop actually spends.

**The PR run is the one kept, and not merely because it is the required check.** It tests the
**merge commit** — the head already merged into `main` — where a branch push tests the branch in
isolation, which can be green while the merge is red. Strictly more information, same seven
minutes, at the only moment the answer changes what happens.

**No post-merge run on `main`.** Deliberately gone. What replaces it is *not in git*: branch
protection's **Require branches to be up to date before merging**. With it on, the merge commit CI
tested is byte-for-byte what lands. With it off, a PR opened against an older `main` can merge on a
pass that was never true of the result — the stale-pass hole, reopened one level up.

**No `paths-ignore` for docs, ever.** This is the obvious next saving and it is wrong here, because
several guards **read prose as input**: `privacy.test.ts` fails when a storage key in `src/` is
missing from `PRIVACY.md`'s table (and vice-versa), and the one-description register scans source
for banned re-derivations. A docs-only change in this repo can be genuinely red.

**A branch with no PR open runs nothing.** Intentional: an unopened branch has no decision pending.
`workflow_dispatch` is the escape hatch for checking one early.

### The other workflows

| workflow | trigger | gate |
|---|---|---|
| `tests.yml` | PR, dispatch, **`workflow_call`** | — |
| `pages.yml` | tag `v*`, dispatch | `uses: ./.github/workflows/tests.yml` |
| `itch.yml` | tag `v*`, dispatch(version) | `uses: ./.github/workflows/tests.yml` |
| `android.yml` | `push: branches:['**']` + `paths:` on the native shell, dispatch | none — **not a required check** |

**Called, never copied** (GS-release-gate, #735). A release workflow that pasted the seven steps
would be free to drift from the one the PR gate runs, *and nobody reads the release copy until a
release is already going out*. Two consequences that are easy to get wrong:

- `tests.yml` declares `permissions: contents: read` explicitly. **A called workflow inherits the
  caller's permissions**, and `pages.yml` holds `pages: write` + `id-token: write` — without that
  line the test job runs holding a Pages deployment token it has no business holding.
- The concurrency key is `tests-${{ github.workflow }}-${{ github.ref }}`. **A tag starts both
  callers at once**, and in a called workflow `github.workflow` is the *caller's* name. Keyed on
  `github.ref` alone they share a group, and `cancel-in-progress` has the second caller **cancel the
  first's suite** — a cancelled job is a failed dependency, so that deploy is skipped and the
  release **quietly half-ships**. Caught by reading, before shipping; there is no way to test it
  short of pushing a real tag.

**The accepted cost, named rather than discovered later:** two full suites per release tag, in
exchange for the two destinations continuing to fail independently (if butler is down, Pages still
ships). A handful a month on the rare path — explicitly *not* a reversal of GS-ci-once's ~60/day.

**`android.yml` is deliberately not gated on** — a Gradle build takes minutes and depends on the
runner's Android SDK. Its trigger shape is a hard-won detail worth copying if the new project ever
wraps natively: `workflow_dispatch` only shows a Run button once the file is on the **default
branch**, so it is useless for testing a wrapper pre-merge; and a `push` block with `tags:` and no
`branches:` fires *only* on tag pushes, so a `paths:` filter under it would never match a normal
commit. `branches: ['**']` + `paths:` is the one shape that works before merge.

**Transfers: as-is**, minus `android.yml` unless the shooter ships natively.

---

## 3. The settings that are NOT in any file

These are the ones that will be silently missing in a new repo and will fail confusingly. Every one
is documented somewhere in this repo precisely because it bit once.

| setting | where | what breaks without it |
|---|---|---|
| **Settings → Pages → Source: "GitHub Actions"** (not "Deploy from a branch") | Pages settings | Pages serves the **raw repo**, whose dev entry `/src/main.ts` 404s → *permanent blank page*. Caused a long hunt where "every code fix was correct but was never the file being served." Signature: the boot watchdog reports `…/src/main.ts` — a string a Vite *build* can never emit. |
| **`github-pages` environment → deployment-ref policy = the tag `v*`** | Environments settings | The first tagged release built green and the deploy was **refused**: *"Tag "v1.4.0" is not allowed to deploy to github-pages due to environment protection rules."* Reads like a permissions bug; is actually the workflow and the environment disagreeing about what a release is. |
| …and the `main` **branch** rule on that environment must be **DELETED**, not left alongside | same | While it existed, a `workflow_dispatch` on `main` could publish staging code to every installed PWA — the exact thing the staging split exists to prevent. |
| **Settings → General → Pull Requests → Allow auto-merge** | repo settings | `enable_pr_auto_merge` fails; the agent falls back to blocking polls. |
| **Settings → General → Automatically delete head branches** | repo settings | Branch litter; cleanup becomes a manual step in every session. |
| **Branch protection on `main` → Require status checks → `test`** | branch protection | **Auto-merge merges immediately with no CI gate.** The single most dangerous absence on this list. |
| **Branch protection on `main` → Require branches to be up to date before merging** | branch protection | The stale-pass hole. Load-bearing *because* CI no longer runs on `main`. |
| **Repo stays PUBLIC** | repo settings | On the Free plan a private repo silently loses: Pages publishing (Pro+ only), free Actions minutes (this suite alone is ~12,600 min/month ≈ **$64**), and protected branches/rulesets (public-only on Free) — which is the required check auto-merge depends on. |
| **Secret `BUTLER_API_KEY`** | Actions secrets | `itch.yml` fails loudly (it checks and `::error::`s). |
| **Secrets `ANDROID_KEYSTORE_BASE64` / `_PASSWORD` / `ANDROID_KEY_ALIAS` / `ANDROID_KEY_PASSWORD`** | Actions secrets | Build goes **green** and hands you an unsigned `.aab` Play rejects plus a debug APK that can never update an install. Mitigated by naming the artifact `…-UNSIGNED-cannot-update-existing-install`. |
| **itch: tick "This file will be played in the browser" + Kind of project = HTML, once** | itch.io Edit game | The upload isn't playable. butler keeps the flag on every later push to the same channel, so it is set once ever. |
| **Cloudflare Pages: use the PAGES flow, set the build output dir** | Cloudflare dashboard | The default button is now the **Workers** flow (wants `wrangler deploy` + a repo config). And with the output dir unset the **first staging deploy went green while serving the repo root** — the same blank-page failure, via a different host. **A green deployment is not a working one.** |

To read or restore the environment policy (there is no other copy):

```bash
gh api repos/OWNER/REPO/environments/github-pages/deployment-branch-policies
```

**Transfers: as-is, and this table is the single highest-value thing in half one.** Four of these
have each cost a documented incident in this repo.

---

## 4. The release model

**A release is a tag. `main` is staging.** (GS-staging, #726.)

| | host | trigger | audience |
|---|---|---|---|
| production | GitHub Pages, `farcarry.vulpecula.games` | **version tag `v*`** | installed PWAs, everyone |
| staging | Cloudflare Pages, `next.farcarry.vulpecula.games` | every push to `main` | us |
| preview | Cloudflare Pages, `<branch>.next-far-carry.pages.dev` | every branch | us, **before merge** |
| itch | butler | **the same version tag** | itch players |

**Why it exists.** `pages.yml` used to fire on every push to `main`, and that origin is what real
players have **installed as a PWA**. So every merge went straight onto their phones. In one day
that shipped *four passes at the ball's bounce, two of them net-worse*, each live within minutes and
with no way to try it first. The play-test loop was running in production.

**The difference is structural, not cosmetic.** Two constraints decide the shape:

1. **Production cannot move.** A PWA binds to its ORIGIN and `localStorage` is per-origin. Everyone
   installed is pinned there; moving means every player uninstalls, reinstalls, and hand-carries an
   export.
2. **Staging cannot be a path.** `/next/` on the same origin would have staging and production
   **sharing the same save blobs** — and a staging build with a bumped schema writes something
   production refuses to read, correctly dropping a real player into read-only mode.

So: separate subdomain, separate host, production frozen where it is.

**The preview row is the one that answers the original complaint** — a PR now has a URL you can open
on a phone *before* it merges, which is the only thing that would have caught a feel regression in
time.

**What the version number attaches to.** `package.json` `version` is the single source. It flows to:
`APP_VERSION` via a Vite `define`; the boot watchdog via a `%GS_VERSION%` placeholder substituted by
`transformIndexHtml` (the watchdog runs before any module, so it cannot import); and the service
worker's `VERSION` via a token replacement (the worker isn't in the module graph). `itch.yml`
**asserts the tag matches `package.json`** and fails loudly:

> Tag says $want but package.json says $have. APP_VERSION comes from package.json, so shipping this
> would show the player the wrong build number.

⚠️ **Known gap, not closed:** that assertion lives only in `itch.yml`. A mismatched tag fails the
itch push and **still deploys Pages with the wrong `APP_VERSION`.** Worth fixing in the new project
on day one by putting the assertion in a single `release.yml` both destinations gate on.

**Transfers: as-is.** A shooter is if anything *more* exposed — an arcade shooter's whole value is
feel, and feel regressions are exactly what a staging URL catches and a green test suite does not.

---

## 5. The local verification gate

```bash
npm run check
```

= `npm run typecheck && npm test && npm run build` — the exact CI gate, in order.

**Why it is what it is.** `npm test` (vitest) transpiles with esbuild and **does not type-check**.
PR #347 shipped "green locally" and failed CI at the typecheck step on `executeShot(…, {}, rng)`
with a required `ExecOpts.carryMult` missing. From the post-mortem: *"a green vitest run ≠
type-clean ≠ builds."* Three separate claims, three separate commands.

⚠️ **Two real caveats from this repo, both worth pre-empting:**

- `npm run check`'s trailing hub build **cannot run on Windows** — `VITE_HUB=1 vite build` is bash
  syntax and npm runs scripts through `cmd.exe`. Sessions on Windows run
  `npm run typecheck && npx vitest run && npx vite build` and say so. **In the new project, use
  `cross-env` or a `.mjs` build script so `check` is one command on every platform.**
- **`npm run check | tail` reports tail's exit code.** A failed build looked like a pass and the
  completion notification said success (`DL-exit-code-lie` in the devlog backlog). Never pipe the
  gate.

**Transfers: as-is, with the Windows fix applied up front.**

---

## 6. Test architecture — the layers, and what each is blind to

225 files in `tests/`, ~2,670 tests, **0 skipped**. Five distinct layers:

### Layer 1 — pure sim (vitest, node, ~most of the suite)

Everything in `src/sim/` is DOM-free, deterministic, no globals, seeded RNG only. Tests simulate
whole runs from a seed and assert outcomes. Any bug is reproducible by its seed.

**Blind to:** DOM, CSS, layout, focus, paint, animation, timing, the browser at all. The
2026-07-11 post-mortem is the whole lesson: a day of "game-breaking regressions" was one CSS
class-name collision (`.gs-hud` reused by two screens) that stretched a `backdrop-filter: blur`
across the play map. **Zero JavaScript threw, so all ~1,120 tests stayed green.**

**Kept honest by:** determinism. If a seeded number moves, you changed the stream — the whole suite
is the guard.

### Layer 2 — browser-driven (playwright-core against the BUILT artifact)

~24 files drive `dist/index.html` in real Chromium. The only guard over DOM/CSS/layout/focus/
deep-links. Reached without playing the game via `?screen=…` deep-links that mount each screen off
the **real reducer transitions** — no forked logic, so a render bug can't hide behind the hook.

**Blind to:** anything that only manifests as *motion* (see the bounce saga, half two), and to
itself when the browser is missing.

**Kept honest by two structural rules:**
- **`dist/` is built ONCE, by `tests/globalSetup.ts`.** Four files used to `vite build` in their own
  `beforeAll`; the build is `emptyOutDir: true`, so each one **deleted `dist/` out from under
  whichever parallel worker was mid-`page.goto`**. The symptom is a bare `ERR_FILE_NOT_FOUND`
  landing on a different test each run — CI built one commit twice and got a pass **and** a failure.
  `tests/build.test.ts` now forbids any test file from building.
- **ONE Chromium lookup** (`scripts/chromium.mjs`). See half two, case 2 — this cost 50 silently
  skipped tests for months.

### Layer 3 — eyes-on rigs (~64 `scripts/*-preview.mjs`)

Render a sheet of the thing (bounce sheets, fairway outlines, clubhouse interiors, ball cameras)
for a human to look at. CLAUDE.md names the rig to re-shoot after each art system's change.

**Blind to:** whatever they render at the wrong camera, and to their own absence — **rigs fail
soft.** A rig with no browser printed `no chromium, wrote /tmp/….html` and **exited 0**.

**Kept honest by:** `launchChromium` **throws** — non-zero exit, naming every candidate tried.
*A rig that cannot show you the picture has failed at its only job.* And by the register scan, which
bans re-deriving a browser path anywhere in `tests/` or `scripts/`.

### Layer 4 — balance harnesses (`scripts/death-spiral.ts`, `qualifier-balance.ts`, `endless-ai-depth.ts`)

Standalone measured runs, mirroring fences that also live in the suite. The death-spiral harness
plays 2,880 holes across every non-exempt biome at max wildness and reports `toPar/hole` +
floor-hit rate against explicit fences.

**Blind to:** the human player. Stated as a rule in CLAUDE.md and worth quoting in full:

> **THE HARNESS MEASURES THE AUTO AI. IT IS A REGRESSION FENCE, NOT A DESIGN AUTHORITY OVER
> PHYSICS.** … a harness number moving the wrong way is evidence about the AI, never proof that the
> physics is wrong. When honest physics and the fence disagree: **set the physics from the real
> world, MOVE THE FENCE, and record both numbers in the commit.**

The case that settled it: a driver was releasing 25% of its carry because that's what the AI had
been tuned around; setting it from real reference numbers **improved** the harness 0.8740 → 0.5215.
The bar it was defending was partly an artefact of the unrealistic split it was gating.

**Kept honest by:** every physics-touching commit records the before/after pair.

### Layer 5 — the test & demo hub (`test.html` / `src/test/`)

A second built page beside the game. Two faces: a **Demo** that drives the real game in a
same-origin iframe through its public hooks, and a **Sim Lab** that imports the pure sim for batch
experiments. **Re-implements zero game logic.**

**Blind to:** nothing it can't reach — but it rots silently, because a renamed hook leaves a dead
button and no error.

**Kept honest by an auto-discovering guard.** `tests/test-hub.test.ts` scans app source for every
`_gs*` flag and every `URLSearchParams…get('x')` and asserts the hub drives **exactly** that set,
both directions. There is **no hand-maintained hook list**. Add a flag without a control → red.
Leave a dead one → red. It also asserts the hub *imports* the content tables so a list can't fork
into a copy.

### The cross-cutting honesty rules

- **A regression test must be confirmed to FAIL on the old behaviour.** `play-scene-cache.test.ts`
  reports 97,477 ops/frame with the bitmap disabled — *"the only way to know a regression test is
  one."* `sw-update.test.ts`'s second case removes the revalidation and asserts the app goes stale
  again.
- **Assert against code, never against documentation of the code.** `crash-report.test.ts` strips
  comments before scanning, because the files *explain* the rules they follow, so a naive grep for
  the banned token matches the prose forbidding it.
- **A guard's threshold must be measured, not guessed.** See half two, case 4.
- **A test may not assert a property of its own approximation.** A monotonic-in-power claim was
  deleted because it failed on an artefact of the test's own three-step camera approximation.
- **A reducer test asserting on derived state is asserting on a cache.** Assert through the function
  that writes to disk.

**Transfers: all of it, with layer 4 re-pointed.** For a wave shooter the harness measures
survivability: an auto-pilot playing N seeded stages, reporting deaths-per-stage and clear rate
against fences — with the same warning attached, because an auto-pilot is worse than a player at
dodging and better at reacting.

---

## 7. The living-document discipline

Five document classes, each with an admission rule and a retirement rule:

| doc | holds | earns a place by | retired when |
|---|---|---|---|
| **`CLAUDE.md`** | the *constitution* — invariants that constrain new work | being a **rule** a future change could break | it grows into a paragraph of history → move the history to the archive, leave the rule |
| **`docs/decisions/*.md`** | the *narrative* — one file per domain, the why/failure modes/tuning history | shipping a feature | never; append-only by domain, with pre-refactor bullets preserved verbatim under *"Migrated from CLAUDE.md"* |
| **`IDEAS.md`** | open work backlog, stable IDs never reused | being a real open question | shipped → one-line **Done** + PR link; bad → **Dropped**, say why |
| **`DEVLOG-IDEAS.md`** | devlog post backlog, `DL-*` ids | having **MATERIAL**, not a topic | published → one-line link |
| **`reports/<topic>-YYYY-MM-DD.md`** | one-off/session reports, post-mortems | being a thing worth finding again | never; dated and committed |

**The rules that make this work rather than accumulate:**

- **A report is a FILE, committed — not a chat message.** Chat evaporates between sessions.
- **Living docs are scan, rerank, merge, retire — NOT append-only.** Stated for both backlogs.
- **`CLAUDE.md` is deliberately terse and points at the archive.** *"Every bullet here is the tip of
  a documented iceberg — open the matching doc before you change load-bearing code."*
- **The split lost nothing.** When CLAUDE.md was split (2026-06-30), every line moved verbatim into
  a domain file. The archive README says so explicitly, which is what makes the split trustworthy.
- **`DEVLOG-IDEAS.md`'s admission rule is the sharpest one here:** *"'How the wind works' is a
  topic. 'The wind read backwards for six weeks and one play-test caught it' is a post. If an entry
  can't name the specific thing that happened and where the evidence is, it isn't ready."*
- **Two standing devlog rules, both learned the hard way:** *state facts, don't argue* (an argument
  invites one back), and *check the claim against the code before publishing it*.

**⚠️ The failure this second rule exists for is worth transferring verbatim.** Summarising a fix,
the AI described a script as having *"printed no chromium and exited 0, so a cover that never
rendered reported success"* — which was the failure mode of the **other 64 rigs**, borrowed and
pinned on this one *because it made a better story*. That script exited 1. The claim reached **a
chat summary, a commit message, a PR body, and a source comment on `main`** before anyone re-read
the file. The machine-checked guard was precise; the prose around it drifted toward the more
dramatic version. **A test that names the file cannot be talked into a better story.**

**CLAUDE.md's own scale caveat:** it is now 216KB. That is a real cost — it is loaded every session.
The new project should hold the line harder from the start: a bullet is a rule in ≤3 lines with a
pointer, or it belongs in the archive.

**Transfers: as-is, with a size budget.**

---

## 8. Working agreements about scope

From `CLAUDE.md`'s *How to work with me*:

- **Pressure-test my ideas before building them.** *"A cheerful 'yep!' followed by a half-working
  result is the worst outcome."*
- **Implement properly or stop.** *"A 'this can't be done cleanly because X — here's what I'd do
  instead' is always welcome."*
- **Promote durable knowledge into the repo.** Memory is a private scratchpad; CLAUDE.md, skills and
  docs are the shared record. *The rule in CLAUDE.md, the story in `docs/decisions/`.*
- **Be concise, factual, accurate. State what was verified vs. assumed.** Every archive section ends
  with a *Verified* / *Not verified* block. The `save-integrity.md` one is exemplary: *"No real
  device has been shown a newer save… The `corrupt` arm has never been seen in the wild, only
  synthesised."*
- **Front-load everything; don't drag the session out.** All options in one pass; only ask a
  follow-up when the answer changes what you do.
- **ONE FEATURE PER SESSION/PR.** *"These systems share hot files; a focused context produces fewer
  regressions than a marathon. Finish, ship, start fresh."*

**On that last one — the evidence is mixed and worth stating honestly.** The repo shipped ~735 PRs
in 40 days, which is the rule working. But 2026-08-02 shipped ten PRs, seven of them on the same
bounce, **two of which made the game worse** — one feature, seven sessions, and the discipline that
would have helped was not "smaller PRs" but "stop and measure the picture." One-feature-per-PR keeps
each change reviewable; it does **not** stop a wrong theory from being re-applied seven times. Half
two, case 1 is what does.

**Skills as encoded process.** `.claude/skills/keep-test-hub-in-sync/SKILL.md` walks the one atomic
change (add hook → add hub control → confirm guard green → update docs) *and tells you when you can
skip it*. That second half is what stops a skill becoming ceremony: most changes need no hub edit,
and the skill says so in its first section.

**Transfers: as-is.**

---

## 9. SETUP CHECKLIST FOR A NEW REPO

In application order. `[admin-UI]` items are invisible to git and will be silently absent.

### A. Repo creation

1. `[admin-UI]` Create **public** repo `into-the-coil`. *(Private on Free silently loses Pages
   publishing, free Actions minutes, and protected branches — which is the required check.)*
2. `[in-file]` `LICENSE` — all rights reserved. The licence is the protection, not the visibility.
3. `[in-file]` `.gitignore`, `README.md`, `package.json` with `version: 0.1.0`.
4. `[admin-UI]` Repo-local git identity (`user.name` / `user.email`), no global.

### B. Branch protection and merge behaviour — **do these before the first PR**

5. `[admin-UI]` Settings → General → Pull Requests → **Allow auto-merge** ✅
6. `[admin-UI]` Settings → General → Pull Requests → **Automatically delete head branches** ✅
7. `[admin-UI]` Branch protection on `main` → **Require a pull request before merging** ✅
8. `[admin-UI]` Branch protection on `main` → **Require status checks to pass** → add **`test`**
   ⚠️ **Without this, auto-merge merges immediately with no CI gate.**
9. `[admin-UI]` Branch protection on `main` → **Require branches to be up to date before merging** ✅
   ⚠️ Load-bearing because CI will not run on `main`.

### C. CI

10. `[in-file]` `.github/workflows/tests.yml`:
    - `on: pull_request, workflow_dispatch, workflow_call`
    - `permissions: contents: read` *(explicit — a called workflow inherits the caller's)*
    - `concurrency: group: tests-${{ github.workflow }}-${{ github.ref }}`, `cancel-in-progress: true`
    - steps: checkout → node 22 (`cache: npm`) → `npm ci` →
      `npx playwright-core install --with-deps chromium` → `typecheck` → `test` → `build`
    - **no `paths-ignore`** — comment saying why.
11. `[in-file]` `package.json` scripts: `check = typecheck && test && build`, cross-platform
    (`cross-env` or a `.mjs` driver — don't repeat the Windows `VITE_HUB=1` break).
12. `[in-file]` `tests/globalSetup.ts` — build `dist/` once; a test asserting no test file builds it.
13. `[in-file]` `scripts/chromium.mjs` — the ONE lookup (plain ESM so `.mjs` rigs can import it),
    `findChromium` + `launchChromium`-that-throws; `tests/chromium.ts` a one-line re-export.
14. `[in-file]` `tests/one-description.test.ts` — the register, seeded with the Chromium row.

### D. Production — GitHub Pages

15. `[admin-UI]` Settings → Pages → Build and deployment → **Source: GitHub Actions**
    ⚠️ Not "Deploy from a branch" — that serves raw source and gives a permanent blank page.
16. `[in-file]` `.github/workflows/pages.yml`: `on: push: tags: ['v*']` + dispatch;
    `permissions: contents: read, pages: write, id-token: write`; job `test:
    uses: ./.github/workflows/tests.yml`; `build` and `deploy` on `needs:`.
17. `[admin-UI]` **After the first Pages run creates the `github-pages` environment**, set its
    deployment-branch policy to **exactly one row: tag `v*`**, and **DELETE** any `main` branch rule:
    ```bash
    gh api -X POST repos/OWNER/into-the-coil/environments/github-pages/deployment-branch-policies \
      -f name='v*' -f type='tag'
    ```
18. `[admin-UI]` DNS: `intothecoil.vulpecula.games` → Pages; add `public/CNAME`.
19. `[in-file]` Boot watchdog in `index.html` — capture import-time throws and failed resource loads
    into `__gsErr`, latched so a timeout can't clobber the real cause. Plus a build test asserting
    the single-file output and the error-capture contract.

### E. Staging and preview — Cloudflare Pages

20. `[admin-UI]` Cloudflare → **Pages** flow (⚠️ the default button is now **Workers**, which wants
    `wrangler deploy` + a repo config — do not write one).
21. `[admin-UI]` Build command `npm run build`, **output directory `dist`**
    ⚠️ Unset, the deploy goes **green while serving the repo root**.
22. `[admin-UI]` Production branch = `main` → `next.intothecoil.vulpecula.games`; preview
    deployments on all branches → `<branch>.next-into-the-coil.pages.dev`.
23. `[in-file]` `public/_headers` with `Cache-Control: no-cache` on the shell. Written to be correct
    on any host, so if production ever moves it gets fresher, never staler.
24. Verify staging serves the **built** page: fetch it and assert `/src/main.ts` does **not** appear.

### F. itch.io

25. `[admin-UI]` itch → Settings → API keys → generate; add repo secret **`BUTLER_API_KEY`**.
26. `[in-file]` `.github/workflows/itch.yml`: `on: push: tags: ['v*']`; `concurrency: group: itch,
    cancel-in-progress: false`; `test: uses: ./.github/workflows/tests.yml`; assert tag ==
    `package.json` version; `rm -f dist/test.html`; `butler push dist
    vulpeculagames/into-the-coil:html5 --userversion <v>`.
27. `[admin-UI]` After the first push: on the itch Edit game page tick **"This file will be played
    in the browser"** on the `html5` upload and set **Kind of project = HTML**. Once, ever.
28. ⚠️ **Always push to the same channel.** butler patches the existing upload; replacing it by hand
    can hand players a fresh origin and their save is gone.

### G. Identity constants — frozen on day one

29. `[in-file]` Storage keys `itc_*`; SW cache prefix `into-the-coil-`; reserved app id
    `com.foxorama.intothecoil`. **A persisted string is a contract.** The Far Carry got exactly one
    free rename because nobody was holding the contract yet — after launch it is not free.
30. `[in-file]` A `brand.ts` with `GAME_TITLE` / `APP_VERSION`; **no user-facing surface may use a
    literal**. `APP_VERSION` from `package.json` via `define`; the boot watchdog via a
    `%ITC_VERSION%` placeholder (it can't import). A test guarding all of it.
31. `[in-file]` `PRIVACY.md` with a storage-key table + `tests/privacy.test.ts` cross-checking it
    against `src/` **in both directions**.

### H. Optional / when needed

32. `[admin-UI]` Android secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
    `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` — and keep the keyless path **loud** (warning + run
    summary + an artifact NAMED `…-UNSIGNED-cannot-update-existing-install`).
33. `[in-file]` `CLAUDE.md`, `docs/decisions/README.md` + one file per domain, `IDEAS.md`,
    `DEVLOG-IDEAS.md`, `reports/`.
34. `[in-file]` `.claude/launch.json` for the dev server (`preview_start` by name, never Bash).

**Consider folding steps 16 and 26 into a single `release.yml`** — one test job, one build, deploy
Pages *and* push itch from the same artifact. It closes the version-assertion gap named in §4 and
halves the per-tag suite cost. The Far Carry didn't, only because that path reaches players' phones
and can't be verified without cutting a real tag. A new repo has no players yet — **this is the one
window where it's cheap.**

---

---

# HALF TWO — THE ANTI-PATTERNS

Nine cases where a fix shipped, the problem persisted, and it took several more passes to find the
real cause. Ordered roughly by how transferable the lesson is.

---

## CASE 1 — the bounce: eight passes, seven wrong, all of them measured green

**The most valuable case in this repo.** Documented across ~700 lines of `docs/decisions/putting.md`
and eight merged PRs (#612, #613, #615, #618, #701, #717, #718, #719, #720, #722, #723).

### The symptom

Reported, in various words, over five weeks:

> *"there's no ball bounce visible anywhere"*
> *"woods, hybrids and long irons don't really have any bounce animation, they land and just stick"*
> *"How do we fix that, because whatever you fixed, wasn't it."*
> *"All I'm seeing is the weird zoom thing still at the end of a shot and no bounce."*

### The false fixes — and why each measured as success

| PR | what it added | dimension | measured |
|---|---|---|---|
| #613 | `runoutTimeScale` 0.16, `hopDrawBoost` 3 | time, height | driver's run-out 87ms/8% → 868ms/31% ✅ |
| #615 | derived apex ratio `tan θ/4`, boost → 5 | height | invisible bounces 18/40 → 4/40 ✅ |
| #618 | self-similar decay `kh²`, boost → 5.4 | height | invisible 6/40 → 3/40 ✅ |
| #701 | `sin 2θ` length term, `ballYd` visibility trim | length | `seen == planned` on **all 40** rows ✅ |
| #717 | camera push-in at the landing | scale | run-out 61px → 179px, 0.33 → 4.90 px/frame ✅ |
| #718 | per-class hop counts, `trainSustain` | count | **0 of 40** rows outside the asked-for band ✅ |

Every one of those numbers is real and was reproduced. Every one is a genuine improvement to the
bounce **model**. And the report kept standing.

**Why they all measured green: every single pass reasoned in course yards.** The rigs
(`landing-preview.mjs`, `runout-frames.ts`) measure the *plan* — how far a hop travels, how high it
peaks, how many there are — in the sim's own units. The yards were right the whole time.

Two rig faults compounded it:

- **`landing-preview.mjs` drew every sheet at a hand-set 4.6 px/yd while the game drew 1.6.** It was
  honest about the model and silently wrong about the picture. *"Every 'the bounce reads now'
  verdict in this document was read off a camera the game does not use."*
- **`runout-frames.ts` printed `timeBase 0.65` throughout** — the tell for the second half of the
  bug — and a previous pass read it as *"a uniform stretch (harmless)"*, in a document that also
  flagged it as worth reporting.

### The real cause — two of them, neither visible to any plan-space rig

Found by hooking `drawBall`'s gradient and `drawBallShadow`'s ellipse **in a real browser** and
recording both per frame. Their difference is the LIFT — the one quantity a camera cannot confuse.
Shipped behaviour, driver:

```
3851ms  x=238.3  LIFT= 1.4px   ← touchdown
3901ms  x=226.3  LIFT=14.4px   ← hop 1
4001ms  x=209.9  LIFT= 9.5px   ← hop 2
4284ms  x=196.2  LIFT= 0.0px   ← …and then MOTIONLESS for 1.9 seconds
```

**The bounces were there, at the sizes the model promised.**

1. **The ball never moved forward.** The follow-cam eases at 0.2/frame — which the ball outruns in
   flight and **not at all** on the ground. So the whole run-out was drawn as *the world scrolling
   behind a pinned ball*. Total screen travel over the closing roll: **2.6 pixels.** A skip reads as
   a skip because the ball arcs FORWARD; what was left was a 14px vertical bob, in place.
2. **The hops played at 100ms, not the planned 130.** `sampleRunout` mapped `t` over the raw
   hop+roll total while the play view drove off `totalMs`, so any run-out tripping the ceiling
   played uniformly faster — and the compression landed entirely on the hops, which sit on their
   floor and have no slack, while the roll kept seconds of it.

And behind all of it, **five passes back**: #612 fixed the ball's arrival speed from 0.0067 to 0.28
yd/ms — a factor of **42**. That was a real bug. It was also, accidentally, *the entire reason the
bounce looked good*: a hop's duration is `distance / speed`, so at a stroke every hop became **1/42
as long**. The bounce was never designed to be watchable; it was watchable because something
upstream was broken, and fixing that broke it.

### The structural fix

- **A dead-zone camera.** The camera stops chasing the ball at the landing (eased onto the pitch
  mark 300ms *before* touchdown, so the ball flies into a frame that has already stopped) and is
  only dragged along past a leash. Roll travel **2.6 → 60px**. That is the fix; it is invisible
  except that the ball moves.
- **The push-in was RETIRED** (#722, `landingZoom = 1`). It reasoned correctly about scale and
  ignored the cost: *"a camera moving through the landing is a camera the eye has to re-acquire the
  ball against, at exactly the moment it is trying to read a small, fast arc. Three passes of
  measurement all said the bounce was bigger and none of them could see that it had become harder to
  watch."* Kept dormant behind a live `_gsFeel` lever with a test pinning the shipped 1.
- **The rigs were fixed to take the camera from the shipped constant**, and gained the columns that
  explain the class of report (`ratio`, `timeBase`).

### The transferable lesson

> **When a report survives a fix that measured green, stop improving the measurement of the MODEL
> and go measure the PICTURE.**

Corollaries, each earned:

- **An eyes-on rig must render at the camera the game actually uses.** A rig honest about the model
  and wrong about the picture is worse than no rig — it manufactures confidence.
- **When a fix upstream silently removes the thing that was making a feature work, no amount of
  tuning the feature will find it.** Ask what the "bug" you just fixed was *also* doing.
- **Compensating in the wrong dimension always produces a real measured gain.** Height, length,
  count, time and scale all got bigger; the missing dimension was *travel*, and nothing was
  measuring it.
- **A play-test verdict is data about the picture, not a bug report about the model.**

**Transfers: totally, and a shooter is more exposed.** Sprite motion, hit-flash, screen-shake,
parallax, weapon feel — every one of these is a *picture* problem measured in a model's units by
default. Build the canvas-tracing instrument (hook the draw call, record position per frame in a
real browser) **before** the first "it doesn't feel right" report, not after the seventh.

---

## CASE 2 — 50 browser tests silently skipped in CI, for months

### The symptom

None. That is the whole problem. CI reported green.

### The false fixes

There were none, because nothing was ever reported. The bug's *tell* was visible the entire time and
was read past on every run: **local and CI both reported exactly 60 skipped.** If it had merely been
a Windows gap, CI's number would have been lower.

### The real cause

Nine browser test files each carried **their own copy** of "where is Chromium", gated `it.runIf(
chromePath)`, and the copies had drifted into two different answers: five checked `CHROME_PATH`,
four searched Linux-only Playwright cache dirs. `tests/build.test.ts` was in the second group — so
its **50 tests were skipping everywhere, CI included.** A skipped test is not a failing test, and
vitest says green.

Then the same rot, worse, in the other tree: **~64 eyes-on rigs under `scripts/`, in eight
different shapes, every one Linux-only.** The `tests/` fix had landed and not travelled. It cost
more there because **rigs fail soft**: a rig with no browser printed `no chromium, wrote
/tmp/….html` and **exited 0**. On the author's Windows machine every art preview that CLAUDE.md
points at as *the* eyes-on check silently rendered nothing, for months, while reporting success.

And a third thing the copies didn't know: **existing on disk is not launching.** The Windows
Playwright download refuses to start (*"the side-by-side configuration is incorrect"*) on a machine
whose system Chrome runs fine. A copy that found a path and used it would still fail.

### The structural fix

- **ONE lookup, `scripts/chromium.mjs`.** Home is plain ESM, *not* the TypeScript file the rule was
  first written for — because four rigs had already resorted to **standing up a whole vite server
  just to `ssrLoadModule` a 40-line lookup**, and the other sixty did the obvious thing instead and
  copied it. *A seam a caller must boot a build tool to reach is one the next caller copy-pastes
  around.*
- `findChromium` returns a **ranked list**; a system browser deliberately **outranks** a cached
  download; `launchChromium` tries each and **throws** if none start.
- Always verify the **BINARY**, never the directory — a `chromium-*` dir can exist without one, and
  testing the dir made `runIf` lie and hard-fail CI instead of skipping cleanly.
- A **register row + source scan** banning re-derivation across `tests/` AND `scripts/`.

Result: **2344 passed / 0 skipped**, against 2271/72 that used to read as green.

⚠️ **And the 50 dead tests were hiding a stale assertion.** One read `fc_story.completed` — a field
that had been a roster (`{campaigns:{id:…}}`) since the campaign-slots feature, so it had been
comparing `undefined` to `true`. **A dead test rots without telling you.**

### The transferable lesson

> **READ THE SKIPPED COUNT, NOT THE PASSED COUNT.** A conditionally-skipped test is a test you do
> not have, and the suite will not say so.

Plus:
- **Make CI assert its own preconditions.** If browser tests are meant to run in CI, fail the run
  when zero of them did — don't infer it from a number nobody reads.
- **A tool that fails soft is a tool that lies.** Anything whose only job is to produce an artefact
  for a human must exit non-zero when it produces nothing.
- **A fix that lands in one tree and not the sibling tree has not landed.** Grep for the pattern,
  not the file.

**Transfers: as-is.** Add the skipped-count assertion on day one.

---

## CASE 3 — the derelict deck: seven passes, every one a second description

### The symptom

Reported over five weeks in different words, always the same shape:

> *"If the ball lands close to the wall… even if it's not going close to the wall it clips the
> 'bounce' effect and goes in a completely different direction than what it looks like it's going to
> do graphically."*

### The false fixes

Six passes, each a real improvement on a real bug: per-segment wall collision → deck-boundary
containment → deck-boundary flight bounce → space-past-the-bulkheads → calm off-deck at every
wildness → caddy-guard ordering. Each measured better. Each shipped. The report came back.

They measured as success because each fixed **one** of the several places that independently
described "where the deck ends."

### The real cause

**One fact — the edge of the playable deck — was described in three or four different places, and
they disagreed.** Measured in the seventh pass:

- The deck ribbon was built by a mitred offset that **crosses itself at a bend**; `pointInPoly` fills
  even-odd, so the fold read as *not fairway* — **a phantom void punched into the middle of a deck
  the renderer drew solid plating over.** 13% of walled holes carried one, up to 15.5yd across,
  concentrated on exactly the shapes the player named (doglegs, hairpins).
- The **aim cone had its own predictor** (`wallFlightHit`, per-segment along a curved arc) while the
  sim resolved `firstSolidDeparture` (the drawn deck boundary along a straight line). Two sources of
  truth for one bounce, **disagreeing on 42% of bounces** across 74,213 sampled shots.
- `CONTAIN_MAX_WALL_DIST` was **shared between the resting backstop and the mid-air carom** — so a
  ball could ricochet off a rail 22 yards away. Those are not the same problem: nobody watches where
  a stopped ball gets tucked in; everyone watches the ball turn.
- And a filter written for island worlds had quietly deleted **100% of the world's signature hazard**
  (0 breaches in 2,160 holes) when a *different* feature armed lost-rough at all wildness.

### The structural fix

- **ONE `ribbonEdges` / `corridorRuns`**, fold-spliced, shared by the deck and the bulkhead rails.
  13% → 2%.
- **`wallFlightHit` DELETED.** The aim cone probes the sim's own predicate. Exact instead of
  approximate, and cheaper. Result: **zero** surprise bounces down the corridor; every one of 9,420
  bounces across 19,400 fanned tee shots shaded by the cone.
- Separate constants for separate questions (`FLIGHT_BOUNCE_MAX_WALL_DIST` 6 vs the backstop's 22).
- **A rule stated as a rule:** *"Deck ahead on your line is a promise the ball flies on."*
- **The `GS-one-description` register** (`tests/one-description.test.ts`) — a source scan banning
  each second description by pattern.

### The transferable lesson

> **The most expensive recurring bug is one fact described twice.** It does not present as
> "duplication"; it presents as an intermittent behaviour bug that survives repeated correct fixes.

The register's own hierarchy of guards, strongest first, is the reusable artefact:

1. **Compile-forced** — a `Record<Key, …>` or a `never` fallthrough. *Doesn't detect drift; makes
   drift not build.* Always prefer it. Only covers "one answer per member of a known set."
2. **One seam + a source scan banning the alternative.** A behavioural test proves the code works
   today; a scan proves the second description can't be *introduced* tomorrow. Catches the class,
   not the instance.
3. **A test reading both copies.** Weakest, sometimes the only option (a service-worker cache prefix
   genuinely cannot share a constant across three files).

And the register's discipline rules, which are what stop it becoming ceremony:

- **ADMISSION RULE: a row earns its place only once a fact has TWO OR MORE callers.** Extracting a
  seam for one caller is over-abstraction; banning re-derivation of a fact nobody re-derives is that
  same error wearing a guard's clothes.
- **Every row states its `cost`** — a rule nobody can weigh later is a style guide.
- **Every exception NAMES a reason.** *An unexplained exception is a hole.*
- **When a row cries wolf, make the pattern precise or add a named exception — NEVER relax it.**
  *A guard everyone has learned to edit is worse than none.*
- **Each pattern is proved against a sample of what it bans** — a scan matching nothing passes
  forever.

**Transfers: as-is, and start it at row one.** For a shooter the obvious day-one rows are: where a
hitbox is (sprite vs collision vs the drawn flash), what a stage's wave table is, what counts as
"on screen", and which pilot/upgrade is equipped.

---

## CASE 4 — a guard whose threshold was a guess, defending the bug for three passes

### The symptom

> *"There's no bounce on drivers/woods/hybrids/long irons. Short irons and wedges and the green seem
> ok."*

The play-test named four clubs, and the split turned out to be **exact**.

### The false fixes

Three consecutive passes raised height globally, or derived it more honestly, or trimmed the tail.
Each measured better. None could raise the one constant that would have fixed it — `hopDrawBoost` —
**because a test would have gone red.**

### The real cause

`apexOverLen · heightExaggeration · hopDrawBoost` is the drawn height ÷ drawn length of a hop:

| club | descent | drawn tall:long | reported |
|---|---|---|---|
| D | 38° | **0.70** | no bounce |
| 4H | 47° | **0.96** | no bounce |
| 7i | 50° | 1.07 | fine |
| SW | 57° | **1.38** | fine |

Every club under 1.0 was on the list; every club over it was not. A hop drawn flatter than it is
long reads as a smear; taller reads as a bounce.

**And `tests/runout.test.ts` asserted the driver's ratio stayed BELOW 0.55**, then below a "1:1.4
pop-up line" — on the reasoning that a tall hop reads as the ball popping vertically. That
reasoning was **a guess that hardened into a constant, and a guard was built to defend it.**

**The refutation was in the data the whole time: the sand wedge has drawn 1.38 since three passes
earlier and is one of the clubs the play-test calls RIGHT.**

### The structural fix

- `apexOverLenMin` 0.12 → **0.30** (= the 7-iron's measured 1.07, the ratio the play-test says
  already reads correctly). ⚠️ The floor had to act on the **apex**, not only on the ratio clamp —
  clamping alone brought every club to 1.07 and left the driver, the loudest complaint, at 0.96.
- **The band is now stated from the measurement**: at least as tall as it is long, no taller than the
  steepest club already draws. **Asked of the REAL bag through the real flight** — hand-picked
  descent angles test a fixture, not the clubs the play-test was looking at.
- The rig gained the `ratio` column, *"because it is the number that explains this whole class of
  report and it was the one thing the rig never printed."*

### The transferable lesson

> **A guard built on an unvalidated threshold defends the bug.** It converts a guess into a
> constraint that every subsequent pass must route around, silently.

Rules that fall out:

- **A threshold in a test must be traceable to a measurement, a spec, or a decision with a recorded
  reason.** If you cannot say where the number came from, the test asserts your assumption.
- **Assert against real data, not hand-picked fixtures.** The fixture agrees with you by
  construction.
- **When you cannot change a constant because a test forbids it, interrogate the test first.**
- **Print the number that explains the class of report.** If a whole family of bugs shares a
  quantity, the rig must show it.

**Transfers: as-is.** In a shooter the equivalents are everywhere — "a bullet must be at least N px",
"a hit-flash must last at least N ms", "an enemy must not spawn within N px of the player." Every one
is a guess until measured against what a player calls fair.

---

## CASE 5 — "network-first" was a claim about the worker, not about the network

### The symptom

> *"On my mobile phone, which is the app installed from farcarry.vulpecula.games, it's still not
> updated and I've cleared cache on the app… I don't have any way to identify who would end up with
> a stale app."*

### The false fixes

The obvious suspect: `sw.js` stamps `VERSION` from `package.json`, which had sat at **1.3.1 for
fourteen merges** — so the served worker was byte-identical on every deploy and a browser only
installs a worker whose script differs. **That is real, and it is not the bug.** Fixing it alone
would have measured as a change and left the stale window intact.

The worker's own top comment had promised *"online → always fetch fresh"* since the file was
written, and had been wrong the entire time.

### The real cause

Found by **reproducing it**: a local server sending GitHub Pages' own headers, the real `sw.js`, and
a **persistent** chromium profile so the worker, its CacheStorage and the HTTP cache all survive
across "app launches" the way they do on a phone.

```
1. install (BUILD-1)          shows=BUILD-1
--- deployed BUILD-2 ---
3. relaunch after deploy      shows=BUILD-1     ← stale
5. relaunch, sw.js bytes CHANGED   shows=BUILD-1     ← still stale
```

Then **the decisive control: run it with the service worker removed entirely. Still stale.** The
worker was never the culprit.

`fetch(req)` inside a worker reads the browser's ordinary HTTP cache like any other fetch, and
GitHub Pages serves index.html with `Cache-Control: max-age=600` — **a header Pages gives you no way
to set.** So for ten minutes after any load, "network-first" answered navigations out of the HTTP
cache without ever asking the server. And by default the browser fetches `sw.js` **for its update
check through that same cache**, so it asks its own cache whether the worker changed and is told no.

### The structural fix

- The shell is fetched **`cache: 'no-cache'`** — a conditional request every launch. *Not*
  `no-store`, which re-downloads the whole 2.4MB bundle on mobile data; `no-cache` costs a 304 when
  nothing changed.
- **`register('sw.js', { updateViaCache: 'none' })`.**
- **The guard's second case removes the revalidation and asserts the app goes stale again** — the
  point, because `max-age` only bites while the entry is fresh, so a test that merely *waited* would
  report green on a worker that strands every player for ten minutes after each deploy.

⚠️ Honest residue: this explains a ten-minute stale window, **not a phone stale for hours.** That gap
is still unexplained, and the fix was deliberately chosen not to depend on knowing the answer.

### The transferable lesson

> **A policy name is a claim about the layer that implements it, not about the layers underneath.**
> "Network-first", "no-cache", "atomic", "synchronous" — each describes one layer's intent and says
> nothing about what sits below it.

Plus, the debugging technique that actually settled it:

- **Reproduce the environment, don't reason about it** — persistent profile, real headers, real
  worker.
- **Run the control that removes your prime suspect.** If the symptom survives without the
  component you're blaming, you have your answer in one step.
- **A comment asserting a behaviour is not evidence of it.** This one was wrong from the day it was
  written, and nobody caught it because the only symptom heals itself before you can investigate.

**Transfers: as-is if the shooter ships as a PWA — which it should, since it's the same delivery.**

---

## CASE 6 — one `migrate()` line that lost saves three ways

### The symptom

Not reported by players — found by audit before it cost anyone. Included because the **shape** is
the transferable part, and because Into the Coil ships an **optional save import from The Far
Carry**, which is exactly this hazard.

### The near-miss / false comfort

`migrate()`'s return type is `Save`. So *"I can't read this"* **had nowhere to go** — every blob it
didn't understand was answered with `defaultSave()`. And since `writeSave` couldn't tell the
difference, the next ordinary persist wrote that default **over the real save**. One line, three
distinct total losses:

1. **A save from a LATER build.** The Capacitor shell never auto-updates and is its own origin, so
   export→import between two builds is the *documented workflow* — and was a data-loss path the
   moment their schema versions differed.
2. **A FOREIGN blob.** itch serves every HTML5 game from one shared CDN origin, so the save key sits
   in a bucket shared with the whole platform. The old code read a neighbour's data as garbage
   **and overwrote it too.**
3. **Corrupt bytes.**

### The structural fix

- **`readSave` is the ONE classifier**; `migrate()` becomes a thin wrapper over it, so every caller
  that can't act on the difference is byte-for-behaviour unchanged — pinned against every shape of
  input, because *"a refactor of that function that quietly moves one outcome is a save-losing bug
  wearing a tidy-up's clothes."*
- **A fault puts the save layer READ-ONLY**: fully playable, persists nothing, a non-dismissible
  alert, `false` from every writer — which costs nothing, because callers have handled `false` from
  the storage-unavailable case since v1.
- **The rescue download is RAW STORED BYTES, never an export.** A normal export is built from
  `loadSave()`, which under a fault returns the empty default — so the button would hand the player
  a file containing nothing and they'd believe it was a backup. **Worse than offering nothing.**

⚠️ **And this feature shipped a bug on the day it landed, of exactly the kind it was written about.**
The new version check read the top-level `version` *before* working out what shape the blob was.
Both shapes carry that field and it means different things — a roster's is the envelope's (**1**), a
legacy campaign's is its own (**7**) — so it read 7, compared against a max of 1, and **declared
every legacy save in existence to be from the future. A save-protection feature that locks out the
oldest saves.** It was a second description of a discrimination another function already owned.

**Worth noting which test caught it: not one of the future-version cases — those all passed — but
the dull one asserting that nothing normal changed.**

### The transferable lesson

> **Make "I cannot read this" a representable outcome.** If your parse function's return type has no
> failure arm, every caller is structurally forced to treat garbage as data.

Plus:
- **Never overwrite what you could not fully read.** Read-only-and-loud beats silently-default.
- **A rescue path must not go through the code that is broken.** Raw bytes, no parse, no migration.
- **Keep a "nothing normal changed" test.** It catches the class of bug that every targeted test
  passes.
- **Version the container and the payload independently, and check both** — they move at different
  rates and a valid container can hold an unreadable payload.

**Transfers: with adaptation, and it is urgent.** Into the Coil reads a *foreign game's* save format,
written by a build it cannot control, possibly newer than itself, possibly from a shared origin.
Every one of the three loss modes applies. Design the import as: classify → refuse loudly → never
write back to The Far Carry's keys under any circumstance.

---

## CASE 7 — the lag that "had been investigated before"

### The symptom

> *"The golf shot lag… it's been investigated before, but it's still an issue. It seems to happen
> when you play a few holes in a row and don't stop… If you play a hole or two, go to title or close
> and reopen the app, the next hole is fine."*

Three of those four clues point at a **leak**. Previous passes went looking for one and found real
things (an orphaned-rAF fix came out of one). The report stood.

### The false fixes

Leak hunting, repeatedly — because the symptom description is *textbook* leak. And one measurement
that would have "proved" the wrong thing: **`performance.memory` is bucketed for fingerprinting
reasons** and reported an identical `9.54MB` for five consecutive samples.

### The real cause

The pass started by **ruling a leak out, with numbers, before optimising anything**
(`scripts/leak-probe.mjs`: rAF callbacks bucketed by requesting site, intervals, CDP DOM counters
that count detached-but-retained nodes, listeners, WebAudio node creations, and the JS heap **after
a forced GC**). Over a run: rAF loops constant at 1, DOM nodes and listeners *falling*, heap +0.6 MB
per hole and decelerating. **Nothing accumulates.**

So the lag is **steady-state cost**, and the accumulation the player feels is two things that scale
with it: holes get heavier as difficulty rises with depth, and **a phone held at 100% CPU throttles
thermally** — which is exactly why idling helps and a relaunch does not.

The actual number: **97,477 canvas paint operations per frame** on a putt watch — a full repaint of
a world that provably could not have changed. Two orders of magnitude past the ~1,500 prims the
scene builder returns, because most of it lives inside `clip` groups. And the cache that was
supposed to prevent it **never hit on a moving camera, ever**: the follow-cam eases exponentially so
it converges and never *arrives*, and the cache key changed every frame of every shot — long after
the ball had stopped and the picture had visibly frozen.

### The structural fix

Three parts: memoize the per-hole art hash (profiled at **13.4% of ALL CPU**); cache the painted
scene in an offscreen canvas and blit it while the projector is unchanged; and **let the follow-cam
ARRIVE** (below 0.05 *screen* px it snaps and stops — a threshold in yards means something different
at every zoom).

Putt watch **3.3 → 59.9 fps**; steady-state ops/frame **97,477 → 128**.

**The guard is structural, not a frame-rate assertion** (*"a frame-rate assertion in CI is a flake
waiting to happen"*): it counts canvas paint ops per frame during a real putt watch, with a threshold
sitting two and a half orders of magnitude from both states — **and is confirmed to fail on the old
behaviour at 97,477.**

### The transferable lesson

> **Rule the plausible cause OUT with numbers before you optimise.** "It gets worse the longer you
> play, and a restart fixes it" describes a leak *and* it describes thermal throttling of a
> steady-state cost. Only measurement separates them.

Plus:
- **A convenient measurement may be lying by design.** `performance.memory` is deliberately coarse.
- **A cache keyed on an object identity that is minted fresh each frame is not a cache.**
- **An exponentially-easing value never arrives.** Give it a settle threshold, in the units the
  consumer cares about.
- **Measure with an instrument built for the question** (op census per canvas), not with a proxy.

**Transfers: as-is, and expect it early.** A bullet-hell shooter is a per-frame draw budget problem
by definition; build the op census before the first "it gets laggy in stage 3."

---

## CASE 8 — the CSS collision that no test could see

### The symptom

> *"Almost everything today has introduced game-breaking regressions, while all the features
> introduced before the refactoring were working really well."*

### The false diagnosis

The refactors. It reads as a clean time correlation: mechanical file splits at 04:43–11:02, then
eight hours of regressions.

**The refactors broke nothing.** They were clean, tested, barrel-preserving splits.

### The real cause

**A day of high-churn work landed almost entirely in the one layer the suite does not cover — the
app/render/CSS layer — and that layer's regressions ship green.** The headline bug: a redesigned
journey map styled its HUD with `.gs-hud`, the class the play screen already owned. The second
`.gs-hud { inset: 0 }` stretched the play screen's glass chip to full-screen, smearing a
`backdrop-filter: blur` over the whole map. **Zero JavaScript threw, so all ~1,120 tests stayed
green.**

The refactor's real (minor) contribution: **CSS classes and DOM ids are global; the modules are
not.** When everything lived in one file, reusing a class name was more likely to be noticed.
Fragmentation raised the odds of a global-namespace clash.

### The structural fix

- **`npm run check`** as the documented pre-push gate (closing the separate #347 typecheck gap).
- **New screen chrome gets its OWN class prefix.** `.gs-bhud*` for the bridge HUD, `.gs-lore*`,
  `.gs-sthud*`, `.gs-resume*` — never the play screen's `.gs-hud`. **Grep the class before adding a
  rule.**
- **If it renders, it needs a browser test** — reaches the screen, no page error, no recovered
  `__gsErr`, and no chrome element blanketing the viewport.
- **`?screen=…` deep-links** so every between-stop screen is reachable headlessly *through the real
  reducer transitions* — no forked logic, so a render bug cannot hide behind the hook.

### The transferable lesson

> **A time correlation is not a cause. Ask which LAYER the work touched and whether that layer is
> tested.**

Plus:
- **Global namespaces (CSS classes, DOM ids, SVG ids, audio bus names, save keys, event names) do not
  respect module boundaries.** Splitting files makes collisions *more* likely, not less. Prefix per
  component, and grep before you name.
- **"All tests green" means "nothing in the tested layer broke."** Know where the boundary is and say
  so out loud.
- **A deep-link that mounts a screen through the real state transitions is the cheapest possible
  browser-test harness** — and it must be real transitions, or it validates a fiction.

⚠️ SVG-specific and easy to hit in a shooter: **`<defs>` ids are document-global.** A gradient id on
a sprite makes every copy on the page reference the first one's. This repo's answer is a
`holeIdPrefix` for multi-instance pages and **"emit no ids at all"** for anything drawn many times.

**Transfers: as-is.**

---

## CASE 9 — the over-correction, twice, from both directions

### The symptom, in two acts

> Act 1: *"the ball will roll over the black circle and not go in"* → the cup was drawn too small.
> Act 2, two sessions later: *"we over-corrected and made the hole too big and it looks weird now…
> probably twice as large as it should be."*

The devlog backlog calls this *"the same complaint from both directions, two sessions apart — the
best single example of the loop there is."*

### The real cause of the over-correction

The drawn cup was pinned to `HOLE_OUT_RADIUS` — a **rules** generosity of 1.2 yards, ~20× a real
hole. It was pinned there **for a reason**: a ball could be *holed while drawn lying outside the
cup*, so the drawn circle had to cover the catch radius or the graphic would contradict the score.

**The reason had quietly stopped being true.** Two earlier fixes had made putts and chip-ins snap
into the cup; the ordinary shot was the one remaining path that never got the rule, leaving the ball
up to 7–17 screen pixels to one side of a hole it had supposedly gone into.

### The structural fix

- **One seam, `finishInCup`**, shared by both branches — pure geometry after a decided outcome, zero
  RNG, zero strokes moved.
- **Only then** could the drawn cup get its own size curve, decoupled from the rules radius.
- **The two rules-derived ceilings survive** (never wider than the radius that catches; never more
  than N× the ball) — *slack at every camera now*, kept because **they are the rules, not the
  arithmetic**.
- ⚠️ And a floor: it must stay **wider than the ball** at the cameras you hole out at, or a ball on
  the lip hides the hole — which was the original bug.

### The transferable lesson

> **Before you correct a value, find out what was constraining it.** A "wrong" constant is often a
> correct workaround for a bug elsewhere, and moving it without removing the constraint guarantees an
> over-correction in the opposite direction.

Plus:
- **A play-test verdict of "too big" after "too small" is a signal that the value has no independent
  basis** — it is being pinned to something else's requirement.
- **Separate the rules value from the drawn value, and keep the rules value as a ceiling.** The
  generosity that makes the game feel fair and the graphic that makes it read honestly are two
  decisions.
- **Fix the invariant first, then tune.** The tuning is safe only once the constraint is gone.

**Transfers: as-is.** Hitbox vs sprite is the identical problem in a shooter: the drawn ship, the
collision circle and the graze radius are three values, and pinning the sprite to the hitbox
guarantees this exact two-act complaint.

---

## Honourable mentions (shorter, same family)

- **The ball's size, tuned against a camera the game never uses.** Sized against "~6.6 px/yd at the
  chip camera" — a number lifted from another feature's notes. Measured, the putt camera is
  **7.6–35 px/yd**, i.e. **5× what the curve was tuned for**, so every putt drew the ball pinned at
  its cap and a tap-in and a 20-footer looked identical. **Lesson: measure the parameter you are
  tuning against; never inherit it from another feature's prose.**
- **The ball's size, round 3 — scaling one number is not scaling the thing.** Asked for 75% smaller,
  the radius curve alone leaves a 1px rim on a 4.5px silhouette (a third of it), so it reads
  *muddier* rather than smaller. **Every length on the object — rim, feature-onset radii, texture
  floors — has to move together.**
- **A wedge item took the run off the driver.** A previous pass had the right rule (*"a spin build
  can only spin the clubs that spin"*) and applied it to the **sign** of the result rather than to
  whether the modifier applied at all — fixing the spectacular symptom (a drive sucking backwards)
  and leaving the quiet one (a dead stop, which is equally bounce-less). Found only by **reading the
  play-tester's actual save file.** **Lesson: clamping an output is not the same as gating an input;
  and when a report is save-specific, get the save.**
- **`1fr` is `minmax(auto, 1fr)` and `auto` is a min-content floor** — one CSS default caused three
  separate "content hangs off the panel" bugs across three screens. **Lesson: when the same visual
  bug appears on unrelated screens, look for a shared platform default, not three coding mistakes.**
- **Media queries are blind to a `zoom`ed root.** `zoom` shrinks the layout box but *not* the
  media-query viewport, so no breakpoint can ever answer "too cramped at large text." The answer is
  intrinsic sizing, plus one explicit `data-*` flag computed in **one** module for the genuine
  either/ors. **Lesson: when a mechanism structurally cannot observe the condition, no amount of
  tuning it will work — find the thing that can.**
- **`elementFromPoint` was the wrong instrument.** Opening an overlay seals the app with `inert`, and
  an **inert subtree is dropped from hit-testing while painting exactly where it did** — so the probe
  reported the sheet on top while a screenshot showed the opposite. **Lesson: know what your probe
  actually measures; hit order ≠ paint order.**

---

## IF THE NEW PROJECT ADOPTS ONLY FIVE THINGS

**1. The one-decision-one-home register, started at row one.**
`tests/one-description.test.ts`, with the admission rule (**two callers before a row**), the `cost`
field, named exceptions, and each pattern proved against a sample of what it bans. This is the single
most expensive recurring bug class in the source project — the derelict deck paid it seven times, the
resume logic cost players a parked run, the Chromium lookup cost 50 tests for months, and the
save-integrity feature paid it **on the day it shipped**. Everything else on this list is a specific
instance of it. Order your guards: compile-forced ▸ one seam + source scan ▸ a test reading both
copies.

**2. An instrument that measures the PICTURE, built before the first feel complaint.**
Hook the draw call, record the drawn object's position and size per frame, in a real browser, at the
camera the game ships. The bounce saga cost **eight PRs and two net-worse releases** because every
rig reasoned in the model's own units and every pass measured green. Corollary rule, in CLAUDE.md
from day one: **when a report survives a fix that measured green, stop improving the measurement of
the model and go measure the picture.** And every eyes-on rig takes its camera from the shipped
constant, never a hand-set one.

**3. The invisible-settings checklist, applied before the first PR.**
§3 and §9 of half one. Four of those settings have each cost a documented incident here, and every
one fails *confusingly* — a green build with a refused deploy, a green deployment serving raw source,
an auto-merge with no CI gate, a green Android build that can never update a phone. They are
invisible to git; nothing will remind you. Do them in the listed order, and make CI assert what it
can: **fail the run when zero browser tests executed**, because a skipped test is not a passing one
and the suite will not say so.

**4. Three environments, and a release is a tag.**
Production frozen on its own origin (a PWA binds to its origin and `localStorage` is per-origin —
staging on a path shares saves and a bumped schema locks a real player out), staging on a separate
subdomain built from `main`, and **a preview URL per branch**. That last row is the one that would
have caught every feel regression before it reached a player. An arcade shooter lives entirely on
feel; a test suite cannot green-light feel, and a phone URL on an open PR can.

**5. The living-document split, with a size budget and the honesty rules.**
`CLAUDE.md` = the rules that constrain new work, terse, pointing at the archive. `docs/decisions/` =
the narrative, one file per domain. `IDEAS.md` / `DEVLOG-IDEAS.md` = scan/rerank/merge/retire, never
append-only. `reports/` = dated committed files, because **chat evaporates between sessions**. Carry
across the two rules that keep it honest: **a guard's threshold must be traceable to a measurement**
(a guessed threshold defends the bug), and **check the claim against the code before you write it
down** — a wrong-but-better story once reached a chat summary, a commit message, a PR body and a
source comment on `main` before anyone re-read the file. Hold `CLAUDE.md` to a size budget from the
start; this one is 216KB and loaded every session.

---

*Written 2026-08-03. Read-only analysis; no source file was modified.*
