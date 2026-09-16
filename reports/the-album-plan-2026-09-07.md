# The album plan — 2026-09-07

**A plan, handed off.** Written at the end of a session's budget so that a fresh session can pick it
up cold; it carries pointers and intentions and no findings, because nothing in it has been flown.
It is the tenth item of [`the-alpha-list`](the-alpha-list-2026-09-06.md) — *"the music as an album"*
— worked out into steps. Every step is one PR with its own decision, on
[0033](../docs/decisions/0033-a-branch-starts-at-main.md)'s terms.

## What was asked

> *"The current boss music is generic and I want to make it more part of the overall music track to
> export the level tracks to spotify."*

> *"I don't want the mid-boss music to change the current level music tracks though as it'll mean
> they all need to be readjusted."*

> *"I don't want the boss sounds or deaths to be part of the music tracks on spotify — the music
> tracks should be music that stands completely independent of the game and not require any
> knowledge of a boss at all."*

> *"The musical ending will be good anyway as we need to put that into the game for the end of level
> transition to new level regardless… Can't be timed in game though as it's reliant on boss death so
> if the boss death takes ages, it'll need to kick in at the end."*

> *"The spotify album can have them at the static level lengths though."*

> *"Title music plus run music — we'll need to make the title music expand out though as it's
> currently a pretty short recurring sound and not a full track."*

## The options, and which one

| option | verdict |
|---|---|
| export the levels without the fight | **refused** — two-minute tracks whose climb resolves into nothing |
| extend the level material to fill a track | **refused** — every section boundary is a distance and `bossAt` is fixed, so a longer track is a longer level and moves every wave, pickup and difficulty number; repeating a section in the export alone is a second copy of the level's shape the game never plays |
| **make the fight's music the level's final movement, and export the whole level** | **chosen** |

## What is measured

`SCROLL_PER_STEP × STEPS_PER_SECOND` is 36 units a second (`scripts/timeline.mjs`). Fight lengths
are [0260](../docs/decisions/0260-a-boss-is-fought-to-the-end.md)'s table at max weapons on the
tuned tier.

| level | theme | mid-boss at | end boss at | final movement | whole track |
|---|---|---|---|---|---|
| approach | approach | 0:43 | 1:59 | 43 s | ~2:42 |
| descent | nebula | 0:44 | 2:00 | 47 s | ~2:47 |
| coilward | saurian | 0:43 | 1:59 | 51 s | ~2:50 |
| shoal | labyrinth | 0:42 | 1:58 | 54 s | ~2:52 |
| batteries | rime | 0:42 | 1:58 | 58 s | ~2:56 |
| gauntlet | mire | 0:45 | 2:01 | 62 s | ~3:03 |
| eye | core | 0:29 | 2:04 | 68 s | ~3:12 |

Plus a coda each, not yet sized. With the fight, every level is an ordinary track length.

## Why the fight sounds generic, as far as reading the tables can say

⚠️ **The timbres are already per place; the skeleton is shared.** Every theme but the Approach
revoices `dread`, `frenzy`, `wraith`, `stomp`, `toll` and `drive` (`revoicedBy` in
`src/content/themes.ts`). What every place shares: the same fourteen layers open at `boss` and
`bossPeak`; the harmony closes the same way into the same A Phrygian tritone
([0114](../docs/decisions/0114-the-fight-is-a-different-piece.md)); the leitmotif `wraith` is the
BASE composition's `call` flattened, not the place's; and **no place opens one of its own four slots
during the fight** — `ownA`–`ownD` ([0188](../docs/decisions/0188-a-place-owns-four-slots.md)) are
zero at `boss` and `bossPeak` in all seven ladders. Seven costumes on one body. **That is a reading,
not a finding** — step 1 is what turns it into one.

## What is settled before any step

- **The material before the boss is untouched throughout.** No layer that sounds between `run` and
  `approach` changes gain, voice or ladder entry for this work. The player is changing some of those
  tracks by hand in parallel, and the two streams touch different layer sets.
