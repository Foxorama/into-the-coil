# Doctrine extraction — what transfers to *Into the Coil* (2026-08-03)

Read-only pass over the written record of **The Far Carry** (`Golf-Stars`), sorting every rule by
portability for a new project: a landscape arcade space shooter in the same fictional universe, with
an optional save-import from this game.

**Method / coverage.** Read in full: `CLAUDE.md` (constitution, every bullet);
`docs/decisions/` — `README.md`, `process-and-deploy.md`, `accessibility.md`, `save-integrity.md`,
`save-slots.md`, `save-transfer.md`, `club-list.md`, `art-style.md`, `android-packaging.md`, plus the
front matter of `story-mode.md` (pitch / pillars / architecture seam) and `render.md`;
`reports/regression-postmortem-2026-07-11.md`, `refactor-scan-2026-07-10.md`,
`app-ts-decomposition-2026-06-30.md`, `release-pipeline-2026-07-30.md`,
`runout-bounce-handover-2026-07-31.md`; `.claude/skills/keep-test-hub-in-sync/SKILL.md`;
`standards/TEST-HUB-STANDARD.md`; `tests/one-description.test.ts` (the register, in full);
`tests/privacy.test.ts` (header); the headers of `IDEAS.md`, `DEVLOG-IDEAS.md`,
`GOLF-STARS-STARTER-KIT.md`; and a source-comment sweep (`⚠️` / `NEVER` across `src/**/*.ts`).

**Not reached** (stated honestly rather than skimmed): the bodies of the five largest archive docs —
`putting.md` (2,691 lines), `render.md` past line 120 (2,431), `rpg-meta-loop.md` (2,171),
`sim-generator.md` (2,057), `story-mode.md` past line 175 (1,931), `ui-intro.md` (1,292) — and the
mid-size domain docs `competition.md`, `caddies.md`, `lore.md`, `audio.md`, `asgard.md`,
`story-bible.md`, `story-betrayal-arc.md`, `story-campaign-slots.md`, `static-courses.md`,
`tent-interactions.md`, `feedback-mobile-ux.md`. Their *rules* are represented here because
`CLAUDE.md`'s system index states each one and I read that in full; what I did **not** harvest is
their narrative detail, their tuning histories, and any rule that exists only in the archive and was
never promoted to the constitution. Also unread: ~45 of the 63 `reports/` files (mostly devlogs,
store copy and per-feature reviews — low doctrine density, high local-history density).

Ranks: **load-bearing** = the archive records a real failure caused by breaking it.
**aspirational** = stated as good practice with no recorded failure behind it.

---

# A — UNIVERSAL

True in any codebase, any genre. Transfers verbatim.

### A1. One decision, one home — and the guard ladder that enforces it
> "The most expensive recurring bug here is ONE FACT DESCRIBED TWICE" — `CLAUDE.md`,
> *One decision, one home — the register (GS-one-description)*; and `tests/one-description.test.ts`
> header.

Guards, strongest first: **compile-forced** (a `Record<Key,…>`, a `never` fallthrough — "does not
detect drift, it makes drift not build") ▸ **one seam + a source scan banning the alternative** ("a
behavioural test proves the code works today; a source scan proves the second description cannot be
INTRODUCED tomorrow") ▸ **a test that reads both copies** (weakest; sometimes the only option).

**Rank: load-bearing.** Recorded cost: the derelict deck edge ×7; `resumableState` (cost players a
parked run); the SW cache prefix across three files; `findChromium` (50 tests silently skipped in CI
for months); `isBareCampaignBlob` (a save-protection feature that locked out the oldest saves, on the
day it shipped). **Guard: yes** — `tests/one-description.test.ts`. [verified]

### A2. The admission rule for a seam: two callers, not one
> "A row earns its place here only once a fact has TWO OR MORE callers. Extracting a seam for a fact
> with one caller is over-abstraction, and a row banning re-derivation of a fact nobody re-derives is
> the same error wearing a guard's clothes" — `tests/one-description.test.ts` header.

`isBareCampaignBlob` was *correctly* inline while it had one asker. **Rank: load-bearing** (the
inverse error is documented: `GS-leave-round` declined a register row because the candidate patterns
would either miss the real failure mode or flag legitimate code — `save-slots.md`, *No register row,
deliberately*). **Guard: yes** (the register's own meta-tests). [verified]

### A3. Every rule states its cost; every exception names a reason
> "`cost` — what the codebase paid, or would pay. Rows are not free; this is the justification."
> … "An entry without a reason is not an exception, it is a hole." — `tests/one-description.test.ts`.

Machine-checked: a row with a cost string under 40 chars fails; an exception with a reason under 10
chars fails. **Rank: load-bearing** (stated as: "a rule nobody can weigh later is a style guide").
**Guard: yes.** [verified]

### A4. When a guard cries wolf, make it precise or add a named exception — never relax it
> "a guard everyone has learned to edit is worse than none" — `CLAUDE.md`, register section, and
> `tests/one-description.test.ts` header; the same rule stated first in `tests/privacy.test.ts`:
> "If this ever fails, the fix is NOT to relax the test — it is to decide whether the game is still
> allowed to say it collects nothing, and update PRIVACY.md."

**Rank: load-bearing.** **Guard: partial** — the principle is prose; the *instances* are guarded.
[verified]

### A5. A source scan that matches nothing passes forever — prove each pattern against a sample
> "Each pattern is proved against a sample of the second description it exists to catch, so a typo'd
> regex fails HERE rather than in six months" — `tests/one-description.test.ts`, *the patterns
> actually match the thing they claim to ban*.

**Rank: load-bearing** (the guard that *did* rot — `accessibility.test.ts` banning the literal
`100vh` while ten rules used `92vh`/`88vh`/`60vh` — is the same failure: `accessibility.md`,
*The guard was looking for the wrong string*). **Guard: yes.** [verified]

### A6. A guard built on an unvalidated threshold defends the bug
> "⚠️⚠️ **THE GUARD WAS POINTING THE WRONG WAY AND HAD BEEN FOR THREE PASSES** — it asserted the
> driver's ratio stayed BELOW … a 'pop-up line' that was a guess hardened into a constant. …
> Any pass could have raised the boost; none could, because the test would have gone red."
> — `CLAUDE.md`, GS-bounce-flat.

The refutation was in the data the whole time. Bands must be **measured against the real
configuration**, never hand-picked. **Rank: load-bearing.** **Guard: yes** (`tests/runout.test.ts`,
rewritten to assert a measured band). [verified]

### A7. Read the SKIPPED count, not the passed count
> "A SKIPPED TEST IS NOT A PASSING ONE (GS-browser-test-gate) … its **50 tests were skipping
> EVERYWHERE — CI included, for months**. The tell was visible all along and read past every time:
> local and CI both reported exactly 60 skipped." — `CLAUDE.md`, *Change, versioning & deploy*.

Corollary recorded in the same bullet: **a dead test rots without telling you** — those 50 dead tests
were hiding a stale assertion comparing `undefined` to `true`. **Rank: load-bearing.**
**Guard: partial** — the one Chromium lookup is guarded; "read the skip count" is discipline.
[verified]

### A8. A tool that fails soft has failed at its only job
> "a rig fails SOFT … printed `no chromium, wrote /tmp/….html` and **exited 0**, so on the author's
> Windows machine every art preview this file points at as the eyes-on check silently rendered
> nothing while reporting success." — `process-and-deploy.md`, *The one Chromium lookup*;
> restated in `CLAUDE.md` (GS-preview-chromium).

Fix: the seam **throws**, naming every candidate it tried; non-zero exit. **Rank: load-bearing.**
**Guard: yes** (register row scanning `tests/` *and* `scripts/`). [verified]

### A9. Dev tooling is scanned precisely because nobody is watching it
> "`scripts/` is dev tooling rather than shipped code, and it is scanned for exactly that reason: it
> is the tree where nobody is watching, so a fact re-derived there rots for months" —
> `tests/one-description.test.ts`, `TREES`.

**Rank: load-bearing** (64 copies, eight shapes, every one Linux-only). **Guard: yes.** [verified]

### A10. Run the exact CI gate locally — a green test run is not type-clean
> "`npm run check` … = `typecheck && test && build`, the exact CI gate in order. `npm test` (vitest)
> transpiles with esbuild and does NOT type-check … that's exactly how #347 shipped 'green' and
> failed CI at the typecheck step." — `CLAUDE.md`, *Change, versioning & deploy*; and
> `regression-postmortem-2026-07-11.md`, items 3 and *Prevention playbook*. **Duplicated in two
> documents.**

**Rank: load-bearing.** **Guard: no** (an npm script + prose; nothing forces its use locally).
[verified]

### A11. Never overwrite data you could not fully read
> "**This build never overwrites data it could not fully read.** … A fault puts the save layer in
> READ-ONLY: the game stays completely playable, nothing is persisted, the title screen says so"
> — `save-integrity.md`, *The rule*; restated in `CLAUDE.md`.

Sub-rules, all load-bearing:
- **One classifier**, and the old lossy function becomes a thin wrapper over it, so callers that
  cannot act on the difference are byte-for-behaviour unchanged.
- "Refusing to write is not caution for its own sake — a save we cannot parse is one we cannot merge
  into, so writing is *guessing*."
- Writers return `false` rather than throwing, "because every caller already handles a `false` from
  the storage-unavailable case" — a fault rides a contract that already exists.
- Deleting is the most destructive write there is: `clearStory` is a no-op under a fault.
- **The import is the one write allowed through, and it must clear the fault FIRST** — "with the
  fault still set, every write would refuse and the import would report success having written
  nothing, which is the same lie in the opposite direction."

**Rank: load-bearing** (three distinct data-loss paths from one line). **Guard: yes**
(`tests/save-integrity.test.ts` + browser twin). [verified]

### A12. The boot path swallows; the import path throws — same parse, two contracts
> "`importSave` … swallows and returns `defaultSave()` … That is exactly right for a **boot** path
> (a corrupt blob must not brick the game) and catastrophic for an **import** path, where it would
> replace a real save with an empty one and report success." — `save-transfer.md`, *Import throws; it
> does not guess*. Restated in `save-integrity.md` (*The import hole*) and `CLAUDE.md`
> (GS-save-transfer). **Stated in three places.**

The archive also records the leak: the bundle-level version check said nothing about the save
*inside* it, so the guard "leaked one layer down for two years". **Rank: load-bearing.**
**Guard: yes** (`tests/save-backup.test.ts`). [verified]

### A13. A destructive import is two steps, and the first step is a summary
> "picking a file only **parses and summarises** it … Nothing is written until a second, explicitly-
> worded tap. The browser test asserts this directly: after the file is chosen and before the
> confirm, `fc_save` is byte-for-byte what it was." — `save-transfer.md`, *Two steps, always*.

And: "The summary is also how a player catches the *quiet* mistake — picking the wrong file."
**Rank: load-bearing** [assumed — no failure is recorded, but the guard is explicit].
**Guard: yes** (`tests/save-transfer-browser.test.ts`). [verified]

### A14. Import replaces; it never merges
> "import replaces the whole roster (never merges: a merge has to invent an answer for 'both sides
> have a Feather Fade campaign'), so the player must see what is about to go." — `CLAUDE.md`,
> GS-save-transfer. **Directly relevant to Into the Coil's cross-game import.**

**Rank: load-bearing.** **Guard: yes.** [verified]

### A15. Applying an import reloads; it does not patch a live session
> "Applying reloads the page rather than patching the live reducer. Boot already rebuilds everything
> from the blobs; half-applying an import into a running reducer is how you end up with a run
> pointing at a course the restored save has never heard of." — `save-transfer.md`.

**Rank: load-bearing** [assumed]. **Guard: no** [assumed]. [verified — text]

### A16. Versioned persistence from v1, one migration step at a time, export/import from day one
> "every persisted blob has a `version` + `migrate()` (one step at a time) … Export/import-to-JSON
> from day one (localStorage is the only copy)." — `CLAUDE.md`, *Architecture*.

⚠️ With the recorded caveat: the claim was true of the *layer* and false of the *game* — "neither
function was wired to a single button" until GS-save-transfer, years later (`save-transfer.md`,
*Why it finally got built*). **A capability nobody can reach is not shipped.**
**Rank: load-bearing.** **Guard: yes** (save tests, per-version). [verified]

### A17. Delete the field rather than keep it alongside, so every reader fails to compile
> "Save **v33** removes `activeRun` outright rather than keeping it alongside — two descriptions of
> 'the resumable run' is the bug the version exists to close, and deleting the field makes every
> reader fail to compile until it moves." — `save-slots.md`, *What shipped*.

**Rank: load-bearing.** **Guard: compile-forced.** [verified]

### A18. Exhaustiveness so a new case cannot be forgotten
> "`screenIntent` ends in a `never` guard, so adding a member to the `Screen` union fails to COMPILE
> until someone decides what back does there. **Verified by actually adding a screen and watching
> `tsc` fail** — not assumed." — `android-packaging.md`, *The back gesture*; restated in `CLAUDE.md`.

Note the meta-rule inside it: **the guard was verified by breaking it on purpose.**
**Rank: load-bearing.** **Guard: compile-forced.** [verified]

### A19. A new feature's default path must be provably a no-op
> "New *effect* fields default to no-ops so the seeded suite stays byte-identical (the caddy-field
> pattern)" — `story-mode.md`, *Design pillars*; and "Defaults are inert … so the untoggled game
> renders exactly as before. No save bump" — `accessibility.md`, *Invariants*.

**Rank: load-bearing** (it is what lets a large feature ship without re-proving the whole suite).
**Guard: yes** — the existing suite is the guard. [verified]

### A20. Guard the destructive write in the core, not in the UI
> "`abandonTarget(state)` is the ONE predicate — it renders the settings row, words the confirm, and
> guards *both* reducer cases, so a forged action can never reach a destructive write the UI would
> not have offered." — `save-slots.md`, GS-leave-round; same shape in `CLAUDE.md`
> (`selectCharacter` refuses unless `slotOverwriteId` names the target).

**Rank: load-bearing** (`storySwitchGolfer` "wrote your prologue over the target's campaign" — the
guard protected the thing being left, never the thing being landed on). **Guard: yes**
(`tests/leave-round.test.ts`, `tests/save-slots.test.ts`). [verified]

### A21. The words a UI shows come from the same function that guards the write
> "Confirm copy comes from `campaignOverwriteWarning`, the SAME pure function the guard consults, so
> it can't promise something milder than the write." — `CLAUDE.md`, GS-story-campaign-picker; and
> "`abandonPrompt` returns label, body, title and confirm label as one `AbandonCopy`, so a renderer
> cannot take the label without the matching promise" — `save-slots.md`.

**Rank: load-bearing.** **Guard: yes.** [verified]

### A22. Prefer deriving over storing — and name the one thing that cannot be derived
> "almost everything a stop needs is DERIVED rather than remembered … Same reason a parked run's
> course is rebuilt from its seed rather than stored: nothing that is derived can drift." —
> `save-slots.md`, *What shipped* / *Where the round lives, and why it is rebuilt*.

⚠️ "`partnerHoles` is the one thing that cannot be rebuilt … Without the padding the array silently
misaligns and every later reveal shows somebody else's card." **The exception is documented at the
same volume as the rule.** **Rank: load-bearing.** **Guard: yes.** [verified]

### A23. In-memory state is a cache; assert through what lands on disk
> "A reducer test that asserts on `state.runSlots` alone is asserting on a cache. … assert through
> `saved()`, which is what would be **on disk**." — `save-slots.md`, *Why the existing tests missed
> it*.

And the invariant it protects: **the cache may lead the persisted state, never trail it.**
**Rank: load-bearing** ("three tests pinned the broken behaviour and none caught it" — `CLAUDE.md`,
GS-resume-slot-loss). **Guard: yes.** [verified]

### A24. A test that pins an implementation choice is not a test
> "both as `expect(runSlots).toEqual({})` with the comment *'the offer is consumed'* — pinning the
> implementation choice rather than any property a player has." — `save-slots.md`.

**Rank: load-bearing.** **Guard: no** (judgement). [verified]

### A25. CSS classes, DOM ids and SVG ids are global; modules are not
> "New screen chrome gets its OWN prefix … reusing another screen's class silently restyles it (the
> #353 full-screen map-blur was `.gs-hud` shared between the play HUD and the journey HUD)." —
> `CLAUDE.md`, *Change, versioning & deploy* and again under *UI layer*;
> `regression-postmortem-2026-07-11.md`, item 1. **Stated in three places.**

SVG variant, source-only: "⚠️ SVG ids are DOCUMENT-GLOBAL. `golferPreviewSVG` takes a `uid` prefix
for exactly that reason" — `src/render/castPortrait.ts:15`; `ballSVG` emits **no ids** at all
(`CLAUDE.md`, GS-ball-art). **Rank: load-bearing.** **Guard: partial** — browser layout smokes catch
the symptom; nothing enforces the prefix convention. [verified]

### A26. If it renders, it needs a browser test — the pure suite is blind to the DOM
> "**The safety net is concentrated in `src/sim/` … The app / render / CSS / DOM layer has almost no
> automated coverage** … Everything that shipped broken this day lived in that uncovered layer" —
> `regression-postmortem-2026-07-11.md`, *Root cause*.

The diagnosis worth carrying: the refactors were blamed and were innocent; **what mattered was which
layer the work touched and whether that layer is tested.** **Rank: load-bearing.** **Guard: yes**
(nine browser test files; `tests/build.test.ts` and friends). [verified]

### A27. Reach a screen for testing through the REAL state transitions, never forked logic
> "A `?screen=…` deep-link … mounts each between-stop / between-run screen **directly off the real
> reducer transitions** — no forked logic, no playing a whole stop. Because the screen is built the
> honest way … a real render bug can't hide behind it." —
> `regression-postmortem-2026-07-11.md`, *Update — the travel/shop gap is now closed*.

**Rank: load-bearing.** **Guard: yes.** [verified]

### A28. The demo/test hub drives the real artifact and re-implements zero logic
> "It re-implements ZERO game logic — it pokes the artifact." — `CLAUDE.md` / `process-and-deploy.md`;
> and `standards/TEST-HUB-STANDARD.md`, invariant 1: "The instant a hub mocks, forks, or re-derives
> app behaviour, it tests a fiction and will pass while the app is broken." **Stated in four places**
> (CLAUDE.md, process-and-deploy.md, the skill, the portable standard).

Invariant 3 is named "the S+/A divider": **a CI sync-guard that fails on drift in both directions** —
add a hook and the guard fails until the hub drives it; drop one and it names the dead control. "There
is no hand-maintained hook list." **Rank: load-bearing** ("a renamed/added hook leaves a dead button,
no error"). **Guard: yes** (`tests/test-hub.test.ts`, auto-discovering). [verified]

### A29. A new public hook is one atomic change: hook → control → guard green → docs
> `.claude/skills/keep-test-hub-in-sync/SKILL.md`, *The atomic change*; restated in `CLAUDE.md`.

With the front-loaded escape hatch that makes it cheap: **most changes need no hub edit at all**, and
the skill says so first. **Rank: load-bearing.** **Guard: yes.** [verified]

### A30. Overlay/dialog behaviour is ONE pass at the end of render, not N patched builders
> "**One pass at the end of `render()`, not six patched overlay builders** … so a *new* overlay gets
> the behaviour by existing." — `accessibility.md`, GS-a11y-focus.

Four sub-rules, each load-bearing:
- **Use the platform's `inert`, not a hand-rolled tab trap** — "one attribute removes a subtree from
  the tab order, the accessibility tree and hit-testing at once, with no keydown handler to fall out
  of sync." (6 controls stayed tab-reachable behind a backdrop.)
- **Focus moves in only on the OPEN transition**; a surgical re-render preserves focus.
- **Restore focus by SELECTOR, not element reference** — captured immediately *before* the innerHTML
  swap, "which is the last moment the information exists."
- **Keyboard activation synthesises a `click`**, "so whatever handler the element already had is the
  one that runs — there is no second code path to keep in step."

**Guard: yes** (`tests/a11y-focus.test.ts`). [verified]

### A31. A live region must live outside the re-rendered root, be polite, and be hidden by clipping
> "a live region that is destroyed and rebuilt on every render is not reliably announced by any
> screen reader" … "`polite`, never `assertive`" … "Both `display:none` and `visibility:hidden`
> remove the node from the accessibility tree, which is exactly what a live region must not be."
> — `accessibility.md`, GS-a11y-announce.

