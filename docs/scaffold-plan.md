# Day-one scaffold — Into the Coil

Derived from the three extraction audits run against `Golf-Stars` on 2026-08-03
(`reports/extraction-{1-architecture,2-doctrine,3-process}-2026-08-03.md` in that repo).
Extraction 3 §9 is the canonical 34-step checklist; this file is the **sequencing** —
what is already done, what blocks what, and the decisions that need making before the
relevant step can run.

## Already done

- Repo created, **public**, `into-the-coil`
- `LICENSE` — all rights reserved (commit `7e58f77`)
- Repo-local git identity, no global
- Allow auto-merge ✅ · Automatically delete head branches ✅
- Cloned to `C:\into-the-coil`

That covers checklist steps 1, 2, 4, 5, 6.

## The ordering constraint that shapes everything

**Branch protection's required `test` check cannot be set until CI has reported once.**
A required status check that has never run blocks every merge. So the sequence is forced:

    buildable skeleton → CI workflow → one green run → THEN protection → then deploy

Everything else follows from that. Steps 7–9 of the checklist sit between commits 3 and 4
below, not at the start.

## Commit sequence

### 2 — The buildable skeleton
`.gitignore` · `.gitattributes` (`* text=auto eol=lf` — Golf-Stars has none and runs
`core.autocrlf=true`, a latent noisy-diff source) · `README.md` · `package.json` at
`0.1.0` · `tsconfig.json` · `vite.config.ts` · `index.html` · a trivial `src/main.ts` ·
`src/brand.ts`.

Ends when `npm run build` emits a `dist/`. Nothing after this point works without it.

`brand.ts` from day one, per checklist step 30 — `GAME_TITLE`, `APP_VERSION` from
`package.json` via a Vite `define`, and **no user-facing surface may use a literal**. The
Far Carry got exactly one free rename because nobody held the contract yet; the Android
launcher label proves even that one didn't fully land, and it shipped that way.

### 3 — The test spine
`scripts/chromium.mjs` (the ONE lookup, plain ESM so `.mjs` rigs import it without a build
step; `findChromium` + a `launchChromium` that **throws**) · `tests/chromium.ts` as a
one-line re-export · `tests/globalSetup.ts` building `dist/` **once** · a test asserting no
test file builds it · `tests/one-description.test.ts` seeded with the Chromium row ·
`package.json` `check = typecheck && test && build`, cross-platform.

The chromium seam is first because Golf-Stars had **50 browser tests silently skipping for
months** — local and CI both reported 60 skipped, and it read as green every time.

### 4 — CI, then protection
`.github/workflows/tests.yml` per checklist step 10 — `pull_request` + `workflow_dispatch`
+ `workflow_call`, explicit `permissions: contents: read`, concurrency keyed on
`${{ github.workflow }}-${{ github.ref }}`, **no `paths-ignore`** with a comment saying why.

Then, once it has reported once: checklist steps 7, 8, 9 — require a PR, require the `test`
check, require branches up to date. **Step 8 is load-bearing**: without it auto-merge
merges immediately with no gate at all. Step 9 is load-bearing because CI deliberately will
not run on `main`.

### 5 — Identity and privacy
Storage keys `itc_*` · SW cache prefix `into-the-coil-` · `PRIVACY.md` with the storage-key
table and `tests/privacy.test.ts` cross-checking it against `src/` **in both directions** ·
`public/_headers` with `Cache-Control: no-cache` on the shell.

⚠️ **The manifest must say `landscape`.** Golf-Stars' `manifest.webmanifest` says
`"orientation": "portrait"`; copied forward unexamined it installs a landscape shooter as a
portrait PWA. And the SW cache prefix is **one decision written in three places that cannot
share a constant** — get it wrong and the app deletes its own offline cache every boot
while believing it is tidying up after a sibling app.

### 6 — Deploy
See **Decision 1** below before writing this one.

## Decisions made (2026-08-03)

### 1. ONE `release.yml` — decided

Pages and itch deploy together from one test job and one build artifact. Rationale: they
will always be released together anyway, it closes the version-assertion gap, and it halves
the per-tag CI cost (a tag currently starts both callers in Golf-Stars, so the suite runs
twice). The Far Carry kept them separate only because that path reaches installed phones and
can't be verified without cutting a real tag — a repo with no players is the one window
where consolidating is cheap.

### 2. NO Android shell — decided

Play is ruled out. Checklist §H's keystore/signing path, `android/`, Capacitor and the
`cap sync` step all exist only to serve it, and none of it ships. This also deletes the trap
Golf-Stars just demonstrated: its launcher label still reads `Golf Stars` because the rename
never reached `android/app/src/main/res/values/strings.xml`, and no test covers it.

