# 0345 — Ember Nebula is in colour

**Accepted 2026-09-21.** Item 2 of
[`the-places-are-painted`](../../reports/the-places-are-painted-2026-09-21.md). **Amends
[0223](0223-a-place-has-a-palette.md)** — a place had a body and an accent; it may now state further
gases, and the contrast floor counts the loudest of all of them. **Amends
[0112](0112-the-sky-has-weather.md)** — the ceiling on how solid a cloud may be is a place's to state,
under the shared bound that was always the actual rule. **Retires the random walk
[0207](0207-the-eagle-has-lanes.md) introduced**: nothing calls it.
**Builds on [0343](0343-the-stars-are-drawn-for-a-desk.md)** — its star row, its seam guard, and its
rule that an item is the whole place.

## The ask

> *"Ember Nebula — the nebula background is decent now, but it needs to be a more vibrant beautiful
> backdrop."*

## What the player sees differently

Gas in five colours at once — magenta, violet, ember, a red heat and one cold thread — brighter at its
cores, with warm stars showing through the thin parts; dust that flows across it in soft-edged ribbons
instead of lying on it in slabs; and the Pillars with a rounded edge.

## What the 1080p photograph found that the report did not name

An item is the whole place. Shot at the screen the sky is authored for, four things were wrong that
*"more vibrant"* does not mention, and two of them were making the gas look worse than it was:

| what | what it was | what it is |
|---|---|---|
| the three dust lanes | `crossing` random walks in **eight straight segments**, 10–22 units thick at one flat alpha: angular slabs, and between them they darkened most of the lane — a large part of why the gas read as mud | ribbons that swell and pinch, drawn three times so the edge is soft, and narrower: dust in front of light has to leave most of it showing |
| the nine filaments | the same walk at fourteen segments: zigzags | slow curves |
| the globules | nine-sided flat stickers | the same shapes three times about their centres, so a knot of dust has a soft edge too |
| the stars | the shared field: grey coins, 9.5 CSS px median | its own row — 315 warm points at a median of 1.1 px, five colours, no band |
| the Pillars | eight straight segments a side; the rim, the brightest line on them, zigzagged | each knob is the control point of a quadratic — the edge still goes where the seed put it and has no corner |

