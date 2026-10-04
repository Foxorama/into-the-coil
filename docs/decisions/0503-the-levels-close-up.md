# 0503 — The levels close up

**Accepted 2026-10-04.** Answers what [0500](0500-the-desk-has-a-bar.md)'s bar did to the levels.
**Keeps [0502](0502-the-window-is-the-fight.md)**: every window is still twenty-five seconds and still
empty, and the back of a level still ramps to its boss. **Keeps [0043](0043-a-weapon-is-a-budget-and-a-level-opens-empty.md)**:
nothing before 300. **Amends [0443](0443-the-arc-is-zoomed-with-the-view.md)**: the arc's first jump is
90. **Amends [0246](0246-a-seeker-hunts-on-the-screen.md)**: the seeker's fuse is 99, and what it said
the fuse reached was never true. **Amends [0259](0259-the-bullets-stay-on-the-screen.md)'s dry
budget**: it is walked at three sweeps and held on the middle one. **Re-solves**
[0269](0269-a-mid-boss-is-fought-for-as-long-as-its-level-says.md)'s sentinel.

## The ask

> *"actually with the screen space resizing and layout resizing we did, the levels now feel long and
> empty again. do we need to shorten the levels slightly to compact things? and extend the lightning
> gun's reach and the homing missiles distance as we've made the desktop distance larger?"*

## What was true

- **0500 let a desktop see further.** A maximised 1920×1080 window plays at 1920×950 and sees 263
  units ahead where it saw 241; a 1280×720 window sees 238 where it saw 213. That is about a tenth more
  of the level on the screen at once, and every gap the levels author was written for the screen
  before it.
- **A level is authored in three kinds of length, and only one of them is a screen's.** The gaps between
  waves are the script. The opening's 300 is past `MAX_ALONG_SPAN`, the widest screen any device has
  (0043). A mid-boss's window is twenty-five seconds (0502), and the 190 between the last wave and the
  boss is `FIGHT_LEAD`'s measure (0472). Seconds and a screen's width do not shrink with a screen.
- **The Black Heart's length is its music's.** Its four sections are four movements on bars 16, 36 and
  72 (0331), the third a ballad of thirty-six bars through-composed and *turned* in
  `src/content/core.ts` so its first bar lands on bar 36 of the level. Every one of them was asked for
  in seconds across 0331's listens.
- **The arc's first jump and the seeker's fuse are world distances**, so a screen that shows more world
  draws both smaller. 0443 made the same correction for 0364's zoom.
- **0246 said ninety steps carried a seeker to "the far edge of the widest screen from the ship".** At
  the seeker's 1.4 a step that is 126 units, which from the ship's place forty into the view ends at
  166 — where the bosses stand, 154 to 190 from the camera — and short of even a 16:9 screen's 213.

## The rule

**Every gap a level authors is 1/1.1 of what it was**, from the opening's 300 to the mid-boss and from
the window's end to the last wave, so a screen holds what it held before the bar. **What is not a gap is
not scaled**: the opening, the window and the last wave's 190 before the boss. So a level is about 6%
shorter rather than 9%, and every stretch that is authored is a tenth denser.

As a map, per level, with the mid-boss at `M` and its window ending at `W = M + 900`:

| from | to |
|---|---|
| up to 300 | unchanged |
| 300 to `M` | `300 + (x − 300) / 1.1` — so `M` becomes `M′` |
| `M` to `W` | shifted to `M′` to `M′ + 900`: the window keeps its twenty-five seconds |
| past `W` | `M′ + 900 + (x − W) / 1.1` |
| `bossAt` | the last wave's new place plus the 190 it stood short |

Waves, pickups, landmarks and the Labyrinth's passages and turns all go through it, rounded to whole
units, and were pasted into the tables from a scratch generator; nothing multiplies at runtime.

| level | `bossAt`, was → is | seconds | mid-boss | window | first wave after |
|---|---|---|---|---|---|
| The Approach | 4270 → 4008 | 118.6 → 111.3 | 1549 → 1435 | 1435–2335 | 2336 |
| Ember Nebula | 4320 → 4054 | 120.0 → 112.6 | 1599 → 1481 | 1481–2381 | 2382 |
| Saurian Belt | 4270 → 4008 | 118.6 → 111.3 | 1549 → 1435 | 1435–2335 | 2336 |
| The Labyrinth | 4240 → 3988 | 117.8 → 110.8 | 1519 → 1408 | 1408–2308 | 2309 |
| Rime Shelf | 4240 → 3981 | 117.8 → 110.6 | 1519 → 1408 | 1408–2308 | 2309 |
| The Toxic Mire | 4340 → 4072 | 120.6 → 113.1 | 1619 → 1499 | 1499–2399 | 2400 |
| The Black Heart | 4460, unchanged | 123.9 | 1044 | 1044–1944 | 1945 |

