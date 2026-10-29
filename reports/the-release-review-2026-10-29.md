# The release review — 2026-10-29

**Asked:** *"give us a review of the game and let me know if it's ready for release and if it's not,
what needs to be done."*

**It lands [`the-road-to-v1`](the-road-to-v1-2026-10-19.md), ten days on.** That report's eight
steps stand; this one says which have moved, what the game looks like today from the shipped page,
and what is between `main` and `v1.0.0`. Pointers, not findings, where a decision holds the finding —
[0029](../docs/decisions/0029-the-tracked-record-is-the-record.md).

---

## The verdict

**The game is finished. The release is not.** Nothing found today is a reason not to ship; what is
missing is the release candidate the player asked for on 2026-10-20 (*"Yes, but I'll do that last"*),
two small code items from the road report that never landed, and the one play nobody has done: a run
by someone who is not the author, on the build players will get.

**Recommended order, four steps:**

1. **One PR, mine:** pin butler, give `index.html` a description and `og:` tags, bump to `0.9.0`.
   Then tag `v0.9.0`, which deploys to both destinations. ⚠️ The production origin is public, so the
   candidate is a public release of everything since 12 October; the itch page stays restricted.
2. **The candidate play, the player's:** one whole run on Savior inside the itch embed, the Save tab's
   QR and share from inside the iframe, a phone sitting, and **one run by someone who has never played**,
   watching whether one credit gets them past level 3.