Every curve is a **sum of sines whose periods divide the tile**: periodic in height *and* slope, which
a walk forced home in its last segment never was. That is the third place to leave `crossing` for the
same reason (The Labyrinth in 0220, The Approach's rifts in 0343), so it is deleted.

## The rules

**A place may state further gases.** `ThemeRow.gases`, per palette, optional
([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)): absent, and a place has the
body and accent it always had, cloud for cloud. Of every three clouds one is the accent, one stays the
body, and the third takes the next gas **in turn** — walked rather than rolled, on 0223's own argument,
so every stated gas is on screen and the body keeps the largest single share.

**Vivid is saturation, not light.** What the floor counts is luminance. Ember Nebula's four gases are
as saturated as they go and **none is brighter than the ember**, so the loudest colour the place
states is still `glow` and the colour is bought with hue. The floor's `loudest` — in
`tests/sky.test.ts` and in `scripts/weigh-sky.mjs` — now takes every colour a place states, because a
third colour the floor has never heard of is the hole 0223 closed for the second.

**A place may state its own cloud ceiling.** `SkyStyle.cloudCeiling`. The shared rule was never 0.22:
it is *fainter than the faintest field of marks*, which `tests/budget.test.ts` holds and still holds.
0.22 sat inside that for all seven because one constant had to suit the thinnest sky and the thickest.
Ember Nebula states 0.31, and carries half as many clouds again.

## What it cost, measured

`scripts/weigh-sky.mjs`, vivid, worst ink against the backdrop with everything the sky draws on it:

| | cover | worst ink | ratio | room over the floor of 3 |
|---|---|---|---|---|
| before | 0.414 | `void` | 4.52 | 1.51× |
| after | 0.528 | `void` | **3.80** | **1.27×** |

⚠️ **That is a real spend and it is the place's to make** — the plan said this collision would be
settled in the PR *"never by a quietly dimmer picture"*, and there was room. It leaves Ember Nebula
with more headroom than Rime Shelf (1.09×) or The Labyrinth (1.12×) have today. The measure is also
conservative by construction: it blends the whole pile in the loudest colour, and four clouds in five
here are darker than that.

## A defect 0343's guard caught in this decision's first draft

Ember Nebula **clumps** its stars, and a pull towards a knot followed by a clamp drags every mark off
the tile's two edges: *"nebula's back layer leaves a bare strip 17.7 units wide at every tile join."*
Along the scroll axis an authored field now clumps **round** the tile — pulled the short way to the
nearest copy of its knot, and wrapped — so a drift can straddle the join like anything else in a sky
that tiles. The guard was written for a margin and caught a clamp, which is the argument for stating
one in lane units rather than as a property of the code that was wrong last time.

## The guards, and that each was seen to fail

`tests/gases.test.ts`:

| guard | kind | the break |
|---|---|---|
| every stated gas is on screen, and the body is still the most of it | the report | no cloud given a gas |
| both palettes state the same number | invariant — an index into nothing | one palette cut to two |
| no gases stated, none drawn | invariant — 0282's default | the fallback made four |
| Ember Nebula's dust has no corner | **this place's**, per [0295](0295-a-ranking-guard-is-a-content-limiter.md) — masonry may have corners | the curves sampled five times a tile |

And two older guards proven to cover the new fields: the contrast floor reddens on a gas brighter than
the ember, and 0112's budget reddens on a ceiling stated at 0.6.

⚠️ **The corner guard caught its own subject**: the busiest filament turned **13.4°** at one vertex
against a bound of 12 written first. The sampling doubled; the bound did not move.

⚠️ **Three probes elsewhere were stranded and are re-pointed**, each saying why: 0211's seam break
edited a line inside `crossing`, which nothing calls — left alone it would have come back STILL GREEN
for ever, so it now breaks a lane's period instead; 0196's third-stop break had been carrying the line
*above* the one it breaks and has been stranded by it twice, so it carries only the stop now; 0343's
budget break anchored on `lean: 5`, which a second place now also says.

⚠️ **AND A FOURTH WAS RED FOR THE WRONG REASON, WITH THE PROOF AT EXIT 0.** 0211's *two places given
the same structure* had a replacement that **called** `crossing`. With the function gone the break was
a `ReferenceError`, the guard's test failed by crashing, and the harness counted a failure carrying the
guard's title as the guard firing. **Nothing caught it; it was read in the log.** It takes Ember
Nebula's marks from that place's own row now and reddens on the assertion. Six other probes on `main`
are red the same way — 0053 twice, 0072, 0111, 0135, 0230 — which is a defect in what the harness
accepts as a verdict, not in this decision, and is handed on as its own task rather than fixed here.

## What is owed

**An eye, in motion.** Whether five hues drifting at the weather's rate read as a nebula or as a
gradient; whether the dust is now too faint to read as being *in front*.

⚠️ **The stars are in front of the Pillars, and they always were.** A landmark is painted before the
star fields (`src/render/scene.ts` — slower is further), so points of light cross the dark columns.
With grey discs that read as dust; with stars it may read as wrong, and only motion can say. The fix is
a draw-order decision — landmark after the two dot layers — and the argument against it is that a
thing in front moving slower than the thing behind is a parallax inversion. **Not decided here**; it
is 0343's open landmark question arriving in the place that already has one.

**Orange raiders on ember gas** is [0228](0228-an-enemy-wears-its-place.md)'s choice and is unchanged;
the brighter cores make it the first thing to look at in the preview
([0295](0295-a-ranking-guard-is-a-content-limiter.md): *consider what else shares the screen*).

No rollback note: no storage key, save schema, cache prefix or origin is touched.