The tube each level offers a fifth of the way in moved with its level (864 → 813 and the like). The
Approach's second tube is still *"halfway between miniboss and level boss"*: the midpoint of 1435 and
4008, 2722.

### The music's sections, back on a bar

Every boundary went through the same map and was put back on the nearest bar of scroll — 57.6 units, a
bar at 36 a second — **a unit short of it**, so the rung has turned before the downbeat (0117). The
Approach's `surge` was the one boundary on a bar, 44 bars exactly (0131); it is 42 bars exactly now.

| levels | `push` | `surge` | `approach` |
|---|---|---|---|
| The Approach, Saurian Belt | 1249 → **1151**, bar 20 | 2534 → **2419**, bar 42 | 3627 → **3398**, bar 59 |
| Ember Nebula | 1299 → **1209**, bar 21 | 2584 → **2476**, bar 43 | 3677 → **3455**, bar 60 |
| The Toxic Mire | 1319 → **1209**, bar 21 | 2604 → **2476**, bar 43 | 3697 → **3455**, bar 60 |
| The Labyrinth, Rime Shelf | 1219 → **1151**, bar 20 | 2504 → **2361**, bar 41 | 3597 → **3398**, bar 59 |

The snap moved no boundary more than 24 units off the map, two-thirds of a second. The landmarks tied to
sections went with them: Ember Nebula's middle stand of Pillars is still exactly its organ's `push`, and
the Belt's three volcanoes are still exactly its three boundaries. The first stand of Pillars stays at
−1400: it is not in the script, and where it stands at the opening is a picture.

### The Black Heart is not closed up

Its length is the music's: the lament to bar 16, the same song faster to bar 36, the ballad from 36 to
72, the acceptance from 72 into the fight. A tenth off the level is four bars off that. The cleanest
version found — the second movement sixteen bars rather than twenty, the ballad and the acceptance each
four bars sooner, the ballad re-turned to bar 32 — was built, and it costs three things nobody has
heard:

- **The loudness model reads it as a climb.** `driveAt` measures a place's loops from the level's first
  bar, not from the bar a rung opens on; for the Black Heart's forty-two-bar ballad that is a different
  stretch of the piece once the turn moves, and `tests/themes.test.ts` read `surge` 0.65 LU and
  `approach` 0.49 LU over their contour. Re-solving `LEVEL_HOLD` to that would turn the heard music
  down to answer a number the speakers do not play.
- **The acceptance's heart, an eight-bar loop, would enter four bars into it** on bar 68.
- **Every second 0331's listens named inside the ballad moves 6.4 s sooner.**

So the Black Heart keeps its tables, and the choice is the player's, with the ear.

### The Labyrinth

- **`bossAt` is 3988, not 3981.** The gyre's room opens `stand + mouth` (100) before the boss and must
  land on the corridor's twelve-unit grid (`tests/corridor.test.ts`); it rounds up, so the last wave
  keeps at least `FIGHT_LEAD` — 197 here.
- **The hold for the lattice's fight keeps its length.** It opened 249 before the lattice and closed 581
  after it (0350, 0472), sized to where the hull dies and drops; a fight is seconds, so it is 1159 to
  1989. The last straight is still 500 before the boss, 400 before the room.
- **The turns between are a tenth closer**, a point every 165 units or so where it was 180. The tier's
  slope still only caps them; `tests/corridor.test.ts` is green over all three tiers.

### The reach

- **The arc's first jump is 90**, 82 × 1.1, on 0443's precedent: the bolt the player played, at the
  screen they now play on. The weight is untouched — the ask was the reach — so the chain is
  90 → 54 → 32.4.
- **The seeker's fuse is 99**, 90 × 1.1: 139 units of flight, ending 179 from the camera where it ended
  at 166, about the same share of the screen it had. The note on `fuse` says what it reaches now, which
  is a boss's station and not the screen's edge.

### What else was decided

