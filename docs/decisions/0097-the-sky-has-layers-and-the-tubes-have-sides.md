# 0097 — The sky has layers again, and the tubes have sides

**Accepted 2026-08-10.** Items 5 and 6 of
[the-fifth-play-test](../../reports/the-fifth-play-test-2026-08-10.md).

**Fourth pass over the sky; third over where a missile comes from.** Both previous answers were
right about the report in front of them and both are being partly reversed, which is why this is one
decision rather than two constant edits.

## The rules

**The sky is three layers, and the fastest one is drawn as streaks rather than dots.** A layer may go
past two thirds of the world's rate only if it is the streak layer, and every layer is still strictly
below 1.

**A missile launcher is a side of the hull and never the centreline.** The first tube is
`across`-minus — the top of the screen — and the second is `across`-plus.

## What was asked for

> *"Background starfield has lost it's multiple layers, there's only one starfield background and the
> background or the screen moves too slow, the pace of the level itself is fine but it feels like a
> crawl because of the background visual moving soooo slowly."*

> *"The missiles now fire from the center of the ship and it looks like only one missile. First tube
> should fire from the top side of the ship — yes it will look off balance, that's the point when you
> only have one. Second tube should fire from the bottom side of the ship — it will now look properly
> balanced."*

## The sky: both halves of the report are one cause, and it is 0088's success

⚠️ **The near layer did not get slower. It went out.**
[0088](0088-the-near-sky-goes-back-and-the-whole-sky-goes-faster.md) answered *still distracting* by
cutting it to 0.2 world units at 0.18 of solid — **2.0% of the far layer's ink** — which on an
ordinary screen is a dot about a pixel and a half across at a fifth of solid. The layer is still
being baked, still being blitted and still costing four megabytes; it is not on the screen.

⚠️ **So the fastest thing the player can SEE moves at 0.24**, which is about eight world units a
second and **twenty seconds to cross a 16:9 view**. That is the crawl, measured, and it explains the
other half of the same sentence: a sky with one visible layer has no parallax in it at all.

⚠️ **Multiplying the two depths a fourth time would answer a report about the wrong quantity.**
[0078](0078-the-sky-moves-a-third-faster.md) took *a third faster* and 0088 took *half as much again*
on top, and both are still in the code, untouched by this decision —
[0027](0027-measure-the-picture-not-the-model.md)'s question is *what did the previous fix leave
standing*, and what it left standing is a layer nobody can see.

## A streak breaks the trade every previous pass ran into

⚠️ **The wall all four passes hit is the same one.** A DOT that moves fast competes with a bullet
([0069](0069-the-sky-is-behind-the-game.md)), so every increase in speed had to be paid for with
alpha and with size — and after three payments there was nothing left to pay with.

⚠️ **A line is not a dot.** It says *fast* by its shape rather than by its rate; it cannot be
mistaken for a round thing that kills you, which is
[0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md)'s rule arriving in the
one place it had not; and it is what every game that has ever wanted to look quick draws. At 0.109
world units it is **a fifth of the smallest bullet's thickness** and the thinnest mark in the game.

⚠️ **`lineCap: 'round'` means the two forms are one mark at two lengths.** A streak's ends are the
dot it would otherwise have been, so the sky cannot read as two pieces of art, and `len: 0`
degenerates to exactly the arc `drawSky` drew before.

⚠️ **Drawn along the tile's own `+x`, which is the scroll axis on both orientations** — `bakeOne`
turns the whole atlas a quarter turn for the portrait view. Getting this wrong would draw the streaks
across the lane on a device the developer is not holding, which is the failure mode
`src/render/surface.ts` already records for the same axis.

## The three layers

| | depth | alpha | mark | thickness | count | ink, vs the bed |
|---|---|---|---|---|---|---|
| `skyFar` | 0.24 | 1 | dot | ≤ 0.59 u | 90 | — |
| `skyNear` | 0.6 | **0.34** | dot | ≤ **0.28** u | 90 | **8.4%** |
| `skyRush` | **0.85** | **0.42** | **streak, 6–13 u** | ≤ **0.11** u | **15** | **17.7%** |

⚠️ **`skyNear` comes back up for the first time**, from 0.18/0.2 to 0.34/0.28. What made it
distracting was that it was the nearest thing on the screen with nothing in front of it; there is
something in front of it now, so it is a middle distance. It is still under a third of a pulse.

