# 0343 — The stars are drawn for a desk

**Accepted 2026-09-21.** Item 1 of
[`the-places-are-painted`](../../reports/the-places-are-painted-2026-09-21.md). **Applies
[0153](0153-desktop-is-the-target.md)** to the one layer that had never been looked at on the screen
it names. **Builds on [0195](0195-a-place-has-its-own-sky.md)** — a place's sky is a row — and on
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md), which is why the row is
optional and only one place states it. **Amends nothing in
[0069](0069-the-sky-is-behind-the-game.md), [0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)
or [0112](0112-the-sky-has-weather.md)**, and says below why none of them had to move.

## The ask

> *"The Approach — I want a starfield optimised for desktop, it looks passable on mobile, but drawn
> out, big, chunky and just monocoloured on desktop."*

## What the player sees differently

A deep field of pin-sharp stars in six colours and many brightnesses, a few bright enough to carry a
soft halo, with a faint band of far light behind them — where there were evenly grey discs.

## What it was, measured

`scripts/weigh-stars.mjs` is new and is the instrument: every place's two dot layers, in **CSS pixels
of a 1920×1080 screen**, which no sky guard had ever been stated in. Before this change every row of
it read like these:

| place | layer | marks | median | biggest | colours |
|---|---|---|---|---|---|
| Rime Shelf | `skyFar` | 108 | 10.7 px | 12.9 px | 1 |
| Saurian Belt | `skyFar` | 68 | 9.9 px | 12.9 px | 1 |
| The Toxic Mire | `skyFar` | 153 | 5.4 px | 7.1 px | 1 |

Two causes, both in `fieldOf`. A radius was drawn from **the top half** of the layer's range, so there
was no small star in any field; and a radius is a world unit baked at up to ten pixels each, so the
ceiling that reads as a dot on a phone is a thirteen-pixel coin on a monitor. And every mark was filled
in the palette's one `sky` ink, `#2a2c44`.

## The rules

**A place may author its stars, and The Approach does.** `SkyStyle.stars` is optional: how many the
two dot layers carry, how hard the sizes lean small, the floor, the colours and their weights, and a
band. **Absent is the shared field, mark for mark** — six places are unchanged by this decision, which
a guard holds, and each gets its own row when its item in the queue arrives rather than inheriting
this one.

**Nearly every star is a pinpoint and a handful are not.** A uniform draw raised to `lean` piles the
field against its floor. The Approach carries 810 marks in its back layer at a median of **0.9 CSS
pixels**, against 90 at 10.

**No tinted star has a hard edge wider than a point, whatever its radius.** The core is capped in
world units (`STAR_CORE_UNITS`) and the rest of the radius is light falling linearly to nothing. The
first draft gave a halo only to the brightest few and the 1080p photograph showed everything in
between as an eight-pixel coin — the reported picture, in colour. *What makes a mark confusable with a
threat is a hard edge at a bullet's scale* is 0112's sentence, and a bright star now has no such edge
at any scale.

**The streaks are not touched.** `skyRush` is a speed cue with a run of decisions behind its thickness and
length (0097, 0101, 0103, 0106); a place's stars are the two dot layers' business.

**A palette whose decoration is the void gets the old ink and no light** —
[0024](0024-the-accessibility-floor-is-settings.md), on the test `foeOf` already uses.

## The limb is gone, and the band is what the place is made of

> *"Fix the grey up the bottom as well, it's going to look weird and out of place — same for the other
> levels, if there's an aspect that's not going to be good quality that I haven't mentioned, make sure
> it's picked up and updated to be good quality or removed if it doesn't fit."*

**That second sentence is a rule for the whole queue and the report now carries it**: an item is the
whole place, not the parts of it that were named.

0211 drew The Approach's one structure as *"a limb of the world behind you"*: a cosine arc in one flat
fill. Looked at properly it was worse than flat — the arc is **highest at the tile's two edges**, so
every join is a cusp, and what crossed the screen was a grey hill with a point on it. **It could not be
made good as a tile, so it is not one**: a planet's edge is one curve seen once, and a repeating tile
can only draw it as a row of humps. The seam guard could not see it — it holds the *heights* a crossing
mark leaves and arrives at, and a cusp agrees about height and disagrees about slope.

**No guard is added for slope, and this is why**: Ember Nebula's lanes and filaments are `crossing`
random walks that are forced home in their last segment, so every one of them kinks at the join by
construction, and at their widths nobody has ever seen it. A slope guard would redden content that is
fine in order to catch a defect that needs a wide, bright, lone mark to show — which is a thing a
photograph catches and a threshold does not ([0295](0295-a-ranking-guard-is-a-content-limiter.md)).

What replaces it is the thing the stars are already gathered along: **a band of far light**, eight
filled ribbons about one centreline, each narrower than the last and each nearly nothing, so the sum
rises to the middle with no edge anywhere; and two dark rifts of dust in front of it. All of it is sums
of sines whose periods divide the tile — periodic in height **and slope**. The first rifts were
`crossing` marks and the photograph showed zigzags with a kink mid-screen; they are curves now.