- **`AURA_BUILD_UNITS` stays 720.** It is twenty seconds of dread before the boss, counted back from
  it, held back to the approach on a report (0107's note); seconds do not shrink with a screen. It
  starts before `approach` opens in every level, as it already did.
- **The quiet before the boss stays 190**, `FIGHT_LEAD`'s measure, for the reason above.

## The figures

Measured with the scratch walk 0502 used — every level through the real frame at Savior, guns on, the
view at 1920×950 — bodies and live enemy bullets on the screen, the mean over the first three tenths of
the level and the last four, then over the whole walk outside the fights:

| level | bodies, front / back, before → after | bullets, front / back | bodies, whole | bullets, whole |
|---|---|---|---|---|
| The Approach | 4.8 / 4.9 → 4.1 / 6.9 | 4.5 / 8.9 → 3.7 / 12.7 | 4.7 → 5.0 | 6.7 → 7.1 |
| Ember Nebula | 5.8 / 7.0 → 5.8 / 6.6 | 7.6 / 11.0 → 5.7 / 13.3 | 6.0 → 6.1 | 8.6 → 8.7 |
| Saurian Belt | 3.9 / 7.7 → 4.8 / 8.9 | 7.6 / 16.9 → 8.6 / 23.9 | 5.4 → 6.5 | 11.4 → 15.1 |
| The Labyrinth | 5.0 / 9.5 → 5.1 / 11.3 | 6.1 / 19.2 → 5.6 / 29.1 | 7.1 → 8.5 | 11.2 → 14.7 |
| Rime Shelf | 3.1 / 4.8 → 4.1 / 7.1 | 9.5 / 16.8 → 12.8 / 22.6 | 4.2 → 5.3 | 14.6 → 17.6 |
| The Toxic Mire | 3.7 / 8.4 → 5.6 / 9.9 | 5.2 / 21.1 → 8.8 / 26.4 | 6.5 → 8.0 | 13.4 → 17.4 |
| The Black Heart | 5.6 / 7.8, unchanged | 8.4 / 19.9, unchanged | 8.3 | 15.4 |

⚠️ **A tenth of a shorter level is a different stretch of it**, so the front and back columns compare
places that moved; the whole-walk columns compare like with like. **The Approach and Ember Nebula rose
least** — their front waves are one-health bodies the guns kill on arrival, so a tenth more of them is
on the screen for the same fraction of a second.

## ⚠️ What it changes that was not asked for

- **The back of all six carries 21–52% more bullets than it did** — the Labyrinth's last four tenths
  19.2 → 29.1. That is the ask's tenth on top of 0502's ramp, and it is the first place to look if a
  level's end reads as too much.
- **The sentinel's fight got shorter and was re-solved**: 15.4 s against the 17 its level asks, with
  the lead's waves a tenth closer to it; `scripts/solve-mid-health.mjs` asked 169, which read 16.5, and
  its second pass, **174**, reads 17.0. **The lattice was left at 101**: 18.1 s against 20, and its
  fight still steps with the walls — 103 reads 18.5, 105 to 109 read 21.6. The other five are within a
  second and a half; `tests/midboss.test.ts` holds three.
- **Ember Nebula and the Toxic Mire now ship identical music scripts**, both on bars 21, 43 and 60, as
  the Approach and the Belt already did and the Labyrinth and Rime Shelf now do.
- **The 0259 walk read the Approach 11.0 s dry** at its one sweep — see the guards below.

## Rejected

- **Scaling everything by 1/1.1, the window included**, then laying the back from the window's end to
  the boss as 0502 did. It meets the ten percent of the length by squeezing the back by 0.85 rather
  than 0.91, so a screen at the back would hold 18% more than before the bar where the ask was what it
  held before. The window is seconds; it was not what grew.
- **A runtime multiplier on `at`.** The tables are the record (0029), and `tests/music.test.ts` asks
  for the numbers pasted back.
- **Closing up the Black Heart by re-turning its ballad**, built and measured above.
- **Holding the dry budget on the worst of the three sweeps.** The Approach's eight-second sweep is the
  phase that fails; worst-of-three keeps a single phase as the verdict, which is the defect.
- **Authoring a lancer back into the Approach's opening to pass the eight-second sweep.** The level is
  not drier: at six, seven, nine and ten seconds it reads 2.0–3.6 s. Changing the work to suit the
  walk's phase is the answer 0192 refuses.

## Guards

**No invariant is added.** *A screen holds what it held before the bar* is a play verdict about one
ratio, as 0364's zoom was, and a test pinning 1.1 would be a number chosen today asserted against
tomorrow. The guards that hold a level's shape — the opening, the windows, the mix, the lanes, the
corridor's grid, the music's spans — are unchanged and green over the new tables.

**Changed**, each with its reason:

- `tests/bullets.test.ts`, *no level goes DRY_BUDGET_SECONDS without a bullet*: walked at sweeps of 7,
  8 and 9 seconds and held on the middle one (`SWEEPS`). The Approach read 11.0 s at the eight-second
  sweep after this change and 2.0, 3.6, 3.3, 3.1 s at six, seven, nine and ten; before it, 2.4 to 7.8
  s across the five. An intermittent guard has found something (0044): a quantity sampled at one
  phase. The budget itself, nine, is untouched. The share of the waves' time with a bullet is still
  read off the eight-second walk.
- `tests/music.test.ts`, *EVERY level says for itself where its sections open, in SECONDS*: the new
  seconds pasted back, which is what its note says a moved boundary is for.
- `tests/dash.test.ts`, *A DRAGGED BOUNDARY IS WHERE THE LADDER TURNS OVER*: 2534 and 3400 → 2419 and
  3200, because 3400 now lies past the Approach's `approach` and is clamped, which is a different claim.

**Probes re-anchored**, each with a note where it lives: 0040's three (its thinning break now takes
five waves, the lancer column at 370 with the four it took, because the first view holds that column
and four thinned left eight — STILL GREEN until then), 0043's trough, 0082's and
0256's three pickups, 0158's and 0203's (now anchored on Ember Nebula's own `bossAt`, because the Mire
opens `push` on the same bar), 0203's Pillars, 0224's and 0347's volcanoes, 0232's moth, 0236's reach,
0246's fuse, 0247's and 0269's sentinel, 0328's swift and 0502's three. **0259's is re-aimed**: the
sower it broke went STILL GREEN on the denser Labyrinth, every firing wave in five levels was tried
alone and none takes the middle sweep past nine, and the sentry and sower at 875 and 980 together
read 10.1 / 11.4 / 13.2 s.

