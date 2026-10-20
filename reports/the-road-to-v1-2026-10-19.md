# The road to v1 — 2026-10-19

**Asked:** *"we've made a heap of game changes since the last review. what do we need to do to release
the game? 1. playtest a bit more for all the recent changes 2. update the website and itch when we're
ready to go. what else do we need to do or should we do? do a full report and start working overnight
on anything you can smash out"*, then *"itch is not publicly viewable, vulpecula games website is an
alpha version. what do we need to do to fully release version 1.0 is the aim."*

**This report does not replace [`the-v1-list`](the-v1-list-2026-10-15.md); it lands it.** That list was
written four days ago, answered the same question, and never merged. Its six questions were never
answered. It lands in this PR beside this report, and the parts below say what has moved since,
what was built overnight, and what is still yours.

⚠️ **Pointers, not findings, where a decision already holds the finding** —
[0029](../docs/decisions/0029-the-tracked-record-is-the-record.md).

---

## The short answer

v1.0 is **eight things, in this order**. Items 1–3 are yours. Everything after them is mostly mine.

1. **Answer the six questions** — [below](#1-the-six-questions-still-open-from-the-v1-list). The
   biggest is what 1.0 *is*: `docs/game.md` still described a prologue, a betrayer, a Level 1 pool and
   a branching chart, none of which exists. My recommendation, as on the 15th, is that 1.0 is the
   game as built, plus the victory music.
2. **Decide the jellyfish on Burn** — [below](#2-a-likely-soft-lock-the-last-boss-on-burn). Measured
   tonight: with the Thunderbolt or the Aqua Duck, the last boss on *Let the Galaxy Burn* likely cannot
   be finished by the gun. A fight that never ends is the one defect a 1.0 cannot ship with.
3. **Play** — [`the-plays-owed`](the-plays-owed-2026-10-19.md) is all 174 items. **The 12 below are
   the ones that decide whether 1.0 ships**; the rest can be played after it.
4. **The save-version decision** — a reader handed any version but its own reads nothing, so the
   first bump after 1.0 empties every player's hangar. Cheap now, expensive after.
5. **A `v0.9.0` candidate played inside the itch embed** while the page is still restricted. Nothing
   here has ever looked at the game in itch's iframe.
6. **The state-of-play rewrite.** It is 355 KB and its *What is next* is forty headings of *owed a
   play*; after the play, most retire.
7. **`v1.0.0`**: bump through `/ship`, tag, and the release workflow deploys both destinations.
8. **Release day**: itch page public, the site PR merged, the devlog posted. The copy and the art are
   **already drafted** — [vulpeculagames-site#33](https://github.com/Foxorama/vulpeculagames-site/pull/33).

---

## What changed since the v1 list (2026-10-15 → today)

- **v0.6.0 is still what players get.** It was tagged on 2026-10-12 at 0607. `main` is twenty PRs
  and thirty-five decisions past it (0608–0642), every one of them owed a play. Checked: `git rev-list
  --count v0.6.0..main`, and `curl` of the live origin, where the version string reads `0.6.0`.
- **The itch page still 404s** to a logged-out request. Checked: `curl`.
- **The save now travels** ([0641](../docs/decisions/0641-the-save-travels.md)) and **a load can be
  undone** ([0642](../docs/decisions/0642-a-load-can-be-undone.md)). These add the key `itc_undo`, a
  backup file format and `ITC1` codes — three surfaces that cannot be taken back once shipped. Both
  PRs carry rollback notes.
- **The v1 list's Part 4.1 is now four keys, not one.** It checked only `hangar.ts:61`. `scores.ts:95`
  and `settings.ts:77` read nothing on a version they do not know, exactly as the hangar does. Checked
  by reading all three on `main`.

---

## 1. The six questions, still open from the v1 list

Each is asked in full, with its reasoning, in
[`the-v1-list`](the-v1-list-2026-10-15.md#questions-for-the-player). My answer to each, so a *yes*
is enough:

| # | question | recommendation |
|---|---|---|
| 1 | Prologue, betrayer, Level 1 swap, chart: in 1.0? | **After 1.0.** And **the rescue story stands**: the finale already makes an unchosen golfer Venoma's captive, which a betrayal contradicts |
| 2 | Run save and victory piece: in 1.0? | **The victory piece, yes.** The coda is already written for the album (`src/content/codas.ts`); the game only plays the title track at the victory screen. **The run save, no** — a run is 15–30 minutes, and the save is a new irreversible key |
| 3 | Devices: desktop *"also runs on phones"*, or phones supported? | **Desktop, keyboard or gamepad, "also runs on phones and tablets held sideways."** Desktop is the target ([0153](../docs/decisions/0153-desktop-is-the-target.md)) and the phone has never been measured |
| 4 | Price? | **Free, with an optional donation**, as The Far Carry is |
| 5 | The vetoes: raised in each sitting, silence is acceptance? | **Yes.** There are 35 now, listed at the end of [`the-plays-owed`](the-plays-owed-2026-10-19.md#vetoes-owed) |
| 6 | A `v0.9.0` candidate played inside the itch embed first? | **Yes.** See item 5 of the short answer |

**Answered 2026-10-20:**

1. *"Skip this completely and remove."* The prologue, the betrayer, the Level 1 swap and the chart are
   gone from `docs/game.md`, and with them the caddy pool. **The rescue story stands.**
2. *"Unclear on what this is?"* — **still open**, explained back:
   - **The run save** keeps a run in progress, so a closed tab resumes at the start of the level it was
     on, with its lives and arsenal.
   - **The victory piece** is music of the ending's own; today the victory screen plays the title track.
3. *"Desktop 1st, phones supported because people were playing it on phones."* The site and itch copy
   say so, and itch's *mobile friendly* is ticked.
4. *"Pay what you want on itch, chip in link on vulpeculagames."* Both are in
   [vulpeculagames-site#33](https://github.com/Foxorama/vulpeculagames-site/pull/33).
5. *"Which are these?"* — **still open**, explained back: the 35 calls listed under
   [*Vetoes owed*](the-plays-owed-2026-10-19.md#vetoes-owed), where a decision made a judgement the
   player may overturn.
6. *"Yes, but I'll do that last; the v0.9.0 to v1.0 bump should essentially be no changes."* So
   `v0.9.0` is the release candidate, and `v1.0.0` is the same tree with only the version moved.

**One more, new since the list:** the opt-in accessibility settings. `game.md` promises palettes,
reduced motion and six assists; all six assists are modelled in `src/sim/assist.ts` and none is
reachable by a player, and the high-contrast palette is authored and unreachable. **Recommendation:
1.0 offers none of them and the itch page claims none**, which is what the drafted page does. Offering
the high-contrast palette as one Settings band is the cheapest real addition if you want one.

---

## 2. A likely soft-lock: the last boss on Burn

**Owed by [0476](../docs/decisions/0476-the-jellyfish-opens.md)**, whose *Owed* says the arc on Burn
*"stalls in the open phase for minutes … The cause is not checked,"* and names the check: *"the same
flight with the void's appetite set to nothing."* That check was run tonight with a scratch script
built on `scripts/weigh-boss.mjs`'s `flyFight`. The ship is held on the jellyfish's lane, 60 units
short, unhittable, with missiles silenced, as the instrument always flies.

**The jellyfish on *Let the Galaxy Burn*, health over time:**

| gun (ship) | as built | void swallows nothing | jellies feed nothing |
|---|---|---|---|
| **arc** (Thunderbolt) | stuck between 1,330 and 1,580 of 4,839 from 65 s to the 200 s cap; **whole five-second spans with zero damage** while 50–73 void blasts are on the field | **killed at 74 s** | still stuck — 1,392 → 1,368 over 50 s |
| **paintball** (Aqua Duck) | stuck between 1,298 and 1,415 from 85 s; the 40 feeding jellies heal 60–180 a span on top | **killed at 95 s** | — |
| arc, on *Savior* | killed at 41 s | — | — |

**So the void is the cause**, as 0476 guessed, and the feeding is not. The likely mechanism is that
both guns spend their fire on void blasts: the arc links to the nearest body and the blasts are always
nearer than the bell, and a paintball is spent on the first thing it meets. On Burn the open phase
throws enough blasts that nothing reaches the jellyfish.

**What this does NOT show:** whether a moving player escapes it. The blasts are thrown at the ship, so
moving should not put the bell nearer than them. A player can still finish her with specials: the
storm and the bomb each land a twentieth of her once, so about six charges are needed for the last
30%. A Burn run with the Marmot or MMXXVI is the play that confirms it.

`scripts/weigh-boss.mjs --difficulty=burn` shows the same thing for every held lane: both guns read
*never* on the jellyfish, including from her own lane at all three distances. The full table is in the
PR that landed this report.

**Three ways out, and which one is not mine to pick** — *"when it comes to bullets and enemies, stop
assuming, present a plan"* (state-of-play, 2026-09-10):

- **(a) The arc does not link to a shot, only to bodies.** This touches one gun's targeting. It
  removes the arc's ability to pop void blasts, which may be a feature the arc owners like. It does
  nothing for the paintball.
- **(b) Burn's open phase throws fewer void blasts.** One number on the boss row. It fixes both guns
  and every ship, and softens the hardest tier's last phase.
- **(c) A void's appetite is capped per blast on Burn.** Each blast still eats, but a big enough
  stream gets through. It is the most targeted fix and the most new code.

**My recommendation is (b)**: one number, every ship, and Burn's last phase stays the hardest
thing in the game. Not built, waiting on your word.

---

## 3. The play: the twelve that decide 1.0

The full list, grouped by where in the game each thing is seen, with six suggested sittings, is
[`the-plays-owed`](the-plays-owed-2026-10-19.md). It holds **174 items, 35 vetoes and 25 marked
probably stale**. These twelve are the ones where a wrong answer would make 1.0 feel broken or
unfair; the rest are polish and can be played after the tag.

1. **The jellyfish on Burn with the Thunderbolt or the Aqua Duck** — §2 above.
2. **A run's deaths and its end**: ×2, ×1, ×0, and does the run end on the death at ×0? Then a second
   *Fly* in the same tab. [0636](../docs/decisions/0636-the-counter-is-the-ships-left.md),
   [0634](../docs/decisions/0634-the-boss-bar-goes-with-the-run.md),
   [0635](../docs/decisions/0635-every-flight-plays-the-intro.md)
3. **The save carried to a phone and back, then Undo.** File, QR read off a monitor, a friend's code.
   It touches the one thing a player cannot get back.
   [0641](../docs/decisions/0641-the-save-travels.md), [0642](../docs/decisions/0642-a-load-can-be-undone.md)
4. **One run per tier after the shields came down.**
   [0614](../docs/decisions/0614-the-shields-come-down-a-tier.md),
   [0573](../docs/decisions/0573-the-legend-bites.md), [0355](../docs/decisions/0355-a-tier-opens-on-a-shell.md)
5. **Can a new player reach the later places?** One credit by default, Freeplay hidden until a tier is
   finished. [0608](../docs/decisions/0608-freeplay-is-earned.md),
   [0517](../docs/decisions/0517-no-quarters-given.md). This is the question
   `docs/game.md`'s *no extra lives* has left open since 0082.
6. **The Labyrinth's forks on each tier**: is a hit off an island fair at speed?
   [0600](../docs/decisions/0600-the-corridor-forks.md)
7. **The Rime Shelf's frost pulse**, a freeze every ten seconds.
   [0459](../docs/decisions/0459-the-bosses-are-placed.md)
8. **The pterodactyl's fanned throat beam** against its warning.
   [0453](../docs/decisions/0453-the-laser-fans-out.md)
9. **The Hamster Ball**: is the knock a knock or a stall, and does the dance come round too often?
   [0609](../docs/decisions/0609-the-ball-takes-its-knocks.md),
   [0613](../docs/decisions/0613-the-dance-is-earned.md),
   [0615](../docs/decisions/0615-the-ball-is-solid.md)
10. **The catherine's boss fights.** On Savior, `weigh-boss` reads the Firebird's median held fight at
    107 to 225 s on every boss. It is the longest of the seven guns on the fish, the pterodactyl and
    the frost ship, and among the longest everywhere else. Its *best* lane is ordinary (43 to 69 s),
    so the wheel may simply want flying, which held lanes cannot do. The play decides it.
    [0545](../docs/decisions/0545-the-catherine-wheel.md),
    [0591](../docs/decisions/0591-the-wheel-stays-a-beat-longer.md)
11. **The intro on every flight**: 17 seconds before every run, Skip on screen. Welcome, or does it
    want a setting? [0635](../docs/decisions/0635-every-flight-plays-the-intro.md)
12. **The victory screen in silence-but-for-the-title-track**: does the ending want its piece? This
    decides question 2.

**To reach levels 5–7 quickly on a deployed URL**, there is no level select in the shipped game; the
bench (`rig/bench.html`) is local only. The play list's first sitting is a whole run for that reason.

---

## 4. Before the tag, in the code

| | what | status |
|---|---|---|
| 4.1 | **The save's version.** All three readers (`hangar.ts:61`, `scores.ts:95`, `settings.ts:77`) read nothing on any version but their own, so the first bump empties every player's key. Decide: a migration chain, or a written *a bump resets* | **Yours to decide.** Recommendation: the chain's first link — every reader steps an older document up through a list of lifts (empty today), and a test fails if a version is bumped without one. No key changes; it is code that runs on read |
| 4.2 | **The jellyfish on Burn** | §2 — waiting on (a), (b) or (c) |
| 4.3 | **The victory piece**, if question 2 says yes | Not started. 0418 names the work: the music is keyed by place, and this piece is not a place |
| 4.4 | **The save QR inside itch.** The code's link points at the page it was made on (`mount.ts`); made inside itch's iframe, that is itch's per-upload address, and a phone that opens it saves into storage the embed may never read | Found by the release audit; **check it in the `v0.9.0` play** before deciding anything |
| 4.5 | **`release.yml` installs butler unpinned** (`…/LATEST/…`). A butler release on tag day changes the tool mid-release | Small; pin it with the `v0.9.0` PR |
| 4.6 | `index.html` has no meta description or `og:` tags, so a shared game link unfurls bare | Small; it must keep 0002's brand test green |
| 4.7 | **`PRIVACY.md` said the settings keep "the look"** (gone since 0590), and omitted the hand, the steering and the tiers finished | **Fixed in this PR** |
| 4.8 | **`docs/game.md` contradicted the game**: eight levels, four guns, Larry on the arc, Bo on the shuriken, three lives fixed, *"two levels exist"*, *"nothing says how much boss is left"*, a touch stick offered, a migration chain | **Fixed in this PR.** Every unbuilt promise is now marked *not built* and points at question 1, rather than being deleted on your behalf |

---

## 5. itch

Part 5 of [`the-v1-list`](the-v1-list-2026-10-15.md#part-5--itch) holds the steps and they stand.
**What is new tonight:** the page itself is written —
[`ITCH-COIL.md`](https://github.com/Foxorama/vulpeculagames-site/blob/coil-one-point-oh/ITCH-COIL.md)
on the site PR, in the same shape as the Arkham page's source. It holds:

- the settings, embed options (1280 × 720, fullscreen button on, autostart off), genre and tags;
- a cover at 1260 × 1000, cut from the key art with the title kept;
- **eight screenshots of the real game at 1920 × 1080**, one per place, mostly late boss phases;
- the description HTML, and a short launch devlog.

Three lines in it are marked *(open)* until questions 2–4 are answered.

**The steps only you can do, in the itch dashboard:** tick *played in the browser* on the `html5`
upload if it is not already ticked (it sits behind the login, so nothing here can read it), paste the
page, upload the images, and set *Public* on release day. **Never replace the upload by hand**: a new
upload is a new origin, and every player's save stays behind in the old one.

## 6. The website

**Built: [vulpeculagames-site#33](https://github.com/Foxorama/vulpeculagames-site/pull/33)**, a draft
to merge on release day. It covers Part 6 of the v1 list and goes further:

- the Coil page rewritten to describe only what is built, with the eight screenshots, no *alpha* line
  left, and an itch button;
- the studio, about and music pages' *Play the alpha* changed;
- the README's convention moved from *honest about being an alpha* to *only what is in it*.

`node scripts/links.mjs` passes, and the page has no horizontal scroll at 375 px.

## 7. Housekeeping

**One piece of built work never reached `main`: the v1 list itself.** It lands in this PR. Every other
local branch and worktree was checked against `main` (by PR state, `git cherry`, and decision number):

- **50 branches are landed or superseded** and safe to delete.
- **4 are stale handover edits or a partial left out on purpose**: `the-ci-is-under-five`,
  `the-hangar-is-handed-over`, `the-keepers-move` (a 7-line test comment) and
  `the-light-is-added-rescued` (81 of 227 lines landed as 0520).
- **2 scratch worktrees** hold nothing but deleted files.

**There are 46 worktrees on disk.** Removing them is 0200's to ask about. It is one `npm run tidy` plus
a list to approve, and nothing in it is work that would be lost.

---

## What was done overnight, and where it is

| | where |
|---|---|
| This report; the v1 list landed; the 174-item play list | this PR |
| `docs/game.md` corrected to the game as built; `PRIVACY.md` corrected | this PR |
| The jellyfish-on-Burn cause measured | §2; scratch script, not committed |
| Site page, itch page source, cover, eight screenshots | [vulpeculagames-site#33](https://github.com/Foxorama/vulpeculagames-site/pull/33), draft |

**Not done, on purpose:** no tag and no version bump, because a tag deploys to players; no change
to any boss, gun or bullet, because the rule for those is a plan first; no branch or worktree deleted.