## Open question

### 3. What guards the guardrails?

Two data points, and they are the same failure.

**The constitution.** `Golf-Stars/CLAUDE.md` says "keep this file lean" and is 2,140 lines.
From git: it grew to 1,353, was manually pruned to **461** on 25 Jul when `docs/decisions/`
was created, then regrew to **2,140 in nine days** — faster than the first time. The prune
worked; nothing held it.

**The Flux rule.** A standing instruction not to raise the Flux art pipeline was ignored
every session. Cause: no Flux MCP server is connected — the prompts came from the repo,
which named Flux in 20 places across 12 files, including `CLAUDE.md:50`, a whole
*"Art pipeline (Flux)"* section in `docs/decisions/process-and-deploy.md`, five references in
`GOLF-STARS-STARTER-KIT.md`, a dead art hook in `src/render/cards.ts`, and **`IDEAS.md:734`
— an open backlog item that exists to be picked up**. Two stale agent worktrees held
outdated copies of CLAUDE.md and IDEAS.md on top of that, so a recursive search returned
three descriptions of each. (Worktrees removed 2026-08-03; both were fully merged under
squash SHAs `d0efacc` / `83c1e95`.)

**You cannot instruct your way out of your own documentation.** The ladder for agent
instructions, strongest first:

1. **Remove the affordance.** Delete what the rule is about. The only tier that reliably
   works — there is no compile-forcing for prose.
2. **Make the repo agree with the rule.** An instruction contradicted by content loses.
   "One decision, one home", applied to doctrine.
3. **Positive default over negative prohibition.** "Don't do X" needs noticing-then-
   suppressing; "do Y instead" replaces the behaviour.
4. **Keep the document short.** Salience is inversely proportional to length — a rule in 461
   lines competes with few rivals; the same rule in 2,140 competes with 1,679.

Consequences for this repo, to be settled with the archive pass:

- `CLAUDE.md` needs a **bidirectional guard, not a line ceiling.** The archive pass found
  the mechanism: ~20 GS-* tags exist only in `CLAUDE.md` with no archive entry, each a 20–40
  line bullet of exactly the narrative the preamble says belongs in `docs/decisions/`. The
  file did not bloat from verbosity — **the archive stopped being written to and the
  constitution absorbed the overflow.** A line ceiling would therefore force deletion rather
  than delegation, which is the wrong correction.
  The right shape is **`privacy.test.ts`'s, exactly**: a key in the code with no row in
  `PRIVACY.md` fails, *and* a row with no key fails. Applied here — a tag in the
  constitution with no archive entry fails, and an archive entry with no constitution bullet
  fails. That makes the constitution structurally unable to become the archive, which is the
  actual failure mode. (`putting.md`'s "Migrated from CLAUDE.md (2026-07-23)" section holding
  entries dated 2026-08-02 is the same rot from the other end.)
- **Prefer deleting a capability to writing a rule about it.**
- Nothing may enter `IDEAS.md` for a capability that has been ruled out. An open entry is a
  standing request.
- Agent worktrees must be pruned, or stale copies of the constitution accumulate on disk.

## Not yet decided elsewhere

- **README** — the repo is public, so a README describing the game is closer to an
  announcement than the licence was. Held deliberately.
- **USPTO trademark check** — still unverified; the search endpoint returns false negatives.
  Needs doing by hand before money is spent on branding.
- **Cloudflare audit** — auto-injection settings first (Web Analytics / Rocket Loader can
  add script at the edge, which no `src/` privacy guard can see), then proxy status, SSL
  mode, HTML cache vs the service worker, Pages build config.

## Explicitly NOT carried forward

- **THE DESTINATION naming constraint.** `Golf-Stars/docs/decisions/story-bible.md` §8 says
  to keep the name verbatim as a future mode's front door, and `story-betrayal-arc.md`
  records it was renamed from *Universe Unending* to avoid colliding with the Unending
  Universe mode. That is a constraint on **The Far Carry**, where the name is live in eight
  shipped strings and a locked title-screen tile — it is not a constraint on this repo.
  Into the Coil names itself. (Decided 2026-08-03. The Far Carry's own plan — that The
  Destination becomes the link to this game — is provisional and lives there, not here.)

## Attractors — the day-one architectural commitments

Measured in Golf-Stars over 822 commits: `app.ts` is 4,588 lines and touched by **35.2%** of
all commits; `render/constellations.ts` is 2,628 lines and touched by **0.6%**. Same size,
sixty-fold difference in cost. **Line count does not predict pain — touch rate does.** The
median file there is 259 lines and healthy; four files carry the whole problem
(`app.ts` 35.2%, `ui/game.ts` 17.0%, `sim/round.ts` 10.2%, `course/generate.ts` 8.2%).