## Confirmed, not assumed

`npm run prove` for every decision whose probes this moved — 0040, 0043, 0082, 0158, 0203, 0224,
0232, 0236, 0246, 0247, 0256, 0259, 0269, 0328, 0347 and 0502 — each exit 0, every probe red where it
says. The ones that bear on this change:

| broken on purpose | went red |
|---|---|
| the shoal's sentry at 875 and sower at 980 made chargers | `THE REPORTED ONE: at the capped loadout, no level goes` — 10.1 / 11.4 / 13.2 s at the three sweeps |
| the Approach's teaching stretch thinned to one body a wave | `keeps enough on screen at once to be a shooter` — 5 in one view at 301 |
| Ember Nebula's five waves from 984 removed | `keeps enough on screen at once to be a shooter` — 5 in one view at 909 |
| the arc's reach at 260 | `THE REACH: the arc stays short of the narrowest view` |
| the seeker's fuse at never | `THE FUSE: a seeker burns out` |
| a wave authored inside the chorus's window, at 2280 | `THE REPORTED ONE: after a mid-boss arrives nothing new is put down for its window` |
| the shoal mother's first wave after the window 39 late | `and the window is the gap: the script resumes when it closes, not later` |
| the sentinel at twice its 174 | `THE REPORTED ONE: a mid-boss fight lasts what its level asks` |

The whole non-browser suite is green on the tree. The table above is other decisions' probes, so
0503 is a `WITHOUT_PROBES` row in `tests/prove-guard.test.ts`, with that reason.

## Owed

- **A play of every level at Savior on the maximised window**, and on the phone, which closes up the
  same in world units: whether a screen now reads as full, and whether the backs read as the ramp or
  as too much.
- **The Black Heart**: closed up with its music moved four bars, or left — the player's call, with
  the listen that would need.
- **The loudness model's window**: `driveAt` measures loops from the level's first bar, which is right
  for every four-bar loop and wrong for the Black Heart's forty-two-bar ballad.
- **The lattice's fight**, 18.1 s against 20.
- **`docs/state-of-play.md`**, once this lands.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content tables, two numbers on two
rows, one health and a test's walk; nothing persisted.