⚠️ **`skyRush` crosses a 16:9 view in under six seconds** where the far layer takes twenty. That is
the number the report is about.

⚠️ **A streak's whole length sits inside the tile margin.** The margin exists so nothing is cut by a
seam (0065); a mark with extent has to fit, and one running off the right edge would be a hard-cut
line arriving at the same place every three seconds at the fastest depth in the game.

## What it costs, named rather than discovered

⚠️ **A third bitmap `ACROSS_SPAN` units square — about four megabytes at `bakeOne`'s resolution
ceiling**, on top of the eight the other two already spend. It is the largest single cost in this
decision and there is no cheaper form of it: a tile has to be as tall as the lane, and `bakeOne`
bakes squares.

⚠️ **Four more blits a frame.** `tests/budget.test.ts` scales its own bound off `SKY.length`, and the
sky's cost is still fixed with respect to the camera, which is the property that guard exists for.

## The guards changed shape, because a one-sided bound is what produced this report

⚠️ **`tests/budget.test.ts` held ONE number over three levers — the near layer's ink under a
twenty-fifth of the far layer's — and 0088 calibrated it so that *the alpha put back* would fail.**
That is a guard that also refuses *the layer is visible at all*: the two are the same edit at
different sizes. Three passes of *push it back* each passed, and the fourth report was *"there's only
one starfield background."*

**So there are five bounds where there was one, and each is held where a break of it shows:**

| lever | what holds it |
|---|---|
| thickness | the nearer a layer is, the thinner its marks are — on the MEAN, back to front |
| shape | the shortest streak is over twenty times its own drawn width |
| alpha | the back layer is the only one drawn solid; everything in front is under half |
| count and size, upward | each front layer is under **a quarter** of the bed's ink |
| count and size, **downward** | each front layer is over **a sixteenth** of the bed's ink |

⚠️ **THE FLOOR IS THE ONE THIS FILE HAS NEVER HAD, and it is the whole lesson.** A layer can be
dimmed out of existence with every guard in the repository green, because every guard pushed the same
way. It is the first bound in this project written in the direction a report pointed *away* from.

⚠️ **Both bounds are chosen from what they must catch**, on 0088's own principle — a bound sits on
the near side of the smallest break it must catch and nowhere else.

| | ink, as a share of the bed |
|---|---|
| the streak layer at ninety marks instead of fifteen | 88% |
| the near layer's dots back at the far layer's size — 0080's break | 38.6% |
| the near layer's dots back at 0.55 units — 0088's break | 32.5% |
| **the ceiling** | **25%** |
| `skyRush` now | 17.7% |
| `skyNear` now | 8.4% |
| **the floor** | **6.25%** |
| the near layer's alpha alone put back to 0.18 | 4.5% |
| its size alone put back to 0.2 units | 4.3% |
| both, which is the build the report is about | 2.0% |

⚠️ **The floor was a thirty-second for one commit and `npm run prove` reported STILL GREEN**, which is
0088's own history repeating at the other end of the scale. It had been chosen against the reported
build — both levers together, 2.0% — and the smallest thing it has to catch is **one** lever, at
4.5%. A bound above a single-lever break is a rule a single edit can break with the suite green.

⚠️ **And the thickness ladder read a MAXIMUM, which the same run reported as WRONG TEST.** A maximum
over fifteen streaks sits further below its own ceiling than a maximum over ninety dots, so the streak
layer could be given the middle layer's ceiling outright and still measure thinner. It reads the mean
now — the same statement without the sampling bias, still off what will be drawn rather than off the
constant.

⚠️ **The near layer is at 1.34× its floor**, which is tighter than this repository usually writes over
a number a hand chose. That is deliberate: the guard's subject is *this layer is on the screen*, and
if a later play-test says it is too loud again, that is a decision moving the bound with an argument
rather than a constant sliding under a green suite.

⚠️ **The streak layer is deliberately the closest thing to its ceiling**, at seven tenths of it. That
is the budget the fast layer was given rather than an accident: a hairline nobody can see is 0088's
mistake and this report is about it.

## The tubes: the off-balance single is the ask

⚠️ **[0077](0077-a-pickup-arrives-rather-than-stopping.md) chose the centreline deliberately** and
its reasoning was sound for the question it was asked: the cap had come down from three positions to
two, and *centre, minus, plus* would have left a fully-upgraded ship firing off-centre. What it did
not consider is what a one-tube ship then looks like.

