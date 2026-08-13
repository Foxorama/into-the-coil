# 0146 — Five places, and the brief named all five

**Accepted 2026-08-13.** [0132](0132-a-place-may-be-another-piece-entirely.md) built the mechanism for
a place to be another piece entirely and used it once. This uses it five more times, which is every
level that did not have one.

> *"Crank out music for level 3 and level 4. Level 3 will be a space laser dinosaur style biome
> effect, so a cross between ancient jurassic and eurobeat techno trance. And level 4 will be a
> labyrinth style, lost in a maze being hounded and chased style effect… If you get those two levels
> done, move onto 5, 6 and 7. One will be ice, one will be toxic mire hydra boss and the last will be
> the black hole heart of the galaxy so something heavy on the Scandinavian death metal side."*

## The rule

**Every level is now a composition of its own, and a place's NAME, HUE and MUSIC are one decision.**
Five new files under `src/content/` — `saurian`, `labyrinth`, `rime`, `mire`, `core` — each stating
twenty-one of the twenty-three layers, its own sixteen-bar progression and its own tunes.
`THEME_KINDS` is renamed where the brief contradicted it.

| level | theme | was | the brief |
|---|---|---|---|
| 3 | `saurian` — Saurian Belt | `debris` — The Debris Line | space laser dinosaur; jurassic × eurobeat |
| 4 | `labyrinth` — The Labyrinth | `rime` — Rime Shelf | lost in a maze, hounded |
| 5 | `rime` — Rime Shelf | `forge` — The Forge | ice |
| 6 | `mire` — The Toxic Mire | `bloom` — Spore Bloom | toxic mire, hydra boss |
| 7 | `core` — The Black Heart | `core` — The Core | the black hole at the heart of the galaxy |

## ⚠️ This was authorised over the handover's own instruction, and the player said why

`docs/state-of-play.md` opened *"BOTH SOUNDTRACKS WANT TWEAKING BEFORE ANY MORE ARE WRITTEN"* —
recorded 2026-08-13 from *"I want to make a fair few tweaks to both soundtracks before we expand out
to the rest of the levels."* The brief above supersedes it with an argument rather than an
instruction:

> *"I know there's a lot of unanswered questions for levels 1 and 2, but they're actually pretty
> good, just need better differentiation between the different sections, and refining each level is
> probably going to be a detailed process so getting some baseline tracks in now is probably a good
> time to get some more levels in so that tuning the tracks can also be done individually, but
> tonally for the game overall as well."*

⚠️ **So the ordering changed for a stated reason: tuning is per-place work, and there is no benefit to
doing it before the places exist.** The three open questions on level one and two are still open and
still unanswered — [0136](0136-the-place-has-a-room-and-an-arc.md)'s room, the three-sections
question, the boss drop — and none of them is answered here.

## ⚠️ Nothing about the mechanism moved, and that is the finding

Five places, each roughly the size of Ember Nebula, and **not one line of `src/app/music.ts`,
`src/content/music.ts`'s ladder, `src/app/mount.ts` or any guard changed to accommodate them.** 0132's
shape — a `voices` map keyed on `MusicLayer`, an `air` map beside it, `bakePlace` at the boundary
([0133](0133-the-place-is-baked-at-the-boundary.md)) — took four more places with no amendment at all.

⚠️ **AND THE RESIDENT COST IS STILL 48.0 MB**, which is the claim
[`what-a-whole-place-costs`](../../reports/what-a-whole-place-costs-2026-08-12.md) made and this is
the test of: a place REPLACES the layers it states rather than being held beside them, so seven
compositions cost what one does. `scripts/weigh-place.mjs` prints it per place and it reads 48.0 for
all five.

## ⚠️ Renaming a theme kind cost three lines, and that is `0016` being paid back