Plus: **spoken and drawn read the same fields**, so they cannot drift. **Rank: load-bearing.**
**Guard: yes** (`tests/a11y-announce.test.ts`). [verified]

### A32. A user preference seeded from the OS is strictly more informed than the OS — ask the setting
> "**One answer, `settings.reducedMotion()`, and everything asks it.** … Re-consulting the media
> query inside the gate would reintroduce the mirror-image bug: a player who deliberately turns the
> toggle *off* could not get their animations back. A source guard now fails the build if any module
> outside `settings.ts` reads `matchMedia` for reduced motion." — `accessibility.md`, GS-a11y-motion.

**Rank: load-bearing** (four cinematic gates and ~19 CSS blocks were each asking the wrong question).
**Guard: yes** (`tests/a11y-motion.test.ts`, source scan). [verified]

### A33. Parameterise instead of branching, so there is one code path
> "Camera shake is **amplitude-gated, not branched around**. Setting the amplitude to 0 keeps the
> decay running, so all twelve `shake = Math.max(…)` call sites behave identically and there is no
> second code path to drift." — `accessibility.md`, GS-a11y-motion.

**Rank: load-bearing** [assumed — stated as a design choice; the drift it prevents is hypothetical].
**Guard: no.** [verified]

### A34. Never smuggle a balance change in under another banner
> "Every one of those is a **balance change** … An assist that makes putting easier has to be
> measured against the death-spiral harness and decided as a design question, not slipped in under an
> accessibility banner. Flagged for the owner rather than done unilaterally." — `accessibility.md`,
> *Deliberately NOT changed: the putt meter*; restated in `CLAUDE.md`.

**Rank: load-bearing** (as a discipline: the same doc records the balance fence being the reason).
**Guard: no** (judgement, but the harness is the backstop). [verified]

### A35. When the room runs out, show fewer things at the same size
> "What was deliberately *not* done: shrinking type on the play screen. The player asked for bigger
> text. When the room runs out the answer is **fewer things at the same size**, never the same things
> smaller — that is the whole point of the setting." — `accessibility.md`, GS-a11y-tight-fit.

**Rank: load-bearing.** **Guard: yes** (`tests/a11y-mobile-layout.test.ts` asserts *properties*, not
pixels). [verified]

### A36. Assert properties, not pixels
> "Chromium at 390×844 on the top rung asserting the *properties*, not the pixels: the settings
> sheet's top and head are on screen **and it scrolls** (not merely short)" — `accessibility.md`,
> *Guards*.

**Rank: load-bearing** [assumed]. **Guard: yes.** [verified]

### A37. A `position: fixed` box bigger than the viewport is unreachable content
> "the page cannot scroll a fixed element — that is what fixed means." Cap to the viewport, scroll
> internally, `overscroll-behavior: contain`, **`align-items: safe center` never bare `center`** ("a
> centred flex item taller than its scroll container overflows in *both* directions and the browser
> cannot scroll to the top of it"), and a **sticky head** so the dismiss control never scrolls away.
> — `accessibility.md`, *Bug 1*.

Note the sting: "this was already broken at the ship scale, with default text, on a 390px phone. The
scale ladder did not cause it; it made it impossible to ignore." **Rank: load-bearing.**
**Guard: yes.** [verified]

### A38. Configuration that has never run is not working code
> "Recorded because all three were *invisible until executed* — the scaffolding typechecked, the YAML
> parsed, and the whole thing still could not produce a single artifact." — `android-packaging.md`,
> *What the first real build cost*.

Twin, from a different host: **"A green deployment is not a working one"** — the first staging deploy
went green while serving the raw repo root (`process-and-deploy.md`, GS-staging, *Notes worth
keeping*). **Rank: load-bearing.** **Guard: no** — by nature. [verified]

### A39. A silently-successful degraded path is worse than a failure
> "the keyless path succeeded silently … the `.aab` came out unsigned … the artifact still had the
> same friendly name as a good build. Everything looked right until the phone said no." Fix: it still
> builds, but emits a warning, writes the run summary, **and names the artifact
> `…-UNSIGNED-cannot-update-existing-install`** — "You have to read that to download it."
> — `android-packaging.md`, *Signing and the "app failed to update" trap*.

Same shape as A8 (rigs exiting 0) and A11 (a rescue export containing nothing).
**Rank: load-bearing.** **Guard: no** (workflow-level discipline). [verified]

### A40. Settings that live outside the repo are a documented list, because nothing in git enforces them
> "**THE `github-pages` ENVIRONMENT ALLOWS EXACTLY ONE REF … AND THAT LIVES OUTSIDE THE REPO**" —
> `CLAUDE.md`; and `process-and-deploy.md`, *The gate is in TWO places, and only one of them is in
> git*: "A recreated repo, or an environment recreated by Pages, comes back without it."

The list here: Pages *Source: GitHub Actions*; the environment's deployment-ref policy; *Allow
auto-merge*; *Auto-delete head branches*; branch protection requiring the `test` check; *Require
branches to be up to date before merging*. **Also: delete a superseded rule, do not leave it
alongside** — "while it existed, a `workflow_dispatch` on `main` could publish staging code to every
installed PWA." **Rank: load-bearing** (a tagged release built green and was refused at deploy).
**Guard: impossible** — explicitly. [verified]

### A41. Run CI once, at the moment the decision is made — and prefer the run that tests the merge
> "Every commit on a branch with an open PR ran the whole ~7-minute suite **twice** … **The
> pull-request run is the one kept** … It tests the **merge commit** … whereas a branch push tests
> the branch in isolation, which can be green while the merge is red." — `process-and-deploy.md`,
> *One CI run, on the pull request*; restated in `CLAUDE.md`.

With its dependency named: deleting the post-merge run is only safe **because** *Require branches to
be up to date* is on (A40). **Rank: load-bearing** (2,333 runs in 39 days, ~half duplicates).
**Guard: partial** (the workflow itself). [verified]

### A42. Never add a docs `paths-ignore` when guards read prose as input
> "several guards read prose as input — `privacy.test.ts` fails when a storage key in `src/` is
> missing from `PRIVACY.md`'s table … and the one-description register scans source for banned
> re-derivations. A docs-only change in this repo can be genuinely red." — `process-and-deploy.md`;
> restated in `CLAUDE.md`.

**Rank: load-bearing.** **Guard: no** (prose rule about a config nobody has added). [verified]

### A43. A release must be gated by the same suite, **called** and not copied
> "**Called, never copied.** A release workflow that pasted the seven steps would be free to drift
> from the one the PR gate runs, and nobody reads the release copy until a release is already going
> out." — `process-and-deploy.md`, *And a release runs it too*.

Two traps recorded: a called workflow **inherits the caller's permissions** (so it needs an explicit
minimal `permissions:`); and two callers firing on one tag **share a concurrency group** unless the
key includes the caller's name — "the release half-ships, one destination live and the other silently
absent. … Caught by reading, before shipping — there is no way to test it short of pushing a tag."
**Rank: load-bearing.** **Guard: partial.** [verified]

### A44. Name the cost of a deliberate duplicate, in the document, at the time
> "**The cost, named rather than discovered later:** two full suites per release tag. A real
> duplicate, accepted on the rare path … It is not the ~60-a-day duplicate GS-ci-once deleted and
> should not be read as reversing it." — `process-and-deploy.md`.

**Rank: aspirational** but cheap and high-value: it stops a later reader "fixing" a considered
trade. **Guard: no.** [verified]

### A45. Reproduce the bug before fixing it, and run the control that could exonerate your suspect
> "The bug was found by reproducing it: a local server sending GitHub Pages' own headers … Then the
> decisive control: **run it with the service worker removed entirely.** Still stale. The worker was
> never the culprit." — `process-and-deploy.md`, GS-sw-stale.

And the guard that came out of it: "**a second case that removes the revalidation and asserts the app
goes stale again** … a test that merely waited would report green on a worker that strands every
player for ten minutes." **Rank: load-bearing.** **Guard: yes** (`tests/sw-update.test.ts`).
[verified]

### A46. A policy claim is about your layer, not about the world beneath it
> "**'Network-first' is a claim about the worker's policy, not about the network.** A cache the
> policy never mentions sat underneath it the whole time. The comment at the top of `public/sw.js`
> promised 'online → always fetch fresh', and it had been wrong since the file was written" —
> `process-and-deploy.md`, *The wider lesson*.

**Rank: load-bearing.** **Guard: yes** (as above). [verified]

### A47. When a report survives a fix that measured green, go measure the picture, not the model
> "**THE LESSON, NOW THREE DEEP**: `landing-preview.mjs` drew at a camera the game does not use,
> `runout-frames.ts` reasons in the plan's own units and cannot see a camera cancelling the motion it
> measures — **neither rig could have found this and both reported success.**" — `CLAUDE.md`,
> GS-runout-clock.

And its root-cause twin: "**When a fix upstream silently removes the thing that was making a feature
work, no amount of tuning the feature will find it**" — `CLAUDE.md`, GS-landing-camera (retired):
seven passes tuned height, length, count and scale; the actual cause was a 42× speed fix five passes
earlier. **Rank: load-bearing** (the single most expensive documented episode in the repo).
**Guard: partial** — the rigs now take their constants from shipped code. [verified]

### A48. An instrument must use production's own constants
> "⚠️ **The eyes-on rig is how this survived four passes**: `landing-preview.mjs` drew every sheet at
> a hand-set 4.6 px/yd while the game drew 1.6, i.e. it was honest about the model and silently wrong
> about the picture. It takes the camera from the shipped constant now." — `CLAUDE.md`,
> GS-landing-camera.

**Rank: load-bearing.** **Guard: no** (convention). [verified]

### A49. Measure, don't eyeball — and say which number moved
> "**Measure, don't eyeball.** Re-run `scripts/runout-frames.ts` and read the `seen` column on BOTH
> firmness bands. The last two times this area was tuned from impression the wrong number moved." —
> `runout-bounce-handover-2026-07-31.md`, *Rules to respect while tuning*; and the definition-of-done
> convention: "Both firmness tables in the commit message, and no carry moved."

**Rank: load-bearing.** **Guard: no** (process). [verified]

### A50. Separate the free lever from the expensive one before you tune
> "Half right, and the halves have very different prices: **1. Free — redistribute … (render-only, no
> harness).** … **2. Not free — buy more roll with carry (balance change, needs the harness).** …
> **Try this first.**" — `runout-bounce-handover-2026-07-31.md`, *What to change, and what it costs*.

**Rank: load-bearing.** **Guard: partial** (the balance harness is the backstop for lever 2).
[verified]

### A51. A handover document states what it superseded
> "**CLOSED.** … Two things below were superseded by the work: neither of the two levers named here
> was the one that mattered … The measurement and the 'rules to respect while tuning' still hold." —
> `runout-bounce-handover-2026-07-31.md`, header.

**Rank: aspirational** (but it is why the doc is still usable). **Guard: no.** [verified]