⚠️ **A missile down the centreline is the same silhouette as the pulse stream that never stops**, so
the second auto-weapon arrived invisible — *"it looks like only one missile"* is a report about the
missile not reading as a missile. One hung off the top of the hull cannot be mistaken for anything
else.

⚠️ **The ladder now reads as *off balance, then balanced* rather than *one, then two***, which is a
larger change in the picture than the one 0077 was defending, and it is the ask's own argument.

⚠️ **0077's claim survives word for word.** *A fully-upgraded ship is symmetric* is still true and is
still what `tests/missiles.test.ts` holds; its probe was re-anchored rather than retired, because the
thing it breaks — the old ordering — is still a break.

⚠️ **`across`-minus is the TOP on both orientations, and that is `src/render/surface.ts` rather than
an assumption.** In landscape `screenY` counts `across` downward from the top edge; in portrait the
whole atlas is baked a quarter turn round. The player's words are *top* and *bottom*; the code's are
minus and plus, and the test asserts the code's because a test cannot see a screen.

⚠️ **The `side !== 0` guard around the pop is gone with the centre launcher.** A condition kept for a
case the union no longer has is a branch nothing can reach.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0097-sky-layers-and-tube-sides.mjs`.

| broken on purpose | went red |
|---|---|
| the streak layer taken back out, so the sky is two layers of dots again | `is still behind the game, which is the ceiling 0065 set` |
| the streaks drawn as dots, so the fastest layer is a field of moving specks | `0097 — and a streak stays a streak, because a short one is a fast dot` |
| the near layer dimmed back to what 0088 shipped, which is half of the build reported | `and the near layer is the quiet one, on every count that buys attention` |
| the streak layer fattened past the middle layer's thickness | `0097 — AND THE NEARER A LAYER IS, THE THINNER ITS MARKS ARE` |
| the single tube put back on the centreline | `0097 — puts the first tube on the across-minus side and the second on the across-plus side` |

⚠️ **The third one is a break of a FLOOR, which is what makes it this decision's rather than a re-run
of somebody else's.** Every other sky guard in the repository is green over it.

⚠️ **TWO OF THE FIVE FAILED ON THEIR FIRST RUN AND BOTH FAILURES WERE THE GUARD'S**, not the break's
— which is [0019](0019-a-probe-must-be-seen-to-apply.md) earning itself inside the decision that
declared it. One reported STILL GREEN because the floor had been calibrated against a two-lever
break; one reported WRONG TEST because a strict inequality was being read off a maximum over
different sample counts. Both bounds above are the second version, and the first version of each
would have shipped looking exactly as convincing.

## One probe was retired and two were re-anchored

⚠️ **0088's alpha probe is DELETED rather than re-anchored**, and the reason is worth as much as the
four that were kept. Its break was *the near layer's alpha returned to 0.4*; this decision ships
0.34, so the break is now a sixth of a step from the shipped value and cannot go red against any rule
that survives. What survives of 0088's alpha claim is *the near layer is a veil and not a bed*, and
the probe for that is `scripts/probes/0069-sky.mjs`'s, which takes it to solid. **A probe kept for a
superseded value reports STILL GREEN for ever**, which is
[0019](0019-a-probe-must-be-seen-to-apply.md)'s own failure mode wearing a green tick.

⚠️ **0069's, 0080's and 0088's remaining sky probes were re-anchored** for the two constants that
gained a third key, and 0077's for the expression that lost its centre case. `anchorFailures` reported
all six in a second, which is what
[0079](0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md) built it for.

## What this does not settle

**Whether a still frame can judge any of it.** It cannot, for the third decision running: half of what
is being asked for is motion and `scripts/shot.mjs` renders one frame. This is
[0027](0027-measure-the-picture-not-the-model.md)'s class of change and its instrument still cannot
see it.

**Whether the near layer is now too loud again.** It has been moved in one direction three times and
the other once, all by eye, and 0.34 is a hand's number. What is guarded is the ladder around it.

**Whether 0.85 is far enough.** The streak layer is the first thing in the sky that has never been
flown at all, and the depth ceiling above it is now 1 rather than 2/3 — so if *still too slow* comes
back, there is one notch left and then the answer is the camera rather than the sky.

## Rollback

**None.** No storage key, no save field, no service-worker cache prefix, no origin — one new sprite
kind, three constants and one expression. [0001](0001-revertability-not-risk-rating.md).