`ThemeKind` is read in exactly two places — the table itself and `src/content/levels.ts`'s `theme`
column — so `debris` → `saurian`, `rime` → `labyrinth`, `forge` → `rime`, `bloom` → `mire` was a
compile error until every reference moved.
[0016](0016-a-hub-enumerates-kinds.md) is the reason a name that stopped describing its level could
not quietly go on being wrong.

⚠️ **`rime` KEEPS ITS NAME AND CHANGES ITS LEVEL**, which is the one row that is a move rather than a
rename: the ice theme was at level four and the brief puts ice at level five. Nothing about it was
wrong except where it sat.

## What each place is made of, and why it is not the one before it

⚠️ **THE HARD PART IS NOT WRITING FIVE PIECES, IT IS WRITING FIVE PIECES THAT CANNOT BE MISTAKEN FOR
EACH OTHER.** Each file names the one or two structural ideas it is built on, and no two share one:

| place | the idea, and it is not a timbre |
|---|---|
| `saurian` | a REGISTER SPLIT: primeval material on top, hi-NRG floor underneath, and the rungs hand the level from one to the other |
| `labyrinth` | a LIMP (`3·3·3·3·4` accents across the bar) and a CANON (`counter` is `call` four bars late) |
| `rime` | fourths and fifths instead of thirds; a slow harmony over a fast surface; a kit made entirely of transients |
| `mire` | a fast pattern with a SLOW ATTACK on every note; and the hydra is one figure at three transpositions at once |
| `core` | tremolo picking, a harmonised twin lead derived from the tune, and a palm mute under an open chord |

⚠️ **THE LABYRINTH'S CANON IS FOUR CHARACTERS OF ARITHMETIC AND IS THE STRONGEST IDEA IN THE FIVE.**
`CHASE` is `TURN` rotated by four bars, so the tune that led the player through the level starts again
underneath itself one phrase behind. `RUNG_CLOSES` already takes `call` away at `surge`
([0120](0120-a-rung-may-close-a-layer.md)), so what the player loses is the tune and what they gain is
the thing following it.

⚠️ **AND THE HYDRA IS THE SAME TRICK POINTED AT A BOSS.** `HEAD` is sounded at the root, at the fifth
and at the fourth by three voices at once. Nothing here can add a layer mid-fight, and it did not need
to: three heads on one figure is a stack.

## ⚠️ `MUSIC_ROOT` IS 55 Hz, SO OCTAVE 0 **AND** OCTAVE 1 ARE BOTH UNDER THE BAND RULE