- **The mid-boss gets no music.** [0247](../docs/decisions/0247-a-level-has-a-mid-boss-and-a-real-one.md)
  stands: fought under the section it is in, `bossOnField` false. If it ever needs a signal it is a
  cue on the sound bus, which the album never renders.
- **A track is the music bus and nothing else.** `scripts/hear.mjs --level` already renders the
  music at the rungs a walk decides with no cue in it; cues live in `--play`. The album mode inherits
  that and a guard holds it (step 6).
- **The fight's music is, on the album, simply the final movement.** A listener never learns why the
  harmony turns. So it has to earn its place as music derived from the level's own tune, and it is
  judged as music first and as a boss theme second.
- **The album's lengths are static**: the walk to `bossAt`, then the 0260 length, then the coda. In
  the game the same notes are keyed to health and to the death; two clocks, one score.
- **Both surfaces, always** — the game and the music room are one ladder since
  [0212](../docs/decisions/0212-the-room-walks-the-level.md).

## Where the code is

| what | where |
|---|---|
| the rungs, the shared ladder, `LEVEL_ONLY`, `OWN_LAYERS`, `BOSS_PEAK_HEALTH`, `LAYER_BARS` | `src/content/music.ts` — `MUSIC_LEVELS` at ~1027, `MUSIC_LADDER` at ~1206 |
| a place's ladder, voices, `LEVEL_HOLD`, `REBASE`, `rungOf`, `voicesOf`, `revoicedBy` | `src/content/themes.ts` |
| the six places' own material (the Approach is the base) | `src/content/{nebula,saurian,labyrinth,rime,mire,core}.ts` |
| `OWN_ROLES`, `SOLVED_BY` — an own slot without a role is refused by `tests/themes.test.ts` | `src/content/arrangement.ts` |
| `musicLevelFor` (health → `boss`/`bossPeak`), `levelWrites`, `nextBarFrom` | `src/app/music.ts` ~578 |
| the one call site, once a frame | `src/app/mount.ts` ~1875 |
| `bossOnField`, `fight` 0/1, `clearedIn`, `bossBurstIn` — the death that will open the coda | `src/app/frame.ts` ~1952, ~1017 |
| the level render, the walk arithmetic | `scripts/hear.mjs --level=<kind> --fight=<s>`, `scripts/timeline.mjs` |
| the instruments | `scripts/weigh-gesture.mjs [a] [b]` (slot similarity between places), `scripts/weigh-heard.mjs` (what survives the mix), `scripts/weigh-room.mjs`, `scripts/solve-hold.mjs` |
| the music room | `src/app/attract.ts` |
| how to run any of them here | `node --experimental-transform-types --import ./scripts/ts.mjs scripts/<x>.mjs` with node from `docs/machine.md` |

Read before opening a number: [0113](../docs/decisions/0113-there-is-one-composition-and-seven-levels.md),
[0114](../docs/decisions/0114-the-fight-is-a-different-piece.md),
[0116](../docs/decisions/0116-the-rig-plays-the-level.md),
[0226](../docs/decisions/0226-the-level-holds-one-loudness.md),
[0245](../docs/decisions/0245-a-budget-is-sized-under-load.md).

## The steps

### 1. Listen, and write the report

Render all seven with `hear.mjs --level=<kind> --fight=<0260 seconds>`; run `weigh-gesture.mjs`
over every pair of places **restricted to the fight rungs**, which is a flag it does not have yet;
listen to the seven final movements back to back. **The output is a committed report naming which
quantity is generic** — layer set, harmonic move, leitmotif source, or timbre — and it is the brief
for step 4. No music changes. This is
[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md) and the metronome lesson: three
rounds were tuned by guessing which layer was meant.

### 2. The form, as one decision

Eight tracks in run order: the title, then the seven places. Each place track is the walk, the final
movement at its static length, the coda. It names: the coda rung and what opens it; the title's
script and its clock; the album render's guard; the loudness target for Spotify's normalisation
(−14 LUFS integrated is what it normalises to; the game's bus is measured by `tests/clean.ts`'s
`loud`, K-weighted, and that is the instrument to read the album with); bit depth and rate (the
engine bakes at 44.1 kHz 16-bit; rendering at 48 kHz or 24-bit is a change to `wavOf` in `hear.mjs`
and a choice about resampling, not a mastering pass). One decision, several sentences.

