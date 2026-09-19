# The overnight plan — 2026-09-19

Written to be picked up cold by a fresh session. It is a queue: work it top to bottom, and **stop a phase
rather than ship it broken** — *"this cannot be done cleanly because X"* is a result
([0028](../docs/decisions/0028-quality-is-the-constraint.md)).

**Read first, in this order:** `CLAUDE.md`, `docs/machine.md` (gitignored; node is not on PATH),
`docs/state-of-play.md`, `.claude/skills/ship/SKILL.md`, then this file.

---

## 0. How to work here

| thing | value |
|---|---|
| node | `export PATH="/c/Users/foxor/AppData/Local/gf-node/node-v24.17.0-win-x64:$PATH"` in every Bash call |
| ffmpeg | `/c/Users/foxor/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/ffmpeg` |
| main checkout | `C:\into-the-coil` — **the user's other session works here on bosses. Do not edit it, do not switch its branch.** |
| music checkout | `C:\into-the-coil-beat`, branch `the-heart-beats-under-it` (61 commits ahead of the merge base, 5 behind `origin/main`, **no conflicts**; only `src/app/mount.ts` is touched by both) |
| measuring tools | `C:\itc-renders\tools\` — copies of every scratch script used so far (see §9) |
| the failure list this plan was written from | `C:\itc-renders\tools\test-failures-2026-09-19.txt` |
| renders for the user's ear | `C:\itc-renders\` — `album\`, `album-draft3\`, `cues\`, and put new ones in `overnight\` |

**Rules that have already cost hours here:**

- **Never pipe the proof** — `npm run prove > file 2>&1; echo $?`. A pipe reports exit 0 over a failed run.
- **One proof at a time, and edit nothing in that tree while it runs** — it copies the tree. It takes about
  two hours. Check no other proof is running first (`Get-Process node` and ask what they are; never kill
  node by a `*vite*` pattern — it takes vitest with it).
- **A new worktree for anything off `main`**: `git worktree add C:\into-the-coil-<name> -b <branch> origin/main`,
  then junction `node_modules` from `C:\into-the-coil-beat\node_modules` with PowerShell
  `New-Item -ItemType Junction` (the `mklink` route fails from Git Bash).
- **A branch starts at `main`; never stack PRs** ([0033](../docs/decisions/0033-a-branch-starts-at-main.md)).
  Phases C–G each wait for the one before to merge, or start from `origin/main` and do not depend on it.
- **Source and docs are edited with an editor or an exact-anchor script**, never `sed` on anything with a
  backtick or backslash in it ([0200](../docs/decisions/0200-the-tool-that-edits-must-not-lose-what-it-edits.md)).
  The pattern used all session: a small `.mjs` that reads the file, asserts each `find` occurs exactly once,
  replaces, writes.
- **A red guard is never answered by changing the work to suit it** — fix the defect, or change the guard
  and say why in the guard, or delete it ([0192](../docs/decisions/0192-a-guard-holds-an-invariant.md)).
  Every guard edit made so far carries its reason beside it; keep doing that.
- **A wall-clock budget is three times the worst cost measured under load**, with the measurement written
  beside the number ([0245](../docs/decisions/0245-a-budget-is-sized-under-load.md)). A test that is slow
  when run ALONE (`-t "name"`) is not evidence: a single test pays for bakes the full suite shares.
- **You cannot hear.** Every sound change ships with a before/after render and a number. Put the renders in
  `C:\itc-renders\overnight\` and list them in the morning report (§8) — the user's ear is the verdict.
- The merge ritual is `/ship`. Invoke it; do not reconstruct it.
- Decision numbers: `0331` is reserved for the music and is cited 24+ times already. `origin/main` is at
  `0337`. Take the next free number **at the moment you write the file** (`git ls-tree --name-only origin/main docs/decisions/ | tail`),
  and add it to `docs/decisions/README.md`.

---

## 1. Where things stand

**Done and committed on `the-heart-beats-under-it`** (nothing here is merged; none of it is in the game):

- All seven levels' music reworked over ~30 listens; The Black Heart rebuilt as four movements with a
  heartbeat, a flute lead and an orchestral fight. The user has approved these by ear.
- An eight-track album rendered and mastered to −14 LUFS: `C:\itc-renders\album\Into the Coil (Original Soundtrack)\`.
  `scripts/hear.mjs --album`, `scripts/album.mjs`, `scripts/album-art.mjs`, `src/content/codas.ts`,
  `src/content/title-track.ts`, `reports/the-album-release-2026-09-17.md`.
- New engine fields: theme rows `glide`, `linger`, `swell`, `fromSilence`, `onBeat`, `bars`, `pan`;
  voices `release`, `vibrato`, `scoop`, `loose`; `barsOf()`; `hear.mjs --stem=a,b`.
- **The shared copy of a re-voiced layer is released** at the hand-over and re-baked when the next place
  wants it (`released`, `wholeLoops`, `releasedLayers` in `src/app/sound.ts`), with a guard and three
  probes (`scripts/probes/0331-the-heart-beats-under-it.mjs`).
- **Cues are stereo**: `CueLayer.pan` / `panTo`, a side table `widthOf()`, two-channel `AudioBuffer`s.
  All 21 cues plus Saurian Belt's own were rescaled out of the clipper ("the flat wall") and given a
  width. `CUE_ROOM_SECONDS` 1.1 → 2. The shuriken fires on beat divisions (`fireEvery: [24, 24, 18, 16, 12]`),
  has a `figure` and a small room.
- **A place's music is synthesised on workers** (`src/app/bake.worker.ts`, `src/app/bake-pool.ts`,
  `useLayerBaker`) and **baked ahead from the boss approach** (`ahead`, `bakePlaceAhead`, `handOverPlace`
  in `src/app/mount.ts`). Verified in Chrome off `file://`: 4 workers, 1 main-thread long task in 25 s
  against 32 on the walk. The build is still one file.