`tests/themes.test.ts` refuses a re-voiced layer carrying 40% of its energy under 130 Hz at a non-zero
pan ([0132](0132-a-place-may-be-another-piece-entirely.md)'s own finding). A sustained pad voice at
`octave: 0` puts **two thirds** of `chords` down there — `chords` sits at +0.2 — and three of these
five files were written with one before the guard said so.

⚠️ **THE FIX IS THE SAME IN ALL THREE AND IT IS PHYSICS RATHER THAN A NUMBER**: the pad's bottom voice
moves to `octave: 2` (220 Hz) and the place's deep lives in `sub`, `groove` and `drone`, which
`LAYER_PAN` centres and which may. It is recorded here because the next place will be written by
somebody who has not read `weigh-place.mjs` output.

## ⚠️ Two bounds are in tension at every rung, and knowing which is which is the whole tuning loop

Every one of the five hit both of these, in this order, more than once:

| bound | what it refuses | where the slack is |
|---|---|---|
| `tests/themes.test.ts` clipping | the summed bus past full scale at any rung | layers the fight OPENS — `stomp`, `frenzy`, the aura, `drive` |
| 0134's low-share floor | a place under 90% of the base's energy below 300 Hz | layers the fight CLOSES — `groove`, `chords` |

⚠️ **SO THE LEVER THAT COSTS NOTHING IS TO PUT A PLACE'S LOW END IN A LAYER THE BOSS CLOSES.**
`groove` and `chords` are zero at `boss` in `MUSIC_LADDER`, so weight there buys `run`, `push`,
`surge` and `approach` and is free at the one rung where the peak is measured. Raising `sub` instead
buys the same four rungs and spends the boss's whole headroom, which is how three of these places
first went red.

⚠️ **AND THE CEILING IS ARITHMETIC RATHER THAN A FEELING.** `saturate(x, a) ≤ 1` exactly when `x ≤ 1`
([0104](0104-the-gun-plays-a-figure.md)), so the constraint is *the summed layer values at any instant
× `MUSIC_GAIN` ≤ 1* — a raw sum of **2.174**. Every peak reported in
[`five-places-measured`](../../reports/five-places-measured-2026-08-13.md) is against that number.

## ⚠️ One defect was found by a guard and it was a real one, not a bound being tight

`saurian`'s kick was written at eighths with its pickup on the last *and* of the bar — which is
exactly where `OFFBEAT`, the hi-NRG stab, plays. **The two loudest low transients in the place landed
on the same sample sixteen times a phrase**, and the file's own comment two paragraphs above said *the
kick has the downbeat to itself*. It measured as the boss mix clipping at **1.004** and it would have
read to an ear as *the kick is uneven*.

⚠️ **The fix is the kick moving to a sixteenth grid so its pickup can sit where the stab's eighth grid
has nothing** — a placement, not a gain. [0027](0027-measure-the-picture-not-the-model.md)'s shape:
the model quantity caught something the picture would have been blamed for.

## ⚠️ Four probes went orphaned, and three of them were pinned to numbers a hand is expected to move

`npm run prove` refused to run at all: four of 0107's probes anchored on `src/content/themes.ts` lines
that no longer exist — two backdrops belonging to themes that were renamed, and two whole `mix`
literals. [0019](0019-a-probe-must-be-seen-to-apply.md) doing exactly the job it is named for, on the
first tuning pass those anchors ever met.

⚠️ **THE RENAMED BACKDROPS ARE THIS DECISION'S FAULT AND THE TWO MIX ANCHORS ARE NOT.** A probe pinned
to `mix: { arp: 1.3, hook: 1.28, drone: 0.55, … }` breaks the moment anybody tunes that row, which is
the one thing that row exists to have done to it. Re-anchored on the things the guards themselves make
structural: a single `arp` value for the floor rule, and **`approach`'s `mix: {}`** for the
sounds-different rule — a row `tests/themes.test.ts` requires to stay empty, so it cannot drift.

⚠️ **`prove` EXITS 1 WHEN NOTHING RAN, WHICH WAS WORTH CHECKING RATHER THAN ASSUMING.** *Nothing was
run* is the loudest possible message and would be worthless behind a zero exit code; it is not.

## What is NOT changed

⚠️ **The ladder, the rungs, the distances, `MUSIC_GAIN`, `MUSIC_DRIVE` and every guard.** Five places
were fitted to the existing shape and none of them asked for an amendment.

⚠️ **Level one and level two.** The three open questions on them are untouched, deliberately — the
brief asks for baselines to tune *against*, and changing the reference in the same session would make
every later verdict unattributable. That is [0109](0109-a-death-is-a-drum.md)'s own argument.

⚠️ **The bosses, the levels, the sky and the difficulty tables.** A theme changes a backdrop, a cloud
colour, a mix, a set of voices and a room. It has never been able to change anything else and still
cannot.

## ⚠️ What is owed

**A listen, per place, at `npm run dash`.** Every number in the report is a model quantity —
[0027](0027-measure-the-picture-not-the-model.md) — and *jurassic eurobeat* is a claim about a
picture. Five places have been measured and **none has been heard**.

**And the arc guard is named for `nebula` only.** `tests/themes.test.ts`'s *up, up, up, drop, sharp
down* is written against one place because the other six were unwritten when
[0136](0136-the-place-has-a-room-and-an-arc.md) landed. Five of them now have an arc and none of them
is held to one. Whether they should be is a question for the round after the listen — the arcs differ
on purpose, and a guard written before anybody has heard them would be fitting a bound to a guess.