3. **Fix what that finds**, then `v1.0.0` is the same tree with the version moved.
4. **Release day:** itch page Public, [vulpeculagames-site#33](https://github.com/Foxorama/vulpeculagames-site/pull/33)
   merged, the devlog posted.

---

## What checked what

| claim | checked by |
|---|---|
| `main` is `eac09f32` (#677, 0694–0695); no PR is open | `git fetch`, `gh pr list` |
| CI on #677 green: 6 suite shards, 10 proof shards, `test`, Cloudflare Pages | `gh pr view 677 --json statusCheckRollup` |
| The build is green: one 1,623 KB page, 454 KB gzipped | `npx vite build` |
| Players get `0.6.0`: the live origin's version string, `package.json`, and the newest tag | `curl https://intothecoil.vulpecula.games/`, `git tag`, `git describe` |
| `main` is 58 commits and 88 decisions (0608–0695) past `v0.6.0` | `git rev-list --count`, `ls docs/decisions` |
| The itch page still 404s to a logged-out request | `curl https://vulpeculagames.itch.io/into-the-coil` |
| The site PR is still a draft | `gh pr view 33 --repo Foxorama/vulpeculagames-site` |
| The release workflow is proven: `v0.4.0`, `v0.5.0`, `v0.6.0` each deployed green | `gh run list --workflow=release.yml` |
| butler is still installed unpinned (`…/LATEST/…`) | `release.yml:142` |
| `index.html` still has no meta description and no `og:` tag | `grep -c` |
| The sound browser suite the 10-26 handover called red on `main` | `npx vitest run tests/sound.browser.test.ts` — see below |
| Every menu, the intro at three moments, a level-one run at five, and all seven places from the bench | `scripts/shot-menus.mjs`, `shot-intro.mjs`, `shot.mjs`, `shot-place.mjs`; pictures in `shots/review/` (gitignored) |

**The sound suite, run here against `main`: 2 of 7 red.** *THE WHOLE CHAIN* counts 192 buffers
baked for 185 modelled, and *turning it back on says so* counts 41 for 35. The same file passed in
CI on the same tree (run 40422538633, shard 2, 7 tests, 116 s), and the 10-26 handover already
recorded the 192-for-185 reading at 0682. So it is not a rerun question: either the machine bakes
something CI's does not, or the model in `tests/sound.browser.test.ts:20` no longer owns the quantity
it counts — the title piece's parts ([0597](../docs/decisions/0597-the-title-track-plays-in-the-menu.md))
are the obvious candidate: `TITLE_PARTS` has seven parts, the first reading is seven over, and they
are baked on the same gesture and not in that sum. **Per
[0044](../docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) it is established,
fixed or left red, and not rerun.** It does not block the tag: CI is the proof
([0434](../docs/decisions/0434-the-whole-proof-is-cis.md)) and nothing in the game is wrong by it —
but a guard that is red on the author's machine and green on CI is one nobody will trust, and it is a
small PR.

---

## The game, from the shipped page

Looked at as pictures at 1280×720 and 844×390, not played. Every screen the game has is there and
reads as one game in one voice ([0440](../docs/decisions/0440-every-screen-speaks-with-the-titles-voice.md)):

- **The title**: the key art, the pilot band with two secret pilots shown shut as `?????`
  ([0684](../docs/decisions/0684-a-shut-pilot-is-unnamed.md)), the three tiers, *Fly*, the table.
- **The hangar**: three tabs, the dock with its three shopfronts, keepers who speak, the cockpit
  monitor, the ship on its pad ([0687](../docs/decisions/0687-paint-and-parts-stands-on-the-ship.md)),
  and the loadout with a left and a right tube ([0663](../docs/decisions/0663-the-tubes-have-sides.md)).
- **Cosmo's**: picture-first tiles with a price, *Owned* as a tick, and the balance showing *after*
  ([0693](../docs/decisions/0693-the-shops-speak-the-titles-voice.md)).
- **Settings**: four tabs, including Controls bound per device
  ([0664](../docs/decisions/0664-the-controls-are-bound.md)) and the Intro band
  ([0674](../docs/decisions/0674-the-intro-is-a-setting.md)); the phone's sheet adds Steering.
- **The intro**: the bar, the pads, the Viper lighting, the chase with the Mothership, a sun, a
  planet and rocks ([0695](../docs/decisions/0695-the-chase-has-a-sky.md)).
- **The seven places**, each its own picture: the Approach's star river, the Nebula's pillars,
  the Belt's jungle, the Labyrinth's walls, the Shelf's ice, the Mire's canopy, the Heart's veins.
- **A run's end**: the game-over sheet with the run's numbers and the shards earned.

Nothing in the pictures is broken, clipped or the wrong colour. The phone's Settings sheet lays
*Intro* and *Rumble* side by side with their labels to the left, unlike the four bands above them —
a taste, one line, and not a fault.

**What a picture cannot say**, and only a hand can: whether the fights are fair, whether the menus
are good on a pad, whether a phone's thumb finds the arrows, and whether the mix is right. That is the
whole of the play backlog, below.

---

## The eight steps of the road report, ten days on

| # | step | then | now |
|---|---|---|---|
| 1 | the six questions | open | **answered 2026-10-20**, all six; `docs/game.md` corrected |
| 2 | the jellyfish on Burn | measured | **built, [0644](../docs/decisions/0644-the-open-bell-throws-six.md)** |
| 3 | the twelve deciding plays | owed | **see below** |
| 4 | the save version | decide | **built, [0643](../docs/decisions/0643-a-save-reads-every-version-before-its-own.md)**; the lifts are wired in every reader |
| 5 | `v0.9.0` played inside itch | owed | **not started** — no tag since `v0.6.0`, and 4.4 (the QR inside the iframe) is unchecked |
| 6 | the state-of-play rewrite | owed | **not started**; 4,326 lines, forty *owed a play* headings. Not a release blocker |
| 7 | `v1.0.0` | — | waits on 5 |
| 8 | release day | drafted | the site PR is still a draft; the itch page is written on its branch |

**Of Part 4's eight code items:** 4.1, 4.2, 4.3 (the victory piece,
[0645](../docs/decisions/0645-the-heart-resolves.md)), 4.7 and 4.8 are built. **4.5 (pin butler) and
4.6 (meta and `og:` tags) are not**, and 4.4 is a check inside the candidate play.

---

## The twelve deciding plays

What the record shows since 2026-10-19. *Answered* means a decision came out of a play of it;
*played* means a sitting reached it and raised nothing; *no evidence* means nothing in the reports
or decisions since the road report mentions it.

| # | play | status |
|---|---|---|
| 1 | the jellyfish on Burn | **answered** — 0644, and the Burn plays since ([0650](../docs/decisions/0650-a-savior-death-opens-on-a-shield.md), [0652](../docs/decisions/0652-a-full-rack-throws-a-shield.md)) |
| 2 | a run's deaths and its end, then a second *Fly* | **answered** — [0689](../docs/decisions/0689-nobody-is-armed-after-a-run.md), [0685](../docs/decisions/0685-freeplay-is-shown-shut.md) came out of run ends |
| 3 | the save carried to a phone and back, then Undo | **no evidence of a hand on it.** [0682](../docs/decisions/0682-the-phone-pass-again.md) photographed the Save tab; nothing read a QR off a monitor. **It is the one thing a player cannot get back — put it in the candidate play** |
| 4 | one run per tier after the shields came down | **answered** — [0692](../docs/decisions/0692-a-levels-shell-adds.md), [0655](../docs/decisions/0655-legend-keeps-the-supercharge.md), *"Game can be hard on saviour and burn"* |
| 5 | can a new player reach the later places on one credit? | **open, and it is the author playing.** Only a stranger answers it. The drafted pages say nothing that this would contradict, so it is a 1.0 question and not a 1.0 blocker — but it is the one that decides whether 1.0 feels unfair |
| 6 | the Labyrinth's forks on each tier | **no evidence.** No report or decision since the 19th mentions a fork or an island |
| 7 | the Rime Shelf's frost pulse | **no evidence** beyond a mention |
| 8 | the pterodactyl's throat beam against its warning | **answered** — [0660](../docs/decisions/0660-the-pterodactyl-screams.md) came out of a pterodactyl fight; the beam itself was not raised |
| 9 | the Hamster Ball's knock and dance | **answered, three times** — 0646–0654, [0691](../docs/decisions/0691-the-ball-breaks-what-it-lands-on.md) |
| 10 | the catherine wheel's boss fights | **played** — the wheel is in nine decisions since; no fight-length complaint was raised |
| 11 | the intro on every flight | **answered** — [0674](../docs/decisions/0674-the-intro-is-a-setting.md) |
| 12 | the victory screen's piece | **answered** — [0645](../docs/decisions/0645-the-heart-resolves.md) |

**The shape of the backlog.** [`the-plays-owed`](the-plays-owed-2026-10-19.md) has none of its 209
boxes ticked, and four sittings have happened since it was written (10-18, 10-24, 10-26, 10-27).
Each produced a PR, and each PR is owed a play. The queue does not empty by design. **What matters for
the verdict is what the last two sittings found**: the 10-26 play's twelve items were a gun's place on
a side view, a shut pilot's name, menu layout, the break's cursor, the ball's knock and a level's
shell; the 10-27 play's four were the dock's outside, the chase's sky, Cosmo's tiles and the shops'
dress. **Taste and polish, not faults.** That is the signal a game gives when it is ready.

---

## What `docs/game.md` promises and 1.0 does not ship

All marked *not built* in the product definition, and none claimed on the drafted itch or site page:

- the opt-in accessibility settings — six assists modelled in `src/sim/assist.ts`, a high-contrast
  palette authored, none reachable ([0024](../docs/decisions/0024-the-accessibility-floor-is-settings.md),
  [0198](../docs/decisions/0198-the-accessibility-pass-comes-after-the-game.md));
- a touch stick, written in `src/app/touch.ts` and not offered;
- the asteroid, the reference case for a body that breaks what it hits.

**Recommendation, as on the 19th:** 1.0 offers none of them and claims none. The high-contrast palette
as one Settings band is the cheapest real addition if one is wanted, after 1.0.

---

## Housekeeping, not blocking

- **Players are 17 days behind `main`.** Everything since 12 October has only ever been played on a
  dev server or a branch preview, by the author. The candidate tag is what closes that.
- **The state-of-play rewrite** (step 6) is owed after the candidate play, when most of its forty
  headings retire.
- **The branches and worktrees**: the road report counted 50 landed branches and 46 worktrees;
  nothing in them is work that would be lost. Removing them is [0200](../docs/decisions/0200-the-tool-that-edits-must-not-lose-what-it-edits.md)'s
  to ask about.
- **The record's own shape**: `docs/state-of-play.md` is 355 KB and its one *START HERE* has grown
  a page of amendments. It still answers the question, but a clone reads it slowly.

---

## Not done, on purpose

No tag, no version bump, no PR, no branch deleted, no change to any gun, boss or bullet. The
pictures are in `shots/review/`, gitignored; the scripts above make them again.