An attractor forms where a hub must enumerate a growing set. So:

> **A hub may enumerate KINDS — a small closed set. It must never enumerate INSTANCES.**

**No line-count guard.** A threshold blocks every PR and is one number in an editable file,
so it gets relaxed the first time it cries wolf — the failure the register already names.
The split instead: **a gate must be ungameable by construction (compile-forced); a
measurement must have no incentive to game it (advisory, gates nothing).**

1. **No central screen switch.** Screens self-describe; the router consumes a registry.
   Adding a screen adds a file and one import line — an import cannot accrete logic, a
   `case` block can.
2. **Sliced reducer.** Root composes slices; a feature owns its slice. Root enumerates ~6
   slices forever, never 200 actions.
3. **Behaviour rides the data.** An enemy definition carries its own `tick`/`onHit`; the
   update loop calls `def.tick(e, world)` and branches on nothing. This is why Far Carry's
   `shot.ts` is 854 lines and `round.ts` is 3,002.
4. **All content is table rows** — enemies, waves, upgrades, weapons, bosses, stages — in
   compile-forced `Record<Key, …>` over closed unions with `never` fallthroughs.
   **Load-bearing.** Far Carry's content tables never became attractors, in five weeks, with
   no guard at all, because adding a row was the cheapest available action. The mechanism is
   economics, not discipline: make the correct action cheaper than the wrong one.
5. **The shell enumerates systems, never instances.**

Cost, knowingly paid: registries add indirection. Use an **explicit registry file — a list
of imports** — never directory auto-discovery, which adds import-order side effects and
defeats grep.

### The weekly report — `scripts/hotspots.mjs` + a scheduled workflow

Advisory. Gates nothing, so there is no incentive to game it. **TWO signals, because one
misses half the problem:**

- **Touch rate** → an attractor forming. Code only.
- **Net line growth** → bloat. Includes docs.

Validated against Golf-Stars' last 150 commits before the thresholds were set (an
unvalidated threshold is the A6 failure):

| | |
|---|---|
| touch >10% | flags `app.ts` 28.0%, `index.html` 20.7%, `playView.ts` / `ui/game.ts` 12.7% — 6 files, no noise |
| growth | `CLAUDE.md` **+1,682**, `putting.md` +2,004, `storyBattle.ts` +1,196, `app.ts` +1,109 |

**Exclusions, and they are the whole difference between a report you read and one you
ignore:**

- **Generated files excluded entirely** — lockfiles, build output. The census found
  `android/.../assets/public/index.html` at **+10,594 lines in one commit**, a committed
  `cap sync` artifact. One entry like that buries every real signal.
- **Living docs excluded from TOUCH, kept in GROWTH.** `CLAUDE.md` was touched by **67.3%**
  of commits and `IDEAS.md` by 36.0% — by design. Flagging them as attractors is a false
  positive, and a report that cries wolf is ignored exactly like a guard that does. But
  `CLAUDE.md` growing +1,682 lines in the window is the signal that matters, and only the
  growth half sees it.

**Window is time-based** (`--since='7 days ago'`), not a commit count, so it means the same
thing at 19 PRs/day and at 2.

**Delivery: weekly GitHub Actions `on: schedule` + `workflow_dispatch`.** In-repo and
versioned, so it survives a machine change — unlike a local scheduled agent. It writes the
run summary and **opens or updates ONE rolling issue**, never a new issue per run: an
advisory that spams becomes wallpaper, which is the same death as a gate that gets edited.

`scripts/hotspots.mjs` is one seam — runnable locally, in CI, and by an agent. Plain ESM and
git only, no build dependency, so it can land before the toolchain does. Lands with commit 4
(CI), since it needs `.github/`.

## Rules folded in from the archive pass (2026-08-03)

Three that change what we build, beyond the doctrine buckets:

- **"One feature per PR" is not the real rule.** The archive contradicts its own
  constitution — Asgard shipped three PRs' worth of work on one branch. The rule actually
  followed is **ship the risky layer alone, reviewable and revertable**. That is the version
  to adopt: it permits a large coherent change and forbids a large *entangled* one.
- **An upgrade to a stat that is never the binding constraint is invisible.** First-class for
  a roguelike upgrade pick — an offer that cannot change the outcome is worse than no offer,
  because the player spends a choice on it. Every upgrade needs a situation where it binds.
- **Guard VARIETY, not just coverage.** The Far Carry has coverage guards everywhere and
  variety guards nowhere, and paid for it: at max wildness a bendy world drew *~8% straight,
  ~0% plain dogleg, ~92% cape/hairpin/double*. Every row was reachable; the distribution was
  degenerate. For wave composition and enemy mix, assert the spread, not the presence.