- Guards already brought along: 0158 boundaries for `eye`, the three loop-length guards (`barsOf`), the
  memory budgets (shared set 52.5 MB < 56; per-level PAIR < 145 MB with its table), the title table keyed
  by a closed union, the weapon tier guard (sees `coil`), three hang detectors resized with measurements.

**Not done:** 21 failing tests, 34 stranded probes, no decision record, no proof, no PR.

---

## 2. PHASE A — the skipped level (ship this FIRST; it is a live bug on `main`)

**Reported:** *"we've somehow lost the ice level, game goes from labyrinth to toxic mire to black heart now,
no rime shelf."*

**Diagnosis (read, not yet proven by a test).** `LEVEL_KINDS` is intact — `batteries` (theme `rime`) is
still fifth. The bug is in `src/app/frame.ts`, added by #377 *"The fight happens in a room"*:

```ts
// And the level is cleared once the way out is open — never before it.
if (w.roomOpen >= room.opens && w.clearedIn <= 0) w.clearedIn = BOSS_DEATH_STEPS;
```

`clearedIn` counts down to 0 and then `w.onCleared()` fires. On the next step `clearedIn <= 0` is true
again and the room is still open, so **the countdown is re-armed and `onCleared` fires a second time**
`BOSS_DEATH_STEPS` later. `SCREENS.cleared` has `steps: true`, so the world keeps stepping under the
banner; `mount.ts`'s `world.onCleared` dispatches `{ slice: 'run', type: 'levelCleared' }` each time and
the reducer does `level: state.level + 1`. Two reports, two levels. Only a boss with a `room` does it — the
**gyre**, which is Shoal's — so Shoal → (Batteries skipped) → Gauntlet.

**Do:**

1. `git fetch origin`. **Check it is still there** (`git show origin/main:src/app/frame.ts | grep -n "clearedIn = BOSS_DEATH_STEPS"`)
   — the user's boss session may have fixed it. If so, skip to Phase B and say so in the report.