### 3. The coda rung, base composition first

A new `MusicLevel` after `bossPeak`. **Keyed to the boss's death, the way `boss` and `bossPeak` are
keyed to health** — `musicLevelFor` grows one more early return, read off the frame's death state,
and the change lands on the next bar as every section change does
([0117](../docs/decisions/0117-a-section-change-lands-on-the-beat.md)). It plays out under the
respite screen ([0063](../docs/decisions/0063-a-level-break-is-a-respite.md)) until the next level's
piece takes over.

⚠️ **Constraints that are architecture, not taste.** All music is sample-locked loops of whole
multiples of the shortest ([0095](../docs/decisions/0095-the-level-has-its-own-music.md)), so a coda is a
loop opened once on the death bar and closed by gain after one pass. Two things to verify before
writing a note: **where the fight rung goes today at a level boundary** (`advanceLevel` keeps the
camera; what does the music do between the death and the next level's bake?), and **whether the
next level's bake can start before the coda has finished** — the bake-at-the-boundary path is
[`what-seven-compositions-would-cost`](what-seven-compositions-would-cost-2026-08-12.md). Adding a
rung touches `MUSIC_LADDER`, `MUSIC_LEVEL_LABEL`, `LEVEL_HOLD` and every theme's `ladder` type; land
it once as structure, with the base composition's coda, so the seven places below state theirs
inside their own PR rather than being visited twice.

### 4. Each place's final movement and coda — seven PRs, run order

Per place, on step 1's brief: open own slots at `boss`/`bossPeak` with voices and `OWN_ROLES`
([0188](../docs/decisions/0188-a-place-owns-four-slots.md)); a per-place fight ladder
([0162](../docs/decisions/0162-a-place-has-its-own-ladder.md)); **the leitmotif from the place's own
`call` or `hook`**, not the base's, so the seam at two minutes is the level's tune transformed rather
than replaced; a coda that resolves it. Written against the creature in
[`the-bosses-asked`](the-bosses-asked-2026-09-05.md) so the game gets a themed boss, judged as music.
`weigh-heard.mjs` after each, because [0271](../docs/decisions/0271-the-cathedral-keeps-only-its-drum.md)
is what an unmeasured layer at the fight costs. `LEVEL_HOLD` is re-solved for the changed rungs only
(`solve-hold.mjs`).

### 5. The title's composition

Today the title is `calm`: `drone`, `bass`, `beat` on a short loop. It becomes a script of rungs like
a level's, **walked on a clock rather than a camera** because the title has no scroll — the music
room's walk in `attract.ts` is the nearest existing shape. An ordinary track length that settles back
into the loop it has now. `TITLE_ONLY` still closes at a level start, so nothing downstream moves.
Independent of the seven; can go anywhere after step 2, and is worth hearing early because it is
track one.

### 6. The album render mode

`hear.mjs --album`: every place at its static length plus the title, stereo, at step 2's depth,
rate and loudness target, named files. **A guard that the album output is a function of the music
tables and nothing in `src/content/cues.ts`** — the player's constraint, held. The music room walks
the same script and needs no change if steps 3–5 are done on the ladder.

### 7. The asset list and the upload report

Track titles, cover art, order, and a committed report of what to upload where. The Spotify channel
is distribution, not code — a report is the most a session can do.

## What not to do

- Do not touch a gain, voice or ladder entry at `run`–`approach`. That is the player's own work and
  the constraint above.
- Do not give the mid-boss a music event.
- Do not put a cue, a death or the gun in an album file.
- Do not time the coda in the game; it opens on the death and nowhere else.
- Do not extend a level to lengthen a track.
- Do not raise a bake budget to make a fuller fight pass —
  [0245](../docs/decisions/0245-a-budget-is-sized-under-load.md) is pending and the bake guards
  already time out under the proof; land or sit beside it before step 4 makes seven fights fuller.

## What is owed after this plan

A listen, per step, by the player, against the branch preview and against the rendered files. Every
number above is a model quantity until then.