### A52. Say what was verified and what was not
Every archive doc carries a **"Not verified" / "What was verified, and what wasn't"** section —
`save-integrity.md`, `save-transfer.md`, `android-packaging.md`, `accessibility.md` (GS-a11y-announce:
"the automated browser pane does not composite frames, so the shot never settles … **it deserves
eyes-on confirmation with a real screen reader**").

**Rank: load-bearing** (it is what stops scaffolding being read as a working build —
`android-packaging.md`: "Stated plainly so nobody reads the scaffolding as a working build").
**Guard: no.** [verified]

### A53. The constitution holds rules; the archive holds narrative; both are living, not append-only
> "**This file is the constitution — the rules that constrain *new* work.** … when you ship a
> feature, the durable *invariant* goes here (a line or two); the narrative goes in the archive doc.
> Treat CLAUDE.md like IDEAS.md: scan, rerank, merge, retire — **not append-only.**" — `CLAUDE.md`,
> preamble; `docs/decisions/README.md`, *How to use this*; `IDEAS.md` header;
> `DEVLOG-IDEAS.md` header. **Stated in four places.**

⚠️ **Flagged: unenforced, and currently violated.** `CLAUDE.md` is 2,164 lines and several "bullets"
run 30+ lines of tuning history — the exact shape the preamble says to move to the archive. Nine
archive files carry a *"Migrated from CLAUDE.md"* section that duplicates constitution text verbatim.
**Rank: load-bearing for continuity** (it is why a fresh session can work here at all).
**Guard: no.** [verified]

### A54. A report is a committed file; chat evaporates
> "A 'report' is a **file**, committed — not a chat message (chat evaporates between sessions)." —
> `CLAUDE.md`, *Reports & idea backlog*.

**Rank: load-bearing** [assumed]. **Guard: no.** [verified]

### A55. A backlog entry earns its place by having material, not a topic
> "An entry earns its place by having **material** — the specific thing that happened, and where the
> evidence is — never a topic." — `CLAUDE.md` / `DEVLOG-IDEAS.md` header. **Duplicated.**

Plus its two standing rules: **state facts, don't argue**, and **check the claim against the code
before publishing it** ("a wrong-but-better story once reached a chat summary, a commit message, a PR
body and a source comment on `main` before anyone re-read the file"). **Rank: load-bearing** (a
documented incident, `DL-guard-caught-it`). **Guard: no.** [verified]

### A56. One feature per session/PR
> "These systems share hot files …; a focused context produces fewer regressions than a marathon.
> Finish, ship, start fresh." — `CLAUDE.md`, *How to work with me*.

**Rank: aspirational** — no failure is attributed to violating it; the regression post-mortem
explicitly *acquits* the day of high-churn refactors and blames coverage instead.
**Guard: no.** [verified]

### A57. Default to shipping all the way
> "When a change is complete and tests are green, take it to done: open the PR, enable auto-merge …
> then sync `main`. Only stop short if the work is WIP, the user says not to, or CI is red." —
> `CLAUDE.md`; `process-and-deploy.md`, *Change & versioning flow*. **Duplicated.**

**Rank: aspirational.** **Guard: no.** [verified]

### A58. Pressure-test the idea before building it
> "If an idea is sound, say so and go. If it isn't, push back … A cheerful 'yep!' followed by a
> half-working result is the worst outcome." + "**Implement properly or stop.**" — `CLAUDE.md`,
> *How to work with me*.

**Rank: aspirational** (working agreement). **Guard: no.** [verified]

### A59. Promote durable knowledge out of private memory into the repo
> "Memory is a private scratchpad; CLAUDE.md, skills, and docs are the shared record. When you learn
> a gotcha or recipe, write it down — the *rule* in CLAUDE.md, the *story* in `docs/decisions/`." —
> `CLAUDE.md`, *How to work with me*.

**Rank: load-bearing** [assumed]. **Guard: no.** [verified]

### A60. Front-load; only ask when the answer changes what you do
> "Give all options in one pass; only ask a follow-up when the answer changes what you do —
> otherwise pick the sensible default and say which." — `CLAUDE.md`, *How to work with me*.

**Rank: aspirational.** **Guard: no.** [verified]

### A61. Split a high-fan-in module behind a re-export barrel; extract pure leaves first
> "splitting any of these must keep the original module as a **re-export barrel** so importers and
> the determinism contracts (byte-for-byte seeded tests) stay untouched." —
> `refactor-scan-2026-07-10.md`, *Ranking rationale*; and
> `app-ts-decomposition-2026-06-30.md`: the two easy wins were "**byte-identical relocations** of
> *pure, closed* clusters — functions that take their data as arguments and read no module state."

Plus the stop condition: "**You cannot move a screen-builder out without giving it access to
`state`** … it needs a small **architectural** step", and the sequencing rule —
**build the missing test harness before the refactor that needs it** ("Before extracting any
screen-builder, add a golden-HTML snapshot harness … This harness is itself the highest-value next
PR — it closes a real test gap regardless of the refactor").
**Rank: load-bearing.** **Guard: the suite.** [verified]

### A62. Two products, no shared library
> "**Keep the two products fully separate** — no shared repo, no shared deploy, no cross-imports. …
> Harvest the parts below as a **starting copy**, then let them diverge. Do not try to keep a 'shared
> library' in sync between them — that coupling is exactly what you don't want."
> — `GOLF-STARS-STARTER-KIT.md`, §0; restated in `CLAUDE.md` ("The two projects are independent. Do
> not re-couple them.") and in a *Do NOT carry from golf-finder* section in both `CLAUDE.md` and
> `process-and-deploy.md`. **Stated in three places.**

**Directly applicable: this is the rule for The Far Carry → Into the Coil.** The one sanctioned
exception in the record is scoped, named, and justified as *the inverse* of the thing rejected (the
network-first SW). **Rank: load-bearing** [assumed — stated as a decision, no failure recorded].
**Guard: no.** [verified]

---

# B — UNIVERSAL SHAPE, LOCAL CONSTANT

The rule transfers; the named part must be re-derived for *Into the Coil*.

### B1. Deterministic seeded RNG only, and a new feature consumes zero draws on its default path
**Shape:** all simulation randomness comes from one seeded generator; the platform RNG is banned in
the sim *and* in any deterministic render path. A new feature must consume **zero extra draws when
off** and must not reorder existing draws, so every existing seeded test stays byte-identical; gate
new draws behind the feature being armed. Added systems draw from their **own side streams** so they
perturb nothing.
> `CLAUDE.md`, *Architecture* + *Non-negotiable contracts* #1: "The whole test suite is the guard; if
> seeded numbers shift, you changed the stream."

**Re-derive:** the RNG module and stream-naming scheme (`:rough:`, `:boss`, `:approach:` …); the one
sanctioned platform-random site (here `freshRunSeed()`, side-effect layer only, pinned by `?seed=`);
which paths count as "deterministic render". For a shooter: wave composition, drop tables, enemy
fire patterns and any procedural level are the streams; the input-driven parts are not.
**Rank: load-bearing** — it is what makes every other guard in this repo possible. **Guard: yes**
(the whole suite + scans in `ball.test.ts`, `runout.test.ts`, the sim suite). [verified]

### B2. Headless ≡ interactive: two drivers, one resolution
**Shape:** the headless/auto simulation and the live player-driven path must resolve the same action
identically, with the same draw order ("the player draw first in both"). Any new mechanic is threaded
through **both** under the identical rule.
> `CLAUDE.md`, *Non-negotiable contracts* #2 (auto ≡ interactive).

**Re-derive:** what the two drivers are. Here `playHole`/`simulateRun` vs `takeShot`/`previewShot`.
For Into the Coil the analogue is a headless wave/run simulator vs the live frame loop — **this is
the contract that lets you test a real-time game at all**, and it has to be designed in from hour
one, not retrofitted.
**Rank: load-bearing.** **Guard: yes** (asserted across the suite). [verified]

### B3. The graphic IS the physics — one shared source, never forked
**Shape:** the function the simulation samples is the same one the renderer draws. "a ball drawn
clearing a tree is one the sim let through; the spray cone reads exactly the sampled distribution."
The renderer may **probe the sim's own function**, never a private predictor.
> `CLAUDE.md`, *Non-negotiable contracts* #5; and GS-ship-wall-phantom: "the aim cone probes the
> sim's OWN `firstSolidDeparture`, never a private predictor — `wallFlightHit` is deleted; **it
> disagreed with the sim on 42% of bounces**."

**Re-derive:** which functions. Here `flight.ts` + `SprayShape`. For a shooter: projectile paths,
hitboxes, and the telegraph/aim indicator for enemy fire — a drawn laser warning that is not the
hitbox is this exact bug.
**Rank: load-bearing** (42% disagreement, measured). **Guard: yes** (`tests/walls.test.ts` and the
render/sim shared-source tests). [verified]

### B4. A numeric balance fence, run as a harness, that a new mechanic must clear
**Shape:** one measured metric with an explicit bar and an explicit blow-up rate, re-run after any
change to the core loop's tuning; **a power-up must improve the metric to ship**.
> `CLAUDE.md`, *Non-negotiable contracts* #4 (no death spiral): `toPar/hole < 1.0` (relaxed harness
> `< 1.15`), `< 5%` blow-ups, on **mean per-stop Stableford — NOT full-run distance, because distance
> is chaotic**.

**Re-derive:** the metric, the bars, and — the subtle part — **which aggregate is stable enough to
measure**. Picking the chaotic quantity is the documented trap. For a shooter: something like mean
stage-clear rate or damage-taken-per-wave, not "furthest stage reached".
**Rank: load-bearing.** **Guard: yes** (`tests/characters.test.ts`, `scripts/death-spiral.ts`).
[verified]

### B5. The harness measures the AI; it is a regression fence, not a design authority
**Shape:** when honest physics and the fence disagree, **set the model from reality, MOVE the fence,
and record both numbers in the commit.** A harness number moving the wrong way is evidence about the
bot, never proof the model is wrong.
> `CLAUDE.md`, GS-carry-roll-real: "Degrading the ball flight to flatter a weak AI makes a worse game
> for the humans who actually play it." The case that settled it *improved* the harness (0.8740 →
> 0.5215) because "the bar it was defending was partly an artefact of the unrealistic split it was
> gating."

**Re-derive:** the bars, and how weak your bot is relative to a human (here: the auto sim stalls at
hole ~40 where humans reach 350+).
**Rank: load-bearing.** **Guard: partial** — the fence exists; moving it is a judgement call the
commit message must record. [verified]

### B6. Content as data — a new world / item / character is a ROW, never an engine edit
**Shape:** clubs, biomes, items, characters, formats, ships are tables the core reads; coverage is
made compile-forced with `Record<Key, …>` so adding a member of a known set fails to build until
every table has its row.
> `CLAUDE.md`, *Architecture*; `club-list.md` closes with: "No code path should need an
> `if (clubId === ...)`; if you reach for one, the data model is wrong — fix the table."

**Re-derive:** the tables. Also carry the **splitting** lesson: "Splitting a class is COMPILE-FORCED
at every `Record<FlightClass,…>`" — and where two rows should share a value (audio, shop copy), say so
(`CLAUDE.md`, GS-runout-club).
**Rank: load-bearing.** **Guard: compile-forced + coverage tests** (`biome-identity`, `audio`,
`factions`, `story-coil-crew`). [verified]

### B7. Editing the core content table is a documented recipe with a mandatory balance re-run
**Shape:** the table that looks like a one-line edit has fan-out (defaults, reward pools, threshold
constants tuned to specific values, and a dozen seeded tests). Write the checklist once, in order,
ending in the balance harness.
> `club-list.md` in full — *What a club id touches (grep these before you cut)*, *The carry-spread
> rule*, *The non-negotiable check: the death-spiral harness*, *The recipe (do it in this order)*.

**Re-derive:** everything inside it (carries, thresholds, the "re-spread the survivors" rule for gaps
in a ladder). The *shape* — id vs tuned number, both load-bearing; removal opens a gap that is a
regression even when green — is what transfers. For a shooter the analogue is the weapon/upgrade
ladder.
**Rank: load-bearing.** **Guard: yes** (`tests/clubs.test.ts`, `characters.test.ts`). [verified]

### B8. Validate generated content at generation time and THROW; never retry or patch
**Shape:** fairness is a property the generator proves, not a filter applied after. Penalty hazards
stay clear of the traversal corridor; sanctioned exceptions are **explicitly exempted and separately
proved completable**.
> `CLAUDE.md`, *Non-negotiable contracts* #3: "`validateFairness()` proves it … `generateCourse`
> throws on violation." And GS-cetus/river: "rivers hold the carry width and are fair by construction
> (`riverChannel` clamps, `generateCourse` throws, **no retry**)."

**Re-derive:** the predicates. For a wave shooter: "no wave can spawn an unavoidable hit", "no enemy
pattern can fill the safe lane", "every telegraph is dodgeable at the ship's speed" — provable
properties of a generated wave, asserted at build time.
**Rank: load-bearing.** **Guard: yes** (`hazards`, `island-gaps`, `contract` tests). [verified]

### B9. Variety is not difficulty
**Shape:** the axes that make content *feel different* must be decoupled from the axes that make it
*hard*, and the easy shapes must keep appearing at the top of the difficulty range (deliberately more
often, as breathers).
> `CLAUDE.md`, *Generator & sim* → *Variety ≠ difficulty*: "`straightP` RISES with wildness so deep
> stops gain straight breathers."

**Re-derive:** the two axis sets. **Rank: load-bearing** [assumed — GS-variety-2/3/4 are three
recorded passes at the same complaint]. **Guard: yes** (`tests/layout-variety.test.ts`,
`variation.test.ts`, `journey-variety.test.ts`). [verified]

### B10. One projector, one authored design frame, grown to the container's aspect
**Shape:** author the scene in a fixed design frame and let **one pure projector** map it to the
screen; when the container's aspect differs, **grow the frame** (keeping the meet scale) — never
stretch (distorts) and never slice (crops). One fitted frame feeds every consumer in a frame; a
re-measure per call "can straddle a resize and shear the overlay off the scene."
> `CLAUDE.md`, GS-play-fullframe + *Render layer*: "ONE pure projector (`render/project.ts`) both
> renderers share."

**Re-derive:** the design frame (here `360×640`) and the portrait/landscape decision — **for Into the
Coil this inverts**: the frame is landscape, and the rotation trick in B23 becomes the phone case
rather than the desktop one.
**Rank: load-bearing** (75px of black bars on a 390×844 phone). **Guard: yes**
(`tests/map-frame.test.ts`). [verified]

### B11. Every visual tolerance is a width of WORLD, not a count of pixels
**Shape:** blends, outlines, aprons and hit tolerances are expressed in world units scaled by the
camera (floored/capped in px), because a px constant "reads as a plausible apron on the whole-hole
map and collapses to a hairline at the chip/putt camera, which is exactly where the player studies
the turf." Where the decision is about *the course*, keep it unclamped — "a px decision pops a run
in/out on a follow-cam zoom."
> `CLAUDE.md`, GS-green-complex (`turfPx`), GS-fairway-silhouette, GS-cetus-void-glow ("Reach is
> measured in YARDS").

**Re-derive:** the unit (yards) and the floors/caps. **Rank: load-bearing.** **Guard: yes**
(`green-complex`, `fairway-silhouette`, `camera-stability`). [verified]

### B12. Visibility is a question about SCREEN PIXELS, asked at the camera that actually ships
**Shape:** whether a drawn detail will be *seen* cannot be answered in world units — the camera
frames it. Pass the camera's own scale into the planner and drop details below the size of the thing
they are drawn against.
> `CLAUDE.md`, GS-runout-seen: "**a length in YARDS cannot answer 'will this be seen'** … 0.75yd is
> 3.7px behind a 9-iron and 0.8px behind a drive"; and GS-runout-visible: "**18 of 40 club/power
> combinations drew a peak bounce of 0.7–2.6px under a ball drawn at 3px** — the ball never cleared
> itself."

⚠️ And the coupling: "**`ballYd` must be asked at the LANDING camera** … asked at the flight camera
the push-in arrives to find the tail already thrown away."
**Re-derive:** the cameras in your game and the reference object (here the drawn ball). For a shooter:
bullet size vs muzzle flash vs the ship sprite at the shipped zoom.
**Rank: load-bearing** (four failed passes before it was found). **Guard: yes**
(`tests/runout.test.ts` + `scripts/runout-frames.ts`). [verified]

### B13. Exaggerate consistently across a decay chain, or the effect is seen twice and lost
**Shape:** when one axis of an effect is exaggerated for readability, exaggerate it **along the whole
train** — if height dies twice as fast as length, the tail becomes sub-pixel and the player sees two
of six.
> `CLAUDE.md`, GS-runout-ladder: "the driver planned SIX hops and the player saw **TWO**".

Also: the exaggeration multiplies the physical rate rather than replacing it, "which is what keeps
the SURFACE in charge" (GS-bounce-ladder). **Re-derive:** the decay constants.
**Rank: load-bearing.** **Guard: yes.** [verified]

### B14. The camera must let go, and must arrive before the thing it is watching
**Shape:** a follow-camera that chases at a fixed ease makes an object *appear stationary* while the
world scrolls behind it — "total screen travel over the closing roll, **2.6 pixels**". At the moment
that matters, hand over to a **dead-zone camera holding the point of interest**, and start the
hand-over *early* (`landingZoomLeadMs`) or the camera pans forward through the first and biggest beat
and draws it **moving backwards**.
> `CLAUDE.md`, GS-runout-clock and *round 2*: "A bounce drawn the wrong way is worse than one drawn
> still."

Plus the settle rule: "the follow-cam must be able to ARRIVE … under `CAMERA_SETTLE_PX` (0.05 **screen**
px; a yard threshold means something different at every zoom) it SNAPS onto the ball and stops" —
which is *also* what lets the scene cache hold (B15).
**Re-derive:** the lead time, leash fraction and settle threshold. **Rank: load-bearing.**
**Guard: yes** (`tests/runout.test.ts`). [verified]

### B15. A picture that cannot have changed is not redrawn
**Shape:** cache the painted static scene in an offscreen surface keyed on the projector's identity
and blit while it is unchanged; a **moving** camera skips the offscreen entirely (painting it as well
as the frame is strictly more work). Memoize the per-entity art seed.
> `CLAUDE.md`, GS-shot-lag: "**~100,000 canvas ops** … the putt watch ran at **3.3 fps** … Putt watch
> **3.3 → 59.9 fps**, steady-state ops/frame **97,477 → 128**."

⚠️ "The offscreen takes `canvas.width`, NEVER a re-derived `width * dpr`" — a fractional DPR truncates
and resamples the world. ⚠️ And: "**It is not a leak**" — measured before assuming.
**Re-derive:** the op counts and the cache key. **Rank: load-bearing.** **Guard: yes**
(`tests/play-scene-cache.test.ts` — "a canvas-op census, confirmed to fail at 97,477 on the old path
— never a frame-rate assertion"). [verified]

### B16. One UI-scale token, composed of independently-owned halves, multiplied and never read back
**Shape:** a single root `zoom` scales **text and touch targets together** ("one lever fixes small
text AND sub-44px targets"). It is the product of a user-owned half and a display-derived half:
`calc(var(--reader) * var(--display))`. **Nothing may write the combined token** (an inline root
property beats the stylesheet and deletes the other half) and **nothing may read it back** (an
unregistered custom property computes to its token stream, so `Number(getPropertyValue())` is `NaN`).
> `accessibility.md`, GS-a11y-readable-text *Invariants* + GS-ui-display-scale *The insertion point is
> one token*.

Two things that must be fixed to make root `zoom` safe, "and both are load-bearing":
- **No raw viewport units** — a `100dvh` box inside a zoomed root measures one screen of *zoomed*
  units ("naive `zoom: 1.25` put the Swing button **185px below the fold**"). Use tokens that divide
  by the scale. **Any multiple** of `vh/dvh/svh/lvh`, in stylesheets *and* in TS style strings.
- **No component computes its own device-pixel ratio** — one helper folds the zoom in, or "at 1.45× on
  a dpr-2 phone the play view rendered at **0.69× the resolution it was displayed at** — visibly soft,
  on the one screen the setting exists to make legible."

**Re-derive:** the reference device (390×844), the clamp (`clamp(1, min(w/390, h/844), 1.5)`) and the
ceiling's justification ("1440p and 4K stop there rather than rendering the HUD at 1.71×/2.56×").
**Both axes must be read** or a proportionally narrow viewport gets zoomed on height alone.
**Rank: load-bearing.** **Guard: yes** (`tests/accessibility.test.ts`, `display-scale.test.ts`).
[verified]

### B17. Media queries are blind to root zoom — make content cope intrinsically; branch only on a measured attribute
**Shape:** `zoom` shrinks the layout box but not the media-query viewport, so **a breakpoint can never
answer "is this cramped at large text?"**. First answer: `overflow-wrap: anywhere`, `min-width: 0`,
`flex-wrap`, `auto-fit` tracks. For genuine either/ors, stamp one measured attribute
(`data-gs-fit="tight"`) computed by **the only module allowed to compute a scaled viewport**.
> `accessibility.md`, *⚠ Media queries are blind to the UI scale* and *Bug 2* — **stated twice in the
> same document**, and again in `CLAUDE.md`.

**Re-derive:** the thresholds (660 × 330 layout units) and what "tight" removes. The removal rule is
A35's: fewer things, same size.
**Rank: load-bearing.** **Guard: yes** (`a11y-mobile-layout.test.ts`). [verified]

### B18. `1fr` is `minmax(auto, 1fr)` and `auto` is a min-content floor
**Shape:** a bare `1fr` track whose content cannot shrink pushes the whole grid past its container.
Use `repeat(auto-fit, minmax(min(Npx, 100%), 1fr))` — "it can't blow out AND it drops a column on its
own, which no breakpoint could decide."
> `CLAUDE.md`, *UI layer*; `accessibility.md`, *Bug 2*. **Duplicated.**

**Re-derive:** `N` per component. **Rank: load-bearing** (three named symptoms: settings chips off the
sheet, a fuel gauge under a dial, a hero CTA clipped to "Trave/onwa"). **Guard: yes.** [verified]

### B19. In an embed, the page cannot scroll itself — detect and scroll inside
**Shape:** an iframe host may set `scrolling="no"`, so the document cannot scroll and content below
the fold is unreachable; the wheel scrolls the *host page* instead. Gate a "scroll inside" mode on
"am I in an iframe" (**not** on "did the iframe forbid scrolling" — not observable from inside), treat
a cross-origin throw as embedded, and exclude the surfaces that are already one screen tall.
> `CLAUDE.md`, GS-embed-scroll: "the Pro Shop is **1388px of content in an 860px frame and 528px was
> unreachable**"; deliberately not applied everywhere because a self-scrolling page stops a mobile
> address bar collapsing.

**Re-derive:** the host (itch), the excluded classes, the embed dimensions. **Rank: load-bearing.**
**Guard: yes** (`tests/embed-scroll.test.ts`, which drives a real `scrolling="no"` iframe — "the only
place the bug exists"). [verified]

### B20. One persistent gameplay frame; states change contents, never the skeleton
**Shape:** the play screen's N view states mount the **same regions in the same places**; only the
contents change. **Nothing is removed, only `disabled`** (a dead control greys in place). The panel is
anchored so the commit control lands at the same y in every state. A new state is new row contents,
never a second skeleton.
> `CLAUDE.md`, GS-hud-frame; `reports/hud-frame-2026-07-25.md` [not read].

**Re-derive:** the five regions (info bar · nav column · caddy slot · controls panel · action column)
and the anchor. For a shooter: score/lives/weapon/pause is the analogous fixed cluster.
**Rank: load-bearing.** **Guard: yes** (`tests/play-hud-frame.test.ts` forbids a second full-frame
element). [verified]

### B21. A readout the world already draws is not a HUD row
**Shape:** delete HUD text that restates what the scene renders to scale; put instructions **on the
control they instruct** ("An instruction printed ON the control it instructs costs no row"); and only
the primary control sits in flow — the rest floats over the world, because the bar's height *is* the
camera's clear band.
> `CLAUDE.md`, GS-hud-bag ("bar 148→66px, band 50%→77%") and GS-putt-panel ("Panel ~225 → ~185px").

**Re-derive:** which readouts are redundant in your game and the resulting band fractions.
**Rank: load-bearing** [assumed — driven by play-test reports, not a bug]. **Guard: yes**
(`club-picker`, `putt-panel`, `hud-topbar` tests). [verified]

### B22. Frame the action around the HUD, in both directions, from measured bands
**Shape:** the camera must clear the bottom panel **and** the top bar; measure the clear band **per UI
state** (panel heights differ, and a body is built while the previous state's HUD is mounted), **store
the resolved bias** for the follow phase to reuse (re-deriving at release reads the wrong panel and
pops the camera), and **solve the zoom from the span the HUD actually leaves** rather than a constant
— because how much room the HUD leaves is a property of the device.
> `CLAUDE.md`, GS-play-hud-space + GS-decision-frame-carry: the drawn cone sat "**54px behind the
> bar** on a 320×568 phone"; fixed, "cone clearance 320×568 **−54 → +90px**".

⚠️ And it must be fed the **finishing** extent, not the mid-flight one — "the reach was fed a CARRY
when the ball finishes at the TOTAL". **A pure test can only re-derive the rule from its two inputs —
that is a second description, so the guard that matters is the BROWSER one.**
**Re-derive:** the band fractions, the fill fraction (0.8), the device matrix.
**Rank: load-bearing.** **Guard: yes** (`tests/map-frame.test.ts`, browser). [verified]

### B23. Turn the camera, never the simulation
**Shape:** when the container's aspect is the wrong way round for the authored composition, rotate the
**view** and keep positions, hitboxes, bounds, speeds, spawns and phase timings in design space —
"so the balance and the fairness-by-construction hold without re-measuring." Rotate only when it buys
scale, so the native orientation stays byte-for-byte. The **HUD keeps its own upright frame** (and in
the rotated case it gets the letterbox bands, so the bars stop covering the playfield). A sweep/aim
offset is **one value the hit test reads**, merely *drawn* on whichever screen axis crosses the target
— "so the timing window is provably orientation-independent."
> `CLAUDE.md`, GS-story-battle-portrait: "on a 390×844 phone it meet-fitted to a **390×234 strip
> between two slabs of black** … 2.8× the drawn area"; `src/render/battleFrame.ts:19`.

⚠️ The documented failure: "Re-lighting the serpent for the turned camera was BUILT AND THROWN AWAY …
**The side-on read is a property of turning a side-on COMPOSITION; only a portrait-authored pose fixes
it.**" ⚠️ And: "a full-frame wash must cover the VIEW RECT, not the arena box."
**This is the single most directly transferable render rule in the archive** — Into the Coil is
landscape-composed and will meet portrait phones.
**Re-derive:** the design frame (1000×600 here) and the scale-about-a-pivot factor.
**Rank: load-bearing.** **Guard: yes** (`tests/battle-frame.test.ts`). [verified]

### B24. Armament is a table keyed by hull; the upgrade says what a shot does, the hull says where it comes from
**Shape:** mounts, fire pattern, muzzle flash and trail are a `Record` keyed by the ship kind
(compile-forced: a new hull fails to build until its guns are decided), drawn in the hull's own
palette. **The split is the rule:** the upgrade owns the projectile's behaviour, the hull owns its
origin and look — "a hull that overrode the projectile SHAPE would make all five fire the same thing
and an arsenal would stop reading as an arsenal." **ZERO BALANCE: a mount moves where a shot is BORN,
never how many there are.** One definition of where the hull is (bank/bob), read by sprite, barrels,
flashes and shots alike; a flash is stored **by mount index, never a world position**, or it slides
off a moving hull.
> `CLAUDE.md`, GS-story-battle-arms; and GS-story-battle-topdown for the plan-view twin: a plan view is
> **symmetric about the keel**, so a one-sided mount set must be mirrored.

**Directly transferable: this is Into the Coil's core system.**
**Re-derive:** the hull kinds and the mount sets. **Rank: load-bearing** [assumed — "a mythic saucer
spat buckshot exactly like the woody estate" is a quality failure, not a crash].
**Guard: yes** (`tests/battle-arms.test.ts`, `ship-top-art.test.ts`). [verified]

### B25. A boss fight is one engine with swappable painters returning the same anchors
**Shape:** two bosses, one fight loop: each painter returns the same anchor struct, so targeting,
muzzle positions and the finisher are **one code path** and only the weapon art changes; identical
timings/speeds/counts. "A new boss = a new painter + a branch, never a forked fight loop."
> `CLAUDE.md`, GS-story-battle-3 / GS-story-warden-ark.

⚠️ And when the boss is drawn at a different scale, **the returned anchors are mapped through the same
scale**, "or targeting/muzzle/finisher become a second description of where the boss is."
**Re-derive:** the anchor set. **Rank: load-bearing.** **Guard: yes.** [verified]

### B26. A boss must ARRIVE, hits must BITE, a phase turn is a BEAT — all render-only
**Shape:** the "it's just fine" problem is solved with five render-only levers, **none of which move
damage, spawn, cooldown, threshold or hitbox**: an entrance (name + epithet + roar, tap to skip, the
assault's clocks start when it *ends*); hitstop **with the art clock frozen too** plus a damped-spring
flinch along the shot's axis and a floating damage number; a phase turn that visibly **clears the
field**; an arena with parallax place; and a real boss bar (chip bar draining a beat behind).
New decor draws from **its own stream** so scenery can't shift a volley.
> `CLAUDE.md`, GS-story-battle-epic.

**Re-derive:** the timings (2.8s entrance). **Rank: load-bearing** [assumed — a quality pass, not a
bug]. **Guard: yes** (`tests/battle-intro.test.ts`; the preview rig's waits "carry an explicit `ENTRY`
term — a bare number is a silent 2.8s error"). [verified]

### B27. A scene frame confines its own stacking
**Shape:** a scene that orders its contents by depth legitimately mints z-indices in the hundreds;
without `isolation: isolate` on the frame those are members of the **root** stacking context and paint
over every fixed overlay. "**`overflow:hidden` clips GEOMETRY, never paint order**; and
**`container-type` is not a stacking context.**"
> `CLAUDE.md`, GS-scene-isolate — "four golfers and their parked cars standing on the settings sheet".

⚠️ The instrument trap: "**`elementFromPoint` is the WRONG instrument**" — an `inert` subtree is dropped
from hit-testing while painting exactly where it did, so the probe said the sheet was on top while a
screenshot showed otherwise; the guard strips `inert` first.
**Re-derive:** which frames, and the overlay z-index band. **Rank: load-bearing.** **Guard: yes**
(`tests/scene-stacking.test.ts`). [verified]

### B28. Tab order is DOM order; the primary action is first, and focus arrives on it every time
**Shape:** emit chrome that is `position:absolute` **last** (its place in the string decides nothing
but tab order); focus the primary control as each decision mounts, **keyed on the decision, not the
render**, so a same-decision re-render leaves focus where the player put it; stand down for a covering
layer by **asking the DOM** (a marker attribute), never a flag; `preventScroll` always.
> `accessibility.md`, GS-a11y-stroke-focus: "**three tabs to Swing and five to Putt** … paid AGAIN on
> every stroke, for eighteen holes, in a game that is *entirely* golf strokes."

⚠️ Two sub-traps: a `role="button"` on a canvas earns a tab stop and an Enter binding that synthesises
a `click` the canvas never listened for — **a dead stop**; make it `role="img"` naming the control that
does work. And an off-element key binding (arrows on `window`) is invisible: point the commit control
at a `.sr-only` hint with `aria-describedby`.
**Re-derive:** the decision key (`hole:shots:putts:lie`) and the control order.
**Rank: load-bearing.** **Guard: yes** (`tests/a11y-keyboard.test.ts`). [verified]

### B29. Every mechanic reachable by pointer is reachable by keyboard, through the same setter
**Shape:** arrow keys mirror the drag axes and go through **the same setter the drag calls** — "it is
one shot mechanic driven by two devices, not two mechanics that can drift apart"; a test asserts the
drag no longer computes its own target. Deliberately **no global commit key** (it would double-fire
with the focused control).
> `accessibility.md`, GS-a11y-keyboard.

⚠️ "**The listener is bound per render**, so its cleanup runs at the *top*, **before every early
return** — those early returns are exactly the cases where the decision screen went away." Bound
naively, "a single arrow press steps the aim N times."
**Re-derive:** the axes and the fine-step modifier. **Rank: load-bearing.** **Guard: yes.** [verified]

### B30. One parked run per mode per character, and ONE function answers what a state parks
**Shape:** a single "resumable" slot that several modes write through **silently destroys** whatever
else was parked. Key slots by `mode:characterId`; keep one `lastPlayed` pointer; and make **one pure
function** the answer to "what does this state park", called by *both* the persist path and the
navigate-to-title path — "Two descriptions of that decision is the bug this whole document exists
because of."
> `save-slots.md` in full; `CLAUDE.md`, GS-save-slots.

Sub-rules that transfer:
- **The discrimination order matters** — a story round is played *on* the strokeplay format, so the
  flag must be checked before the format, or a campaign round is filed under the wrong mode.
- **"Nothing worth continuing" is a predicate, not a special case** — one `slotTag()` read by the
  title card, the picker badge and the parker, "so merely opening the star map can no longer eat the
  round parked there."
- **A confirmed start-over empties the slot there and then**, never "when the new run overwrites it".
- **Resume at the same granularity in every mode** — "mixed rules are worse than any single rule; a
  player who learns one mode's behaviour will lose a run in another." A mode that cannot be proven
  falls back **and says so, in the same words**: "A uniform promise is what the player is owed; a
  uniform *lie* is not an acceptable way to get one."
- **A separate save namespace is deliberately NOT folded in** — "Unifying buys tidiness and costs a
  risky migration of the one blob you least want to touch."

**Re-derive:** the mode set, the key shape, and what a "run" is. For Into the Coil: stage runs per
pilot.
**Rank: load-bearing** (three named bugs, one found in play). **Guard: yes**
(`tests/save-slots.test.ts`, plus a source scan banning the snapshot helper from the persist module).
[verified]

### B31. A backup is a BUNDLE; a new persisted blob must join it or it is silently lost
**Shape:** progress spread over several keys means exporting one of them "silently dropped a player's
entire campaign. 'It worked, and you lost half your stuff' is precisely the failure a backup feature
exists to prevent." Envelope with its **own** version, independent of the inner schema versions; a
`null` member is a real value (importing a campaign-less backup *clears* the device's campaign,
"otherwise a restore produces a pairing that never existed on either device").
> `save-transfer.md`, *A backup is a BUNDLE, not a save*; `CLAUDE.md`, GS-save-transfer.

**Bump the envelope version when a member changes shape** — "it makes an older build **refuse** a v2
file loudly instead of handing the roster to `migrateStory` and silently restoring one mangled
campaign."
**Re-derive:** the key list. ⚠️ **For Into the Coil's cross-game import this is the crux**: the
importer must classify by version *and* by provenance, and refuse rather than guess (A11/A12).
**Rank: load-bearing.** **Guard: yes** (`tests/save-backup.test.ts`). [verified]

### B32. Storage is per ORIGIN — production can never move, and staging can never be a path
**Shape:** an installed app binds to its origin and its saves live there. Therefore: **production
stays put forever**; staging is a **separate subdomain on a separate host**, never `/next/` on the
same origin — "Staging and production would share the same blobs, and a staging build with a bumped
save schema would write something production refuses to read … and it would be a real player."
Three environments: **prod on a version tag, staging on every push to main, a preview URL per
branch** — "the row that actually answers 'let me try it before it's merged'."
> `process-and-deploy.md`, GS-staging; `CLAUDE.md`, *A RELEASE IS A TAG; `main` IS STAGING*.

**Why it exists:** "every merge went straight onto their phones. In one day that shipped four passes
at the ball's bounce, two of them net-worse … The play-test loop was running in production."
**Re-derive:** the hosts and domains. **Rank: load-bearing.** **Guard: partial** (workflow triggers +
the environment ref policy of A40). [verified]

### B33. One build, one artifact, one version, stamped from one place
**Shape:** every destination ships the **same** build output; the tag asserts against the manifest
version and fails loudly otherwise, "because `APP_VERSION` is defined from package.json, so a mismatch
means the game shows the player a build number that traces to nothing." Any constant "somebody has to
remember to bump" is substituted at build time instead.
> `release-pipeline-2026-07-30.md`, *Design notes* + *The one remaining hand-bump*; `CLAUDE.md`,
> GS-release-identity ("a constant somebody must remember to bump eventually lies about which build
> the player is looking at").

⚠️ Known gap recorded: the tag-vs-manifest assertion lives in only one of two workflows.
**Re-derive:** the version source and the placeholder mechanism (`%GS_VERSION%` via a build plugin,
for code that cannot import).
**Rank: load-bearing.** **Guard: yes** (`tests/brand.test.ts` guards source placeholder *and* built
output). [verified]

### B34. Every user-facing string reads a brand constant, never a literal
**Shape:** the product name is a label; a **persisted string is a contract**. All titles/versions come
from one module; renaming is free **only before launch**, and after it every read path must accept the
old spelling while every write is canonical — "Old input, new output". **Nothing new may join the
legacy list**: "a second legacy namespace means the rename happened twice, which is a decision to
revisit, not a case to handle." Package/app identifiers deliberately keep the old spelling because
they are invisible to players and **permanent**.
> `CLAUDE.md`, GS-release-identity; `src/brand.ts:9`; `android-packaging.md` (the app id "can never
> change after the first upload").

⚠️ "**The SW cache prefix is ONE decision written in THREE places that cannot share a constant** …
disagree and the page DELETES ITS OWN offline cache every boot while believing it is tidying up after
a sibling app" — the canonical A1-tier-3 case.
⚠️ And a **rasterised wordmark makes the title's length load-bearing** (measured 918px against a 904px
budget — "the fit is not defensive").
**Re-derive:** the names, the legacy map, the cache prefix.
**Rank: load-bearing.** **Guard: yes** (`tests/brand.test.ts`, reading all three copies). [verified]

### B35. The offline worker is network-first, scoped, and revalidates — and is disabled in the native shell
**Shape:** a cache-first worker resurrects a stale-serve blank page with no hard-refresh escape;
network-first with an explicitly revalidating shell fetch (`cache: 'no-cache'`, **not** `no-store` —
"which would … re-download the whole 2.4MB bundle on mobile data") and
`register(..., { updateViaCache: 'none' })`, or "the browser asks its own cache whether the worker
changed and is told no." Scope it to the subpath so a sibling app on the same origin cannot be
hijacked, and **narrow any foreign-worker cleanup to foreign workers only**.
> `process-and-deploy.md`, *PWA / installable app* + GS-sw-stale; `CLAUDE.md`.

⚠️ **In a native shell, disable it entirely** — the shell serves from `https://localhost`, which
*passes* the protocol guard, so an ungated worker "would cache already-local assets and resurrect the
stale-serve bug with no hard refresh to escape it" (`android-packaging.md`, and stated again in
`CLAUDE.md` — **three documents**).
**Re-derive:** the scope path, cache name, and shell detection.
**Rank: load-bearing.** **Guard: yes** (`tests/sw-update.test.ts`, `build.test.ts`). [verified]

### B36. The deploy source setting has a failure signature — write it down
**Shape:** a static host serving raw source instead of the build produces a permanent blank page, and
the signature is a string **a build can never emit** (`/src/main.ts`). Keep a boot watchdog that
captures import-time throws *and* failed resource loads, records the first, and **latches** so a
timeout cannot clobber the real cause.
> `process-and-deploy.md`, *Deploy (GitHub Pages) — the hard-won gotcha*; `CLAUDE.md`.

"This caused a long blank-page hunt: every code fix was correct but **was never the file being
served**." The same signature later caught the first staging deploy in one request.
**Re-derive:** the dev-entry string and the watchdog's contract.
**Rank: load-bearing.** **Guard: yes** (`tests/build.test.ts` guards the inlined output *and* the
error-capture contract). [verified]

### B37. Native shell over web-view-of-a-URL, for save durability
**Shape:** wrapping the web build in a native shell keeps storage in the app's private directory
("'clear browser data' wipes a hundred-hour campaign" otherwise), gives offline-from-install, and
avoids coupling the release to origin-root verification files. Cost, accepted: "a mid-run behaviour
change is a *hazard*, not a feature."
> `android-packaging.md`, *The decision: Capacitor, not a TWA*.

⚠️ **Three build channels are three different signing certificates and are mutually un-updatable** —
"Pick one channel per device and stay on it", and switching costs an uninstall, which wipes the save.
**Re-derive:** the platform, the id, the key handling ("Generate the upload key **on your own
machine** — never in CI, never in a chat transcript; a key that has been printed anywhere is burned").
**Rank: load-bearing.** **Guard: partial** (CI workflow, not a required check). [verified]

### B38. Back/Escape is ONE pure tiered decision, and only the root screen may exit
**Shape:** the hardware back button and the desktop Escape route through one pure function so the
policy "can be exercised without a device and can never fork". Four tiers: **dismiss the topmost
layer** (never prompts — "this is most of the value") ▸ **navigate to the parent using the screen's
own back action** ▸ **swallow on forward-only beats** ("treating back as 'continue' would let a player
skip a reward pick and desync … One dead press beats a corrupted campaign") ▸ **confirm, then leave**.
An unhandled back "reads as a crash, and it is the single most likely thing to sink a store review."
> `android-packaging.md`, *The back gesture*; `CLAUDE.md`, GS-android-back.

⚠️ **An on-screen back button must dispatch what the pure function answers for *its* screen** — every
navigation action is screen-guarded, so carrying a neighbour's action is "not a wrong destination, it
is a **DEAD BUTTON**". The trap is one module rendering two screens (`CLAUDE.md`, GS-story-back-dead).
⚠️ **A confirm must say the thing that is true**: since the run is parked, the copy names the real cost
and "a test asserts the wording never says 'lose'".
⚠️ **The exit action must leave no screen-local state behind**, or a stale flag redresses the next
screen.
**Re-derive:** the screen union and the tier assignments. **Rank: load-bearing.** **Guard: yes**
(`tests/back.test.ts`, plus a test that parses the rendered button's action and reduces it — "a back
action that returns the same state fails"). [verified]

### B39. The screen flow is a pure reducer; the shell is thin; a new screen is a new module
**Shape:** `(State, Action) → State` with no DOM and no time; the barrel holds only the switch, with
state/action types and helpers in siblings **that never import the barrel**; every screen is its own
module reading state from a context module, "never dispatching or importing app.ts".
> `CLAUDE.md`, *UI layer* (GS-refactor-split, GS-app-split); `app-ts-decomposition-2026-06-30.md` for
> the cost of not doing it ("`let state: UiState` … referenced **~192×**").

**Re-derive:** module names and the screen list. **Rank: load-bearing** (the god-file was "the
likeliest source of regressions" and hosted a named regression cluster). **Guard: partial** (structure
+ `tests/ui.test.ts`). [verified]

### B40. Surgical refreshes, not full re-renders, for in-place interactions
**Shape:** a full re-render re-mounts frames and replays entrance animations as a flicker, and rebuilds
the whole scene (which lagged the drag). Swap the affected subtree's innerHTML and re-wire; redraw only
the overlay group during a continuous gesture.
> `CLAUDE.md`, *UI layer* (GS-settings-flicker).

**Re-derive:** which surfaces. ⚠️ Couples to A30: a surgical update must **preserve focus**.
**Rank: load-bearing.** **Guard: partial.** [verified]

### B41. Assetless audio: synthesized, per-family voices, machine-checked coverage, private stream
**Shape:** every cue and note is synthesized — no downloaded file, ever. One audio context, separate
buses for effects and music. Voices keyed per **family/surface/archetype** with coverage
machine-checked. Music is table+dispatch on a **private seeded stream**; the sim never calls audio and
audio modules **import clean in Node**.
> `CLAUDE.md`, *Audio*; `docs/decisions/audio.md` [front matter not read].

**Re-derive:** the voice tables and gain caps. **Rank: load-bearing** [assumed]. **Guard: yes**
(`tests/audio.test.ts`, coverage). [verified]

### B42. Zero third-party binary assets, and privacy is a property of the code
**Shape:** the build ships no third-party binaries (a bundled font was rejected at ~113KB base64 on top
of the evidence); the "collects nothing" claim is enforced by a build-failing guard on network calls,
analytics-shaped dependencies, and **storage-key ↔ policy-table drift in both directions**. "If one of
those fails, the fix is a DECISION — undo it, or update the document — never a relaxed test: a privacy
policy that has quietly become false is worse than none."
> `CLAUDE.md`, opening block; `tests/privacy.test.ts` header; `reports/asset-provenance-2026-08-01.md`
> [not read].

⚠️ **The document names its own exceptions**: the built bundle *does* contain `fetch`/`document.cookie`
from a bundler polyfill and unused platform shims, so the guard scans **source**, and the policy names
those rather than claiming the bundle is clean.
**Re-derive:** the key table, the banned patterns, the named exceptions.
**Rank: load-bearing.** **Guard: yes** (`tests/privacy.test.ts`). [verified]

### B43. Crash reporting stays local because the sim is deterministic
**Shape:** with a seeded deterministic sim, **a seed plus a build number IS the bug report**, and it
beats a minified stack trace from a third-party SDK — so no telemetry SDK is needed to be
diagnosable.
> `CLAUDE.md`, opening block (GS-crash-diagnostics).

**Re-derive:** what the reproduction tuple is for your game (seed + build + input log, for a
real-time shooter — the input log is the part The Far Carry does not need and Into the Coil will).
**Rank: load-bearing** [assumed]. **Guard: yes** (`tests/crash-report.test.ts` exists). [verified]

### B44. Escape hatches live behind one namespaced global, read through a platform guard
**Shape:** feel/physics tunables ship behind live console flags so they "degrade safely and can be
A/B'd", read through a `typeof window` guard so the core stays Node-pure. **Prefer a sub-field over a
new top-level flag** — a new flag obligates the hub sync (A29).
> `CLAUDE.md`, *Non-negotiable contracts* #6 and *Three lenses* (QA analyst).

**Re-derive:** the namespace and the field set. **Rank: load-bearing.** **Guard: yes** (the
auto-discovering hub guard). [verified]

### B45. Three lenses: run every change through all of them
**Shape:** a fixed, named set of review perspectives applied to *every* change, one of which is
explicitly "lifeless-but-correct is a bug" and another of which is "verify, don't assume".
> `CLAUDE.md`, *Three lenses*: game-feel designer · QA analyst · genre-soul keeper ("fair and readable
> even when the content is absurd … an unfair or unreadable shot is a bug even if the physics are
> 'right'").

**Re-derive:** the third lens. For a shooter it is roughly *"readable bullet patterns; a death the
player could not have seen coming is a bug even if the spawn was legal"* — which is B8's fairness
contract wearing its design-review hat.
**Rank: load-bearing** [assumed — it is the frame the archive's judgements are written in].
**Guard: no.** [verified]

### B46. Author every item through three lenses: visual, lore, interaction
**Shape:** "No item ships as a bare stat line." Its own art in the house language (no two share a
silhouette); *detailed* flavour composed from reusable canon plus an item-specific line; and a
tappable card carrying art + name + kind/rarity + mechanics + lore. "**a stat-only item is an
incomplete item.**"
> `story-mode.md`, *The item-authoring rule (EVERY individual item — GS-story-lore-cards)*.

⚠️ A machine-checked corner exists: "**a quest promises what it PAYS**" — a non-club reward may not use
club words (`CLAUDE.md`, GS-story-coil-names).
**Re-derive:** the card component and the canon source. **Rank: aspirational→load-bearing**
(quality rule; one sub-case is guarded because it shipped wrong twice). **Guard: partial.** [verified]

### B47. No copy may assume the protagonist's gender, and it is machine-checked in three passes
**Shape:** when the hero is a player pick, "a line that genders them misgenders somebody". Two shapes
to hunt: a **gendered vocative** aimed at the player, and a **generic masculine** on an indefinite role
the player occupies. Third-person copy *about* an NPC is correctly gendered and stays. The guard is
three passes: a **walk of the accessors** (what actually renders, fallbacks included), a **vocative
scan of the source** (for a row nobody wired an accessor for), and a **generic-masculine scan of the
whole surface**. "Exceptions are an allowlist that NAMES whose line each one is."
> `CLAUDE.md`, GS-story-neutral-address — three bugs shipped: a beat line, a beat **title**, and a bar
> greeting.

**Directly transferable: Into the Coil has a four-pilot roster.**
**Re-derive:** the cast and the allowlist. **Rank: load-bearing.** **Guard: yes**
(`tests/neutral-address.test.ts`). [verified]

### B48. One indexed dialogue block per character, machine-checked for full coverage
**Shape:** all of a character's role-specific dialogue is one keyed table; **a new character is new
rows, never an engine edit**; a test asserts every roster member has every required line.
> `CLAUDE.md`, GS-story-betrayal (`BETRAYAL_VOICE`, "`everyGolferHasBetrayalVoice` machine-checks full
> coverage"); GS-story-coil-names ("**A COIL AGENT HAS ONE NAME AND ONE JOB**" — one seam resolves any
> speaker's name, "so no surface resolves names itself").

**Re-derive:** the roles and the roster. **Rank: load-bearing** (surfaces plated raw ids —
*"The Shedding — with a"*). **Guard: yes** (`story-cast`, `story-coil-crew`, `neutral-address`).
[verified]

### B49. Narrative state derives from what the player DID, through one seam
**Shape:** who betrays you is not a flag set by a beat — it is computed from a **weighted tally of the
player's own choices**, with a second function saying *why* ("the bigger gap, top or bottom, names
them"). Every downstream surface (the beat, the ending, the credits) **asks the same seam**, "so the
roll can't name a different traitor than the ending did." Adding new inputs to the tally must
reproduce the old rule exactly when those inputs are absent.
> `CLAUDE.md`, GS-story-betrayal + GS-story-credits; `docs/decisions/story-betrayal-arc.md` [not read].

**Directly transferable: the import reads which friend betrayed you.**
**Re-derive:** the weights and the tally inputs. **Rank: load-bearing.** **Guard: yes**
(`story-partner-tally`, `story-betrayal`, `story-credits`). [verified]

### B50. A branch's payoff carries BOTH endings, and neither may be shared
**Shape:** every epilogue row carries an entry per ending, "one shared set would be false on whichever
road you didn't take, and a credits roll that lies about its own ending is worse than none";
machine-checked that no epilogue is shared. The hero's own card is **second person** (B47), and a test
forbids third-person pronouns on it.
> `CLAUDE.md`, GS-story-credits.

⚠️ And the render rule inside it: **the crawl is a rAF loop, never a CSS animation**, because
reduced-motion collapses every animation duration and "a keyframed crawl would SNAP TO THE END for
exactly the players who asked for less motion."
**Re-derive:** the endings and the cast rows. **Rank: load-bearing.** **Guard: yes**
(`tests/story-credits.test.ts`). [verified]

### B51. Story beats are data rows with pure trigger predicates, behind one gate
**Shape:** a beat is a row — a pure `trigger(ctx)` predicate plus presentation; the picker returns the
first unseen triggering beat; **a new beat is a new row**. One gate wraps every arrival and diverts to
the beat screen. One-off tracking is **persisted** and recorded on dismiss ("fires once ever, across
every run/mode"). A beat may pay out, applied once, UI-only, **zero sim rng**.
> `CLAUDE.md`, *Lore / story beats* (GS-lore, GS-lore-rewards).

⚠️ "**A story beat declares WHICH ROOM it happens in**" — beats gate on venue context, and chaining is
explicit and scoped, "so the major's pile-up plays out and every other arrival keeps its one-beat
pacing."
**Re-derive:** the trigger context and the gate's insertion point.
**Rank: load-bearing.** **Guard: yes** (`tests/lore.test.ts` + build smoke). [verified]

### B52. Two currencies, never cross-tuned
**Shape:** a per-run currency and a cross-run currency are two separate economies with separate sinks;
milestone cosmetics are earn-only; **a price change with a refund is a save migration with the OLD
prices snapshotted in the step**.
> `CLAUDE.md`, *RPG meta-loop* → *Currencies*.

**Re-derive:** the two currencies and the sinks. For Into the Coil: in-run pickups vs meta credits.
**Rank: load-bearing** [assumed]. **Guard: yes** (`shop`, `trademarket`, `meta` tests). [verified]

### B53. In an endless mode, the ranked metric is depth, and skipped content banks nothing
**Shape:** survival is a **cumulative per-set allowance that resets each set**, so "one blow-up hole
never ends a run"; **depth is the sole ranked metric** (no run-total score — the chaotic aggregate,
B4's lesson again); a fast-forward may only skip **proven** content and banks no currency.
> `CLAUDE.md`, *RPG meta-loop* → *Endless survival* (GS-set-survival, GS-warp).

**Re-derive:** the set size, the ramp, and what "proven" means. **Rank: load-bearing.**
**Guard: yes** (`tests/endless.test.ts`, `warp.test.ts`). [verified]

### B54. A hidden unlock is idempotent, purely additive, and announces only what is genuinely new
**Shape:** the grant returns **the same array references when nothing is new**, a loss grants nothing,
and the recap names only newly-earned ids "so re-winning reveals nothing." A secret counter "shows the
COUNT, never the target — a secret must grow without announcing itself." Unlock state that must
survive a slot being started over lives on the **global** save, not the per-slot one.
> `CLAUDE.md`, GS-startour-serpent-trophy, GS-story-champion-cosmetics (the `aceShipUnlock` idiom).

**Re-derive:** the thresholds and pools. **Rank: load-bearing** (a grind "a golfer pick could erase is
one nobody would run"). **Guard: yes** (`serpent-trophy`, `story-champion-cosmetics`, `ace`).
[verified]

### B55. A permanent unlock reads a permanent flag, and the empty case is a promise
**Shape:** a mode unlocked forever must key on a **main-save flag**, not on live progress a restart
resets; and **the zero case is a first-class path**, not a fallback — "a player who finished under the
old save and then started over holds the permanent unlock with an EMPTY roster, and must still get the
mode."
> `CLAUDE.md`, GS-story-startour-champions; `story-mode.md` header (`starTourUnlocked`, backfilled at
> boot from live completion "so nobody who already earned it loses it").

**Re-derive:** the flags. ⚠️ **Directly relevant to the Into the Coil import**: an import that finds
no prior save must be a designed path, not a degraded one.
**Rank: load-bearing.** **Guard: yes** (`tests/startour-champions.test.ts`). [verified]

### B56. "Which mode am I in" is a fact about state, set only by the doors
**Shape:** when one screen serves two modes, the mode must be a **state field written only by the
entry transitions** and read through one predicate — not a flag assigned in the one place you happened
to think of. "SIX reducer transitions land on the chart" and only one set the flag, so a route that
avoided it flew the wrong mode and exited to the wrong hub. **The default is the safer mode**, so a
forgotten route lands on the safe side.
> `CLAUDE.md`, GS-startour-chart-mode; register row in `tests/one-description.test.ts`.

**Re-derive:** the shared screens and their doors. **Rank: load-bearing.** **Guard: yes** (register
row + `tests/startour-chart-mode.test.ts`). [verified]

### B57. A scene is a room: things that stand, reach the floor
**Shape:** in an illustrated interior, every standing unit reaches the deck line (**derived from a
named constant, not hand-counted**) with a toe kick or plinth, and pools a contact shadow; wall-mounted
pieces cast a slab. ⚠️ "**A spot's number is NOT the foot position**" — an anchor may include a label
below the feet, so **the guard drives a browser and measures the DRAWN figure**, not the table.
> `CLAUDE.md`, GS-clubhouse-floor: figures' feet were "7.4–12.4 points UP THE BACK WALL"; and moving
> them forced the horizontal positions too, "and a friend you cannot see is one you cannot tap."

**Re-derive:** the deck line and the spot tables. **Rank: load-bearing.** **Guard: yes**
(`tests/clubhouse-floor.test.ts`). [verified]

### B58. Reference-first art: approve the look before wiring it in
**Shape:** "Produce a render … and get a human OK on the *look* before it lands. **Never merge a visual
on 'the code works.'**" Reuse the house figure system through **one dispatcher** — "A new NPC = a new
case, never a bespoke hybrid" — and review it as if it were somebody else's work (silhouette,
proportion, intentional vs programmer-art). "Right tool for the ceiling": hand-placed primitives will
not look stunning for a hero set-piece; don't expect them to.
> `art-style.md` in full. It exists "because visuals kept getting shipped, rejected, and redone 6–7
> times", with three named root causes: art evaluated as a checklist; no approved visual target; new
> art ignoring the systems the game already draws well.

**Re-derive:** the house systems and the preview rigs. ⚠️ **Flagged: no guard.** The preview scripts
exist but nothing enforces re-shooting them, and A8 records that they silently rendered nothing on
Windows for months.
**Rank: load-bearing** (6–7 documented redos). **Guard: no.** [verified]

### B59. Decor is view-state-invariant and camera-proof
**Shape:** ambient decoration is anchored in **world space** (projected and scaled), never as a screen
fraction, and rides a **shared wall clock**, so it reads identically across every view state and never
jumps on a switch. Scene randomness must not read the projection — the camera rebuilds per frame, so a
draw-count that depends on the view shifts the stream.
> `CLAUDE.md`, GS-decor-view-states + *Render layer* ("The scene is CAMERA-PROOF … rng counts never
> read the projection, keys are course-space"); `src/render/style/flora.ts:438`.

**Re-derive:** the clock source and the anchor space. **Rank: load-bearing.** **Guard: yes**
(`tests/camera-stability.test.ts`, `decor-consistency.test.ts` + a headless decor probe). [verified]

### B60. A cinematic is cosmetic, degrades safely, has one exit, and seals the app
**Shape:** the intro is not in the reducer; every frame runs in try/catch → `finish()`; **`finish()` is
the single exit** and every path goes through it; while it is up it marks the app `inert` and focuses
its own skip control — otherwise "Tab walked into a title screen the player could not see". The real
UI boots first; the cinematic overlays it. Many-instance glow uses a cached sprite, never per-element
blur.
> `CLAUDE.md`, *Intro cinematic*; `accessibility.md`, *The boot cinematic was never sealed*.

**Re-derive:** the mount point and skip affordance. **Rank: load-bearing.** **Guard: yes**
(`tests/intro-replay.test.ts`, a11y-focus). [verified]

### B61. Which card/layout you show is a question about the CARD, not about the page
**Shape:** a breakpoint on page width "is a question about the PAGE standing in for one about the
component" — a page can be far too narrow for four cards while being roomy for two. Ask about **both
axes**, ask **once per layout branch**, and set **one switch variable the consumers read**, "so a
fifth element can't be wired into one branch and forgotten in the other."
> `CLAUDE.md`, GS-select-card-room: on an 820×760 embed each 2-across card was "**390×323 — wider than
> the four-across desktop card**" and wore the phone dressing.

**Re-derive:** the measured floors (760×760 here) and the dressings. **Rank: load-bearing.**
**Guard: yes** (`tests/select-card-room.test.ts`). [verified]

### B62. A screen sits in the middle of the room
**Shape:** one line (`align-content: safe center` on a **block** container) centres every flow screen
at once; flex/grid would also stop margin collapsing and turn children into items. `safe`, never bare
`center`. Screens that already fill the frame are a no-op **by construction, not by exception**.
> `CLAUDE.md`, GS-page-centre — measured at the 820×760 embed: a Story beat left **64%** of the frame
> empty.

**Re-derive:** nothing but the container class. **Rank: load-bearing** [assumed — a quality fix].
**Guard: yes** (`tests/page-centre.test.ts`, which pins the block-container property). [verified]

### B63. The page sits in a dressed background, delivered as a background layer
**Shape:** on a portrait-capped game the desktop is mostly empty — "**29%** of the width on any 16:9
display … the menus are worse at **68%** empty". Fill it with a seeded, seamless, **CSS background
layer** (not an element: a fixed element needs a size, and a fixed box inside a zoomed root does not
measure the display; plus a z-index nothing may bury and a mount outside the re-rendered root). Read it
as `var(--sky, none)` so a build where the boot call never ran lands on the old background, never on a
hole.
> `CLAUDE.md`, GS-space-sky. ⚠️ "Wrapping is the fragile part: the link search is TOROIDAL … or
> neighbours across an edge become a line ruled through the middle of the tile."

**Re-derive:** the tile generator. **Rank: load-bearing** [assumed]. **Guard: yes**
(`tests/space-sky.test.ts`). [verified]

### B64. A hosted embed's dimensions are a design input, and they are set outside the repo
**Shape:** the host's embed width/height decide which layout branch every player on that platform gets;
pick them from the app's own constants and thresholds, and record why.
> `release-pipeline-2026-07-30.md`, *Fix (itch → Edit game → Embed options)*: width `820` = the
> content max-width; height `760` because "**Must clear 660**: below that `data-gs-fit` flips to
> `tight` and the HUD sheds detail."

**Re-derive:** the two numbers from your own thresholds. ⚠️ Joins A40's list of settings git cannot
enforce.
**Rank: load-bearing.** **Guard: no.** [verified]

### B65. On a shared-origin host, your storage keys are in a communal bucket
**Shape:** where a platform serves every app from one CDN origin, the save keys "sit in a bucket shared
with every other game on the platform. Nothing stops another game writing that key." Three
consequences, ranked: **storage can be denied outright and fail silently** (third-party context —
"the highest-severity item in this document"); **key collisions are somebody else's decision**; **the
quota is shared, so eviction pressure is other people's traffic.**
> `release-pipeline-2026-07-30.md`, *⚠️ Saves on itch*. Note the folklore correction: the widely-repeated
> "each upload is a new origin" claim is **wrong** — "localStorage is scoped to ORIGIN, not path".

Answers shipped: a **read-back probe at boot** with a non-dismissible alert when writes don't stick;
`navigator.storage.persist()`; an install nudge that says what it buys ("offline + safer save");
the read-only classifier of A11; and an **export nudge counted in RUNS, not days** — "a counter needs
no clock, no timezone and no trust in the device's date", stamped only on a **confirmed** success,
silent for a player who just exported ("nagging someone who just did the thing is how a warning becomes
wallpaper").
**Re-derive:** the platform, the key names, the nudge thresholds. **Rank: load-bearing.**
**Guard: yes** (`save-durability`, `save-integrity`, `save-backup`). [verified]

### B66. A player-facing update needs a human-readable channel; the automated chain notifies nobody
**Shape:** "A build lands silently; the page just quietly becomes newer." One devlog per **tagged
release**, none in between ("Merges to `main` are not news. A release is."). Three parts: one line of
what changed **that a player can feel**; a GIF or before/after; then the honest list.
> `release-pipeline-2026-07-30.md`, *Devlogs*: "'The ball actually bounces now' beats 'GS-runout-visible:
> derive apex/length ratio from descent angle'."

Enabler worth copying: commit subjects are one-line plain-English summaries by convention, so
`git log v1.0.0..v1.0.1 --oneline` is most of a draft.
**Re-derive:** the cadence and the channel list. **Rank: aspirational** (no failure recorded; a gap).
**Guard: no.** [verified]

### B67. A release is a checklist, written down
> `release-pipeline-2026-07-30.md`, *Checklist — cutting a release* — eight lines, with the automated
> ones struck through as they were automated away.

**Re-derive:** the steps. **Rank: load-bearing** [assumed]. **Guard: partial** (the workflows).
[verified]

---

# C — LOCAL HISTORY

One line each, no analysis. (Golf-specific content, this game's bugs, its tuning history.)

- The derelict spaceship's deck boundary was re-described seven times; every wall bug was a second description.
- `clearVoidHazards` was deleting 100% of acid breaches after lost-rough was armed at all wildness.
- Wall height 72 > the shot-apex cap, so nothing clears a bulkhead.
- `wallFlightHit` disagreed with the sim on 42% of bounces and was deleted.
- The carry/roll split had a driver releasing 25% of its carry because the auto AI had been tuned around it.
- `flightControl` put the Bézier control point on the landing, so touchdown was at 2% of average speed.
- Hang time was keyed on carry, not apex; a 9-iron crossed the screen 3× faster than a driver.
- A linear loft ramp put the game's highest ball flight on the hybrids.
- `apexOverLen` was a flat 0.3 for every club; the physical ratio is `tan(descent)/4`.
- Hop length used `cos²θ` where the projectile pair gives `sin2θ`; steep clubs were charged twice.
- The bounce train decayed height 2× faster than length, so six planned hops showed two.
- 18 of 40 club/power rows drew a peak bounce of 0.7–2.6px under a 3px ball.
- The landing push-in (`landingZoom`) was built, measured green three times, play-tested, and retired to 1.
- The follow-cam pinned the ball and scrolled the world: 2.6px of screen travel over a whole closing roll.
- The dead-zone camera switched at touchdown and drew the first hop moving 16px backwards.
- Gravity creep read the sculpt for direction, not the drawn surface: 47% of creeps ran across or up the contours.
- Non-chip-in roll hairpins: 63 reversals over 40° at the join, drawn as one continuous sweep.
- Dr Chipinski's chip-in set the ball to the pin but stopped it 3–5.8yd from a 1.2yd cup.
- One Milled Tour Wedge took the driver's run fraction from 0.140 to 0.080 and zeroed the 7- and 8-iron.
- `rollPotential` never asked `hasBackspin`, so a 250yd drive sucked back 18yd.
- The drawn cup was pinned to the 1.2-yard catch radius and came out ~2× too wide.
- The flagstick stood shorter than the hole beside it was wide.
- The ball was `ctx.arc(x,y,3)` at three sites, at a fixed 3px, and could never look like it rolled.
- The ball's size was tuned against a camera the game never uses; reported too big twice.
- The resting ball on the aim map stayed a bare white circle after the flying ball got dimples.
- The play view drew nothing once every shot had played, so the ball blinked out.
- `drawBallShadow` drew concentric with the ball at the same radius — invisible on the ground.
- The fairway ink edge was stamped on one polygon, so split lanes and green flares shipped with no outline.
- 2.28% of all fairway ink ran inside a green and 7.86% inside a hazard.
- Void and Cetus — the two worlds built to glow — measured as the least vibrant worlds in the game.
- Cetus's cliff top stratum was lighter than the fairway standing on it.
- The green apron was drawn under the fairway, so once the flare wrapped the green it was a one-sided crescent.
- Greens striped horizontally on every world regardless of the world's mow grain.
- Trees behind a green averaged 0.00–0.12 per hole, so airmailing an approach cost nothing.
- `.gs-hud` was shared between the play HUD and the journey bridge HUD (#353 map blur).
- The settings sheet shipped in Times New Roman because the font stack sat on `.gs-main`.
- The settings sheet measured 1515px on an 844px phone and was already −326px at the ship scale.
- The golfer-card lore portrait was a `role="button"` with no tabindex and no key handler.
- The pace-meter canvas claimed `role="button"` and only listened for `pointerdown`.
- Tab order gave 🗺 and ⚙ as the first two stops of every stroke; three tabs to Swing, five to Putt.
- The boot cinematic never sealed the app; Tab walked into an invisible title screen.
- The Star Tour recap rendered as a 460×442 island at 1920×1080.
- The free-roam star chart escaped the portrait frame and opened at 1920px mid-run.
- Four golfers and their parked ships painted on top of the settings sheet.
- Clubhouse friends' feet floated 7.4–12.4 points up the back wall; the bar counter hung 30 units off the deck.
- `storySwitchGolfer` wrote your prologue over the target golfer's campaign (#662).
- `toTitle` clobbered a parked Voyage every time a Story world was played.
- `resume` cleared the slot it picked up, and `‹ Change golfer` then lost the run off disk.
- A Story world round could only be escaped by destroying the whole campaign.
- `campaignStoreTooNew` read the wrong `version` field and declared every legacy campaign to be from the future.
- The `github-pages` environment refused the first `v1.4.0` tag because it still held a `main` branch rule.
- `pages.yml` fired on every push to `main`, shipping four bounce passes to installed PWAs in one day.
- The first Cloudflare staging deploy went green while serving `/src/main.ts`.
- The sideload APK was `assembleDebug`, so Android refused to update it ("app failed to update").
- The debug APK was always `versionCode 1`; only the bundle step carried the env var.
- `secrets` in a step-level `if:` produced a red run with zero jobs and no logs.
- `versionCode (expr).toInteger()` is a Groovy parse trap that dies with a bare `> Value is null`.
- `sw.js` VERSION sat at 1.3.1 for fourteen merges — real, and not the stale-app bug.
- The itch embed was ~700px of black with a Run button in the middle of it.
- The itch "new upload = new origin wipes saves" folklore is wrong; the real problem is a communal bucket.
- Woo's beat said "Big man's got a big round"; Venoma's welcome was titled "Welcome, Sister"; the Parrot said "his crew".
- The Shedmaker promised a wedge and handed over hull armour.
- The putt read row plated "🔮 Line" as the Mole's when a reward putter had found it.
- The Herald deck plated raw ids: "The Shedding — with a".
- Scorpius walked into the Ch.5 Herald climax as a stranger.
- `starTourView.storyMode` was set on one route while six reducer transitions land on the chart.
- The animator compared a hole *index* to its own, so revisiting an index skipped shots.
- Asgard's `?rainbow=`/`?asgard=` params were the pattern the `?screen=` deep-link copied.
- `standrews-18` became St Annette's Links — a fictional Scottish links, because no real venue may be named in a shipped string.

---

# Findings

## Duplication (the same rule stated in more than one document)

| Rule | Stated in |
|---|---|
| System-index bullets, verbatim | `CLAUDE.md` **and** the *"Migrated from CLAUDE.md"* tail of 9 archive files (`audio`, `caddies`, `competition`, `lore`, `putting`, `render`, `rpg-meta-loop`, `sim-generator`, `ui-intro`) — the largest duplication in the repo, and deliberate ("Nothing was lost in the split") |
| The one Chromium lookup | `CLAUDE.md` · `process-and-deploy.md` · `tests/one-description.test.ts` |
| Import throws, does not guess | `CLAUDE.md` · `save-transfer.md` · `save-integrity.md` |
| CSS classes / DOM ids are global | `CLAUDE.md` ×2 (UI layer + deploy sections) · `regression-postmortem-2026-07-11.md` |
| `npm run check`, not `npm test` | `CLAUDE.md` · `regression-postmortem-2026-07-11.md` |
| Media queries are blind to the UI scale | `accessibility.md` ×2 (GS-a11y-readable-text + GS-a11y-sheet-scroll) · `CLAUDE.md` |
| `1fr` is `minmax(auto,1fr)` | `CLAUDE.md` · `accessibility.md` |
| The test/demo hub drives the real artifact | `CLAUDE.md` · `process-and-deploy.md` · the skill · `standards/TEST-HUB-STANDARD.md` |
| Service worker network-first / disabled in the shell | `CLAUDE.md` · `process-and-deploy.md` · `android-packaging.md` |
| Do not re-couple the two products | `CLAUDE.md` · `process-and-deploy.md` · `GOLF-STARS-STARTER-KIT.md` |
| Constitution vs archive; living docs, not append-only | `CLAUDE.md` · `docs/decisions/README.md` · `IDEAS.md` · `DEVLOG-IDEAS.md` |
| Back is one pure decision | `CLAUDE.md` · `android-packaging.md` |
| One decision, one home | `CLAUDE.md` · `tests/one-description.test.ts` · restated inside `save-slots.md` and `save-integrity.md` |

**Reading of the duplication:** it is mostly *deliberate and healthy* — a terse rule in the
constitution pointing at a narrative in the archive. The unhealthy part is that several `CLAUDE.md`
"bullets" have grown into full narratives (30+ lines with measured tables), which is exactly what its
own preamble forbids; the file is now 2,164 lines. **A new constitution built from A + B should be
short, and every "why" should be a pointer.**

## Rules with no guard (a rule nobody can enforce is a style guide)

| Rule | Where | Note |
|---|---|---|
| Reference-first art; approve the look before wiring it in | `art-style.md` | Its own doc says the process exists because 6–7 visuals were shipped and redone. The preview rigs are manual, and A8 records that they silently rendered nothing for months. **The highest-value unguarded rule in the repo.** |
| Re-shoot the gallery / preview after any render change | `CLAUDE.md`, many bullets | Nothing checks it |
| One feature per session/PR | `CLAUDE.md` | Also **aspirational** — the post-mortem acquits the high-churn day |
| Keep the constitution lean; living docs not append-only | `CLAUDE.md`, `README.md`, `IDEAS.md` | Currently violated by the constitution itself |
| A report is a committed file | `CLAUDE.md` | Convention |
| Devlog: state facts, don't argue; check the claim against the code | `DEVLOG-IDEAS.md` | Has a documented failure (`DL-guard-caught-it`) and still no guard |
| Commit messages explain the why + trailer | `CLAUDE.md`, `process-and-deploy.md` | No commit hook |
| Never add a docs `paths-ignore` | `CLAUDE.md`, `process-and-deploy.md` | Prose only |
| Run `npm run check` before pushing | `CLAUDE.md` | The script exists; using it is discipline |
| Read the skipped count | `CLAUDE.md` | The instance is fixed; the habit is not enforced |
| The six admin-UI repo/host settings | `CLAUDE.md`, `process-and-deploy.md` | **Structurally unenforceable** — documented as such, with the `gh api` incantation to restore one |
| The item-authoring three lenses | `story-mode.md` | Only one corner (reward-promise wording) is machine-checked |
| Three lenses on every change | `CLAUDE.md` | Review discipline |

## The three rules I would carry first

1. **A1–A5, the register.** Everything expensive in this repo's history is one fact described twice,
   and the guard ladder (compile-forced ▸ seam + scan ▸ read both copies) plus the admission rule is
   directly portable on day one.
2. **B1–B3, the determinism triangle.** Seeded-only RNG, headless ≡ live, and one shared source for
   physics-and-picture. For a real-time shooter these are *harder* and more valuable than they were
   here — and they must be designed in, not retrofitted.
3. **A11/A12 + B30/B31, the save doctrine.** Never overwrite what you could not read; boot swallows,
   import throws; one function answers what a state parks; a backup is a bundle. Into the Coil starts
   with a cross-game import, which is the single riskiest read path either game will ever have.

---

# Archive pass (2026-08-03)

Second read, over `docs/decisions/*.md` only — the 26 files the first pass mostly left unread. Its job
is the field the first pass could not fill: **does the archive record a real failure behind each rule,
or is the rule aspirational?** Plus the two things that only exist down here — lessons that never got
promoted to `CLAUDE.md`, and places where the archive and the constitution disagree.

**Coverage, stated honestly.** Read line-by-line: `README.md`, `art-style.md`, `club-list.md`,
`static-courses.md`, `tent-interactions.md`, `feedback-mobile-ux.md`, `asgard.md`, `story-bible.md`,
`story-campaign-slots.md`, `story-betrayal-arc.md`, `ui-intro.md` (all 1,292 lines), and the
pre-migration bodies of `audio.md` (1–189), `lore.md` (1–286), `caddies.md` (1–321),
`competition.md` (1–374), `putting.md` (1–592), `sim-generator.md` (1–1,491).
`save-integrity.md` / `save-transfer.md` / `save-slots.md` / `process-and-deploy.md` /
`accessibility.md` / `android-packaging.md` were read in full by the first pass and are not re-read
here. **Not read line-by-line:** `render.md` (2,431), `rpg-meta-loop.md` (2,171), `story-mode.md`
(1,931) and the nine *"Migrated from CLAUDE.md"* tails (~7,600 lines total). Those were worked over by
(a) a full `GS-*` tag diff against `CLAUDE.md` in both directions, (b) greps for `LESSON` /
`the rule` / `GOTCHA` / `⚠️` / `superseded` / `retired` / `reverted` / `root cause` / `deliberately
not`, and (c) reading every hit in context. That reliably catches doctrine and supersession; it will
have missed narrative detail. Where a finding below comes from a targeted read rather than a full one,
nothing changes about its citation — the line numbers are real.

---

## 1. RANK — what the archive actually records behind each rule

Ranks here are strictly about the **archive**: `LOAD-BEARING` means an archive doc names a concrete
failure, a measurement, or a player report that caused the rule. `ASPIRATIONAL` means the archive
states it as good practice with no failure behind it. `SILENT` means the archive does not cover the
rule at all (usually because the feature post-dates the last archive entry — see §3.5).

### 1a. Rules the archive UPGRADES — first pass said aspirational or assumed, archive shows a real failure

| Rule | Archive verdict | Citation |
|---|---|---|
| **A13** two-step destructive import | **LOAD-BEARING** — not merely a guard. The parallel case is recorded: import "replaces the roster wholesale rather than merging. A merge would have to invent an answer for *both the file and the device have a Feather Fade campaign*, and silently picking one is precisely the guess an import must not make." | `story-campaign-slots.md`, *The bundle: why `BACKUP_VERSION` went to 2* |
| **A15** applying an import reloads | **LOAD-BEARING (adjacent)** — the archive records the same class of bug in `fc_story`: a write built from stale memory "would silently drop every other golfer's campaign — one action, three campaigns gone." | `story-campaign-slots.md`, *Two traps in the store* |
| **A33** parameterise instead of branching | **LOAD-BEARING** — the archive has a concrete instance the first pass didn't have: the slo-mo caddy effect is "a VIRTUAL animation clock (`vnow += dt × scale`) — it only stretches the wall-time of the EXISTING animation, never the sim," which is what kept determinism intact through a feel feature. | `caddies.md`, GS-caddy-slomo |
| **A36** assert properties, not pixels | **LOAD-BEARING** — `tests/hud-gear-reads.test.ts` is built this way for a stated reason: "every expectation is **derived from the sim's function** rather than hard-coded, because the property that matters is that the two cannot drift, not that a bunker is 50%." | `ui-intro.md`, GS-hud-gear-reads *Guards* |
| **B9** variety ≠ difficulty | **LOAD-BEARING, three recorded passes.** GS-variety-2's complaint is quoted ("the only difference is the colour"); GS-variety-3 measured the cause — at wildness 1 a bendy world drew "~8% straight, **~0% plain dogleg**, and ~92% cape/hairpin/double". | `sim-generator.md` GS-variety-2 / GS-variety-3 |
| **B21** a readout the world already draws is not a HUD row | **LOAD-BEARING** — the play-test verdict is quoted, and the audit table shows three of four panel rows restating the aim cone in "~140px of an 844px phone". | `ui-intro.md`, GS-hud-bag *The report* |
| **B24** armament is a table keyed by hull | **LOAD-BEARING** — the archive's sibling case is a real quality failure: four credit items "looked like generic re-skins of each other — the +15% Sponsor's Badge and +20% Lucky Ball Marker were both a gold-coin-with-a-star". | `caddies.md`, GS-credit-factions |
| **B26** a boss must ARRIVE / hits must BITE | **LOAD-BEARING** — the archive records the same shape in the earlier caddy cinematic: the projectile "sailed past the still-moving ball — *it no longer hits the ball*". | `caddies.md`, GS-caddy-impact |
| **B41** assetless audio | **LOAD-BEARING with a stated reason the first pass didn't have**: "the app ships as ONE inlined `index.html`; an audio file is a thing that can 404 on a device, bloat the bundle, or stall on a flaky connection. Synth can't." Plus a day-one bug: `PW/GW/SW` end in `W`, so a naive `endsWith('W')` "voiced the wedges as woods". | `audio.md`, *The house rule* + *Strike voices* |
| **B43** crash reporting stays local | **ASPIRATIONAL in the archive** — no archive doc argues it; it exists only as the CLAUDE.md bullet. Downgrade from the first pass's `[assumed]`. | (no archive entry; `GS-crash-diagnostics` is CLAUDE.md-only — see §3.5) |
| **B45** three lenses | **LOAD-BEARING as practice** — the archive shows them actually applied and named: "Reviewed off fresh preview shots (pro-gamer / UX / artist lenses); the findings and what shipped". | `putting.md`, GS-green-contour-3 |
| **B52** two currencies never cross-tuned | **LOAD-BEARING** — the archive records the StarMart deliberately spending the cross-run currency mid-hole and keeping the two racks separate, and the "bought items last the run (they round-trip through `loadout.perks`, so **no save bump**)" consequence. | `tent-interactions.md`, *starmart* |
| **B62** a screen sits in the middle of the room | **SILENT** — `GS-page-centre` has no archive entry at all. Keep the first pass's `[assumed]`. | §3.5 |
| **B63** the page sits in a dressed background | **SILENT** — `GS-space-sky` has no archive entry. | §3.5 |

### 1b. Rules the archive CONFIRMS with a sharper failure than CLAUDE.md carries

| Rule | The archive's evidence |
|---|---|
| **A1 / A2** one decision, one home | The derelict count is *seven* and the archive names each one: "A render offset that can't fold vs. a sim offset that can. A cone predictor vs. a physics predictor. A resting tolerance vs. a flight tolerance. Whenever the derelict's walls have lied, it has been because some second description of the deck was allowed to exist." — `sim-generator.md`, GS-ship-corridor-fold *The lesson (the seventh time)* |
| **A26** if it renders, it needs a browser test | Sharpened by an archive lesson that **qualifies A27**: "a deep-link smoke that mounts a screen in isolation is NOT a substitute for driving the real player path — verify reachability in a browser, not just that the screen renders." — `story-mode.md:268` |
| **A30** overlay behaviour is one pass | Same shape recorded years earlier for the settings cog: it "used to be hand-placed per screen … so new screens (character select, clubhouse, market…) silently shipped without settings." — `ui-intro.md`, GS-settings-nav |
| **A47 / A48** measure the picture, not the model; an instrument uses production's constants | Two more instances, both in the archive only. (1) "Five separate blending passes had all been tuned blind to it" — every one eyeballed at the whole-hole map (~1 px/yd) while the bug lived at the chip camera (~6.6 px/yd). — `render.md:1466–1483`. (2) A memory instrument that would have lied: "`performance.memory` is bucketed for fingerprinting reasons … it reported an identical `9.54MB` for five consecutive samples and would have *proved* there was no leak for the wrong reason." — `render.md:2334` |
| **B1** deterministic seeded RNG | The archive states the camera half of it precisely: "**never let one rng stream's draw count depend on the projector**, and never share a stream between two decor functions if either's draw count can vary." — `sim-generator.md`, GS-cetus-2 |
| **B3** the graphic IS the physics | The archive supplies the **inverse**, which CLAUDE.md does not: when the drawn surface is a *dilated, decorated super-set* of the collision poly, "the graphic lies again — from the other side." — `sim-generator.md`, GS-ship-wall-bounce (render) |
| **B5** the harness measures the AI | Quantified: the auto reach-AI is "a deliberately weak proxy at ~2.08/hole, just below median, that barely exploits upgrades" and wins the voyage ~2–3%. And a named blindness: "the auto-sim `onePutt` **under-counts** the felt cost — the harder greens bite most in INTERACTIVE putting." — `competition.md` GS-positional-cut; `sim-generator.md` GS-biome-difficulty |
| **B7** editing the core table has fan-out | Two named traps the constitution omits: "a same-carry *premium* copy is no improvement — **the power-cell lesson**", and "**raising the [wedge] floor is the classic way to nudge the death-spiral harness over its bar**" — i.e. a documented way to cheat the fence. — `club-list.md` |
| **B8** validate at generation and throw | Stated as a design property, not a habit: "there is NO retry — `generateCourse` throws … so the crossing must be provably valid, not hope-it-passes", and "if the clamp is ever loosened, the suite THROWS at generation (its own guard)." — `sim-generator.md`, GS-rivers-2 |
| **B11** tolerances in world units | The px-vs-yards root cause is the archive's, in full, with the measured cameras and the reason five passes missed it. — `render.md:1466–1483` |
| **B20** one persistent frame | The archive holds the six-state audit table *and* the sentence that makes the case: "**Nothing threw. Every test was green. It was just miserable to play.**" — `ui-intro.md`, GS-hud-frame |
| **B30** one parked run per mode | The ancestor bug is in the archive: `persist()` "used to snapshot ANY active run — including the title's placeholder — so any dispatch from the title (opening the Clubhouse/Market) overwrote a saved run's snapshot with the empty placeholder." Same family, years earlier. — `ui-intro.md`, GS-settings-nav |
| **B38** back is one pure decision | Reinforced by the archive's own dead-button trap: a `data-` attribute typo where "a hyphenated `data-intro-traits` maps to `dataset.introTraits` and silently won't match `[data-introtraits]`; that typo shipped for one build and the popup no-oped." — `ui-intro.md`, GS-intro-split |
| **B58** reference-first art | Confirmed at full strength, with three named root causes and a numeric proportion bar (head ≈ 1/6–1/7 of a standing figure, **not** 1/2), plus a rule the first pass didn't have: "Do NOT render a character as a cropped portrait BUST where a full figure is expected — a bust feet-anchored to the floor puts the chest on the ground." — `art-style.md` |
| **B59** decor is camera-proof | The archive states the two-part obligation: "obey BOTH — course-anchor it if it represents a world object, **and** drive it off the shared wall clock — or it will render differently in each view and jump." — `render.md:1275` |
| **B60** a cinematic degrades safely | Archive adds the specific fallback: "If a browser denies canvas pixel read-back, `titleStars` is empty and `drawTitle` falls back to a glowing-text wordmark — **a cosmetic intro must never throw and strand the boot**." — `ui-intro.md`, *Loading intro cinematic* |

### 1c. Rules the archive is SILENT on (keep the first pass's rank; no archive evidence either way)

`A3`, `A4` (the archive restates it but adds no failure), `A5`, `A7`, `A8`, `A9`, `A10`, `A14`, `A16`,
`A17`, `A18`, `A20`–`A25`, `A28`, `A29`, `A31`, `A32`, `A34`, `A35`, `A37`, `A38`–`A46`, `A49`–`A57`,
`A59`–`A62`; `B16`–`B19`, `B22`, `B23`, `B27`–`B29`, `B31`–`B37`, `B39`, `B42`, `B44`, `B46`, `B57`,
`B61`, `B64`–`B67`. Most of these live in `process-and-deploy.md`, `accessibility.md`,
`android-packaging.md` and the three save docs — all read in full by the **first** pass, so its ranks
already reflect the archive and this pass adds nothing.

### 1d. The two rules the archive marks ASPIRATIONAL that the first pass over-ranked

- **A56 "one feature per session/PR."** The archive contradicts it in practice, repeatedly and
  deliberately: `asgard.md` opens "**Three PRs' worth of work shipped as one branch**, each layer
  test-green on its own"; `story-betrayal-arc.md` runs a whole multi-PR feature off one design spine.
  The archive's actual rule is different and better — **ship the risky layer alone**:
  "It is the save layer alone. The player-facing halves ship separately so the risky persistence work
  lands reviewable and revertable on its own." (`story-campaign-slots.md`, *What this PR deliberately
  does NOT do*.) Carry that, not the PR-count rule.
- **B46 "author every item through three lenses."** Confirmed as a *quality* rule with real teeth in the
  archive (`caddies.md` GS-credit-factions, `competition.md` GS-proshop-3's per-id emblems), so the
  first pass's `aspirational→load-bearing` hedge resolves to **load-bearing**: shared-kind items
  "were near-identical (same kind glyph + same rarity colour)" and needed a per-id emblem roundel.

---

## 2. ORPHANED LESSONS — in the archive, nowhere in the constitution

Grouped by what they'd constrain in a new project. Each is a rule the constitution does not carry.

### 2.1 Balance, economy and difficulty design

- **An upgrade to a stat that is never the binding constraint is invisible.** *"There's no reason to take
  any putting upgrades"* / *"the make window never does anything"* — both true, because the make band was
  a constant regardless of distance, so "on a flat green a base putter already holed everything, so a
  wider band bought nothing you could feel." (`putting.md`, GS-putt-depth)
- **A cap that binds before the top item makes the top item worthless.** "The old cap meant a full putter
  stack hit the ceiling before the Pinseeker even landed — the legendary would have added ~0 visible
  read." (`putting.md`, GS-putt-read)
- **A clamp can silently swallow an entire difficulty ladder.** The per-Ascension cut squeeze "is
  swallowed almost entirely by the target floors, so A0 and A4 played essentially the same brutal cut" —
  measured even-par cut-survival ≈ **0% across A0–A4**. Calibration bar afterwards: par golf survives
  84/80/75/70/61%, bogey golf still misses ~99% ("the don't-over-tune-it-easy bar").
  (`competition.md`, GS-green-ease)
- **A ramping difficulty gate needs a weak tail to consume.** The field fill sorted the pool by skill
  descending, so "the field was always the STRONGEST 19 (an elite cluster) with no weak tail for the cut
  to bite, so the leaderboard never thinned." (`competition.md`, GS-cut-curve)
- **Never buy difficulty by deleting variety.** Three passes: subtract-and-floor collapsed the board to a
  duel stops early, then a flat floor of 4 still gave "a FOUR-golfer board for two whole arcs". "A hard
  Ascension's difficulty is carried by the field's STRENGTH … NOT by scything the board to its floor."
  (`competition.md`, GS-cut-variety)
- **A dead tuning knob makes the climax easier than the opener.** `BossSpec.cutBonus` (1/2/3) "was meant
  to supply the climb [and] was INERT: a matchplay boss passes on the DUEL, never the Stableford cut, so
  the +1/+2/+3 never bit" — while the player grew across arcs. (`competition.md`, GS-boss-escalation)
- **Rarity IS appearance rate.** In a mutually-exclusive class, one epic among legendaries was "basically
  an always pick given how rare the others are." Fix: one rarity ⇒ equal odds, then buff the weak ones
  "so the choice is *which legendary do I want*, not *which one turned up*." (`caddies.md`,
  GS-caddy-factions) — **directly load-bearing for a shooter's weapon pool.**
- **Two metrics that pull opposite ways.** An eager lay-up AI "improved the max-wildness bar but LOWERED
  mean per-stop Stableford on the common mid-wildness case (10.705 → 10.68) — a contract-4 fail."
  Standing instruction: "Re-measure both the ship gate (mean SF) AND the max-wildness bar if the knobs
  are ever retuned — the two pull opposite ways." (`sim-generator.md`, GS-fairway-width-2)
- **A world-generation change can invalidate an item.** A flat lift of `straightP` "tripled straight at
  CALM stops too … and DILUTED the pure-dispersion Caddie Lessons perk BELOW the *a power-up must
  improve scoring* bar (−4 handicap went to −0.015 mean Stableford)." Lift only where the problem is.
  (`sim-generator.md`, GS-variety-3)
- **An upgrade may not silently grow another failure mode.** The spray-shape invariant: `green = 1 − Σ
  misses`, so a mod that cuts one miss zone feeds the freed probability to GREEN, "never the opposite
  side — a sideways move needs an explicit zero-sum trade-off mod." (`sim-generator.md`, GS-dispersion-2)
- **A cursed relic is a big positive field plus a NEW NEGATIVE field**, and "a shedding must be a
  *choice*, never a strict upgrade." Its ship mirror: the dark path's hulls "hit harder in the battle but
  take more damage — the risk/reward of the dark path made mechanical." (`story-bible.md`, §6–7)
- **A sanctioned unbalanced novelty, fenced in writing.** "It deliberately BREAKS balance … and that
  high-wire spectacle IS the fun; **do NOT try to balance it**." (`competition.md`, GS-rainbow)
- **A named, scoped balance exemption with a TODO — never a relaxed structural contract.** "for these two
  biomes, ignore the death-spiral balance for now and make them the most visually interesting worlds;
  rebalance the AI afterward" ⇒ `BALANCE_EXEMPT_BIOMES`; "**Structural fairness is NOT relaxed.**"
  (`sim-generator.md`, GS-cetus-5). And the inverse: Asgard was deliberately **not** exempted — "adding
  it to `BALANCE_EXEMPT_BIOMES` would have been a lie about its character." (`asgard.md`)
- **Difficulty is per-CONTEXT.** The same encounter reached from two places needs two tunings — voyage
  floor 0.2 / cap 0.34 against Star Tour edge 0; measured win rates 12–25% vs 84%. And **stakes set
  difficulty**: "losing costs NOTHING … so they're pitched a notch ABOVE an ordinary boss."
  (`asgard.md`, GS-warriors-tune)
- **Ties go to the player** — "a hard-won reward event should reward the shot that earned it."
  (`asgard.md`)
- **A cumulative allowance is variance-forgiving where a per-unit wall is not**: "cumulative −4 is
  elite-but-fair (variance-forgiving), where the old per-hole −1 wall was not." (`rpg-meta-loop.md:1155`)
- **Don't assert a hard rate on a swingy outcome.** "`voyage.test`'s *can win* stays loose (a knockout
  bracket is inherently swingy — don't assert a hard win rate)." (`competition.md`, GS-positional-cut)
- **A non-distance reward needs a real stat to be a real upgrade.** A themed putter is "the clean way a
  SCORING-class reward is a genuine, offerable improvement" — its value is the make-window, not carry;
  and the coverage predicate must check `puttBoost` **first**, "a putter's tiny carry otherwise reads as
  *scoring*." (`competition.md`, GS-fullsets)
- **A new mechanic needs an entry-level item** — "the putting axis started at rare, so early stops had no
  putt buy and the new line mechanic had no cheap hook." (`putting.md`, GS-putt-read)

### 2.2 Procedural generation

- **The world must be sized to the player's real dispersion.** The corridor intercept went 1.6 → 2.0
  "after a spray-feel check: even a beginner driver's cone is an honest ±80% *green zone* ~38yd wide,
  which overflowed the old ~33yd early fairway — a centre-aimed beginner tee shot held the fairway only
  ~60% of the time, **so a green-zone shot still felt like a miss**." (`sim-generator.md`, generator v4)
- **N IID samples read as the same 2–3 pieces of content repeated.** GS-compose's two root causes:
  "(1) STRUCTURE lives in engine code, not biome data … so a data-only world is a RESKIN. (2) A stop is
  `for (i…) generateHole(…)` — N INDEPENDENT, identically-distributed draws, with no routing,
  sequencing, signature holes, or difficulty shape." (`sim-generator.md`, GS-compose)
- **Build the variety machinery before adding content.** "Build the variety MACHINERY (this, then
  per-biome profiles, then structural archetypes) **before adding biomes**, so every future world is a
  genuinely different course for free instead of another reskin." (ibid.)
- **A difficulty arc must be mean-preserving** — offsets re-centred to sum to zero, so it changes
  texture, not average difficulty; and at the top the clamp pulls the mean slightly *down*, "so
  composition can never generate a hole wilder than the tested-safe max." (ibid.)
- **Draw-count stability under an override.** "`generateHole` still draws its `parRoll` even when a plan
  overrides par (stream position stable), and each length branch still draws exactly one `range()`
  whether or not a `lengthClass` forces it (draw COUNT stable)." (ibid.)
- **Make a generalisation byte-stable by constructing its defaults to reproduce the old hard-coded
  chain** — the default width weights "cumulate to the OLD fixed chain `.28/.41/.54/.66/.78/.89`."
  (`sim-generator.md`, GS-biome-profile)
- **Pick the first axis of a generalisation by which one is already isolated.** "Why the green axis is
  the SAFE first axis": slope, contour and pin already draw from dedicated side streams, "so nudging
  them leaves the TERRAIN stream byte-for-byte identical." (`sim-generator.md`, GS-biome-difficulty)
- **When players blame a safety constraint for sameness, check whether it is actually binding.** *"the
  enforced fairness layer is what makes the holes keep the exact same shape"* — and it wasn't: "fairness
  only constrains the CARRY WINDOW, not where in it the crossing sits — but the generator hard-coded
  `t = rng.range(0.34, 0.6)`." (`sim-generator.md`, GS-rivers-2)
- **A sampling resolution can silently delete geometry.** Holes that could not be finished, because
  "`brokenCorridor` drops any pad run with <3 dense points, and at 19 corridor samples the sliver pad
  routinely had <3 — so it VANISHED, silently fusing two drawn gaps into one 200–330 yd mega-void."
  Measured 11–13% of armed holes, worst carry 782 yd. (`sim-generator.md`, GS-cetus-gaps)
- **A difficulty-correlated bug report can mislead about the cause.** "It was never actually *fine at
  A4+*; higher-Ascension players just had the rare bag (+8 carry) and luck on the marginal holes
  (Ascension only tightens cuts/credits, the generator never sees it)." (ibid.)
- **A render merge threshold can force a sim minimum.** "The render dilates each pad by 14 course-yd, so
  two pads closer than ~28 yd BRIDGE into one landmass — the void carry would render as solid ground
  (graphic ≠ physics)." (`sim-generator.md`, GS-variety-3)
- **Read by precedence, never by draw order.** First-match `lieAt` "let the broad fairway override the
  green that overlaps it". (`sim-generator.md`, GS-mechanics)
- **A world's off-fairway PENALTY and its difficulty RAMP are separable knobs.** One shared wildness
  threshold coupled worlds that wanted different calm feels. (`sim-generator.md`, GS-ship-calm-space)
- **Design research, committed as a report.** GS-variety-3 ran off `reports/hole-variety-research-2026-07-08.md`
  (MacKenzie/Macdonald canon). Throughline: **difficulty ≠ length + bend**; overusing doglegs is the
  monotony trap; force length distribution *within* each par; keep short/drivable pieces as
  change-of-pace; give the interesting ones genuine two-route optionality. (`sim-generator.md`)
- **A weight-0 row must be inserted before the last one** so `pickBiome(0.999) === <last>` still holds.
  (`asgard.md`)

### 2.3 Physics, geometry and the graphic-is-physics contract

- **Dispersion is ANGULAR, not a lateral offset.** "A rotation preserves length, so the ball's distance
  from the origin IS the sampled carry in EVERY direction — a wide miss can never finish past the carry
  window (the old *square box* where a diagonal exceeded max distance)." Crosswind stays a separate
  deterministic push, so wind shifts the cone, not its width. (`sim-generator.md`, GS-mechanics #5)
- **A control point placed beyond the landing makes the path double back.** The flight control sat at
  full carry straight ahead, but an angled miss's landing is shorter in depth (`carry·cosθ`), so the ball
  "slid out to the side / did a loop-de-loop"; projecting the control onto the aim line makes forward
  progress monotonic. (`sim-generator.md`, GS-flight)
- **Total-preserving refactor.** The naïve carry/roll split "would cut effective reach ~10–18% … Instead
  we anchor on the *pre-split* roll so where the ball FINISHES is unchanged and only the SPLIT moves …
  Endpoint preserved ⇒ GIR/Stableford preserved ⇒ the main death-spiral bars stayed green with NO AI
  reach change." (`putting.md`, GS-carry-rollout-split) — **the cleanest recipe in the archive for
  changing a system's internals without re-proving the whole balance suite.**
- **When one constant serves two jobs, split it rather than move it.** The AI's roll *allowance* keeps
  `MAX_ROLL` 42; the *physics* run cap becomes `ROLL_ENERGY_CAP` 60. (ibid.)
- **Split a tolerance by who sees it.** One constant served the resting backstop and the mid-air carom:
  "those are not the same problem: nobody watches where a stopped ball gets tucked back in, but
  **everyone watches the ball turn**." Rest 22 yd, flight 6 yd. (`sim-generator.md`, GS-ship-wall-phantom)
- **One constant serving a display job and a rules job.** The OB box is both the drawn boundary and the
  OB trigger, so "tightening the margin to make the hole bigger on screen directly raises the OB rate —
  a `64`-cap was tried and REVERTED (tipped `toPar/hole` to 1.03)." A visual tweak *was* a balance
  change. (`sim-generator.md`, GS-13)
- **A design promise stated absolutely gets over-applied.** "A sideways miss ricochets back, NEVER lost
  to space" made containment unbounded sideways — a ball 145 yd out in open space was reeled home off an
  invisible wall (measured 519 such shots; 9,157 ricochets off empty space). "**The design amendment:**
  contained where a bulkhead EXISTS, free past it." (`sim-generator.md`, GS-ship-space-boundary)
- **A primary predicate plus a bounding predicate, never swapped** — proximity-as-primary had already
  failed at hard corners; proximity as an upper bound works. (ibid.)
- **"Deck ahead on your line is a promise the ball flies on."** A departure only ricochets if the surface
  does not resume further along the segment — otherwise a legal carry is "slapped back at the lip."
  (`sim-generator.md`, GS-ship-wall-phantom)
- **A mitred offset self-crosses on the inside of a bend, and even-odd fill reads the bowtie as
  *outside*** — "a phantom void punched into the middle of the deck", 13% of walled holes, up to 15.5 yd.
  And the sting: the render layer already offset with the fold-proof `dilateUnion`, "the very function
  written to fix this same fold on the Cetus pads." **The same bug was already fixed in the other layer.**
  (`sim-generator.md`, GS-ship-corridor-fold)
- **Keep the pure resolver domain-agnostic by injecting predicates** — `offFairway`, `greenAim`,
  `fairwaySnap` are caller-supplied closures over the hole, so `resolveShot` never learns about courses.
  (`caddies.md`, GS-caddy / GS-caddy-snapback)
- **A determinism technique worth naming: a 100% chance changes the boolean, not the draw position.**
  (`lore.md`, GS-lore-rewards)
- **Cut a path by arc length, not index** — "a straight roll is only 2 points, so an index cut would
  always land on the last point and the gearing would never show." (`putting.md`, GS-backspin-line)
- **A pure post-generation transform** applied *after* generation and validation, gated on a perk and
  rng-free, lets a mode reshape a course radically without touching the generator or its stream — and it
  must also **clear hazards**, because once the road widens over one it becomes "a hidden trap the
  renderer wouldn't draw (a graphic ≠ physics bug)." (`competition.md`, GS-rainbow-road-2)

### 2.4 Rendering, cameras and readability

- **"Shot readability is sacred."** A real camera pitch was rejected outright — it "would foreshorten the
  play field and force an aim-unproject/spray-cone/follow-cam rewrite"; depth was implied in-render
  instead. (`sim-generator.md`, GS-cetus-3)
- **Sizes may read the projection; only COUNTS may not** — the camera contract stated exactly.
  (`render.md:1481`)
- **The camera may gate PAINT but never DRAWS.** "rng for the streaks is consumed UNCONDITIONALLY so the
  camera can only choose what's PUSHED, never what's DRAWN." (`sim-generator.md`, GS-cetus-4)
- **A camera keyed on a live input value is a per-frame reseed.** "every pixel of aim slide (even finger
  tremor at `AIM_SENS 0.34°/px`) wobbled `viewRadius` sub-pixel per frame — invisible as motion, but it
  re-projected the seeded scene every frame." (`ui-intro.md`, GS-gesture-jitter)
- **A blend must not dissolve the thing it blends.** The first preview "was a straight failure … every
  world's putting surface melted into its corridor — beautiful, seamless, and **unreadable**. That is not
  a polish miss, it is a *fairness* bug." (`render.md:1511`)
- **Two or three opaque rings always read as concentric stickers, however carefully the tones are chosen
  — the eye finds the step.** Ramp in ~6 steps and make the inner ring a *tint*. (`render.md:1485–1492`)
- **A system whose only channel is a scalar length cannot be seen responding.** "The roll physics was
  **invisible by construction**: a straight run-out whose only response to the ground is its LENGTH can't
  be seen reacting." (`putting.md`, GS-green-contour-2 round 2)
- **A UI clamp can make a legal outcome unreachable.** A hard ±12 yd aim clamp made a steep long putt
  "unmakeable **BY UI**". Stated guarantee afterwards: *no putt is UI-unmakeable.* (`putting.md`,
  GS-putt-feel) — a fairness contract at the **UI** layer, distinct from B8's generation fairness.
- **A "reduced information" mechanic must actually remove the information.** The faint tail "was still
  the true break curve, so a *blind* putt wasn't blind at all — you could aim off the ghost."
  (`putting.md`, GS-putt-read)
- **Check an animation's REST state, not just its motion.** The tailgate "pivoted at the bottom so
  `bootOpen 0` stuck a vertical panel up and the boot always looked open. The timing already does
  closed→open→closed; **the bug was purely the closed-state geometry**." (`ui-intro.md`, intro cinematic)
- **Derive relief colour from the subject's own palette, never neutral white/black** (the "grey stain" /
  "washed frost" lesson); **the light side must push harder than the dark** (a pale ring on already-light
  turf washes out at the alpha where a dark ring already reads); and ink is **contrast-picked** off the
  surface's luminance — "white-on-white arrows were the review's first finding." (`putting.md`,
  GS-green-contour-2/-3)
- **An explicit art anti-rule, written as a rule:** "**never re-add a big soft shading blob to a green**"
  — "stepped-not-smooth is the game's cel-shaded language and there is no circular edge to read as a
  blob." (`putting.md`, GS-green-contour-2 round 2)
- **A `poly` with `fill:none` still closes with a chord** — hence a separate open `path` prim. This is the
  *origin* of the open-run rule CLAUDE.md states for fairway ink. (`putting.md`, GS-green-contour-2)
- **Never nest a `clip` prim inside another `clip` prim's children** — the SVG serializer emits the inner
  `<clipPath>` inside the clipped `<g>` and **silently drops the group's contents**. "Cost a long hunt."
  (`sim-generator.md`, GS-cetus-2)
- **Debugging heuristic for document-global SVG ids:** "If you ever eyeball a multi-hole sheet and the
  turf looks flat, **check the ids FIRST** — this one masqueraded as a palette problem."
  (`sim-generator.md`, GS-cetus-4)
- **Many-instance glow is a cached sprite, never per-element `shadowBlur`** — "shadowBlur is a per-draw
  Gaussian; applying it to the few hundred title stars chugged the framerate to a crawl."
  (`ui-intro.md`, intro cinematic)
- **An emoji is platform-authored art you do not control.** 🦅 renders as a brown/gold *American* eagle on
  most platforms, contradicting the "silver space eagle" copy beside it; fixed with a CSS filter. Plus a
  neighbouring CSS gotcha: use `background-image:`, never the `background` shorthand, which resets
  `background-clip:text` and renders the title as a blank bar. (`competition.md`, GS-bird)
- **A preview rig is the only way to judge a small graphic.** The bag "read as a **drinking cup** … it is
  40×46 CSS px on screen and a shape that reads at 3× can be a blob at 1×." (`ui-intro.md`, GS-hud-bag)
- **Art layering:** a tail that "looks like a stick, comes out of his chest" is fixed by drawing its root
  segments **under** the shoulder mantle so it reads as coming from behind.
  (`story-betrayal-arc.md`, GS-story-scorpius-fixes)
- **Three art rules from the serpent hull:** one spine path with everything rotated to the *local*
  heading (axis-upright fins "read as a row of fir trees standing on a green road"); a beast against open
  space is edged in its **own** light (near-black ink made the head vanish); and "the card frame is the
  real constraint" — cropping a wagon trims its exhaust, cropping this trims the **skull**.
  (`story-campaign-slots.md`, GS-startour-serpent-trophy)

### 2.5 UI and layout

- **A global affordance is appended by the shell, not repeated by each screen** — hand-placing the
  settings cog meant "new screens … silently shipped without settings." (`ui-intro.md`, GS-settings-nav)
- **A tile is a place you GO; a row is a promise about a CONSEQUENCE.** (`ui-intro.md`, GS-settings-more)
- **The most important thing can also be the least often used — give it a PAGE.** Save data gets "real
  estate when a player goes looking for it and none of the sheet's height when they are turning the
  music off." Corollaries: the sheet always opens on page one; Escape closes the panel before the sheet;
  and **a read-only save is never behind a tap** ("a fault is news the player has to act on, not a
  service they went looking for"). (ibid.)
- **A pod's width is FIXED, not a floor** — a `min-width` where a fixed width was needed "pushed the score
  pod onto a second row *the instant a shot was struck*"; and "the honest fix is to make the content fit
  the instrument, not the instrument fit the worst content." (`ui-intro.md`, GS-hud-compass)
- **Colour on an instrument means one thing** — a green index mark beside a green tailwind needle was
  "two different meanings wearing one colour", and it started as a tick *inside* the ring where it merged
  with the needle it exists to disambiguate. (ibid.)
- **A nested interactive affordance reads as two controls** — a card that was a `<button>` with a boxed
  CTA inside "read as *tap area PLUS a separate advance button*". (`ui-intro.md`, GS-select-layout)
- **Use a native control to avoid unbounded layout** — "the OS supplies the picker on tap (a real *pull
  box*), so an A0…A15 ladder never reflows the roster." (`ui-intro.md`, GS-diffpills)
- **Two doorways must differ in both hue AND subject** — the Trade Market tile "read as a near-twin of the
  Unending Universe game tile directly above it (also violet, also a nebula-with-core scene)."
  (`ui-intro.md`)
- **Delete a bespoke component and go back to the shared one** when it reads as "a tap panel plus a button
  plus a heap of text". (`ui-intro.md`, GS-title-3)
- **A canvas is invisible to the stylesheet, so it must fetch the design tokens itself** — a hard-coded
  `system-ui` in a canvas "is a label the Readable-text toggle can never reach." (`ui-intro.md`,
  GS-putt-panel)
- **A styling pass may not touch a balance lever** — the meter's sweep period, pace mapping and make band
  are contract-4 property, and the guard asserts the meter reads them *from the sim* rather than scaling
  locally. (ibid.)
- **An instruction printed ON the control it instructs costs no row.** (ibid.)
- **A state field read at the wrong time spoils the outcome** — during the animation `play.lie` is
  *already* the lie the ball will finish in, "so the bar was quietly spoiling the result before the ball
  landed." Found while measuring something else. (`ui-intro.md`, GS-hud-frame)
- **A constraint, honestly imposed, forces improvements.** The frame required every state to occupy the
  action row, and "a disabled button on the aim screen would be a lie" ⇒ tap-to-swing; it also forced the
  caddy badge to become the FX origin instead of a second figure. (ibid.)
- **Find the ONE element forcing the constraint instead of optimising the layout.** Three rejected takes
  are recorded verbatim "so nobody re-treads them", ending: "**The LESSON: the vertical fuel gauge was the
  thing forcing height; drop it and the whole problem dissolves.**" (`rpg-meta-loop.md:391`)
- **Remove a redundant beat rather than polishing it** — "two summary screens back-to-back on every jump";
  and the briefing "isn't deleted", it moves behind a relabelled back button. (`ui-intro.md`,
  GS-intro-endless / GS-intro-voyage)
- **Park a feature by removing its surface, keep the engine** — the Daily Challenge "is PARKED …, not
  deleted from the engine … Bring it back as its own surface when it earns a place." (`ui-intro.md`)
- **Cross-module `let` reassignment is illegal in ESM; object-field mutation is not** — hence the
  exported per-screen view object. Plus: "screen modules import from `ctx`/`helpers`/each other, **NEVER**
  from `app.ts`." (`ui-intro.md`, GS-app-split)
- **A perk needs a TELL.** Showing the softer number was "honest and invisible: a well-equipped player
  would have concluded the courses had got easier." (`ui-intro.md`, GS-hud-gear-reads)
- **"Keep it" is the primary button: the safe choice is the fat one under a thumb.**
  (`story-campaign-slots.md`)
- **Never answer *null* where the player has options** — refusing to resolve an active campaign "would
  have shown a player who owns two campaigns *Begin a new campaign* and no way back to either." (ibid.)
- **A badge is a claim.** "Earned" was stamped on ships that are revealed by renown and then *bought*, so
  it claimed ownership next to a price. (`story-betrayal-arc.md`, GS-story-yard-badge)

### 2.6 Testing, guards and instruments

- **A guard on VARIETY, not just coverage.** The music table is machine-checked to be *actually* distinct
  (≥4 lead voices, ≥6 grooved worlds, ≥4 darkened pads) "so it can't silently collapse back to one
  voice" — after a first cut that was "in tune and in sync but nearly indistinguishable". (`audio.md`,
  GS-music-distinct) — **the shape most worth stealing; nothing in the constitution guards variety.**
- **A surgical refresh must be proven byte-identical to the full render's equivalent subtree.** "Output is
  BYTE-IDENTICAL to the same group inside a full `renderHoleSVG` (asserted for both the terminus-dot and
  finish-ring cases)." (`putting.md`, GS-putt-feel)
- **Prefix-consistency.** The live value at hole N must equal the prefix of the final result — the
  aggregate helpers gained an `upto` param, default byte-identical, and one pure source feeds **five**
  live surfaces. (`story-betrayal-arc.md`, GS-story-sigil-live)
- **A guard that no unresolved template token reaches the screen.** "Screens must never read `t.intro`
  raw; **a test proves no token survives**." (`story-betrayal-arc.md`, GS-story-sigil-rivals)
- **A widen-only invariant, property-tested over a grid** — "every island profile's multiplier is ≥ 1
  EVERYWHERE", swept over 300 seeds × a 41-point u-grid. (`sim-generator.md`, GS-island-width)
- **A fuzz test that proves an error path is exercised stops proving it once the error gets rarer.**
  "Wider pads made raw sliver-pad throws genuinely RARER (good), so a blind fuzz finds none; the known
  throwing configs are now **PINNED** (re-hunt + re-pin whenever `GENERATOR_VERSION` bumps)." (ibid.)
- **A differential guard.** "Even-odd vs non-zero winding is *exactly* the fold and nothing else."
  (`sim-generator.md`, GS-ship-corridor-fold)
- **A rare effect needs BOTH a forced demo and a measured rate** — a fabricated, render-only, rng-free
  demo *and* a lab that samples the real `redirectRate`, because "in normal play you can go a whole run
  without seeing the boomerang." (`caddies.md`, GS-caddy-test)
- **Build the classifying reproduction before attempting the next fix.** "Reproduction (the thing the
  earlier passes lacked)" — a headless sweep classifying every rest found ~25% lost to space and split the
  leaks 79%/21% into two distinct causes, after **four** failed passes. (`sim-generator.md`,
  GS-ship-corridor-contain)
- **A deep-link smoke is not a substitute for the real path.** "A deep-link smoke that mounts a screen in
  isolation is NOT a substitute for driving the real player path — verify reachability in a browser, not
  just that the screen renders." (`story-mode.md:268`) — **this qualifies A27 and should travel with it.**
- **Test fallout, honest not loosened.** When a fix makes a test's *population* disappear, retire the
  proxy and replace it with the still-true behaviour, and say so. (`sim-generator.md`, GS-ship-calm-space)
- **Assert object IDENTITY, not equality**, when the guarantee is "this action touches nothing else" — "so
  a well-meaning `{...state.story}` fails it." And: "**the guarantee MOVED; it did not go away** … a
  weaker guarantee honestly stated, and a much stronger one than *remember not to*."
  (`story-campaign-slots.md`, GS-startour-serpent-trophy)
- **Precision beats reach in a guard, because a noisy guard gets deleted**, and "an allowlist entry is a
  claim about a referent, not a mute suppression." (`lore.md`, GS-story-neutral-address)
- **A double-underscore QA hook (`__gsDecorProbe`) is deliberately outside the `_gs*` namespace** so the
  test-hub sync guard ignores it — "it is not a player-facing feel flag." (`render.md:1272`)
- **Adding a VALUE to an existing hook is free; adding a HOOK is not.** (`lore.md`, GS-lore)
- **Blast radius measured, not guessed** — with fixture re-pin counts recorded, including "the third
  re-pin of this feature family". (`putting.md`, GS-green-contour-2)

### 2.7 Save, state and data model

- **Four asks can be one data-model decision.** "Those look like four features. They are one data-model
  decision: `characterId → StoryState`." (`story-campaign-slots.md`, *One decision, not three*)
- **Prefer the data model where the guarantee is a DESCRIPTION of the write, not a rule to implement.**
  A frozen champion snapshot was rejected twice over: two descriptions of one loadout, *and* "it fights
  the requested warning: if the champion is a separate copy, restarting a campaign does *not* inherently
  destroy it, so the overwrite would have to be wired deliberately and could disagree with what the
  confirmation said." (ibid., *The road not taken*)
- **Per-item fault isolation on a boot path.** "A slot that will not parse is dropped and **its
  neighbours are kept** — losing one campaign is a bad day, losing the other three because of it is the
  failure the feature exists to prevent." (ibid., *Nobody loses a save*) — **this refines A11/A12: the
  boot path never throws, but it also never fails whole-file when it can fail per-record.**
- **A cache is only ever a mirror of what is on disk.** With no storage, the writer "leaves it alone and
  returns false, so *no storage* stays the pure no-op it always was rather than quietly becoming an
  in-memory store that leaks between callers (which would also have made test order load-bearing)."
  (ibid., *Two traps in the store*)
- **A threshold grant gates on the COUNT, not on the crossing event** (`wins >= 1000`), "so a player who
  somehow arrives past the bar without the hull — an imported bundle, a future migration — gets what they
  earned on their very next win." (ibid., GS-startour-serpent-trophy)
- **Two persistence tiers.** Player prefs live outside the versioned save and merge over defaults, so a
  new field "needs **no migration**"; game progress is versioned. (`audio.md`, *Settings*)
- **Avoid needing to reconstruct synthetic state by never storing it** — the side-run "is never
  persisted … This sidesteps the whole *register a fake theme for resume* problem." (`asgard.md`)
- **Expire by derivation, not by cleanup** — the boon "self-expires the moment you travel (the stopIndex
  advances and no longer matches)." (`lore.md`, GS-lore-rewards)
- **Ship dormant data with its coverage guard already armed** — factions were "deliberately hidden
  groundwork … nothing in the UI reads it yet", yet "a caddy without a faction reds CI." (`caddies.md`)
- **Ship the risky persistence layer alone.** "It is the save layer alone. The player-facing halves ship
  separately so the risky persistence work lands reviewable and revertable on its own."
  (`story-campaign-slots.md`)

### 2.8 Narrative, copy and content

- **A branching narrative is a data fork, never an engine fork.** "The shared golf engine, star map,
  tournament framework and battle stay single-source; only *content rows + world-unlock routes + gated
  beats* branch — so the fork adds data, never a parallel engine to keep in sync." (`story-bible.md`, §5)
- **CONTENT BUDGET: a first-match picker over a fixed number of trigger slots means new content silently
  starves old content.** "Arrival beats compete for a fixed number of world arrivals — adding two to
  Chapters 2–3 would have silently STARVED existing beats on a minimum path."
  (`story-betrayal-arc.md`, *Why the aftermath and not the lore gate*)
- **When you change what a place IS, audit the content that assumed what it was.** Turning quiet worlds
  into competitive qualifiers left the beats where they were: "the Apostate stepped onto the tee of a
  qualifier and announced he was here for the major." (`lore.md`, GS-story-beat-venue)
- **A branching choice must not spoil its own consequences.** "The alignment cards are two in-fiction
  voices … with NO mechanical spoilers — no world lists, no *win her back*, no ending names. **What each
  road costs is for the road to reveal.**" (`story-betrayal-arc.md`, GS-story-choice-blind)
- **Copy must not promise a payoff the systems never deliver.** The shrine copy promised winning would
  "break the whisper's hold", "and nothing ever paid it off" — the *promise* was withdrawn rather than
  the system built. (`story-betrayal-arc.md`, GS-story-ambiguous-fate)
- **Derive once-ness from structure when the structure already guarantees it.** "NOT a `seenStoryBeats`
  one-off — a won Sigil can't be replayed, so a WIN beat fires once naturally, and a LOSS beat re-shows
  each retry (it IS that round's result, like the scorecard)." (`story-betrayal-arc.md`, GS-story-aftermath)
- **Generalising a rule must reproduce it exactly on the old inputs.** "Backward compatibility is the
  load-bearing property. With no paired qualifier played, the tally *is* the old rule."
  (`story-betrayal-arc.md`, *The partner tally*)
- **Reusing an antagonist reads as a bug, not as continuity** — a rival returning for a second major
  "read like a bug/replay". (`story-betrayal-arc.md`, GS-story-scorpius)
- **Three surfaces describing one character must each have a distinct job**, or they read as duplicates —
  "the tournament intro frames the STAKES, the beat is the MAN, the lobby taunt is his STILLNESS."
  (`story-betrayal-arc.md`, GS-story-scorpius-fixes)
- **Don't apply a symbol before its meaning exists** — the serpent glyph on every opposing pair gave
  "everyone's a snake in the Emerald leaderboard"; gated to Ch.3+. (`story-betrayal-arc.md`)
- **The copy question is not "is this word rude" — it is "does this word decide something the player
  already decided".** (`lore.md`, GS-story-neutral-address)
- **A zero that reads as a bug should not be rendered** — "Chapter 0 is deliberately never rendered as
  *Chapter 0*." (`story-campaign-slots.md`)
- **Presentation is DATA; the reducer only decides WHEN**, and a stage direction is a line *kind* rendered
  dim and italic, "NOT literal `< >` text." (`lore.md`, GS-lore)
- **A defensive fallback so a stale id can never blank a screen** — "a bare Continue if the id doesn't
  resolve." (ibid.)
- **A named TONE TARGET is a doctrine artifact** — "playful cosmic horror … Saturday-morning eldritch."
  (`story-bible.md`)
- **A canon hook the sequel must honour** (see §3.4): the Warden ending closes on the Coil's remnant
  fleeing to "**THE DESTINATION** — the named unknown deep (a future game mode's front door; **keep the
  name verbatim**)". (`story-bible.md`, §8; `story-betrayal-arc.md`, GS-story-unending-tease)

### 2.9 Perf

- **A hot geometric read needs a bbox prefilter.** `lieAt` had none — "dozens of 10–45 vertex polygons
  tested in full for every point"; memoising per-hole bounding boxes made the aim cone "~2× faster than
  before this work" and the wall suite 36 s → 22 s, "behaviour-identical by construction."
  (`sim-generator.md`, GS-ship-wall-phantom, *One incidental win*)
- **A surgical refresh that rebuilds the whole scene is not surgical.** The putt nudge swapped the entire
  map SVG on every 80 ms hold tick — "brutal when the page is pinch-zoomed (each swap re-rasterises the
  zoomed SVG) and it **starved the pace-meter rAF**." (`putting.md`, GS-putt-feel)
- **Audio engine gotchas.** One `AudioContext` ("browsers cap them; two fight for the hardware"); a
  suspended context has a **frozen clock**, so "never busy-schedule against a frozen clock"; a scene
  switch fades the **bus**, so "already-queued notes die with their bus [and] a crossfade needs no
  per-note bookkeeping." (`audio.md`)

---

## 3. CONTRADICTIONS

### 3.1 `static-courses.md` describes a design that was reversed — and the archive disagrees with itself

**The most likely thing in this repo to be carried over wrong.** `static-courses.md` is written entirely
around a two-representation model in which the **frozen JSON is the default served to players**:

> "A **frozen JSON data file** (`src/sim/course/static/<id>.json`) — the *default* served to players. It
> is byte-identical **forever**, even across `GENERATOR_VERSION` bumps that would re-roll a from-seed
> course." — `static-courses.md`, *The decision*

It then argues spec-only is wrong precisely because it "drifts on every `GENERATOR_VERSION` bump — the
opposite of *the same course every play*."

`sim-generator.md` records the reversal, with the reason:

> "**NO COURSE IS FROZEN** (GS-biome-variety): a course COULD be frozen … but freezing all ~15 tour
> courses would add ~2.5 MB, so even the flagship `metal-18` … now regenerates … A course's exact par
> thus shifts with the design; its identity is a VALID varied routing in the ~69–73 band, not a pinned
> number." — `sim-generator.md:1925–1934`

Verified against the code, not inferred: `FROZEN_COURSES` is an **empty** `Record`
(`src/sim/course/staticCourses.ts:48`) and `src/sim/course/static/` **does not exist**. `npm run
gen:courses` and `scripts/gen-static-courses.mjs` still exist, so the *mechanism* survives — but the
document's headline decision, its precision/rounding section, its "the freezer re-validates" argument and
its test note ("the test does **not** assert frozen == regenerated") all describe a path nothing takes.
`static-courses.md` was never updated. **Anyone reading it cold will believe the game ships frozen course
data.** [verified]

### 3.2 `CLAUDE.md` contradicts itself on the storage namespace

> "Versioned saves from v1 … Namespace keys `gs_*`." — `CLAUDE.md` line 118

against its own opening block ("It stores five `fc_*` blobs on the player's own device") and
`GS-release-identity`, and against the code: the only namespaced keys in `src/` are `fc_save`,
`fc_story`, `fc_settings`, `fc_installNudge`, `fc_introSeen`, `fc_probe`. A stale line surviving the
pre-launch rename — in the one bullet a new project would copy the persistence rule from. [verified]

### 3.3 `asgard.md` states an architecture that `GS-save-slots` replaced

> "There is **no run-stack** in the engine, only a single `resumable` slot." — `asgard.md`,
> *Suspend / resume — the load-bearing decision*

Since save v33 the engine has `runSlots` (`` `${mode}:${characterId}` `` → snapshot, plus a `lastPlayed`
pointer). The Asgard mechanism itself is unaffected (the interlude parks `asgardReturn` and is never
persisted), but the sentence justifying it is no longer true, and it is the sentence a reader would carry
forward. [verified]

### 3.4 A supersession chain that is *correctly* marked — worth copying, not fixing

`story-betrayal-arc.md` shows the archive doing this right, and it is the counter-example that makes 3.1
look like an oversight rather than a habit:

- a shipped line carries its own reversal — "**GS-story-stableford** — ✅ (#510) Sigil 3 single Stableford.
  *(Superseded by GS-story-sigil-formats: Sigil 3 is now singles MATCHPLAY.)*";
- and a later note scopes its supersession precisely — "**GS-story-coil-garb** … supersedes the ROBE half
  of the note above, **and only that half** … The `championLookOpts` half … is **unchanged**."

Same file, the naming near-miss worth preserving: THE DESTINATION "was briefly *Universe Unending*,
renamed to The Destination **before it collided with the existing Unending Universe endless mode**." A
sequel-relevant canon constraint sitting in an archive doc, not in the constitution. [verified]

### 3.5 The archive is now BEHIND the constitution — the rule is being violated in the direction its own preamble warns about

A full `GS-*` tag diff (190 tags in `CLAUDE.md`, 514 in the archive):

- **~300 tags exist only in the archive.** Correct and healthy — retired narrative whose rule was merged
  or dropped.
- **20 tags exist only in `CLAUDE.md`, with no archive entry at all:** `GS-cup-real`, `GS-cup-scale`,
  `GS-fairway-ink-break`, `GS-space-sky`, `GS-page-centre`, `GS-scene-isolate`, `GS-select-card-room`,
  `GS-clubhouse-floor`, `GS-startour-frame`, `GS-startour-serpent`, `GS-story-back-dead`,
  `GS-backup-nudge`, `GS-release-identity`, `GS-crash-diagnostics`, `GS-license-privacy`,
  `GS-putt-holed-position`, `GS-star-map-bigger-canvas`, `GS-star-map-jerky`, `GS-auto-ai-weak`,
  `GS-release-onebuild`.

Every one of those is a 20–40-line `CLAUDE.md` bullet carrying measurements, failure modes and tuning
history — exactly what the preamble says belongs in the archive ("the durable *invariant* goes here (a
line or two); the narrative goes in the archive doc"). This is the concrete mechanism behind the first
pass's **A53** flag, and it explains the 2,164-line constitution: recent work stopped being archived
rather than the constitution being pruned.

The same drift shows in the archive's own headings. `putting.md`'s section
*"Migrated from CLAUDE.md — System-index bullets (2026-07-23 refactor)"* now contains entries dated
2026-07-26 through **2026-08-02** — it is the live narrative section wearing an archival label, so a
reader who skips it as "duplicated constitution text" (as the first pass reasonably did) skips the
current record. [verified]

### 3.6 Smaller staleness worth flagging

- **`art-style.md` lists two preview rigs** (`storyclub-preview.mjs`, `serpent-preview.mjs`) as *the*
  reference-check tools, while `CLAUDE.md` names roughly ten (`gallery.mjs`, `ball-preview`,
  `cup-preview`, `landing-preview`, `putt-panel-preview`, `width-preview`, …). The doc whose entire
  purpose is "approve the look before wiring it in" no longer knows where most of the rigs are — which
  compounds **A8** (those rigs silently rendered nothing on Windows for months).
- **`asgard.md` says the Warrior's Tee edge takes `(depth, ascension)`**, then the GS-warriors-tune block
  below adds a third `voyage` flag. Both are in the same file; the earlier paragraph is not marked.
  Minor, but it is the 3.1 pattern in miniature.

---

## 4. What changes for a new constitution

1. **Three orphans belong in the constitution on day one, because nothing in it covers them.**
   (a) *An upgrade to a stat that is never the binding constraint is invisible* — the single most
   reusable economy rule in the archive, and it has a twin (*a cap that binds before the top item*) and a
   cousin (*a clamp can swallow a whole difficulty ladder*). (b) *A guard on VARIETY, not just coverage* —
   `CLAUDE.md` has coverage guards everywhere and variety guards nowhere, and "in tune and in sync but
   nearly indistinguishable" is exactly the failure a content-as-data game invites. (c) *Split a tolerance
   by who sees it* / *one constant serving a display job and a rules job* — two distinct constants-are-
   dangerous rules the register does not reach, because neither is a duplicated *description*.
2. **`A56` should be rewritten.** "One feature per session/PR" is contradicted by the archive's own
   practice; the rule the archive actually follows is *ship the risky layer alone, reviewable and
   revertable*.
3. **`A27` needs its qualifier attached.** A deep-link that mounts a screen off real reducer transitions
   is excellent — and "is NOT a substitute for driving the real player path."
4. **`A11/A12` gains a third clause.** Boot swallows, import throws, **and a multi-record blob fails
   per-record** — one bad slot must not cost its neighbours.
5. **Fix, don't inherit:** `static-courses.md` (§3.1) and the `gs_*` line (§3.2) are the two places where
   a careful reader would carry a false rule into a new project.