⚠️ **A world to leave is still a good idea and it is a LANDMARK, not a tile** — one object, placed once.
It is not built here because a landmark is painted *before* the star fields (`src/render/scene.ts`:
slower is further), so a solid planet would have stars shining through it, which is
[0221](0221-a-planet-is-not-a-space.md)'s defect exactly. An opaque landmark needs a decision about
draw order first. Recorded in the report as a candidate, not owed.

## Why no older guard moved

The plan expected two collisions and found neither, and the reasons are worth more than the relief:

| the guard | why it stayed green |
|---|---|
| 0106 — a layer's thickest mark is over 2.5 CSS pixels | it holds the **thickest** mark, and the hero stars keep the old ceiling as the extent of their light |
| the `ink` shares — a moving layer against the bed | `tests/budget.test.ts` measures **the place that paints the most**, which The Approach no longer is. ⚠️ So those shares say nothing about this place's own layers against each other, and never claimed to: they are ceilings over the worst sky in the game |
| 0069 — no star as big as a bullet | smaller was always the permitted direction |

One guard did redden and was wrong to: `tests/sky.test.ts`'s two-stop scan sliced from `drawNebula` to
`bakeOne`, which took in the star painter. Its claim is about the cloud painter; it ends there now.
[0192](0192-a-guard-holds-an-invariant.md): *a guard whose anchor is more specific than its claim
reddens on edits that are correct* — here, less specific.

## The one thing that was genuinely unguarded

**`skyCover` has never counted a star**, because every star was darker than anything a player has to
find. A tinted star is not. `starLight` says how much of a tile a place's stars light, on the same
falloff arithmetic `cloudCover` rests on, and the budget is `skyCover`'s own `share`: it reports the
brightest level at least half a percent of the tile reaches, so star light under that share cannot
change its answer. The Approach reads **0.164% + 0.007%**. Past the share, the contrast guards would
be measuring a sky that is not the one drawn — and the number to move then is `skyCover`'s default,
which owns it.

## The guards, and that each was seen to fail

`tests/stars.test.ts`, read off what the painter actually filled through `tests/paths.ts`, at 1080p:

| guard | kind | the break, and what it said |
|---|---|---|
| no hard edge wider than a point | the report, in pixels | core cap lifted → *12.8 CSS pixels across*, which is the reported picture to the decimal |
| the stars come in colours | the report | painter ignores the tint → *1 colour(s)* |
| high contrast gets the sky ink | invariant — 0024 | `plain` forced false → seven colours on that palette |
| star light stays under `skyCover`'s share | budget — owned by `skyCover` | the field made fat → *2.204% of a tile* |
| no bare stripe where the tile joins | invariant, in lane units | the shared margin back → *a bare strip 12.1 units wide at every tile join*. Ninety marks never showed it; eight hundred would, crossing the screen on a schedule. An authored field keeps only the margin a dot needs |
| no row, no tint | invariant — 0282's default | the fallback tinted → *nebula draws 45 tinted marks* |

⚠️ **The pixel guard caught this decision's own first draft**: a hero star's core was 3.6 pixels
against a bound of 3 written before it was measured. The core came down; the bound did not move.

## What the proof found that was not this decision's

`npm run prove`'s baseline went red **twice in three runs** across 0342 and this, on the same test
both times — `tests/accents.test.ts`, *every solid mark on a body is inside its hull* — with no
assertion message, while every `npm run check` passed it. The first was put down to load, because a
photograph was being taken beside it; the second happened on an idle machine, so that was wrong.
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md): a rerun is not evidence.

Measured: **26.7 s alone, 113.9 s in a clean whole-suite run**, on the config's default 180 s —
1.6× where [0245](0245-a-budget-is-sized-under-load.md)'s rule is 3×. It had no budget of its own, and
the default was sized from the slowest budget-less test of its day at about 53 s; this one has grown
since the bodies were drawn in curves. It has 345 s now, with the measurement beside it. Nothing about
the stars bears on it — it costs the same in the tree without them.

## What is owed

**An eye, in motion, on the preview.** A photograph cannot say whether 810 points at the far layer's
rate shimmer as they cross pixel boundaries, or whether the tile's repeat can be read: the tile is a
hundred units and a 16:9 screen shows about a hundred and seventy-eight, so the same field is on
screen nearly twice at once, and nine times the marks may make that easier to see rather than harder.
Both are questions for the player's monitor, and a wider tile is the lever if the second one bites. **The band is faint on purpose and may be too faint**; it is one number on the row.

**The speed streaks are left exactly as they are, and that is a decision rather than an oversight.** In
a still they read as faint scratches; they are the one layer in this sky with a run of the player's own
reports behind it (*"thin lines that are hardly visible… I don't feel like I'm zooming"*), and a
photograph is the wrong instrument for a mark whose whole job is to be seen moving. If they look wrong
beside the new field in motion, that is a report and gets its own pass.

`scripts/shot-place.mjs` takes `--view=1920x1080` now, because every shot this queue is judged on
should be the size of the screen the sky is authored for.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