2. Worktree off `origin/main`, branch e.g. `a-level-is-cleared-once`.
3. **Write the failing test first** and watch it fail: fly the gyre's fight to its end through the real
   frame (see `tests/gyre.test.ts`, `tests/world.ts`, `scripts/weigh-boss.mjs`'s `flyFight` for fixtures),
   keep stepping for `BOSS_DEATH_STEPS * 3` more steps, and assert `onCleared` was called **exactly once**.
   Add the player-unit assertion too: a run that clears Shoal is on level index 4, not 5.
4. Fix with a latch, not a re-ordered condition — e.g. a `w.clearedReported` boolean set where `onCleared`
   fires and reset where `clearedIn` is reset for a new level (`w.clearedIn = 0;` near the level reset),
   or arm only while `w.bossBeaten` has not yet been reported. Read how the no-room path latches
   (*"`bossBeaten` already latched, so this happens once"*) and make the room path share it.
5. **Ask what the bug was also doing**: does a double `onCleared` double anything else (a pickup grant,
   `levelCleared`'s one-per-level inheritance at `mount.ts` ~2218, the score)? Assert the ones you find.
6. A probe in `scripts/probes/` that removes the latch and shows the test red. Decision record. `/ship`.

---

## 3. PHASE B — ship the music

Work in `C:\into-the-coil-beat`. **Step 0: `git rebase origin/main`** (or merge; no conflicts predicted,
`mount.ts` is the only shared file — after it, diff `mount.ts` against the pre-rebase commit to check
nothing of `ahead`/`handOverPlace` was lost; memory says a resolution loses what still compiles).

### B1. The 21 failures, in the order to take them

Content first, tables second, the loudness solve LAST (every mix change moves it).

**Real defects — fix the music/engine:**

| # | test | message | what to do |
|---|---|---|---|
| 1 | `transition` › never climbs more in one bar | `core push → surge climbs 3.1 dB inside one bar, at 1:01` (ceiling 2) | The ballad's arrival. Stage it: give the louder surge arrivals (`groove`, `beat`, `ownA`) a `swell` > 1 on `THEMES.core`, or drop one from `onBeat`. Re-listen risk is low (it is a 1 dB softening of a bar); render `--level=eye --stem=` before/after 0:55–1:05 into `overnight\`. |
| 2 | `music` › 0171 a build fits inside the section | `eye's approach is 8.8s long and its build takes 4.80s` (max 4.375) | Shorten the approach build: fewer staged arrivals (add to `onBeat`), or smaller `swell` on the approach arrivals. Do **not** move the section boundary — the user tuned 1:55. |
| 3 | `music` › 0171 arrivals go up the arrangement | `core surge→approach: chords (bed) arrives a bar after a louder role` | Order of staged arrivals at `approach`: `chords` must land before the louder role. `onBeat`/staging on the core row. |
| 4 | `themes` › no theme drives the bus past full scale | `saurian at run is -15.9 dB dirty` (ceiling −16) | 0.13 dB. `THEMES.saurian.trim` 0.78 → 0.77, or take 0.3 dB off the `ownC` punch. Then re-check the fills are still audible with `C:\itc-renders\tools\hits.mjs`. |
| 5 | `themes` › 0148 a re-voiced tune stays in its notes | `approach/chords plays 11` | `src/content/approach.ts` re-voices `chords` as `MUSIC.chords.map(...attack 0.012)`, which makes the shared chords (they contain a G♯) subject to The Approach's stated scale. Either state the attack without re-voicing (a row-level field), or extend what The Approach states. Prefer the first; the user's ask was only *"the chords pop a bit more."* |
| 6 | `themes` › 0132 band rule | `rime re-voices chords with 43% below 130Hz, and the layer sits at 0.2` | `main` passes this. `git diff origin/main -- src/content/rime.ts src/content/themes.ts` for what moved Rime's `chords` or its pan. Likely collateral from a shared-voice edit; fix the cause. |

**Tables that describe the old arrangement — update, with the reason beside the row:**

| # | test | what |
|---|---|---|
| 7 | `arrangement` › names every layer exactly once | the shared table gives `crash` a role at `push`; no place opens it there now (The Black Heart's `crash` is the ballad's heart, `surge` only). Remove the role or move it. |
| 8 | `arrangement` › 0155, `themes` › 0188 | `core opens ownA at approach and OWN_ROLES does not say what it is`; `core's call is not the part at approach`. `OWN_ROLES.core` needs `ownA` at `approach`, `boss`, `bossPeak` (the ballad's kit: `pulse`), and the roles for `call` at `approach`. `LEADS.core.boss` should probably be `bass` — that slot is the fight's flute, which leads it. |
| 9 | `themes` › 0164 | `STILL_ADRIFT`: run the test for the full list of 7 (`approach/boss/drive, …`). For each: is it an intention (a layer the user asked to be quieter — the violins under the flute, the darker high strings, a fill that sounds once in four bars) or a consequence? Intentions go on the list with the user's quote; consequences get fixed. The rides were restored once already; check them again after the rebase. |
| 10 | `themes` › 0147, › BOTTOM floor | `saurian -16.1 dB, core -19.3 dB`; `core puts 6.3% under 300Hz at calm`. The Black Heart's opening is a piano, a flute and a distant heart by design. Read both guards' own notes before choosing between a known-list entry and lifting `drone`/`ownC` a little at `calm`/`run`. |
| 11 | `themes` › 0166 | one place *"stopped buying a steadier boundary"* — run it, read which, and see memory `a-guard-can-sit-green-on-an-artifact`: print the number for every place before trusting the verdict. |
| 12 | `dash` › two themes do not produce the same gains | `expected 'quieter' to be 'silent'` — a fixture naming a layer one place no longer silences. Read the test; pick the pair it means now. |

**The loudness contour and hold — LAST, after every mix change above:**

| # | test | what |
|---|---|---|
| 13 | `themes` › 0329 a contour only ever falls | 5 rungs sit over their place's opening. Read [0329](../docs/decisions/0329-a-level-may-fall.md). For The Black Heart the ballad is *meant* to be the loudest thing; that is either a contour statement for `core` or an amendment to 0329 — decide it in the decision record, do not bend the music. |
| 14 | `themes` › every rung holds its run loudness | `node scripts/solve-hold.mjs` re-solves `LEVEL_HOLD`; paste it. ⚠️ memory `the-hold-model-hears-a-silent-aura`: the model puts the aura at its ceiling where play has it at 0 — check the sparse openings by ear-proxy (`hear.mjs --level` + `ebur128`) rather than trusting the solve alone. **After pasting, render all seven `--level` files and compare short-term loudness per section to `C:\itc-renders\v31\`**; a section that moved more than 1 dB is a finding for the morning report. |
| 15 | `transition` › never shortens a departure | `core: crash leaves faster than the longest ramp`. This is `linger` doing its job — the user: *"two heartbeats close together sound like a bug."* Teach the guard that a layer whose row **states** a `linger` has an authored departure; keep the rule for every layer that does not. |

**Wall clock / plumbing:**

| # | test | what |
|---|---|---|
| 16 | `themes` › AND WHAT IT STATES ACTUALLY SOUNDS DIFFERENT | timed out at 60 s. The bakes are bigger (The Black Heart is 35 s of synthesis). Measure it in the full suite, set three times that, write the measurement beside it. |
| 17 | `sound.browser` › THE WHOLE CHAIN | `expected 73 to be 100` buffers. The count changed because cues are baked in stereo where wide and the place's layers now arrive from workers. Read the test's arithmetic and re-derive the expectation from the tables — do not paste 73. Then check the other two `sound.browser` tests that failed earlier in the session. |
| 18 | `links` | `docs/decisions/0331-the-heart-beats-under-it.md` does not exist yet — B3. |
| 19 | `prove-guard` › every probe can still be applied | 34 stranded — B2. |

Re-run the failing files after each group; re-run **the whole suite** (`npm test > file 2>&1`) before B4.

### B2. Re-anchor the 34 probes

`node scripts/prove-guard.mjs` lists each stranded probe with the `find` it could not locate. For each:
open the probe, find the same *kind* of line in the current file, update `find` **and** `replace` so the
break still breaks the same thing, and keep the probe's own prose true. The music tables
(`themes.ts` ladder rows, `LEVEL_HOLD`, `arrangement.ts` `LEADS`/`OWN_ROLES`, `levels.ts` sections) and
every cue row were rewritten this branch, so expect most of them to be there. **Do this after B1**, because
B1 moves the same lines again. Then add probes for what this branch introduced and has no probe for:
`pan`/`panTo` (a layer's pan ignored → a guard that the two channels differ), `useLayerBaker` (the worker
path drops a layer), bake-ahead (a held place handed over early), the shuriken's cadence (a rung that does
not divide the beat). **Write the guard first where one is missing** — e.g. *every `fireEvery` rung of an
auto-weapon divides 48 or 72 steps* belongs in `tests/weapons.test.ts` with the user's quote.

### B3. The decision records

One PR, and probably three decisions — check `/ship` for whether it wants one per PR; if it does, write
0331 with three parts rather than splitting the branch (the three are entangled in `sound.ts` and
`tests/sound.test.ts`).

- **0331 — the heart beats under it.** The music: the listens and what each changed (the commit log is the
  index: `git log --oneline origin/main..HEAD`), the new row and voice fields and why each exists, the
  album as the instrument that found the mix problems, `released` and the per-level memory pair (the table
  is in `tests/sound.test.ts`), what is owed (the in-game coda, the in-game title score).
- **A cue has a width.** The flat wall (layer sums of 3–4× full scale into `tanh`; `C:\itc-renders\tools\brickscan.mjs`
  prints it), `pan`/`panTo` and why a side table rather than a return type, the two-second room, the
  shuriken's cadence and the quote. **Say plainly that the user has NOT yet approved these by ear.**
- **A place is baked on workers, before it is needed.** 35 s against 5; 32 long tasks against 1; the pair
  budget; why from the approach and not from the first bar; what the travel screen (Phase C) will do with a
  bake that is not ready.

Then `docs/state-of-play.md` (pointers and intentions, never findings), and the memory files in
`C:\Users\foxor\.claude\projects\C--into-the-coil\memory\` (`the-listen-is-waiting-on-the-ear.md`,
`the-album-is-a-preparation-job.md` are stale now).

### B4. Prove and ship

`npm test` green → `npm run prove > C:\itc-renders\tools\prove.txt 2>&1; echo $?` (two hours, touch nothing)
→ `/ship`. No irreversible surface is touched (no storage key, save schema, SW cache prefix) — confirm that
with `git diff origin/main --stat -- src/save public/sw.js` before saying so in the PR.

**If the proof is red at 3 a.m.:** fix, re-prove once. If red again, stop, leave the branch pushed, and
write what failed — do not loop.

---

## 4. PHASE C — the travel screen (new branch off `main`, after B merges)

**Asked for:** *"we'll need loading screens anyway for transitions and to represent moving through the
galaxy"*, and: **a full-screen scene**, not a banner over the sky.

**What it is.** After a boss dies the existing three-second *Level clear* respite plays as it does now
([0063](../docs/decisions/0063-a-level-break-is-a-respite.md) — read it; this screen comes AFTER it and
does not replace it). Then a full-screen scene: the coil drawn as a route of seven places, the ship
travelling from the place just cleared to the next, the next place's name and a line about it, its palette
arriving. `docs/game.md` already says a chart goes between levels and `SCREENS.cleared`'s own note says
*"this is where the chart will eventually go"* — this is that, as a straight line.

**Rules to build it by:**

- A new `Screen` kind (`SCREEN_KINDS` in `src/state/screens.ts`), `steps: false`, `dims: true`. Screens are
  rows; behaviour rides the row ([0016](../docs/decisions/0016-a-hub-enumerates-kinds.md)).
- **It holds for a minimum** (start at 4 s) **and until the place's music is ready** — `ahead !== null` in
  `mount.ts`, or the in-flight bake landing. It never holds for the music when sound is off. It has a hard
  ceiling (20 s) after which it goes anyway and the music arrives when it arrives. A press skips it once
  ready. Show progress only if the hold exceeds the minimum.
- Art is baked to bitmaps and blitted ([0022](../docs/decisions/0022-frame-rate-is-a-feature.md)); each
  place already has a palette and a sky (`PALETTES`, `THEMES[kind].space/nebula`). Draw the route from
  `LEVEL_KINDS` — never a hand-written list of seven.
- Music: the title's drone under it, or silence into the next place's `run`. It must not start the next
  place's music early (`setLoops` swaps at the next phrase — see `ahead`'s note).
- Accessibility: a knob to shorten it to its minimum ([0024](../docs/decisions/0024-the-accessibility-floor-is-settings.md)); nothing here may touch the sim.
- Tests: the screen flow (cleared → travel → playing, once per level, **and level index +1 exactly** —
  Phase A's bug lives next door), the hold logic with an injected clock, a browser test that it appears and
  leaves. Photograph it with a Playwright script on an **offset grid** (memory `photograph-on-an-offset-grid`)
  and read the PNGs — the Browser pane freezes rAF.
- Deliver screenshots into `C:\itc-renders\overnight\travel\` for the user.

## 5. PHASE D — what the album is owed in the game (own branch)

1. **The coda on the boss's death.** `src/content/codas.ts` already writes each place's ending
   (`codaOf(theme)`, Saurian Belt's is drums, The Black Heart's has two last heartbeats); only
   `scripts/hear.mjs --album` plays it. In the game it is a rung keyed to the END boss's death: loops let go
   (tau ≈ 0.6 s), the coda is struck on the next downbeat, level-matched the way `hear.mjs` does it
   (K-weighted, 200 Hz high-pass, 1.5 dB under what it follows). It must coexist with `bossDown`'s cue and
   the *Level clear* respite.
2. **The title screen plays the title track.** `src/content/title-track.ts` (`TITLE_PARTS`, `TITLE_SCORE`)
   is played only by `scripts/album.mjs`; the game's title still loops two bars of A minor and G — the very
   thing the user called *"the first two notes… that bounce back and forth."* Walk the score on a clock in
   the title screen, loop it from the theme section, and keep the music room working.

## 6. PHASE E — the intro movie, PHASE F — the victory movie (own branches)

Asked for: *"a game intro loading movie and a victory movie as well."* Nothing is designed. **Do not build
these blind.** Write a storyboard report each (`reports/`), from `docs/game.md`'s fiction: 6–10 shots, what
is on screen, what it says, how long, what plays under it (the title track exists; the victory wants the
Black Heart's acceptance movement or its coda), how it is skipped, what it costs to bake. Build the intro
only if Phases A–D are merged and there are hours left; it doubles as the cover for the first prewarm
(*the press-to-HUD cost is four seconds today* — memory `press-to-hud-costs-four-seconds`), which is a real
reason for it to exist. The victory movie replaces `SCREENS.victory`'s bare *"Coil cleared"*.

## 7. Things NOT to do

- **Do not change shuriken damage.** The user said a cut would be welcome (*"it shreds bosses and
  minibosses"*), but `scripts/weigh-boss.mjs` is not a basis: it flies `savior`, guns only, ship parked,
  and reports the lightning gun as *never* killing most bosses, which the user knows is false. **Fixing the
  rig is the task** (why does `arc` never kill? why can the shuriken not kill `medusa`?), and its findings
  go in the report. The balance change is the user's, in their boss session.
- Do not re-tune any music by numbers alone past what B1 requires. Thirty listens went into it.
- Do not raise a budget to make a guard pass without the measurement and the owner written beside it.
- Do not touch `C:\into-the-coil`. Do not force-push, delete a branch or remove a worktree without listing
  what would be lost and stopping ([0200](../docs/decisions/0200-the-tool-that-edits-must-not-lose-what-it-edits.md)).
- Do not start Phase C, D, E or F on top of an unmerged Phase B.

## 8. The morning report

Write `reports/the-night-of-2026-09-19.md` and commit it on whichever branch is current:

- what merged (PR links), what is pushed and waiting, what stopped and exactly why;
- **the listening list** — every sound that changed and has not been heard, with the file to play and the
  before file beside it. Standing items already owed the ear: all 21 cues (`C:\itc-renders\cues\*-new.wav`
  against `*-before.wav`), `throw-over-music-new.wav` for *on the beat*, the title track's heartbeat and
  final section, The Black Heart's orchestral fight and its flute from 1:28, Saurian Belt's fills and drum
  ending;
- every number that moved more than expected (section loudness after the hold re-solve, memory, bake time);
- decisions the user has to make, each with a recommendation.

## 9. The tools in `C:\itc-renders\tools\`

| script | what it answers |
|---|---|
| `brickscan.mjs` | how hard each cue's layer sum is driven into its clipper (raw peak, % pinned, crest) |
| `cuewet2.mjs` | a cue as the game plays it — stereo, with the room; `--over=<music.wav> --every=24,18,16,12` lays a weapon over level music |
| `loud.mjs <main-worktree>` | each cue's peak and loudest-50 ms against `main` |
| `lr.mjs`, `env.mjs` | left/right level and the envelope of any wav over time |
| `baketime.mjs <repo>` | seconds of synthesis per place, and the longest single note |
| `ahead-check.mjs` | opens `dist/index.html` off `file://`, starts a run, counts workers and main-thread long tasks |
| `mixscan.mjs <theme> <rungs…>` | every layer's level by band at a rung — who owns the brightness, who buries the melody |
| `climbscan.mjs`, `flutefft.mjs`, `filebands2.mjs` | The Black Heart's flute against its orchestra, bar by bar and band by band |
| `jumps.sh <wav>` | sudden loudness rises in a render |
| `pops.mjs`, `whopops.mjs` | clicks per minute, and which layer makes them |
| `hits.mjs`, `lowhits.mjs`, `roots.mjs` | strokes on a grid; the root note per bar |

Many of them import from `C:/into-the-coil-beat/…` by absolute path — that is deliberate; point them at
another checkout by editing the path, not by copying the repo.
